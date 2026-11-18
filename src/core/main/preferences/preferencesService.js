const { themeIds } = require('../settings/settingsSchema')

const maximumSkillKeyLength = 255

class PreferencesService {
  constructor({ settingsStore }) {
    this.settingsStore = settingsStore
  }

  async get() {
    const settings = await this.settingsStore.get()
    return settings.preferences
  }

  async setTheme(themeId) {
    if (!themeIds.includes(themeId)) {
      throw new Error('El tema elegido no existe.')
    }
    const settings = await this.settingsStore.update((draft) => {
      draft.preferences.theme = themeId
    })
    return settings.preferences
  }

  async setFavoriteSkill(skillKey, isFavorite) {
    const normalizedKey = String(skillKey ?? '').trim()
    if (!normalizedKey || normalizedKey.length > maximumSkillKeyLength) {
      throw new Error('La skill indicada no es válida.')
    }
    const settings = await this.settingsStore.update((draft) => {
      const favorites = draft.preferences.favoriteSkills.filter((key) => key !== normalizedKey)
      draft.preferences.favoriteSkills = isFavorite ? [...favorites, normalizedKey] : favorites
    })
    return settings.preferences
  }
}

module.exports = { PreferencesService }
