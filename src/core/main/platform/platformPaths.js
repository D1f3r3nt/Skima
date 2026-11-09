const os = require('node:os')
const nodePath = require('node:path')

const supportedPlatforms = Object.freeze(['win32', 'darwin', 'linux'])
const templateSeparator = '/'
const placeholderPattern = /\{([a-zA-Z][a-zA-Z0-9]*)\}/g

const toSupportedPlatform = (platform) => (supportedPlatforms.includes(platform) ? platform : 'linux')

class PlatformPaths {
  constructor({ platform = process.platform, homeDirectory = os.homedir(), environment = process.env, temporaryDirectory = os.tmpdir() } = {}) {
    this.platform = toSupportedPlatform(platform)
    this.temporaryDirectory = temporaryDirectory
    this.environment = { ...environment }
    this.path = this.platform === 'win32' ? nodePath.win32 : nodePath.posix
    this.homeDirectory = this.path.normalize(homeDirectory)
  }

  get isWindows() {
    return this.platform === 'win32'
  }

  get isMac() {
    return this.platform === 'darwin'
  }

  get isCaseInsensitive() {
    return this.platform === 'win32' || this.platform === 'darwin'
  }

  get separator() {
    return this.path.sep
  }

  readEnvironment(variableName) {
    const value = this.environment[variableName]
    return typeof value === 'string' && value.trim() ? value.trim() : null
  }

  readAbsoluteEnvironmentPath(variableName) {
    const value = this.readEnvironment(variableName)
    return value && this.path.isAbsolute(value) ? this.path.normalize(value) : null
  }

  get xdgConfigHome() {
    return this.readAbsoluteEnvironmentPath('XDG_CONFIG_HOME') ?? this.path.join(this.homeDirectory, '.config')
  }

  get xdgDataHome() {
    return this.readAbsoluteEnvironmentPath('XDG_DATA_HOME') ?? this.path.join(this.homeDirectory, '.local', 'share')
  }

  get appData() {
    if (this.isWindows) {
      return this.readAbsoluteEnvironmentPath('APPDATA') ?? this.path.join(this.homeDirectory, 'AppData', 'Roaming')
    }
    return this.osConfigHome
  }

  get localAppData() {
    if (this.isWindows) {
      return this.readAbsoluteEnvironmentPath('LOCALAPPDATA') ?? this.path.join(this.homeDirectory, 'AppData', 'Local')
    }
    return this.osConfigHome
  }

  get osConfigHome() {
    if (this.isWindows) {
      return this.appData
    }
    if (this.isMac) {
      return this.path.join(this.homeDirectory, 'Library', 'Application Support')
    }
    return this.xdgConfigHome
  }

  getBaseVariables() {
    return {
      home: this.homeDirectory,
      xdgConfigHome: this.xdgConfigHome,
      xdgDataHome: this.xdgDataHome,
      osConfigHome: this.osConfigHome,
      appData: this.appData,
      localAppData: this.localAppData
    }
  }

  selectTemplate(pathSpecification) {
    if (typeof pathSpecification === 'string') {
      return pathSpecification
    }
    if (!pathSpecification || typeof pathSpecification !== 'object') {
      return null
    }
    return pathSpecification.platforms?.[this.platform] ?? pathSpecification.template ?? null
  }

  resolveTemplate(pathSpecification, variables = {}) {
    if (pathSpecification && typeof pathSpecification === 'object' && pathSpecification.environmentOverride) {
      const overriddenPath = this.readAbsoluteEnvironmentPath(pathSpecification.environmentOverride)
      if (overriddenPath) {
        return overriddenPath
      }
    }

    const template = this.selectTemplate(pathSpecification)

    if (!template) {
      return null
    }

    const allVariables = { ...this.getBaseVariables(), ...variables }
    const segments = template.split(templateSeparator).filter((segment) => segment.length > 0)
    const resolvedSegments = segments.map((segment) =>
      segment.replace(placeholderPattern, (placeholder, variableName) => {
        const value = allVariables[variableName]
        if (typeof value !== 'string' || !value) {
          throw new Error(`Falta el valor de ${placeholder} para resolver la ruta "${template}".`)
        }
        return value
      })
    )

    if (resolvedSegments.length === 0) {
      return null
    }

    if (template.startsWith(templateSeparator) && !this.isWindows) {
      return this.path.join(this.path.sep, ...resolvedSegments)
    }

    const [firstSegment, ...otherSegments] = resolvedSegments

    if (!this.path.isAbsolute(firstSegment)) {
      throw new Error(`La plantilla de ruta "${template}" debe empezar por un marcador absoluto como {home}.`)
    }

    return this.path.join(firstSegment, ...otherSegments)
  }

  resolveRoots(rootSpecifications = {}, variables = {}) {
    return Object.entries(rootSpecifications).reduce((resolvedRoots, [rootName, specification]) => ({
      ...resolvedRoots,
      [rootName]: this.resolveTemplate(specification, { ...variables, ...resolvedRoots })
    }), {})
  }

  joinRelative(basePath, relativeTemplate) {
    const segments = String(relativeTemplate).split(templateSeparator).filter((segment) => segment.length > 0)
    return this.path.join(basePath, ...segments)
  }

  toDisplayPath(targetPath) {
    return this.path.normalize(String(targetPath))
  }

  toComparablePath(targetPath) {
    const resolvedPath = this.path.resolve(String(targetPath ?? ''))
    const withoutTrailingSeparator = resolvedPath.length > this.path.parse(resolvedPath).root.length
      ? resolvedPath.replace(/[\\/]+$/, '')
      : resolvedPath
    return this.isCaseInsensitive ? withoutTrailingSeparator.toLowerCase() : withoutTrailingSeparator
  }

  isSamePath(firstPath, secondPath) {
    return this.toComparablePath(firstPath) === this.toComparablePath(secondPath)
  }

  isPathInside(parentPath, candidatePath, { allowEqual = false } = {}) {
    const comparableParent = this.toComparablePath(parentPath)
    const comparableCandidate = this.toComparablePath(candidatePath)

    if (comparableParent === comparableCandidate) {
      return allowEqual
    }

    const relativePath = this.path.relative(comparableParent, comparableCandidate)
    return Boolean(relativePath) && !relativePath.startsWith('..') && !this.path.isAbsolute(relativePath)
  }

  resolveInside(parentPath, ...relativeSegments) {
    const candidatePath = this.path.resolve(parentPath, ...relativeSegments)
    if (!this.isPathInside(parentPath, candidatePath)) {
      throw new Error(`La ruta "${relativeSegments.join(this.separator)}" sale de la carpeta permitida.`)
    }
    return candidatePath
  }
}

const createPlatformPaths = (options) => new PlatformPaths(options)

module.exports = { PlatformPaths, createPlatformPaths, supportedPlatforms }
