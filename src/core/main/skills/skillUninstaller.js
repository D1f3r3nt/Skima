const fs = require('node:fs/promises')
const { isProtectedSkill } = require('../memories/memoryConstants')

class SkillUninstaller {
  constructor({ scanner, platformPaths, settingsStore, trashItem }) {
    this.scanner = scanner
    this.platformPaths = platformPaths
    this.settingsStore = settingsStore
    this.trashItem = trashItem
  }

  async validatePath(rawPath, knownDirectories) {
    const candidate = String(rawPath ?? '')
    if (!candidate || !this.platformPaths.path.isAbsolute(candidate)) {
      return { path: candidate, ok: false, reason: 'La ruta no es absoluta.' }
    }
    const normalized = this.platformPaths.path.resolve(candidate)
    if (isProtectedSkill(this.platformPaths.path.basename(normalized))) {
      return { path: normalized, ok: false, reason: 'La necesitan las memorias de Skima; no se puede desinstalar.' }
    }
    const parentDirectory = this.platformPaths.path.dirname(normalized)
    const knownParent = knownDirectories.find((directory) => this.platformPaths.isSamePath(directory, parentDirectory))
    if (!knownParent) {
      return { path: normalized, ok: false, reason: 'No está dentro de una carpeta de skills conocida; Skima no la borrará.' }
    }
    const stats = await fs.lstat(normalized).catch(() => null)
    if (!stats) {
      return { path: normalized, ok: false, reason: 'La carpeta ya no existe.' }
    }
    if (!stats.isDirectory() && !stats.isSymbolicLink()) {
      return { path: normalized, ok: false, reason: 'No es una carpeta de skill.' }
    }
    return { path: normalized, ok: true, isLink: stats.isSymbolicLink() }
  }

  async preview(paths) {
    const knownDirectories = await this.scanner.knownSkillDirectories()
    const checks = await Promise.all(paths.map((candidate) => this.validatePath(candidate, knownDirectories)))
    return checks.map((check) => ({ ...check, displayPath: this.platformPaths.toDisplayPath(check.path) }))
  }

  async uninstall(paths) {
    const checks = await this.preview(paths)
    const invalid = checks.filter((check) => !check.ok)
    if (invalid.length > 0) {
      throw Object.assign(new Error(`No se ha desinstalado nada: ${invalid.map((check) => `${check.displayPath} (${check.reason})`).join('; ')}`), { code: 'INVALID_UNINSTALL_PATH' })
    }

    const results = []
    for (const check of checks) {
      try {
        await this.trashItem(check.path)
        results.push({ path: check.path, displayPath: check.displayPath, ok: true })
      } catch (error) {
        results.push({ path: check.path, displayPath: check.displayPath, ok: false, message: error.message })
      }
    }

    const removedPaths = results.filter((result) => result.ok).map((result) => result.path)
    if (removedPaths.length > 0) {
      await this.settingsStore.update((settings) => {
        settings.installedOrigins = settings.installedOrigins
          .map((origin) => ({ ...origin, targets: origin.targets.filter((target) => !removedPaths.some((removed) => this.platformPaths.isSamePath(removed, target.path))) }))
          .filter((origin) => origin.targets.length > 0)
      })
    }
    this.scanner.invalidate()
    return { results, ok: results.every((result) => result.ok) }
  }
}

module.exports = { SkillUninstaller }
