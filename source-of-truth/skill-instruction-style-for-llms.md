---
id: skill-instruction-style-for-llms
title: Writing instructions an AI agent follows, and translating them safely
description: Style rules for imperative, unambiguous agent instructions, plus how to translate and condense user text into English without losing code, commands, paths or identifiers. Read it before rewriting or translating skill content.
tags: [instructions, style, translation, condensing, prompting]
audience: ai
applies_to: [skill-optimize-en]
sources:
  - title: Anthropic, Prompting best practices (be clear and direct, examples, XML tags, format control)
    url: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
  - title: Anthropic, Skill authoring best practices (consistent terminology, conciseness)
    url: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
retrieved_at: 2026-11-09
review_after: 2027-05-09
confidence: medium
confidence_note: Style rules come from primary sources; the translation and preservation rules are Skima's own engineering rules derived from them, not an official guideline.
license: Paraphrased summary plus original Skima rules.
---

## TL;DR

- One instruction per sentence, imperative verb first: "Run", "Check", "Write".
- Say what to do, not only what to avoid ("Write plain prose" beats "No markdown").
- Concrete over vague: name the file, the command, the format, the limit.
- Keep the user's order; number steps; one action per step.
- Use one term per concept throughout.
- Translate to English but copy code, commands, paths, URLs, identifiers and quoted strings byte for byte.
- Never add requirements, steps or examples the user did not give; never drop a constraint.
- If a field is empty, leave it empty.

## Style rules

| Do | Avoid |
|---|---|
| "Run `npm test` before committing." | "It would be good to maybe run the tests." |
| "Reply in under 200 words." | "Keep it short-ish." |
| "Use British spelling." | "Don't use American spelling." |
| "If the file is missing, ask the user for it." | Silent assumptions |
| Consistent term "endpoint" | Mixing "URL", "route", "path" |

- Remove filler: politeness, hedging ("try to", "maybe"), repetition, meta-comments.
- Give the reason for a non-obvious rule in a short clause; it improves compliance.
- Lists stay lists: same number of items, same order.

## Translation and condensing procedure

1. Identify protected spans: anything in backticks or code blocks, shell commands, file names, paths, URLs, environment variables, CLI flags, identifiers in camelCase/snake_case/kebab-case, version numbers and quoted strings.
2. Translate only the natural-language text around protected spans.
3. Rewrite into short imperative sentences; merge duplicates that say the same thing.
4. Keep every distinct fact, number, limit and condition.
5. Compare: every protected span from the input must appear unchanged in the output; the number of steps and rules must match.
6. If the input is already English, only clean and condense; do not change meaning.

## Examples

Input (Spanish):

```text
primero hay que ejecutar npm run lint y si falla pues arreglarlo antes de seguir, porfa
```

Output:

```text
Run `npm run lint`. If it fails, fix the errors before continuing.
```

Input (Spanish, a "never" rule):

```text
no tocar nunca la carpeta migrations/ ni el archivo .env
```

Output (item of the Never list):

```text
Modify files in `migrations/` or the `.env` file.
```
