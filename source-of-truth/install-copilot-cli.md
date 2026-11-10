---
id: install-copilot-cli
title: Installing the GitHub Copilot CLI
description: Official ways to install the GitHub Copilot command line, its Node.js requirement and how to sign in. Skima does not launch prompts with it yet, so this is reference material.
tags: [install, copilot-cli, cli, windows, macos, linux]
audience: maintainers
applies_to: []
sources:
  - title: GitHub Docs, Installing GitHub Copilot CLI
    url: https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli
retrieved_at: 2026-11-10
review_after: 2027-02-10
confidence: medium
confidence_note: Commands come from the official page. The page documents no version command and does not mention WSL.
license: Paraphrased summary. GitHub documentation is proprietary.
---

## TL;DR

- Needs an active GitHub Copilot subscription that the organization has not disabled.
- npm package: `@github/copilot`. Needs Node.js 22 or later. Works on all systems.
- WinGet package: `GitHub.Copilot` (Windows). Windows also needs PowerShell 6 or higher.
- Homebrew cask: `copilot-cli` (macOS and Linux).
- Install script for macOS and Linux: `curl -fsSL https://gh.io/copilot-install | bash`. Run as a normal user it installs to `$HOME/.local`.
- If `~/.npmrc` has `ignore-scripts=true`, install with `npm_config_ignore_scripts=false`.
- Sign in with the `/login` command on first launch, or export a fine-grained token with the "Copilot Requests" permission.
- Skima does not run prompts with this CLI yet, so it offers no install button for it.

## Commands per system

| System | Method | Command |
|---|---|---|
| Windows | WinGet | `winget install GitHub.Copilot` |
| Windows | npm | `npm install -g @github/copilot` |
| macOS | Homebrew | `brew install --cask copilot-cli` |
| macOS and Linux | npm | `npm install -g @github/copilot` |
| macOS and Linux | Install script | `curl -fsSL https://gh.io/copilot-install \| bash` |

## Not verified

- The version command and WSL support.
