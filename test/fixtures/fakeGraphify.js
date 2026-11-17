const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const args = process.argv.slice(2)
const scenario = process.env.FAKE_GRAPHIFY_SCENARIO || 'ok'
const version = process.env.FAKE_GRAPHIFY_VERSION || '0.9.105'

if (process.env.FAKE_GRAPHIFY_LOG) {
  const secretNames = Object.keys(process.env).filter((name) => /API_?KEY|TOKEN|SECRET|ANTHROPIC_|OPENAI_/i.test(name))
  fs.appendFileSync(process.env.FAKE_GRAPHIFY_LOG, `${JSON.stringify({ args, cwd: process.cwd(), home: process.env.HOME ?? null, secretNames })}\n`)
}

if (args[0] === '--version') {
  if (scenario === 'broken') {
    process.exit(3)
  }
  process.stdout.write(`graphify ${version}\n`)
  process.exit(0)
}

if (args[0] === 'god-nodes') {
  if (!fs.existsSync(path.join(process.cwd(), 'graphify-out', 'graph.json'))) {
    process.stderr.write('error: graph file not found\n')
    process.exit(1)
  }
  if (scenario !== 'empty-god-nodes') {
    process.stdout.write('God nodes (most connected):\n  1. main() - 12 edges\n  2. Parser - 7 edges\n')
  }
  process.exit(0)
}

const writeGraph = ({ corrupt = false, withGraph = true } = {}) => {
  const out = path.join(process.cwd(), 'graphify-out')
  fs.mkdirSync(out, { recursive: true })
  if (withGraph) {
    fs.writeFileSync(path.join(out, 'graph.json'), corrupt ? '{ roto' : JSON.stringify({ nodes: [{ id: 1 }, { id: 2 }, { id: 3 }], edges: [] }))
  }
}

const writeReports = () => {
  const out = path.join(process.cwd(), 'graphify-out')
  fs.mkdirSync(out, { recursive: true })
  fs.writeFileSync(path.join(out, 'graph.html'), '<html></html>')
  fs.writeFileSync(path.join(out, 'GRAPH_REPORT.md'), '# Report\n')
}

const sectionText = '## graphify\n\nThis project has a knowledge graph at graphify-out/.\n\nRules:\n- run graphify query first\n'
const hasSection = (text) => /^## graphify[ \t]*$/m.test(text)
const removeSection = (text) => text.replace(/^## graphify[ \t]*$[\s\S]*?(?=^## \S|(?![\s\S]))/m, '').replace(/\n{3,}/g, '\n\n').trimEnd()
const exePath = '/fake/graphify.EXE'

const readOptional = (relativePath) => {
  const target = path.join(process.cwd(), relativePath)
  return fs.existsSync(target) ? fs.readFileSync(target, 'utf-8') : null
}

const writeRelative = (relativePath, content) => {
  const target = path.join(process.cwd(), relativePath)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, content)
}

const addSection = (fileName) => {
  const current = readOptional(fileName)
  if (current !== null && hasSection(current)) {
    return
  }
  writeRelative(fileName, current === null ? sectionText : `${current.trimEnd()}\n\n${sectionText}`)
}

const dropSection = (fileName) => {
  const current = readOptional(fileName)
  if (current === null || !hasSection(current)) {
    return
  }
  const cleaned = removeSection(current)
  if (cleaned) {
    writeRelative(fileName, `${cleaned}\n`)
  } else {
    fs.rmSync(path.join(process.cwd(), fileName))
  }
}

