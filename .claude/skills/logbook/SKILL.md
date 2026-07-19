---
name: logbook
description: >-
  Record notable work in this repo's two logs at the end of a unit of work: user-facing changes go
  in CHANGELOG.md under [Unreleased], and genuine design decisions (with rejected alternatives) go in
  DECISIONS.md. Use this whenever you finish or are wrapping up a meaningful piece of work here — a
  feature landing, a behavior change, a fix, or a real design choice — even if the user only says
  "commit this", "we're done", "wrap up", or just stops after a change. Also use when the user
  explicitly asks to update the changelog, log a decision, or run /logbook. Do NOT use for pure
  typos, formatting, WIP, or no-op refactors — git already covers those.
---

# Logbook

Keep this project's two written logs current so future work — yours or another agent's — starts
informed instead of reverse-engineering intent from `git log`.

## Why this exists (read this first — it drives every judgment call)

Git already records **what** changed, line by line. It is poor at two things this repo cares about:

1. **Signal** — a curated list of the handful of changes a *reader* cares about, phrased for a human.
   That's `CHANGELOG.md`.
2. **Why-this-not-that** — the reasoning and the alternatives you rejected. A diff shows the choice
   but almost never the thinking behind it. That's `DECISIONS.md`.

You are the cheapest possible moment to capture both: the work just happened and the rejected options
are still in your context. Ten commits later, that context is gone. So capture at **task
completion**, not per commit.

## The two lanes

### Lane 1 — `CHANGELOG.md` (the *what*, user-facing)

Add a single, reader-facing bullet under the `## [Unreleased]` heading, in the right group
(`Added`, `Changed`, `Fixed`, `Removed`, `Deprecated`, `Security`). Create the group sub-heading if it
isn't there yet.

- Write for a repo *visitor*, not for yourself. "Added a keyboard shortcut to mute audio", not
  "wired `keydown` handler for M in game.js".
- One line per change. Coarser than commits — a whole session of related work is usually one bullet.
- Don't restate the diff or name internals. Link a commit or PR if detail matters.
- Keep it distinct from the roadmap/wishlist that also lives under `[Unreleased]` — new bullets
  describe work that is **done**, not planned.

### Lane 2 — `DECISIONS.md` (the *why*, agent-facing) — only when there was a real decision

Most changes don't need a decision entry. Add one **only when you made a genuine choice** — picked an
approach over a viable alternative, discovered a constraint that will shape future work, or reversed
an earlier decision. Prepend it at the top of the entry list (newest first) using this template:

```
## YYYY-MM-DD — <short title>
**Decision:** <what you chose>
**Why:** <the reasoning / constraint that forced it>
**Rejected:** <alternatives considered and why they lost>
**Affects:** <files / areas; link commits or PRs — don't restate the diff>
```

The **Rejected** line is the most valuable part and the easiest to lose — write it while the
alternatives are still fresh. If you didn't seriously weigh an alternative, this probably isn't a
decision worth logging.

## What to skip (protect the signal)

Adding low-value entries is worse than adding none — it trains readers to ignore the logs. Skip:

- Typos, comments, formatting, lint/whitespace.
- Work-in-progress or exploratory commits that later get squashed or reverted.
- Refactors with no behavior change (unless the refactor *is* the decision — then log the why in
  Lane 2 only).
- Anything git already communicates well on its own.

When in doubt, ask: "would a person returning to this repo in three months be glad this line is
here?" If not, leave it out.

## How to run

1. Look at what actually changed this session (`git status`, `git diff`, and your own memory of the
   work) to decide what — if anything — clears the bar above.
2. If there's a user-facing change → edit `CHANGELOG.md` `[Unreleased]` (Lane 1).
3. If there was a real decision → prepend an entry to `DECISIONS.md` (Lane 2).
4. If nothing clears the bar, say so plainly and change nothing. A quiet no-op is a valid, correct
   outcome — don't invent an entry to look busy.
5. Use today's real date (check it rather than guessing) for any `DECISIONS.md` entry.

## Example

**Input (what happened this session):** Added a difficulty selector; chose three fixed presets over a
free slider because playtesting showed extreme slider values weren't fun and presets are easier to
balance.

**Lane 1 — `CHANGELOG.md` under `[Unreleased]` → `### Added`:**
`- Difficulty presets (Casual / Standard / Master) selectable from the title screen.`

**Lane 2 — `DECISIONS.md` (prepended):**
```
## 2026-08-02 — Difficulty as fixed presets, not a free slider
**Decision:** Ship three tuned presets (Casual / Standard / Master) instead of a continuous slider.
**Why:** Playtests showed the fun band is narrow; presets let us hand-balance health, pane count, and
score multiplier as coherent sets.
**Rejected:** A free 0–100 slider — flexible but most values were trivially easy or unwinnable, and it
multiplied the balancing surface.
**Affects:** js/game.js (config), index.html (title UI). See commit <hash>.
```
