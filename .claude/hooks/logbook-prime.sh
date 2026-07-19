#!/usr/bin/env bash
# SessionStart hook — prime the agent with recent DECISIONS.md entries and the current CHANGELOG
# [Unreleased] block, so every new session starts aware of past intent instead of reverse-engineering
# it from git. Injected as additionalContext. Never blocks; a missing file just yields less context.
cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || true

content="$(
  if [ -f DECISIONS.md ]; then
    echo "== Recent decisions (DECISIONS.md, newest first) =="
    # Print the first 3 "## " entries (file is newest-first).
    awk '/^## /{n++} n>3{exit} n>=1{print}' DECISIONS.md
    echo
  fi
  if [ -f CHANGELOG.md ]; then
    echo "== Unreleased changes (CHANGELOG.md) =="
    # Print the [Unreleased] section up to the next version heading.
    awk '/^## \[Unreleased\]/{f=1} f&&/^## \[/&&!/Unreleased/{exit} f{print}' CHANGELOG.md
  fi
)"

# Nothing to say → stay silent (valid: no logs yet).
[ -z "$content" ] && exit 0

CONTENT="$content" python3 -c '
import json, os
print(json.dumps({
    "hookSpecificOutput": {
        "hookEventName": "SessionStart",
        "additionalContext": os.environ["CONTENT"],
    }
}))'
