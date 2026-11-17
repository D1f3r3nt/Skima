---
id: graphify-usage-and-integration
title: Graphify - package, commands, files written and how Skima installs and integrates it
description: Verified facts about the Graphify command line tool (official package, pinned version, the two commands Skima runs, files written by each per-project install variant) and what Skima implements. For maintainers.
tags: [graphify, knowledge-graph, packaging, integration, maintainers]
audience: maintainers
applies_to: []
sources:
  - title: PyPI, graphifyy project page
    url: https://pypi.org/project/graphifyy/
  - title: PyPI, graphifyy JSON metadata
    url: https://pypi.org/pypi/graphifyy/json
  - title: Graphify official repository
    url: https://github.com/Graphify-Labs/graphify
  - title: uv documentation, pip interface and managed Python
    url: https://docs.astral.sh/uv/
retrieved_at: 2026-11-10
review_after: 2027-02-10
confidence: medium
confidence_note: Commands and files written were checked by running version 0.9.105 on Windows in a temporary project with a fake home folder. Network traffic was not monitored, and macOS and Linux were not run.
license: Paraphrased summary. Graphify is Apache-2.0; the PyPI page is not redistributed.
---

## TL;DR

- Official PyPI package: `graphifyy` (two y). Other `graphify*` packages are not affiliated. The command is `graphify`.
- Pinned version: `0.9.105`, Apache-2.0, Python 3.10 or later. `graphify --version` exists.
- To build the graph Skima runs two commands in the project folder: `graphify extract . --code-only`, then `graphify cluster-only . --no-label`. The second one writes `GRAPH_REPORT.md` and `graph.html`; `--no-label` avoids calling a language model to name communities.
- Never run `graphify install` without a variant: it writes a skill in the user profile. Skima only uses `claude`, `codex`, `opencode` and `cursor` followed by `install` or `uninstall`; `gemini` is excluded because it writes a global skill.
- Per-project variants write only inside the project (checked with a fake home): `claude` writes `CLAUDE.md` and `.claude/settings.json`; `codex` writes `AGENTS.md` and `.codex/hooks.json`; `opencode` writes `AGENTS.md` and `.opencode/plugins/graphify.js`; `cursor` writes `.cursor/rules/graphify.mdc`.
- The markers are a `## graphify` section in the markdown files and hook commands containing `hook-guard` (Claude Code) or `hook-check` (Codex). The hooks contain the absolute path of the Graphify executable, so they only work on the machine that wrote them.
- `uninstall` removes the section and the hooks, deletes a markdown file that ends up empty, leaves empty hook lists and creates `*.graphify-bak` copies.
- Skima installs Graphify with a bundled `uv`: an isolated environment under `<userData>/tools/graphify/venv`, a hashed lock file and wheels only. No `sudo`, no PATH change.

## What Skima implements

- `graphifyRuntime`: resolves the executable in the isolated environment and reports installed, missing, broken or different-version.
- `graphifyInstaller`: `uv venv --python 3.12`, then `uv pip install --require-hashes --only-binary :all: -r requirements.lock`. The environment sets `UV_PYTHON_PREFERENCE=only-managed`, `UV_NO_CONFIG=1` and keeps the uv cache and managed Python inside the tools folder. It needs internet once, runs one installation at a time, can be cancelled, stops after 20 minutes and removes a half-made environment. Repair deletes only the `venv` folder and installs again.
- `uv` comes from `scripts/fetchUv.js`, which downloads a pinned release and checks its SHA-256 before packaging. `tools/graphify/requirements.lock` is compiled with `uv pip compile --universal --generate-hashes --only-binary :all:`.
- `graphifyService`: two steps per generation, an argument list and no shell, one run per project, progress, cancel, 15 minutes per step, state read from disk. API keys, tokens and similar variables are removed from the environment of every Graphify process.
- `graphifyIntegrationService`: preview runs the variant inside a temporary copy of only the files it can touch, with a fake home, and diffs the result. Apply recomputes it, requires the same fingerprint, backs up to `.skima/backups/graphify-<time>/`, then writes. It refuses symbolic links, files it did not copy that already exist, and any write outside the project. Undo is the same flow with `uninstall`. The decision is stored in `.skima/config.json`.
- Regenerating `AGENTS.md` keeps the existing `## graphify` section.

## Changes in the November 2026 update

- Detection runs `graphify --version` on Skima's own copy first and then on the `graphify` found in the PATH. Any version that answers is usable; a version other than the pinned one only shows a note. The status is cached for one minute.
- Skima no longer shows an install button: on start-up it prepares its own copy in the background only when no working `graphify` is found.
- Generation sends `/graphify .` to the AI provider through the registered prompt `graphify-generate` (cheap model tier, for example Haiku in Claude Code; it can be changed per prompt in Settings > AI provider). It runs in the project folder with full permissions because the skill runs commands. With no connected agent it falls back to the two code-only commands above.
- `graphify-out/` is committed by default. Settings > Graphify has a switch to ignore it; after each generation Skima adds or removes the `graphify-out/` line in `.gitignore` to match.
- Health check: when a project page opens, and after each generation, Skima runs `graphify god-nodes --top 5` in the project; output with nodes shows a green check.
- `graph.html` opens inside Skima in a sandboxed `<webview>` (partition `skima-graph-viewer`, no preload, no navigation, only the registered file and `https://unpkg.com/vis-network@` may load). `GRAPH_REPORT.md` is rendered read-only with the sanitising Markdown renderer.
- Graphify Cloud is a hosted remote MCP server (`https://api.graphify.com/mcp`, browser sign-in on first connection, console at `https://app.graphify.com`). Settings > Graphify stores the URLs and reuses the MCP install flow to add it to the user's agents.

## Not verified

- Whether code-only mode makes any network call (traffic was not captured).
- Behaviour on macOS and Linux, and on projects with very large histories or ignore rules.
- How Graphify treats `.gitignore` and default ignores such as `node_modules`.
- The files written by future Graphify versions: the lock pins `0.9.105` and the flow must be rechecked before changing it.
