import { flushPendingWork } from './pendingWork.js'

export const detailSources = Object.freeze({
  catalog: 'catalog',
  installed: 'installed',
  mySkill: 'mySkill'
})

const pageFiles = Object.freeze({
  library: 'library.html',
  global: 'global.html',
  projects: 'projects.html',
  project: 'project.html',
  mySkills: 'mySkills.html',
  editor: 'editor.html'
})

export const buildPageUrl = (pageId, params = {}) => {
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''))
  const queryString = query.toString()
  return `${pageFiles[pageId] ?? pageFiles.library}${queryString ? `?${queryString}` : ''}`
}

export const buildDetailUrl = ({ source, id, from, ...rest }) => {
  const query = new URLSearchParams({ source, id, from, ...rest })
  return `detail.html?${query.toString()}`
}

export const navigateTo = async (url) => {
  await flushPendingWork()
  window.location.href = url
}

export const readPageParams = () => Object.fromEntries(new URLSearchParams(window.location.search).entries())

export const goBack = async (fallbackUrl) => {
  await flushPendingWork()
  if (window.history.length > 1) {
    window.history.back()
    return
  }
  window.location.href = fallbackUrl
}
