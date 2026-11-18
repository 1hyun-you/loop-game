# 회귀의 들판

모바일 세로형 탑다운 액션 웹 게임 (본 제작 0.56, 대규모 재구성 단계 — 인물 재구성 회의)

- 플레이: https://1hyun-you.github.io/field/
- 원본: `src/` → `sh build.sh`로 `index.html` 결합
- 가상 시험: `dev/vtest.js`(Playwright), 동시 실행 `sh dev/vpar.sh <판 수> <기록 파일> [--god]`, 집계 `node dev/vsum.js <기록 파일>`, 직업 균등 배정 `--jobs`, 직업별 집계 `node dev/vjob.js <기록 파일>`
- 시험 기록: `dev/sim_log/`
- 기준 문서: `CLAUDE_HANDOFF.md`(진입점) · `docs/DESIGN.md`(기획서) · `docs/DEV_SPEC.md`(개발 명세) · `REWORK_MEETING.md` · `FUSION_GUIDE.md` · `GPT_REQUESTS.md`
