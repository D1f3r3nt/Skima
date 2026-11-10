---
id: install-github-cli
title: Installing GitHub CLI (gh)
description: Official ways to install gh on Windows, macOS and Linux and which of them need administrator rights. Skima needs gh to sign in to GitHub and to publish skills.
tags: [install, github-cli, gh, windows, macos, linux]
audience: maintainers
applies_to: []
sources:
  - title: GitHub CLI, Install on Windows
    url: https://github.com/cli/cli/blob/trunk/docs/install_windows.md
  - title: GitHub CLI, Install on macOS
    url: https://github.com/cli/cli/blob/trunk/docs/install_macos.md
  - title: GitHub CLI, Install on Linux
    url: https://github.com/cli/cli/blob/trunk/docs/install_linux.md
retrieved_at: 2026-11-10
review_after: 2027-02-10
confidence: medium
confidence_note: Package ids and commands come from the official install pages. Administrator needs are not stated for Windows and the version and login commands were not on the pages read.
license: Paraphrased summary. GitHub CLI is MIT licensed; its documentation is not redistributed.
---

## TL;DR

- Windows, official: WinGet package `GitHub.cli` with `winget install --id GitHub.cli --source winget`.
- macOS, official: Homebrew formula `gh` with `brew install gh`.
- Linux, official: apt, DNF, yum or zypper repositories, all with `sudo`; also `brew install gh` where Homebrew exists.
- Precompiled binaries for every system are on the GitHub CLI releases page.
- Community routes (Scoop, Chocolatey, Conda, MacPorts, Webi) are not maintained by the GitHub CLI team.
- After installing, open a new terminal: the installer changes the `PATH`.
- Check with `gh --version`. Sign in with `gh auth login`. Both are the standard commands and were not on the pages read.
- Skima uses `gh` to sign in with a one-time code and to open pull requests.

## Commands per system

| System | Method | Command |
|---|---|---|
| Windows | WinGet | `winget install --id GitHub.cli --source winget` |
| macOS | Homebrew | `brew install gh` |
| Linux | Homebrew | `brew install gh` |
| Linux | apt, dnf, yum, zypper | Repository setup from the official Linux page; needs `sudo` |

## Not verified

- Whether the WinGet install asks for administrator rights.
- On Linux without Homebrew the only official routes need `sudo`, so Skima shows manual instructions.
