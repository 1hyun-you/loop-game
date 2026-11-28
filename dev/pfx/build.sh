#!/bin/sh
# pixelfx 묶음 다시 만들기 → src/pfx-lib.js (회차 105)
# pixelfx를 고정 커밋으로 내려받아 게임 전용 효과(dev/pfx/game)를 넣고 esbuild로 하나의 파일로 묶음
set -e
HERE=$(cd "$(dirname "$0")" && pwd); ROOT=$(cd "$HERE/../.." && pwd); W=$(mktemp -d)
git clone -q https://github.com/patch-gg/pixelfx "$W/pixelfx" && cd "$W/pixelfx" && git checkout -q 5294518ce7c72e48b6100a744596e0acf57f2826
mkdir -p src/fx/game && cp "$HERE/game/"*.js src/fx/game/ && cp "$HERE/entry.js" pfx-entry.js
npm i --silent && node_modules/.bin/esbuild pfx-entry.js --bundle --format=iife --minify --legal-comments=none --outfile=out.js
{ printf '/* pixelfx 묶음 (github.com/patch-gg/pixelfx @ %s, MIT License, Copyright (c) 2026 Patch / 일부 효과 Sprite Fusion Hugo Duprez MIT)\n   다시 만들기: sh dev/pfx/build.sh — 원본 dev/pfx/entry.js, 게임 전용 효과 dev/pfx/game/ (회차 105) */\n' "$(git rev-parse --short HEAD)"; cat out.js; } > "$ROOT/src/pfx-lib.js"
echo "src/pfx-lib.js 갱신"
