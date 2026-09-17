#!/usr/bin/env bash
# PreToolUse on Bash: no commits on the default branch while a ticket run is
# active, and never a force push.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
scripts="$here/../scripts"
input=$(cat)
cmdline=$(printf '%s' "$input" | jq -r '.tool_input.command // empty')
[ -n "$cmdline" ] || exit 0

deny() {
  jq -nc --arg r "$1" '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
  exit 0
}

# a force flag on an actual `git push`, not the word "push" somewhere in a heredoc
if printf '%s' "$cmdline" | grep -Eq '(^|[;&|(]|&&|\|\|)[[:space:]]*git[[:space:]]+(-[^[:space:]]+[[:space:]]+)*push[[:space:]]+[^;&|]*(--force([[:space:]]|$)|--force-with-lease|-f([[:space:]]|$))'; then
  deny "Force push is blocked. Rebase and push normally, or ask the human."
fi

repo=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
export FACTORY_REPO="$repo"
ticket=$("$scripts/ticket.sh" current 2>/dev/null || true)
[ -n "$ticket" ] || exit 0

base=$("$scripts/cfg.sh" defaultBranch main)
branch=$(git -C "$repo" rev-parse --abbrev-ref HEAD)
if [ "$branch" = "$base" ] && printf '%s' "$cmdline" | \
   grep -Eq '(^|[;&|(]|&&|\|\|)[[:space:]]*git[[:space:]]+(-[^[:space:]]+[[:space:]]+)*(commit|merge|push)([[:space:]]|$)'; then
  deny "Ticket $ticket is active and you are on '$base'. One ticket, one branch, one PR."
fi
exit 0
