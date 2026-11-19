const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { HooksStore } = require('../../src/core/main/hooks/hooksStore')
const { ProjectHooksService } = require('../../src/core/main/hooks/projectHooksService')
const { MemoriesStore } = require('../../src/core/main/memories/memoriesStore')
const { MemoryProjectInstaller } = require('../../src/core/main/memories/memoryProjectInstaller')
const { MemoriesService } = require('../../src/core/main/memories/memoriesService')
const { JsonFileStorage } = require('../../src/core/main/storage/jsonFileStorage')
const { createPlatformPaths } = require('../../src/core/main/platform/platformPaths')
const { toMemorySlug, parseMemoryFileContent } = require('../../src/core/main/memories/memoryFile')
const { SkillUninstaller } = require('../../src/core/main/skills/skillUninstaller')

const loaderScriptSource = path.join(__dirname, '..', '..', 'src', 'core', 'main', 'memories', 'scripts', 'getMemory.sh')
const createTemporaryDirectory = (prefix) => fs.mkdtempSync(path.join(os.tmpdir(), prefix))

const createEnvironment = ({ projectCount = 2 } = {}) => {
  const platformPaths = createPlatformPaths()
  const projects = Array.from({ length: projectCount }, (unused, index) => ({
    id: `project-${index + 1}`,
    name: `Proyecto ${index + 1}`,
    path: createTemporaryDirectory(`skima-memory-project-${index + 1}-`),
    context: `Descripción del proyecto ${index + 1}`,
    folderExists: true,
    displayPath: ''
  }))
  const projectModel = {
    getById: async (projectId) => {
      const project = projects.find((candidate) => candidate.id === projectId)
      if (!project) {
        throw new Error('El proyecto no existe en Skima.')
      }
      return project
    },
    getAll: async () => projects
  }
  const hooksStore = new HooksStore({ directory: createTemporaryDirectory('skima-memory-hooks-') })
  const projectHooksService = new ProjectHooksService({ projectModel, hooksStore, platformPaths })
  const installer = new MemoryProjectInstaller({ projectHooksService, hooksStore, platformPaths, loaderScriptSource })
  const trashed = []
  const service = new MemoriesService({
    memoriesStore: new MemoriesStore({ storage: new JsonFileStorage(path.join(createTemporaryDirectory('skima-memory-store-'), 'memories.json'), []) }),
    projectModel,
    installer,
    markdownRenderer: { render: (markdown) => ({ html: `<pre>${markdown}</pre>`, isTruncated: false }) },
    platformPaths,
    trashItem: async (itemPath) => {
      trashed.push(itemPath)
      fs.rmSync(itemPath, { recursive: true, force: true })
    }
  })
  const memoriesRoot = createTemporaryDirectory('skima-memory-root-')
  const readSettings = (project) => JSON.parse(fs.readFileSync(path.join(project.path, '.claude', 'settings.json'), 'utf-8'))
  return { projects, hooksStore, projectHooksService, service, memoriesRoot, readSettings, trashed }
}

test('el slug de la memoria va en minúsculas y separado por guiones', () => {
  assert.equal(toMemorySlug('  Mi Memoria Común  '), 'mi-memoria-comun')
  assert.equal(toMemorySlug('Backend & API v2'), 'backend-api-v2')
})

test('lee la ruta de un MEMORY.md', () => {
  assert.equal(parseMemoryFileContent('path: C:\\memorias\\brain\n'), 'C:\\memorias\\brain')
  assert.equal(parseMemoryFileContent('sin ruta'), null)
})

