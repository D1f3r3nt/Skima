const relativeTimeFormatter = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })
const numberFormatter = new Intl.NumberFormat('es')
const compactNumberFormatter = new Intl.NumberFormat('es', { notation: 'compact', maximumFractionDigits: 1 })
const dateFormatter = new Intl.DateTimeFormat('es', { dateStyle: 'medium' })

const relativeUnits = [
  { unit: 'year', milliseconds: 365 * 24 * 60 * 60 * 1000 },
  { unit: 'month', milliseconds: 30 * 24 * 60 * 60 * 1000 },
  { unit: 'week', milliseconds: 7 * 24 * 60 * 60 * 1000 },
  { unit: 'day', milliseconds: 24 * 60 * 60 * 1000 },
  { unit: 'hour', milliseconds: 60 * 60 * 1000 },
  { unit: 'minute', milliseconds: 60 * 1000 }
]

export const formatRelativeTime = (isoDate, now = Date.now()) => {
  if (!isoDate) {
    return 'nunca'
  }
  const difference = Date.parse(isoDate) - now
  const unit = relativeUnits.find((candidate) => Math.abs(difference) >= candidate.milliseconds)
  return unit
    ? relativeTimeFormatter.format(Math.round(difference / unit.milliseconds), unit.unit)
    : 'hace un momento'
}

export const formatNumber = (value) => numberFormatter.format(value ?? 0)

export const formatCompactNumber = (value) => compactNumberFormatter.format(value ?? 0)

export const formatDate = (isoDate) => (isoDate ? dateFormatter.format(new Date(isoDate)) : '—')

export const formatTime = (timestamp) => new Date(timestamp).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
