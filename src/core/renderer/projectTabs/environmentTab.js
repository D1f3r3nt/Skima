import { createButton } from '../../../components/atoms/button.js'
import { createNoticeBanner } from '../../../components/molecules/noticeBanner.js'
import { confirmDialog } from '../../../components/organisms/confirmDialog.js'
import { showToast } from '../../../components/molecules/toast.js'
import { createRowsFromEntries, createEmptyRow, isRowDirty, validateRows, buildChanges, suggestKeys } from '../services/envRowsDraft.js'

let datalistCounter = 0

export function createEnvironmentTab({ apiClient, project }) {
  datalistCounter += 1
  const datalistId = `envKeySuggestions${datalistCounter}`
  let state = null
  let rows = []
  let revealedRowIds = new Set()
  let isSaving = false
  let isDisposed = false

  const panelElement = document.createElement('section')
  panelElement.className = 'env-tab'

  const headerElement = document.createElement('div')
  headerElement.className = 'env-tab__header'
  const titleElement = document.createElement('h3')
  titleElement.className = 'settings-group__title'
  titleElement.textContent = 'Variables de entorno (.env)'
  const descriptionElement = document.createElement('p')
  descriptionElement.className = 'settings-group__description'
  descriptionElement.textContent = 'Los valores solo se leen y se escriben en el .env de este proyecto. Skima no los guarda en sus ajustes, ni en la caché, ni en los registros, y nunca los envía a una IA.'
  headerElement.append(titleElement, descriptionElement)

  const noticesElement = document.createElement('div')
  noticesElement.className = 'env-tab__notices'
  const datalistElement = document.createElement('datalist')
  datalistElement.id = datalistId
  const listElement = document.createElement('div')
  listElement.className = 'env-tab__rows'
  listElement.setAttribute('role', 'list')
  const footerElement = document.createElement('div')
  footerElement.className = 'env-tab__footer'

  panelElement.append(headerElement, noticesElement, datalistElement, listElement, footerElement)
  listElement.textContent = 'Leyendo el .env del proyecto…'

  const addButton = createButton({ label: 'Añadir variable', icon: 'plus', variant: 'secondary', size: 'small', onClick: () => addRow() })
  const discardButton = createButton({ label: 'Descartar cambios', variant: 'ghost', size: 'small', onClick: () => discardChanges() })
  const saveButton = createButton({ label: 'Guardar cambios', icon: 'check', size: 'small', onClick: () => saveChanges() })
  footerElement.append(addButton, discardButton, saveButton)

  const hasDirtyRows = () => rows.some(isRowDirty)

  const updateFooter = () => {
    const errors = validateRows(rows)
    const dirty = hasDirtyRows()
    saveButton.disabled = isSaving || !dirty || Object.keys(errors).length > 0
    discardButton.disabled = isSaving || !dirty
    return errors
  }

  const renderNotices = () => {
    const notices = []
    if (state.git.isRepository && state.git.isIgnored === false) {
      notices.push(createNoticeBanner({
        variant: 'warning',
        text: 'El .env de este proyecto no está ignorado por git: podrías subir tus secretos al repositorio.',
        actionLabel: 'Añadir .env al .gitignore',
        onAction: () => addToGitignore()
      }))
    }
    if (state.entries.some((entry) => entry.isDuplicated)) {
      notices.push(createNoticeBanner({ variant: 'warning', text: 'Hay variables repetidas en el .env. Se muestra la última, que es la que se usa; al guardarla solo se cambia esa línea.' }))
    }
    const otherFiles = state.relatedFiles.filter((fileName) => fileName !== '.env')
    if (otherFiles.length > 0) {
      notices.push(createNoticeBanner({ variant: 'info', text: `También hay ${otherFiles.join(', ')}. Skima solo edita .env; ${state.exampleKeys.length > 0 ? 'los nombres de .env.example se sugieren al añadir una variable.' : 'los demás archivos no se tocan.'}` }))
    }
    noticesElement.replaceChildren(...notices)
    datalistElement.replaceChildren(...suggestKeys(state.exampleKeys, rows).map((key) => {
      const optionElement = document.createElement('option')
      optionElement.value = key
      return optionElement
    }))
  }

  const createValueField = (row, isEditable) => {
    const wrapperElement = document.createElement('div')
    wrapperElement.className = 'env-row__value'
    const inputElement = document.createElement('input')
    inputElement.className = 'text-input env-row__value-input'
    inputElement.type = revealedRowIds.has(row.id) ? 'text' : 'password'
    inputElement.value = row.value
    inputElement.readOnly = !isEditable
    inputElement.autocomplete = 'off'
    inputElement.spellcheck = false
    inputElement.setAttribute('aria-label', row.key ? `Valor de ${row.key}` : 'Valor de la variable')
    inputElement.addEventListener('input', () => {
      row.value = inputElement.value
      refreshValidation()
    })
    const revealButton = createButton({
      icon: revealedRowIds.has(row.id) ? 'eyeOff' : 'eye',
      variant: 'ghost',
      size: 'small',
      ariaLabel: revealedRowIds.has(row.id) ? `Ocultar el valor${row.key ? ` de ${row.key}` : ''}` : `Mostrar el valor${row.key ? ` de ${row.key}` : ''}`,
      onClick: () => {
        if (revealedRowIds.has(row.id)) {
          revealedRowIds.delete(row.id)
        } else {
          revealedRowIds.add(row.id)
        }
        renderRows()
      }
    })
    revealButton.setAttribute('aria-pressed', String(revealedRowIds.has(row.id)))
    wrapperElement.append(inputElement, revealButton)
    return wrapperElement
  }

  const createKeyField = (row) => {
    if (!row.isEditing) {
      const labelElement = document.createElement('span')
      labelElement.className = 'env-row__key'
      labelElement.textContent = row.key
      return labelElement
    }
    const inputElement = document.createElement('input')
    inputElement.className = 'text-input env-row__key-input'
    inputElement.type = 'text'
    inputElement.value = row.key
    inputElement.placeholder = 'NOMBRE_VARIABLE'
    inputElement.autocomplete = 'off'
    inputElement.spellcheck = false
    inputElement.setAttribute('list', datalistId)
    inputElement.setAttribute('aria-label', 'Nombre de la variable')
    inputElement.dataset.rowId = row.id
    inputElement.addEventListener('input', () => {
      row.key = inputElement.value
      refreshValidation()
    })
    return inputElement
  }

  const createRowElement = (row) => {
    const rowElement = document.createElement('div')
    rowElement.className = 'env-row'
    rowElement.setAttribute('role', 'listitem')
    rowElement.dataset.rowId = row.id

    const errorElement = document.createElement('p')
    errorElement.className = 'env-row__error'
    errorElement.id = `${row.id}Error`
    errorElement.setAttribute('role', 'alert')

    const actionsElement = document.createElement('div')
    actionsElement.className = 'env-row__actions'
    if (row.originalKey !== null && !row.isEditing) {
      actionsElement.append(createButton({ icon: 'editor', variant: 'ghost', size: 'small', ariaLabel: `Editar ${row.key}`, onClick: () => { row.isEditing = true; renderRows() } }))
    }
    if (row.originalKey !== null && row.isEditing) {
      actionsElement.append(createButton({ icon: 'arrowLeft', variant: 'ghost', size: 'small', ariaLabel: `Deshacer los cambios de ${row.originalKey}`, onClick: () => { Object.assign(row, { key: row.originalKey, value: row.originalValue, isEditing: false }); renderRows() } }))
    }
    actionsElement.append(createButton({
      icon: 'trash',
      variant: 'ghost',
      size: 'small',
      ariaLabel: row.originalKey ? `Eliminar ${row.originalKey}` : 'Quitar esta fila',
      onClick: () => removeRow(row)
    }))

    rowElement.append(createKeyField(row), createValueField(row, row.isEditing), actionsElement, errorElement)
    return rowElement
  }

  const refreshValidation = () => {
    const errors = updateFooter()
    rows.forEach((row) => {
      const rowElement = listElement.querySelector(`[data-row-id="${row.id}"]`)
      if (!rowElement) {
        return
      }
      const message = errors[row.id] ?? ''
      rowElement.querySelector('.env-row__error').textContent = message
      const keyInput = rowElement.querySelector('.env-row__key-input')
      if (keyInput) {
        keyInput.setAttribute('aria-invalid', String(Boolean(message)))
        keyInput.setAttribute('aria-describedby', `${row.id}Error`)
      }
    })
  }

  const renderRows = () => {
    if (rows.length === 0) {
      const emptyElement = document.createElement('p')
      emptyElement.className = 'settings-group__description'
      emptyElement.textContent = 'El .env no tiene variables.'
      listElement.replaceChildren(emptyElement)
    } else {
      listElement.replaceChildren(...rows.map(createRowElement))
    }
    renderNotices()
    refreshValidation()
  }

  const applyState = (nextState, { keepDirty = false } = {}) => {
    const pendingRows = keepDirty ? rows.filter(isRowDirty) : []
    state = nextState
    rows = createRowsFromEntries(state.entries)
    pendingRows.forEach((pendingRow) => {
      const existing = pendingRow.originalKey ? rows.find((row) => row.originalKey === pendingRow.originalKey) : null
      if (existing) {
        Object.assign(existing, { key: pendingRow.key, value: pendingRow.value, isEditing: true })
      } else if (!pendingRow.originalKey) {
        rows.push(pendingRow)
      }
    })
    if (!state.exists && rows.length === 0) {
      rows.push(createEmptyRow())
    }
    renderRows()
  }

  const addRow = () => {
    const row = createEmptyRow()
    rows.push(row)
    renderRows()
    listElement.querySelector(`.env-row__key-input[data-row-id="${row.id}"]`)?.focus()
  }

  const discardChanges = async () => {
    const accepted = await confirmDialog({ title: 'Descartar cambios', message: 'Se perderán los cambios que no has guardado en el .env.', confirmLabel: 'Descartar', isDestructive: true })
    if (accepted) {
      applyState(state)
    }
  }

  const showSaveError = (error) => {
    if (error.code === 'ENV_CHANGED_ON_DISK') {
      noticesElement.prepend(createNoticeBanner({ variant: 'warning', text: error.message, actionLabel: 'Volver a cargar', onAction: () => load({ keepDirty: true }) }))
      return
    }
    showToast({ message: error.message, variant: 'error' })
  }

  const runSave = async (changes, { keepDirty }) => {
    isSaving = true
    updateFooter()
    try {
      const result = await apiClient.saveProjectEnv(project.id, { revision: state.revision, changes })
      if (!result.saved) {
        showSaveError(result.error)
        return false
      }
      applyState(result.state, { keepDirty })
      return true
    } catch (error) {
      showToast({ message: error.message, variant: 'error' })
      return false
    } finally {
      isSaving = false
      if (!isDisposed) {
        updateFooter()
      }
    }
  }

  const saveChanges = async () => {
    const changes = buildChanges(rows)
    const fileExisted = state.exists
    const saved = await runSave(changes, { keepDirty: false })
    if (saved) {
      showToast({ message: fileExisted ? 'Variables guardadas en el .env.' : 'Se ha creado el .env del proyecto.', variant: 'success' })
    }
  }

  const removeRow = async (row) => {
    if (row.originalKey === null) {
      rows = rows.filter((candidate) => candidate.id !== row.id)
      if (rows.length === 0 && !state.exists) {
        rows.push(createEmptyRow())
      }
      renderRows()
      return
    }
    const accepted = await confirmDialog({
      title: `Eliminar ${row.originalKey}`,
      message: `Se quitará ${row.originalKey} del .env del proyecto. El resto del archivo no cambia.`,
      confirmLabel: 'Eliminar',
      isDestructive: true
    })
    if (accepted) {
      rows = rows.filter((candidate) => candidate.id !== row.id)
      await runSave([{ type: 'delete', key: row.originalKey }], { keepDirty: true })
    }
  }

  const addToGitignore = async () => {
    try {
      state = { ...state, git: await apiClient.addEnvToGitignore(project.id) }
      renderNotices()
      showToast({ message: 'Se ha añadido .env al .gitignore del proyecto.', variant: 'success' })
    } catch (error) {
      showToast({ message: error.message, variant: 'error' })
    }
  }

  const load = async ({ keepDirty = false } = {}) => {
    try {
      const nextState = await apiClient.readProjectEnv(project.id)
      if (!isDisposed) {
        applyState(nextState, { keepDirty })
      }
    } catch (error) {
      if (!isDisposed) {
        listElement.replaceChildren(createNoticeBanner({ variant: 'error', text: error.message, actionLabel: 'Reintentar', onAction: () => load() }))
      }
    }
  }

  load()

  return {
    element: panelElement,
    dispose: () => {
      isDisposed = true
      revealedRowIds = new Set()
      rows = []
      state = null
      panelElement.replaceChildren()
    }
  }
}
