const executeSafely = async (action) => {
  try {
    return { ok: true, data: await action() }
  } catch (error) {
    return { ok: false, error: error.message }
  }
}

module.exports = { executeSafely }
