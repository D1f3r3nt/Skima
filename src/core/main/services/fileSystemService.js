const fs = require('node:fs/promises')

class FileSystemService {
  async isDirectory(targetPath) {
    try {
      const stats = await fs.stat(targetPath)
      return stats.isDirectory()
    } catch {
      return false
    }
  }
}

module.exports = { FileSystemService }
