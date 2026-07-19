# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Opt-in, privacy-first telemetry** — a vendor-agnostic `track(event, props)` layer
  ([js/telemetry.js](js/telemetry.js)) that records core gameplay events (started / won / lost) and
  reports JS errors. Cookie-free, respects Do Not Track, and **inert until configured** — the game
  stays fully self-contained until you add a GoatCounter code + Sentry DSN. See
  [docs/TELEMETRY.md](docs/TELEMETRY.md).

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

[Unreleased]: https://github.com/MajedGitsGood/bruce-lee-hall-of-mirrors/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/MajedGitsGood/bruce-lee-hall-of-mirrors/releases/tag/v1.0.0
