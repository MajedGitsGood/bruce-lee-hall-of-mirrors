# Telemetry — turning it on

The game ships with usage + error tracking wired up but **switched off**. With the two config values
in [`js/telemetry.js`](../js/telemetry.js) left blank, nothing external loads and no data leaves the
visitor's browser — the game stays 100% self-contained. Fill them in to turn tracking on.

Both values are **client-side and public by design** (a GoatCounter site code and a Sentry DSN are
meant to appear in page source), so they're safe to commit to this public repo. There is no secret to
protect here.

## What gets tracked

- **Usage events** (via GoatCounter, cookie-free): `game-started`, `game-won`, `game-lost` — enough
  to see plays, win rate, and a rough funnel. Respects the browser's Do Not Track setting.
- **Errors** (via Sentry): uncaught JS errors and promise rejections, with stack traces, so you learn
  about bugs real players hit. A lightweight `js-error` event also goes to GoatCounter, so you get bug
  *signal* even if Sentry is off.

Add or rename events by calling `track('event-name', { ...props })` in the game code — the provider
wiring lives entirely in `telemetry.js`, so gameplay code never touches a vendor SDK.

## 1. Analytics — GoatCounter (free, privacy-first)

1. Create a free account at <https://www.goatcounter.com> and pick a site code (e.g. `bruce-lee`).
   Your dashboard will be `https://<code>.goatcounter.com`.
2. In `js/telemetry.js`, set `goatcounterCode: '<code>'`.

No cookie banner is required — GoatCounter sets no cookies and collects no personal data.

## 2. Errors — Sentry (free tier)

1. Create a free account at <https://sentry.io>, make a **Browser / JavaScript** project.
2. Copy its **DSN** (looks like `https://abcd1234@o0.ingest.sentry.io/0`).
3. In `js/telemetry.js`, set `sentryDsn: '<your DSN>'`.

The loader is injected only when a DSN is present, and Sentry is configured with `sendDefaultPii:
false`.

## 3. Ship it

Commit the change and push (or run the `ship` skill). Confirm on the live site: open the game, play a
round, and within a minute you should see the pageview + `evt/game-started` in GoatCounter, and any
thrown error in Sentry. Set `window.DEBUG = true` in the console to watch `track()` calls locally.
