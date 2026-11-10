export const clampStep = (index, total) => Math.max(0, Math.min(index, Math.max(0, total - 1)))

export const getProgressLabel = (index, total) => `Paso ${clampStep(index, total) + 1} de ${total}`

export const isLastStep = (index, total) => clampStep(index, total) === total - 1

export const getProgressPercent = (index, total) => Math.round(((clampStep(index, total) + 1) / Math.max(1, total)) * 100)

export const mergeAnswers = (answers, changes) => ({ ...answers, ...changes })

export const countFilledFields = (answers, fieldKeys) => fieldKeys.filter((key) => String(answers[key] ?? '').trim()).length
