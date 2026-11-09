const minimumScore = 18
const minimumTokenSimilarity = 0.55

const normalizeText = (text) =>
  String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const tokenize = (text) => normalizeText(text).split(' ').filter(Boolean)

const getBigrams = (word) => {
  const bigrams = []
  for (let index = 0; index < word.length - 1; index += 1) {
    bigrams.push(word.slice(index, index + 2))
  }
  return bigrams
}

const getDiceSimilarity = (firstWord, secondWord) => {
  if (firstWord.length < 2 || secondWord.length < 2) {
    return 0
  }

  const firstBigrams = getBigrams(firstWord)
  const remainingBigrams = getBigrams(secondWord)
  let sharedCount = 0

  firstBigrams.forEach((bigram) => {
    const matchIndex = remainingBigrams.indexOf(bigram)
    if (matchIndex !== -1) {
      sharedCount += 1
      remainingBigrams.splice(matchIndex, 1)
    }
  })

  return (2 * sharedCount) / (firstWord.length + secondWord.length - 2)
}

const getTokenSimilarity = (queryToken, candidateToken) => {
  if (candidateToken === queryToken) {
    return 1
  }

  if (candidateToken.startsWith(queryToken)) {
    return 0.9
  }

  if (queryToken.length >= 3 && candidateToken.includes(queryToken)) {
    return 0.75
  }

  if (queryToken.length < 3) {
    return 0
  }

  const similarity = getDiceSimilarity(queryToken, candidateToken)
  return similarity >= minimumTokenSimilarity ? similarity * 0.8 : 0
}

const getBestTokenSimilarity = (queryToken, candidateTokens) =>
  candidateTokens.reduce((bestSimilarity, candidateToken) =>
    Math.max(bestSimilarity, getTokenSimilarity(queryToken, candidateToken)), 0)

const isSubsequence = (query, text) => {
  let queryIndex = 0
  for (const character of text) {
    if (character === query[queryIndex]) {
      queryIndex += 1
    }
    if (queryIndex === query.length) {
      return true
    }
  }
  return false
}

const scoreArtifact = (indexedArtifact, normalizedQuery, queryTokens) => {
  const { normalizedName, normalizedDescription, nameTokens, descriptionTokens } = indexedArtifact
  let score = 0

  if (normalizedName === normalizedQuery) {
    score += 100
  } else if (normalizedName.startsWith(normalizedQuery)) {
    score += 70
  } else if (normalizedName.includes(normalizedQuery)) {
    score += 50
  }

  if (normalizedQuery.length >= 3 && normalizedDescription.includes(normalizedQuery)) {
    score += 25
  }

  const compactQuery = normalizedQuery.replaceAll(' ', '')
  if (compactQuery.length >= 3 && isSubsequence(compactQuery, normalizedName.replaceAll(' ', ''))) {
    score += 12
  }

  const tokenScore = queryTokens.reduce((accumulatedScore, queryToken) => {
    const nameSimilarity = getBestTokenSimilarity(queryToken, nameTokens)
    const descriptionSimilarity = getBestTokenSimilarity(queryToken, descriptionTokens) * 0.6
    return accumulatedScore + Math.max(nameSimilarity, descriptionSimilarity)
  }, 0)

  return score + (tokenScore / queryTokens.length) * 40
}

export function createArtifactIndex(artifacts) {
  return artifacts.map((artifact) => ({
    artifact,
    normalizedName: normalizeText(artifact.name),
    normalizedDescription: normalizeText(artifact.description),
    nameTokens: tokenize(artifact.name),
    descriptionTokens: tokenize(artifact.description)
  }))
}

export function searchArtifacts(artifactIndex, query) {
  const normalizedQuery = normalizeText(query)
  const queryTokens = tokenize(query)

  if (!normalizedQuery) {
    return []
  }

  return artifactIndex
    .map((indexedArtifact) => ({
      artifact: indexedArtifact.artifact,
      score: scoreArtifact(indexedArtifact, normalizedQuery, queryTokens)
    }))
    .filter((result) => result.score >= minimumScore)
    .sort((firstResult, secondResult) => secondResult.score - firstResult.score)
}
