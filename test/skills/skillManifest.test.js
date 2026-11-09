const test = require('node:test')
const assert = require('node:assert/strict')
const { parseSkillManifest, validateSkillName } = require('../../src/core/main/skills/skillManifest')

const codes = (issues, severity) => issues.filter((issue) => issue.severity === severity).map((issue) => issue.field)

test('lee una cabecera válida', () => {
  const manifest = parseSkillManifest('---\nname: pdf-tools\ndescription: Extracts text from PDF files. Use when the user mentions PDFs.\n---\n# PDF\n\nBody', { folderName: 'pdf-tools' })
  assert.equal(manifest.isValid, true)
  assert.equal(manifest.name, 'pdf-tools')
  assert.match(manifest.body, /^# PDF/)
})

test('acepta saltos de línea de Windows y BOM', () => {
  const manifest = parseSkillManifest('﻿---\r\nname: a\r\ndescription: "b: c"\r\n---\r\nbody')
  assert.equal(manifest.isValid, true)
  assert.equal(manifest.description, 'b: c')
})

test('detecta cabeceras ausentes o rotas sin lanzar excepciones', () => {
  assert.equal(parseSkillManifest('# Sin cabecera').isValid, false)
  const broken = parseSkillManifest('---\nname: [roto\n---\nx', { folderName: 'carpeta' })
  assert.equal(broken.isValid, false)
  assert.equal(broken.name, 'carpeta')
  assert.ok(codes(broken.issues, 'error').includes('frontmatter'))
})

test('valida el nombre según la especificación', () => {
  assert.ok(codes(validateSkillName('Mi Skill'), 'error').includes('name'))
  assert.ok(codes(validateSkillName('-pdf'), 'error').includes('name'))
  assert.ok(codes(validateSkillName('pdf--tools'), 'error').includes('name'))
  assert.ok(codes(validateSkillName('a'.repeat(65)), 'error').includes('name'))
  assert.deepEqual(codes(validateSkillName('claude-helper'), 'error'), [])
  assert.ok(codes(validateSkillName('claude-helper'), 'warning').includes('name'))
  assert.ok(codes(validateSkillName('pdf', { folderName: 'other' }), 'warning').includes('name'))
})

test('valida la descripción: vacía, larga o con etiquetas XML', () => {
  assert.ok(codes(parseSkillManifest('---\nname: a\ndescription: ""\n---\nx').issues, 'error').includes('description'))
  assert.ok(codes(parseSkillManifest(`---\nname: a\ndescription: ${'x'.repeat(1025)}\n---\nx`).issues, 'error').includes('description'))
  assert.ok(codes(parseSkillManifest('---\nname: a\ndescription: Use <b>always</b>\n---\nx').issues, 'error').includes('description'))
})

test('avisa si el cuerpo es demasiado largo', () => {
  const body = Array.from({ length: 600 }, (unused, index) => `line ${index}`).join('\n')
  const manifest = parseSkillManifest(`---\nname: a\ndescription: b\n---\n${body}`)
  assert.equal(manifest.isValid, true)
  assert.ok(codes(manifest.issues, 'warning').includes('body'))
})
