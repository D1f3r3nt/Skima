---
id: agents-md-per-agent-files
title: Which instruction file each agent reads
description: The instruction files read by each agent in Skima's registry, how to import AGENTS.md from them and what is not verified. For maintainers deciding which bridge files Skima may offer to create.
tags: [agents-md, claude-md, per-agent, compatibility, bridge-files]
audience: maintainers
applies_to: []
sources:
  - title: Claude Code, How Claude remembers your project
    url: https://code.claude.com/docs/en/memory
  - title: OpenCode, Rules
    url: https://opencode.ai/docs/rules/
  - title: Codex, AGENTS.md guide
    url: https://learn.chatgpt.com/docs/agent-configuration/agents-md
  - title: Gemini CLI, GEMINI.md context files
    url: https://geminicli.com/docs/cli/gemini-md/
  - title: Cursor, Rules
    url: https://cursor.com/docs/context/rules
  - title: GitHub Docs, Repository custom instructions for Copilot
    url: https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions
retrieved_at: 2026-11-10
review_after: 2027-02-10
confidence: medium
confidence_note: Read from each product's own documentation on the retrieved date. Windsurf was not fetched and Copilot surfaces are not detailed in the source. Behaviour changes quickly; re-check before relying on it.
license: Paraphrased summary. Each product's documentation is proprietary.
---

## TL;DR

- Claude Code (v2.1.277 or later) reads `AGENTS.md` by default only when no `CLAUDE.md` exists in the working directory or above.
- With both files present Claude Code reads only `CLAUDE.md`. Put `@AGENTS.md` on the first line of it to include the shared file.
- OpenCode reads `AGENTS.md` first and falls back to `CLAUDE.md`. Its global file is `~/.config/opencode/AGENTS.md`.
- Codex reads `AGENTS.md` (and `AGENTS.override.md`), merged from the repository root down, with a 32 KiB default cap.
- Gemini CLI reads `GEMINI.md` by default; make it read `AGENTS.md` through `context.fileName`.
- Cursor reads `AGENTS.md` in the root and in subfolders, plus `.cursor/rules/*.mdc`.
- GitHub Copilot reads `.github/copilot-instructions.md`, `.github/instructions/*.instructions.md` and `AGENTS.md`, `CLAUDE.md` or `GEMINI.md` in the root.
- Skima never creates bridge files without the person confirming each one.

## Table

| Agent | Reads | Import or bridge |
|---|---|---|
| Claude Code | `CLAUDE.md`; `AGENTS.md` if no `CLAUDE.md` | `CLAUDE.md` containing `@AGENTS.md` |
| OpenCode | `AGENTS.md`, then `CLAUDE.md` | none needed; the `instructions` setting adds more files |
| Codex | `AGENTS.override.md`, `AGENTS.md`, fallback names from `project_doc_fallback_filenames` | none needed |
| Gemini CLI | `GEMINI.md`; others if listed in `context.fileName` | `.gemini/settings.json` with `"context": {"fileName": ["AGENTS.md"]}`, or a `GEMINI.md` with `@AGENTS.md` |
| Cursor | `AGENTS.md`, `.cursor/rules/*.mdc` | none needed |
| GitHub Copilot | see TL;DR | none needed for `AGENTS.md` |
| Windsurf | not verified | not verified |

## What Skima does with this

- The Context tab of a project shows a notice when an enabled agent will not read `AGENTS.md` by default (Claude Code with a `CLAUDE.md` present, Gemini CLI).
- It offers to create the bridge file only on request, with a preview of its exact content.
- A symlink is not offered on Windows, where it needs Developer Mode or administrator rights.

## Not verified

- Windsurf, Amp, goose and Kilo Code behaviour.
- Which Copilot surfaces (chat, coding agent, code review) honour `AGENTS.md`.
- Whether the `@import` syntax of Gemini CLI has depth limits.
