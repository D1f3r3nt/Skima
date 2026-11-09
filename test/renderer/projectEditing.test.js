const test = require('node:test')
const assert = require('node:assert/strict')

const loadModule = (relativePath) => import(require('node:url').pathToFileURL(require('node:path').join(__dirname, '..', '..', relativePath)).href)

test('renombrar: Enter guarda, Escape cancela, vacío y demasiado largo no se guardan', async () => {
  const { createInlineEditState } = await loadModule('src/core/renderer/services/inlineEditState.js')
  const saved = []
  const editor = createInlineEditState({ value: 'Web', maxLength: 10, save: async (name) => { saved.push(name); return name } })

  editor.begin()
  editor.setDraft('Otro nombre')
  editor.cancel()
  assert.equal(editor.getState().mode, 'view')
  assert.equal(editor.getState().value, 'Web')

  editor.begin()
  editor.setDraft('   ')
  await editor.commit()
  assert.equal(editor.getState().mode, 'edit')
  assert.match(editor.getState().error, /vacío/)

  editor.setDraft('x'.repeat(11))
  await editor.commit()
  assert.match(editor.getState().error, /10/)

  editor.setDraft('  Tienda  ')
  await editor.commit()
  assert.deepEqual(saved, ['Tienda'])
  assert.equal(editor.getState().mode, 'view')
  assert.equal(editor.getState().value, 'Tienda')
})

test('renombrar: un nombre duplicado rechazado por el proceso main deja el campo en edición con el error', async () => {
  const { createInlineEditState } = await loadModule('src/core/renderer/services/inlineEditState.js')
  const editor = createInlineEditState({ value: 'Web', save: async () => { throw new Error('Ya hay otro proyecto con ese nombre.') } })
  editor.begin()
  editor.setDraft('Api')
  await editor.commit()
  assert.equal(editor.getState().mode, 'edit')
  assert.match(editor.getState().error, /otro proyecto/)
  assert.equal(editor.getState().value, 'Web')
})

test('el contexto se guarda solo tras dejar de escribir y flush guarda lo pendiente al cerrar', async () => {
  const { createAutosave } = await loadModule('src/core/renderer/services/autosave.js')
  const timers = []
  const saved = []
  const statuses = []
  const autosave = createAutosave({
    save: async (value) => saved.push(value),
    setTimer: (callback) => { timers.push(callback); return timers.length },
    clearTimer: () => {},
    onStatus: (status) => statuses.push(status)
  })

  autosave.change('a')
  autosave.change('ab')
  autosave.change('abc')
  assert.equal(saved.length, 0)
  assert.equal(autosave.hasPending(), true)

  await autosave.flush()
  assert.deepEqual(saved, ['abc'])
  assert.equal(autosave.hasPending(), false)
  assert.equal(statuses.at(-1), 'saved')

  await autosave.flush()
  assert.deepEqual(saved, ['abc'])
})

test('si el guardado falla el cambio sigue pendiente y se reintenta', async () => {
  const { createAutosave } = await loadModule('src/core/renderer/services/autosave.js')
  let shouldFail = true
  const saved = []
  const autosave = createAutosave({
    save: async (value) => {
      if (shouldFail) {
        throw new Error('disco lleno')
      }
      saved.push(value)
    },
    setTimer: () => 1,
    clearTimer: () => {}
  })
  autosave.change('texto')
  await autosave.flush()
  assert.equal(autosave.hasPending(), true)
  shouldFail = false
  await autosave.flush()
  assert.deepEqual(saved, ['texto'])
})

test('el registro de trabajo pendiente vacía todo antes de salir', async () => {
  const { registerPendingWork, hasPendingWork, flushPendingWork } = await loadModule('src/core/renderer/services/pendingWork.js')
  let pending = true
  const unregister = registerPendingWork({ hasPending: () => pending, flush: async () => { pending = false } })
  assert.equal(hasPendingWork(), true)
  await flushPendingWork()
  assert.equal(hasPendingWork(), false)
  unregister()
})

test('el filtro de skills instaladas busca por texto y por agente', async () => {
  const { filterInstalledSkills, listAgentFilterOptions } = await loadModule('src/core/renderer/services/installedFilter.js')
  const skills = [
    { name: 'pdf', folderName: 'pdf', description: 'Trabaja con PDF', agentIds: ['claude-code'], agentNames: ['Claude Code'], origin: { label: 'anthropics/skills' } },
    { name: 'review', folderName: 'review', description: 'Revisión de código', agentIds: ['codex', 'amp'], agentNames: ['Codex (OpenAI)', 'Amp'], origin: { label: 'Instalada manualmente' } }
  ]
  assert.deepEqual(filterInstalledSkills(skills, { query: 'revision' }).map((skill) => skill.name), ['review'])
  assert.deepEqual(filterInstalledSkills(skills, { agentId: 'claude-code' }).map((skill) => skill.name), ['pdf'])
  assert.deepEqual(filterInstalledSkills(skills, { query: 'anthropics' }).map((skill) => skill.name), ['pdf'])
  assert.deepEqual(listAgentFilterOptions(skills).map((option) => option.value), ['amp', 'claude-code', 'codex'])
})
