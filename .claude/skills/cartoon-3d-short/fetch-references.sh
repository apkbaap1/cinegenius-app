#!/usr/bin/env bash
# Downloads the reference frames and contact sheets (~19 MB) into references/.
# They are third-party frames for private style study only: kept out of git
# (see .gitignore), never upload, publish or send them.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
REV=e3b817b6afc6cd413466d43f11ba31209e034bbf
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
git clone -q --filter=blob:none --no-checkout https://github.com/mromidev/claude-animated-shorts "$TMP/src"
git -C "$TMP/src" checkout -q "$REV" -- references/frames references/sheets
cp -r "$TMP/src/references/frames" "$TMP/src/references/sheets" "$HERE/references/"
echo "Reference frames and sheets are in $HERE/references/"
