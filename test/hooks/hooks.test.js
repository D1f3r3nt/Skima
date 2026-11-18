const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { HooksStore } = require('../../src/core/main/hooks/hooksStore')
const { ProjectHooksService } = require('../../src/core/main/hooks/projectHooksService')
const { buildHookEntry } = require('../../src/core/main/hooks/hookDefinitions')
const { createPlatformPaths } = require('../../src/core/main/platform/platformPaths')

const createTemporaryDirectory = (prefix) => fs.mkdtempSync(path.join(os.tmpdir(), prefix))

const createEnvironment = () => {
  const projectPath = createTemporaryDirectory('skima-hooks-project-')
  const hooksStore = new HooksStore({ directory: createTemporaryDirectory('skima-hooks-store-') })
  const project = { id: 'project-1', name: 'Demo', path: projectPath, folderExists: true }
  const projectModel = {
    getById: async () => project,
    getAll: async () => [project]
  }
  const service = new ProjectHooksService({ projectModel, hooksStore, platformPaths: createPlatformPaths() })
  const settingsPath = path.join(projectPath, '.claude', 'settings.json')
  const readSettings = () => JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
  return { projectPath, hooksStore, service, settingsPath, readSettings }
}

const createScript = () => {
  const scriptPath = path.join(createTemporaryDirectory('skima-hooks-script-'), 'origen.sh')
  fs.writeFileSync(scriptPath, '#!/bin/bash\necho hola\n')
  return scriptPath
}

test('genera la entrada de un hook prompt sin campos opcionales vacíos', () => {
  assert.deepEqual(buildHookEntry({ type: 'prompt', name: 'revisar', skillName: 'reviewer', model: null, timeout: null, statusMessage: null }), {
    type: 'prompt',
    prompt: 'Use reviewer with this info $ARGUMENTS'
  })
})

test('genera la entrada de un hook command con la ruta del proyecto', () => {
  assert.deepEqual(buildHookEntry({ type: 'command', name: 'lint', async: true, timeout: 10, statusMessage: 'Comprobando…' }), {
    type: 'command',
    async: true,
    command: '"$CLAUDE_PROJECT_DIR"/.claude/hooks/lint.sh',
    timeout: 10,
    statusMessage: 'Comprobando…'
  })
})

test('valida el nombre, el timeout y rechaza el tipo agent', async () => {
  const { hooksStore } = createEnvironment()
  await assert.rejects(hooksStore.create({ type: 'prompt', name: 'Mal Nombre', skillName: 'x' }), /minúsculas/)
  await assert.rejects(hooksStore.create({ type: 'prompt', name: 'ok', skillName: 'x', timeout: '0' }), /timeout/)
  await assert.rejects(hooksStore.create({ type: 'agent', name: 'ok' }), /todavía no/)
  await hooksStore.create({ type: 'prompt', name: 'ok', skillName: 'x' })
  await assert.rejects(hooksStore.create({ type: 'prompt', name: 'ok', skillName: 'x' }), /Ya tienes/)
})

test('crea settings.json y copia el script al asignar, y los quita al vaciar', async () => {
  const { projectPath, hooksStore, service, settingsPath, readSettings } = createEnvironment()
  await hooksStore.create({ type: 'command', name: 'lint', scriptPath: createScript(), timeout: '10' })
  await hooksStore.create({ type: 'prompt', name: 'revisar', skillName: 'reviewer', model: 'haiku' })

  await service.addHook('project-1', 'SessionStart', 'lint')
  await service.addHook('project-1', 'Stop', 'revisar')
  await service.addHook('project-1', 'Stop', 'lint')

  const settings = readSettings()
  assert.deepEqual(settings.hooks.SessionStart, [{ hooks: [{ type: 'command', command: '"$CLAUDE_PROJECT_DIR"/.claude/hooks/lint.sh', timeout: 10 }] }])
  assert.equal(settings.hooks.Stop[0].hooks.length, 2)
  assert.equal(fs.readFileSync(path.join(projectPath, '.claude', 'hooks', 'lint.sh'), 'utf-8'), '#!/bin/bash\necho hola\n')

  const assignments = await service.getProjectHooks('project-1')
  assert.deepEqual(assignments.events.Stop.map((hook) => hook.name), ['revisar', 'lint'])

  await service.removeHook('project-1', 'SessionStart', 'lint')
  assert.ok(fs.existsSync(path.join(projectPath, '.claude', 'hooks', 'lint.sh')))
  await service.removeHook('project-1', 'Stop', 'lint')
  assert.equal(fs.existsSync(path.join(projectPath, '.claude', 'hooks')), false)
  await service.removeHook('project-1', 'Stop', 'revisar')
  assert.equal(fs.existsSync(settingsPath), false)
  assert.equal(fs.existsSync(path.join(projectPath, '.claude')), false)
})

test('conserva el resto de settings.json y los hooks ajenos a Skima', async () => {
  const { hooksStore, service, settingsPath, readSettings } = createEnvironment()
  const external = { type: 'command', command: 'echo externo' }
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true })
  fs.writeFileSync(settingsPath, JSON.stringify({ permissions: { allow: ['Bash'] }, hooks: { Stop: [{ hooks: [external] }] } }))
  await hooksStore.create({ type: 'prompt', name: 'revisar', skillName: 'reviewer' })

  await service.addHook('project-1', 'Stop', 'revisar')
  const assignments = await service.getProjectHooks('project-1')
  assert.equal(assignments.externalCount, 1)

  await service.removeHook('project-1', 'Stop', 'revisar')
  assert.deepEqual(readSettings(), { permissions: { allow: ['Bash'] }, hooks: { Stop: [{ hooks: [external] }] } })
})

test('no sobrescribe un settings.json con JSON inválido', async () => {
  const { hooksStore, service, settingsPath } = createEnvironment()
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true })
  fs.writeFileSync(settingsPath, '{ roto')
  await hooksStore.create({ type: 'prompt', name: 'revisar', skillName: 'reviewer' })
  await assert.rejects(service.addHook('project-1', 'Stop', 'revisar'), /JSON válido/)
  assert.equal(fs.readFileSync(settingsPath, 'utf-8'), '{ roto')
})

test('informa de los proyectos que usan un hook', async () => {
  const { hooksStore, service } = createEnvironment()
  await hooksStore.create({ type: 'prompt', name: 'revisar', skillName: 'reviewer' })
  await service.addHook('project-1', 'UserPromptSubmit', 'revisar')
  assert.deepEqual(await service.findUsage('revisar'), [{ projectId: 'project-1', projectName: 'Demo', events: ['UserPromptSubmit'] }])
})
