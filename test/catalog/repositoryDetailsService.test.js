const test = require('node:test')
const assert = require('node:assert/strict')
const { RepositoryDetailsService, findReadme, findSkillManifests } = require('../../src/core/main/catalog/repositoryDetailsService')
const { MarkdownRenderer } = require('../../src/core/main/markdown/markdownRenderer')

const repository = {
  full_name: 'owner/skills', name: 'skills', owner: { login: 'owner' }, description: 'Skills', html_url: 'https://github.com/owner/skills',
  stargazers_count: 100, forks_count: 5, open_issues_count: 1, topics: ['claude-skills'], pushed_at: '2026-11-01T00:00:00Z',
  license: { spdx_id: 'MIT' }, default_branch: 'main'
}
const tree = ['README.md', 'skills/pdf/SKILL.md', 'skills/pdf/scripts/run.py', 'skills/pdf/README.md', 'skills/docx/SKILL.md', 'node_modules/x/SKILL.md']
const files = {
  'README.md': '# Root readme',
  'skills/pdf/README.md': '# PDF readme ![x](img.png)',
  'skills/pdf/SKILL.md': '---\nname: pdf\ndescription: Works with PDF files.\n---\n# PDF skill',
  'skills/docx/SKILL.md': '---\nname: docx\ndescription: Word.\n---\n# Docx'
}

const createService = () => new RepositoryDetailsService({
  markdownRenderer: new MarkdownRenderer(),
  githubApiClient: {
    request: async (requestPath) => {
      if (requestPath === '/repos/owner/skills') {
        return { data: repository }
      }
      if (requestPath.startsWith('/repos/owner/skills/git/trees/')) {
        return { data: { truncated: false, tree: tree.map((filePath) => ({ type: 'blob', path: filePath })) } }
      }
      throw new Error(`Petición inesperada ${requestPath}`)
    },
    fetchRawFile: async ({ filePath }) => files[filePath] ?? null
  }
})

test('localiza README y SKILL.md ignorando node_modules', () => {
  assert.equal(findReadme(tree, 'skills/pdf'), 'skills/pdf/README.md')
  assert.equal(findReadme(tree, ''), 'README.md')
  assert.deepEqual(findSkillManifests(tree, null), ['skills/pdf/SKILL.md', 'skills/docx/SKILL.md'])
  assert.deepEqual(findSkillManifests(tree, 'skills/pdf'), ['skills/pdf/SKILL.md'])
})

test('carga el detalle de una carpeta concreta con su SKILL.md y README', async () => {
  const details = await createService().getDetails({ id: 'x', origin: 'curated', type: 'skill', name: 'pdf', repository: 'owner/skills', subPath: 'skills/pdf', ref: 'main' })

  assert.deepEqual(details.documents.map((documentEntry) => documentEntry.id), ['skill', 'readme'])
  assert.equal(details.skillManifest.isValid, true)
  assert.match(details.documents[1].html, /raw\.githubusercontent\.com\/owner\/skills\/main\/skills\/pdf\/img\.png/)
  assert.equal(details.score.factors.find((factor) => factor.id === 'skillManifest').points, 10)
})

test('lista todas las skills de un repositorio con varias', async () => {
  const details = await createService().getDetails({ id: 'y', origin: 'github', type: 'skill', name: 'skills', repository: 'owner/skills', subPath: '' })
  assert.deepEqual(details.skills.map((skill) => skill.name), ['pdf', 'docx'])
  assert.equal(details.documents.find((documentEntry) => documentEntry.id === 'readme').path, 'README.md')
})
