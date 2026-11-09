---
id: mcp-server-best-practices-and-security
title: MCP servers - configuration basics and security risks
description: How MCP servers are configured per agent and the main risks (local command execution, token passthrough, SSRF, excessive scopes) with the mitigations to apply when installing or reviewing one. Read it before installing or reviewing an MCP server.
tags: [mcp, security, configuration, install, review]
audience: ai
applies_to: [mcp-install, mcp-security-review]
sources:
  - title: MCP Security Best Practices
    url: https://modelcontextprotocol.io/specification/2025-06-18/basic/security_best_practices
  - title: Claude Code, .claude directory (.mcp.json and ~/.claude.json)
    url: https://code.claude.com/docs/en/claude-directory
  - title: Codex configuration reference (mcp_servers)
    url: https://learn.chatgpt.com/docs/config-file/config-reference
  - title: OpenCode v1, MCP servers
    url: https://docs.opencode.ai/docs/mcp-servers
  - title: VS Code, MCP servers
    url: https://code.visualstudio.com/docs/copilot/customization/mcp-servers
retrieved_at: 2026-11-09
review_after: 2027-02-09
confidence: medium
confidence_note: Security guidance is from the MCP specification. Config formats change often; OpenCode v2 uses a different shape (mcp.servers.<name> with disabled) than v1 (mcp.<name> with enabled).
license: Paraphrased summary. MCP specification repository license not re-verified; vendor docs proprietary or MIT, paraphrased only.
---

## TL;DR

- A local (stdio) MCP server is a program the agent starts with your user privileges: installing one = running code.
- Always show the exact command and arguments before installing; require explicit approval.
- Flag dangerous patterns: `sudo`, `rm -rf`, `curl | sh`, access to `~/.ssh`, home or system folders.
- Secrets go only in that agent's MCP config (env block), never in logs or shared files.
- Merge into existing config files; never delete or overwrite other servers; back up first.
- Prefer stdio for local servers; HTTP servers need auth and HTTPS.
- MCP servers must not pass through tokens issued for other services; request minimal scopes.

## Config shapes per agent

| Agent | File | Root key | Server shape |
|---|---|---|---|
| Claude Code | `.mcp.json` (project), `~/.claude.json` (user) | `mcpServers` | `{ command, args, env }` or `{ type: "http", url, headers }` |
| Cursor, Gemini CLI | `.cursor/mcp.json`, `~/.gemini/settings.json` | `mcpServers` | `{ command, args, env }` / `{ url }` |
| VS Code workspace | `.vscode/mcp.json` | `servers` | `{ type: "stdio", command, args, env }` |
| Codex | `~/.codex/config.toml` | `[mcp_servers.<id>]` | `command`, `args`, `env`, `url`, `bearer_token_env_var` |
| OpenCode v1 | `opencode.json(c)` | `mcp.<name>` | `{ type: "local", command: [..], environment, enabled }` |
| OpenCode v2 | `opencode.json(c)` | `mcp.servers.<name>` | same fields, `disabled` instead of `enabled` |

## Local server risks and mitigations

| Risk | Mitigation |
|---|---|
| Malicious startup command in a config | Show full command, highlight dangerous patterns, ask for approval |
| Malicious package behind `npx`/`uvx` | Prefer pinned versions; show package name and version |
| Server reachable by other local processes | Use stdio; HTTP servers require tokens or restricted sockets |
| Data loss from buggy servers | Back up config files; least privilege |

## Remote server risks

- **Token passthrough:** a server must only accept tokens issued for itself.
- **Confused deputy:** proxy servers need per-client consent before third-party OAuth.
- **SSRF:** clients should reject non-HTTPS URLs (except loopback in development) and private IP ranges during OAuth discovery.
- **Session hijacking:** session IDs must be random and never used as authentication.
- **Scope minimisation:** start with minimal scopes; elevate only when needed.
- **URL handling:** open only `http(s)` URLs, never via a shell.

## Install checklist

1. Detect the server definition (command, args, env, url) from the repository.
2. Show it to the user per agent, translated to each agent's format.
3. Ask for required env values in a form; store them only in the agent config.
4. Back up the config file, merge atomically, keep comments and other servers.
5. Never overwrite a server with the same name without asking.
6. On Windows, some agents need `cmd /c npx ...` for npm-based commands; follow each agent's documented convention.
