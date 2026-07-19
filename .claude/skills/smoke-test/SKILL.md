---
name: smoke-test
description: >-
  Boot the game in the preview browser and verify it actually works before trusting a change or
  cutting a release — canvas renders, a match starts and reaches an end state, and the console is
  error-free. Use this whenever you've changed game code (js/, index.html, style.css), before running
  the `ship` skill, or any time someone asks "does it still work / is it broken / did I break
  anything". A green smoke test is the bar for shipping; don't release without one.
---

# Smoke test

A fast confidence check that the built game boots and plays, using the preview browser tools. This is
the gate before shipping — a broken demo on a public URL is the one thing a product-builder repo can't
afford.

There is no unit-test framework here (vanilla JS, by design), so "the test" is: drive the real game in
a real browser and assert the happy path holds.

## Steps

1. **Serve it.** The dev server config is `bruce-lee-game` (`.claude/launch.json`, port 8642). Call
   `preview_start` with `{name: "bruce-lee-game"}`. If the port is already in use, instead
   `preview_start` with `{url: "http://localhost:8642"}` — it's already running.

2. **Load & reset.** Navigate to `http://localhost:8642`. If you changed code, hard-reload
   (`javascript_tool`: `window.location.reload()`) so you're not testing a stale cache.

3. **Assert it renders.** `read_console_messages` with `onlyErrors: true` — expect **none**. Take a
   `computer` screenshot and confirm the title screen drew (not a blank/black canvas).

4. **Assert it plays.** Start a match and confirm the state machine advances. The reliable way (clicks
   can miss focus in the pane) is `javascript_tool`:
   - `startGame()` then read `state` → expect `"play"`.
   - `beginStrike(0)` (strike a pane) → no throw.
   - Optionally force an end state to exercise win/lose: the game exposes `beginVictory()` /
     `beginDefeat()`; call one and confirm `state` becomes `"victory"` / `"defeat"`.

5. **Re-check the console.** `read_console_messages` again after interacting — still no errors. (A
   `[track] …` debug line is fine and expected if `window.DEBUG` is on; it is not an error.)

6. **Report a verdict.** Say PASS or FAIL plainly. On FAIL, include the console error text and the
   screenshot, then read the relevant source to diagnose — do not paper over it.

## What PASS means

Title screen renders · `startGame()` → `state === "play"` · a strike runs without throwing · an end
state is reachable · zero console errors throughout. Anything short of that is a FAIL worth fixing
before `ship`.
