const allowedProtocols = ['https:', 'http:']

class ExternalLinkService {
  constructor({ shell }) {
    this.shell = shell
  }

  async open(url) {
    let parsedUrl

    try {
      parsedUrl = new URL(String(url))
    } catch {
      throw new Error('El enlace no es válido.')
    }

    if (!allowedProtocols.includes(parsedUrl.protocol) || parsedUrl.username || parsedUrl.password) {
      throw new Error('Solo se pueden abrir enlaces web (http o https).')
    }

    await this.shell.openExternal(parsedUrl.href)
  }
}

module.exports = { ExternalLinkService }
