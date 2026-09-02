#!/bin/bash
# Render each project HTML in light and dark to PNG via headless Chrome.
# Chrome does not exit after --screenshot on this machine, so wait for the file and kill it.
S="$(cd "$(dirname "$0")" && pwd)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT="$S/../../public/projects"; mkdir -p "$OUT"
NAMES="${*:-physics equity shortlink}"
for name in $NAMES; do
  for theme in light dark; do
    png="$OUT/$name-$theme.png"; rm -f "$png"
    "$CHROME" --headless=new --disable-gpu --hide-scrollbars --no-first-run --disable-crash-reporter \
      --user-data-dir="${TMPDIR:-/tmp}/hero-profile-$name-$theme" --window-size=1600,1000 --force-device-scale-factor=1.5 \
      --screenshot="$png" "file://$S/$name.html?theme=$theme" >/dev/null 2>&1 &
    pid=$!
    for _ in $(seq 1 150); do [ -s "$png" ] && break; sleep 0.2; done
    sleep 0.6; kill "$pid" 2>/dev/null; wait "$pid" 2>/dev/null
    if [ -s "$png" ]; then echo "ok   $name-$theme $(du -k "$png" | cut -f1)K"; else echo "FAIL $name-$theme"; fi
  done
done
