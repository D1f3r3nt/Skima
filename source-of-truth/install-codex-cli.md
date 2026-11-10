---
id: install-codex-cli
title: Installing the Codex command line
description: What the official Codex CLI page documents about installation, which is only the standalone installer for macOS and Linux. For maintainers and for the manual-instructions window in Skima.
tags: [install, codex, cli, macos, linux, windows]
audience: maintainers
applies_to: []
sources:
  - title: Codex CLI
    url: https://learn.chatgpt.com/docs/codex/cli
  - title: Codex, AGENTS.md guide
    url: https://learn.chatgpt.com/docs/agent-configuration/agents-md
retrieved_at: 2026-11-10
review_after: 2027-02-10
confidence: low
confidence_note: The page lists tabs for macOS and Linux, Windows, npm and Homebrew but only the first command was readable. Package names for npm and Homebrew and the Windows steps are not confirmed here.
license: Paraphrased summary. OpenAI documentation terms apply.
---

## TL;DR

- Standalone installer for macOS and Linux: `curl -fsSL https://chatgpt.com/codex/install.sh | sh`. The same command updates it.
- The page lists npm, Homebrew and Windows tabs but their commands were not readable, so Skima does not run them.
- Windows: the page links to separate Windows sandbox and WSL pages that were not read. Native Windows install is not confirmed.
- No version command is documented on the page; the screenshot shows a version string only.
- Sign in on first run: run `codex` and pick "Sign in with ChatGPT" or another method. The `codex login` command is used by Skima to detect the session but the page does not document it.
- The installer is a downloaded script with no published hash on the page.
- Codex reads `AGENTS.md`, global `~/.codex/AGENTS.md` and `AGENTS.override.md`.

## Commands per system

| System | Method | Command |
|---|---|---|
| macOS and Linux | Standalone script | `curl -fsSL https://chatgpt.com/codex/install.sh \| sh` |
| Windows | Not confirmed | Follow the official page |

## Not verified

- npm package name and Homebrew formula or cask.
- Windows native support and the WSL steps.
- Administrator needs and where the executable is placed.