test('crea la memoria con la estructura del brain y la registra', async () => {
  const { service, memoriesRoot } = createEnvironment()
  const memory = await service.create({ name: 'Mi Memoria', parentPath: memoriesRoot })
  assert.equal(memory.path, path.join(memoriesRoot, 'mi-memoria'))
  for (const relativePath of ['README.md', 'CLAUDE.md', 'context/overview.md', 'context/architecture.md', 'context/stack.md', 'context/glossary.md', 'context/people-teams.md', 'tech_solutions/_index.md', 'tech_solutions/_template.md']) {
    assert.ok(fs.existsSync(path.join(memory.path, relativePath)), relativePath)
  }
  for (const directory of ['decisions', 'projects', 'playbooks', 'inbox']) {
    assert.ok(fs.statSync(path.join(memory.path, directory)).isDirectory(), directory)
  }
  const list = await service.list()
  assert.equal(list.length, 1)
  assert.equal(list[0].projectCount, 0)
  const details = await service.getDetails(memory.id)
  assert.ok(details.instructions.html.includes('Instrucciones'))
  assert.ok(details.files.filePaths.includes('decisions/'))
})

test('no deja crear memorias duplicadas ni sobre carpetas existentes', async () => {
  const { service, memoriesRoot } = createEnvironment()
  await service.create({ name: 'Brain', parentPath: memoriesRoot })
  await assert.rejects(service.create({ name: 'brain', parentPath: memoriesRoot }), /Ya tienes una memoria/)
  fs.mkdirSync(path.join(memoriesRoot, 'otra'))
  await assert.rejects(service.create({ name: 'Otra', parentPath: memoriesRoot }), /Ya existe/)
  await assert.rejects(service.create({ name: '   ', parentPath: memoriesRoot }), /obligatorio/)
  await assert.rejects(service.create({ name: 'Nueva', parentPath: 'relativa' }), /absoluta/)
})

test('vincular un proyecto crea MEMORY.md, get-memory.sh, el hook PreToolUse y maintain-memory', async () => {
  const { service, memoriesRoot, projects, readSettings, hooksStore } = createEnvironment()
  const memory = await service.create({ name: 'Brain', parentPath: memoriesRoot })
  const details = await service.linkProject(memory.id, projects[0].id)
  const [project] = projects
  assert.equal(fs.readFileSync(path.join(project.path, 'MEMORY.md'), 'utf-8'), `path: ${memory.path}\n`)
  const script = fs.readFileSync(path.join(project.path, '.claude', 'hooks', 'get-memory.sh'), 'utf-8')
  assert.ok(script.startsWith('#!/usr/bin/env bash\n'))
  assert.ok(!script.includes('\r'))
  const settings = readSettings(project)
  assert.deepEqual(settings.hooks.PreToolUse, [{ matcher: 'Glob|Grep', hooks: [{ type: 'command', command: '"$CLAUDE_PROJECT_DIR/.claude/hooks/get-memory.sh"' }] }])
  assert.match(settings.hooks.Stop[0].hooks[0].command, /Usa la skill update-memories/)
  assert.equal((await hooksStore.find('maintain-memory')).skillName, 'update-memories')
  assert.equal(details.projects.length, 1)
  assert.equal(details.projects[0].health.isHealthy, true)
  assert.deepEqual(details.availableProjects.map((candidate) => candidate.id), ['project-2'])
  assert.equal((await service.getProjectMemory(project.id)).name, 'Brain')
  assert.equal(await service.getProjectMemory(projects[1].id), null)
})

test('un proyecto no puede estar en dos memorias', async () => {
  const { service, memoriesRoot, projects } = createEnvironment()
  const first = await service.create({ name: 'Primera', parentPath: memoriesRoot })
  const second = await service.create({ name: 'Segunda', parentPath: memoriesRoot })
  await service.linkProject(first.id, projects[0].id)
  await assert.rejects(service.linkProject(second.id, projects[0].id), /ya pertenece a otra memoria/)
  const details = await service.getDetails(second.id)
  assert.deepEqual(details.availableProjects.map((project) => project.id), ['project-2'])
  assert.equal(details.unavailableProjects[0].reason, 'Ya está en otra memoria')
})

