import { buildScrollbarCss, mixColors, readThemeColors } from './embeddedThemeCss.js'

const grayScale = Object.freeze([
  ['100', 7],
  ['200', 11],
  ['300', 15],
  ['400', 18],
  ['500', 28],
  ['600', 50],
  ['700', 55],
  ['800', 60],
  ['900', 68],
  ['1000', 100]
])

const alphaScale = Object.freeze([
  ['100', 7],
  ['200', 9],
  ['300', 13],
  ['400', 14],
  ['500', 24],
  ['600', 51],
  ['700', 54],
  ['800', 47],
  ['900', 61],
  ['1000', 92]
])

export const buildSkillsSiteThemeCss = () => {
  const colors = readThemeColors()
  const { scheme, background, text, aim, onAim } = colors
  const declarations = [
    `color-scheme: ${scheme} !important`,
    `--skima-aim: ${aim} !important`,
    `--skima-on-aim: ${onAim} !important`,
    `--skima-text: ${text} !important`,
    `--skima-muted: ${mixColors(text, 62, background)} !important`,
    `--skima-border: ${mixColors(text, 15, background)} !important`,
    `--ds-background-100: ${background} !important`,
    `--ds-background-200: ${background} !important`,
    ...grayScale.map(([step, percentage]) => `--ds-gray-${step}: ${mixColors(text, percentage, background)} !important`),
    ...alphaScale.map(([step, percentage]) => `--ds-gray-alpha-${step}: color-mix(in srgb, ${text} ${percentage}%, transparent) !important`),
    `--background: ${background} !important`,
    `--foreground: ${text} !important`,
    `--border: ${mixColors(text, 11, background)} !important`
  ]
  return `
html, html.dark, html:root { ${declarations.join('; ')}; }
html, body { background: ${background} !important; color: ${text} !important; }
::selection { background: ${aim} !important; color: ${onAim} !important; }
a:hover { color: ${aim} !important; }
${buildScrollbarCss(colors)}
`
}
