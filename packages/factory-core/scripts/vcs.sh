#!/usr/bin/env bash
# Thin adapter over the git host CLI. Host comes from .factory.yml (github|gitlab).
#
#   vcs.sh pr-create "<title>" <body-file>   open a PR/MR from the current branch, print the URL
#   vcs.sh pr-diff <pr>                      print the diff
#   vcs.sh pr-comment <pr> <body-file>       post a comment
#   vcs.sh pr-status <pr>                    open | merged | closed
#   vcs.sh merged <pr>                       exit 0 if merged, 1 otherwise
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
host=$("$here/cfg.sh" host github)
base=$("$here/cfg.sh" defaultBranch main)

die() { echo "vcs: $*" >&2; exit 1; }
need() { command -v "$1" >/dev/null || die "$1 is not installed (host: $host)"; }

cmd="${1:?usage: vcs.sh <pr-create|pr-diff|pr-comment|pr-status|merged>}"; shift || true

case "$host" in
github)
  need gh
  case "$cmd" in
    pr-create)  gh pr create --base "$base" --title "$1" --body-file "$2" ;;
    pr-diff)    gh pr diff "$1" ;;
    pr-comment) gh pr comment "$1" --body-file "$2" ;;
    pr-status)  gh pr view "$1" --json state -q '.state' | tr '[:upper:]' '[:lower:]' ;;
    merged)     [ "$(gh pr view "$1" --json state -q '.state')" = "MERGED" ] ;;
    *) die "unknown command $cmd" ;;
  esac
  ;;
gitlab)
  need glab
  case "$cmd" in
    pr-create)  glab mr create --target-branch "$base" --title "$1" --description "$(cat "$2")" --yes ;;
    pr-diff)    glab mr diff "$1" ;;
    pr-comment) glab mr note "$1" -m "$(cat "$2")" ;;
    pr-status)  glab mr view "$1" -F json | jq -r '.state' | tr '[:upper:]' '[:lower:]' ;;
    merged)     [ "$(glab mr view "$1" -F json | jq -r '.state')" = "merged" ] ;;
    *) die "unknown command $cmd" ;;
  esac
  ;;
*) die "unknown host '$host' in .factory.yml (use github or gitlab)" ;;
esac
