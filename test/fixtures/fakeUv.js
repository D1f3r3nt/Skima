const fs = require('node:fs')
const path = require('node:path')

const args = process.argv.slice(2)
const scenario = process.env.FAKE_UV_SCENARIO || 'ok'

if (process.env.FAKE_UV_LOG) {
  const secretNames = Object.keys(process.env).filter((name) => /API_?KEY|TOKEN|SECRET|ANTHROPIC_|OPENAI_/i.test(name))
  fs.appendFileSync(process.env.FAKE_UV_LOG, `${JSON.stringify({
    args,
    cwd: process.cwd(),
    secretNames,
    uv: {
      preference: process.env.UV_PYTHON_PREFERENCE ?? null,
      noConfig: process.env.UV_NO_CONFIG ?? null,
      cacheDirectory: process.env.UV_CACHE_DIR ?? null,
      pythonDirectory: process.env.UV_PYTHON_INSTALL_DIR ?? null
    }
  })}\n`)
}

if (args[0] === 'venv') {
  if (scenario === 'fail-venv') {
    process.stderr.write('error: no python available\n')
    process.exit(2)
  }
  fs.mkdirSync(args[1], { recursive: true })
  fs.writeFileSync(path.join(args[1], 'pyvenv.cfg'), 'home = fake\n')
  if (process.env.UV_CACHE_DIR) {
    fs.mkdirSync(process.env.UV_CACHE_DIR, { recursive: true })
    fs.writeFileSync(path.join(process.env.UV_CACHE_DIR, 'wheel.whl'), 'x')
  }
  process.stdout.write('Created virtual environment\n')
  process.exit(0)
}

if (args[0] === 'pip' && args[1] === 'install') {
  if (scenario === 'slow') {
    process.stdout.write('Downloading graphifyy\n')
    setInterval(() => {}, 1000)
  } else if (scenario === 'fail-pip') {
    process.stderr.write(`error: network connection failed for ${process.cwd()}\n`)
    process.exit(2)
  } else {
    const pythonPath = args[args.indexOf('--python') + 1]
    const venvDirectory = path.dirname(path.dirname(pythonPath))
    fs.writeFileSync(path.join(venvDirectory, 'installed.flag'), '0.9.105')
    process.stdout.write('Installed graphifyy\n')
    process.exit(0)
  }
} else {
  process.exit(1)
}
