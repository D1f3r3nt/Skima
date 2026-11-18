import { createIcon } from '../atoms/icon.js'

export function createChoiceCardGroup({ ariaLabel, options, value, onChange }) {
  const groupElement = document.createElement('div')
  groupElement.className = 'choice-card-group'
  groupElement.setAttribute('role', 'radiogroup')
  groupElement.setAttribute('aria-label', ariaLabel)

  let selectedValue = value

  const cards = options.map((option) => {
    const cardElement = document.createElement('button')
    cardElement.type = 'button'
    cardElement.className = 'choice-card'
    cardElement.setAttribute('role', 'radio')
    cardElement.dataset.value = option.value

    const iconElement = document.createElement('span')
    iconElement.className = 'choice-card__icon'
    iconElement.append(createIcon(option.icon, { size: 20 }))

    const textElement = document.createElement('span')
    textElement.className = 'choice-card__text'
    const titleElement = document.createElement('span')
    titleElement.className = 'choice-card__title'
    titleElement.textContent = option.label
    textElement.append(titleElement)
    if (option.description) {
      const descriptionElement = document.createElement('span')
      descriptionElement.className = 'choice-card__description'
      descriptionElement.textContent = option.description
      textElement.append(descriptionElement)
    }

    cardElement.append(iconElement, textElement)
    cardElement.addEventListener('click', () => {
      if (selectedValue === option.value) {
        return
      }
      setValue(option.value)
      onChange(option.value)
    })
    groupElement.append(cardElement)
    return cardElement
  })

  const setValue = (nextValue) => {
    selectedValue = nextValue
    cards.forEach((cardElement) => {
      const isSelected = cardElement.dataset.value === nextValue
      cardElement.classList.toggle('choice-card--selected', isSelected)
      cardElement.setAttribute('aria-checked', String(isSelected))
      cardElement.tabIndex = isSelected ? 0 : -1
    })
  }
  setValue(value)

  return { element: groupElement, setValue, getValue: () => selectedValue }
}
