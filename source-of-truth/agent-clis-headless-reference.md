---
id: agent-clis-headless-reference
title: Coding agent CLIs - headless usage, skills and MCP locations (maintainers)
description: Reference for maintainers of Skima's agent bridge - how to run each CLI without UI, its flags for model, effort, permissions, output and web access, and where each agent stores skills and MCP config. Never sent to a model.
tags: [maintainers, agent-bridge, cli, claude-code, codex, opencode, gemini-cli, paths]
audience: maintainers
applies_to: [agent-bridge, provider-registry]
sources:
  - title: Claude Code, CLI reference
    url: https://code.claude.com/docs/en/cli-reference
  - title: Claude Code, .claude directory
    url: https://code.claude.com/docs/en/claude-directory
  - title: Codex, Non-interactive mode
    url: https://learn.chatgpt.com/docs/non-interactive-mode.md
  - title: Codex, Configuration reference
    url: https://learn.chatgpt.com/docs/config-file/config-reference
  - title: Codex, Build skills
    url: https://learn.chatgpt.com/docs/build-skills
  - title: OpenCode v1, CLI
    url: https://docs.opencode.ai/docs/cli
  - title: OpenCode, Skills
    url: https://opencode.ai/docs/skills/
  - title: Gemini CLI, CLI reference
    url: https://geminicli.com/docs/cli/cli-reference/
  - title: Gemini CLI, Headless mode
    url: https://geminicli.com/docs/cli/headless/
  - title: Gemini CLI, Skills
    url: https://geminicli.com/docs/cli/skills/
retrieved_at: 2026-11-09
review_after: 2027-01-09
confidence: medium
confidence_note: Claude Code and Codex flags verified in official docs. OpenCode stdin handling, run --format json event schema and models --verbose output are undocumented. Gemini CLI web-tool exclusion via GEMINI_CLI_SYSTEM_SETTINGS_PATH is an assumption. None of the CLIs was installed on the development machine, so no --help output was compared.
license: Paraphrased summary of vendor documentation.
---

## TL;DR

- Claude Code: `claude -p`, prompt on stdin, `--output-format json|stream-json`, `--model`, `--effort low|medium|high|xhigh|max`, `--permission-mode`, `--tools ""`, `--disallowedTools WebSearch WebFetch`, `--json-schema`, `claude auth status` (exit 0 = logged in).
- Codex: `codex exec ... -` reads the prompt from stdin, `--json` JSONL events, `-s read-only|workspace-write|danger-full-access`, `-c model_reasoning_effort="..."`, `-c web_search="disabled"`, `--output-schema file`, `-o file`, `--ephemeral`, `--ignore-user-config`.
- OpenCode: `opencode run [message]`, `--format json`, `-m provider/model`, `--agent plan|build`, `--variant`, `-f file`, `--dir`; permissions through `OPENCODE_PERMISSION` JSON.
- Gemini CLI: `gemini -p "..."` (appended to stdin), `--output-format json|stream-json`, `-m`, `--approval-mode default|auto_edit|yolo|plan`, `--skip-trust`; no effort control.
- Skills: Claude `~/.claude/skills`, Codex `~/.agents/skills`, OpenCode `~/.config/opencode/skills` (+ `.claude`, `.agents`), Gemini `~/.gemini/skills` (+ `~/.agents/skills`).

## Claude Code

| Need | Flag |
|---|---|
| Headless | `-p` / `--print`; piped stdin is the prompt or extra context |
| Output | `--output-format text|json|stream-json` (stream needs `--verbose`) |
| Model | `--model haiku|sonnet|opus|fable|<full id>` |
| Effort | `--effort low|medium|high|xhigh|max` |
| Permissions | `--permission-mode default|acceptEdits|plan|auto|dontAsk|bypassPermissions` |
| Tools | `--tools ""` (none), `--tools "Read,Grep"`, `--disallowedTools WebSearch WebFetch` |
| Isolation | `--strict-mcp-config`, `--disable-slash-commands`, `--bare`, `--setting-sources` |
| Structured output | `--json-schema '<json>'` -> `structured_output` in the result |
| Sessions | `--resume <id>`, `--session-id`, `--no-session-persistence` |
| Auth | `claude auth status` (JSON, exit 0/1), `claude auth login` |
| Config dir | `CLAUDE_CONFIG_DIR` moves `~/.claude` and `~/.claude.json` |

## Codex

| Need | Flag |
|---|---|
| Headless | `codex exec`; prompt from stdin when argument omitted or `-` |
| Output | `--json` (events: thread.started, turn.started, item.*, turn.completed with usage, turn.failed, error) |
| Model | `-m` / `--model` |
| Effort | `-c model_reasoning_effort="low|medium|high|xhigh"` (values depend on model) |
| Sandbox | `-s read-only|workspace-write|danger-full-access` |
| Web | `-c web_search="disabled"` (values: disabled, cached, indexed, live) |
| Structured | `--output-schema file.json`, `-o last-message.txt` |
| Other | `--skip-git-repo-check`, `-C dir`, `--ephemeral`, `--ignore-user-config` |
| Auth | `codex login`, `codex login status`, `CODEX_API_KEY` |
| Config | `CODEX_HOME` (default `~/.codex`), `config.toml`, `[mcp_servers.<id>]` |

## OpenCode

| Need | Flag |
|---|---|
| Headless | `opencode run [message..]` (stdin undocumented: Skima attaches the prompt with `-f`) |
| Output | `--format json` (raw JSON events, schema undocumented) |
| Model | `-m provider/model` |
| Effort | `--variant` (provider-specific) |
| Read-only | `--agent plan` |
| Permissions | `OPENCODE_PERMISSION='{"edit":"deny","bash":"deny","webfetch":"deny"}'` |
| Isolation | `OPENCODE_DISABLE_CLAUDE_CODE`, `OPENCODE_DISABLE_EXTERNAL_SKILLS`, `OPENCODE_DISABLE_PROJECT_CONFIG` |
| Models | `opencode models [provider]`, `--verbose` adds cost metadata, `--refresh` |
| Auth | `opencode auth list`, `opencode auth login` |
| Config | `OPENCODE_CONFIG`, `OPENCODE_CONFIG_DIR`; MCP v1 `mcp.<name>`, v2 `mcp.servers.<name>` |

## Gemini CLI

| Need | Flag |
|---|---|
| Headless | `-p "<text>"` appended to stdin; non-TTY also triggers headless |
| Output | `--output-format text|json|stream-json`; JSON `{ response, stats, error }` |
| Model | `-m auto|pro|flash|flash-lite|<id>` |
| Permissions | `--approval-mode default|auto_edit|yolo|plan` |
| Trust | `--skip-trust` trusts the folder for the session |
| Tools | `tools.exclude` in settings (`google_web_search`, `web_fetch`) |
| Exit codes | 0 ok, 1 error, 42 input error, 53 turn limit |
| Note | Replaced by Antigravity CLI for unpaid tiers since 2026-06-18 |

## Windows notes

- npm-installed CLIs are `.cmd` shims; spawning them needs either a shell or resolving the shim to `node script.js`. Skima resolves the shim and never passes user text through `cmd.exe`.
- Long prompts must go through stdin or a file: the Windows command line is limited to about 32 000 characters, and `cmd.exe` to about 8 000.
- WSL installations keep their config inside the Linux filesystem; not supported yet.
