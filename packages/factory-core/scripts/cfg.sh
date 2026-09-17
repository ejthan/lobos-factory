#!/usr/bin/env bash
# Read one value from the target repo's .factory.yml.
#   cfg.sh host                  -> github
#   cfg.sh commands.test         -> pnpm nx affected -t test
#   cfg.sh tickets tickets       -> value, or the fallback if unset
set -euo pipefail
repo="${FACTORY_REPO:-$(git rev-parse --show-toplevel)}"
file="$repo/.factory.yml"
key="${1:?usage: cfg.sh <key> [default]}"
def="${2-}"

val=""
if [ -f "$file" ]; then
  val=$(awk -v want="$key" '
    /^[[:space:]]*#/ { next }
    /^[[:space:]]*$/ { next }
    {
      line = $0
      indent = match(line, /[^ ]/) - 1
      sub(/^[[:space:]]+/, "", line)
      p = index(line, ":")
      if (p == 0) next
      k = substr(line, 1, p - 1)
      v = substr(line, p + 1)
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", v)
      if (indent == 0) { parent = k; full = k } else { full = parent "." k }
      if (full == want && v != "") { print v; exit }
    }' "$file")
fi

if [ -z "$val" ]; then
  [ -n "$def" ] && { printf '%s\n' "$def"; exit 0; }
  echo "cfg: key '$key' not found in $file" >&2
  exit 1
fi
# strip surrounding quotes
val="${val%\"}"; val="${val#\"}"
val="${val%\'}"; val="${val#\'}"
printf '%s\n' "$val"