test('no pisa un MEMORY.md ajeno a Skima', async () => {
  const { service, memoriesRoot, projects } = createEnvironment()
  const memory = await service.create({ name: 'Brain', parentPath: memoriesRoot })
  fs.writeFileSync(path.join(projects[0].path, 'MEMORY.md'), '# Notas mías\n')
  await assert.rejects(service.linkProject(memory.id, projects[0].id), /no es de Skima/)
  assert.equal(fs.readFileSync(path.join(projects[0].path, 'MEMORY.md'), 'utf-8'), '# Notas mías\n')
})

test('conserva los hooks ajenos del settings.json al vincular y desvincular', async () => {
  const { service, memoriesRoot, projects, readSettings } = createEnvironment()
  const [project] = projects
  const external = { hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'echo externo' }] }] }, model: 'opus' }
  fs.mkdirSync(path.join(project.path, '.claude'))
  fs.writeFileSync(path.join(project.path, '.claude', 'settings.json'), JSON.stringify(external))
  const memory = await service.create({ name: 'Brain', parentPath: memoriesRoot })
  await service.linkProject(memory.id, project.id)
  assert.equal(readSettings(project).hooks.PreToolUse.length, 2)
  await service.unlinkProject(memory.id, project.id)
  assert.deepEqual(readSettings(project), external)
  assert.ok(!fs.existsSync(path.join(project.path, 'MEMORY.md')))
  assert.ok(!fs.existsSync(path.join(project.path, '.claude', 'hooks', 'get-memory.sh')))
})

test('desvincular deja el proyecto limpio y disponible otra vez', async () => {
  const { service, memoriesRoot, projects } = createEnvironment()
  const memory = await service.create({ name: 'Brain', parentPath: memoriesRoot })
  await service.linkProject(memory.id, projects[0].id)
  const details = await service.unlinkProject(memory.id, projects[0].id)
  assert.equal(details.projects.length, 0)
  assert.ok(!fs.existsSync(path.join(projects[0].path, '.claude')))
  assert.ok(!fs.existsSync(path.join(projects[0].path, 'MEMORY.md')))
  assert.deepEqual(details.availableProjects.map((project) => project.id).sort(), ['project-1', 'project-2'])
})

test('detecta una instalación rota y la repara', async () => {
  const { service, memoriesRoot, projects, readSettings } = createEnvironment()
  const memory = await service.create({ name: 'Brain', parentPath: memoriesRoot })
  await service.linkProject(memory.id, projects[0].id)
  fs.rmSync(path.join(projects[0].path, '.claude', 'hooks', 'get-memory.sh'))
  const settings = readSettings(projects[0])
  delete settings.hooks.Stop
  fs.writeFileSync(path.join(projects[0].path, '.claude', 'settings.json'), JSON.stringify(settings))
  const broken = await service.getDetails(memory.id)
  assert.equal(broken.projects[0].health.isHealthy, false)
  assert.equal(broken.projects[0].health.problems.length, 2)
  const repaired = await service.repairProject(memory.id, projects[0].id)
  assert.equal(repaired.projects[0].health.isHealthy, true)
  assert.equal(readSettings(projects[0]).hooks.PreToolUse.length, 1)
})

test('maintain-memory no se puede quitar a mano, ni borrar, ni cambiar de skill', async () => {
  const { service, memoriesRoot, projects, projectHooksService, hooksStore } = createEnvironment()
  const memory = await service.create({ name: 'Brain', parentPath: memoriesRoot })
  await service.linkProject(memory.id, projects[0].id)
  await assert.rejects(projectHooksService.removeHook(projects[0].id, 'Stop', 'maintain-memory'), /lo gestionan las memorias/)
  await assert.rejects(projectHooksService.addHook(projects[1].id, 'Stop', 'maintain-memory'), /lo gestionan las memorias/)
  const assignments = await projectHooksService.getProjectHooks(projects[0].id)
  assert.equal(assignments.events.Stop[0].isProtected, true)
  await assert.rejects(hooksStore.delete('maintain-memory'), /no se puede eliminar/)
  await assert.rejects(hooksStore.update('maintain-memory', { type: 'prompt', skillName: 'otra-skill' }), /no se puede cambiar/)
  const updated = await hooksStore.update('maintain-memory', { type: 'prompt', skillName: 'update-memories', model: 'sonnet', timeout: 90 })
  assert.equal(updated.model, 'sonnet')
  assert.equal(updated.isProtected, true)
})

