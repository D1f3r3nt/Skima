---
id: skill-structure-template
title: Optimal SKILL.md structure used by Skima
description: The section-by-section SKILL.md template Skima generates, with the purpose of each section and what each slot must contain. Read it to fill or check the template slots.
tags: [skills, template, structure, sections]
audience: ai
applies_to: [skill-optimize-en, skill-wizard, skill-template]
sources:
  - title: Agent Skills specification (body content, progressive disclosure)
    url: https://agentskills.io/specification
  - title: Anthropic, Skill authoring best practices
    url: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
  - title: Anthropic, Agent Skills overview (skill structure example)
    url: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview
retrieved_at: 2026-11-09
review_after: 2027-05-09
confidence: medium
confidence_note: The spec imposes no body format. The section list below is Skima's synthesis of the recommended content (instructions, examples, edge cases, references one level deep), not an official template.
license: Original Skima template based on paraphrased guidance.
---

## TL;DR

- Frontmatter: `name` (exact folder name) + `description` (what + when, third person).
- Body order: title, overview, when to use, when not to use, inputs, instructions, output format, rules, references.
- Empty sections are omitted entirely; never leave an empty heading.
- `Instructions` is a numbered list, one imperative action per step.
- `Rules` has two lists: Always and Never.
- `References` lists bundled files with relative forward-slash paths, one level deep.
- Keep the whole body short; detail goes into `references/`.

## Template

```markdown
---
name: {{name}}
description: {{description}}
---

# {{title}}

{{overview}}

## When to use
{{whenToUse}}

## When not to use
{{whenNotToUse}}

## Inputs
{{inputs}}

## Instructions
{{steps}}

## Output format
{{outputFormat}}

## Rules
{{rules}}

## References
{{references}}
```

## Slot contract

| Slot | Content | Form |
|---|---|---|
| `name` | user name, validated, never rewritten | kebab-case |
| `description` | capabilities + triggers | 1-3 sentences, <=1024 chars |
| `title` | derived from `name` | Title Case words |
| `overview` | what the skill achieves | 1-2 sentences |
| `whenToUse` | situations and user phrases | bullet list |
| `whenNotToUse` | similar cases that do not apply | bullet list |
| `inputs` | files, data, prior information needed | bullet list |
| `steps` | the procedure | numbered list, imperative |
| `outputFormat` | format, tone, length, optional example | short text + example block |
| `rules` | constraints | "Always:" list and "Never:" list |
| `references` | extra files from the form | bullet list of relative paths |

## Why each section exists

- **When to use / not to use:** sharpen activation; the description stays short while the body removes ambiguity once loaded.
- **Inputs:** lets the agent ask for missing data before starting.
- **Instructions:** numbered steps are followed in order and are easy to check.
- **Output format:** templates and examples steer format more reliably than prose.
- **Rules:** explicit Always/Never lists make constraints testable.
- **References:** progressive disclosure; files load only when needed.
