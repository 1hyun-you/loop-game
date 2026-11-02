#!/bin/sh
# 가상 시험 동시 실행 (0.4): 판 수를 2분할해 2개 프로세스로 실행 후 기록 병합
# 사용: sh dev/vpar.sh <총 판 수> <기록 파일> [vtest 추가 옵션...]
cd "$(dirname "$0")/.."
N=$1; OUT=$2; shift 2
H=$((N / 2)); R=$((N - H))
NODE_PATH=$(npm root -g) node dev/vtest.js $H --out "$OUT.p1" --port $((48233 + ${PB:-0})) "$@" > "$OUT.p1.log" 2>&1 &
NODE_PATH=$(npm root -g) node dev/vtest.js $R --out "$OUT.p2" --port $((48234 + ${PB:-0})) --off $H "$@" > "$OUT.p2.log" 2>&1 &
wait
cat "$OUT.p1" "$OUT.p2" > "$OUT"; rm -f "$OUT.p1" "$OUT.p2"
tail -n 2 "$OUT.p1.log" "$OUT.p2.log"; rm -f "$OUT.p1.log" "$OUT.p2.log"
