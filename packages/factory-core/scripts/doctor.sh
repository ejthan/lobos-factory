#!/usr/bin/env bash
# Check whether a repo has what the factory needs. Prints findings as JSON.
# Usage: doctor.sh [repo-path]
set -euo pipefail

repo="${1:-$(git rev-parse --show-toplevel)}"
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export FACTORY_REPO="$repo"
findings=()
add() { findings+=("$(jq -nc --arg k "$1" --arg m "$2" --arg f "$3" '{check:$k,message:$m,fix:$f}')"); }

[ -d "$repo/.git" ] || add git "not a git repository" "git init"
[ -f "$repo/.factory.yml" ] || add config "no .factory.yml" "run /factory-init"
[ -f "$repo/AGENTS.md" ] || add rules "no AGENTS.md" "run /factory-init"
[ -d "$repo/$("$here/cfg.sh" tickets tickets 2>/dev/null || echo tickets)" ] || add tickets "no tickets folder" "run /factory-init"
[ -f "$repo/$("$here/cfg.sh" docs docs 2>/dev/null || echo docs)/quality.md" ] || add quality "no docs/quality.md" "run /factory-init"

pkg="$repo/package.json"
if [ -f "$pkg" ]; then
  jq -e '.scripts // {} | keys | any(test("lint"))' "$pkg" >/dev/null 2>&1 || \
    grep -q "nx" "$pkg" || add lint "no lint script" "add a lint setup and a lint command to .factory.yml"
  jq -e '.scripts // {} | keys | any(test("test"))' "$pkg" >/dev/null 2>&1 || \
    grep -q "nx" "$pkg" || add test "no test script" "add a unit test harness"
else
  add package "no package.json" "the factory assumes a node/pnpm repo in stage 1"
fi

grep -rqs "playwright" "$repo/package.json" "$repo"/*.config.* 2>/dev/null || \
  add e2e "no Playwright e2e setup" "add an e2e project with one @smoke tagged test"
[ -d "$repo/.github/workflows" ] || [ -f "$repo/.gitlab-ci.yml" ] || add ci "no CI pipeline" "add CI from the factory templates"
grep -qs "^.factory/" "$repo/.gitignore" || add gitignore ".factory/ is not gitignored" "add .factory/ to .gitignore"

printf '%s\n' "${findings[@]:-}" | grep -v '^$' | jq -s '.'
