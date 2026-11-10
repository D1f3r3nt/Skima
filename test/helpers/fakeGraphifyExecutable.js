const fs = require('node:fs')
const path = require('node:path')

const fakeScript = path.join(__dirname, '..', 'fixtures', 'fakeGraphify.js')

const createFakeGraphifyExecutable = (directory) => {
  if (process.platform === 'win32') {
    const scriptFolder = path.join(directory, 'node_modules', 'fake-graphify')
    fs.mkdirSync(scriptFolder, { recursive: true })
    fs.copyFileSync(fakeScript, path.join(scriptFolder, 'fakeGraphify.js'))
    const shimPath = path.join(directory, 'graphify.cmd')
    fs.writeFileSync(shimPath, `@ECHO off\r\nSETLOCAL\r\nnode "${path.win32.join('%~dp0', 'node_modules', 'fake-graphify', 'fakeGraphify.js')}" %*\r\n`)
    return shimPath
  }
  const executablePath = path.join(directory, 'graphify')
  fs.writeFileSync(executablePath, `#!${process.execPath}\nrequire(${JSON.stringify(fakeScript)})\n`)
  fs.chmodSync(executablePath, 0o755)
  return executablePath
}

module.exports = { createFakeGraphifyExecutable }
