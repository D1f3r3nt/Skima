import { createButton } from '../atoms/button.js'
import { createTextInput } from '../atoms/textInput.js'
import { createFormField } from '../molecules/formField.js'
import { createFolderInput } from '../molecules/folderInput.js'
import { createModal } from './modal.js'

let formCount = 0

const getFolderName = (folderPath) => folderPath.split(/[\\/]/).filter(Boolean).pop() ?? ''

export function createProjectFormModal({ onPickFolder, onSubmit, onClose = null }) {
  formCount += 1
  const formId = `projectForm${formCount}`
  const formElement = document.createElement('form')
  formElement.id = formId
  formElement.className = 'project-form'
  formElement.noValidate = true

  const nameInput = createTextInput({
    id: 'projectName',
    name: 'projectName',
    placeholder: 'Mi proyecto'
  })
  const nameField = createFormField({ id: 'projectName', label: 'Nombre del proyecto', control: nameInput })

  let isPickingFolder = false

  const pickFolder = async () => {
    if (isPickingFolder) {
      return
    }

    isPickingFolder = true

    try {
      const selectedFolder = await onPickFolder()

      if (selectedFolder) {
        folderInput.setValue(selectedFolder)
        pathField.setError('')

        if (!nameInput.value.trim()) {
          nameInput.value = getFolderName(selectedFolder)
          nameField.setError('')
        }
      }
    } catch (error) {
      pathField.setError(error.message)
    } finally {
      isPickingFolder = false
    }
  }

  const folderInput = createFolderInput({
    id: 'projectPath',
    placeholder: 'Haz clic para seleccionar una carpeta',
    onPick: pickFolder
  })
  const pathField = createFormField({ id: 'projectPath', label: 'Ruta del proyecto', control: folderInput.element })

  const formErrorElement = document.createElement('p')
  formErrorElement.className = 'project-form__error'
  formErrorElement.hidden = true

  formElement.append(nameField.element, pathField.element, formErrorElement)

  const cancelButton = createButton({ label: 'Cancelar', variant: 'secondary' })
  const submitButton = createButton({ label: 'Añadir proyecto', type: 'submit', variant: 'primary' })
  submitButton.setAttribute('form', formId)

  const modal = createModal({
    title: 'Nuevo proyecto',
    content: formElement,
    actions: [cancelButton, submitButton],
    onClose
  })

  cancelButton.addEventListener('click', () => modal.close())
  nameInput.addEventListener('input', () => nameField.setError(''))

  const showFormError = (message) => {
    formErrorElement.textContent = message ?? ''
    formErrorElement.hidden = !message
  }

  const validate = () => {
    const projectName = nameInput.value.trim()
    const projectPath = folderInput.getValue().trim()

    nameField.setError(projectName ? '' : 'Escribe un nombre para el proyecto.')
    pathField.setError(projectPath ? '' : 'Selecciona la carpeta del proyecto.')

    return projectName && projectPath ? { name: projectName, path: projectPath } : null
  }

  formElement.addEventListener('submit', async (event) => {
    event.preventDefault()
    showFormError('')

    const project = validate()

    if (!project) {
      return
    }

    submitButton.disabled = true

    try {
      await onSubmit(project)
      modal.close()
    } catch (error) {
      showFormError(error.message)
    } finally {
      submitButton.disabled = false
    }
  })

  return {
    open: () => {
      modal.open()
      nameInput.focus()
    }
  }
}
