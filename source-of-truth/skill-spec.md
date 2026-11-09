---
id: skill-spec
title: Agent Skills format specification (SKILL.md)
description: Exact folder layout, frontmatter fields and limits, naming rules and validation for an Agent Skill. Read it to generate or validate a SKILL.md.
tags: [skills, specification, frontmatter, validation, limits]
audience: ai
applies_to: [skill-optimize-en, skill-wizard, installed-scanner, skill-manifest-validator]
sources:
  - title: Agent Skills specification
    url: https://agentskills.io/specification
  - title: Anthropic, Agent Skills overview (skill structure)
    url: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview
  - title: Claude Code, Skills (frontmatter reference)
    url: https://code.claude.com/docs/en/skills
retrieved_at: 2026-11-09
review_after: 2027-05-09
confidence: high
confidence_note: The open spec and Anthropic agree on the name and description limits. Reserved words and the XML-tag ban come from Anthropic only; the open spec adds the no-consecutive-hyphens and must-match-folder rules.
license: Paraphrased summary. agentskills.io license not verified; Anthropic documentation is proprietary (no verbatim copy).
---

## TL;DR

- A skill is a folder that contains a `SKILL.md` file; the folder name is the skill name.
- `SKILL.md` = YAML frontmatter between `---` lines (the first line of the file) + Markdown body.
- Required fields: `name` and `description`.
- `name`: 1-64 chars, only `a-z`, `0-9` and `-`, no leading/trailing hyphen, no `--`, equal to the folder name.
- `description`: 1-1024 chars, non-empty, says what the skill does and when to use it.
- No XML tags in `name` or `description`; avoid the words `anthropic` and `claude` in `name` (rejected on Anthropic platforms).
- Keep the body under 500 lines and about 5000 tokens; move detail to files one level deep.
- Use forward slashes in every path inside a skill.

## Folder layout

| Path | Required | Purpose |
|---|---|---|
| `SKILL.md` | yes | Metadata + instructions |
| `scripts/` | no | Executable code the agent runs |
| `references/` | no | Extra documentation loaded on demand |
| `assets/` | no | Templates, images, data files |

Any other files are allowed. Reference them with relative paths from the skill root.

## Frontmatter fields

| Field | Required | Rule |
|---|---|---|
| `name` | yes | 1-64 chars; `^[a-z0-9]+(-[a-z0-9]+)*$`; must match the parent folder |
| `description` | yes | 1-1024 chars; what + when; specific trigger keywords |
| `license` | no | Short license name or bundled license file name |
| `compatibility` | no | 1-500 chars; only if there are real environment requirements |
| `metadata` | no | Map of string keys to string values |
| `allowed-tools` | no | Space-separated pre-approved tools. Experimental; support varies |

Claude Code accepts more optional fields (for example `when_to_use`, `disable-model-invocation`, `model`, `effort`) and ignores unknown fields. Other agents may not support them, so a portable skill sticks to the table above.

## Name rules (checklist)

1. Lowercase letters, digits and single hyphens only.
2. Does not start or end with `-`; never `--`.
3. Same text as the folder that contains `SKILL.md`.
4. Not `anthropic` or `claude` inside the name (Anthropic API and claude.ai reject them).
5. No XML tags.
6. Must also be a valid folder name on Windows, macOS and Linux (the spec charset already guarantees this, except reserved device names such as `con` or `nul`, which a validator must reject).

Valid: `pdf-processing`, `code-review`. Invalid: `PDF-Processing`, `-pdf`, `pdf--processing`.

## Description rules

- Non-empty, at most 1024 characters.
- Third person, states capabilities and triggers (see `skill-description-writing`).
- Claude Code truncates `description` + `when_to_use` at 1536 characters in its skill listing.

## Progressive disclosure budget

| Level | When loaded | Approximate cost |
|---|---|---|
| Metadata (`name` + `description`) | always, at startup | ~100 tokens per skill |
| `SKILL.md` body | when the skill activates | keep under ~5000 tokens and 500 lines |
| Bundled files | only when read or run | zero until used |

## Validation

- The reference validator is `skills-ref validate ./my-skill` (agentskills repository).
- A valid file starts with `---` on line 1, has parseable YAML, and passes the name and description rules above.
- Treat a broken frontmatter as an error but keep the skill visible, using the folder name.
