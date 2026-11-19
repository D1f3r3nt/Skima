import { createButton } from '../atoms/button.js'
import { createTextInput } from '../atoms/textInput.js'
import { createIcon } from '../atoms/icon.js'
import { createFormField } from '../molecules/formField.js'
import { createFolderInput } from '../molecules/folderInput.js'
import { createModal } from './modal.js'

let formCount = 0

export function createMemoryFormModal({ onPickFolder, buildTargetPath, onSubmit, nameMaxLength = 60, onClose = null }) {
  formCount += 1
  const formId = `memoryForm${formCount}`
  const formElement = document.createElement('form')
  formElement.id = formId
  formElement.className = 'project-form memory-form'
  formElement.noValidate = true

  const nameInput = createTextInput({ id: `${formId}Name`, name: 'memoryName', placeholder: 'Mi memoria' })
  nameInput.maxLength = nameMaxLength
  const nameField = createFormField({ id: `${formId}Name`, label: 'Nombre de la memoria', control: nameInput })

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
        updateTarget()
      }
    } catch (error) {
      pathField.setError(error.message)
    } finally {
      isPickingFolder = false
    }
  }

  const folderInput = createFolderInput({ id: `${formId}Path`, placeholder: 'Haz clic para elegir dónde crearla', onPick: pickFolder })
  const pathField = createFormField({ id: `${formId}Path`, label: 'Ruta donde crear la memoria', control: folderInput.element })

  const targetElement = document.createElement('p')
  targetElement.className = 'memory-form__target'
  const targetTextElement = document.createElement('span')
  targetElement.append(createIcon('folder', { size: 14 }), targetTextElement)

  const updateTarget = () => {
    const targetPath = buildTargetPath(folderInput.getValue(), nameInput.value)
    targetTextElement.textContent = targetPath ? `Se creará la carpeta ${targetPath}` : 'Escribe un nombre y elige una ruta para ver la carpeta que se creará.'
    targetElement.classList.toggle('memory-form__target--empty', !targetPath)
    targetElement.title = targetPath
  }

  const formErrorElement = document.createElement('p')
  formErrorElement.className = 'project-form__error'
  formErrorElement.hidden = true

  formElement.append(nameField.element, pathField.element, targetElement, formErrorElement)
  updateTarget()

  const cancelButton = createButton({ label: 'Cancelar', variant: 'secondary' })
  const submitButton = createButton({ label: 'Crear memoria', type: 'submit', variant: 'primary' })
  submitButton.setAttribute('form', formId)

  const modal = createModal({ title: 'Nueva memoria', content: formElement, actions: [cancelButton, submitButton], onClose })

  cancelButton.addEventListener('click', () => modal.close())
  nameInput.addEventListener('input', () => {
    nameField.setError('')
    updateTarget()
  })

  const showFormError = (message) => {
    formErrorElement.textContent = message ?? ''
    formErrorElement.hidden = !message
  }

  formElement.addEventListener('submit', async (event) => {
    event.preventDefault()
    showFormError('')
    const name = nameInput.value.trim()
    const parentPath = folderInput.getValue().trim()
    nameField.setError(name ? '' : 'Escribe un nombre para la memoria.')
    pathField.setError(parentPath ? '' : 'Elige la carpeta donde crearla.')
    if (!name || !parentPath) {
      return
    }
    if (!buildTargetPath(parentPath, name)) {
      nameField.setError('El nombre debe incluir al menos una letra o un número.')
      return
    }
    submitButton.disabled = true
    try {
      await onSubmit({ name, parentPath })
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
