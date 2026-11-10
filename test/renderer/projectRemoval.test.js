const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { ProjectModel } = require('../../src/core/main/models/projectModel')
const { ProjectDataStore } = require('../../src/core/main/projects/projectDataStore')
const { SettingsStore } = require('../../src/core/main/settings/settingsStore')
const { FileSystemService } = require('../../src/core/main/services/fileSystemService')
const { createPlatformPaths } = require('../../src/core/main/platform/platformPaths')
const { MemoryStorage } = require('../helpers/memoryStorage')

const loadModule = (relativePath) => import(require('node:url').pathToFileURL(path.join(__dirname, '..', '..', relativePath)).href)

test('el botón de quitar solo se activa con la palabra eliminar', async () => {
  const { matchesConfirmationWord } = await loadModule('src/core/renderer/services/confirmationWord.js')
  assert.equal(matchesConfirmationWord('eliminar', 'eliminar'), true)
  assert.equal(matchesConfirmationWord('  ELIMINAR  ', 'eliminar'), true)
  assert.equal(matchesConfirmationWord('Eliminar\n', 'eliminar'), true)
  assert.equal(matchesConfirmationWord('eliminar proyecto', 'eliminar'), false)
  assert.equal(matchesConfirmationWord('elimina', 'eliminar'), false)
  assert.equal(matchesConfirmationWord('', 'eliminar'), false)
})

test('quitar el proyecto no borra archivos de su carpeta y conserva .skima', async () => {
  const projectPath = fs.mkdtempSync(path.join(os.tmpdir(), 'skima-remove-'))
  try {
    fs.writeFileSync(path.join(projectPath, 'index.js'), 'console.log(1)\n')
    const platformPaths = createPlatformPaths()
    const model = new ProjectModel({
      settingsStore: new SettingsStore({ storage: new MemoryStorage() }),
      platformPaths,
      fileSystemService: new FileSystemService(),
      projectDataStore: new ProjectDataStore({ platformPaths })
    })
    const project = await model.add({ name: 'Prueba', path: projectPath })
    assert.equal(fs.existsSync(path.join(projectPath, '.skima', 'config.json')), true)

    const remaining = await model.remove(project.id)
    assert.deepEqual(remaining, [])
    assert.equal(fs.readFileSync(path.join(projectPath, 'index.js'), 'utf-8'), 'console.log(1)\n')
    assert.equal(fs.existsSync(path.join(projectPath, '.skima', 'config.json')), true)
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
  }
})
