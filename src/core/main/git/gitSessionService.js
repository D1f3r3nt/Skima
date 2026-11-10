const { gitDownloadUrl, githubCliDownloadUrl } = require('./gitToolchain')

const githubHost = 'github.com'
const tokenPatterns = Object.freeze([/^ghp_[A-Za-z0-9]{30,}$/, /^github_pat_[A-Za-z0-9_]{40,}$/, /^gho_[A-Za-z0-9]{30,}$/, /^ghu_[A-Za-z0-9]{30,}$/, /^[0-9a-f]{40}$/])
const usernamePattern = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/
const publishScopes = Object.freeze(['repo', 'public_repo'])
const oneTimeCodePattern = /\b([A-Z0-9]{4}-[A-Z0-9]{4})\b/
const loginTimeoutMs = 5 * 60 * 1000

const createSessionError = (code, message) => Object.assign(new Error(message), { code })

const parseScopes = (text) => {
  const line = /Token scopes?:\s*(.+)/i.exec(text)?.[1]
  if (!line) {
    return null
  }
  return [...line.matchAll(/'([^']+)'/g)].map((match) => match[1])
}

const parseCredentialOutput = (text) => Object.fromEntries(String(text ?? '').split(/\r?\n/).filter((line) => line.includes('=')).map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]))

class GitSessionService {
  constructor({ toolchain, fetchImplementation = globalThis.fetch, broadcast = () => {} }) {
    this.toolchain = toolchain
    this.fetchImplementation = fetchImplementation
    this.broadcast = broadcast
    this.loginController = null
  }

  async detectGhSession() {
    const status = await this.toolchain.runGh(['auth', 'status', '--hostname', githubHost], { timeoutMs: 20000 })
    if (status.missing) {
      return { present: false, reason: 'missing' }
    }
    const combined = `${status.stdout}\n${status.stderr}`
    if (status.exitCode !== 0) {
      const looksExpired = /token.*(invalid|expired)|failed to log in|authentication failed/i.test(combined)
      return { present: looksExpired, invalid: looksExpired, reason: looksExpired ? 'invalid' : 'none' }
    }
    const account = await this.toolchain.runGh(['api', 'user', '--hostname', githubHost], { timeoutMs: 20000 })
    let profile = null
    if (account.exitCode === 0) {
      try {
        profile = JSON.parse(account.stdout)
      } catch {
        profile = null
      }
    }
    const scopes = parseScopes(combined)
    return {
      present: true,
      invalid: false,
      verifiedOnline: Boolean(profile),
      user: profile?.login ?? /account\s+(\S+)/i.exec(combined)?.[1] ?? null,
      name: profile?.name ?? null,
      email: profile?.email ?? null,
      scopes
    }
  }

  async detectCredentialSession() {
    const result = await this.toolchain.runGit(['credential', 'fill'], {
      input: `protocol=https\nhost=${githubHost}\n\n`,
      timeoutMs: 15000,
      environment: { GIT_ASKPASS: '', SSH_ASKPASS: '' },
      maxOutputBytes: 16 * 1024
    })
    if (result.missing || result.exitCode !== 0) {
      return { present: false }
    }
    const fields = parseCredentialOutput(result.stdout)
    const present = Boolean(fields.password)
    return { present, user: fields.username || null }
  }

  async getStatus({ refresh = false } = {}) {
    const [git, gh] = await Promise.all([this.toolchain.locate('git', { refresh }), this.toolchain.locate('gh', { refresh })])
    const base = {
      git: { installed: git.installed, version: git.version, downloadUrl: gitDownloadUrl },
      gh: { installed: gh.installed, version: gh.version, downloadUrl: githubCliDownloadUrl },
      host: githubHost,
      session: null
    }
    if (!git.installed) {
      return base
    }
    if (gh.installed) {
      const ghSession = await this.detectGhSession().catch(() => ({ present: false }))
      if (ghSession.present) {
        return { ...base, session: this.describeSession({ ...ghSession, method: 'gh' }) }
      }
    }
    const credential = await this.detectCredentialSession().catch(() => ({ present: false }))
    if (credential.present) {
      return { ...base, session: this.describeSession({ ...credential, method: 'credential-manager', invalid: false, verifiedOnline: false, scopes: null }) }
    }
    return base
  }

  describeSession(session) {
    const hasPublishScope = Array.isArray(session.scopes) && session.scopes.some((scope) => publishScopes.includes(scope))
    const canPublishKnown = session.method === 'gh' && !session.invalid
    return {
      method: session.method,
      user: session.user ?? null,
      name: session.name ?? null,
      email: session.email ?? null,
      scopes: session.scopes ?? null,
      invalid: Boolean(session.invalid),
      verifiedOnline: Boolean(session.verifiedOnline),
      canClone: !session.invalid,
      canPublish: canPublishKnown && (session.scopes === null || hasPublishScope),
      publishHint: session.method !== 'gh'
        ? 'Publicar skills necesita una sesión de GitHub CLI. Esta sesión solo sirve para clonar.'
        : (session.scopes !== null && !hasPublishScope ? 'La sesión de GitHub CLI no tiene permisos para crear pull requests. Inicia sesión de nuevo.' : null)
    }
  }

