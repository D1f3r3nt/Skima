import { createToggleSwitch } from '../atoms/toggleSwitch.js'

export function createToggleRow({ label, checked = true, onChange }) {
  const rowElement = document.createElement('div')
  rowElement.className = 'toggle-row'

  const labelElement = document.createElement('span')
  labelElement.className = 'toggle-row__label'
  labelElement.textContent = label

  const toggle = createToggleSwitch({ checked, label, onChange })
  rowElement.append(labelElement, toggle.element)
  rowElement.addEventListener('click', (event) => {
    if (!toggle.element.contains(event.target)) {
      toggle.element.click()
    }
  })

  return { element: rowElement, setChecked: toggle.setChecked, isChecked: toggle.isChecked }
}
