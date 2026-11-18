(() => {
  let storedTheme = null
  try {
    storedTheme = window.localStorage.getItem('skima.theme')
  } catch {
    storedTheme = null
  }
  document.documentElement.dataset.theme = storedTheme || 'cream'
})()
