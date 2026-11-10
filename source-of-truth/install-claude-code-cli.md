---
id: install-claude-code-cli
title: Installing the Claude Code command line
description: Official ways to install Claude Code on Windows, macOS and Linux, their requirements and how to check and sign in. For maintainers and for the manual-instructions window in Skima.
tags: [install, claude-code, cli, windows, macos, linux]
audience: maintainers
applies_to: []
sources:
  - title: Claude Code, Advanced setup
    url: https://code.claude.com/docs/en/setup
retrieved_at: 2026-11-10
review_after: 2027-02-10
confidence: high
license: Paraphrased summary. Anthropic documentation is proprietary.
---

## TL;DR

- Recommended by the vendor: the native installer (a downloaded script). Package managers are also supported.
- npm package: `@anthropic-ai/claude-code`. It needs Node.js 22 or later for a clean install and must not be installed with `sudo`.
- Homebrew cask: `claude-code` (stable channel) or `claude-code@latest`. macOS and Linux.
- WinGet package: `Anthropic.ClaudeCode`. Native Windows needs no administrator rights for the native installer.
- Check with `claude --version`. A healthy install prints a version such as `2.1.211 (Claude Code)`.
- Log in by running `claude` and following the browser prompts, or with `claude auth login`.
- Git for Windows is optional but recommended on native Windows.
- WSL is supported: install inside the WSL distribution with the Linux command. Skima does not support WSL installs yet.

## Commands per system

| System | Method | Command |
|---|---|---|
| Windows | npm | `npm install -g @anthropic-ai/claude-code` |
| Windows | WinGet | `winget install Anthropic.ClaudeCode` |
| Windows | Native script (PowerShell) | `irm https://claude.ai/install.ps1 \| iex` |
| macOS | Homebrew | `brew install --cask claude-code` |
| macOS | npm | `npm install -g @anthropic-ai/claude-code` |
| macOS and Linux | Native script | `curl -fsSL https://claude.ai/install.sh \| bash` |
| Linux | npm | `npm install -g @anthropic-ai/claude-code` |
| Linux | apt, dnf, apk | Repositories signed by Anthropic; need `sudo` |

## Notes

- Native installs update themselves. Homebrew, WinGet and Linux packages do not.
- The native launcher is `~/.local/bin/claude` on macOS and Linux; the install folder may not be on the `PATH` until a new terminal is opened.
- Skima never runs `sudo`. The apt, dnf and apk routes are manual instructions only.
- The vendor publishes a signed manifest with checksums per release; the install scripts themselves have no published hash.
