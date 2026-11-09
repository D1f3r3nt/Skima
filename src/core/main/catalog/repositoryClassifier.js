const catalogTypes = Object.freeze(['skill', 'mcp', 'subagent', 'command'])

const typeSignals = Object.freeze({
  mcp: {
    topics: ['mcp', 'mcp-server', 'mcp-servers', 'model-context-protocol', 'modelcontextprotocol', 'mcp-tools'],
    words: ['mcp', 'model context protocol', 'modelcontextprotocol']
  },
  skill: {
    topics: ['claude-skills', 'agent-skills', 'claude-code-skills', 'anthropic-skills', 'skill-md', 'skills', 'agentskills'],
    words: ['skill', 'skills', 'skill.md']
  },
  subagent: {
    topics: ['subagents', 'claude-code-subagents', 'sub-agents', 'claude-subagents'],
    words: ['subagent', 'subagents', 'sub-agent', 'sub-agents']
  },
  command: {
    topics: ['claude-code-commands', 'slash-commands', 'claude-commands'],
    words: ['slash command', 'slash-command', 'slash commands', 'commands']
  }
})

const relevanceWords = Object.freeze([
  'claude', 'anthropic', 'codex', 'opencode', 'gemini', 'cursor', 'copilot', 'windsurf', 'agent', 'agents',
  'skill', 'skills', 'mcp', 'model context protocol', 'subagent', 'slash command', 'llm', 'ai coding'
])

const normalize = (text) => String(text ?? '').toLowerCase()

const containsWord = (text, word) => {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`).test(text)
}

const scoreType = (type, { topics, text }) => {
  const signals = typeSignals[type]
  const topicScore = topics.filter((topic) => signals.topics.includes(topic)).length * 3
  const wordScore = signals.words.filter((word) => containsWord(text, word)).length
  return topicScore + wordScore
}

const classifyRepository = (repository, queryKinds = []) => {
  const topics = (repository.topics ?? []).map(normalize)
  const text = `${normalize(repository.name).replace(/[-_]/g, ' ')} ${normalize(repository.description)}`
  const scores = Object.fromEntries(catalogTypes.map((type) => [type, scoreType(type, { topics, text })]))

  queryKinds.filter(Boolean).forEach((kind) => {
    scores[kind] = (scores[kind] ?? 0) + 4
  })

  const [bestType, bestScore] = Object.entries(scores).sort((first, second) => second[1] - first[1])[0]
  return bestScore > 0 ? bestType : null
}

const isRelevantRepository = (repository) => {
  const topics = (repository.topics ?? []).map(normalize)
  const text = `${normalize(repository.name).replace(/[-_]/g, ' ')} ${normalize(repository.description)} ${topics.join(' ')}`
  return relevanceWords.some((word) => containsWord(text, word))
}

module.exports = { catalogTypes, classifyRepository, isRelevantRepository }
