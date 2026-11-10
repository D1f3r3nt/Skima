const fs = require('node:fs')
const path = require('node:path')

const tool = path.basename(__dirname).replace(/^fake-install-/, '')
const args = process.argv.slice(2)
const scenario = process.env.FAKE_INSTALL_SCENARIO || 'ok'

if (process.env.FAKE_INSTALL_LOG) {
  fs.appendFileSync(process.env.FAKE_INSTALL_LOG, `${JSON.stringify({ tool, args, scriptContent: args.find((argument) => /installer\.(ps1|sh)$/.test(argument)) ? fs.readFileSync(args.find((argument) => /installer\.(ps1|sh)$/.test(argument)), 'utf-8') : null })}\n`)
}

if (args[0] === '--version') {
  process.stdout.write(tool === 'node' ? 'v24.1.0\n' : '10.9.0\n')
  process.exit(0)
}

if (scenario === 'slow') {
  process.stdout.write('Downloading\n')
  setInterval(() => {}, 1000)
} else if (scenario === 'eacces') {
  process.stderr.write('npm error EACCES: permission denied, mkdir /usr/lib/node_modules\n')
  process.exit(243)
} else {
  process.stdout.write('\u001b[32mInstalling\u001b[0m everything\n')
  fs.writeFileSync(process.env.FAKE_INSTALL_STATE, JSON.stringify({ installed: true, connected: process.env.FAKE_INSTALL_CONNECTED !== '0' }))
  process.exit(0)
}
