const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { providerRegistry } = require('../../src/core/main/providers/providerRegistry')
const { githubCliTool } = require('../../src/core/main/providers/install/installRecipes')
const { graphifyCommands } = require('../../src/core/main/graphify/graphifyRuntime')

const rootDirectory = path.join(__dirname, '..', '..')
const shellSyntax = /[|&;<>$`\\]|&&|\|\||\bsudo\b|~\//

const shellSpawnPatterns = [
  /shell:\s*true/,
  /\bexecSync\(/,
  /(?<![.\w])exec\(/,
  /\{[^}]*\bexec\b[^}]*\}\s*=\s*require\('node:child_process'\)/
]

const listJavaScriptFiles =(directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const entryPath = path.join(directory, entry.name)
  return entry.isDirectory() ? listJavaScriptFiles(entryPath) : (entry.name.endsWith('.js') ? [entryPath] : [])
})

test('los comandos de inicio de sesión de los agentes no usan sintaxis de un solo sistema', () => {
  providerRegistry.filter((entry) => entry.cli).forEach((entry) => {
    assert.doesNotMatch(entry.cli.loginCommand, shellSyntax, entry.id)
    assert.ok(entry.cli.executables.every((name) => /^[a-z0-9-]+$/.test(name)), entry.id)
  })
  assert.doesNotMatch(githubCliTool.loginCommand, shellSyntax)
})

test('las recetas de instalación solo usan ejecutables que existen en el sistema que las declara', () => {
  const executablesBySystem = { win32: ['npm', 'winget'], darwin: ['npm', 'brew'], linux: ['npm', 'brew'] }
  const interpretersBySystem = { win32: ['powershell'], darwin: ['bash', 'sh'], linux: ['bash', 'sh'] }
  const targets = [...providerRegistry.filter((entry) => entry.install).map((entry) => ({ id: entry.id, install: entry.install })), { id: githubCliTool.id, install: githubCliTool.install }]
  targets.forEach((target) => {
    Object.entries(target.install.platforms).forEach(([system, methods]) => {
      methods.forEach((method) => method.steps.forEach((step) => {
        if (step.type === 'run') {
          assert.ok(executablesBySystem[system].includes(step.executable), `${target.id}/${system}: ${step.executable}`)
          step.args.forEach((argument) => assert.doesNotMatch(argument, shellSyntax))
        } else {
          assert.ok(interpretersBySystem[system].includes(step.interpreter), `${target.id}/${system}: ${step.interpreter}`)
        }
      }))
    })
  })
})

test('los comandos de Graphify son listas de argumentos sin sintaxis de shell', () => {
  Object.values(graphifyCommands).forEach((build) => {
    build().forEach((argument) => assert.doesNotMatch(argument, shellSyntax))
  })
})

test('ningún módulo del proceso main lanza procesos con shell ni con ejecutores de cadenas', () => {
  const offenders = listJavaScriptFiles(path.join(rootDirectory, 'src', 'core', 'main')).filter((filePath) => {
    const text = fs.readFileSync(filePath, 'utf-8')
    return shellSpawnPatterns.some((pattern) => pattern.test(text))
  })
  assert.deepEqual(offenders.map((filePath) => path.relative(rootDirectory, filePath)), [])
})

test('git y gh se lanzan siempre con listas de argumentos y los comandos de publicación existen igual en los tres sistemas', () => {
  const publisher = fs.readFileSync(path.join(rootDirectory, 'src', 'core', 'main', 'publishing', 'skillPublisher.js'), 'utf-8')
  const importer = fs.readFileSync(path.join(rootDirectory, 'src', 'core', 'main', 'imports', 'repositoryImporter.js'), 'utf-8')
  ;[publisher, importer].forEach((text) => {
    assert.doesNotMatch(text, /runGit\(`|runGh\(`|runGit\('[^']*\s[^']*'\)|runGh\('[^']*\s[^']*'\)/)
  })
  assert.match(importer, /isWindows \? \['-c', 'core\.longpaths=true'\]/)
  assert.match(publisher, /isWindows \? \['-c', 'core\.longpaths=true'\]/)
})

test('el README ofrece el comando de arranque para bash, PowerShell y cmd', () => {
  const readme = fs.readFileSync(path.join(rootDirectory, 'README.md'), 'utf-8')
  assert.match(readme, /SKIMA_USER_DATA_DIR=\/ruta\/absoluta\/temporal npm run start/)
  assert.match(readme, /\$env:SKIMA_USER_DATA_DIR = /)
  assert.match(readme, /set SKIMA_USER_DATA_DIR=/)
})
