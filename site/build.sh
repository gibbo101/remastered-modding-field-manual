#!/bin/bash
# Builds the website into public/ with Quartz: README.md becomes the home page and each section folder gets a title.
# Extra arguments go to `quartz build` (for a local preview: site/build.sh --serve).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
QUARTZ="${QUARTZ_DIR:-$ROOT/.quartz-build}"
QUARTZ_VERSION=v4.5.2

if [ ! -d "$QUARTZ" ]; then
  git clone --quiet --depth 1 --branch "$QUARTZ_VERSION" https://github.com/jackyzha0/quartz.git "$QUARTZ"
fi
if [ ! -d "$QUARTZ/node_modules" ]; then
  (cd "$QUARTZ" && npm ci --no-audit --no-fund)
fi

CONTENT="$QUARTZ/content"
rm -rf "$CONTENT"
mkdir -p "$CONTENT"
rsync -a --exclude .git --exclude .github --exclude .obsidian --exclude .trash --exclude .quartz-build \
  --exclude public --exclude site --exclude handoff --exclude HANDOFF.md --exclude CLAUDE.md --exclude README.md \
  "$ROOT"/ "$CONTENT"/
cp "$ROOT/README.md" "$CONTENT/index.md"

while IFS='|' read -r dir title; do
  [ -d "$CONTENT/$dir" ] && printf -- '---\ntitle: %s\n---\n' "$title" > "$CONTENT/$dir/index.md"
done <<'SECTIONS'
getting-started|Getting started
formats|File formats
launcher-data|Launcher data
front-end|Front end
using-what-the-player-owns|Using what the player already owns
maps-and-lobby|Maps and the lobby
sound-and-music|Sound and music
ai|AI and pathfinding
behaviours|New unit behaviours
engine|Engine
units|Units and buildings
art|Art
structuring|Structuring a big mod
troubleshooting|Troubleshooting
clientg-ram|Patching the launcher (advanced)
SECTIONS

cp "$ROOT/site/quartz.config.ts" "$ROOT/site/quartz.layout.ts" "$QUARTZ"/
cd "$QUARTZ"
npx quartz build --directory content --output "$ROOT/public" "$@"
