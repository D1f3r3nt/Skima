export function createInlineEditState({ value, maxLength = Infinity, emptyMessage = 'No puede quedar vacío.', save }) {
  let state = { mode: 'view', value, draft: value, error: null }
  const listeners = new Set()

  const update = (changes) => {
    state = { ...state, ...changes }
    listeners.forEach((listener) => listener(state))
  }

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    begin: () => {
      if (state.mode === 'view') {
        update({ mode: 'edit', draft: state.value, error: null })
      }
    },
    setDraft: (draft) => {
      update({ draft, error: null })
    },
    cancel: () => {
      if (state.mode === 'edit') {
        update({ mode: 'view', draft: state.value, error: null })
      }
    },
    commit: async () => {
      if (state.mode !== 'edit') {
        return state
      }
      const trimmed = String(state.draft ?? '').trim()
      if (trimmed === state.value) {
        update({ mode: 'view', draft: state.value, error: null })
        return state
      }
      if (!trimmed) {
        update({ error: emptyMessage })
        return state
      }
      if (trimmed.length > maxLength) {
        update({ error: `No puede superar los ${maxLength} caracteres.` })
        return state
      }
      update({ mode: 'saving', error: null })
      try {
        const savedValue = await save(trimmed)
        update({ mode: 'view', value: savedValue ?? trimmed, draft: savedValue ?? trimmed, error: null })
      } catch (error) {
        update({ mode: 'edit', error: error.message })
      }
      return state
    }
  }
}
