---
id: agents-md-structure-template
title: AGENTS.md - recommended structure and size limits
description: The eight sections Skima uses for a generated AGENTS.md, the reason for each and the size limits the code enforces. Read it when filling, validating or condensing a generated AGENTS.md.
tags: [agents-md, template, structure, limits]
audience: ai
applies_to: [agents-md-optimize]
sources:
  - title: GitHub Blog, How to write a great agents.md (six core areas)
    url: https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/
  - title: AGENTS.md, official site (recommended sections)
    url: https://agents.md/
  - title: Codex, AGENTS.md guide (default combined size limit)
    url: https://learn.chatgpt.com/docs/agent-configuration/agents-md
  - title: Claude Code, How Claude remembers your project (size advice)
    url: https://code.claude.com/docs/en/memory
retrieved_at: 2026-11-10
review_after: 2027-02-10
confidence: medium
confidence_note: The sections combine the official recommended list with the six areas from the GitHub analysis; the order and the exact limits are Skima's choice based on those sources.
license: Skima's own synthesis of paraphrased sources.
---

## TL;DR

- A generated file has up to eight sections, always in the same order.
- Each section is filled from one question of the form. A section with an empty answer is left out entirely.
- Recommended length is `recommendedMaxLines` = 200 lines. Show a warning above it.
- Show a stronger warning above `warningMaxBytes` = 32768 bytes, the default combined limit of Codex.
- Commands, paths and identifiers written by the person are kept exactly as written.
- Headings are in English by default. A Spanish set exists for files written in the person's language.
- The Boundaries section has three fixed lists: Always do, Ask first, Never do.
- Do not add sections that are not in this list.

## Sections

| Heading | Why it exists | Form question |
|---|---|---|
| `Project overview` | One or two sentences of purpose so the agent knows the goal. | What the project is and what it is for |
| `Tech stack` | Languages, frameworks and versions that change how code is written. | Stack and main technologies |
| `Repository structure` | Where things live, so the agent edits the right place. | Important folders and what each holds |
| `Commands` | Exact commands to install, run, build, test, lint and format. | Key commands |
| `Code style` | Conventions the linter does not enforce. | Code and style conventions |
| `Testing and definition of done` | What must pass before work is finished. | How it is tested and what is expected |
| `Boundaries` | Hard limits in three tiers. | Always, ask first, never |
| `Workflow and notes` | Branches, commits, pull requests and other notes. | Workflow and other useful notes |

## Rules for filling a section

- Use the person's wording. Do not add facts that were not given.
- Lists stay lists. Do not merge separate rules into one sentence.
- Keep each rule checkable and short: one instruction per line.
- Keep inline code, file paths, flags and identifiers byte for byte.

## Rules for the Boundaries section

- Three lists in this order: Always do, Ask first, Never do.
- An empty list is omitted. If all three are empty the whole section is omitted.
- Never invent a boundary. Only reorganize what the person wrote.

## Size limits

| Constant | Value | Meaning |
|---|---|---|
| `recommendedMaxLines` | 200 | Longer files lose adherence in Claude Code. Shorten before adding. |
| `warningMaxBytes` | 32768 | Codex stops reading beyond this combined size. |

## Not verified

- The ideal order of sections is a judgement; no source fixes it.
