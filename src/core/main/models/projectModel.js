const crypto = require('node:crypto')
const { limits } = require('../settings/settingsSchema')
const { toCaseInsensitiveKey } = require('../platform/portableNames')

class ProjectModel {
  constructor({ settingsStore, platformPaths, fileSystemService, projectDataStore = null, now = () => new Date(), createId = () => crypto.randomUUID() }) {
    this.settingsStore = settingsStore
    this.platformPaths = platformPaths
    this.fileSystemService = fileSystemService
    this.projectDataStore = projectDataStore
    this.now = now
    this.createId = createId
  }

  async getAll() {
    const { projects } = await this.settingsStore.get()
    return Promise.all(projects.map((project) => this.withStatus(project)))
  }

  async getById(projectId) {
    const { projects } = await this.settingsStore.get()
    const project = projects.find((candidate) => candidate.id === projectId)
    if (!project) {
      throw new Error('El proyecto no existe en Skima.')
    }
    return this.withStatus(project)
  }

  async withStatus(project) {
    return {
      ...project,
      displayPath: this.platformPaths.toDisplayPath(project.path),
      folderExists: await this.fileSystemService.isDirectory(project.path)
    }
  }

  validateName(rawName, projects, ignoredProjectId = null) {
    const name = String(rawName ?? '').trim()

    if (!name) {
      throw new Error('El nombre del proyecto no puede quedar vacío.')
    }

    if (name.length > limits.projectNameMaxLength) {
      throw new Error(`El nombre no puede superar los ${limits.projectNameMaxLength} caracteres.`)
    }

    const isDuplicated = projects.some((project) =>
      project.id !== ignoredProjectId && toCaseInsensitiveKey(project.name) === toCaseInsensitiveKey(name)
    )

    if (isDuplicated) {
      throw new Error('Ya hay otro proyecto con ese nombre.')
    }

    return name
  }

  async validateFolder(rawPath, projects, ignoredProjectId = null) {
    const trimmedPath = String(rawPath ?? '').trim()

    if (!trimmedPath) {
      throw new Error('La ruta del proyecto es obligatoria.')
    }

    if (!this.platformPaths.path.isAbsolute(trimmedPath)) {
      throw new Error('La ruta del proyecto debe ser absoluta.')
    }

    const projectPath = this.platformPaths.path.resolve(trimmedPath)

    if (!(await this.fileSystemService.isDirectory(projectPath))) {
      throw new Error('La ruta seleccionada no es una carpeta válida.')
    }

    const duplicatedProject = projects.find((project) =>
      project.id !== ignoredProjectId && this.platformPaths.isSamePath(project.path, projectPath)
    )

    if (duplicatedProject) {
      throw new Error(`Esta carpeta ya está añadida como el proyecto "${duplicatedProject.name}".`)
    }

    return projectPath
  }

  async add({ name, path: rawPath, projectName } = {}) {
    let createdProject = null

    await this.settingsStore.update(async (settings) => {
      const projectPath = await this.validateFolder(rawPath, settings.projects)
      const projectNameValue = this.validateName(name ?? projectName, settings.projects)
      const nowIso = this.now().toISOString()
      createdProject = {
        id: this.createId(),
        path: projectPath,
        name: projectNameValue,
        context: '',
        createdAt: nowIso,
        updatedAt: nowIso
      }
      settings.projects.push(createdProject)
    })

    const dataFolder = this.projectDataStore ? await this.projectDataStore.ensure(createdProject.path) : null
    return { ...(await this.withStatus(createdProject)), dataFolder }
  }

  async remove(projectId) {
    await this.settingsStore.update((settings) => {
      settings.projects = settings.projects.filter((project) => project.id !== projectId)
    })
    return this.getAll()
  }

  async updateProject(projectId, applyChange) {
    let updatedProject = null

    await this.settingsStore.update(async (settings) => {
      const project = settings.projects.find((candidate) => candidate.id === projectId)
      if (!project) {
        throw new Error('El proyecto no existe en Skima.')
      }
      const hasChanged = await applyChange(project, settings.projects)
      if (hasChanged !== false) {
        project.updatedAt = this.now().toISOString()
      }
      updatedProject = { ...project }
    })

    return this.withStatus(updatedProject)
  }

  rename(projectId, rawName) {
    return this.updateProject(projectId, (project, projects) => {
      const name = this.validateName(rawName, projects, projectId)
      if (name === project.name) {
        return false
      }
      project.name = name
      return true
    })
  }

  async updateContext(projectId, rawContext) {
    const context = String(rawContext ?? '')

    if (context.length > limits.projectContextMaxLength) {
      throw new Error(`El contexto no puede superar los ${limits.projectContextMaxLength} caracteres.`)
    }

    return this.updateProject(projectId, (project) => {
      if (project.context === context) {
        return false
      }
      project.context = context
      return true
    })
  }

  relocate(projectId, rawPath) {
    return this.updateProject(projectId, async (project, projects) => {
      project.path = await this.validateFolder(rawPath, projects, projectId)
      return true
    })
  }
}

module.exports = { ProjectModel }
