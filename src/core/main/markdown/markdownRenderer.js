const path = require('node:path')
const { Marked } = require('marked')
const { markedHighlight } = require('marked-highlight')
const hljs = require('highlight.js/lib/common')
const sanitizeHtml = require('sanitize-html')

const maximumMarkdownLength = 512 * 1024
const headingIdPrefix = 'md-'
const allowedLinkSchemes = ['http:', 'https:', 'mailto:']

const escapeHtml = (text) => String(text)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')

const slugify = (text) => String(text)
  .toLowerCase()
  .replace(/<[^>]*>/g, '')
  .replace(/&[a-z]+;|&#\d+;/g, '')
  .replace(/[^\p{Letter}\p{Number}\s_-]/gu, '')
  .trim()
  .replace(/\s/g, '-')

const createSlugger = () => {
  const counts = new Map()
  return (text) => {
    const base = slugify(text) || 'section'
    const count = counts.get(base) ?? 0
    counts.set(base, count + 1)
    return count === 0 ? base : `${base}-${count}`
  }
}

const isAbsoluteUrl = (url) => /^[a-z][a-z0-9+.-]*:/i.test(url)

const toRepositoryPath = (url, directory) => {
  const [pathPart] = url.split(/[?#]/)
  const decodedPath = (() => {
    try {
      return decodeURIComponent(pathPart)
    } catch {
      return pathPart
    }
  })()
  const joinedPath = decodedPath.startsWith('/')
    ? path.posix.normalize(decodedPath)
    : path.posix.normalize(path.posix.join('/', directory || '', decodedPath))
  if (joinedPath.startsWith('/..')) {
    return null
  }
  return joinedPath.replace(/^\/+/, '')
}

const encodePath = (repositoryPath) => repositoryPath.split('/').map(encodeURIComponent).join('/')

const convertGitHubBlobToRaw = (url) => {
  const match = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/(?:blob|raw)\/(.+)$/.exec(url)
  return match ? `https://raw.githubusercontent.com/${match[1]}/${match[2]}/${match[3].split('?')[0]}` : url
}

const resolveUrl = (rawUrl, context, kind) => {
  const url = String(rawUrl ?? '').trim()

  if (!url) {
    return null
  }

  if (url.startsWith('#')) {
    return kind === 'link' ? `#${headingIdPrefix}${url.slice(1)}` : null
  }

  if (url.startsWith('//')) {
    return resolveUrl(`https:${url}`, context, kind)
  }

  if (isAbsoluteUrl(url)) {
    if (kind === 'image' && url.startsWith('data:image/') && !url.startsWith('data:image/svg')) {
      return url
    }
    let parsedUrl
    try {
      parsedUrl = new URL(url)
    } catch {
      return null
    }
    if (kind === 'image') {
      return parsedUrl.protocol === 'https:' ? convertGitHubBlobToRaw(parsedUrl.href) : null
    }
    return allowedLinkSchemes.includes(parsedUrl.protocol) ? parsedUrl.href : null
  }

  if (context?.kind !== 'github' || !context.repository) {
    return null
  }

  const repositoryPath = toRepositoryPath(url, context.directory)
  if (repositoryPath === null) {
    return null
  }

  const ref = encodeURIComponent(context.ref || 'HEAD')
  if (kind === 'image') {
    return `https://raw.githubusercontent.com/${context.repository}/${ref}/${encodePath(repositoryPath)}`
  }
  const anchor = url.includes('#') ? `#${url.split('#')[1]}` : ''
  return `https://github.com/${context.repository}/blob/${ref}/${encodePath(repositoryPath)}${anchor}`
}

const createMarked = () => {
  const marked = new Marked(
    markedHighlight({
      emptyLangClass: 'hljs',
      langPrefix: 'hljs language-',
      highlight(code, language) {
        const normalizedLanguage = String(language ?? '').toLowerCase().split(/\s/)[0]
        if (normalizedLanguage && hljs.getLanguage(normalizedLanguage)) {
          return hljs.highlight(code, { language: normalizedLanguage, ignoreIllegals: true }).value
        }
        return escapeHtml(code)
      }
    })
  )
  marked.setOptions({ gfm: true, breaks: false })
  return marked
}

const createSanitizeOptions = (context) => ({
  allowedTags: [
    ...sanitizeHtml.defaults.allowedTags,
    'img', 'h1', 'h2', 'details', 'summary', 'del', 'ins', 'sup', 'sub', 'kbd', 'input', 'picture'
  ].filter((tag) => !['style', 'script', 'iframe', 'form', 'svg', 'math'].includes(tag)),
  allowedAttributes: {
    a: ['href', 'title', 'id', 'name', 'rel', 'target'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'referrerpolicy'],
    code: ['class'],
    span: ['class'],
    pre: ['class'],
    h1: ['id'], h2: ['id'], h3: ['id'], h4: ['id'], h5: ['id'], h6: ['id'],
    th: ['align', 'colspan', 'rowspan'],
    td: ['align', 'colspan', 'rowspan'],
    p: ['align'],
    div: ['align'],
    ol: ['start'],
    input: ['type', 'checked', 'disabled'],
    details: ['open']
  },
  allowedClasses: {
    code: ['hljs', 'language-*'],
    span: ['hljs-*'],
    pre: ['hljs']
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['https', 'data'] },
  allowProtocolRelative: false,
  disallowedTagsMode: 'discard',
  transformTags: {
    a: (tagName, attributes) => {
      const href = resolveUrl(attributes.href, context, 'link')
      const nextAttributes = { ...attributes }
      delete nextAttributes.target
      if (href) {
        nextAttributes.href = href
        nextAttributes.rel = 'noopener noreferrer'
      } else {
        delete nextAttributes.href
      }
      if (nextAttributes.id) {
        nextAttributes.id = `${headingIdPrefix}${nextAttributes.id}`
      }
      if (nextAttributes.name) {
        nextAttributes.name = `${headingIdPrefix}${nextAttributes.name}`
      }
      return { tagName, attribs: nextAttributes }
    },
    img: (tagName, attributes) => {
      const source = resolveUrl(attributes.src, context, 'image')
      const nextAttributes = { ...attributes, loading: 'lazy', referrerpolicy: 'no-referrer' }
      if (source) {
        nextAttributes.src = source
        return { tagName, attribs: nextAttributes }
      }
      return { tagName: 'span', attribs: {}, text: attributes.alt ? `[${attributes.alt}]` : '' }
    },
    input: (tagName, attributes) => (attributes.type === 'checkbox'
      ? { tagName, attribs: { type: 'checkbox', disabled: '', ...(attributes.checked !== undefined ? { checked: '' } : {}) } }
      : { tagName: 'span', attribs: {} }),
    ...Object.fromEntries(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((headingTag) => [headingTag, (tagName, attributes) => ({
      tagName,
      attribs: attributes.id ? { id: attributes.id.startsWith(headingIdPrefix) ? attributes.id : `${headingIdPrefix}${attributes.id}` } : {}
    })]))
  }
})

class MarkdownRenderer {
  constructor() {
    this.renderState = null
    this.marked = createMarked()
    const getRenderState = () => this.renderState
    this.marked.use({
      renderer: {
        heading({ tokens, depth }) {
          const state = getRenderState()
          const innerHtml = this.parser.parseInline(tokens)
          const id = `${headingIdPrefix}${state.slug(innerHtml)}`
          state.headings.push({ depth, id, text: innerHtml.replace(/<[^>]*>/g, '') })
          return `<h${depth} id="${id}">${innerHtml}</h${depth}>
`
        }
      }
    })
  }

  render(markdown, { context = null } = {}) {
    const source = String(markdown ?? '')
    const isTruncated = source.length > maximumMarkdownLength
    const headings = []
    this.renderState = { slug: createSlugger(), headings }

    try {
      const html = this.marked.parse(isTruncated ? source.slice(0, maximumMarkdownLength) : source, { async: false })
      return {
        html: sanitizeHtml(html, createSanitizeOptions(context)),
        headings,
        isTruncated
      }
    } finally {
      this.renderState = null
    }
  }
}

module.exports = { MarkdownRenderer, resolveUrl, headingIdPrefix }
