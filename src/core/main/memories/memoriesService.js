const fs = require('node:fs/promises')
const { buildMemoryTemplate } = require('./memoryTemplate')
const { validateMemoryName } = require('./memoryFile')
const { toCaseInsensitiveKey } = require('../platform/portableNames')
const { memoryInstructionsFileName } = require('./memoryConstants')

const fileListLimit = 500
const previewMaxBytes = 256 * 1024
const ignoredEntryNames = new Set(['.git', 'node_modules', '.DS_Store'])
const previewableExtensions = new Set(['.md', '.markdown', '.txt'])
const descriptionMaxLength = 160

const summarize = (text) => {
  const firstLine = String(text ?? '').split(/\r?\n/).map((line) => line.trim()).find(Boolean) ?? ''
  return firstLine.length > descriptionMaxLength ? `${firstLine.slice(0, descriptionMaxLength - 1)}…` : firstLine
}

class MemoriesService {
  constructor({ memoriesStore, projectModel, installer, markdownRenderer, platformPaths, trashItem, skillLocator = null, now = () => new Date() }) {
    this.memoriesStore = memoriesStore
    this.projectModel = projectModel
    this.installer = installer
    this.markdownRenderer = markdownRenderer
    this.platformPaths = platformPaths
    this.trashItem = trashItem
    this.skillLocator = skillLocator
    this.now = now
    this.queue = Promise.resolve()
  }

  enqueue(task) {
    const next = this.queue.then(task, task)
    this.queue = next.catch(() => {})
    return next
  }

  async isDirectory(targetPath) {
    const stats = await fs.stat(targetPath).catch(() => null)
    return Boolean(stats?.isDirectory())
  }

  async getMemory(memoryId) {
    const memory = await this.memoriesStore.findById(memoryId)
    if (!memory) {
      throw new Error('La memoria no existe en Skima.')
    }
    return memory
  }

  async describeMemory(memory) {
    return { ...memory, displayPath: this.platformPaths.toDisplayPath(memory.path), folderExists: await this.isDirectory(memory.path) }
  }

  async readMemberships() {
    const projects = await this.projectModel.getAll()
    return Promise.all(projects.map(async (project) => ({ project, membership: await this.installer.readMembership(project) })))
  }

  belongsTo(membership, memory) {
    return Boolean(membership.memoryPath) && this.platformPaths.isSamePath(membership.memoryPath, memory.path)
  }

  describeProject(project) {
    return {
      id: project.id,
      name: project.name,
      description: summarize(project.context),
      displayPath: project.displayPath,
      folderExists: project.folderExists
    }
  }

  async list() {
    const [memories, memberships] = await Promise.all([this.memoriesStore.readAll(), this.readMemberships()])
    const described = await Promise.all(memories.map(async (memory) => ({
      ...(await this.describeMemory(memory)),
      projectCount: memberships.filter(({ membership }) => this.belongsTo(membership, memory)).length
    })))
    return described.sort((first, second) => first.name.localeCompare(second.name))
  }

  async listFiles(rootPath) {
    const entries = []
    let isTruncated = false
    const visit = async (directoryPath, prefix) => {
      const children = await fs.readdir(directoryPath, { withFileTypes: true }).catch(() => [])
      for (const child of children.sort((first, second) => first.name.localeCompare(second.name))) {
        if (ignoredEntryNames.has(child.name) || child.isSymbolicLink()) {
          continue
        }
        if (entries.length >= fileListLimit) {
          isTruncated = true
          return
        }
        const relativePath = `${prefix}${child.name}`
        if (child.isDirectory()) {
          entries.push(`${relativePath}/`)
          await visit(this.platformPaths.path.join(directoryPath, child.name), `${relativePath}/`)
        } else if (child.isFile()) {
          entries.push(relativePath)
        }
      }
    }
    await visit(rootPath, '')
    return { filePaths: entries, isTruncated }
  }

  resolveMemoryFile(memory, relativePath) {
    const segments = String(relativePath ?? '').split(/[\\/]/).filter(Boolean)
    if (segments.length === 0 || segments.some((segment) => segment === '..' || segment === '.')) {
      throw new Error('La ruta del archivo no es válida.')
    }
    const filePath = this.platformPaths.resolveInside(memory.path, ...segments)
    if (!this.platformPaths.isPathInside(memory.path, filePath)) {
      throw new Error('El archivo está fuera de la memoria.')
    }
    return filePath
  }

