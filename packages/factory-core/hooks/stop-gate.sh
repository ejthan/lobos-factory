#!/usr/bin/env bash
# Stop: do not finish a ticket run while lint or tests are red. One retry, then
# let the agent report instead of looping.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
scripts="$here/../scripts"
input=$(cat)

[ "$(printf '%s' "$input" | jq -r '.stop_hook_active // false')" = "true" ] && exit 0

repo=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
export FACTORY_REPO="$repo"
ticket=$("$scripts/ticket.sh" current 2>/dev/null || true)
[ -n "$ticket" ] || exit 0

state=$("$scripts/ticket.sh" get "$ticket" state 2>/dev/null || echo "")
case "$state" in planned|in-review|changes-requested) ;; *) exit 0 ;; esac

out=""
for step in lint test; do
  cmd=$("$scripts/cfg.sh" "commands.$step" "" 2>/dev/null || true)
  [ -n "$cmd" ] || continue
  if ! result=$(cd "$repo" && eval "$cmd" 2>&1); then
    out="$out
--- $step failed ---
$(printf '%s' "$result" | tail -40)"
  fi
done

[ -n "$out" ] || exit 0
jq -nc --arg r "Ticket $ticket is not green yet:$out" \
  '{hookSpecificOutput:{hookEventName:"Stop",permissionDecision:"continue",permissionDecisionReason:$r}}'
