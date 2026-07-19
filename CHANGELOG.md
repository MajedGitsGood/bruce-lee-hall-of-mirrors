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

## [Unreleased] — Roadmap

Ideas from the [master design spec](SPEC.md), not yet built:

- Progressive body damage — hero takes visible cuts, villain bleeds as health depletes.
- Spinning spear **intro** and impaled **exit** animations, with movie-quote audio.
- Victory / replay animations.
- Difficulty slider — tune health, pane count, and score multiplier.
- Leveling, unlockable cosmetics, and leaderboards / weekly high-score contests.
- Exploratory Web3 layer — NFT characters, skins, and animations *(concept only)*.

[1.0.0]: https://github.com/MajedGitsGood/bruce-lee-hall-of-mirrors/releases/tag/v1.0.0
