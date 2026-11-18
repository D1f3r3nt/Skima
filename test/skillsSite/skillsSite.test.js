const test = require('node:test')
const assert = require('node:assert/strict')
const { evaluateSkillsSiteUrl } = require('../../src/core/main/skillsSite/skillsSitePolicy')
const { isForbiddenShortcut } = require('../../src/core/main/skillsSite/skillsSiteGuard')
const { SkillsShInstaller, buildCliArguments, toCliAgentId, stripAnsi } = require('../../src/core/main/skillsSite/skillsShInstaller')

test('solo se permite navegar por https://www.skills.sh fuera de /docs', () => {
  assert.equal(evaluateSkillsSiteUrl('https://www.skills.sh/').allowed, true)
  assert.equal(evaluateSkillsSiteUrl('https://www.skills.sh/vercel-labs/skills/find-skills').allowed, true)
  assert.equal(evaluateSkillsSiteUrl('https://www.skills.sh/docsify').allowed, true)
  assert.deepEqual(evaluateSkillsSiteUrl('https://www.skills.sh/docs'), { allowed: false, reason: 'docs' })
  assert.deepEqual(evaluateSkillsSiteUrl('https://www.skills.sh/DOCS/cli?x=1'), { allowed: false, reason: 'docs' })
  assert.deepEqual(evaluateSkillsSiteUrl('https://skills.sh/'), { allowed: false, reason: 'external' })
  assert.deepEqual(evaluateSkillsSiteUrl('http://www.skills.sh/'), { allowed: false, reason: 'external' })
  assert.deepEqual(evaluateSkillsSiteUrl('https://github.com/vercel-labs/skills'), { allowed: false, reason: 'external' })
  assert.deepEqual(evaluateSkillsSiteUrl('https://user@www.skills.sh/'), { allowed: false, reason: 'external' })
  assert.deepEqual(evaluateSkillsSiteUrl('not a url'), { allowed: false, reason: 'invalid' })
})

test('se bloquean los atajos de herramientas de desarrollo y nuevas ventanas', () => {
  assert.equal(isForbiddenShortcut({ key: 'F12' }), true)
  assert.equal(isForbiddenShortcut({ key: 'I', control: true, shift: true }), true)
  assert.equal(isForbiddenShortcut({ key: 'i', meta: true, shift: true }), true)
  assert.equal(isForbiddenShortcut({ key: 't', control: true }), true)
  assert.equal(isForbiddenShortcut({ key: 'c', control: true }), false)
  assert.equal(isForbiddenShortcut({ key: 'i' }), false)
})

test('los argumentos del CLI de skills.sh seleccionan los agentes y el ámbito', () => {
  assert.deepEqual(
    buildCliArguments({ source: 'https://github.com/vercel-labs/skills', skill: 'find-skills', cliAgentIds: ['claude-code', 'roo'], scope: 'global' }),
    ['add', 'https://github.com/vercel-labs/skills', '--skill', 'find-skills', '--agent', 'claude-code', 'roo', '--yes', '--global']
  )
  assert.equal(buildCliArguments({ source: 'a/b', skill: 'c', cliAgentIds: ['codex'], scope: 'project' }).includes('--global'), false)
  assert.equal(toCliAgentId('roo-code'), 'roo')
  assert.equal(toCliAgentId('kilo-code'), 'kilo')
  assert.equal(toCliAgentId('claude-code'), 'claude-code')
  assert.equal(stripAnsi('\u001b[?25l│\u001b[1G\u001b[J◇  Done'), '│◇  Done')
})

const createInstaller = ({ runResult = { exitCode: 0, stdout: 'ok', stderr: '' }, enabled = ['claude-code', 'roo-code'] } = {}) => {
  const calls = []
  const installer = new SkillsShInstaller({
    registry: [{ id: 'claude-code', name: 'Claude Code' }, { id: 'roo-code', name: 'Roo Code' }, { id: 'codex', name: 'Codex' }],
    settingsStore: { get: async () => ({ agents: Object.fromEntries(enabled.map((id) => [id, { enabled: true }])) }) },
    projectModel: {
      getAll: async () => [{ id: 'p1', name: 'Demo', displayPath: '~/demo', folderExists: true, path: '/home/demo' }],
      getById: async () => ({ id: 'p1', name: 'Demo', folderExists: true, path: '/home/demo' })
    },
    executableLocator: { find: async () => ({ path: '/usr/bin/npx' }), buildEnvironmentPath: async () => '/usr/bin' },
    processRunner: { run: async (options) => { calls.push(options); return { truncated: false, timedOut: false, aborted: false, ...runResult } } },
    platformPaths: { homeDirectory: '/home/user', isWindows: false },
    environment: {}
  })
  return { installer, calls }
}

test('instala en un proyecto con los agentes activados mediante npx skills', async () => {
  const { installer, calls } = createInstaller()
  const outcome = await installer.install({ source: 'vercel-labs/skills', skill: 'find-skills', scope: 'project', projectId: 'p1' })
  assert.equal(outcome.ok, true)
  assert.deepEqual(outcome.agents, ['Claude Code', 'Roo Code'])
  assert.equal(calls[0].cwd, '/home/demo')
  assert.deepEqual(calls[0].args, ['--yes', 'skills@1', 'add', 'vercel-labs/skills', '--skill', 'find-skills', '--agent', 'claude-code', 'roo', '--yes'])
})

test('instala solo para los agentes elegidos', async () => {
  const { installer, calls } = createInstaller()
  const outcome = await installer.install({ source: 'vercel-labs/skills', skill: 'find-skills', scope: 'global', agentIds: ['claude-code'] })
  assert.deepEqual(outcome.agents, ['Claude Code'])
  assert.deepEqual(calls[0].args, ['--yes', 'skills@1', 'add', 'vercel-labs/skills', '--skill', 'find-skills', '--agent', 'claude-code', '--yes', '--global'])
  await assert.rejects(installer.install({ source: 'vercel-labs/skills', skill: 'find-skills', scope: 'global', agentIds: [] }), { code: 'NO_AGENTS_SELECTED' })
})

test('rechaza orígenes no válidos y la falta de agentes', async () => {
  const { installer } = createInstaller()
  await assert.rejects(installer.install({ source: 'https://evil.com/a/b', skill: 'x', scope: 'global' }), { code: 'INVALID_SKILL' })
  await assert.rejects(installer.install({ source: 'a/b', skill: 'x; rm -rf', scope: 'global' }), { code: 'INVALID_SKILL' })
  const withoutAgents = createInstaller({ enabled: [] }).installer
  await assert.rejects(withoutAgents.install({ source: 'a/b', skill: 'x', scope: 'global' }), { code: 'NO_AGENTS' })
})

test('describe muestra el comando que se lanzará en cada ámbito', async () => {
  const { installer } = createInstaller()
  const description = await installer.describe({ source: 'vercel-labs/skills', skill: 'find-skills' })
  assert.equal(description.commands.global, 'npx skills add vercel-labs/skills --skill find-skills --agent claude-code roo --yes --global')
  assert.equal(description.commands.project, 'npx skills add vercel-labs/skills --skill find-skills --agent claude-code roo --yes')
})
