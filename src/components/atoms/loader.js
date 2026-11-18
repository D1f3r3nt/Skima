export function createLoader({ label, description = '', inline = false, className = '' }) {
  const loaderElement = document.createElement('div')
  loaderElement.className = ['loader', inline ? 'loader--inline' : '', className].filter(Boolean).join(' ')
  loaderElement.setAttribute('role', 'status')
  loaderElement.setAttribute('aria-live', 'polite')
  loaderElement.setAttribute('aria-busy', 'true')

  const spinnerElement = document.createElement('span')
  spinnerElement.className = 'loader__spinner'
  spinnerElement.setAttribute('aria-hidden', 'true')

  const textElement = document.createElement('span')
  textElement.className = 'loader__text'
  const labelElement = document.createElement('span')
  labelElement.className = 'loader__label'
  labelElement.textContent = label
  textElement.append(labelElement)

  const descriptionElement = document.createElement('span')
  descriptionElement.className = 'loader__description'
  descriptionElement.textContent = description
  descriptionElement.hidden = !description
  textElement.append(descriptionElement)

  loaderElement.append(spinnerElement, textElement)

  return Object.assign(loaderElement, {
    setLabel: (nextLabel, nextDescription = descriptionElement.textContent) => {
      labelElement.textContent = nextLabel
      descriptionElement.textContent = nextDescription
      descriptionElement.hidden = !nextDescription
    }
  })
}
