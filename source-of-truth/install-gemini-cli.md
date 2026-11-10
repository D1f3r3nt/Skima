---
id: install-gemini-cli
title: Installing the Gemini CLI
description: Official ways to install the Gemini command line, its Node.js requirement and an important note about its availability for some accounts. For maintainers and for the manual-instructions window in Skima.
tags: [install, gemini-cli, cli, windows, macos, linux]
audience: maintainers
applies_to: []
sources:
  - title: Gemini CLI, Installation
    url: https://geminicli.com/docs/get-started/installation/
retrieved_at: 2026-11-10
review_after: 2027-02-10
confidence: medium
confidence_note: The commands come from the official page. The page documents no version command and no sign-in steps, and it says the CLI was replaced by another tool for some account types.
license: Paraphrased summary. Google documentation terms apply.
---

## TL;DR

- npm package: `@google/gemini-cli`. Needs Node.js 20.0.0 or later.
- Homebrew formula: `gemini-cli` (macOS and Linux).
- MacPorts: `sudo port install gemini-cli` (macOS only; needs `sudo`, so Skima does not use it).
- `npx @google/gemini-cli` runs it without installing.
- Start it with `gemini`. The page does not document a version command; `gemini --version` is the usual convention and is not confirmed here.
- Sign in from the first run of `gemini`; the page links to a separate authentication page that was not read.
- The page states that on 2026-06-18 the CLI was replaced by Antigravity CLI for the unpaid tier and Google One users. Check availability before offering it.
- Supported systems listed: macOS 15+, Windows 11 24H2+, Ubuntu 20.04+.

## Commands per system

| System | Method | Command |
|---|---|---|
| Windows | npm | `npm install -g @google/gemini-cli` |
| macOS | Homebrew | `brew install gemini-cli` |
| macOS | npm | `npm install -g @google/gemini-cli` |
| Linux | Homebrew | `brew install gemini-cli` |
| Linux | npm | `npm install -g @google/gemini-cli` |

## Not verified

- Whether npm global installs need administrator rights on each system (depends on the npm prefix).
- The exact version command and the sign-in command.
