const fs = require('node:fs/promises')
const path = require('node:path')

const hardPatterns = Object.freeze([
  { id: 'prompt-injection', pattern: /ignore (all )?(previous|prior|above) (instructions|prompts)|disregard (the )?(system|previous) (prompt|instructions)|you are now (in )?(developer|dan) mode/i, message: 'Texto dirigido a una IA para ignorar instrucciones.' },
  { id: 'pipe-to-shell', pattern: /(curl|wget)[^\n|]*\|\s*(sudo\s+)?(ba|z)?sh\b/i, message: 'Descarga y ejecuta un script (curl | sh).' },
  { id: 'credential-access', pattern: /~\/\.ssh|\.aws\/credentials|\/etc\/shadow|\.npmrc|id_rsa/i, message: 'Accede a credenciales del usuario.' },
  { id: 'obfuscation', pattern: /base64\s+(-d|--decode)[^\n]*\|\s*(ba|z)?sh|eval\(\s*atob\(|\\u200b|​|‮/i, message: 'Contenido ofuscado u oculto.' }
])
const softPatterns = Object.freeze([
  { id: 'network-call', pattern: /\b(requests\.(get|post)|urllib\.request|fetch\(|axios\.|curl |wget )/i, message: 'Hace llamadas de red.' },
  { id: 'process-spawn', pattern: /\b(subprocess\.|child_process|os\.system\(|exec\(|spawn\()/i, message: 'Lanza procesos.' },
  { id: 'eval', pattern: /\beval\(|\bnew Function\(/, message: 'Usa eval.' },
  { id: 'install', pattern: /\b(pip install|npm install|npm i |apt(-get)? install|brew install)\b/i, message: 'Instala dependencias.' }
])
const scannedExtensions = new Set(['.md', '.txt', '.py', '.js', '.mjs', '.cjs', '.ts', '.sh', '.ps1', '.json', '.yaml', '.yml', '.toml', '.html'])

const scanFiles = async (filePaths) => {
  const hard = []
  const soft = new Set()
  for (const filePath of filePaths) {
    if (!scannedExtensions.has(path.extname(filePath).toLowerCase())) {
      continue
    }
    const stats = await fs.stat(filePath)
    if (stats.size > 2 * 1024 * 1024) {
      continue
    }
    const text = await fs.readFile(filePath, 'utf-8').catch(() => '')
    hardPatterns.forEach((rule) => rule.pattern.test(text) && hard.push(`${rule.message} (${path.basename(filePath)})`))
    softPatterns.forEach((rule) => rule.pattern.test(text) && soft.add(rule.message))
  }
  return { hard, soft: [...soft] }
}


module.exports = { scanFiles, hardPatterns, softPatterns, scannedExtensions }
