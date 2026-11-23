const { app, nativeImage } = require('electron')
const fs = require('node:fs')
const path = require('node:path')

const iconsDirectory = path.join(__dirname, '..', 'src', 'assets', 'icons')
const sourceIconPath = path.join(iconsDirectory, 'skima.png')
const icnsPath = path.join(iconsDirectory, 'skima.icns')
const linuxIconsDirectory = path.join(iconsDirectory, 'png')

const icnsEntries = [
  ['icp4', 16],
  ['icp5', 32],
  ['icp6', 64],
  ['ic07', 128],
  ['ic08', 256],
  ['ic09', 512],
  ['ic10', 1024],
  ['ic11', 32],
  ['ic12', 64],
  ['ic13', 256],
  ['ic14', 512]
]
const linuxSizes = [16, 32, 48, 64, 128, 256, 512, 1024]

const resizePng = (image, size) => image.resize({ width: size, height: size, quality: 'best' }).toPNG()

const buildIcns = (image) => {
  const chunks = icnsEntries.map(([type, size]) => {
    const png = resizePng(image, size)
    const header = Buffer.alloc(8)
    header.write(type, 0, 'ascii')
    header.writeUInt32BE(png.length + 8, 4)
    return Buffer.concat([header, png])
  })
  const body = Buffer.concat(chunks)
  const header = Buffer.alloc(8)
  header.write('icns', 0, 'ascii')
  header.writeUInt32BE(body.length + 8, 4)
  return Buffer.concat([header, body])
}

app.whenReady().then(() => {
  const image = nativeImage.createFromPath(sourceIconPath)
  if (image.isEmpty()) {
    throw new Error(`No se pudo leer ${sourceIconPath}`)
  }
  fs.writeFileSync(icnsPath, buildIcns(image))
  fs.mkdirSync(linuxIconsDirectory, { recursive: true })
  linuxSizes.forEach((size) => fs.writeFileSync(path.join(linuxIconsDirectory, `${size}x${size}.png`), resizePng(image, size)))
  process.stdout.write(`Iconos generados en ${iconsDirectory}\n`)
  app.quit()
}).catch((error) => {
  process.stderr.write(`${error.message}\n`)
  app.exit(1)
})
