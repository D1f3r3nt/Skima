---
id: skill-description-writing
title: Writing the skill description field
description: Rules and good/bad examples for the SKILL.md description, the text agents use to decide when to activate a skill. Read it whenever you write or rewrite a description.
tags: [skills, description, triggers, discovery]
audience: ai
applies_to: [skill-optimize-en, skill-wizard]
sources:
  - title: Anthropic, Skill authoring best practices (writing effective descriptions)
    url: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
  - title: Agent Skills specification (description field)
    url: https://agentskills.io/specification
  - title: Claude Code, Skills
    url: https://code.claude.com/docs/en/skills
retrieved_at: 2026-11-09
review_after: 2027-05-09
confidence: high
confidence_note: Sources agree.
license: Paraphrased summary; short example sentences written for Skima.
---

## TL;DR

- The description decides whether the agent activates the skill; it is loaded for every skill at startup.
- Always third person: "Generates...", "Reviews...". Never "I can..." or "You can...".
- Two parts: what the skill does + when to use it ("Use when...").
- Include the words a user would actually type: file types, tool names, task verbs, synonyms.
- Describe capabilities and triggers, not the step-by-step procedure.
- 1-1024 characters, no XML tags, no marketing words.
- One skill = one clear job; split skills whose description needs "and also".

## Structure

```
<Capabilities in one sentence, third person>. Use when <situations>, or when the user mentions <keywords>.
```

Optional third sentence: when NOT to use it, if confusion with a similar skill is likely.

## Good examples

- `Extracts text and tables from PDF files, fills PDF forms and merges documents. Use when working with PDFs or when the user mentions forms or document extraction.`
- `Generates commit messages from staged git diffs following Conventional Commits. Use when the user asks for a commit message or to describe staged changes.`
- `Reviews pull requests for security issues in Node.js services. Use when the user asks to review a PR, audit an endpoint or check for injection risks. Not for style-only reviews.`

## Bad examples and why

| Bad | Problem |
|---|---|
| `Helps with documents.` | No capability detail, no trigger words |
| `I can help you write commits.` | First person |
| `First read the diff, then group files, then write a title...` | Describes the workflow, not the capability |
| `The best, most powerful PDF tool!` | Marketing, no information |
| `Processes data.` | Too generic to choose among 100 skills |

## Checklist

1. Third person, present tense.
2. Contains "Use when" (or equivalent) with concrete situations.
3. Contains 3-8 trigger keywords the user would say.
4. No procedure, no internal file names, no XML.
5. Under 1024 characters (aim for 200-400).
6. Matches what the body actually does.
