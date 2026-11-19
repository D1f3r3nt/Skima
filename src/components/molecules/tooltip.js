let tooltipCount = 0

export function createTooltip({ trigger, title = '', paragraphs = [], align = 'end' }) {
  tooltipCount += 1
  const wrapperElement = document.createElement('span')
  wrapperElement.className = 'tooltip'

  const bubbleElement = document.createElement('div')
  bubbleElement.className = `tooltip__bubble tooltip__bubble--${align}`
  bubbleElement.id = `tooltip${tooltipCount}`
  bubbleElement.setAttribute('role', 'tooltip')

  if (title) {
    const titleElement = document.createElement('strong')
    titleElement.textContent = title
    bubbleElement.append(titleElement)
  }
  bubbleElement.append(...paragraphs.map((text) => {
    const paragraphElement = document.createElement('p')
    paragraphElement.textContent = text
    return paragraphElement
  }))

  trigger.setAttribute('aria-describedby', bubbleElement.id)
  wrapperElement.append(trigger, bubbleElement)
  return wrapperElement
}
