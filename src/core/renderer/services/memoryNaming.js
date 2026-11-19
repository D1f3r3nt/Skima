export const toMemorySlug = (rawName) => String(rawName ?? '')
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

export const buildMemoryTargetPath = (parentPath, name) => {
  const slug = toMemorySlug(name)
  const parent = String(parentPath ?? '').trim()
  if (!parent || !slug) {
    return ''
  }
  const separator = parent.includes('\\') ? '\\' : '/'
  return `${parent.replace(/[\\/]+$/, '')}${separator}${slug}`
}
