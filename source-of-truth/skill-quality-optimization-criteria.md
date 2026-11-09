---
id: skill-quality-optimization-criteria
title: Criteria to judge whether a skill is well optimised
description: A rubric for token cost, size, redundancy, activation precision, progressive disclosure and testability of a skill. Read it when scoring or improving an existing skill.
tags: [skills, quality, optimization, tokens, rubric]
audience: ai
applies_to: [skill-quality-review]
sources:
  - title: Anthropic, Skill authoring best practices (checklist for effective skills)
    url: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
  - title: Agent Skills specification (progressive disclosure)
    url: https://agentskills.io/specification
  - title: Anthropic, Agent Skills overview (loading levels and token costs)
    url: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview
retrieved_at: 2026-11-09
review_after: 2027-05-09
confidence: medium
confidence_note: Thresholds come from primary sources; the weighting and scoring scale are Skima's synthesis.
license: Paraphrased summary plus original Skima rubric.
---

## TL;DR

- Metadata is paid by every session: description short, precise, keyword-rich.
- Body under 500 lines and ~5000 tokens; detail in reference files linked one level deep.
- No general knowledge the agent already has; no duplicated sentences across files.
- Description must trigger on the right requests and not on similar ones.
- Deterministic work belongs in scripts (only their output costs tokens).
- A good skill ships at least three evaluation scenarios or examples.
- Score each criterion 0-2 and sum (max 14).

## Rubric (0 = poor, 1 = acceptable, 2 = good)

| # | Criterion | 2 points when | 0 points when |
|---|---|---|---|
| 1 | Token cost of metadata | description 150-500 chars, no filler | >1024 chars or vague |
| 2 | Body size | <300 lines and <3000 tokens | >500 lines or >5000 tokens |
| 3 | Redundancy | no repeated content, no general explanations | long background, repeated rules |
| 4 | Activation precision | what + when + keywords + exclusions | missing "when", generic words |
| 5 | Progressive disclosure | references one level deep, contents list in long files | everything inline or nested chains |
| 6 | Determinism | fragile steps use scripts or exact commands | fragile steps left to free text |
| 7 | Testability | evaluation scenarios or input/output examples | no examples, no success criteria |

## Measurement hints

- Estimate tokens as characters / 4 for English text.
- Count lines of the body only (after the frontmatter).
- Redundancy: look for sentences that appear in more than one file or paragraphs explaining common tools.
- Activation: write 3 requests that should trigger and 3 near-misses that should not; check the description separates them.

## Typical optimisations

| Problem | Optimisation |
|---|---|
| Large API docs inline | Move to `references/api.md`, link from `SKILL.md` |
| Generated code repeated each run | Bundle a script and say "Run ..." |
| Many alternatives | One default + one escape hatch |
| Ambiguous triggers | Add "Use when ..." and a "Not for ..." clause |
| Long prose rules | Convert to Always/Never lists |
