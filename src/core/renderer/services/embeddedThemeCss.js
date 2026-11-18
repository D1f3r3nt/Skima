export const readThemeColors = () => {
  const styles = getComputedStyle(document.documentElement)
  const read = (name) => styles.getPropertyValue(name).trim()
  return {
    scheme: read('--theme-scheme') || 'dark',
    background: read('--theme-background'),
    text: read('--theme-text'),
    aim: read('--theme-aim'),
    onAim: read('--theme-on-aim'),
    fontFamily: read('--font-family')
  }
}

export const mixColors = (foreground, percentage, background) => `color-mix(in oklab, ${foreground} ${percentage}%, ${background})`

export const buildScrollbarCss = ({ background, text }) => `
::-webkit-scrollbar { width: 12px !important; height: 12px !important; background: transparent !important; }
::-webkit-scrollbar-track, ::-webkit-scrollbar-corner { background: transparent !important; }
::-webkit-scrollbar-thumb { background: ${mixColors(text, 17, background)} !important; border: 3px solid transparent !important; border-radius: 999px !important; background-clip: content-box !important; }
::-webkit-scrollbar-thumb:hover { background-color: ${mixColors(text, 28, background)} !important; }
html, body, * { scrollbar-color: auto !important; scrollbar-width: auto !important; }
`
