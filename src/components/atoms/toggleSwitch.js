export function createToggleSwitch({ checked = false, label, onChange, disabled = false }) {
  const buttonElement = document.createElement('button')
  buttonElement.type = 'button'
  buttonElement.className = 'toggle-switch'
  buttonElement.setAttribute('role', 'switch')
  buttonElement.setAttribute('aria-label', label)
  buttonElement.disabled = disabled

  const thumbElement = document.createElement('span')
  thumbElement.className = 'toggle-switch__thumb'
  buttonElement.append(thumbElement)

  let isChecked = Boolean(checked)
  const setChecked = (value) => {
    isChecked = Boolean(value)
    buttonElement.setAttribute('aria-checked', String(isChecked))
    buttonElement.classList.toggle('toggle-switch--on', isChecked)
  }
  setChecked(isChecked)

  buttonElement.addEventListener('click', () => {
    const nextValue = !isChecked
    setChecked(nextValue)
    onChange?.(nextValue, { revert: () => setChecked(!nextValue) })
  })

  return { element: buttonElement, setChecked, isChecked: () => isChecked }
}
