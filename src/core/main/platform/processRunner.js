const fs = require('node:fs/promises')
const nodePath = require('node:path')
const { spawn } = require('node:child_process')

const defaultMaximumOutputBytes = 8 * 1024 * 1024
const killGraceMs = 1500
const windowsShimExtensions = ['.cmd', '.bat']
const scriptExtensions = ['.js', '.cjs', '.mjs']
const shimTargetPattern = /"%(?:~)?dp0%?\\([^"]+?)"/gi
const cmdMetaCharacters = /([()\][%!^"`<>&|;, *?])/g

const escapeForCmdArgument = (argument) => {
  const quoted = `"${String(argument).replace(/(\\*)"/g, '$1$1\\"').replace(/(\\*)$/, '$1$1')}"`
  return quoted.replace(cmdMetaCharacters, '^$1')
}

const escapeForCmdCommand = (command) => String(command).replace(cmdMetaCharacters, '^$1')

class ProcessRunner {
  constructor({
    platformPaths,
    spawnImplementation = spawn,
    readTextFile = (filePath) => fs.readFile(filePath, 'utf-8'),
    fileExists = async (filePath) => fs.stat(filePath).then((stats) => stats.isFile()).catch(() => false),
    findNode = async () => null,
    electronExecutablePath = process.execPath
  }) {
    this.platformPaths = platformPaths
    this.spawnImplementation = spawnImplementation
    this.readTextFile = readTextFile
    this.fileExists = fileExists
    this.findNode = findNode
    this.electronExecutablePath = electronExecutablePath
  }

  async resolveWindowsShim(command) {
    const shimDirectory = nodePath.win32.dirname(command)
    let content
    try {
      content = await this.readTextFile(command)
    } catch {
      return null
    }

    const targets = [...content.matchAll(shimTargetPattern)].map((match) => nodePath.win32.join(shimDirectory, match[1]))
    const executableTarget = targets.find((target) => /\.exe$/i.test(target))
    if (executableTarget && await this.fileExists(executableTarget)) {
      return { file: executableTarget, prefixArgs: [], extraEnvironment: {} }
    }

    const scriptTarget = targets.find((target) => scriptExtensions.includes(nodePath.win32.extname(target).toLowerCase()) || !nodePath.win32.extname(target))
    if (!scriptTarget || !(await this.fileExists(scriptTarget))) {
      return null
    }

    const localNode = nodePath.win32.join(shimDirectory, 'node.exe')
    if (await this.fileExists(localNode)) {
      return { file: localNode, prefixArgs: [scriptTarget], extraEnvironment: {} }
    }
    const pathNode = await this.findNode()
    if (pathNode) {
      return { file: pathNode, prefixArgs: [scriptTarget], extraEnvironment: {} }
    }
    return { file: this.electronExecutablePath, prefixArgs: [scriptTarget], extraEnvironment: { ELECTRON_RUN_AS_NODE: '1' } }
  }

  async prepareInvocation(command, args) {
    const extension = nodePath.extname(command).toLowerCase()

    if (this.platformPaths.isWindows && windowsShimExtensions.includes(extension)) {
      const resolvedShim = await this.resolveWindowsShim(command)
      if (resolvedShim) {
        return { file: resolvedShim.file, args: [...resolvedShim.prefixArgs, ...args], extraEnvironment: resolvedShim.extraEnvironment, viaCmd: false }
      }
      const commandLine = [escapeForCmdCommand(`"${command}"`), ...args.map(escapeForCmdArgument)].join(' ')
      return {
        file: process.env.ComSpec || 'cmd.exe',
        args: ['/d', '/s', '/c', `"${commandLine}"`],
        extraEnvironment: {},
        viaCmd: true,
        windowsVerbatimArguments: true
      }
    }

    return { file: command, args, extraEnvironment: {}, viaCmd: false }
  }

  killTree(child) {
    if (!child?.pid || child.exitCode !== null) {
      return
    }
    if (this.platformPaths.isWindows) {
      try {
        this.spawnImplementation('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' })
      } catch {
        child.kill()
      }
      return
    }
    try {
      process.kill(-child.pid, 'SIGTERM')
    } catch {
      child.kill('SIGTERM')
    }
    setTimeout(() => {
      try {
        process.kill(-child.pid, 'SIGKILL')
      } catch {
        child.kill('SIGKILL')
      }
    }, killGraceMs).unref?.()
  }

  async run({
    command,
    args = [],
    cwd,
    environment = process.env,
    input = null,
    timeoutMs = 60000,
    signal = null,
    maxOutputBytes = defaultMaximumOutputBytes,
    onStdout = null,
    onStderr = null
  }) {
    if (!command || !this.platformPaths.path.isAbsolute(command)) {
      throw new Error('El ejecutable debe indicarse con una ruta absoluta.')
    }
    if (!Array.isArray(args) || args.some((argument) => typeof argument !== 'string')) {
      throw new Error('Los argumentos deben ser una lista de textos.')
    }

    const invocation = await this.prepareInvocation(command, args)
    const startedAt = Date.now()

    return new Promise((resolve) => {
      let stdout = ''
      let stderr = ''
      let outputBytes = 0
      let truncated = false
      let timedOut = false
      let aborted = false
      let settled = false
      let child

      const finish = (result) => {
        if (settled) {
          return
        }
        settled = true
        clearTimeout(timer)
        signal?.removeEventListener('abort', onAbort)
        resolve({ stdout, stderr, truncated, timedOut, aborted, durationMs: Date.now() - startedAt, viaCmd: invocation.viaCmd, ...result })
      }

      const appendOutput = (chunk, isStdout) => {
        const text = chunk.toString('utf-8')
        outputBytes += chunk.length
        if (outputBytes > maxOutputBytes) {
          if (!truncated) {
            truncated = true
            this.killTree(child)
          }
          return
        }
        if (isStdout) {
          stdout += text
          onStdout?.(text)
        } else {
          stderr += text
          onStderr?.(text)
        }
      }

      const onAbort = () => {
        aborted = true
        this.killTree(child)
      }

      const timer = setTimeout(() => {
        timedOut = true
        this.killTree(child)
      }, timeoutMs)

      try {
        child = this.spawnImplementation(invocation.file, invocation.args, {
          cwd,
          env: { ...environment, ...invocation.extraEnvironment },
          stdio: ['pipe', 'pipe', 'pipe'],
          shell: false,
          windowsHide: true,
          detached: !this.platformPaths.isWindows,
          windowsVerbatimArguments: Boolean(invocation.windowsVerbatimArguments)
        })
      } catch (error) {
        finish({ exitCode: null, spawnError: error.message })
        return
      }

      if (signal?.aborted) {
        onAbort()
      } else {
        signal?.addEventListener('abort', onAbort, { once: true })
      }

      child.stdout?.on('data', (chunk) => appendOutput(chunk, true))
      child.stderr?.on('data', (chunk) => appendOutput(chunk, false))
      child.on('error', (error) => finish({ exitCode: null, spawnError: error.code === 'ENOENT' ? 'No se encontró el ejecutable.' : error.message }))
      child.on('close', (exitCode, exitSignal) => finish({ exitCode, exitSignal }))

      child.stdin?.on('error', () => {})
      if (input !== null && input !== undefined) {
        child.stdin?.end(String(input), 'utf-8')
      } else {
        child.stdin?.end()
      }
    })
  }
}

module.exports = { ProcessRunner, escapeForCmdArgument }
