#!/usr/bin/env bash
# Stop hook — gentle, non-looping nudge. If source files changed this working tree but neither log was
# touched, remind (via a user-facing systemMessage) to run /logbook. It never blocks and clears itself
# the moment the logs are updated or the changes are committed, so it can't loop.
cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || true

paths="$(git status --porcelain 2>/dev/null | sed 's/^...//')"
[ -z "$paths" ] && exit 0

src="$(printf '%s\n' "$paths"  | grep -E '^(js/|index\.html|style\.css|serve\.py)' )"
logs="$(printf '%s\n' "$paths" | grep -E '^(CHANGELOG\.md|DECISIONS\.md)$' )"

if [ -n "$src" ] && [ -z "$logs" ]; then
  printf '%s\n' '{"systemMessage":"📓 logbook: source changed but CHANGELOG.md / DECISIONS.md were not. If anything here is notable, run /logbook before wrapping up."}'
fi
exit 0
