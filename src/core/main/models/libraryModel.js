const artifactTypes = ['subagent', 'skill', 'mcp', 'command']

class LibraryModel {
  constructor({ storage }) {
    this.storage = storage
  }

  async getAll() {
    const storedArtifacts = await this.storage.read()

    if (!Array.isArray(storedArtifacts)) {
      return []
    }

    return storedArtifacts
      .filter((artifact) => artifactTypes.includes(artifact?.type) && artifact.name && artifact.url)
      .map((artifact) => ({
        type: artifact.type,
        name: String(artifact.name),
        description: String(artifact.description ?? ''),
        source: String(artifact.source ?? ''),
        url: String(artifact.url)
      }))
  }
}

module.exports = { LibraryModel }