  async renderDocument(memory, relativePath) {
    const filePath = this.resolveMemoryFile(memory, relativePath)
    if (!previewableExtensions.has(this.platformPaths.path.extname(filePath).toLowerCase())) {
      return { relativePath, exists: true, isPreviewable: false, html: '' }
    }
    const stats = await fs.lstat(filePath).catch(() => null)
    if (!stats?.isFile()) {
      return { relativePath, exists: false, isPreviewable: true, html: '' }
    }
    const handle = await fs.open(filePath, 'r')
    try {
      const buffer = Buffer.alloc(Math.min(stats.size, previewMaxBytes))
      await handle.read(buffer, 0, buffer.length, 0)
      const rendered = this.markdownRenderer.render(buffer.toString('utf-8'))
      return { relativePath, exists: true, isPreviewable: true, html: rendered.html, isTruncated: rendered.isTruncated || stats.size > previewMaxBytes }
    } finally {
      await handle.close()
    }
  }

  async getDocument(memoryId, relativePath) {
    const memory = await this.getMemory(memoryId)
    return this.renderDocument(memory, relativePath)
  }

  async isSkillAvailable(project) {
    if (!this.skillLocator) {
      return true
    }
    return this.skillLocator.isAvailable(project.path).catch(() => false)
  }

  async getDetails(memoryId) {
    const memory = await this.describeMemory(await this.getMemory(memoryId))
    const memberships = await this.readMemberships()
    const linked = memberships.filter(({ membership }) => this.belongsTo(membership, memory))
    const projects = await Promise.all(linked.map(async ({ project }) => ({
      ...this.describeProject(project),
      health: await this.installer.inspect(project),
      hasSkill: await this.isSkillAvailable(project)
    })))
    const availableProjects = memberships
      .filter(({ project, membership }) => project.folderExists && !membership.hasFile)
      .map(({ project }) => this.describeProject(project))
    const unavailableProjects = memberships
      .filter(({ project, membership }) => !this.belongsTo(membership, memory) && (!project.folderExists || membership.hasFile))
      .map(({ project, membership }) => ({
        ...this.describeProject(project),
        reason: !project.folderExists ? 'Carpeta no encontrada' : membership.memoryPath ? 'Ya está en otra memoria' : 'Tiene un MEMORY.md que no es de Skima'
      }))
    return {
      memory,
      instructions: memory.folderExists ? await this.renderDocument(memory, memoryInstructionsFileName) : null,
      files: memory.folderExists ? await this.listFiles(memory.path) : { filePaths: [], isTruncated: false },
      projects: projects.sort((first, second) => first.name.localeCompare(second.name)),
      availableProjects: availableProjects.sort((first, second) => first.name.localeCompare(second.name)),
      unavailableProjects
    }
  }

  async getMemorizeContext(memoryId) {
    const memory = await this.describeMemory(await this.getMemory(memoryId))
    const memberships = await this.readMemberships()
    const projects = memberships
      .filter(({ membership }) => this.belongsTo(membership, memory))
      .map(({ project }) => ({ ...this.describeProject(project), path: project.path }))
      .sort((first, second) => first.name.localeCompare(second.name))
    return { memory, projects }
  }

  async previewTarget(request) {
    const { slug } = validateMemoryName(request?.name)
    const parentPath = String(request?.parentPath ?? '').trim()
    if (!parentPath) {
      throw new Error('Elige la carpeta donde crear la memoria.')
    }
    if (!this.platformPaths.path.isAbsolute(parentPath)) {
      throw new Error('La ruta debe ser absoluta.')
    }
    return this.platformPaths.path.join(this.platformPaths.path.resolve(parentPath), slug)
  }

  create(request) {
    return this.enqueue(async () => {
      const { name, slug } = validateMemoryName(request?.name)
      const targetPath = await this.previewTarget(request)
      const parentPath = this.platformPaths.path.dirname(targetPath)
      if (!(await this.isDirectory(parentPath))) {
        throw new Error('La carpeta elegida no existe.')
      }
      const memory = await this.memoriesStore.add(async (memories, id) => {
        if (memories.some((existing) => toCaseInsensitiveKey(existing.name) === toCaseInsensitiveKey(name))) {
          throw new Error('Ya tienes una memoria con ese nombre.')
        }
        const overlapping = memories.find((existing) => this.platformPaths.isPathInside(existing.path, targetPath, { allowEqual: true }) || this.platformPaths.isPathInside(targetPath, existing.path))
        if (overlapping) {
          throw new Error(`La carpeta se solapa con la memoria «${overlapping.name}».`)
        }
        if (await fs.stat(targetPath).catch(() => null)) {
          throw new Error(`Ya existe ${this.platformPaths.toDisplayPath(targetPath)}. Elige otro nombre u otra carpeta.`)
        }
        await this.writeTemplate(targetPath, name)
        return { id, name, slug, path: targetPath, createdAt: this.now().toISOString() }
      })
      return this.describeMemory(memory)
    })
  }

