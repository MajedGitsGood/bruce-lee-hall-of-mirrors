# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Opening cinematic** — after CLICK TO ENTER, the centered mirror revolves like the film's
  spinning panel and Han steps through it, then slowly dissolves into every pane at once with a
  cold, echoing laugh. Bruce's reflection — shirtless, with his trademark claw cuts — holds on the
  glass as a speech bubble delivers his taunt ("You have offended my family and you have offended
  the Shaolin Temple") and your fists rise into guard. A low musical bed underscores the whole
  sequence and swells as Bruce appears. Skippable with any click or key; replays go straight to
  the fight.
- **Victory impale cinematic** — the killing blow lands on the mirror you just struck: the other
  panes shatter in a quick cascade while a short spear runs diagonally through Han — shaft jutting
  from one side, bloodied blade from the other — with a dying cry and a triumphant horn the instant
  he falls. Your fists lower out of view and the image holds for a few seconds, then that pane
  revolves slowly — revealing Bruce standing behind the glass — and turns back to the impaled Han
  before the score tally fades in.

- **Scroll to look around** — the mouse wheel or a trackpad swipe now rotates the mirror ring,
  settling on the nearest mirror when you stop (alongside the existing drag and arrow-key controls).

### Changed
- **Distance clues cap at "4+"** — a missed mirror shows Han's distance as before, but 4 and 5 both
  read `4+` (on the pane and the minimap) instead of an exact digit, so a far Han stays ambiguous.

### Fixed
- The dev server now serves the game's own directory regardless of the launch working directory.

## [1.1.0] — 2026-07-20

### Added
- **Tutorial overlay** — a Tutorial button on the HUD opens a how-to-play modal that pauses the
  game: four numbered steps (including how to read the red distance numbers) plus a pixel-art
  control diagram — mouse, arrow keys, and number keys drawn as keycaps with a cycling highlight.
- **Strike-in-focus key** — `↑` strikes whichever mirror is centered in view.
- **Martial-arts strike sound** — a whip-crack "kiai" accent plays on every successful hit.
- Dev server accepts an optional port argument (`python3 serve.py 8643`).
- **Opt-in, privacy-first telemetry** — a vendor-agnostic `track(event, props)` layer
  ([js/telemetry.js](js/telemetry.js)) that records core gameplay events (started / won / lost) and
  reports JS errors. Cookie-free, respects Do Not Track, and **inert until configured** — the game
  stays fully self-contained until you add a GoatCounter code + Sentry DSN. See
  [docs/TELEMETRY.md](docs/TELEMETRY.md).

### Changed
- **Seven mirrors on screen, one always centered** — panes tile edge-to-edge with no gaps, the
  camera snaps to the nearest mirror after a drag, and a chevron marks the centered mirror that
  `↑` strikes.
- **Mirrors renumbered 0–9** (was 1–10) so labels match the number keys exactly.
- **Han redesigned** — brown top and khaki pants with no red accents, clean-shaven, black glove on
  the right hand, and the hand sabre is now four needle-thin blades on a white shirt cuff, worn on
  his left hand (the sprite doubled its internal resolution to draw them that thin).
- **Miss clues are an exact red distance number** — a missed pane shatters and shows Han's distance
  as a pulsing red number in the middle (exact 1–5; the old `4+` cap is gone). A crack-count-only
  clue system was prototyped and reverted pending a better crack visual.
- **Slower, clearer hit feedback** — Han's reveal lingers about twice as long, and the lost health
  chip blinks white/red for an extended beat on both health bars.
- **End-screen copy** — victory now reads "Destroy the image and you will break the enemy"; defeat
  reads "Defeat — You failed to stop Han. The Shaolin Temple is disgraced. Will you continue the
  fight?". The camera returns to mirror 1 when a new game starts.
- **Title screen decluttered** — only the title, "Bruce vs Han" (now under the red sun), and the
  blinking start prompt remain; the mechanics legend and control hints moved into the tutorial.

### Fixed
- Blurry centered text — the pixel font now always renders on whole pixels.

### Removed
- The arc camera view (and its `V` toggle); the rotating 360° view is the only camera.

## [1.0.0] — 2026-07-19

First public release. A complete, playable homage to the *Enter the Dragon* mirror-room duel —
vanilla HTML/CSS/JS, no build step, no external assets (all art and audio generated in code).

### Added
- **Mirror-duel core loop** — ten mirrors ring the room; Han hides behind one, every intact pane
  shows his reflection. Strike the real one to damage him; miss and you take damage.
- **Crack-count clue system** — a missed pane shatters with a crack count that encodes Han's
  distance around the ring (1 = adjacent … 4+ = far), turning each run into a logic puzzle.
- **Combo multiplier** — consecutive hits build a scoring multiplier and reward clean solves.
- **Scoring** — strikes × combo, plus a time bonus for finishing fast.
- **Dual camera modes** — a rotating 360° view and a full-arc view (toggle with `V`).
- **Procedural pixel-art** — all sprites drawn in code at load ([js/sprites.js](js/sprites.js)).
- **Synthesized audio** — all sound generated with the WebAudio API ([js/audio.js](js/audio.js)),
  with a mute toggle.
- **CRT presentation** — 480×270 canvas upscaled with `image-rendering: pixelated`, plus scanline
  and vignette overlays.
- **Controls** — click/tap or number keys `1`–`0` to strike; drag or `←`/`→` to look around the
  ring; `Enter`/`Space` to start & restart.
- **Ring minimap** — bottom-left tracker that records every clue gathered so far.
- **Dev tooling** — no-cache Python dev server ([serve.py](serve.py)) and `window.DEBUG` flag for
  logging Han's position.

> Roadmap and future ideas live in the [README](README.md#roadmap) and the [master spec](SPEC.md) —
> they're intentionally kept out of the changelog, which records only what has shipped.

[Unreleased]: https://github.com/MajedGitsGood/bruce-lee-hall-of-mirrors/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/MajedGitsGood/bruce-lee-hall-of-mirrors/releases/tag/v1.1.0
[1.0.0]: https://github.com/MajedGitsGood/bruce-lee-hall-of-mirrors/releases/tag/v1.0.0
