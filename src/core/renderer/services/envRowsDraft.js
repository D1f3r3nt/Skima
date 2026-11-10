const envKeyPattern = /^[A-Za-z_][A-Za-z0-9_]*$/

let rowCounter = 0

const createRowId = () => {
  rowCounter += 1
  return `envRow${rowCounter}`
}

export const createRowsFromEntries = (entries) => entries.map((entry) => ({
  id: createRowId(),
  originalKey: entry.key,
  originalValue: entry.value,
  key: entry.key,
  value: entry.value,
  isDuplicated: entry.isDuplicated,
  isEditing: false
}))

export const createEmptyRow = () => ({ id: createRowId(), originalKey: null, originalValue: '', key: '', value: '', isDuplicated: false, isEditing: true })

export const isRowDirty = (row) => row.originalKey === null
  ? row.key.trim() !== '' || row.value !== ''
  : row.key.trim() !== row.originalKey || row.value !== row.originalValue

export const validateRows = (rows) => {
  const errors = {}
  const seen = new Map()
  rows.forEach((row) => {
    const key = row.key.trim()
    if (row.originalKey === null && key === '' && row.value === '') {
      return
    }
    if (!envKeyPattern.test(key)) {
      errors[row.id] = 'Usa letras, números y guiones bajos, sin empezar por un número.'
      return
    }
    if (seen.has(key)) {
      errors[row.id] = 'Ya hay otra variable con ese nombre.'
      errors[seen.get(key)] = errors[seen.get(key)] ?? 'Ya hay otra variable con ese nombre.'
      return
    }
    seen.set(key, row.id)
  })
  return errors
}

export const buildChanges = (rows) => rows
  .filter(isRowDirty)
  .map((row) => ({ type: 'set', key: row.key.trim(), value: row.value, originalKey: row.originalKey }))

export const suggestKeys = (exampleKeys, rows) => {
  const used = new Set(rows.map((row) => row.key.trim()))
  return exampleKeys.filter((key) => !used.has(key))
}
