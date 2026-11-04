#!/bin/sh
# 원본 파일을 단일 HTML로 결합 (게시용 index.html)
cd "$(dirname "$0")"
{ cat src/doc_head.html src/head.html; cat src/config.js src/util.js src/input.js src/game.js src/phase.js src/event.js src/boss.js src/demon.js src/story.js src/meta.js src/audio.js src/weapons.js src/growth.js src/job.js src/select.js src/sprite.js src/mobs.js src/jobplus.js src/ult.js src/arsenal.js src/dot29.js src/dot30.js src/bpat.js src/juice.js src/react.js src/guide.js src/render.js src/dev.js src/main.js; printf '\n</script>\n'; } > index.html
