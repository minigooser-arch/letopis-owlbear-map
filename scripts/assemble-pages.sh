#!/usr/bin/env bash
set -euo pipefail
if [[ $# -ne 3 ]]; then echo "usage: $0 EXTENSION_DIST MAP_DIR SITE_DIR" >&2; exit 2; fi
ext="$1"; map="$2"; site="$3"
[[ -f "$ext/manifest.json" ]] || { echo "missing $ext/manifest.json" >&2; exit 1; }
[[ -f "$map/current.json" && -f "$map/manifest.json" ]] || { echo "missing map JSON" >&2; exit 1; }
rm -rf "$site"; mkdir -p "$site/map"
cp -a "$ext/." "$site/"
cp -a "$map/." "$site/map/"
