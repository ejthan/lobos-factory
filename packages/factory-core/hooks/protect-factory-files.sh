#!/usr/bin/env bash
# PreToolUse on Edit|Write: while a ticket run is active, the factory may not
# edit its own rules (unless the ticket is type: factory) and may not edit main.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
scripts="$here/../scripts"
input=$(cat)

deny() {
  jq -nc --arg r "$1" '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
  exit 0
}

repo=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
export FACTORY_REPO="$repo"
ticket=$("$scripts/ticket.sh" current 2>/dev/null || true)
[ -n "$ticket" ] || exit 0   # no run in progress: not the factory's business

branch=$(git -C "$repo" rev-parse --abbrev-ref HEAD)
base=$("$scripts/cfg.sh" defaultBranch main)
[ "$branch" = "$base" ] && deny "Ticket $ticket is active and you are on '$base'. Work on ticket/<id>-<slug>."

path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_input.path // empty')
[ -n "$path" ] || exit 0
rel="${path#$repo/}"

type=$("$scripts/ticket.sh" get "$ticket" type 2>/dev/null || echo product)
[ "$type" = "factory" ] && exit 0

# A new ADR is how a product ticket records a decision. Existing ones stay put.
case "$rel" in docs/adr/*) [ -e "$path" ] || exit 0 ;; esac

protected=$("$scripts/cfg.sh" protectedPaths "[]" | tr -d '[]' | tr ',' '\n')
while read -r p; do
  p=$(printf '%s' "$p" | tr -d ' "')
  [ -n "$p" ] || continue
  case "$rel" in
    "$p"|"$p"*) deny "'$rel' is a protected factory file. Ticket $ticket is type '$type'; only a 'type: factory' ticket may change the factory." ;;
  esac
done <<< "$protected"
exit 0
