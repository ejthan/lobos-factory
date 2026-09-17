#!/usr/bin/env bash
# Write docs/reports/<id>.md from the ticket and its event log.
# Usage: report.sh <id>
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo="${FACTORY_REPO:-$(git rev-parse --show-toplevel)}"
id="${1:?usage: report.sh <id>}"
docs="$repo/$("$here/cfg.sh" docs docs)"
log="$repo/.factory/events/$id.log"
t() { "$here/ticket.sh" get "$id" "$1"; }

# first timestamp of an event, or "-"
at() { [ -f "$log" ] && grep -m1 " $1\$" "$log" | cut -d' ' -f1 || true; }
span() { # hours between two ISO timestamps
  [ -n "${1-}" ] && [ -n "${2-}" ] || { echo "-"; return; }
  node -e 'const [a,b]=process.argv.slice(1);const h=(new Date(b)-new Date(a))/36e5;console.log(h.toFixed(1)+" h")' "$1" "$2"
}
count() { [ -f "$log" ] && grep -c "$1" "$log" || echo 0; }

created=$(at "state:spec-draft"); [ -n "$created" ] || created=$(head -1 "$log" 2>/dev/null | cut -d' ' -f1)
approved=$(at "state:spec-approved")
pr_open=$(at "pr-opened")
merged=$(at "state:merged")
done_at=$(at "state:done")

steps=$(count " step:")
interventions=$(count " intervention")
rate=$(node -e 'const [s,i]=process.argv.slice(1).map(Number);console.log(s>0?Math.round((1-i/s)*100)+" %":"-")' "$steps" "$interventions")
rounds=$(count " state:changes-requested")
branch=$(t branch)
commits="-"
[ -n "$branch" ] && commits=$(git -C "$repo" rev-list --count "origin/$(  "$here/cfg.sh" defaultBranch main)..$branch" 2>/dev/null || echo "-")

mkdir -p "$docs/reports"
out="$docs/reports/$id.md"
cat > "$out" <<MD
# Report $id — $(t title)

| | |
|---|---|
| type | $(t type) |
| risk | $(t risk) |
| branch | \`$branch\` |
| PR | $(t pr) |
| spec | $(t spec) |

## Timeline

| event | at |
|---|---|
| spec started | ${created:--} |
| spec approved | ${approved:--} |
| PR opened | ${pr_open:--} |
| merged | ${merged:--} |
| done | ${done_at:--} |

## Metrics

| metric | value |
|---|---|
| lead time (spec start → done) | $(span "$created" "$done_at") |
| **PR-to-merge** | $(span "$pr_open" "$merged") |
| review rounds | $rounds |
| **autonomous rate** | $rate ($interventions human interventions in $steps agent steps) |
| commits | $commits |

## Smoke test

![smoke](../../.factory/smoke/$id.png)

## Notes
MD
echo "$out"
