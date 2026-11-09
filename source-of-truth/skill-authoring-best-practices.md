---
id: skill-authoring-best-practices
title: How to write an effective skill
description: Practical rules for writing a SKILL.md that an agent follows well - conciseness, degrees of freedom, progressive disclosure, workflows, examples and common mistakes. Read it before writing or rewriting skill content.
tags: [skills, authoring, conciseness, progressive-disclosure, workflows]
audience: ai
applies_to: [skill-optimize-en, skill-wizard]
sources:
  - title: Anthropic, Skill authoring best practices
    url: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
  - title: Agent Skills specification
    url: https://agentskills.io/specification
retrieved_at: 2026-11-09
review_after: 2027-05-09
confidence: high
confidence_note: Single primary source for most rules (Anthropic); consistent with the open specification.
license: Paraphrased summary of proprietary Anthropic documentation; no verbatim copy.
---

## TL;DR

- Be concise: the agent is already capable; only add what it cannot know (your workflow, your conventions, your data).
- Match freedom to fragility: loose guidance for open tasks, exact commands for fragile ones.
- Keep `SKILL.md` as an overview under 500 lines; put detail in reference files linked one level deep.
- Write numbered workflows for multi-step tasks; add a validation step and a "fix and repeat" loop for critical outputs.
- Give one default approach instead of a menu of options.
- Use consistent terminology and concrete examples (input -> output).
- Avoid time-sensitive statements; use forward slashes in paths.
- Test the skill on real tasks with every model you plan to use.

## Conciseness

- The context window is shared with the conversation and other skills. Every token in the body must earn its place.
- Remove explanations of general knowledge (what a PDF is, how libraries work).
- Prefer a short code snippet or command over a paragraph describing it.

## Degrees of freedom

| Freedom | Use when | Write |
|---|---|---|
| High | many valid approaches, context decides | short goals and heuristics |
| Medium | a preferred pattern exists | template or pseudocode with parameters |
| Low | fragile, order matters, consistency critical | exact command, "do not change flags" |

## Structure and progressive disclosure

- `SKILL.md` works like a table of contents: quick start + links to `references/*.md`.
- Link every reference file directly from `SKILL.md` (one level). Nested chains get read partially.
- Reference files longer than ~100 lines start with a short contents list.
- Name files by content (`form-validation-rules.md`, not `doc2.md`); organise by domain.
- Scripts are run, not loaded: say explicitly whether to run a script or read it.

## Workflows and feedback loops

- Break complex tasks into numbered steps; one action per step.
- For long workflows provide a checklist the agent can copy and tick.
- Add a validation step (script or checklist) and a loop: validate -> fix -> validate again -> continue only when it passes.
- For batch or destructive changes use plan -> validate plan -> execute -> verify.

## Content patterns

- **Template pattern:** give the exact output structure when the format is strict; a default structure when flexible.
- **Examples pattern:** 1-3 input/output pairs show style better than descriptions.
- **Conditional pattern:** "Creating new? -> do A. Editing existing? -> do B."
- **Defaults with an escape hatch:** "Use X. For case Y use Z instead."

## Scripts inside skills

- Scripts handle their own errors instead of leaving failures to the agent.
- Document every constant (why that timeout, why that retry count).
- List required packages and do not assume they are installed.
- Reference MCP tools with their full `Server:tool` name.

## Common mistakes

| Mistake | Fix |
|---|---|
| Vague description ("Helps with documents") | State capabilities and triggers |
| Long background explanations | Delete; keep only project-specific knowledge |
| Many alternative tools offered | Pick one default |
| Windows paths (`scripts\run.py`) | `scripts/run.py` |
| Dates like "after August 2025 use..." | Current method + collapsed "old patterns" |
| Deeply nested references | Link everything from `SKILL.md` |
| Inconsistent terms (field/box/control) | One term everywhere |

## Evaluation

- Write 3 realistic evaluation scenarios before writing much content.
- Compare results with and without the skill; add only what fixes observed failures.
