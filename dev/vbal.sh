#!/bin/sh
# 대규모 밸런스 시험 (회차 102): 인물별 N판을 2개씩 동시 실행
# 사용: JOBS="archer engineer" sh dev/vbal.sh <판 수> <기록 접두어> [vtest 추가 옵션...]
# 결과: <접두어>_<인물>.jsonl  (예: dev/sim_log/runs_0.69_archer.jsonl), JOBS 생략 시 8명 전원
cd "$(dirname "$0")/.."
N=$1; PRE=$2; shift 2
JOBS=${JOBS:-"berserker rogue archer engineer pyromancer necromancer priest druid"}
NP=$(npm root -g); port=48400; c=0
for j in $JOBS; do
  port=$((port + 1)); c=$((c + 1))
  NODE_PATH=$NP node dev/vtest.js $N --job $j --out "${PRE}_$j.jsonl" --port $port "$@" > "${PRE}_$j.log" 2>&1 &
  if [ $c -ge 2 ]; then wait; c=0; fi
done
wait
for j in $JOBS; do printf '%s ' $j; tail -n 3 "${PRE}_$j.log" | head -n 1; rm -f "${PRE}_$j.log"; done
