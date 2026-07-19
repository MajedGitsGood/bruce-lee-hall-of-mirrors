# CLAUDE.md — working conventions for this repo

Guidance for any AI agent (or human) working in this project.

## What this is

Hall of Mirrors — Bruce vs Han: a vanilla HTML/CSS/JS pixel-art game, no build step, no dependencies,
all art and audio generated in code. Run it with `python3 serve.py` (port 8642) or any static server.

## Keep the two logs current (important)

This repo keeps a deliberate split so future work starts informed instead of reverse-engineering
intent from `git log`:

- **`CHANGELOG.md`** — user-facing *what changed* (Keep a Changelog format). New done-but-unreleased
  work goes under `[Unreleased]`.
- **`DECISIONS.md`** — agent-facing *why*: the reasoning and the **rejected alternatives** behind
  notable choices. Only for genuine decisions, newest first.

**When you finish a meaningful unit of work here, run the `logbook` skill** (or `/logbook`) to update
whichever log applies. It encodes the full rules — including what to skip. Don't log typos, WIP, or
no-op refactors; git already covers those. A quiet no-op is fine when nothing clears the bar.

Two hooks support this (see `.claude/settings.json`): a **SessionStart** hook primes you with recent
decisions + the `[Unreleased]` block, and a **Stop** hook gently reminds you if source changed but the
logs didn't. If you just edited these hooks or `settings.json`, they may not activate until Claude
Code is restarted (or `/hooks` is opened once).
