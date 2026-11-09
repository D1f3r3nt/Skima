import { createNoticeBanner } from '../molecules/noticeBanner.js'

const statusTexts = { pending: 'Cambios sin guardar…', saving: 'Guardando…', saved: 'Guardado', error: 'No se ha podido guardar; se reintentará.' }
const placeholder = [
  'Ejemplo:',
  'Tienda online de cerámica hecha con Astro + TypeScript y Stripe.',
  'Convenciones: componentes en src/components con camelCase, sin dependencias nuevas sin preguntar.',
  'Qué espero de los agentes: cambios pequeños con tests, explicar los riesgos antes de tocar pagos.'
].join('\n')

export function createProjectContextEditor({ value, maxLength, onChange }) {
  const sectionElement = document.createElement('section')
  sectionElement.className = 'context-editor'

  const headerElement = document.createElement('div')
  headerElement.className = 'context-editor__header'
  const labelElement = document.createElement('label')
  labelElement.className = 'context-editor__label'
  labelElement.htmlFor = 'projectContext'
  labelElement.textContent = 'Contexto del proyecto'
  const statusElement = document.createElement('span')
  statusElement.className = 'context-editor__status'
  statusElement.setAttribute('role', 'status')
  statusElement.setAttribute('aria-live', 'polite')
  headerElement.append(labelElement, statusElement)

  const helpElement = document.createElement('p')
  helpElement.className = 'context-editor__help'
  helpElement.id = 'projectContextHelp'
  helpElement.textContent = 'Explica de qué va el proyecto, las tecnologías, las convenciones y qué esperas de los agentes. Se guarda solo en Skima, no en la carpeta del proyecto.'

  const textareaElement = document.createElement('textarea')
  textareaElement.id = 'projectContext'
  textareaElement.className = 'text-area context-editor__textarea'
  textareaElement.value = value
  textareaElement.maxLength = maxLength
  textareaElement.placeholder = placeholder
  textareaElement.rows = 10
  textareaElement.spellcheck = true
  textareaElement.setAttribute('aria-describedby', 'projectContextHelp projectContextCounter')

  const footerElement = document.createElement('div')
  footerElement.className = 'context-editor__footer'
  const counterElement = document.createElement('span')
  counterElement.id = 'projectContextCounter'
  counterElement.className = 'context-editor__counter'
  footerElement.append(counterElement)

  const updateCounter = () => {
    counterElement.textContent = `${textareaElement.value.length.toLocaleString('es')} / ${maxLength.toLocaleString('es')} caracteres`
    counterElement.classList.toggle('context-editor__counter--near', textareaElement.value.length > maxLength * 0.9)
  }
  updateCounter()

  textareaElement.addEventListener('input', () => {
    updateCounter()
    onChange(textareaElement.value)
  })

  sectionElement.append(
    headerElement,
    helpElement,
    textareaElement,
    footerElement,
    createNoticeBanner({ variant: 'info', text: 'Este texto puede enviarse a tus agentes de IA cuando lances un prompt desde este proyecto. No escribas contraseñas, claves ni otros secretos.' })
  )

  return {
    element: sectionElement,
    setStatus: (status) => {
      statusElement.textContent = statusTexts[status] ?? ''
      statusElement.className = `context-editor__status context-editor__status--${status}`
    }
  }
}
