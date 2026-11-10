const secretVariablePattern = /(API_?KEY|_TOKEN|TOKEN$|SECRET|PASSWORD|ANTHROPIC_|OPENAI_|GEMINI_|GOOGLE_|DEEPSEEK|KIMI_|OLLAMA|AWS_|AZURE_|NEO4J|FALKORDB|GRAPHIFY_.*(KEY|MODEL|BACKEND))/i

const buildGraphifyEnvironment = (baseEnvironment = process.env, extra = {}) => ({
  ...Object.fromEntries(Object.entries(baseEnvironment).filter(([name]) => !secretVariablePattern.test(name))),
  PYTHONDONTWRITEBYTECODE: '1',
  PYTHONIOENCODING: 'utf-8',
  PYTHONUTF8: '1',
  NO_COLOR: '1',
  ...extra
})

module.exports = { buildGraphifyEnvironment, secretVariablePattern }
