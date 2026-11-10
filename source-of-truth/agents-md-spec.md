---
id: agents-md-spec
title: AGENTS.md - what the file is and how agents read it
description: The open AGENTS.md format, where it lives, how nested files and precedence work, and the size limits that matter. Read it before writing or validating an AGENTS.md.
tags: [agents-md, spec, instructions, compatibility]
audience: ai
applies_to: [agents-md-optimize]
sources:
  - title: AGENTS.md, official site and FAQ
    url: https://agents.md/
  - title: Claude Code, How Claude remembers your project
    url: https://code.claude.com/docs/en/memory
  - title: Codex, AGENTS.md guide
    url: https://learn.chatgpt.com/docs/agent-configuration/agents-md
retrieved_at: 2026-11-10
review_after: 2027-02-10
confidence: medium
confidence_note: The format and the Codex and Claude Code behaviour were read from primary pages; support in other agents was read from the agents.md list and not checked one by one.
license: Paraphrased summary. The AGENTS.md site is stewarded by the Agentic AI Foundation under the Linux Foundation and states no content license.
---

## TL;DR

- `AGENTS.md` is plain Markdown that gives coding agents project instructions. It is "a README for agents".
- It has no required fields or headings. Any structure works.
- It lives at the repository root. Monorepos may add more files in subfolders.
- The nearest file to the file being edited wins. What the person says in chat overrides every file.
- Codex concatenates files from the repository root down to the working directory and stops at 32 KiB combined by default.
- Claude Code (v2.1.277 or later) reads `AGENTS.md` when there is no `CLAUDE.md`; if both exist it reads only `CLAUDE.md`, which can import it with `@AGENTS.md`.
- Instructions are context, not enforcement. Anything that must never happen needs a technical control, not a sentence.

## What it is

A Markdown file for agents, next to the README that is written for people. It describes what an agent cannot guess from the code: commands, conventions, limits and workflow.

Commands listed in it are often run by the agent. Keep them exact and copy-pasteable.

## Where it goes and how it is resolved

- Root of the repository: instructions for the whole project.
- Subfolders: more specific instructions for that part. The closest file takes precedence.
- Global files exist for some agents (for example `~/.codex/AGENTS.md`, `~/.config/opencode/AGENTS.md`). They are personal, not part of the project.

## Limits that matter

| Agent | Limit or behaviour |
|---|---|
| Codex | Combined size of all files is capped by `project_doc_max_bytes`, 32 KiB by default. |
| Claude Code | Advice for `CLAUDE.md`: stay under about 200 lines per file. Longer files reduce adherence. |
| GitHub Copilot | Its onboarding prompt asks for instructions of no more than two pages. |
| AGENTS.md itself | No limit is defined. |

## Compatibility notes

- Listed as supporting `AGENTS.md`: Codex, Jules, Factory, Aider, goose, opencode, Zed, Warp, VS Code, Devin, Junie, Amp, Cursor, RooCode, Gemini CLI, Kilo Code, GitHub Copilot coding agent, Windsurf, Augment Code and others.
- Gemini CLI reads `GEMINI.md` by default; add `AGENTS.md` to `context.fileName` in its settings.
- Aider needs `read: AGENTS.md` in `.aider.conf.yml`.
- To move from another file name, rename it to `AGENTS.md` and keep the old name as a link only where links work. On Windows a committed symlink becomes a text file unless `core.symlinks` is on.
- Where a tool reads only its own file, create that file with an import line such as `@AGENTS.md` (Claude Code and Gemini CLI syntax).

## Not verified

- Which specific Copilot surfaces read `AGENTS.md`.
- The behaviour of Windsurf, Amp, goose and Kilo Code beyond the fact that the site lists them.
