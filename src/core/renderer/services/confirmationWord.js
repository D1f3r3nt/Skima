export const normalizeConfirmationInput = (value) => String(value ?? '').trim().toLocaleLowerCase('es')

export const matchesConfirmationWord = (value, word) => normalizeConfirmationInput(value) === normalizeConfirmationInput(word)
