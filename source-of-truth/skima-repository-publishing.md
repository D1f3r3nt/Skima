---
id: skima-repository-publishing
title: Skima repository - structure, publishing contract and permissions
description: What the Skima shared-skills repository contains, what Skima publishes and reads, the commands it runs and the permissions it needs. For maintainers of Skima and of that repository.
tags: [skima-repository, publishing, github-cli, pull-request, maintainers]
audience: maintainers
applies_to: []
sources:
  - title: GitHub REST API, Git trees
    url: https://docs.github.com/en/rest/git/trees
  - title: GitHub CLI manual, gh repo fork
    url: https://cli.github.com/manual/gh_repo_fork
  - title: GitHub CLI manual, gh pr create
    url: https://cli.github.com/manual/gh_pr_create
  - title: GitHub CLI manual, gh auth login
    url: https://cli.github.com/manual/gh_auth_login
retrieved_at: 2026-11-10
review_after: 2027-02-10
confidence: low
confidence_note: The repository structure was read from the public API on the retrieved date. The gh flags were taken from the manual names and were not run here because gh is not installed on the development machine; tests use fake tools.
license: Paraphrased summary of GitHub documentation, which is proprietary.
---

## TL;DR

- Repository: `D1f3r3nt/skima-repository`, MIT license, default branch `master` (not `main`). Owner, name and folder live in `src/core/main/skima/skimaRepositoryConfig.js` and cannot be changed from the interface.
- Layout on the retrieved date: `LICENSE`, `README.md`, `skills/skill.md`. Skills are subfolders `skills/<name>/SKILL.md`; a loose file in `skills/` is ignored.
- Reading the list costs two API requests: `GET /commits/HEAD` (sha) and `GET /git/trees/<sha>?recursive=1`. Each `SKILL.md` is then read from `raw.githubusercontent.com` at that commit, only for visible cards. Cache lifetime is one hour.
- The badge "Verificado por Skima" depends on the origin assigned by code, never on file content.
- Publishing uses `gh` and `git` only: fork, shallow clone, branch from `upstream`, one commit, push, `gh pr create`.
- It needs a GitHub CLI session; a token stored only in Git's credential manager can clone but cannot publish.
- Updating an already published skill is not supported yet.

## Commands used when publishing

| Step | Command (argument list, no shell) |
|---|---|
| Session | `gh auth status --hostname github.com`, `gh api user` |
| Name free | `gh api repos/<owner>/<repo>/contents/skills/<name>`, `gh pr list --repo <owner>/<repo> --state open --json title,headRefName` |
| Fork | `gh repo fork <owner>/<repo> --clone=false` |
| Clone | `git clone --depth 1 --no-tags --no-recurse-submodules -- <fork url> <temp>` |
| Branch | `git remote add upstream <url>`, `git fetch --depth 1 upstream <default>`, `git checkout -b skima/<name>-<suffix> FETCH_HEAD` |
| Commit | `git -c user.name=<login> -c user.email=<id>+<login>@users.noreply.github.com commit` |
| Push | `git push -- origin HEAD:refs/heads/<branch>` with the `gh` credential helper for that call only |
| Pull request | `gh pr create --repo <owner>/<repo> --base <default> --head <login>:<branch> --title <title> --body-file <file>` |
| Status | `gh pr view <url> --json state`, `gh pr close <url>` |

## Permissions and limits

- The GitHub CLI default login scopes include `repo`, which is enough to fork a public repository and open a pull request. This was not tested against GitHub.
- Skima never reads or stores the token of `gh` and never uses it for catalog requests.
- Limits: 100 files, 256 KiB per file, 2 MiB in total; text files only; no hidden folders, links, keys or `.env` files.

## Not verified

- Exact behaviour of `gh repo fork --clone=false` when the fork already exists.
- Whether `gh auth login --web` runs without a terminal when hostname and protocol are given.
- Fork name when the person renamed their fork.
