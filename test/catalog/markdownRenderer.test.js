const test = require('node:test')
const assert = require('node:assert/strict')
const { MarkdownRenderer, resolveUrl } = require('../../src/core/main/markdown/markdownRenderer')

const context = { kind: 'github', repository: 'owner/repo', ref: 'main', directory: 'skills/pdf' }
const render = (markdown, renderContext = context) => new MarkdownRenderer().render(markdown, { context: renderContext }).html

test('resuelve rutas relativas de imágenes y enlaces al repositorio', () => {
  assert.equal(resolveUrl('img/logo.png', context, 'image'), 'https://raw.githubusercontent.com/owner/repo/main/skills/pdf/img/logo.png')
  assert.equal(resolveUrl('/docs/a b.png', context, 'image'), 'https://raw.githubusercontent.com/owner/repo/main/docs/a%20b.png')
  assert.equal(resolveUrl('../README.md#usage', context, 'link'), 'https://github.com/owner/repo/blob/main/skills/README.md#usage')
  assert.equal(resolveUrl('https://github.com/o/r/blob/main/x.png', context, 'image'), 'https://raw.githubusercontent.com/o/r/main/x.png')
  assert.equal(resolveUrl('../../../../etc/passwd', context, 'link'), 'https://github.com/owner/repo/blob/main/etc/passwd')
  assert.equal(resolveUrl('#install', context, 'link'), '#md-install')
})

test('elimina scripts, manejadores de eventos y esquemas peligrosos', () => {
  const html = render([
    '<script>alert(1)</script>',
    '<img src="x.png" onerror="alert(1)">',
    '[a](javascript:alert(1)) [b](vbscript:x) [c](data:text/html,hi)',
    '<iframe src="https://evil"></iframe><style>body{}</style>',
    '<a href="https://ok.example" target="_blank" onclick="x()">ok</a>',
    '<img src="http://insecure.example/a.png">',
    '<svg><script>alert(1)</script></svg>'
  ].join('\n\n'))

  assert.doesNotMatch(html, /<script|onerror|onclick|javascript:|vbscript:|data:text|<iframe|<style|<svg|target=/i)
  assert.match(html, /href="https:\/\/ok\.example\/" rel="noopener noreferrer"/)
  assert.doesNotMatch(html, /http:\/\/insecure/)
})

test('renderiza tablas, listas de tareas y código con resaltado', () => {
  const html = render('| a | b |\n|---|---|\n| 1 | 2 |\n\n- [x] hecho\n\n```js\nconst value = 1\n```')
  assert.match(html, /<table>/)
  assert.match(html, /<input type="checkbox" disabled checked \/>/)
  assert.match(html, /<span class="hljs-keyword">const<\/span>/)
})

test('prefija los ids para no pisar elementos de la aplicación', () => {
  const html = render('# Título\n\n<h2 id="toastContainer">x</h2>')
  assert.match(html, /id="md-título"/)
  assert.match(html, /id="md-toastContainer"/)
  assert.doesNotMatch(html, /id="toastContainer"/)
})

test('sin contexto de repositorio descarta las rutas relativas', () => {
  const html = render('![a](local.png) [b](other.md)', null)
  assert.doesNotMatch(html, /local\.png|other\.md/)
  assert.match(html, /\[a\]/)
})
