# 클로드 후속 작업 전달

- ChatGPT에서 그래픽 개편 패치 `0.40-art3` 적용.
- 작업 시작 전 두 저장소의 최신 main 및 최근 커밋 확인 필요.
- 게임 원본: `1hyun-you/loop-game`.
- 실제 서비스: `1hyun-you/1hyun-you.github.io`의 `field/index.html`.
- 서비스 주소: https://1hyun-you.github.io/field/

## 반영 내용

- 기존 주인공·슬라임을 기준으로 일반 적 총 10종과 보스 5종의 손그림 판타지 화풍 구성.
- 무기 18개·보조 효과 8개의 아이콘 및 일부 대응 투사체 이미지 교체.
- 풀밭 질감과 페이즈별 색상, 새 타이틀 일러스트, 선택 카드·도감·대사창의 공통 테마 적용.
- 반전·의상 색상·피격·정예 표시·이미지 실패 시 기존 도트 대체 기능 유지.
- 게임 수치·능력 행동·저장 키 변경 없음.
- art3 추가: 늑대·곰·유령 소환수, 리안·에다·마왕 초상, 상호작용 물체와 경험치/회복 아이템, 특수 투사체와 경고·기절·수면 표식 교체.
- 현재 `SPR`에 등록된 모든 스프라이트에 손그림 또는 공통 손그림 별칭 연결 확인. 메뉴의 작은 탐색 버튼 아이콘·캔버스 글꼴은 별도 기존 체계 유지.

## 후속 패치 시 필수 확인

1. `ART_DIRECTION.md`의 화풍·색·시점·표시 크기 기준 확인.
2. `src/sprite.js`, `src/icons.js`, `src/render.js`, `src/ui37.js`의 원본 대체 렌더러 이름과 새 테마 연결 유지.
3. `src/art-data.js`, `src/art-theme.js`, `src/art3-data.js`, `src/art3-theme.js` 및 `assets/art2/`, `assets/art3/` 보존. 오래된 `index.html` 전체 덮어쓰기 금지.
4. 이미지를 수정한 경우 묶음에 맞춰 `node dev/pack-art2.cjs`, `node dev/pack-art3.cjs` 실행 후 `sh build.sh`로 통합본 생성.
5. 빌드 시 `src/art-data.js src/art-theme.js src/art3-data.js src/art3-theme.js`를 `src/main.js` 이전에 순서대로 결합할 것. `buildPixelPortraits`와 `art3LinkAliases` 연결 유지.
6. 실제 배포는 `deploy_field.sh` 방식으로 생성된 통합본을 사이트 저장소의 `field/`에 반영. 원본 저장소만 수정하면 실제 서비스에는 미반영.
7. 동시 작업 금지. 사용자에게 담당 작업 시작·배포 완료 전달 후 다음 담당자가 최신 main을 기준으로 작업.

## 검증 범위

- Chromium에서 320px·390px 모바일 크기의 화면 배치, 시작 선택 3개, 아이콘 로딩, 도감, 일시정지 및 실제 게임 틱 검수.
- 주인공·일반 적·보스 320가지 프레임/반전/피격/외곽선 조합 검수.
- 지형 14종, 아이콘 26종, 이미지 대체 처리·캐시 상한 검수.
- 실제 휴대폰별 프레임 속도나 전체 장시간 플레이를 보장하는 검증은 아님.
- art3: 신규 820가지 프레임/효과/반전 조합, 투사체 색상 변형, 스프라이트 대체 처리, 공유 이미지 4개, 초상 재생성, 320px·390px 대사창, 실제 드루이드 소환수 시뮬레이션 검수.
- 검사 명령: Playwright 설치 환경에서 `node dev/check-art3.cjs`, `node dev/check-art2.cjs`. 별도 Chromium 경로 사용 시 `ART2_CHROMIUM_PATH` 지정 가능.
- 다음 작업 후보: 메뉴 탐색 아이콘·HUD 글꼴 통일, 직업별 별도 의상, 다방향·다프레임 애니메이션. 동시에 수정하지 말고 사용자 지시 후 순차 진행.
