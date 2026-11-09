const fs = require('node:fs/promises')
const crypto = require('node:crypto')
const { zipSync } = require('fflate')
const { writeFileAtomic, readTextIfExists } = require('../platform/atomicFileSystem')
const { toCaseInsensitiveKey } = require('../platform/portableNames')
const { skillSpecConstants } = require('./skillSpecConstants')
const { generateSkill, renderSkillMarkdown, answersToSlots, referencePathFor } = require('./skillGenerator')
const { hashSkillFolder, listFiles } = require('./skillFolderHash')

const draftFileName = '_draft.json'
const fileLimits = Object.freeze({ maximumFiles: 50, maximumFileBytes: 5 * 1024 * 1024 })

const createStoreError = (code, message) => Object.assign(new Error(message), { code })

class MySkillsStore {
  constructor({ skillsDirectory, dataDirectory, platformPaths, trashItem, now = () => new Date() }) {
    this.skillsDirectory = skillsDirectory
    this.dataDirectory = dataDirectory
    this.platformPaths = platformPaths
    this.trashItem = trashItem
    this.now = now
  }

  assertName(name) {
    const value = String(name ?? '')
    if (!skillSpecConstants.namePattern.test(value) || value.length > skillSpecConstants.nameMaxLength) {
      throw createStoreError('INVALID_NAME', `"${value}" no es un nombre de skill válido.`)
    }
    return value
  }

  skillPath(name) {
    return this.platformPaths.resolveInside(this.skillsDirectory, this.assertName(name))
  }

  dataPath(name) {
    return this.platformPaths.resolveInside(this.dataDirectory, `${this.assertName(name)}.json`)
  }

  async readData(name) {
    const text = await readTextIfExists(this.dataPath(name))
    if (!text) {
      return null
    }
    try {
      return JSON.parse(text)
    } catch {
      return null
    }
  }

  async listNames() {
    const entries = await fs.readdir(this.skillsDirectory, { withFileTypes: true }).catch(() => [])
    return entries.filter((entry) => entry.isDirectory() && skillSpecConstants.namePattern.test(entry.name)).map((entry) => entry.name).sort()
  }

  async findCollision(name, ignoredName = null) {
    const names = await this.listNames()
    return names.find((existing) => existing !== ignoredName && (existing === name || (this.platformPaths.isCaseInsensitive && toCaseInsensitiveKey(existing) === toCaseInsensitiveKey(name)))) ?? null
  }

