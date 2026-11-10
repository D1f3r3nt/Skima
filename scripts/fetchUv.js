const fs = require('node:fs')
const fsPromises = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const crypto = require('node:crypto')
const { unzipSync } = require('fflate')
const tar = require('tar')

const uvVersion = '0.10.2'
const releaseBaseUrl = `https://github.com/astral-sh/uv/releases/download/${uvVersion}`

const uvAssets = Object.freeze({
  'win32-x64': { asset: 'uv-x86_64-pc-windows-msvc.zip', sha256: '493ebbe0e06128d6ee4905e1ed5e2a433fb0f7cfc08b0eaca9fab4ca76778ae1', binary: 'uv.exe' },
  'win32-arm64': { asset: 'uv-aarch64-pc-windows-msvc.zip', sha256: '826e4ee3a03ec245e54c449e272fdf8aab749e039cc49c950ad43cc13702221f', binary: 'uv.exe' },
  'darwin-x64': { asset: 'uv-x86_64-apple-darwin.tar.gz', sha256: '3cdbd038333cfe861ce04f3d91678547bf2e726224acf5f42d3f0affa6740e19', binary: 'uv' },
  'darwin-arm64': { asset: 'uv-aarch64-apple-darwin.tar.gz', sha256: '3828b2de196687f60e9d199aea8b504299629300831eea0935ff3fe339903d0a', binary: 'uv' },
  'linux-x64': { asset: 'uv-x86_64-unknown-linux-gnu.tar.gz', sha256: '6aa4576c31f791c0b9d4739e256d07358d45e7535695287fec03cf6839e25512', binary: 'uv' },
  'linux-arm64': { asset: 'uv-aarch64-unknown-linux-gnu.tar.gz', sha256: '4998f545234d52fc6f1280827d392f00a9278295050d59c53a776546dbf0124d', binary: 'uv' }
})

const outputDirectory = path.join(__dirname, '..', 'build', 'uv')

const resolveTarget = () => {
  const requested = process.env.UV_TARGET
  const target = requested ?? `${process.platform}-${process.arch}`
  if (!uvAssets[target]) {
    throw new Error(`No hay un uv fijado para ${target}. Objetivos admitidos: ${Object.keys(uvAssets).join(', ')}.`)
  }
  return target
}

const download = async (url) => {
  const response = await fetch(url, { redirect: 'follow' })
  if (!response.ok) {
    throw new Error(`No se pudo descargar ${url} (error ${response.status}).`)
  }
  return Buffer.from(await response.arrayBuffer())
}

const extractFromZip = (buffer, binaryName) => {
  const files = unzipSync(new Uint8Array(buffer), { filter: (file) => path.posix.basename(file.name) === binaryName })
  const entry = Object.entries(files).find(([name]) => path.posix.basename(name) === binaryName)
  if (!entry) {
    throw new Error(`No se encontró ${binaryName} en el archivo descargado.`)
  }
  return Buffer.from(entry[1])
}

const extractFromTarball = async (buffer, binaryName) => {
  const workDirectory = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'skima-uv-'))
  try {
    const archivePath = path.join(workDirectory, 'uv.tar.gz')
    await fsPromises.writeFile(archivePath, buffer)
    await tar.extract({ file: archivePath, cwd: workDirectory, filter: (entryPath) => path.posix.basename(entryPath) === binaryName, strip: 1 })
    return await fsPromises.readFile(path.join(workDirectory, binaryName))
  } finally {
    await fsPromises.rm(workDirectory, { recursive: true, force: true })
  }
}

const main = async () => {
  const target = resolveTarget()
  const { asset, sha256, binary } = uvAssets[target]
  const destination = path.join(outputDirectory, binary)
  const markerPath = path.join(outputDirectory, '.version')
  if (fs.existsSync(destination) && fs.existsSync(markerPath) && fs.readFileSync(markerPath, 'utf-8') === `${uvVersion} ${target}`) {
    console.log(`uv ${uvVersion} (${target}) ya está preparado.`)
    return
  }
  console.log(`Descargando uv ${uvVersion} para ${target}…`)
  const archive = await download(`${releaseBaseUrl}/${asset}`)
  const actual = crypto.createHash('sha256').update(archive).digest('hex')
  if (actual !== sha256) {
    throw new Error(`La huella SHA-256 de ${asset} no coincide (${actual}). No se usa.`)
  }
  const executable = asset.endsWith('.zip') ? extractFromZip(archive, binary) : await extractFromTarball(archive, binary)
  await fsPromises.rm(outputDirectory, { recursive: true, force: true })
  await fsPromises.mkdir(outputDirectory, { recursive: true })
  await fsPromises.writeFile(destination, executable, { mode: 0o755 })
  await fsPromises.writeFile(markerPath, `${uvVersion} ${target}`)
  console.log(`uv ${uvVersion} listo en build/uv (huella comprobada).`)
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