test('el nombre get-memory está reservado para los hooks', async () => {
  const { hooksStore } = createEnvironment()
  await assert.rejects(hooksStore.create({ type: 'prompt', name: 'get-memory', skillName: 'x' }), /reserva Skima/)
})

test('eliminar la memoria saca a todos sus proyectos y manda la carpeta a la papelera', async () => {
  const { service, memoriesRoot, projects, trashed } = createEnvironment()
  const memory = await service.create({ name: 'Brain', parentPath: memoriesRoot })
  await service.linkProject(memory.id, projects[0].id)
  await service.linkProject(memory.id, projects[1].id)
  assert.equal((await service.list())[0].projectCount, 2)
  const outcome = await service.remove(memory.id)
  assert.deepEqual(outcome.unlinkedProjects.sort(), ['Proyecto 1', 'Proyecto 2'])
  assert.deepEqual(trashed, [memory.path])
  assert.equal((await service.list()).length, 0)
  for (const project of projects) {
    assert.ok(!fs.existsSync(path.join(project.path, 'MEMORY.md')))
    assert.ok(!fs.existsSync(path.join(project.path, '.claude')))
  }
})

test('impide leer archivos fuera de la memoria', async () => {
  const { service, memoriesRoot } = createEnvironment()
  const memory = await service.create({ name: 'Brain', parentPath: memoriesRoot })
  await assert.rejects(service.getDocument(memory.id, '../secreto.md'), /no es válida/)
  const readme = await service.getDocument(memory.id, 'README.md')
  assert.ok(readme.html.includes('# Brain'))
})

test('la skill update-memories no se puede desinstalar', async () => {
  const skillsDirectory = createTemporaryDirectory('skima-memory-skills-')
  const skillPath = path.join(skillsDirectory, 'update-memories')
  fs.mkdirSync(skillPath)
  const uninstaller = new SkillUninstaller({
    scanner: { knownSkillDirectories: async () => [skillsDirectory], invalidate: () => {} },
    platformPaths: createPlatformPaths(),
    settingsStore: { update: async () => {} },
    trashItem: async () => {}
  })
  const [check] = await uninstaller.preview([skillPath])
  assert.equal(check.ok, false)
  await assert.rejects(uninstaller.uninstall([skillPath]), /No se ha desinstalado nada/)
})

test('localiza la skill update-memories en la carpeta global o del proyecto de Claude Code', async () => {
  const { MemorySkillLocator } = require('../../src/core/main/memories/memorySkillLocator')
  const { ProviderPathResolver } = require('../../src/core/main/providers/providerPathResolver')
  const { providerRegistry } = require('../../src/core/main/providers/providerRegistry')
  const home = createTemporaryDirectory('skima-memory-home-')
  const platformPaths = createPlatformPaths({ homeDirectory: home, environment: {} })
  const projectPath = createTemporaryDirectory('skima-memory-skill-project-')
  const locator = new MemorySkillLocator({ registry: providerRegistry, pathResolver: new ProviderPathResolver({ platformPaths }), settingsStore: { get: async () => ({ agents: {} }) }, platformPaths })
  assert.equal(await locator.isAvailable(projectPath), false)
  const projectSkill = path.join(projectPath, '.claude', 'skills', 'update-memories')
  fs.mkdirSync(projectSkill, { recursive: true })
  fs.writeFileSync(path.join(projectSkill, 'SKILL.md'), '---\nname: update-memories\n---\n')
  assert.equal(await locator.isAvailable(projectPath), true)
  const globalSkill = path.join(home, '.claude', 'skills', 'update-memories')
  fs.mkdirSync(globalSkill, { recursive: true })
  fs.writeFileSync(path.join(globalSkill, 'SKILL.md'), '---\nname: update-memories\n---\n')
  assert.equal(await locator.isAvailable(createTemporaryDirectory('skima-memory-other-')), true)
})