  async writeTemplate(targetPath, name) {
    const template = buildMemoryTemplate({ name, today: this.now().toISOString().slice(0, 10) })
    await fs.mkdir(targetPath, { recursive: false })
    try {
      for (const directory of template.directories) {
        await fs.mkdir(this.platformPaths.path.join(targetPath, directory), { recursive: true })
      }
      for (const file of template.files) {
        await fs.writeFile(this.platformPaths.path.join(targetPath, ...file.relativePath.split('/')), file.content, { encoding: 'utf-8', flag: 'wx' })
      }
    } catch (error) {
      await fs.rm(targetPath, { recursive: true, force: true }).catch(() => {})
      throw new Error(`No se pudo crear la memoria: ${error.message}`)
    }
  }

  async getProjectForLink(projectId) {
    const project = await this.projectModel.getById(String(projectId ?? ''))
    if (!project.folderExists) {
      throw new Error(`La carpeta de «${project.name}» no está disponible.`)
    }
    return project
  }

  linkProject(memoryId, projectId) {
    return this.enqueue(async () => {
      const memory = await this.describeMemory(await this.getMemory(memoryId))
      if (!memory.folderExists) {
        throw new Error('La carpeta de la memoria no existe. No se pueden añadir proyectos.')
      }
      const project = await this.getProjectForLink(projectId)
      const membership = await this.installer.readMembership(project)
      if (membership.hasFile && !this.belongsTo(membership, memory)) {
        throw new Error(membership.memoryPath
          ? `«${project.name}» ya pertenece a otra memoria (${this.platformPaths.toDisplayPath(membership.memoryPath)}). Un proyecto solo puede estar en una memoria.`
          : `«${project.name}» ya tiene un MEMORY.md que no es de Skima. Revísalo antes de añadirlo.`)
      }
      await this.installer.install(project, memory.path)
      return this.getDetails(memory.id)
    })
  }

  repairProject(memoryId, projectId) {
    return this.linkProject(memoryId, projectId)
  }

  unlinkProject(memoryId, projectId) {
    return this.enqueue(async () => {
      const memory = await this.getMemory(memoryId)
      const project = await this.getProjectForLink(projectId)
      const membership = await this.installer.readMembership(project)
      if (!this.belongsTo(membership, memory)) {
        throw new Error(`«${project.name}» no pertenece a esta memoria.`)
      }
      await this.installer.uninstall(project)
      return this.getDetails(memory.id)
    })
  }

  remove(memoryId) {
    return this.enqueue(async () => {
      const memory = await this.getMemory(memoryId)
      const memberships = await this.readMemberships()
      const linked = memberships.filter(({ membership }) => this.belongsTo(membership, memory))
      const failures = []
      for (const { project } of linked) {
        await this.installer.uninstall(project).catch((error) => failures.push(`${project.name}: ${error.message}`))
      }
      if (failures.length > 0) {
        throw new Error(`No se ha eliminado la memoria porque no se pudo sacar a todos sus proyectos. ${failures.join(' ')}`)
      }
      if (await this.isDirectory(memory.path)) {
        await this.trashItem(memory.path)
      }
      await this.memoriesStore.remove(memory.id)
      return { unlinkedProjects: linked.map(({ project }) => project.name) }
    })
  }

  async getProjectMemory(projectId) {
    const project = await this.projectModel.getById(String(projectId ?? ''))
    const membership = await this.installer.readMembership(project)
    if (!membership.memoryPath) {
      return null
    }
    const memories = await this.memoriesStore.readAll()
    const memory = memories.find((candidate) => this.platformPaths.isSamePath(candidate.path, membership.memoryPath)) ?? null
    return {
      memoryId: memory?.id ?? null,
      name: memory?.name ?? null,
      displayPath: this.platformPaths.toDisplayPath(membership.memoryPath)
    }
  }
}

module.exports = { MemoriesService }