  async logout() {
    const status = await this.getStatus()
    if (!status.session) {
      return status
    }
    if (status.session.method === 'gh') {
      const result = await this.toolchain.runGh(['auth', 'logout', '--hostname', githubHost], { timeoutMs: 20000 })
      if (result.exitCode !== 0) {
        throw createSessionError('LOGOUT_FAILED', 'No se ha podido cerrar la sesión de GitHub CLI.')
      }
    } else {
      await this.toolchain.runGit(['credential', 'reject'], { input: `protocol=https\nhost=${githubHost}\n\n`, timeoutMs: 15000 })
    }
    return this.getStatus({ refresh: true })
  }

  validateTokenInput({ host, username, token }) {
    if (host !== githubHost) {
      throw createSessionError('UNSUPPORTED_HOST', 'En esta versión solo se admite github.com.')
    }
    if (!usernamePattern.test(String(username ?? ''))) {
      throw createSessionError('INVALID_USERNAME', 'El nombre de usuario no es válido.')
    }
    if (!tokenPatterns.some((pattern) => pattern.test(String(token ?? '')))) {
      throw createSessionError('INVALID_TOKEN_FORMAT', 'El token no tiene el formato de un token de GitHub.')
    }
  }

  async saveToken({ host = githubHost, username, token }) {
    this.validateTokenInput({ host, username, token })
    const git = await this.toolchain.locate('git')
    if (!git.installed) {
      throw createSessionError('GIT_MISSING', 'Git no está instalado.')
    }
    let response
    try {
      response = await this.fetchImplementation('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'Skima-Desktop' }
      })
    } catch {
      throw createSessionError('OFFLINE', 'No se ha podido comprobar el token porque no hay conexión con GitHub.')
    }
    if (response.status === 401 || response.status === 403) {
      throw createSessionError('TOKEN_REJECTED', 'GitHub ha rechazado el token. Revisa que no haya caducado y que tenga permiso de lectura de contenidos.')
    }
    if (!response.ok) {
      throw createSessionError('VERIFY_FAILED', 'GitHub no ha podido comprobar el token ahora mismo.')
    }
    const profile = await response.json().catch(() => null)
    if (profile?.login && profile.login.toLowerCase() !== String(username).toLowerCase()) {
      throw createSessionError('USERNAME_MISMATCH', 'El token pertenece a otro usuario distinto del que has escrito.')
    }
    const result = await this.toolchain.runGit(['credential', 'approve'], {
      input: `protocol=https\nhost=${host}\nusername=${username}\npassword=${token}\n\n`,
      timeoutMs: 20000
    })
    if (result.exitCode !== 0) {
      throw createSessionError('STORE_FAILED', 'Git no ha podido guardar la credencial en el gestor de credenciales del sistema.')
    }
    return this.getStatus({ refresh: true })
  }

  async startGhLogin() {
    if (this.loginController) {
      throw createSessionError('LOGIN_IN_PROGRESS', 'Ya hay un inicio de sesión en curso.')
    }
    const gh = await this.toolchain.locate('gh')
    if (!gh.installed) {
      throw createSessionError('GH_MISSING', 'GitHub CLI no está instalado.')
    }
    const controller = new AbortController()
    this.loginController = controller
    let codeSent = false
    const handleOutput = (text) => {
      const code = oneTimeCodePattern.exec(text)?.[1]
      if (code && !codeSent) {
        codeSent = true
        this.broadcast({ type: 'code', code, verificationUrl: 'https://github.com/login/device' })
      }
    }
    const finished = this.toolchain.runGh(
      ['auth', 'login', '--hostname', githubHost, '--git-protocol', 'https', '--web', '--skip-ssh-key'],
      { timeoutMs: loginTimeoutMs, signal: controller.signal, input: '\n', onStdout: handleOutput, onStderr: handleOutput }
    ).then(async (result) => {
      this.loginController = null
      if (result.aborted) {
        this.broadcast({ type: 'cancelled' })
      } else if (result.timedOut) {
        this.broadcast({ type: 'timeout' })
      } else if (result.exitCode === 0) {
        this.broadcast({ type: 'done', status: await this.getStatus({ refresh: true }) })
      } else {
        this.broadcast({ type: 'failed', message: 'No se ha podido iniciar la sesión con GitHub CLI.' })
      }
    })
    finished.catch(() => {
      this.loginController = null
      this.broadcast({ type: 'failed', message: 'No se ha podido iniciar la sesión con GitHub CLI.' })
    })
    return { started: true }
  }

  cancelGhLogin() {
    this.loginController?.abort()
    return true
  }
}

module.exports = { GitSessionService, githubHost, parseScopes, parseCredentialOutput, loginTimeoutMs }
