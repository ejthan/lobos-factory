#!/usr/bin/env bash
# The ticket store. Markdown files with YAML frontmatter are the database.
#
#   ticket.sh new "<title>" [type]      create tickets/<id>-<slug>.md in backlog
#   ticket.sh list [state]              id|state|type|risk|title
#   ticket.sh show <id>                 print the whole file
#   ticket.sh path <id>                 print the file path
#   ticket.sh get <id> <field>          read one frontmatter field
#   ticket.sh set <id> <field> <value>  write one frontmatter field
#   ticket.sh state <id> <new> [-f]     move state, refuses illegal transitions
#   ticket.sh event <id> <name>         append a timestamped event (for reports)
#   ticket.sh current [<id>|--clear]    the ticket a run is working on
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo="${FACTORY_REPO:-$(git rev-parse --show-toplevel)}"
cfg() { "$here/cfg.sh" "$@"; }
dir="$repo/$(cfg tickets tickets)"

die() { echo "ticket: $*" >&2; exit 1; }

find_file() {
  local id="$1" f
  f=$(ls "$dir"/"$id"-*.md 2>/dev/null | head -1) || true
  [ -n "$f" ] || die "no ticket $id in $dir"
  printf '%s\n' "$f"
}

fm_get() { sed -n '/^---$/,/^---$/p' "$1" | sed -n "s/^$2:[[:space:]]*//p" | head -1 | sed 's/^"//; s/"$//'; }

fm_set() {
  local f="$1" k="$2" v="$3" tmp
  tmp=$(mktemp)
  if sed -n '/^---$/,/^---$/p' "$f" | grep -q "^$k:"; then
    awk -v k="$k" -v v="$v" '
      /^---$/ { n++ } 
      n==1 && $0 ~ "^" k ":" { print k ": " v; next }
      { print }' "$f" > "$tmp"
  else
    awk -v k="$k" -v v="$v" '
      /^---$/ { n++; if (n==2) print k ": " v }
      { print }' "$f" > "$tmp"
  fi
  mv "$tmp" "$f"
}

# state machine: from -> allowed next states
allowed() {
  case "$1" in
    backlog)           echo "spec-draft" ;;
    spec-draft)        echo "spec-approved backlog" ;;
    spec-approved)     echo "planned" ;;
    planned)           echo "in-review" ;;
    in-review)         echo "changes-requested merged" ;;
    changes-requested) echo "planned in-review" ;;
    merged)            echo "done" ;;
    done)              echo "" ;;
    *)                 echo "" ;;
  esac
}

cmd="${1:?usage: ticket.sh <new|list|show|path|get|set|state|event|current>}"; shift || true

case "$cmd" in
  path) find_file "$1" ;;
  show) cat "$(find_file "$1")" ;;
  get)  fm_get "$(find_file "$1")" "$2" ;;
  set)  f=$(find_file "$1"); fm_set "$f" "$2" "${3-}"; echo "$1 $2 = ${3-}" ;;

  list)
    want="${1-}"
    for f in "$dir"/[0-9]*.md; do
      [ -e "$f" ] || continue
      s=$(fm_get "$f" state)
      [ -n "$want" ] && [ "$s" != "$want" ] && continue
      printf '%s|%s|%s|%s|%s\n' "$(fm_get "$f" id)" "$s" "$(fm_get "$f" type)" "$(fm_get "$f" risk)" "$(fm_get "$f" title)"
    done
    ;;

  state)
    id="$1"; new="$2"; force="${3-}"
    f=$(find_file "$id"); cur=$(fm_get "$f" state)
    [ "$cur" = "$new" ] && { echo "$id already $new"; exit 0; }
    if [ "$force" != "-f" ] && [ "$force" != "--force" ]; then
      case " $(allowed "$cur") " in
        *" $new "*) ;;
        *) die "illegal transition $cur -> $new for ticket $id (allowed: $(allowed "$cur"))" ;;
      esac
    fi
    fm_set "$f" state "$new"
    "$0" event "$id" "state:$new"
    echo "$id: $cur -> $new"
    ;;

  new)
    title="${1:?usage: ticket.sh new \"<title>\" [type]}"; type="${2:-product}"
    last=$(ls "$dir"/[0-9]*.md 2>/dev/null | sed 's#.*/##; s/-.*//' | sort -n | tail -1)
    id=$(printf '%03d' $(( 10#${last:-0} + 1 )))
    # -E: BSD sed has no \+ , and a bad slug becomes a filename with spaces in it
    slug=$(printf '%s' "$title" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//' | cut -c1-50)
    f="$dir/$id-$slug.md"
    cat > "$f" <<TPL
---
id: "$id"
title: $title
type: $type
risk:
state: backlog
created: $(date +%F)
branch:
pr:
spec:
report:
---

## Goal

## Context

## Acceptance criteria (draft)

## Out of scope
TPL
    echo "$f"
    ;;

  event)
    id="$1"; name="$2"
    mkdir -p "$repo/.factory/events"
    printf '%s %s\n' "$(date -u +%FT%TZ)" "$name" >> "$repo/.factory/events/$id.log"
    ;;

  current)
    mark="$repo/.factory/current-ticket"
    case "${1-}" in
      "")        [ -f "$mark" ] && cat "$mark" || true ;;
      --clear)   rm -f "$mark" ;;
      *)         mkdir -p "$repo/.factory"; printf '%s\n' "$1" > "$mark" ;;
    esac
    ;;

  *) die "unknown command $cmd" ;;
esac
