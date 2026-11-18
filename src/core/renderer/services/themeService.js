import { defaultThemeId, themeStorageKey, themes } from '../config/themes.js'

const themeListeners = new Set()

const isKnownTheme = (themeId) => themes.some((theme) => theme.id === themeId)

export const getActiveThemeId = () => document.documentElement.dataset.theme || defaultThemeId

export const applyTheme = (themeId) => {
  const nextThemeId = isKnownTheme(themeId) ? themeId : defaultThemeId
  document.documentElement.dataset.theme = nextThemeId
  try {
    window.localStorage.setItem(themeStorageKey, nextThemeId)
  } catch {
    return nextThemeId
  }
  themeListeners.forEach((listener) => listener(nextThemeId))
  return nextThemeId
}

export const onThemeChange = (listener) => {
  themeListeners.add(listener)
  return () => themeListeners.delete(listener)
}

export const syncThemeFromPreferences = async (apiClient) => {
  try {
    const preferences = await apiClient.getPreferences()
    if (preferences.theme !== getActiveThemeId()) {
      applyTheme(preferences.theme)
    }
  } catch {
    return
  }
}
