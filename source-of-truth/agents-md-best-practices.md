---
id: agents-md-best-practices
title: AGENTS.md - what to put in it and what to leave out
description: Evidence-based guidance on content, length, tone and typical mistakes of an AGENTS.md. Read it when writing, reviewing or condensing one.
tags: [agents-md, best-practices, quality, length, mistakes]
audience: ai
applies_to: [agents-md-optimize]
sources:
  - title: GitHub Blog, How to write a great agents.md (lessons from over 2,500 repositories)
    url: https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/
  - title: Claude Code, How Claude remembers your project (writing effective instructions)
    url: https://code.claude.com/docs/en/memory
  - title: AGENTS.md, official site
    url: https://agents.md/
retrieved_at: 2026-11-10
review_after: 2027-02-10
confidence: medium
confidence_note: Content advice comes from the GitHub analysis and Claude Code docs; the numeric limits are the agents' own, not an AGENTS.md rule, and the "do not include" list is Skima's synthesis.
license: Paraphrased summary; no long passages reproduced. GitHub and Anthropic content is proprietary.
---

## TL;DR

- Cover six areas: commands, testing, project structure, code style, git workflow and boundaries.
- Put exact commands near the top, with flags. Tool names alone are not enough.
- Name the stack with versions, not a generic label.
- One real code example shows a style better than paragraphs of description.
- Use three boundary tiers: always do, ask first, never do.
- Be specific and checkable: "run `npm test` before committing" beats "test your changes".
- Keep it short. Aim for under about 200 lines and well under 32 KiB. Start small and add a rule only when the agent makes a mistake.
- Do not paste what the code or README already says, and never put secrets in it.

## Content that earns its place

- Facts the agent cannot infer: build, test, lint and format commands; folder purposes; naming and style rules that the linter does not enforce.
- Decisions with a reason: "do not edit `dist/`, it is generated".
- Definition of done: which checks must pass before work counts as finished.
- Workflow: branch names, commit style, pull request expectations.

## Content to leave out

- Anything obvious from the code or the README.
- Long explanations of style. Show a short example instead.
- A vague persona such as "helpful assistant". A narrow role works better.
- Secrets, tokens, personal data, internal URLs that should not be shared.
- Rules that need enforcement. Use hooks, CI or permissions for those.

## Tone

- Short imperative sentences. One idea per line.
- Say what to do, not only what to avoid. Give the alternative.
- Avoid emphasis tricks (capital letters, repeated "very important"). Specific rules are followed more reliably than loud ones.

## Typical mistakes

- No boundaries, so the agent makes destructive changes.
- Letting an agent delete a failing test instead of reporting it. Add a rule against it.
- Commands without flags, or commands that no longer work.
- A file that keeps growing and contradicts itself. Review it when the project changes.
- Contradictory rules between this file and others. The nearest or most specific one wins.

## Good and bad

| Weak | Better |
|---|---|
| Test your changes | Run `npm test`; all tests must pass before you finish |
| Keep files organized | API handlers live in `src/api/handlers/` |
| Write clean code | Use camelCase for file names; no comments in code |

## Not verified

- The GitHub article gives no explicit length number; the numbers above come from agent documentation.
