---
id: install-opencode-cli
title: Installing the OpenCode command line
description: What the current OpenCode documentation says about installation, which differs from earlier versions of the tool. Skima shows manual instructions only until the package names are confirmed.
tags: [install, opencode, cli, windows, macos, linux]
audience: maintainers
applies_to: []
sources:
  - title: OpenCode, Introduction and install
    url: https://opencode.ai/docs/
  - title: OpenCode, Rules
    url: https://opencode.ai/docs/rules/
retrieved_at: 2026-11-10
review_after: 2027-02-10
confidence: low
confidence_note: The installation page read describes a second major version of OpenCode with different package names than the first version, and states that Windows package managers are not supported. The two cannot be reconciled from this single page, so no automatic install is offered.
license: Paraphrased summary. OpenCode documentation terms apply.
---

## TL;DR

- The page read lists these methods for the current version: install script `curl -fsSL https://opencode.ai/v2/install | bash`, Homebrew `brew install anomalyco/tap/opencode-v2`, and npm `npm install -g @opencode/cli`.
- It also lists Bun, pnpm, Yarn, mise and the Arch user repository.
- It says Windows package managers are not supported and offers a standalone zip or a desktop `.exe` instead.
- Earlier versions of OpenCode used other names for the npm package and script. Mixing them risks installing the wrong thing.
- No version command, administrator needs or prerequisites are stated on the page.
- Skima therefore shows these notes as manual instructions and runs nothing for OpenCode.
- OpenCode reads `AGENTS.md`, falling back to `CLAUDE.md`.
- Sign-in is done with the OpenCode provider commands inside the tool; Skima shows `opencode auth login`.

## Commands per system

| System | Method | Command |
|---|---|---|
| macOS and Linux | Install script | `curl -fsSL https://opencode.ai/v2/install \| bash` |
| macOS | Homebrew | `brew install anomalyco/tap/opencode-v2` |
| Any | npm | `npm install -g @opencode/cli` |
| Windows | Standalone zip or desktop installer | Download from the official page |

## Not verified

- Which package names apply to the version a person already uses.
- Everything about administrator rights, the executable location and the version command.
