const toneCount = 6

const getInitials = (name) => {
  const words = String(name).trim().split(/[\s_-]+/).filter(Boolean)

  if (words.length === 0) {
    return '?'
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase()
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase()
}

const getToneIndex = (seed) => {
  const hash = [...String(seed)].reduce((accumulator, character) => accumulator + character.charCodeAt(0), 0)
  return hash % toneCount
}

export function createAvatar({ name, seed = name, size = 'medium' }) {
  const avatarElement = document.createElement('span')
  avatarElement.className = `avatar avatar--${size} avatar--tone-${getToneIndex(seed)}`
  avatarElement.textContent = getInitials(name)
  avatarElement.setAttribute('aria-hidden', 'true')
  return avatarElement
}
