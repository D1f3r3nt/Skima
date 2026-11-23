const nodeRequirement = (minimumMajor) => Object.freeze({ id: 'node', label: `Node.js ${minimumMajor} o posterior`, executable: 'node', args: ['--version'], minimumMajor })
const npmRequirement = Object.freeze({ id: 'npm', label: 'npm', executable: 'npm', args: ['--version'], minimumMajor: null })
const brewRequirement = Object.freeze({ id: 'brew', label: 'Homebrew', executable: 'brew', args: ['--version'], minimumMajor: null })
const wingetRequirement = Object.freeze({ id: 'winget', label: 'WinGet', executable: 'winget', args: ['--version'], minimumMajor: null })

const run = (executable, args) => Object.freeze({ type: 'run', executable, args: Object.freeze(args) })
const script = (url, interpreter) => Object.freeze({ type: 'script', url, interpreter })

const method = (definition) => Object.freeze({ recommended: false, elevation: 'never', modifiesShellProfile: false, notes: [], requirements: [], ...definition, requirements: Object.freeze(definition.requirements ?? []), notes: Object.freeze(definition.notes ?? []) })

const claudeCodeInstall = Object.freeze({
  documentId: 'install-claude-code-cli',
  displayName: 'Claude Code',
  platforms: Object.freeze({
    win32: Object.freeze([
      method({ id: 'npm', label: 'npm (paquete @anthropic-ai/claude-code)', recommended: true, requirements: [npmRequirement, nodeRequirement(22)], steps: [run('npm', ['install', '-g', '@anthropic-ai/claude-code'])], notes: ['Se instala a nivel de usuario si tu npm ya está configurado así.'] }),
      method({ id: 'winget', label: 'WinGet (paquete Anthropic.ClaudeCode)', requirements: [wingetRequirement], steps: [run('winget', ['install', '--id', 'Anthropic.ClaudeCode', '--exact', '--accept-package-agreements', '--accept-source-agreements'])], notes: ['WinGet no actualiza Claude Code solo.'] }),
      method({ id: 'native-script', label: 'Instalador oficial (script de PowerShell)', modifiesShellProfile: true, steps: [script('https://claude.ai/install.ps1', 'powershell')], notes: ['Descarga y ejecuta un script. Puede añadir su carpeta al PATH del usuario.'] })
    ]),
    darwin: Object.freeze([
      method({ id: 'brew-cask', label: 'Homebrew (cask claude-code)', recommended: true, requirements: [brewRequirement], steps: [run('brew', ['install', '--cask', 'claude-code'])] }),
      method({ id: 'npm', label: 'npm (paquete @anthropic-ai/claude-code)', requirements: [npmRequirement, nodeRequirement(22)], steps: [run('npm', ['install', '-g', '@anthropic-ai/claude-code'])], elevation: 'depends', notes: ['Si npm necesita permisos de administrador, Skima no continúa: usa las instrucciones manuales.'] }),
      method({ id: 'native-script', label: 'Instalador oficial (script de shell)', modifiesShellProfile: true, steps: [script('https://claude.ai/install.sh', 'bash')], notes: ['Descarga y ejecuta un script. Puede modificar el perfil de tu shell.'] })
    ]),
    linux: Object.freeze([
      method({ id: 'npm', label: 'npm (paquete @anthropic-ai/claude-code)', recommended: true, requirements: [npmRequirement, nodeRequirement(22)], steps: [run('npm', ['install', '-g', '@anthropic-ai/claude-code'])], elevation: 'depends', notes: ['Si npm necesita permisos de administrador, Skima no continúa: usa las instrucciones manuales.'] }),
      method({ id: 'native-script', label: 'Instalador oficial (script de shell)', modifiesShellProfile: true, steps: [script('https://claude.ai/install.sh', 'bash')], notes: ['Descarga y ejecuta un script. Puede modificar el perfil de tu shell.'] })
    ])
  })
})

const openCodeInstall = Object.freeze({
  documentId: 'install-opencode-cli',
  displayName: 'OpenCode',
  platforms: Object.freeze({ win32: Object.freeze([]), darwin: Object.freeze([]), linux: Object.freeze([]) })
})

const githubCliInstall = Object.freeze({
  documentId: 'install-github-cli',
  displayName: 'GitHub CLI',
  platforms: Object.freeze({
    win32: Object.freeze([
      method({ id: 'winget', label: 'WinGet (paquete GitHub.cli)', recommended: true, requirements: [wingetRequirement], steps: [run('winget', ['install', '--id', 'GitHub.cli', '--source', 'winget', '--accept-package-agreements', '--accept-source-agreements'])], elevation: 'depends', notes: ['El instalador modifica el PATH: puede hacer falta abrir una terminal nueva.'] })
    ]),
    darwin: Object.freeze([
      method({ id: 'brew', label: 'Homebrew (fórmula gh)', recommended: true, requirements: [brewRequirement], steps: [run('brew', ['install', 'gh'])] })
    ]),
    linux: Object.freeze([
      method({ id: 'brew', label: 'Homebrew (fórmula gh)', recommended: true, requirements: [brewRequirement], steps: [run('brew', ['install', 'gh'])] })
    ])
  })
})

const installRecipes = Object.freeze({
  'claude-code': claudeCodeInstall,
  opencode: openCodeInstall
})

const githubCliTool = Object.freeze({
  id: 'github-cli',
  name: 'GitHub CLI',
  executables: Object.freeze(['gh']),
  loginCommand: 'gh auth login',
  install: githubCliInstall
})

const findInstallTarget = (toolId, registry) => {
  if (toolId === githubCliTool.id) {
    return { id: githubCliTool.id, name: githubCliTool.name, executables: githubCliTool.executables, loginCommand: githubCliTool.loginCommand, install: githubCliTool.install, isAgent: false }
  }
  const entry = registry.find((candidate) => candidate.id === toolId && candidate.cli)
  return entry && entry.install ? { id: entry.id, name: entry.name, executables: entry.cli.executables, loginCommand: entry.cli.loginCommand, install: entry.install, isAgent: true } : null
}

module.exports = { installRecipes, githubCliTool, findInstallTarget }
