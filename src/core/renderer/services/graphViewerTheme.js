import { buildScrollbarCss, mixColors, readThemeColors } from './embeddedThemeCss.js'

export const buildGraphViewerThemeCss = () => {
  const colors = readThemeColors()
  const { scheme, background, text, aim, onAim, fontFamily } = colors
  const declarations = [
    `color-scheme: ${scheme} !important`,
    `--bg: ${background} !important`,
    `--panel: ${mixColors(text, 6, background)} !important`,
    `--border: ${mixColors(text, 14, background)} !important`,
    `--input-border: ${mixColors(text, 24, background)} !important`,
    `--text: ${text} !important`,
    `--text-2: ${mixColors(text, 64, background)} !important`,
    `--text-3: ${mixColors(text, 85, background)} !important`,
    `--muted: ${mixColors(text, 50, background)} !important`,
    `--count: ${mixColors(text, 55, background)} !important`,
    `--neighbor-border: ${mixColors(text, 24, background)} !important`,
    `--node-label: ${text} !important`
  ]
  return `
:root, :root[data-theme="light"], :root[data-theme="dark"] { ${declarations.join('; ')}; }
body { font-family: ${fontFamily || 'system-ui, sans-serif'} !important; font-size: 13px !important; }
#theme-wrap { display: none !important; }
#sidebar { width: 300px !important; }
#search { height: 32px !important; border-radius: 6px !important; }
#search:focus { border-color: ${aim} !important; }
#search-wrap, #info-panel, #legend-wrap { padding: 14px 16px !important; }
#info-panel h3, #legend-wrap h3 { font-size: 11px !important; font-weight: 600 !important; letter-spacing: 0.06em !important; }
.search-item, .neighbor-link, .legend-item { border-radius: 4px !important; }
#legend-controls button, #legend-controls input[type="checkbox"]:checked, .legend-cb:checked, #select-all-cb:checked { accent-color: ${aim} !important; }
.legend-cb:checked, #select-all-cb:checked { background: ${aim} !important; border-color: ${aim} !important; }
::selection { background: ${aim} !important; color: ${onAim} !important; }
${buildScrollbarCss(colors)}
`
}
