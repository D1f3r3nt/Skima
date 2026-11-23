const windowsShimCommands = new Set(['npx', 'npm', 'pnpm', 'pnpx', 'yarn'])
const dangerousPatterns = [
  { pattern: /\bsudo\b/, message: 'Pide permisos de administrador (sudo).' },
  { pattern: /\brm\s+-[a-z]*r[a-z]*f|\brm\s+-[a-z]*f[a-z]*r/i, message: 'Contiene un borrado recursivo (rm -rf).' },
  { pattern: /(curl|wget|iwr|Invoke-WebRequest)[^|]*\|\s*(sh|bash|zsh|iex|powershell)/i, message: 'Descarga y ejecuta código directamente.' },
  { pattern: /(&&|\|\||;|`|\$\()/, message: 'Encadena varios comandos o usa sustitución de comandos.' },
  { pattern: /(\.ssh|\.aws|\.config\/gcloud|id_rsa|\.npmrc|\.env\b)/i, message: 'Hace referencia a archivos con credenciales.' },
  { pattern: /(^|\s)(\/etc|\/usr|C:\\Windows|System32)/i, message: 'Accede a carpetas del sistema.' }
]

const environmentNamePattern = /^[A-Za-z_][A-Za-z0-9_]*$/
const serverNamePattern = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,63}$/

const validateDefinition = (definition) => {
  const errors = []
  if (!serverNamePattern.test(String(definition?.name ?? ''))) {
    errors.push('El nombre del servidor solo admite letras, números, guiones, puntos y guiones bajos (máximo 64).')
  }
  if (definition?.transport === 'stdio') {
    if (typeof definition.command !== 'string' || !definition.command.trim() || /[\r\n]/.test(definition.command)) {
      errors.push('Falta el comando del servidor.')
    }
    if (!Array.isArray(definition.args) || definition.args.some((argument) => typeof argument !== 'string' || /[\r\n]/.test(argument))) {
      errors.push('Los argumentos deben ser textos de una línea.')
    }
  } else if (definition?.transport === 'http') {
    let parsedUrl = null
    try {
      parsedUrl = new URL(String(definition.url))
    } catch {
      errors.push('La URL del servidor no es válida.')
    }
    if (parsedUrl && parsedUrl.protocol !== 'https:' && !(parsedUrl.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(parsedUrl.hostname))) {
      errors.push('Los servidores remotos deben usar https (http solo para localhost).')
    }
  } else {
    errors.push('Transporte desconocido.')
  }
  ;(definition?.environment ?? []).forEach((variable) => {
    if (!environmentNamePattern.test(String(variable.name))) {
      errors.push(`Nombre de variable no válido: ${variable.name}`)
    }
  })
  return errors
}

const findDangerousPatterns = (definition) => {
  if (definition.transport !== 'stdio') {
    return []
  }
  const commandLine = [definition.command, ...definition.args].join(' ')
  return dangerousPatterns.filter(({ pattern }) => pattern.test(commandLine)).map(({ message }) => message)
}

const wrapCommand = (definition, { platform, wrapWindowsCommands }) => {
  if (platform === 'win32' && wrapWindowsCommands && windowsShimCommands.has(String(definition.command).toLowerCase())) {
    return { command: 'cmd', args: ['/c', definition.command, ...definition.args], wrapped: true }
  }
  return { command: definition.command, args: [...definition.args], wrapped: false }
}

const buildEnvironmentObject = (environmentValues = {}) => Object.fromEntries(
  Object.entries(environmentValues).filter(([name, value]) => environmentNamePattern.test(name) && typeof value === 'string' && value !== '')
)

const withOptional = (entry, key, value) => (value && Object.keys(value).length > 0 ? { ...entry, [key]: value } : entry)

const buildServerEntry = ({ style, definition, environmentValues, platform, wrapWindowsCommands, openCodeVersion = 1 }) => {
  const environment = buildEnvironmentObject(environmentValues)
  const headers = definition.headers ?? {}

  if (definition.transport === 'http') {
    switch (style) {
      case 'claude':
        return withOptional({ type: 'http', url: definition.url }, 'headers', headers)
      case 'vscode':
        return withOptional({ type: 'http', url: definition.url }, 'headers', headers)
      case 'openCode':
        return withOptional({ type: 'remote', url: definition.url, ...(openCodeVersion === 1 ? { enabled: true } : {}) }, 'headers', headers)
      default:
        return withOptional({ url: definition.url }, 'headers', headers)
    }
  }

  const { command, args } = wrapCommand(definition, { platform, wrapWindowsCommands })
  switch (style) {
    case 'vscode':
      return withOptional({ type: 'stdio', command, args }, 'env', environment)
    case 'openCode':
      return withOptional({ type: 'local', command: [command, ...args], ...(openCodeVersion === 1 ? { enabled: true } : {}) }, 'environment', environment)
    default:
      return withOptional({ command, args }, 'env', environment)
  }
}

const maskSecrets = (entry, secretNames) => JSON.parse(JSON.stringify(entry, (key, value) => (secretNames.includes(key) && typeof value === 'string' && value ? '••••••' : value)))

module.exports = { buildServerEntry, validateDefinition, findDangerousPatterns, wrapCommand, maskSecrets, windowsShimCommands }
