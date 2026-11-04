#!/bin/sh
# 0.27c 배포: 결합본·설치 정보·아이콘·글꼴을 사이트 저장소 field/ 폴더로 복사 (실제 게임 주소 1hyun-you.github.io/field/)
# 사용: sh deploy_field.sh <사이트 저장소 경로>
cd "$(dirname "$0")" && sh build.sh
D="$1/field"; rm -rf "$D"; mkdir -p "$D"
cp index.html manifest.webmanifest "$D/"; cp -r icons fonts "$D/"