  async summarize(name) {
    const [data, markdown] = await Promise.all([this.readData(name), readTextIfExists(this.platformPaths.path.join(this.skillPath(name), skillSpecConstants.manifestFileName))])
    const { hash } = await hashSkillFolder(this.skillPath(name)).catch(() => ({ hash: null }))
    const description = /^description:\s*(.+)$/m.exec(markdown ?? '')
    return {
      name,
      description: data?.generation?.slots?.description ?? (description ? description[1].replace(/^['"]|['"]$/g, '') : ''),
      createdAt: data?.createdAt ?? null,
      updatedAt: data?.updatedAt ?? null,
      optimized: Boolean(data?.generation?.optimized),
      contentHash: hash
    }
  }

  async list() {
    return Promise.all((await this.listNames()).map((name) => this.summarize(name)))
  }

  async get(name) {
    const skillPath = this.skillPath(name)
    const stats = await fs.stat(skillPath).catch(() => null)
    if (!stats?.isDirectory()) {
      throw createStoreError('NOT_FOUND', `La skill "${name}" no está en Mis skills.`)
    }
    const data = await this.readData(name)
    const markdown = await readTextIfExists(this.platformPaths.path.join(skillPath, skillSpecConstants.manifestFileName)) ?? ''
    const files = await listFiles(skillPath, { maximumFiles: 500 })
    const { hash } = await hashSkillFolder(skillPath)
    return {
      name,
      path: skillPath,
      markdown,
      answers: data?.answers ?? null,
      generation: data?.generation ?? null,
      createdAt: data?.createdAt ?? null,
      updatedAt: data?.updatedAt ?? null,
      files: files.map((file) => file.relativePath),
      contentHash: hash
    }
  }

  async copyAttachedFile(file, stagingDirectory, previousSkillPath) {
    const destination = this.platformPaths.resolveInside(stagingDirectory, ...referencePathFor(file).split('/'))
    await fs.mkdir(this.platformPaths.path.dirname(destination), { recursive: true })
    const sourcePath = file.sourcePath
      ? this.platformPaths.path.resolve(file.sourcePath)
      : file.storedPath && previousSkillPath
        ? this.platformPaths.resolveInside(previousSkillPath, ...file.storedPath.split('/'))
        : null
    if (!sourcePath) {
      throw createStoreError('MISSING_FILE', `No se encuentra el archivo adicional ${file.fileName}.`)
    }
    const stats = await fs.lstat(sourcePath).catch(() => null)
    if (!stats?.isFile()) {
      throw createStoreError('MISSING_FILE', `No se encuentra el archivo adicional ${file.fileName}.`)
    }
    if (stats.size > fileLimits.maximumFileBytes) {
      throw createStoreError('FILE_TOO_LARGE', `${file.fileName} supera ${fileLimits.maximumFileBytes / 1024 / 1024} MB.`)
    }
    await fs.copyFile(sourcePath, destination)
    if (!this.platformPaths.isWindows) {
      await fs.chmod(destination, stats.mode & 0o777)
    }
  }

  async save({ answers, slots = null, generation = null, previousName = null }) {
    const generated = generateSkill({ answers, slots })
    if (!generated.isValid) {
      throw createStoreError('INVALID_SKILL', generated.issues.filter((issue) => issue.severity === 'error').map((issue) => issue.message).join(' '))
    }
    if (generated.answers.files.length > fileLimits.maximumFiles) {
      throw createStoreError('TOO_MANY_FILES', `Como máximo ${fileLimits.maximumFiles} archivos adicionales.`)
    }
    const name = generated.name
    const collision = await this.findCollision(name, previousName)
    if (collision) {
      throw createStoreError('NAME_TAKEN', `Ya tienes una skill llamada "${collision}" en Mis skills.`)
    }

    const previousPath = previousName ? this.skillPath(previousName) : null
    const previousData = previousName ? await this.readData(previousName) : null
    await fs.mkdir(this.skillsDirectory, { recursive: true })
    await fs.mkdir(this.dataDirectory, { recursive: true })
    const suffix = crypto.randomBytes(4).toString('hex')
    const stagingDirectory = this.platformPaths.path.join(this.skillsDirectory, `.${name}.skima-${suffix}`)
    await fs.mkdir(stagingDirectory)

    try {
      await writeFileAtomic(this.platformPaths.path.join(stagingDirectory, skillSpecConstants.manifestFileName), generated.markdown)
      for (const file of generated.answers.files) {
        await this.copyAttachedFile(file, stagingDirectory, previousPath)
      }
      const targetPath = this.skillPath(name)
      if (previousPath) {
        await this.trashItem(previousPath).catch(() => fs.rm(previousPath, { recursive: true, force: true }))
      }
      await fs.rename(stagingDirectory, targetPath)
    } catch (error) {
      await fs.rm(stagingDirectory, { recursive: true, force: true }).catch(() => {})
      throw error
    }

    const nowIso = this.now().toISOString()
    const storedAnswers = {
      ...generated.answers,
      files: generated.answers.files.map((file) => ({ fileName: file.fileName, kind: file.kind, sourcePath: null, storedPath: referencePathFor(file) }))
    }
    await writeFileAtomic(this.dataPath(name), `${JSON.stringify({
      name,
      answers: storedAnswers,
      generation: { optimized: false, slots: generated.slots, ...(generation ?? {}) },
      createdAt: previousData?.createdAt ?? nowIso,
      updatedAt: nowIso
    }, null, 2)}\n`)
    if (previousName && previousName !== name) {
      await fs.rm(this.dataPath(previousName), { force: true })
    }
    return this.get(name)
  }

  async nextCopyName(name) {
    const names = new Set((await this.listNames()).map((existing) => toCaseInsensitiveKey(existing)))
    for (let index = 1; index < 100; index += 1) {
      const suffix = index === 1 ? '-copy' : `-copy-${index}`
      const candidate = `${name.slice(0, skillSpecConstants.nameMaxLength - suffix.length).replace(/-+$/, '')}${suffix}`
      if (!names.has(toCaseInsensitiveKey(candidate))) {
        return candidate
      }
    }
    throw createStoreError('NAME_TAKEN', 'No se ha encontrado un nombre libre para la copia.')
  }

  async duplicate(name) {
    const original = await this.get(name)
    const copyName = await this.nextCopyName(name)
    const sourcePath = this.skillPath(name)
    const targetPath = this.skillPath(copyName)
    await fs.cp(sourcePath, targetPath, { recursive: true, errorOnExist: true, force: false })
    const slots = original.generation?.slots ?? answersToSlots({ ...(original.answers ?? {}), name: copyName })
    const files = (original.answers?.files ?? []).map((file) => ({ fileName: file.fileName, kind: file.kind }))
    await writeFileAtomic(this.platformPaths.path.join(targetPath, skillSpecConstants.manifestFileName), renderSkillMarkdown({ name: copyName, slots, files }))
    const nowIso = this.now().toISOString()
    await writeFileAtomic(this.dataPath(copyName), `${JSON.stringify({
      name: copyName,
      answers: { ...(original.answers ?? {}), name: copyName },
      generation: original.generation,
      createdAt: nowIso,
      updatedAt: nowIso
    }, null, 2)}\n`)
    return this.get(copyName)
  }

  async remove(name) {
    const skillPath = this.skillPath(name)
    await this.trashItem(skillPath)
    await fs.rm(this.dataPath(name), { force: true })
    return true
  }

  async exportSkill(name, { format, destinationDirectory }) {
    const skillPath = this.skillPath(name)
    const destinationRoot = this.platformPaths.path.resolve(String(destinationDirectory ?? ''))
    const destinationStats = await fs.stat(destinationRoot).catch(() => null)
    if (!destinationStats?.isDirectory()) {
      throw createStoreError('INVALID_DESTINATION', 'La carpeta de destino no existe.')
    }
    if (this.platformPaths.isPathInside(this.skillsDirectory, destinationRoot, { allowEqual: true })) {
      throw createStoreError('INVALID_DESTINATION', 'Elige una carpeta fuera de Mis skills.')
    }

    if (format === 'zip') {
      const zipPath = this.platformPaths.path.join(destinationRoot, `${name}.zip`)
      if (await fs.stat(zipPath).catch(() => null)) {
        throw createStoreError('DESTINATION_EXISTS', `Ya existe ${this.platformPaths.toDisplayPath(zipPath)}.`)
      }
      const files = await listFiles(skillPath, { maximumFiles: 1000 })
      const entries = {}
      for (const file of files) {
        const [content, stats] = await Promise.all([fs.readFile(file.absolutePath), fs.stat(file.absolutePath)])
        entries[`${name}/${file.relativePath}`] = [new Uint8Array(content), { attrs: (stats.mode & 0o777) << 16, os: 3 }]
      }
      await writeFileAtomic(zipPath, Buffer.from(zipSync(entries, { level: 6 })))
      return { path: zipPath, displayPath: this.platformPaths.toDisplayPath(zipPath) }
    }

    const folderPath = this.platformPaths.path.join(destinationRoot, name)
    if (await fs.stat(folderPath).catch(() => null)) {
      throw createStoreError('DESTINATION_EXISTS', `Ya existe ${this.platformPaths.toDisplayPath(folderPath)}.`)
    }
    await fs.cp(skillPath, folderPath, { recursive: true, errorOnExist: true, force: false })
    return { path: folderPath, displayPath: this.platformPaths.toDisplayPath(folderPath) }
  }

  async loadDraft() {
    const text = await readTextIfExists(this.platformPaths.path.join(this.dataDirectory, draftFileName))
    try {
      return text ? JSON.parse(text) : null
    } catch {
      return null
    }
  }

  async saveDraft(draft) {
    await writeFileAtomic(this.platformPaths.path.join(this.dataDirectory, draftFileName), `${JSON.stringify({ ...draft, savedAt: this.now().toISOString() })}\n`)
    return true
  }

  async clearDraft() {
    await fs.rm(this.platformPaths.path.join(this.dataDirectory, draftFileName), { force: true })
    return true
  }
}

class MySkillSource {
  constructor({ mySkillsStore }) {
    this.mySkillsStore = mySkillsStore
  }

  async prepare({ name }) {
    const skill = await this.mySkillsStore.get(name)
    return {
      warnings: [],
      skills: [{ name: skill.name, sourcePath: skill.path, subPath: '', description: '', isValid: true }]
    }
  }
}

module.exports = { MySkillsStore, MySkillSource, fileLimits }
