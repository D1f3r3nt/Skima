const test = require('node:test')
const assert = require('node:assert/strict')
const {
  validatePortableName,
  findCaseInsensitiveCollision,
  validatePathLength
} = require('../../src/core/main/platform/portableNames')

const codesOf = (name) => validatePortableName(name).map((issue) => issue.code)

test('acepta nombres válidos en los tres sistemas', () => {
  assert.deepEqual(codesOf('revisar-pull-requests'), [])
  assert.deepEqual(codesOf('pdf'), [])
})

test('rechaza caracteres prohibidos en Windows', () => {
  for (const character of ['<', '>', ':', '"', '/', '\\', '|', '?', '*']) {
    assert.ok(codesOf(`mi${character}skill`).includes('forbiddenCharacter'), character)
  }
})

test('rechaza nombres reservados de Windows también con extensión', () => {
  for (const name of ['CON', 'nul', 'Com1', 'LPT9', 'aux.txt', 'COM¹']) {
    assert.ok(codesOf(name).includes('reservedName'), name)
  }
  assert.deepEqual(codesOf('console'), [])
})

test('rechaza puntos o espacios finales, vacíos y control', () => {
  assert.ok(codesOf('skill.').includes('trailingDotOrSpace'))
  assert.ok(codesOf('skill ').includes('trailingDotOrSpace'))
  assert.ok(codesOf('').includes('empty'))
  assert.ok(codesOf('..').includes('dotName'))
  assert.ok(codesOf('a\u0001b').includes('controlCharacter'))
  assert.ok(codesOf('a'.repeat(256)).includes('tooLong'))
})

test('detecta colisiones en sistemas que no distinguen mayúsculas', () => {
  assert.equal(findCaseInsensitiveCollision('Mi-Skill', ['mi-skill', 'otra']), 'mi-skill')
  assert.equal(findCaseInsensitiveCollision('mi-skill', ['mi-skill']), null)
})

test('valida la longitud máxima de ruta de cada sistema', () => {
  const longPath = `C:\\${'a'.repeat(300)}`
  const windowsResult = validatePathLength(longPath, 'win32')
  assert.equal(windowsResult.ok, false)
  assert.match(windowsResult.message, /260/)
  assert.equal(validatePathLength(longPath, 'linux').ok, true)
})
