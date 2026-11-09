export function createAutosave({ save, delayMs = 800, setTimer = setTimeout, clearTimer = clearTimeout, onStatus = () => {} }) {
  let pendingValue
  let hasPending = false
  let timer = null
  let currentSave = Promise.resolve()

  const runSave = () => {
    clearTimer(timer)
    timer = null
    if (!hasPending) {
      return currentSave
    }
    const valueToSave = pendingValue
    hasPending = false
    onStatus('saving')
    currentSave = currentSave
      .then(() => save(valueToSave))
      .then(() => {
        onStatus(hasPending ? 'pending' : 'saved')
      })
      .catch((error) => {
        if (!hasPending) {
          hasPending = true
          pendingValue = valueToSave
        }
        onStatus('error', error)
      })
    return currentSave
  }

  return {
    change: (value) => {
      pendingValue = value
      hasPending = true
      onStatus('pending')
      clearTimer(timer)
      timer = setTimer(runSave, delayMs)
    },
    flush: () => runSave(),
    hasPending: () => hasPending,
    cancel: () => {
      clearTimer(timer)
      timer = null
      hasPending = false
    }
  }
}
