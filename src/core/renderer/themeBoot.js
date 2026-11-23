(() => {
  const knownThemes = ['cream', 'navy', 'silver', 'deep-teal']
  let storedTheme = null
  try {
    storedTheme = window.localStorage.getItem('skima.theme')
  } catch {
    storedTheme = null
  }
  document.documentElement.dataset.theme = knownThemes.includes(storedTheme) ? storedTheme : 'cream'
})()
