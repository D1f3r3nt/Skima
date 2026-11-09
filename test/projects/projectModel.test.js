const test = require('node:test')
const assert = require('node:assert/strict')
const { ProjectModel } = require('../../src/core/main/models/projectModel')
const { SettingsStore } = require('../../src/core/main/settings/settingsStore')
const { createPlatformPaths } = require('../../src/core/main/platform/platformPaths')
const { MemoryStorage } = require('../helpers/memoryStorage')

const createModel = ({ platform = 'linux', existingFolders = ['/work/web', '/work/api', '/work/moved'] } = {}) => {
  const folders = new Set(existingFolders)
  let idCounter = 0
  const createId = () => {
    idCounter += 1
    return `project-${idCounter}`
  }
  const settingsStore = new SettingsStore({ storage: new MemoryStorage(), createId })
  return {
    folders,
    model: new ProjectModel({
      settingsStore,
      platformPaths: createPlatformPaths({ platform, homeDirectory: platform === 'win32' ? 'C:\\Users\\ana' : '/home/ana' }),
      fileSystemService: { isDirectory: async (folderPath) => folders.has(folderPath) },
      createId
    })
  }
}

test('añade un proyecto con id estable y sin duplicar rutas', async () => {
  const { model } = createModel()
  const project = await model.add({ name: 'Web', path: '/work/web' })

  assert.equal(project.id, 'project-1')
  assert.equal(project.folderExists, true)
  await assert.rejects(() => model.add({ name: 'Otra', path: '/work/web/' }), /ya está añadida/)
  await assert.rejects(() => model.add({ name: 'X', path: 'relativa' }), /absoluta/)
})

test('trata las rutas sin distinguir mayúsculas en Windows', async () => {
  const { model } = createModel({ platform: 'win32', existingFolders: ['C:\\Work\\Web', 'c:\\work\\web'] })
  await model.add({ name: 'Web', path: 'C:\\Work\\Web' })
  await assert.rejects(() => model.add({ name: 'Web 2', path: 'c:\\work\\web' }), /ya está añadida/)
})

test('renombra con validaciones de vacío, longitud y duplicado', async () => {
  const { model } = createModel()
  const web = await model.add({ name: 'Web', path: '/work/web' })
  await model.add({ name: 'Api', path: '/work/api' })

  await assert.rejects(() => model.rename(web.id, '   '), /vacío/)
  await assert.rejects(() => model.rename(web.id, 'x'.repeat(81)), /80/)
  await assert.rejects(() => model.rename(web.id, 'API'), /otro proyecto/)

  const renamed = await model.rename(web.id, '  Web nueva ')
  assert.equal(renamed.name, 'Web nueva')
  assert.equal(renamed.path, '/work/web')
})

test('guarda el contexto y respeta el límite', async () => {
  const { model } = createModel()
  const web = await model.add({ name: 'Web', path: '/work/web' })

  const updated = await model.updateContext(web.id, 'Tienda online en Astro.')
  assert.equal(updated.context, 'Tienda online en Astro.')
  await assert.rejects(() => model.updateContext(web.id, 'x'.repeat(20001)), /20000/)
})

test('marca la carpeta movida y permite localizarla sin perder nombre ni contexto', async () => {
  const { model, folders } = createModel()
  const web = await model.add({ name: 'Web', path: '/work/web' })
  await model.updateContext(web.id, 'Contexto')
  folders.delete('/work/web')

  const missing = await model.getById(web.id)
  assert.equal(missing.folderExists, false)

  const relocated = await model.relocate(web.id, '/work/moved')
  assert.equal(relocated.folderExists, true)
  assert.equal(relocated.name, 'Web')
  assert.equal(relocated.context, 'Contexto')
})

test('quitar un proyecto solo lo elimina de Skima', async () => {
  const { model, folders } = createModel()
  const web = await model.add({ name: 'Web', path: '/work/web' })
  const remaining = await model.remove(web.id)

  assert.deepEqual(remaining, [])
  assert.equal(folders.has('/work/web'), true)
})