const hooksFile = (relativePath, matcherCommands, install) => {
  const current = readOptional(relativePath)
  if (!install && current === null) {
    return
  }
  const data = current ? JSON.parse(current) : { hooks: {} }
  data.hooks ??= {}
  data.hooks.PreToolUse ??= []
  data.hooks.PreToolUse = data.hooks.PreToolUse.filter((entry) => !JSON.stringify(entry).includes('hook-'))
  if (install) {
    matcherCommands.forEach((command) => data.hooks.PreToolUse.push({ matcher: 'Bash|Grep', hooks: [{ type: 'command', command: `${exePath} ${command}`, timeout: 10 }] }))
  } else if (current) {
    fs.writeFileSync(path.join(process.cwd(), `${relativePath}.graphify-bak`), current)
  }
  writeRelative(relativePath, JSON.stringify(data, null, 2))
}

const runVariant = (variant, action) => {
  const install = action === 'install'
  if (scenario === 'integration-fails') {
    process.stderr.write('integration failed\n')
    process.exit(5)
  }
  if (scenario === 'writes-home') {
    const cache = path.join(process.env.HOME ?? os.homedir(), '.cache', 'graphify', 'skill-locks')
    fs.mkdirSync(cache, { recursive: true })
    fs.writeFileSync(path.join(cache, 'a.lock'), '')
    const skill = path.join(process.env.HOME ?? os.homedir(), '.gemini', 'skills', 'graphify')
    fs.mkdirSync(skill, { recursive: true })
    fs.writeFileSync(path.join(skill, 'SKILL.md'), 'global')
  }
  if (scenario === 'writes-existing') {
    fs.writeFileSync(path.join(process.cwd(), 'README.md'), 'cambiado por graphify\n')
  }
  if (variant === 'claude') {
    install ? addSection('CLAUDE.md') : dropSection('CLAUDE.md')
    hooksFile('.claude/settings.json', ['hook-guard search', 'hook-guard read'], install)
  } else if (variant === 'codex') {
    install ? addSection('AGENTS.md') : dropSection('AGENTS.md')
    hooksFile('.codex/hooks.json', ['hook-check'], install)
  } else if (variant === 'opencode') {
    install ? addSection('AGENTS.md') : dropSection('AGENTS.md')
    if (install) {
      writeRelative('.opencode/plugins/graphify.js', '// graphify plugin\n')
    } else {
      fs.rmSync(path.join(process.cwd(), '.opencode', 'plugins', 'graphify.js'), { force: true })
    }
  } else if (variant === 'cursor') {
    if (install) {
      writeRelative('.cursor/rules/graphify.mdc', '---\nalwaysApply: true\n---\ngraphify rule\n')
    } else {
      fs.rmSync(path.join(process.cwd(), '.cursor', 'rules', 'graphify.mdc'), { force: true })
    }
  } else {
    process.exit(1)
  }
  process.stdout.write(`${variant} ${action} done\n`)
  process.exit(0)
}

if (['claude', 'codex', 'opencode', 'cursor'].includes(args[0]) && ['install', 'uninstall'].includes(args[1])) {
  runVariant(args[0], args[1])
} else if (args[0] === 'extract') {
  process.stdout.write(`Scanning ${process.cwd()}\n`)
  process.stdout.write('Progress 40%\n')
  if (scenario === 'slow') {
    setInterval(() => {}, 1000)
  } else if (scenario === 'fail') {
    process.stderr.write(`Error reading ${process.cwd()}${path.sep}src${path.sep}x.py\n`)
    process.exit(2)
  } else {
    if (scenario === 'touch') {
      fs.appendFileSync(path.join(process.cwd(), 'README.md'), 'cambiado\n')
    }
    writeGraph({ corrupt: scenario === 'corrupt', withGraph: scenario !== 'nograph' })
    process.stdout.write('Progress 70%\n')
    process.exit(0)
  }
} else if (args[0] === 'cluster-only') {
  if (!args.includes('--no-label')) {
    process.stderr.write('missing --no-label\n')
    process.exit(4)
  }
  if (scenario === 'fail-cluster') {
    process.stderr.write('cluster failed\n')
    process.exit(2)
  }
  writeReports()
  process.stdout.write('Progress 100%\n')
  process.exit(0)
} else {
  process.exit(1)
}
