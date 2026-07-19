---
name: ship
description: >-
  Cut a release of the game: roll CHANGELOG's [Unreleased] into a dated, versioned section, tag it,
  publish a GitHub Release, and confirm the live site redeployed. Use this whenever the user wants to
  ship / cut / publish / tag a release / "make it official" / bump the version, or when a batch of
  [Unreleased] changes is ready to go out. Always smoke-test first — never ship a release that hasn't
  booted clean.
---

# Ship

Turn accumulated `[Unreleased]` work into a real, tagged, released version. Tagged releases with clean
notes are what make a repo read as *deliberately shipped* rather than *continuously dumped* — that's
the whole point of running this instead of just pushing.

## Pre-flight (do not skip)

1. **Smoke-test.** Run the `smoke-test` skill. If it FAILs, stop and fix — do not ship a broken build.
2. **Clean tree.** `git status` must be clean (or commit/stash first). Releasing a dirty tree tags
   something that isn't what's committed.
3. **Real content.** `CHANGELOG.md` `[Unreleased]` must have at least one actual change bullet (not
   just an empty section). If it's empty, there's nothing to ship — say so and stop.

## Choose the version (semver)

Read the `[Unreleased]` bullets and pick the bump from the *nature* of the changes — confirm with the
user if unsure:

- **patch** (x.y.**Z**) — fixes / tiny tweaks, no new player-facing capability.
- **minor** (x.**Y**.0) — new features, backward-compatible (new mode, option, mechanic).
- **major** (**X**.0.0) — breaking or identity-level change.

Compute the next version from the latest `## [x.y.z]` heading in `CHANGELOG.md`.

## Release steps

Use today's real date (check it). `gh` lives at `~/.local/bin/gh` (not on PATH) — prefix commands with
`export PATH="$HOME/.local/bin:$PATH"`.

1. **Roll the changelog.** In `CHANGELOG.md`, rename the top `## [Unreleased]` section to
   `## [X.Y.Z] — YYYY-MM-DD`, and insert a fresh empty `## [Unreleased]` above it. Add/refresh the
   link-reference line at the bottom:
   `[X.Y.Z]: https://github.com/MajedGitsGood/bruce-lee-hall-of-mirrors/releases/tag/vX.Y.Z`
2. **Commit.** `git add -A && git commit -m "Release vX.Y.Z"` (commit email is already the GitHub
   noreply — see [[github-account]] if a push is ever rejected for email privacy).
3. **Tag & push.** `git tag vX.Y.Z && git push origin main --tags`.
4. **GitHub Release.** Publish with the notes from the new changelog section:
   `gh release create vX.Y.Z --title "vX.Y.Z" --notes "<the bullets from this version's section>"`.
5. **Verify the deploy.** GitHub Pages redeploys on push (~1 min). Confirm the live site is healthy:
   `curl -s -o /dev/null -w "%{http_code}" https://majedgitsgood.github.io/bruce-lee-hall-of-mirrors/`
   → expect `200`. Optionally load it in the preview browser to eyeball it.
6. **Report.** Give the user the release URL, the tag, and the live link.

## Notes

- Publishing a release + pushing tags is outward-facing — confirm with the user before step 3 unless
  they've already said "ship it".
- If this is the first time and `v1.0.0` was never tagged, offer to tag the existing 1.0.0 first (so
  its changelog link resolves) before cutting the new version.
