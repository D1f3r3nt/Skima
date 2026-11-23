const skimaArtifactsDocument = require('../../../config/skimaArtifacts.json')

const freezeList = (items) => Object.freeze((Array.isArray(items) ? items : []).map((item) => Object.freeze({ ...item })))

const skimaArtifactSkills = freezeList(skimaArtifactsDocument.skills)
const skimaArtifactHooks = freezeList(skimaArtifactsDocument.hooks)

const skimaSkillNames = Object.freeze(skimaArtifactSkills.map((skill) => skill.name.toLowerCase()))
const skimaHookNames = Object.freeze(skimaArtifactHooks.map((hook) => hook.name))

const isSkimaSkill = (name) => skimaSkillNames.includes(String(name ?? '').toLowerCase())
const isSkimaHook = (name) => skimaHookNames.includes(String(name ?? ''))
const findSkimaHook = (name) => skimaArtifactHooks.find((hook) => hook.name === name) ?? null

module.exports = { skimaArtifactSkills, skimaArtifactHooks, isSkimaSkill, isSkimaHook, findSkimaHook }
