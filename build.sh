#!/bin/sh
# 원본 파일을 단일 HTML로 결합 (게시용 index.html)
cd "$(dirname "$0")"
{ cat src/doc_head.html src/head.html; cat src/config.js src/util.js src/input.js src/game.js src/phase.js src/weapons.js src/growth.js src/job.js src/select.js src/render.js src/dev.js src/main.js; printf '\n</script>\n'; } > index.html
