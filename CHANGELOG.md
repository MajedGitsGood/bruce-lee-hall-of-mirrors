# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

## [Unreleased]

### Added
- **Tutorial overlay** — a Tutorial button on the HUD opens a how-to-play modal that pauses the
  game: four numbered steps (including the crack-count clue, which is no longer spelled out on
  screen) plus a pixel-art control diagram — mouse, arrow keys, and number keys drawn as keycaps
  with a cycling highlight.
- **Strike-in-focus key** — `↑` strikes whichever mirror is centered in view.
- **Martial-arts strike sound** — a whip-crack "kiai" accent plays on every successful hit.
- Dev server accepts an optional port argument (`python3 serve.py 8643`).

### Changed
- **Six mirrors on screen** — panes now tile edge-to-edge with no gaps between frames.
- **Mirrors renumbered 0–9** (was 1–10) so labels match the number keys exactly.
- **Han redesigned** — brown top and khaki pants with no red accents, clean-shaven, black glove on
  the right hand, and the hand sabre is now four needle-thin blades on a white shirt cuff, worn on
  his left hand (the sprite doubled its internal resolution to draw them that thin).
- **Missed mirrors crack instead of shattering** — a miss leaves cracked glass whose crack count
  *exactly* equals Han's distance (the stray micro-cracks that inflated the count are gone), and the
  red clue numbers were removed — the cracks are the only clue.
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

### Roadmap

Ideas from the [master design spec](SPEC.md), not yet built:

- Progressive body damage — hero takes visible cuts, villain bleeds as health depletes.
- Spinning spear **intro** and impaled **exit** animations, with movie-quote audio.
- Victory / replay animations.
- Difficulty slider — tune health, pane count, and score multiplier.
- Leveling, unlockable cosmetics, and leaderboards / weekly high-score contests.
- Exploratory Web3 layer — NFT characters, skins, and animations *(concept only)*.

[1.0.0]: https://github.com/MajedGitsGood/bruce-lee-hall-of-mirrors/releases/tag/v1.0.0
