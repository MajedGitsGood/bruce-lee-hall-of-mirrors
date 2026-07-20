# Decision Log

Why-this-not-that for this project. Git records *what* changed; this file records the **reasoning and
rejected alternatives** behind notable choices, so future work (human or agent) starts informed
instead of re-deriving intent from diffs. Newest first.

Companion to [CHANGELOG.md](CHANGELOG.md) (user-facing *what changed*). Entries are added at task
completion via the `logbook` skill — only when a real decision was made, not for every commit.

---

## 2026-07-19 — REVERSAL: red distance numbers restored as the miss clue
**Decision:** A missed pane shatters (black hole + glass teeth, as v1) and shows Han's distance as
a red number centered in the pane, mirrored on the minimap. The crack-count-only clue (entry below)
is reverted. Numbers are exact 1–5 — the v1 `4+` cap is gone.
**Why:** Playtesting the crack-count clue showed it doesn't read — counting radiating crack lines
mid-game is slow and ambiguous compared to a glanceable digit. The user wants numbers shipped now
while a better crack visual is designed; the tutorial explains hints as numbers.
**Rejected:**
- *Cracks + numbers together* — double-encoding, and the cracks under test weren't readable anyway.
- *Keeping the `4+` cap* — a digit costs nothing to display exactly; the cap only lost information.
**Affects:** `js/game.js` (`renderBrokenBuffer`, `resolveStrike`, `drawMinimap`, tutorial copy).
Supersedes "Cracks ARE the clue" below.

## 2026-07-19 — Cracks ARE the clue: exact count, no numeric label
**Decision:** A missed mirror stays a pane of (cracked) glass — no shattered-out black hole — with
*exactly* `circDist` crack lines (1–5) and no red clue number on the pane or minimap. The tutorial
modal explains the mechanic instead.
**Why:** v1 feedback: the black hole + glass chips read as destruction, not information, and the
extra "micro-cracks" made the count lie (position 3 showing 4 lines). Once the count is exact, a
numeric label is redundant — and removing it restores the read-the-glass fantasy the game is built
on. Hit panes keep the burst-through hole so "he was HERE" stays visually distinct from "clue".
**Rejected:**
- *Keep the numeric labels alongside exact cracks* — double-encoding; players stop reading cracks.
- *Cap displayed cracks at 4 ("4+" convention)* — capping reintroduces ambiguity the feedback
  explicitly complained about; 5 lines for the opposite mirror is unambiguous.
**Affects:** `js/game.js` (`renderBrokenBuffer`, `resolveStrike`, `drawMinimap`), tutorial copy.

## 2026-07-19 — Six mirrors via gapless tiling, not projection compression
**Decision:** Fit six mirrors on screen by having each pane span its full 36° slot (neighbors share
an edge — zero gap) and widening the projection's edge mapping to ±108°, rather than compressing the
whole camera curve.
**Why:** Feedback asked for six mirrors *without decreasing mirror width*. Compressing the
projection shrinks every pane; removing the inter-pane gap (v1 panes covered only 26° of their 36°
slot) reclaims that width for the mirrors themselves, and perspective foreshortening still sells the
curve of the ring.
**Rejected:**
- *Compress the angular mapping only* — narrows every mirror ~25%, directly against the feedback.
- *Decouple center spacing from pane width* — keeps exact v1 width but panes would overlap or float;
  gapless tiling is simpler and looks like a real mirror wall.
**Affects:** `js/game.js` (`projR`, `computeQuads`).

## 2026-07-19 — Product loop: ship + smoke-test skills, privacy-first opt-in telemetry
**Decision:** Add a `ship` skill (roll `[Unreleased]` → tagged GitHub Release, verify Pages) and a
`smoke-test` skill (drive the real game in the preview browser, assert boot + play + clean console)
as the release gate. For learning from usage, add a vendor-agnostic `track(event, props)` layer
(`js/telemetry.js`) feeding **GoatCounter** (cookie-free usage events) and **Sentry** (error traces),
**inert until keys are added** and gated on Do Not Track.
**Why:** The product-builder loop is ship deliberately → verify → learn. Tagged releases + a green
smoke test read as intentional shipping; real usage/error data turns opinion into evidence. Keeping
the provider wiring behind one `track()` layer means gameplay code never couples to a vendor and
providers can be swapped without touching `game.js`. Inert-by-default keeps the repo self-contained
and safe to clone, and makes the analytics keys (public by design) safe to commit.
**Rejected:**
- *Google Analytics 4* — free and standard, but sets cookies, needs an EU consent banner, and is more
  privacy-invasive than a hobby game warrants. Privacy-first (GoatCounter) fit the ethos better.
- *No error service (window.onerror only)* — cheaper, but loses the stack traces that make real bugs
  actionable; Sentry's free tier is worth one account. Kept a lightweight `js-error` analytics event
  as the fallback for when Sentry is off.
- *A CI/GitHub-Actions headless smoke test* — more automatic, but adds Playwright + a build/CI surface
  to a zero-dependency repo. An agent-driven preview-browser check matches the environment and ships
  today; CI can come later.
- *Committing analytics keys to a gitignored config* — unnecessary; a GoatCounter code and Sentry DSN
  are client-side/public by design, so they live in `telemetry.js` directly.
**Affects:** `js/telemetry.js`, `js/game.js` (3 `track()` calls), `index.html`, `docs/TELEMETRY.md`,
`.claude/skills/ship/`, `.claude/skills/smoke-test/`, `CHANGELOG.md`.

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
