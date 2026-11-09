const zlib = require('node:zlib')

const writeString = (buffer, offset, length, value) => {
  buffer.write(String(value).slice(0, length), offset, length, 'utf-8')
}

const writeOctal = (buffer, offset, length, value) => {
  writeString(buffer, offset, length, `${value.toString(8).padStart(length - 1, '0')}\0`)
}

const createHeader = ({ path, type = '0', size = 0, mode = 0o644, linkname = '' }) => {
  const header = Buffer.alloc(512, 0)
  writeString(header, 0, 100, path)
  writeOctal(header, 100, 8, mode)
  writeOctal(header, 108, 8, 0)
  writeOctal(header, 116, 8, 0)
  writeOctal(header, 124, 12, size)
  writeOctal(header, 136, 12, Math.floor(Date.parse('2026-01-01') / 1000))
  header.fill(' ', 148, 156)
  writeString(header, 156, 1, type)
  writeString(header, 157, 100, linkname)
  writeString(header, 257, 6, 'ustar\0')
  writeString(header, 263, 2, '00')
  const checksum = header.reduce((sum, byte) => sum + byte, 0)
  writeString(header, 148, 8, `${checksum.toString(8).padStart(6, '0')}\0 `)
  return header
}

const buildTarGz = (entries) => {
  const blocks = entries.flatMap((entry) => {
    const content = Buffer.from(entry.content ?? '', 'utf-8')
    const header = createHeader({ ...entry, size: entry.type === '0' || entry.type === undefined ? content.length : 0 })
    if (!content.length || (entry.type && entry.type !== '0')) {
      return [header]
    }
    const padding = Buffer.alloc((512 - (content.length % 512)) % 512, 0)
    return [header, content, padding]
  })
  return zlib.gzipSync(Buffer.concat([...blocks, Buffer.alloc(1024, 0)]))
}

module.exports = { buildTarGz }
