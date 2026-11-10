const catalogQueries = Object.freeze([
  { id: 'topic-claude-skills', kind: 'skill', query: 'topic:claude-skills fork:false' },
  { id: 'topic-agent-skills', kind: 'skill', query: 'topic:agent-skills fork:false' },
  { id: 'topic-claude-code-skills', kind: 'skill', query: 'topic:claude-code-skills fork:false' },
  { id: 'topic-anthropic-skills', kind: 'skill', query: 'topic:anthropic-skills fork:false' },
  { id: 'topic-skill-md', kind: 'skill', query: 'topic:skill-md fork:false' },
  { id: 'keyword-agent-skills', kind: 'skill', query: '"agent skills" in:name,description fork:false stars:>=5' },
  { id: 'keyword-skill-md', kind: 'skill', query: '"SKILL.md" in:readme,description fork:false stars:>=5' },
  { id: 'topic-mcp-server', kind: 'mcp', query: 'topic:mcp-server fork:false' },
  { id: 'topic-mcp-servers', kind: 'mcp', query: 'topic:mcp-servers fork:false' },
  { id: 'topic-model-context-protocol', kind: 'mcp', query: 'topic:model-context-protocol fork:false' },
  { id: 'topic-mcp', kind: 'mcp', query: 'topic:mcp fork:false stars:>=10' },
  { id: 'topic-claude-code-subagents', kind: 'subagent', query: 'topic:claude-code-subagents fork:false' },
  { id: 'topic-subagents', kind: 'subagent', query: 'topic:subagents fork:false' },
  { id: 'topic-claude-code-commands', kind: 'command', query: 'topic:claude-code-commands fork:false' },
  { id: 'topic-slash-commands', kind: 'command', query: 'topic:slash-commands fork:false' },
  { id: 'topic-claude-code', kind: null, query: 'topic:claude-code fork:false' },
  { id: 'topic-codex-cli', kind: null, query: 'topic:codex-cli fork:false' },
  { id: 'topic-opencode', kind: null, query: 'topic:opencode fork:false' },
  { id: 'topic-gemini-cli', kind: null, query: 'topic:gemini-cli fork:false' }
])

const crawlLimits = Object.freeze({
  perPage: 100,
  maximumResultsPerQuery: 1000,
  pagesPerQuery: 3,
  snapshotTtlMs: 24 * 60 * 60 * 1000,
  remoteSearchTtlMs: 60 * 60 * 1000,
  remoteSearchPerPage: 50
})

module.exports = { catalogQueries, crawlLimits }