const createMemorizer = ({ service, ask }) => {
  const { MemoryMemorizer } = require('../../src/core/main/memories/memoryMemorizer')
  const events = []
  const memorizer = new MemoryMemorizer({ memoriesService: service, askAi: { ask }, platformPaths: createPlatformPaths(), broadcast: (event) => events.push(event) })
  return { memorizer, events }
}

test('memorizar lanza update-memories en la carpeta de la memoria con sus proyectos', async () => {
  const { service, memoriesRoot, projects } = createEnvironment()
  const memory = await service.create({ name: 'Brain', parentPath: memoriesRoot })
  await service.linkProject(memory.id, projects[0].id)
  let request = null
  const { memorizer, events } = createMemorizer({
    service,
    ask: async (options) => {
      request = options
      options.onEvent({ type: 'toolUse', name: 'Read' })
      options.onEvent({ type: 'text', text: 'Analizando\nHecho' })
      return { ok: true, text: 'Modificado projects/proyecto-1/status.md', resolution: { agentName: 'Claude Code', model: 'haiku' } }
    }
  })
  const outcome = await memorizer.start(memory.id)
  assert.equal(request.promptId, 'memories-update')
  assert.equal(request.cwd, memory.path)
  assert.equal(request.projectId, undefined)
  assert.equal(request.variables.memoryPath, memory.path)
  assert.ok(request.variables.projectList.includes(`Proyecto 1: ${projects[0].path}`))
  assert.doesNotMatch(request.variables.projectList, /Proyecto 2/)
  assert.equal(outcome.status, 'succeeded')
  assert.match(outcome.message, /Claude Code · haiku/)
  assert.deepEqual(outcome.summary, ['Modificado projects/proyecto-1/status.md'])
  assert.deepEqual(events.map((event) => event.type), ['started', 'progress', 'progress', 'progress', 'finished'])
  assert.equal(memorizer.getStatus(memory.id).running, null)
  assert.equal(memorizer.getStatus(memory.id).lastResult.status, 'succeeded')
})

test('memorizar exige proyectos, no se lanza dos veces y se puede cancelar', async () => {
  const { service, memoriesRoot, projects } = createEnvironment()
  const memory = await service.create({ name: 'Brain', parentPath: memoriesRoot })
  const { memorizer } = createMemorizer({
    service,
    ask: (options) => new Promise((resolve) => {
      options.signal.addEventListener('abort', () => resolve({ ok: false, error: { code: 'CANCELLED', message: 'cancelado' } }))
    })
  })
  await assert.rejects(memorizer.start(memory.id), /al menos un proyecto/)
  await service.linkProject(memory.id, projects[0].id)
  const running = memorizer.start(memory.id)
  await new Promise((resolve) => setTimeout(resolve, 20))
  assert.ok(memorizer.getStatus(memory.id).running)
  await assert.rejects(memorizer.start(memory.id), /ya se está memorizando/)
  assert.equal(memorizer.cancel(memory.id), true)
  const outcome = await running
  assert.equal(outcome.status, 'cancelled')
  assert.equal(memorizer.cancel(memory.id), false)
})

test('memorizar informa del error del agente', async () => {
  const { service, memoriesRoot, projects } = createEnvironment()
  const memory = await service.create({ name: 'Brain', parentPath: memoriesRoot })
  await service.linkProject(memory.id, projects[0].id)
  const { memorizer } = createMemorizer({ service, ask: async () => ({ ok: false, error: { code: 'NO_AGENT', message: 'No hay ningún agente disponible.' } }) })
  const outcome = await memorizer.start(memory.id)
  assert.equal(outcome.status, 'failed')
  assert.match(outcome.message, /No hay ningún agente/)
})
