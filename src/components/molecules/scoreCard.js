import { createIcon } from '../atoms/icon.js'

const formatFactorValue = (factor) => {
  if (factor.value === null || factor.value === undefined) {
    return '—'
  }
  if (typeof factor.value === 'boolean') {
    return factor.value ? 'Sí' : 'No'
  }
  if (factor.id === 'activity') {
    return `hace ${factor.value} días`
  }
  return String(factor.value)
}

const getScoreTone = (score) => (score >= 7.5 ? 'high' : score >= 5 ? 'medium' : 'low')

const createBreakdownRow = (factor) => {
  const rowElement = document.createElement('li')
  rowElement.className = 'score-card__row'
  rowElement.title = factor.explanation ?? ''

  const labelElement = document.createElement('span')
  labelElement.className = 'score-card__row-label'
  labelElement.textContent = factor.label

  const valueElement = document.createElement('span')
  valueElement.className = 'score-card__row-value'
  valueElement.textContent = factor.maxPoints === undefined ? '' : formatFactorValue(factor)

  const barElement = document.createElement('span')
  barElement.className = 'score-card__bar'
  const fillElement = document.createElement('span')
  fillElement.className = 'score-card__bar-fill'
  fillElement.style.width = factor.maxPoints ? `${Math.max(0, (factor.points / factor.maxPoints) * 100)}%` : '0%'
  barElement.append(fillElement)

  const pointsElement = document.createElement('span')
  pointsElement.className = `score-card__row-points${factor.points < 0 ? ' score-card__row-points--negative' : ''}`
  pointsElement.textContent = factor.maxPoints === undefined ? `${factor.points}` : `${factor.points} / ${factor.maxPoints}`

  const explanationElement = document.createElement('span')
  explanationElement.className = 'score-card__row-explanation'
  explanationElement.textContent = factor.explanation ?? ''

  rowElement.append(labelElement, valueElement, barElement, pointsElement, explanationElement)
  return rowElement
}

export function createScoreCard({ score }) {
  const cardElement = document.createElement('section')
  cardElement.className = `score-card score-card--${getScoreTone(score.score)}`
  cardElement.setAttribute('aria-label', 'Puntuación')

  const summaryButton = document.createElement('button')
  summaryButton.type = 'button'
  summaryButton.className = 'score-card__summary'
  summaryButton.setAttribute('aria-expanded', 'false')

  const valueElement = document.createElement('span')
  valueElement.className = 'score-card__value'
  valueElement.textContent = score.score.toFixed(1)

  const scaleElement = document.createElement('span')
  scaleElement.className = 'score-card__scale'
  scaleElement.textContent = `/ ${score.scale}`

  const captionElement = document.createElement('span')
  captionElement.className = 'score-card__caption'
  captionElement.textContent = 'Ver cómo se calcula'

  summaryButton.append(createIcon('star', { size: 18 }), valueElement, scaleElement, captionElement)

  const breakdownElement = document.createElement('div')
  breakdownElement.className = 'score-card__breakdown'
  breakdownElement.hidden = true

  const listElement = document.createElement('ul')
  listElement.className = 'score-card__list'
  listElement.append(...score.factors.map(createBreakdownRow), ...score.penalties.map(createBreakdownRow))

  const totalElement = document.createElement('p')
  totalElement.className = 'score-card__total'
  totalElement.textContent = `Total: ${score.earnedPoints} de ${score.maxPoints} puntos → ${score.score.toFixed(1)} sobre ${score.scale}. Datos de la API de GitHub.`

  breakdownElement.append(listElement, totalElement)

  summaryButton.addEventListener('click', () => {
    const isExpanded = breakdownElement.hidden
    breakdownElement.hidden = !isExpanded
    summaryButton.setAttribute('aria-expanded', String(isExpanded))
    captionElement.textContent = isExpanded ? 'Ocultar desglose' : 'Ver cómo se calcula'
  })

  cardElement.append(summaryButton, breakdownElement)
  return cardElement
}
