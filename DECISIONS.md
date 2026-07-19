# Decision Log

Why-this-not-that for this project. Git records *what* changed; this file records the **reasoning and
rejected alternatives** behind notable choices, so future work (human or agent) starts informed
instead of re-deriving intent from diffs. Newest first.

Companion to [CHANGELOG.md](CHANGELOG.md) (user-facing *what changed*). Entries are added at task
completion via the `logbook` skill — only when a real decision was made, not for every commit.

---

## 2026-07-19 — Two-lane logbook, captured at task completion
**Decision:** Keep a curated `CHANGELOG.md` (user-facing "what") *and* this `DECISIONS.md`
(agent-facing "why"), both updated by a `logbook` skill when a unit of work lands, and surfaced back
into context by a SessionStart hook.
**Why:** Git/GitHub already answer "what changed." They do not answer "why this and not the
alternative" — the context that makes a future agent effective. Capturing at task completion is the
cheapest moment, because the rejected options are still in the working agent's context. Surfacing the
log at session start is what closes the loop — a decision record no one reads back adds no value.
**Rejected:**
- *Trigger on every commit* — too noisy; most commits are WIP/typos and would bury the signal.
- *Trigger on push/PR (GitHub Actions)* — coarse and release-grade, but this is a solo, agent-driven
  repo with no PR workflow, so the natural unit is "task done," not "PR merged."
- *One combined file* — mixing user-facing release notes with rejected-alternative rationale serves
  neither reader well.
**Affects:** `CHANGELOG.md`, `DECISIONS.md`, `.claude/skills/logbook/`, `.claude/settings.json`.
