import { createButton } from '../atoms/button.js'
import { getProgressLabel, getProgressPercent, isLastStep } from '../../core/renderer/services/wizardEngine.js'

const createField = ({ field, value, onInput, id }) => {
  const wrapperElement = document.createElement('div')
  wrapperElement.className = 'form-field'
  const labelElement = document.createElement('label')
  labelElement.className = 'form-field__label'
  labelElement.htmlFor = id
  labelElement.textContent = field.label
  const textareaElement = document.createElement('textarea')
  textareaElement.id = id
  textareaElement.className = 'text-area wizard__textarea'
  textareaElement.rows = field.rows ?? 5
  textareaElement.value = value ?? ''
  textareaElement.placeholder = field.placeholder ?? ''
  textareaElement.addEventListener('input', () => onInput(textareaElement.value))
  wrapperElement.append(labelElement, textareaElement)
  return wrapperElement
}

export function createQuestionStep({ step, index, total, answers, onChange, onBack, onNext, nextLabel = 'Siguiente', lastLabel = 'Ver vista previa' }) {
  const sectionElement = document.createElement('section')
  sectionElement.className = 'question-step'

  const progressElement = document.createElement('div')
  progressElement.className = 'question-step__progress'
  const progressText = document.createElement('p')
  progressText.className = 'question-step__progress-text'
  progressText.setAttribute('role', 'status')
  progressText.textContent = getProgressLabel(index, total)
  const progressBar = document.createElement('progress')
  progressBar.max = 100
  progressBar.value = getProgressPercent(index, total)
  progressBar.setAttribute('aria-label', 'Progreso del asistente')
  progressElement.append(progressText, progressBar)

  const titleElement = document.createElement('h2')
  titleElement.className = 'question-step__title'
  titleElement.textContent = step.title

  const helpElement = document.createElement('p')
  helpElement.className = 'question-step__help'
  helpElement.textContent = step.help

  const exampleElement = document.createElement('p')
  exampleElement.className = 'question-step__example'
  const exampleLabel = document.createElement('strong')
  exampleLabel.textContent = 'Ejemplo: '
  exampleElement.append(exampleLabel, document.createTextNode(step.example))

  const fieldsElement = document.createElement('div')
  fieldsElement.className = 'question-step__fields'
  step.fields.forEach((field) => {
    fieldsElement.append(createField({
      field,
      id: `question-${step.id}-${field.key}`,
      value: answers[field.key],
      onInput: (value) => onChange({ [field.key]: value })
    }))
  })

  const actionsElement = document.createElement('div')
  actionsElement.className = 'wizard__actions'
  const backButton = createButton({ label: 'Atrás', variant: 'secondary', onClick: onBack })
  backButton.disabled = index === 0
  actionsElement.append(backButton, createButton({ label: isLastStep(index, total) ? lastLabel : nextLabel, onClick: onNext }))

  sectionElement.append(progressElement, titleElement, helpElement, exampleElement, fieldsElement, actionsElement)
  queueMicrotask(() => fieldsElement.querySelector('textarea')?.focus())
  return sectionElement
}
