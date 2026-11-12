# 클로드 후속 작업 전달

## 공통 운영 기준 — 이후 모든 작업에 적용

- 대화가 길어지기 전에 검사·배포·인계까지 완료 가능한 작은 묶음으로 범위를 나눈다.
- 전체 작업량이 많으면 현재 묶음을 완료하고 추가 제작을 중단한다.
- 완료·미완료 항목, 검사 결과, 실제 배포 정보와 다음 시작 지점을 두 문서에 기록한다.
- 종료 시 새 대화로 전환하도록 권장하고, 바로 복사할 수 있는 다음 작업 요청문을 제공한다.
- 다음 대화는 두 저장소의 최신 main, ART42_PLAN.md·CLAUDE_HANDOFF.md·ART_DIRECTION.md, 실제 서비스 버전을 확인한 뒤 이 기준을 이어받는다.

## 최신 재개 지점 — 0.43 Claude 연성 재설계 (2026-11-11 한국시간)

- Claude가 0.42-art6(995bd16) 기준으로 0.43 구현. 신규 src/v43.js (build.sh에서 v42.js 다음). 0.42 연성 1차 구조(시련 → Lv 6 무기 2종 결합)는 폐지, 코드는 보존(v42.js), 화면·발동에서 미사용.
- 규칙: 무기 10종(회전검·창·철퇴·부메랑·단검·폭탄·번개·회오리 등장 제외), 무기 최고 Lv 5(Lv 3 분기·Lv 5 각성), 전직 시 상징 무기 → 기본 무기 칸(weapon.base, 슬롯 미점유), 무기 칸 무기·기본 무기 모두 Lv 5·각성 시 레벨업 연성 카드(card.t 'fuse', 1장) → weapon.fu = { job, nm } 연성 무기, 직업 시련은 2차 전직 조건.
- 직업 색 일부 조정(JOB_COL: archer·engineer·mage·summoner·druid) — 겹침 보정. 원화 색 기준도 이 값 사용.
- 임시 도형(최종본 아님): 연성 카드 틀(CSS), 직업 뼈대 보조 개체(분신·포대·망령 무장·성물·진형), 연성 순간 연출 10종, HUD 기본 무기·연성 표식. 아트 요청은 GPT_REQUESTS.md 누적 관리.
- GPT 작업 재개 시: ART42_PLAN.md 8~12번은 폐기(GPT_REQUESTS.md 폐기 표 참조). 남은 0.42 항목과 0.43 신규 항목은 GPT_REQUESTS.md 기준.

## 최신 재개 지점 — 0.42-art5 (2026-11-11 한국시간)

- 도감 적 초상 15종 적용·검사·실제 배포 완료. 문서 마지막 art5 기록 참조. 다음 묶음은 숙련 특성 아이콘만 진행.

## 이전 재개 지점 — 0.42-art3 (2026-11-11 한국시간)

- 현재 묶음: 시련 문양10종, 도감 연성 탭·내 능력 시련 행·기존 시련 완료 알림의 중앙 직업 문장. 최종 검사·배포 결과는 문서 마지막 art3 기록 우선.
- 1차 직업 문장10종·2차 전직 문장20종은 앞선 묶음 완료. 결합 문양3종과 그 밖의 아트는 미착수.
- 사용자 추가 지시: 작업량 증가 시 완료 가능한 묶음까지 검사·배포·저장하고 새 대화를 권고. 이번 묶음 후 새 대화에서 이어갈 것을 권고하며 자동으로 다음 묶음에 착수하지 않음.
- 다음 대화: 두 저장소 최신 main·ART42_PLAN.md·본 문서·서비스 source-ref/version 확인 후 결합 문양3종 등 사용자 지정 묶음만 진행.

## 새 대화 재개 요약 — 2026-11-10

- 최신 사용자 수정: 큰 choice1 선택 카드는 거부됨. choice2는 작은 카드로 바꾸고 폴드형 화면에서 전체 선택지·하단 버튼을 스크롤 없이 표시하도록 검사. 도감은 변경하지 않았음. 문서 마지막 choice2 항목 우선.

- 최신 작업: 사용자 지시로 3번 선택창 디자인 개선 0.40-choice1 구현/검증/실제 서비스 반영 완료. 1~3번 모두 완료. 아래 choice1 항목과 마지막 배포 기록을 우선.
- 범위 관리: 사용자가 작업이 너무 커지면 완료 묶음까지 저장하고 다음 대화로 인계하도록 요청. 이번에는 표시/배치에 한정해 완료했고 신규 게임 규칙·원화 제작으로 확대하지 않음.

- 최신 작업: 사용자 지시로 2번 동작·타격감 개선 0.40-motion1 구현/검증/실제 서비스 배포 완료. 아래 최신 항목 우선. 배포 확정 SHA는 서비스 field/source-ref.json 및 field/version.json 참조.
- 현재 작업 폴더는 loop-game-field/. 원격 최신 bbe3567 기반 파일을 비교 확인하고 수정. 로컬 Git HEAD는 이전 작업과 마찬가지로 오래되어 git status만으로 배포 여부 판단 금지.

- 현재 완료: scale1의 전투 화면 확대·UI 크기 조정, 이후 1번 필드/캐릭터 조화 개선과 타일 경계 보정까지 실제 배포 완료. 최종 `v0.40-field1a`.
- 다음 첫 작업: 최신 main의 ART_DIRECTION.md·본 문서·서비스 field/source-ref.json 및 field/version.json을 확인하고 사용자 후속 지시에 맞춰 재개. 폴드8 실기기 크기·대비·성능 평가는 미확인. 2번 동작/타격감, 3번 선택창의 디자인 개편은 아직 진행 지시 없음(앞서 크기 조정만 적용).
- 최신 로컬 작업 폴더: `C:/Users/PC/Documents/ChatGPT/제작 2/loop-game-field/`. 이전 `loop-game/` 폴더는 scale1 작업본이므로 혼동하지 말 것. 원본·전후 화면·검사 결과 위치는 아래 field1 항목 참조.
- 로컬 Git 주의: GitHub 연결 도구로 커밋/배포했으므로 위 로컬 폴더 HEAD는 `8b52dc513a38999c8d28b829b2e5c8534212b251`에 머물고 적용된 변경 파일들이 미커밋 상태로 남아 있음. 이 파일들이 서비스에 미반영되었다는 뜻이 아님. 원본/캡처를 보존하고 최신 원격 상태와 비교한 뒤 동기화할 것. 오래된 HEAD/index.html로 서비스 전체 덮어쓰기 금지.
- 아트/표시만 담당하며 별도 요청 없이 전투 규칙·저장 데이터는 변경하지 않음. 최종 배포 코드와 검증 범위·정확한 커밋은 문서 마지막 기록이 기준.

- 최신 패치 `0.40-field1a`: 풀·흙 바닥, 소품 4종, 접촉 그림자와 캐릭터 외곽 개선. scale1 카메라·UI와 기존 art1~art3·fx2 전투 계산 보존. 이 문서 마지막 field1 항목 우선.
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
- 현재 `SPR`에 등록된 모든 스프라이트에 손그림 또는 공통 손그림 별칭 연결 확인. ui1에서 메뉴 탐색 아이콘·HUD 공통 체계 추가. 기기 UI 글꼴 우선 표시.

## 후속 패치 시 필수 확인

1. `ART_DIRECTION.md`의 화풍·색·시점·표시 크기 기준 확인.
2. `src/sprite.js`, `src/icons.js`, `src/render.js`, `src/ui37.js`의 원본 대체 렌더러 이름과 새 테마 연결 유지.
3. `src/art-data.js`, `src/art-theme.js`, `src/art3-data.js`, `src/art3-theme.js` 및 `assets/art2/`, `assets/art3/` 보존. 오래된 `index.html` 전체 덮어쓰기 금지.
4. 이미지를 수정한 경우 묶음에 맞춰 `node dev/pack-art2.cjs`, `node dev/pack-art3.cjs` 실행 후 `sh build.sh`로 통합본 생성.
5. 빌드 시 `src/art-data.js src/art-theme.js src/art3-data.js src/art3-theme.js src/vfx.js src/ui-art.js`를 `src/main.js` 이전에 순서대로 결합할 것. `buildPixelPortraits`와 `art3LinkAliases` 연결 유지.
6. 실제 배포는 `deploy_field.sh` 방식으로 생성된 통합본을 사이트 저장소의 `field/`에 반영. 원본 저장소만 수정하면 실제 서비스에는 미반영.
7. 동시 작업 금지. 사용자에게 담당 작업 시작·배포 완료 전달 후 다음 담당자가 최신 main을 기준으로 작업.

## 검증 범위

- Chromium에서 320px·390px 모바일 크기의 화면 배치, 시작 선택 3개, 아이콘 로딩, 도감, 일시정지 및 실제 게임 틱 검수.
- 주인공·일반 적·보스 320가지 프레임/반전/피격/외곽선 조합 검수.
- 지형 14종, 아이콘 26종, 이미지 대체 처리·캐시 상한 검수.
- 실제 휴대폰별 프레임 속도나 전체 장시간 플레이를 보장하는 검증은 아님.
- art3: 신규 820가지 프레임/효과/반전 조합, 투사체 색상 변형, 스프라이트 대체 처리, 공유 이미지 4개, 초상 재생성, 320px·390px 대사창, 실제 드루이드 소환수 시뮬레이션 검수.
- 검사 명령: Playwright 설치 환경에서 `node dev/check-art3.cjs`, `node dev/check-art2.cjs`. 별도 Chromium 경로 사용 시 `ART2_CHROMIUM_PATH` 지정 가능.
- 다음 작업 후보: 직업별 별도 의상, 다방향·다프레임 애니메이션, 페이즈별 배경 소품 확대. 동시에 수정하지 말고 사용자 지시 후 순차 진행.


## 최신 추가 사항 — 공통 VFX 개편

- 베기·대상 위 칼자국·치명타·일반 타격, 화염 투사체 잔상·폭발, 낙뢰·연쇄 번개, 서리 영역·서리 강타, 처치·레벨업·회복 파편 및 이동 먼지·발사 섬광 개편.
- 새 공통 렌더러 `src/vfx.js`. `src/render.js`의 이전 `drawFx` 제거, 새 함수 사용. `drawVfxTrails`는 `drawWeapons` 직전 호출. 새 이미지 추가 없음.
- `game.js`의 `fx()`가 폭발 불티를 생성 시점에 한 번 발생시킴. 렌더 함수 내 파편 생성 복원 금지. 일시정지 화면 재그리기로 상태 변경되지 않도록 유지.
- `juice.js`의 `burst`, `sparkUp`, 피해 숫자 장식에 VFX 전용 난수 적용. `G.vfx`의 seed·WeakMap·회복 장식 쿨다운은 판 단위 시각 상태. 게임 난수와 다시 합치지 말 것.
- 파편 최대 180개·효과 최대 220개·빛 캐시 16색·투사체 잔상 최대 96개. 42 FPS 미만 48개 및 일부 장식 생략. 시스템 동작 줄이기 실시간 반영.
- `react.js` 전체 화면 섬광 불투명도 제한, 화면 흔들림은 기존 설정과 시스템 동작 줄이기 적용. 실제 피격 정지·슬로모션 계산 유지.
- 보스 경고 형태·범위·시간, 적 탄환 위험 표시, 피해·쿨다운·저장 키 유지. `weapons.js`에는 서리 강타 시각 구분용 `element` 필드만 추가.
- 새 검사: `node dev/check-vfx.cjs`; 구버전 HTML 비교 시 `VFX_BASELINE_HTML` 지정. `ART2_CHROMIUM_PATH`로 Chromium 경로 지정 가능.
- 검사 결과: 800회 생성 요청의 개수 상한, 일시정지 재그리기 상태 불변, 파편 소멸·새 판 초기화·캐시 상한·게임 난수 미소비, 폭발/부채꼴 판정·피해·밀림·회복·범위·시간·저장 키의 art3 기준 비교, 복합 무기 실시간 플레이, 동작 줄이기 및 320px/390px 검수 통과.
- `dev/vfx-validation.json`의 렌더 시간은 QA Chromium에서 공통 VFX만 반복 그린 CPU 측정. 전체 게임 FPS나 실제 휴대폰 성능으로 해석 금지.
- 후속 수정 전 이 문서와 `ART_DIRECTION.md` 확인 후 최신 main에서 시작. 두 저장소 배포 및 버전 확인 후 다음 담당자에게 인계.


## 최신 추가 사항 — 인터페이스 그래픽 개편

- 최신 버전 `0.40-ui1`: 도감·설정·돌아가기·일시정지 아이콘, 전투 HUD, 경험치·체력·보스바, 장비·전용 무기·주기 효과 슬롯, 안내 패널 통일.
- 새 `src/ui-art.js`: SVG 아이콘 내장 및 공통 렌더러. `build.sh`에서 `src/vfx.js` 다음, `src/main.js` 이전에 결합 필수.
- 원본 대체 함수 `pixelUiIcon`, `pixelDrawHUD`, `pixelDrawSlots`, `pixelDrawXpGauge`, `pixelDrawBossBar`, `pixelDrawGuide` 보존. 실제 호출은 새 `uiIcon`, `drawHUD` 등 공통 함수 사용.
- Canvas 글꼴을 기기 기본 UI 글꼴 우선으로 정리. `Galmuri11` 및 기존 폰트 파일은 글리프 대체용으로 보존. 한글 시스템 글꼴이 없는 환경에서는 Galmuri가 사용될 수 있음.
- 무기·보조 효과를 두 줄로 배치, 전용 무기와 직업 주기를 우측 영역으로 분리. HUD 최대 폭 560px. 작은 화면에서 긴 직업명 말줄임, 드루이드·사제 수치 우선 표시. 큰 처치 수는 만 단위 축약.
- `main.js`의 일시정지 버튼에 아이콘 이미지 사용. aria-label 유지, 최소 44px 터치 영역 확보. 안내 패널 줄바꿈 적용.
- 기존 art1~art3, VFX, 저장 키와 게임 수치 유지. 주인공·정예·대장 체력바의 색·외곽 표현만 변경.
- 검사: `node dev/check-ui.cjs`, `node dev/check-vfx.cjs`, 기존 `check-art2.cjs`/`check-art3.cjs`. 결과는 `dev/ui-validation.json` 등 참조. `ART2_CHROMIUM_PATH`로 Chromium 지정 가능.
- 테스트 범위: 280~1366px 슬롯 무겹침·경계, 안전 영역, 10개 직업/전용 무기 2단계, HUD 상태 불변, 실제 전투·일시정지, 안내 줄바꿈, 기존 스프라이트/VFX 회귀 검사. 휴대폰별 실제 글꼴과 장시간 성능 보장은 아님.
- 다음 담당자는 최신 main에서 시작하여 `sh build.sh` 후 서비스 저장소 `field/index.html`까지 배포 및 버전 확인 필요.

## 최신 패치 — 0.40-fx2

- 폴드 사용자 요청: 전투 화면을 덜 가리는 HUD, 일시정지와 처치 표시 분리, 단순 원 도형만 남은 무기·효과의 원화 적용.
- HUD 높이 142px → 68px. 불투명한 대형 패널과 빈 장비칸 표시 제거. 보유 무기·보조 효과만 작은 두 줄로 표시. 체력·레벨·시간·처치·페이즈 및 직업 자원 유지. 직업 상세 이름과 장비 상세는 일시정지 화면에서 확인.
- `hudLayout()`이 Canvas HUD와 DOM 일시정지 버튼의 공통 기준. 우측 44×44px 버튼 영역 및 처치 표시와 8px 간격 확보. 화면 회전·접힘으로 폭이 바뀌면 같은 VIEW 좌표로 재계산. 280~1366 CSS px, 안전영역 0/28px 검사. 실제 폴드8 기기 검증은 아님.
- 사용자가 제공한 시트의 모바일용 원화: assets/effects/atlas.webp (384px, 셀 96px, 약 44KB). 고해상도 원본은 별도 전달 파일에 보관. 투명 배경을 유지한 WebP와 내장 데이터 제공. 원화를 다시 생성할 필요 없이 후속 수정 가능.
- `src/effect-art.js`: 원화 슬라이스·낮은 불투명도·반경 내 클리핑·화면 밖 생략. 프레임당 원화 스탬프 96회, 낮은 FPS/동작 줄이기 48회 상한. `render()`에서 표시 예산 초기화. 게임 난수·피해 판정 변경 없음. 이미지 로딩 실패 시 기존 원형/선 렌더링으로 대체.
- 적용: 아군 장판, 냉기 고리·파동·파쇄, 화염·폭발, 회오리, 광선 끝 장식·기존 손그림 광선, 플레이어/정예 보호막, 빙결, 직업 문양, 회복, 상자·제단 장식, 되감기, 시간 단절, 궁극기 방벽·광폭화·소환·동료 강화·군기. 궁극기 칼날은 기존 손그림 단검, 거대 포탑은 기존 포탑 원화 사용.
- 정확한 위험 범위·피해 예고·재사용 대기시간을 전달하는 얇은 경계선과 진행 표시는 유지. 보스의 적색 공격 예고를 임의의 원화로 덮지 않음. 기존 캐릭터·무기 손그림·세이브 키·밸런스 보존.
- 빌드 순서: `src/vfx.js src/effect-data.js src/effect-art.js src/ui-art.js src/main.js`. `build.sh`의 순서가 기준. `node dev/build.cjs`는 Windows에서도 같은 순서로 통합본 생성.
- 원화 수정 후 node dev/pack-effects.cjs 로 내장 데이터를 갱신하고 (새 고해상도 시트 변환 시 파일 경로를 인수로 전달, sharp 필요), 이어서 `node dev/build.cjs` 또는 `sh build.sh`. art2/art3를 수정할 때는 기존 pack 명령도 유지. 이미지 데이터가 HTML에 내장되어 별도 에셋 요청 없이 서비스 가능.
- 검사: `node dev/check-fx2.cjs`, `node dev/check-ui.cjs`, `node dev/check-vfx.cjs`, `node dev/check-art2.cjs`, `node dev/check-art3.cjs` (Playwright 필요). `ART2_CHROMIUM_PATH`로 브라우저 경로 지정 가능. VFX는 `VFX_BASELINE_HTML` 지정 시 이전 ui1과 공격 피해·밀림·회복·범위·지속시간·저장 키 비교. 새 회복 장식은 비교 대상 공격 형상에서 제외.
- 이번 검증: 10개 직업·20개 2차 전직 렌더링, 320/390/412/690px 및 가로 화면 버튼 위치, 실제 혼합 무기 전투와 일시정지, 원화 누락 대체·동작 줄이기, 기존 320/820가지 스프라이트 조합 검사. Chromium 자동 검사이며 실제 휴대폰의 장시간 FPS·최종 사용자 평가는 별도.
- 원본 저장소 패치만으로 서비스가 바뀌지 않음. 서비스 저장소 `1hyun-you/1hyun-you.github.io`의 `field/index.html`에도 빌드 결과 반영 후 실제 URL 버전 확인 필요. 다음 담당자는 두 저장소 최신 main을 받고 동시 작업을 피할 것.

## 승인된 자동 빌드·배포

- 사용자가 두 저장소 main에 자동 빌드 결과를 저장하는 기능의 추가를 승인함.
- 게임 저장소: .github/workflows/build-game.yml 이 main의 게임 소스·빌드 코드 변경 시 node dev/build.cjs 및 node dev/check-build.cjs 실행 후 index.html을 자동 커밋.
- 서비스 저장소: .github/workflows/build-field.yml 이 field/source-ref.json의 정확한 소스 커밋을 받아 같은 빌드를 실행하고 field/index.html을 자동 커밋. 다음 패치 배포 시 source-ref.json의 commit을 새 게임 소스 커밋으로 변경.
- GitHub Actions 자체 토큰의 커밋은 Pages 빌드를 자동 유발하지 않으므로, 사이트 빌드 성공 후 연결된 GitHub 도구로 field/version.json의 버전을 갱신하여 Pages 게시를 유발하고 실제 URL 버전까지 확인할 것.
- 각 워크플로의 contents:write는 자기 저장소에만 적용. 별도 개인 토큰 불필요.

## 최신 인계 — 0.40-scale1 (2026-11-10)

- 목표·승인: 폴드에서 전체 요소가 작다는 사용자 의견에 따라 권장안인 전투 화면 확대 + UI 별도 크기 조정 적용. 확정 손그림 화풍과 금발·파란 의상 기준 유지. 그림 재제작·배경 소품 확대·추가 애니메이션은 이번 범위 아님.
- 완료 구현: `input.js`에 짧은 화면 변 기준 `battleZoom`과 `cameraW/H` 추가. `render.js` 카메라 중심·지형·그리기 범위 연결. `effect-art.js`, `vfx.js`, `juice.js`의 화면 밖 장식 생략은 새 카메라 범위 사용.
- 반드시 보존: `VIEW.w/h`는 구버전 논리 시야 크기. 적 출현·재배치·보스 복귀·시야 기준 궁극기 계산에 사용하므로 카메라 범위로 대체하지 말 것. 배율만 바꿔도 이 계산이 달라지는 문제를 피하기 위해 분리함.
- UI: `ui-art.js` 글자·장비 아이콘·레벨 표식·보스바·안내·선택 카드·대사·능력 설명 확대. HUD 95~111px, 최대 폭 600px, 빈 슬롯 미표시 유지. `main.js`의 버튼 위치·크기는 공통 hudLayout 기준. 일시정지 48px, 처치 표시와 8px 간격. `phase.js` 목표 방향 표시는 새 HUD 아래로 이동.
- 카메라 예: 390×844는 0.975 → 1.4, 690×829는 1.6 → 2.05. 가로처럼 높이가 작은 화면에서는 높이에 맞춰 배율 제한. 터치 기기의 기존 세로 전용 회전 안내 유지.
- 저장 위치: 게임 저장소 main의 이 패치 커밋과 자동 생성 `index.html`; 실제 서비스 저장소 `field/source-ref.json`이 정확한 게임 커밋을 가리키며 `field/version.json`에 소스·서비스 빌드 커밋 기록. 이 문서 자체의 커밋 SHA를 본문에 자기 참조로 넣지 않음.
- 검사: 280/320/390/412/690/768/1366px와 좁음→넓음→좁음 변경, 안전영역, 장비·일시정지 무겹침, 중심 정렬, 카드 가독성·가로 넘침, 혼합 무기 실제 틱, 일시정지·재개, 동작 줄이기. 기존 VFX 검사로 fx2 대비 공격 피해·밀림·회복·범위·지속시간·저장 키 일치 확인. 신규 scale 검사는 기존 적 출현 거리·시야 기준 궁극기 반경도 비교.
- 확인 한계: Chromium 자동 검사와 화면 이미지 검토. 실제 폴드8 접힘 이벤트·장시간 FPS·사용자 체감 크기는 미확인. 가로는 회전 안내와 내부 좌표 검증이며 플레이 검증 아님.
- 검사 경로: `dev/check-scale.cjs`, `dev/scale-validation.json` 및 기존 UI/효과/스프라이트 검사·결과. 비교용 이전 통합본은 담당자 로컬 `../baseline-fx2.html`; 재현 시 이전 fx2 커밋의 index.html 사용. 테스트 화면은 로컬 `dev/scale/`에 보관, Git에서는 제외.
- 다음 첫 작업: 두 저장소 main·`field/source-ref.json`·실제 서비스 `v0.40-scale1` 확인 후 폴드8에서 접은 화면과 펼친 화면의 체감 크기 피드백 확인. 크기 확정 후 필드 지형·그림자·실루엣 개선 여부를 사용자와 정할 것.

- 배포 완료 확인: 소스 `961b6657652f74d57a3e81ea616b68a18f2c8d49`, 서비스 빌드 `7a435bb07c4fa7a1cc6a7913467cd26f0fc1bf5d`, 게시 `00623c484fd85a1cef2417887442c05372a22b77`. 서비스 Pages 게시 성공 및 실제 URL의 `v0.40-scale1` 확인. 실제 서비스에서 출발 무기 선택·전투·레벨업 선택·재시작·일시정지·재개, 390↔690px 폭 변경 확인. 실제 폴드8 실기기 확인은 아님.

## 최신 인계 — 0.40-field1 (2026-11-10)

- 목표·확정 방향: 사용자가 승인한 첫 번째 아트 개선안(필드와 캐릭터의 조화). 기존 손그림 판타지 시점·조명·주인공의 금발/파란 의상 유지. 동작·타격 타이밍과 선택창 재디자인은 이번 범위 아님. scale1의 확대 설정 유지.
- 완료 구현: 새 풀·흙 바닥과 풀/돌/마른풀/들꽃 소품 4종, 부드러운 큰 색 덩어리, 주인공·적 접촉 그림자, 일반 상태 캐릭터의 자주색 외곽 보강. 소품은 바닥 장식으로 충돌·보상 없음. 게임 로직·데이터·저장 키 변경 없음.
- 파일: `assets/field1/{meadow.webp,props.webp,manifest.json,prompts.json,ground-revision.txt}`, `src/field-data.js`, `src/field-art.js`, `dev/pack-field.cjs`, `dev/check-field.cjs`. 연결 수정은 build.sh, art-theme.js, render.js, sprite.js, 버전 config.js. 기존 이미지 모두 보존.
- 원본 위치: 담당자 작업 폴더 `C:/Users/PC/Documents/ChatGPT/제작 2/art-originals/field1/`. 최종 PNG 2종과 생성 기록 전달본 `C:/Users/PC/Documents/ChatGPT/제작 2/outputs/field1_아트원본_제작기록.zip`. Git에는 배포용 WebP와 내장 데이터·원본 해시·프롬프트 보관. 임시 생성 폴더에만 원본을 두지 않음.
- 빌드: field-data/field-art를 ui-art 다음, main 이전에 결합. 새 원본 변환 시 `node dev/pack-field.cjs <ground.png> <props.png>`(sharp 필요). 최적화본에서 내장 데이터만 다시 묶을 때는 인수 없이 pack, 이어서 `node dev/build.cjs`.
- 필수 보존: `VIEW.w/h`와 cameraW/H 분리. 장식 배치는 좌표 해시만 사용하고 게임 난수·G 객체를 변경하지 않음. 바닥 장식은 보스/적의 공격 예고보다 먼저 그려야 함. 최대 소품 36회, 색 덩어리 캐시 4개, 바닥 캐시 16개. 어두운 지형은 돌만 낮은 불투명도로 표시.
- 검증: 신규 field 검사에서 실제 알파·반복 동일성·그리기 상태 복원·게임 난수 미사용·G 불변·위험 예고 아래 배치·14개 지형/전환·원화 누락 대체·캐릭터 안전 여백·혼합 전투·일시정지·동작 줄이기 확인. 기존 art2 320조합, art3 820조합, fx2의 10직업/20전직, scale의 280~1366px와 폭 변경, vfx의 scale1 대비 피해/밀림/회복/범위/시간/저장 키 비교 유지. 결과는 dev/*-validation.json.
- 비교·화면: 이전 통합본 로컬 `../baseline-scale1.html`. 전후 및 화면 폭별 캡처는 로컬 dev/field1/, Git에서 제외. 전체 판 재현·실기기 FPS를 보장하는 검사는 아님.
- 소스/배포 위치: 게임 저장소 main의 field1 패치, 서비스 field/source-ref.json의 정확한 소스 SHA와 field/version.json의 빌드/게시 기록을 기준으로 확인. 실제 URL https://1hyun-you.github.io/field/ 에서 v0.40-field1 확인 필요.
- 남은 확인·다음 첫 작업: 실제 폴드8에서 크기·풀밭 대비·소품 밀도·장시간 성능에 대한 사용자 평가. 다음 담당자는 두 저장소와 위 버전 기록부터 읽고, 2번 동작/타격감 또는 3번 선택창 디자인은 새 사용자 지시가 있을 때 진행.

- 최종 보정 0.40-field1a: 실제 서비스 검토에서 보인 반복 타일 경계를 캐시 생성 시 양쪽 16px의 색을 연결하여 정리. 원화는 유지하며 매 프레임 이미지 처리는 하지 않음. 신규 검사로 바닥의 마주 보는 경계 픽셀 일치를 확인. 실제 서비스 최종 확인 버전은 v0.40-field1a.

- 최종 배포 확인: 실제 서비스 `v0.40-field1a`, 소스 `8b485499b96bb99ba39332c30bb03fc8fce3c1ed`, 서비스 빌드 `d801a70bd6d4e9d7048b600ab14f27aa7ff995d4`, 게시 `4183202da881c4dc7e8a67f5081e54c0722a73b2`. Pages 게시 성공 확인. 실제 서비스의 시작·무기 선택·전투·일시정지·재개 및 390↔690px 변경 확인. 최종 화면 기록은 로컬 dev/field1/live-final-390.jpg, live-final-690.jpg. 폴드8 실기기 검증 아님.

## 동작·타격감 개선 — 0.40-motion1 (2026-11-10)

- 사용자 지시: 1번 필드 개선 완료에 이어 2번 동작·타격감 개선 진행.
- 기존 원화를 사용한 표시 동작 보강. 실제 이동 거리에 따른 2프레임 전환, 발밑 기준의 작은 들썩임·기울기·탄성, 정지 시 호흡 표현. 슬라임/젤리의 탄성과 무거운 적·보스의 낮은 움직임 강도를 구분. 별도의 다방향 원화나 새 4~8프레임 시트 제작은 아님.
- 근접·원거리·마법의 발동 순간 반동과 복귀 동작 구분. 실제 생성된 베기/투사체 방향 우선 사용. 동시 무기의 몸체 반동은 95ms 간격으로 제한. 기존 공격 시간·피해·쿨다운 변경 없음.
- 확정 피격에만 방향성 반동과 작은 접촉 불티 표시. 치명타는 짧은 불티 두 줄 추가. 보스 피격 변위는 일반 적의 35%. 준비·돌진은 몸체 자세만 바꾸고 바닥 경고·위험 범위는 유지.
- src/motion.js를 field-art.js 다음, main.js 이전에 결합. updatePlayer/updateEnemies/rcFire/jHit의 원래 함수를 호출한 뒤 표시 상태만 관찰. MOTION 외부 WeakMap에 보관하고 새 G에서 초기화. 그림 함수에서 시간 진행·게임 객체 쓰기·게임 난수 소비 금지.
- render.js의 주인공 _lx/_ly/_fl 쓰기를 제거하여 화면을 다시 그려도 걷기 프레임이 달라지지 않음. 그림자·체력바·판정 중심은 기존 월드 좌표 유지. 정예 외곽과 본체에 같은 변환 적용.
- 시스템 동작 줄이기에서는 추가 몸체 변형·접촉 불티 생략. 기존 피격 식별과 위험 예고는 유지. 새 외부 이미지 요청·이미지 캐시 없음.
- 검증: dev/check-motion.cjs (MOTION_BASELINE_HTML에 field1a 통합본 필수). 360틱 고정 시드 비교에서 위치·체력·피해·무기 타이머·적 AI·투사체·통계·저장 키·게임 난수 206회 일치. 방향성 피격, 3계열 반동, 정지/빙결/재배치/새 판, 일시정지 재그리기 불변, Canvas 상태 복원, 보스 5종의 걷기/준비/돌진/피격과 경고 데이터 보존 확인.
- 기존 check-field/check-scale/check-ui/check-fx2/check-vfx/check-art2/check-art3 통과. 320/390/690px 전투 화면과 280~1366px 기존 UI 검사, 320/820 스프라이트 조합 유지. 검사 결과 dev/*-validation.json, 동작 화면 dev/motion1/ (Git 제외).
- 한계: 자동 Chromium 및 정지 화면 검토. 실제 폴드8의 체감 타격감·장시간 FPS 미확인. 360틱 비교는 해당 고정 시드/장비 조건에 한정하며 모든 판의 완전 동일성을 보장하는 검사는 아님.
- 다음 항목은 3번 선택창 디자인 개편. 실제 기기 피드백을 반영하고 사용자 후속 지시에 따라 진행.

- 최종 배포 완료: 실제 서비스 v0.40-motion1. 게임 소스 0707d1b35dd4a82720405fa12a1066d3e073fb68, 게임 자동 빌드 cb761b87c967b59ab0b3c5d5b0f77750df85448f, 서비스 빌드 96b247035a8a61eb36ef732eb7fcebc1b9460c50, 게시 356085965ebea2371815dd6c59145dce1264fb46. Pages 실행 42764096670 성공 확인.
- 실제 URL에서 시작 대사·출발 무기 선택·포인터 이동과 MOTION 추적·일시정지/재개·390→690→390px 폭 변경·동작 줄이기 확인. 런타임 오류 없음. 재검사 dev/verify-live-motion.cjs, 결과 dev/motion-live-validation.json. 화면은 로컬 dev/motion1/live-*.png. 폴드8 실기기 확인은 아님.

## 선택창 디자인 개선 — 0.40-choice1 (2026-11-10)

- 사용자 승인: 3번 선택창 디자인 개선 진행. 작업이 과도하게 커질 경우 완료한 묶음까지 저장하고 다음 대화 재개 지점을 기록하도록 요청. 이번 범위는 선택창의 표시와 배치로 제한하여 구현/검증 완료.
- 기존 손그림 무기·능력 아이콘을 큰 장비 카드로 구성. 원화 신규 생성 없음. 어두운 녹청/청회색 바탕, 금빛 제목, 종류별 색 테두리와 분류명, 번호, 이름·강화 표식·효과 설명·선택 표시 순서 적용. 배경은 불투명하여 전투 HUD가 비치지 않음.
- 직업·분기·긴 설명 카드는 그림/제목 아래로 설명을 전체 폭에 펼침. 문장 생략·말줄임 없음. 좁은 화면은 기존 세로 스크롤 유지. 600px 이상에서는 카드 폭 최대 640px와 큰 원화 사용. 직업/유물 등 고유 원화가 없는 항목은 기존 공통 SVG 기호 사용(직업 고유 원화로 오인하지 말 것).
- src/select-art.js에서 choiceHeading/choiceCard/choiceIcon/choiceType와 선택창 전용 CSS 제공. build.sh에서 motion.js 다음, main.js 이전에 결합. select.js의 renderSelect0 마크업만 연결. cardInfo, 후보 생성/확률/순서, pickCard, 강화 효과, 저장 키 변경 없음.
- 기존 두 번 누르기 확정·전직 필수 2회 확인·제외 불가 항목·봉헌·내 능력·도감·다시 뽑기·스크롤 복원 유지. 확정 대기 카드에 금빛 테두리와 확인 문구, 안내 문장에 polite 상태 알림. 장식은 aria-hidden. 동작 줄이기 설정에서 카드 움직임 생략.
- 검증: dev/check-choice.cjs (CHOICE_BASELINE_HTML에 motion1 통합본). 출발/레벨업/분기/각성/전직/2차전직/유물상자/유대/야영지/봉인문/보충선택/봉헌 12상황의 후보·설명·플레이어 상태를 motion1과 비교. 다시 뽑기/제외의 후보 순서·횟수·게임 난수 동일. 렌더링 시 후보·수치·게임 난수 변경 없음.
- 선택창 280/320/390/412/690/768/844px에서 글자 최소 15px·그림 로딩·가로 넘침·터치 크기 검사. 실제 클릭으로 확정 대기 전환/두 번째 확정, 전직, 제외 불가, 내 능력/도감 접근, 200px 스크롤 재그리기 유지, 동작 줄이기 통과.
- 관련 회귀 검사: check-art2 (320조합과 출발 카드·전투), check-scale (280~1366px), check-ui, check-motion (기존 360틱 고정 시드 전투 동등성·보스 동작). 결과 dev/choice-validation.json 및 각 validation.json.
- 이전 통합본: 로컬 ../baseline-motion1.html. 전후/화면폭별 캡처: 로컬 dev/choice1/ (Git 제외). 실제 폴드8의 글꼴·터치 체감·장시간 성능은 미확인.
- 다음 담당자: 실제 배포 버전과 이 문서 마지막 게시 기록부터 확인. 1번 필드, 2번 동작/타격감, 3번 선택창의 세 묶음을 완료했으므로 추가 제작은 사용자 피드백/새 지시에 따라 범위를 정할 것.

- 최종 실제 서비스 확인: v0.40-choice1, 소스 8d3fcb1f9a92b3f9a43718a90d547ec491922000, 게임 자동 빌드 a843896528c494d693695e9d6d9f8528623eeac6, 서비스 빌드 9fb5f6a7bacfb17e9cb4844c776d6f0bdc31c007, 게시 요청 8133fb5c13f8a5012868947f07109c0c9de9cd2d. 실제 URL에서 원화 로딩·첫 탭 확정 대기·두 번째 탭 선택·320/390/690px 카드 폭·전투 진입/이동·일시정지/재개·동작 줄이기 확인. 브라우저 오류 없음. 서비스 빌드 Pages 42765694833 성공, 최종 게시 Pages 42765750721 성공 확인.
- 재검사: dev/verify-live-choice.cjs. 실제 서비스 결과 dev/choice-live-validation.json, 화면은 로컬 dev/choice1/live-*.png. 이번 요청의 3번 구현/검증/실제 서비스 반영까지 완료. 중단된 구현 묶음 없음. 새 대화에서는 두 저장소 최신 main과 source-ref/version부터 확인하고 사용자 피드백을 이어받으면 됨.

## 사용자 수정 — 0.40-choice2 (2026-11-10)

- 사용자 평가: choice1 선택 카드가 너무 커 폴드8에서 아래로 스크롤해야 하므로 거부. 사용자는 도감 쪽 변경으로 이해했으나 해당 작업은 무기/능력 선택창이었음. 이번 수정은 선택창만, 도감 미변경.
- 최신 우선 기준: 폴드의 접은/펼친 화면을 고려하여 모든 선택지와 하단 행동 버튼을 한 화면에서 비교/조작. 큰 원화·번호·분류명 반복·장식 문구·카드별 선택 푸터를 숨기고 그림 38~48px, 제목 16~18px, 본문 기본 14px, 간결한 세로 카드로 조정.
- 문장/효과 설명 생략 없음. 긴 직업/분기 설명은 카드 전체 폭 사용. 화면 여유가 부족할 때 본문을 14→12px 범위에서 조절. 작은 280/320px·짧은 가로 화면의 긴 직업 설명은 내용 유실을 막는 스크롤 대체가 남아 있으며 모든 해상도에서 무스크롤을 보장한다고 표현하지 말 것. 기존 가로 플레이 미지원 유지.
- 실제 카드와 하단 버튼의 경계·글자 잘림·세로 스크롤을 검사하도록 기준 보강. 390×844와 690×829에서 가장 긴 직업 설명 3개와 하단 버튼까지 표시, 상하 안전 여백 0/28px 모두 세로 스크롤 없음·본문 14px 확인. 360×740 및 기존 412/768px 대표 후보도 화면 내 표시 검사 통과.
- fitChoices는 선택창 생성과 화면 크기 변경 시만 높이를 측정하며, 작은 화면 대체 경로의 스크롤 위치도 보존. 후보 생성/확률/효과/저장 키/두 번 확정 규칙 유지.
- 검증: check-choice.cjs의 12상황 내용 동등성, 다시 뽑기/제외/전직/내 능력/도감/확정 및 게임 난수 보존, 화면 경계 및 가장 긴 3직업 검사 통과. check-art2.cjs의 320 스프라이트 조합·시작 선택·실제 전투·일시정지 통과. check-build.cjs 통과. check-scale.cjs의 카드 그림/글자 크기 기대값은 현재의 작은 카드에 맞춰 갱신.
- 화면: 로컬 dev/choice2/, 비교본 ../baseline-choice1.html. 상세 검사 dev/choice-validation.json. 실제 폴드8 실기기를 조작한 검사는 아니므로 사용자 체감 확인이 필요.
- 다음 대화에서는 choice1의 큰 카드 방향을 다시 적용하지 말 것. 도감 개편은 아직 하지 않았으며 사용자의 후속 지시에 따라 별도 범위를 정할 것.

- choice2 실제 서비스 확인: v0.40-choice2. 소스 f9db249f5b73192f7b5f4806e7e105eeef644478, 게임 자동 빌드 7a4ab2c837b8a7a7b2c1de0ee4c07aecd703ae04, 서비스 빌드 05d5d2545e7e34651aeac20fcb92899219d68e66, 게시 ebfb972bb4d52ab635a1a59a29d44224ee8fe652. 실제 URL에서 320/390/690px 출발 선택지 전체와 무스크롤, 두 번 확정, 선택 후 이동/전투, 일시정지/재개·폭 변경·동작 줄이기 확인. 실제 폴드8 하드웨어 검사는 아님.
- 실제 서비스 검사: dev/verify-live-choice.cjs 및 dev/choice-live-validation.json. 화면 dev/choice2/live-choice-390.png, live-choice-690.png. 과대한 choice1은 사용자 거부 기준으로 남기고 이후 작업은 작은 한 화면 비교를 우선.


## 0.42 아트 분할 작업 — art1 (2026-11-11 한국시간)

- 사용자 요청: 전체를 한 대화에서 진행하지 않고 작은 묶음별 검사·GitHub 반영·배포·인계 후 종료. 전체 후속 범위와 고정 조건은 ART42_PLAN.md에 보관. 이후 요청문 재전달 없이 이 문서부터 재개.
- 1차 범위: 10직업 문장을 기존 UI SVG 체계로 제작하여 1차 전직 선택창·도감 직업 탭에 적용. 등록명 crest_warrior/rogue/sovereign/archer/engineer/chrono/mage/summoner/priest/druid. 대검·수리검·왕관 방패·활·기어 덫·모래시계·화염 구체·망령·신성 구체·잎/뿌리로 형태 구분. 기존 JOB_COL 팔레트 유지.
- 파일: src/ui-art.js(원화·내장·실패 대체), src/select-art.js(choiceIcon 1차만), src/codex.js(cxCard/cxJob), src/config.js(0.42-art1), dev/check-crests.cjs, .github/workflows/check-art42.yml, .gitignore, ART42_PLAN.md. 게임 규칙·수치·저장 키·후보·확정 동작 변경 없음. build.sh 순서 미변경.
- 미착수: 2차 문장 20종·시련·연성·기타 아이콘·설치물·소환물·상태·예고·외형 전체. 2차 선택은 공통 문장 유지. 현재 패치는 생성형 손그림 원화 제작이 아닌 기존 UI 전용 SVG 확장.
- 로컬 build/check-build 통과. Chromium은 socket() Operation not permitted로 실행 불가. 검증용 art/042-crests 브랜치의 GitHub Actions에서 check-crests/choice/ui/art2와 vtest 2판 검증. 검사·배포 최종 결과는 아래 후속 기록 참조.
- 다음 묶음: ART42_PLAN.md 2번을 우선 더 작은 범위로 분할(2차 문장과 시련·연성 문양을 각각 분리 가능). 작은 choice2 카드와 한 화면 비교 우선.

## 0.42-art1 최종 배포·검사 기록

- 실제 서비스 https://1hyun-you.github.io/field/ 버전 0.42-art1 확인. 검증 소스 abf8f8669ebef6af4b9b9b48cba5b0262570ce17, 게임 자동 HTML 빌드 1cd3af1a046fb30e32ce71254374797ecfd4d431, 서비스 source-ref 반영 98507c70aca4955896646339537960859f64b8af, 서비스 빌드 d4af9bb4c68076c725698d79503f68c7fb03fb69, 버전 기록 67c6454c99650a9048d40cf735cea8e82959bee8.
- 서비스 build-field 실행 42916568256 성공, 해당 HTML Pages 실행 42916595910 성공. 실제 응답 HTML은 검사한 소스에서 생성한 빌드와 바이트 일치. SHA256 e14ab9de21fbaefcc8f84aa00e863166225c45ecf1e120ee33d4ef88f793118a.
- 검증 브랜치 art/042-crests, 실행 https://github.com/1hyun-you/loop-game/actions/runs/42916068318 전체 성공. 문장 23항목·선택창 78항목·HUD 12항목·기존 원화 11항목, vtest 2판(각 최대120초) 오류0·페이지 오류0·저장 유지. 320/390/690px 문장·선택·도감 화면 검토. 실제 폴드8·장시간 FPS 미검증.
- 검사 파일 보정: check-ui의 기존 아이콘9개 고정 대기를 실제 UI_PATH 개수로 변경. 0.42의 기본4배속·자동선택이 정지 화면 시험에 간섭하므로 HUD/원화 시험에서만 1배속·수동선택 지정, HUD 시험에서만 레벨업 억제. 실제 게임 규칙 변경 없음.
- 결과 dev/crests-validation.json, choice-validation.json, ui-validation.json, art2-validation.json, art42-validation.json. 화면·가상시험 원본은 Actions artifact 13808808427 (2027-02-08 만료 예정). 로컬 /workspace/scratch/f16aa2f25838/art42-final/에도 보관. 이 기록 커밋은 문서·검사결과만 변경하며 배포 소스 SHA와 구분.
- 남은 범위: 2차 문장20종·시련10종·결합3종·연성/HUD·기타 화면 아이콘·설치물·소환물·상태·예고·직업외형 전체. 다음 대화에서는 2차 문장20종만 먼저 진행. SVG UI 아이콘 외의 손그림 원화는 이미지 생성 기능 사용. 동시 작업 전 최신 main 확인.

## 0.42-art2 — 2차 전직 문장20종

- 사용자 지시: 최신 main의 ART42_PLAN.md·본 문서 확인 후 2차 전직 문장20종만 진행하고 검사·배포·인계 후 종료. 시작 main 5e70057102447d7ab484a464d4ffddab121ff017, 서비스 main 67c6454c99650a9048d40cf735cea8e82959bee8, 기존 배포 0.42-art1 확인.
- 기존 UI SVG 문장 확장. 1차 직업 문장을 축소 계승하고 분기별 실루엣 추가. 기존 JOB_COL 보존. 등록명 crest_2차직업k. UI_JOB2_CREST에서 부모 직업 확인. 외부 이미지 요청·프레임 갱신 없음.
- 전사 광전사(격노)/수호기사(방패), 도적 암살자(단검)/그림자 무희(분신 궤적), 군주 정복왕(군기)/성군(회복), 궁수 저격수(조준)/사냥꾼(매), 기술자 포병(포탄)/기계공(보행 포탑), 시간술사 가속자(가속)/역행자(역행), 마법사 원소술사(원소)/대마법사(마도서), 소환사 사령술사(망자)/망령 군주(거대 망령), 사제 심판관(심판 망치)/성자(성광), 드루이드 수호 곰(곰)/무리의 우두머리(늑대).
- 공통 숙련(veteran)은 기존 공통 문장 유지. 이미지 디코딩 실패 시 부모 직업 글자 표시. 도감의 기존 설명·궁극기 줄 구분 유지. 도감 CSS가 숨김 span을 표시하는 문제를 화면 검수에서 발견하여 새 문장의 대체 글자를 i 요소로 보정, 실제 computed display 검사 추가.
- 변경 파일: src/ui-art.js, src/select-art.js, src/codex.js, src/config.js, dev/check-crests.cjs, dev/check-job2-crests.cjs, .github/workflows/check-art42.yml. 작업 계획·인계·검사 결과는 별도 기록 커밋. 게임 규칙·수치·판정·저장 키·후보·2회 확정 동작·build.sh 순서 변경 없음.
- 로컬 build/check-build 통과. 로컬 Chromium은 socket() Operation not permitted로 실행 불가하여 GitHub Actions에서 브라우저 검사. 48/38/24px 비교판 및 320/390/690px 선택·도감 화면 검토. 실기기 폴드8·장시간 FPS 미검증.
- 시련10종·결합3종·전투 발밑 문양·기타 후속 항목 미착수. 다음 담당자는 두 저장소 최신 main부터 확인. 요청 전체 재전달 불필요.

### art2 최종 검사·배포 완료

- 실제 서비스 https://1hyun-you.github.io/field/ 버전 0.42-art2 확인. 검증 소스 396e1bca5c497dce423c7758b463a31a1996ce7a, 게임 자동 HTML 빌드 d046d63dbc52a13ccb0caf93b22f8047a17f9479.
- 서비스 source-ref 반영 d1ac4574301c34f9c515f5d552f5c65c18730c56, 서비스 HTML 빌드 f2ab1b040f3bad670384a65be7ef824def97cb66, 버전 기록 be48788c1be8ffe3ccb90299a325ba626f47111d. build-field 실행 42922039068 성공, 최종 Pages 실행 42922135861의 build/deploy/report 모두 성공.
- 검증 브랜치 art/042-job2-crests, Actions https://github.com/1hyun-you/loop-game/actions/runs/42921673612 전체 성공. 2차 문장113항목·기존 문장23항목·선택창78항목·HUD12항목·기존 원화11항목 통과. 가상 플레이2판(각 최대120초) 오류0·페이지 오류0·저장 유지.
- 20종의 부모 문장·색·고유 형태, 총30개 선택지/설명의 art1 대비 일치, 게임 상태/저장/난수 불변, 20분기의 첫 탭 대기/두 번째 탭 전직, 320/390/690px 선택·도감 가로 넘침, 이미지 성공 시 대체 글자 실제 숨김 및20종 실패 시 글자 복원, 숙련/부모 불일치 공통 문장, 동작 줄이기 확인.
- 실제 응답 HTML과 검증 소스의 빌드가 바이트 일치. SHA256 edadbf1aeef4c1e028e703250408663355032ed350c6286437d128d12e22fb56. 실제 version.json의 버전·소스·빌드 일치 확인. 브라우저 상호작용 검사는 검증 소스에서 실행했고 실제 서비스는 동일 HTML/버전 응답으로 검증. 실제 폴드8·장시간 FPS 미검증.
- 결과 dev/job2-crests-validation.json, crests-validation.json, choice-validation.json, ui-validation.json, art2-validation.json, art42-validation.json. 화면·가상시험 원본 Actions artifact 13812047293 (2027-02-08 만료 예정), 로컬 /workspace/scratch/dca915f4a032/job2-final/. art42-validation.json은 이번에 실행한 검사만 요약하며 기타 과거 validation 파일을 새 검사 결과로 해석하지 말 것.
- 이번 묶음 완료·종료. 다음 범위는 시련10종·결합3종 중 사용자 지정 묶음. 전투 발밑 문양·연성·나머지 아트까지 자동 확장하지 말 것. 기록 커밋은 문서·검사결과만 변경하며 배포 소스 SHA와 구분.

## 0.42-art3 — 시련 문양10종

- 사용자 지시: 다음 작업 이어서 진행. 작업이 많을 경우 대화가 끊기기 전에 적정 묶음까지만 완료·저장하고 새 대화 권고. 이번 묶음은 시련 문양10종 및 해당 UI만 진행. 시작 main 14e1c88634b6894ac7c243074c499276127c48a6, 서비스 기존 0.42-art2.
- 기존 UI SVG 체계 확장, 등록명 trial_직업id. 맞서는 자(피해 방패), 쉬지 않는 자(발자국), 군림하는 자(왕관·교차검), 숨죽이는 자(활·주시), 설계자(설계도·기어), 기다리는 자(모래시계), 폭발(원소 폭발), 군단(망령 군단), 수호자(보호 방패·회복), 숲(나무·숲길). JOB_COL 10색 유지.
- src/ui-art.js UI_TRIAL_CREST/uiTrialCrest 정의. 도감 연성 탭의 직업별 시련 카드와 내 능력의 시련 행에 연결. 이름·설명·진행·완수횟수 문구 유지. 이미지 디코딩 실패 시 '시' 글자 대체. 다른 연성 행의 결합 문양은 미착수.
- 기존 시련 완료 banner의 이름·연성 기회 문구를 확인한 경우에만 중앙에 기존 부모 직업 문장36px 표시. 기존 알림의 불투명도·2.2초 지속시간 재사용, 추가 이동·회전·파편·상태 없음. 이미지가 없으면 기존 알림 그대로. 일반 알림·보스 알림에는 추가 문장 없음.
- 변경 파일 src/ui-art.js, src/codex.js, src/select.js, src/juice.js(drawBanner 표시1행), src/config.js, dev/check-trial-crests.cjs, .github/workflows/check-art42.yml. src/v42.js와 시련 조건·목표·진행·연성 기회 및 실제 게임 규칙·수치·저장 데이터·build.sh 순서 변경 없음.
- 로컬 build/check-build 통과. 현재 로컬 Chromium의 socket() 실행 제한으로 GitHub Actions에서 브라우저 검사. 48/38/24px 비교판 검토. 최종 실행 번호·검사 결과·소스/서비스 SHA는 아래 최종 기록 참조. 실제 폴드8·장시간 FPS 미검증.
- 결합3종·연성/HUD·설치물·소환물·전투 상태/예고·직업별 전투 효과·외형은 미착수. 전체 아트 완료로 해석하지 말 것. 이 묶음 완료 후 종료 및 새 대화 권고.

### art3 최종 검사·배포 완료

- 실제 서비스 https://1hyun-you.github.io/field/ 버전 0.42-art3 확인. 검증 소스 662ff1dbeb685187ab26d1a9a70257e1ff2014ad, 게임 자동 HTML 빌드 97c3b24a7e2b823bb7bd3f987b2fcedabb27ad87.
- 서비스 source-ref 반영 e1e60b640d748cdc1037979f93c808a3637d261b, 서비스 HTML 빌드 106ff37b755796d34c571321310e14f026131513, 버전 기록 c72a2f44d61479f6e0911fda07a285384ce5dd0e. build-field 실행42924105838 및 최종 Pages 실행42924176772 성공.
- 검증 브랜치 art/042-trial-crests, Actions https://github.com/1hyun-you/loop-game/actions/runs/42923706795 전체 성공. 시련83항목·2차문장113항목·1차문장23항목·선택창78항목·HUD12항목·기존원화11항목 통과. 가상 플레이2판(각 최대120초) 오류0·페이지 오류0·저장 유지.
- 10직업의 첫/두 번째 시련 직전·도달·초과 진행값, 완수 상한2회, 기존 알림 문구 및 Lv6 무기2종 연성 선택 진입을 art2 기준과 비교해 일치. 문양10종 고유 형태·직업 색, 도감/내 능력 표시, 실패 글자 대체, 완료 직업 문장의 기존 시작/유지/종료 불투명도·2.2초 지속시간·원화 누락·다른 알림 미적용 및 동작 줄이기 확인. 상태·저장·게임 난수 보존 검사 통과.
- 48/38/24px 비교판, 320/390/690px 도감 연성 탭·내 능력·완료 알림 화면 검토. 실제 응답 HTML과 검증 소스 빌드 바이트 일치. SHA256 51ab731ef9ab2255877d66de145de7f3594c1eea2caa3992a2f6b48679b8b47e. 실제 version.json 버전/소스/빌드 일치. 브라우저 상호작용은 검증 소스에서 검사했고 실제 서비스는 동일 HTML·버전 응답으로 확인. 폴드8 실기기·장시간 FPS 미검증.
- 결과 dev/trial-crests-validation.json 및 이번에 재실행한 crests/job2-crests/choice/ui/art2-validation.json. dev/art42-validation.json에 이번 실행·배포 요약 저장. 과거의 다른 validation 파일을 이번 검사로 해석하지 말 것. 화면/가상시험 원본 Actions artifact13812288088 (2027-02-08 만료 예정), 로컬 /workspace/scratch/dca915f4a032/trial-final/.
- 이번 묶음 완료·저장 후 종료. 새 대화 권고. 다음 기본 후보는 결합 문양3종(변신/중첩/융합)만. 전체 아트 완료 아님. 다음 재개 문구: 회귀의 들판 아트 작업 계속. loop-game 최신 main의 ART42_PLAN.md와 CLAUDE_HANDOFF.md 확인 후 결합 문양3종만 진행. 한 묶음 완료 후 검사·배포·인계 기록 저장 및 종료.
- 본 기록 커밋은 문서·검사 결과만 변경하므로 배포 소스 SHA와 구분. art2 인계 문서의 중복 설명1개 정리, 기존 최종 검사·배포 기록 보존.

## 0.42-art4 — 결합 문양3종 (2026-11-11 한국시간)

- 사용자 지시: 최신 main의 ART42_PLAN.md·본 문서 확인 후 결합 문양3종만 검사·배포·인계 기록 저장 후 종료. 시작 main 030726b880e82f3eac52cc1cfba62869e8eec1a7, 기존 서비스 0.42-art3.
- 기존 UI SVG 확장. 변신형(무기→폭발), 중첩형(겹친 세 층), 융합형(두 갈래가 하나로 합쳐지는 관통 형태). 양피지·청동·회청 팔레트, 자주 외곽선, 48px 원본 및 38/24px 축소 검수. 등록명 fuse_trans/fuse_stack/fuse_merge, UI_FUSE_CREST/uiFuseCrest.
- 도감 연성 탭의 유형3개와 내 능력 연성 행에 연결. 기존 FZ_TYPES/type 그대로 사용. 이름·설명·무기 조합·진행 문구 유지. 이미지 실패 시 유형 첫 글자 복원, 알 수 없는 유형은 공통 '연' 표시. 새 외부 요청·애니메이션 없음.
- 변경 파일 src/ui-art.js, src/codex.js, src/select.js, src/config.js, dev/check-fuse-crests.cjs, .github/workflows/check-art42.yml. src/v42.js·전투·피해·범위·시련·연성 기회·저장 키·선택 확정 규칙·build.sh 순서 미변경. 결합 선택 카드/HUD/전투 효과는 후속8번 범위 유지.
- 로컬 build/check-build 통과. 로컬 Chromium의 socket() Operation not permitted 제한으로 GitHub Actions 브라우저 검사 진행. 최종 실행·배포 결과는 아래 기록 참조. 실제 폴드8·장시간 FPS 미검증.

### art4 최종 검사·배포 완료

- 실제 서비스 https://1hyun-you.github.io/field/ 버전 0.42-art4 확인. 검증 소스 9a614f5c3e5bed95ee7c59a887c80fa87c1fb4d7, 게임 자동 HTML 빌드 3b6adecc02cd5e41206810a0601a57e775256c11.
- 서비스 source-ref 반영 f878475e6cef9e94cb926bfa5903cef6c3dd20e4, 서비스 HTML 빌드 0fa81c1cdce5435cc2b41c49d29788e47768f1af, 최종 버전 기록 79749f558c62c2ab331bace132134d18d6896241. build-field 실행42925724591 및 최종 Pages 실행42925793046 성공.
- 검증 브랜치 art/042-fuse-crests, Actions https://github.com/1hyun-you/loop-game/actions/runs/42925333569 전체 성공. 결합31항목·시련83항목·2차문장113항목·1차문장23항목·선택창78항목·HUD12항목·기존원화11항목 통과. 가상 플레이2판(각 최대120초) 오류0·페이지 오류0·저장 유지.
- 10직업×무기153조합=1530건의 연성 메타데이터·부품 플래그·통계·시련 사용횟수·알림·효과·도감/내 능력 설명·저장·난수 호출을 art3와 비교하여 일치. 반복 UI 생성 상태/저장/RNG 불변, 유형3종 실제 조합 연결, 실패 글자 복원, 미확인 유형 공통 대체, 동작 줄이기 확인. 전투 함수 변경 없음.
- 48/38/24px 비교판 및 320/390/690px 도감·내 능력 화면 검사. 390px 실제 캡처와 비교판 육안 검토. 실제 응답 HTML 1767337바이트가 검사 소스 빌드와 바이트 일치. SHA256 ca781a221c081ef4d19a0a75baa4c32d32f4e3a73eadd3ede4e4e749de1f9899. version.json 소스/빌드 일치. 브라우저 상호작용은 검증 소스에서 실행했으며 실제 서비스는 동일 HTML·버전 응답으로 확인. 폴드8 실기기·장시간 FPS 미검증.
- 결과 dev/fuse-crests-validation.json 및 이번 재실행한 trial-crests/job2-crests/crests/choice/ui/art2-validation.json. dev/art42-validation.json에 이번 검사·배포 요약 저장. 다른 과거 validation 파일을 이번 검사로 해석하지 말 것. 화면/가상시험 원본 Actions artifact13813881757 (2027-02-08 만료 예정), 로컬 /workspace/scratch/ce38e9eab285/fuse-final/.
- 이번 결합3종 묶음 완료·인계 저장 후 종료. 전체 아트 완료 아님. 다음 기본 후보는 ART42_PLAN.md 3번 기타 화면 아이콘이며 사용자 지정 범위만 진행. 선택/HUD 결합 연출은8번에 남아 있음. 다음 새 대화에서 두 저장소 최신 main·본 문서·작업 계획 확인 후 재개. 기록 커밋은 문서·검사 결과만 변경하므로 배포 소스 SHA와 구분.

## 0.42-art5 — 도감 일반 적 10종·보스 5종 초상 (2026-11-11 한국시간)

- 시작 main `aa2c3079ac3e4212d0d43f5a0a1096883c4aa385`과 기존 서비스 0.42-art4 확인 후 착수했다.
- 완료 15종. 일반 적은 초록 슬라임, 동굴 박쥐, 해골 병사, 오우거, 고블린 궁수, 분열 젤리, 자폭 버섯, 돌진 멧돼지, 기사, 위습. 보스는 바르간, 이그나, 모르덴, 세렌, 마왕.
- 기존 전투 원화를 참조해 내장 이미지 생성 기능으로 도감 전용 원화 15장을 제작했다. 96×96 투명 WebP 15장 합계 71,236바이트. 원화 PNG·프롬프트·해시는 로컬 작업 폴더 `art-originals/codex-portraits/`에 저장했다.
- `assets/codex-portraits/` → `node dev/pack-codex-portraits.cjs` → `src/codex-portrait-data.js` → `node dev/build.cjs`. `src/codex.js`에서 조우한 항목만 40px로 표시한다. 잠긴 항목은 물음표, 이미지 누락·실패는 기존 첫 글자, 엘리트 안내는 기존 '정'을 사용한다. 기존 전투·대화 원화, 저장 키 및 게임 규칙·수치·판정은 유지했다.
- 로컬 build/check-build, git diff --check 통과. Chromium에서 280/320/390/690px에 걸쳐 실제 열기, 15개 고유 ID·파일 바이트, 초기/이전 저장/완료 기록의 문구·순서·잠금, 이미지 오류 대체, 화면 가로 넘침, 게임 상태·저장·난수 비교 검사 10항목 통과. 투명도와 40px 비교판·390px 화면을 육안 검토했다.
- 검사 브랜치 `art/042-codex-portraits`. [자동 검사 42931187554](https://github.com/1hyun-you/loop-game/actions/runs/42931187554) 성공. 도감 초상 및 기존 1·2차 문장·시련·결합·선택·HUD·원화 검사, 가상 플레이 2판 오류 0건·저장 정상. 검사 원본 artifact 13815459701, 2027-02-09 만료 예정.
- 소스 `170d3e82a598c2d3409fd02b98e7c81d22380e9e`, 게임 자동 HTML 빌드 `33a55e5a18efa8efbd6f2f33258f2efa43abf0b2` 및 실행 42931483302 성공.
- 서비스 source-ref `80253b030bef869cf0d55f09c88b50ac50c3a004`, HTML 빌드 `c034fe800465f52e2823e7131284031b0a8d8a74`, 버전 기록 `da2a14f4a10d8ae2b81817f133e95316fd58c7f4`. [서비스 빌드 42931496167](https://github.com/1hyun-you/1hyun-you.github.io/actions/runs/42931496167)과 [Pages 게시 42931617313](https://github.com/1hyun-you/1hyun-you.github.io/actions/runs/42931617313) 성공.
- 공개 서비스의 버전·소스·빌드 및 HTML 1,863,697바이트 일치 확인. SHA-256 `d5c03fc588c8fe0b0efb443165b78f6c80c8a933c540c6be8051a62c6a0f487b`. 공개 주소에서 Chromium 도감 검사 10항목을 다시 통과했고 페이지 오류는 0건이었다. 폴드8 실기기와 장시간 FPS는 검사하지 않았다. [실제 서비스](https://1hyun-you.github.io/field/)
- 결과 `dev/codex-portraits-validation.json`, `dev/codex-portraits-live-validation.json`, `dev/art42-validation.json`. 본 인계 커밋은 문서와 결과만 기록한다.
- 미완료 범위는 숙련 특성·저주별 아이콘, 유대 카드 초상, 계획 4~13번 묶음과 8번의 결합 선택·HUD·전투 표현이다. 이번 묶음을 마치고 종료한다. 다음은 새 대화에서 3번 중 숙련 특성 아이콘만 진행한다.

> 회귀의 들판 아트 작업 계속. 두 저장소의 최신 main, ART42_PLAN.md·CLAUDE_HANDOFF.md·ART_DIRECTION.md와 실제 서비스 버전을 확인한 후, 이번에는 숙련 특성 아이콘만 제작·적용해 줘. 기존 화풍을 유지하고 게임 규칙·수치·판정·저장 데이터는 그대로 둬. 작은 묶음으로 끝내고, 검사·실제 서비스 배포·배포 확인·인계 기록 저장 후 종료해 줘. 종료 시 새 대화 전환을 권장하고 다음 요청문도 남겨 줘.

## 0.44 — 연성 90종 재구현 (Claude, 2026-11-11 한국시간)

- 0.43 직업 방식 덧씌우기 연성(`fuseFire43`)을 폐지하고 `src/v44.js`에 직업 10 × 짝 무기 9 = 연성 무기 90종을 개별 정의했다 (`F44` 조합표, `FU44` 동작, `M44` 조합별 보정 배율).
- 변화 방식 2종: 무기 결합(기본 무기와 합쳐짐) / 직업 변화(직업 특성에 맞는 형태). 이름·효과·수치는 게임 시스템 대시보드 연성 탭과 동일.
- 새 지속 개체 `G.f44` (광선 lines·연성 덫 traps·레이저 말뚝 nodes)는 `drawJobAura` 감싸기에서 임시 도형으로 그린다. 최종 외형은 GPT_REQUESTS.md G44-1~10 대상이며, 동작·판정·수치는 유지해야 한다.
- 점검 도구 `dev/vfuse44.js` (90종 발동·피해·이름 점검) 추가.

## 0.45 — 상단 화면 정리·기본 무기 강화 우선 (Claude, 2026-11-11 한국시간)

- `src/v45.js`(main.js 직전): `hudLayout`·`drawHUD`·`drawSlots`·`drawBossBar` 재정의. 1단 패널(기본 무기·직업 이름·Lv / 시간·페이즈 이름 n/N / 처치·체력) + 무기 5칸 + 보조 효과 5칸, 보스전 시 보조 효과 줄 접힘 → 보스 체력. 일시정지 버튼은 패널과 같은 표현.
- 무기 칸 테두리: 일반 없음, 연성 무기만 직업 색 이중 테두리, 기본 무기는 패널 왼쪽 직업 색 테두리. 최종 외형은 GPT_REQUESTS.md G45-1.
- 기본 무기 강화 카드 가중 ×3, 자동 플레이 기본 무기 강화 우선. 치트 버튼(구 DEV) 끌어서 이동·위치 기억.

## 0.46 — 동료 지휘 로직 (Claude, 2026-11-12 한국시간)

- `src/v46.js`(v45 다음): 망령·망령 무장(연성)·드루이드 야수 동료 공통 지휘 모듈 `squad46`. `updateMinions`·`updatePets` 표적·이동 부분 교체, `fuseTick` 망령 무장 이동 교체, `minionWeapons` 복귀 중 발동 보류.
- 거리: 대기 고리 110~160, 3체째부터 1체당 +6(최대 +30), 활동 범위 210+가산(상한 240). 정예·수문장·보스 절반(올림) 집중, 보스 단독 시 전원, 플레이어 반경 80 근접 적 최우선, 같은 표적은 적 둘레 각도 분할 공격 자리, 동료 간격 22, 재판단 0.6초. 곰 정예 담당·늑대 잡몹 분산.
- 점검 도구 `dev/vsq46.js` (대기 고리·분산·집중 인원·겹침·근접 위협·보스 전원·범위 밖 미공격·이동 중 이탈률/겹침률).
- 그래픽 변경 없음. 동료 외형·공격 동작 최종본은 기존 GPT 요청 대상 유지.

## 0.46-art1

- 2026-11-12 한국시간. G43-1·G43-5·G45-1 작업 완료. 시작 main `ff1ddf74f00882d4890ce7b30cd3bfa08ef081d8`. `assets/hud-art1/`에 카드 금속 장식, HUD 패널, 일시정지 패널, 보스 패널 SVG 4종을 코드에 앞서 `e04e6c2f1a49f61ab96023743e8a36f14fff4249`로 선등록. 해당 커밋은 아트 파일만 포함하고 메시지에 `[skip deploy]` 표기.
- `node dev/pack-hud-art.cjs`로 SVG를 `src/hud-art-data.js`에 내장하고 `build.sh`에서 로드. `src/select-art.js`의 `choiceCard`에 단일 직업 색 테두리·하이라이트·은은한 맥동·1차 직업 문장 적용. 이미지 실패 시 CSS 바탕과 기존 직업 글자 표시. 동작 줄이기에서는 카드 맥동 정지. `src/v43.js`의 이전 카드·슬롯 외형 감싸기 제거.
- `src/ui-art.js`의 무기 칸·직업 표식 그리기와 `src/v45.js`의 `drawHUD`·`drawSlots`·`drawBossBar`·일시정지 스타일 연결. 일반 무기 테두리 없음, 연성 무기 직업 색 단일 테두리, 기본 무기 직업 문장과 단독 발동 종료 시 어두운 표시 적용. 패널 이미지 실패 시 Canvas·CSS 대체 표시. 보스전 보조 효과 줄 접힘·보스 체력 전환 시간과 위치, 체력 비율 및 마왕 단계 눈금 유지.
- 상단 패널·슬롯·버튼의 배치 계산, 게임 규칙·수치·판정·저장 데이터·자동 플레이 로직 유지. 긴 페이즈명에서 글자가 부딪히는 구간은 패널 안쪽 배지 여백과 숫자 그리기 폭으로 정리. 폴드 기기별 HUD 배율·배치 조정 및 실기기 확인은 별도.
- `src/config.js` 버전 `0.46-art1`. 배포 소스 `0070ed39b98fb70dff0839e738ba5fa2e55eca51`, 게임 자동 빌드 `707b2fb2e68b9c861f40fc21fee4c8c4db9dfded`, 서비스 source-ref `a392a7a1d020d504bf69498d4281dc117b05be51`, 서비스 HTML 빌드 `aa5c8a2e88e60b3bdd1d6eedf819de454dd891a5`, 게시 버전 기록 `992bd313f80f8f84c8eb3889efea1329b7ef9cab`. 공개 HTML과 검증 빌드 바이트 일치, SHA-256 `07e5465015fd947d3973247a76c0f8f6c20c9a3a6a051b76dc9e311d9a00ce22`. [실제 서비스](https://1hyun-you.github.io/field/)
- `dev/check-hud-art1.cjs`로 320px·390px에서 기본 직업 10종·페이즈 14종의 글자 경계와 렌더링 전후 게임 상태 검사. 연성 카드 모서리 문장·맥동·동작 줄이기·이미지 실패 대체, 일시정지, 기본 무기 비활성 표시, 보스 전환과 화면 오류 검사. [배포 전 검사](https://github.com/1hyun-you/loop-game/actions/runs/43127626389)
- 실제 서비스의 Chromium 320px·390px 검사 재실행 통과. 연성 카드·일반 HUD·보스 HUD 캡처 6장. [공개 서비스 검사](https://github.com/1hyun-you/loop-game/actions/runs/43127971297) · [캡처 ZIP](https://github.com/1hyun-you/loop-game/actions/runs/43127971297/artifacts/13903553248)
- 남은 항목은 `GPT_REQUESTS.md` 제공 목록 참조. 다음 아트 묶음은 새 대화에서 최신 main·인계 문서·요청서를 확인한 후 사용자 지정 범위로 진행.

## 0.46-art2

- 2026-11-12 한국시간. G43-4 직업별 연성 순간 연출 10종 완료. 시작 main `b1bfeb6ad2e296ea5755abd7349450f64f6ce6a7`. `assets/fuse-art2/` 투명 WebP 10종(88,864바이트)을 그림 파일만 포함한 커밋 `89047e960d3a6f09986e4cf08c0d25f56d883d1a`로 선등록. 메시지에 `[skip deploy]` 표기. 마법사 WebP는 원소 4종을 담은 2×2 시트.
- `node dev/pack-fuse-art.cjs`로 `src/fuse-art-data.js`를 생성하고 `build.sh`에서 `src/fuse-art.js`와 함께 결합. `src/v43.js fuseMoment(j, w)`에 연결하며, 현재 적용 함수인 `src/v44.js applyFuse`에서 연성한 무기 객체를 전달. 이미지 미준비·실패 시 기존 직업별 도형 연출 사용.
- `src/render.js`의 전장 연출은 적 공격 예고·개체보다 먼저 그리며, `src/v45.js drawSlots`의 연출은 해당 무기 칸 안에 배치. 0.9초 동안 준비·실행·여운을 표시. 동작 줄이기 설정에서는 전장 장식을 생략하고 해당 칸에 정적인 색 표시 적용. 전사 대검·불꽃, 도적 분리·합류, 군주 군기·각인, 궁수 화살촉·바람, 기술자 톱니 조립, 시간술사 문자판·초침 정지, 마법사 원소 4종 수렴, 소환사 영혼 흡수, 프리스트 빛기둥·성물, 드루이드 덩굴 성장.
- `src/config.js` 버전 `0.46-art2`. 배포 소스 `efdf7c2bbd8cd11db9c7f060ae9e2ad2bcb4db2c`, 게임 HTML 자동 빌드 `951e8848527d341bd4f7efd7197105d3cceb334d`, 서비스 source-ref `3a8f6ea37442b334f838d8d296e3da7f257345c5`, 서비스 HTML `fc618b22a6a902b7bdd4645e5f81339b2869ffc6`. 공개 HTML과 검증 빌드 바이트 일치. SHA-256 `ef5110b8111579a4059235047f2e2d41282d63f76e74b0c6f246bade6f1d52c2`. [실제 서비스](https://1hyun-you.github.io/field/)
- `dev/check-fuse-art2.cjs`로 320px·390px에서 각 직업 카드 2회 클릭 확정, 대상 슬롯, 단계별 프레임, 슬롯 경계, 이미지 실패 대체, 동작 줄이기 및 렌더링 전후 게임·저장 상태 일치 검사. `dev/vfuse44.js`의 기존 연성 90조합 발동·피해·이름 검사 실패 0건, 브라우저 오류 0건. [배포 전 검사](https://github.com/1hyun-you/loop-game/actions/runs/43151055228) · [공개 서비스 검사](https://github.com/1hyun-you/loop-game/actions/runs/43151243442) · [320px·390px 캡처 ZIP](https://github.com/1hyun-you/loop-game/actions/runs/43151243442/artifacts/13913951646)
- 남은 작업: 실제 폴드8에서 시인성 확인. 연성 무기 90종의 상시 외형·공격 동작은 `GPT_REQUESTS.md` G44-1~10. 다음 요청 접수 시 최신 main과 인계 기록 확인 후 사용자 지정 묶음부터 진행.

## 0.46-art3

- 2026-11-12 한국시간. G44-1 전사 기본 대검 베기 및 연성 9종 외형·동작 완료. 시작 main `66045c0dda30d1836648bb47c94803c0890dc111`.
- `assets/warrior-art3/`에 투명 WebP 10종(40,124바이트)을 코드보다 먼저 선등록. 그림만 포함한 커밋은 방패·대지·투창 `400a1055238d8546c1484cc89fd0c3f3a2c6337b`, 각인·도끼·화염 `f5606696b9afc29a5001a84251765a65c88d6a67`, 서리·혼령·검광·기본 대검 및 대지 대검 방향 보정 `d7c85136468c766cf3bf70b4439a3d1d17a72d35`. 3개 모두 `[skip deploy]`. 내장 이미지 생성으로 손그림 판타지풍, 왼쪽 위 조명, 어두운 자주색 외곽선의 원화 제작.
- `node dev/pack-warrior-art.cjs`가 WebP를 `src/warrior-art-data.js`에 내장. `build.sh`에서 `src/warrior-art.js`와 함께 로드. `src/weapons.js slash`는 기본 대검, `src/v44.js FU44.warrior`·`fan44`·`warMark`는 연성 발동 위치를 연결. `src/render.js`에서 공격 원화를 적 공격 예고 및 개체 이전에 그리며, `src/v44.js drawJobAura`의 전사 광선·각인, `src/arsenal.js`·`src/vfx.js`·`src/render.js`의 기존 효과·투사체는 이미지 누락 시 대체 표시로 사용. 말뚝은 후속 직업 작업 대상.
- 방패를 세우는 자세에서 돌진·충돌, 대검 2회 베기 뒤 대지 균열 또는 일직선 검광, 1~2자루 투창, 각인 설치·발동, 도끼 회전·튕김, 화염 방사, 냉기 파동·파쇄, 혼령 상승·추적 돌진을 연결. 시각 효과는 실제 발동 좌표·궤도·범위·지속시간 사용. 방패 자세는 별도 WeakMap, 기타 동작은 기존 효과 시간 사용. 게임 수치·판정·자동 플레이·저장 데이터 수정 없음.
- `src/config.js` 버전 `0.46-art3`. 배포 소스 `00bea5493ff20b71737453bbbee9e5ba369d2a20`, 게임 HTML `5688019ca8be6557bb8911b3cb7aab6545b38d97`, 서비스 source-ref `fcba6ba46403ce96c585e8c46ccddc8a2f53092b`, 서비스 HTML `dea1b3c0562f8f37ac8b0f1d091139e715d3d01e`. 공개 HTML 2,171,558바이트가 로컬 검증 빌드와 일치. SHA-256 `3f1a7df07681b592fd8c04671572aa0c2a83afb79d7efa1348d4216003d25dc1`. [공개 게임](https://1hyun-you.github.io/field/) · [Pages 배포](https://github.com/1hyun-you/1hyun-you.github.io/actions/runs/43166129612)
- `dev/vfuse44.js` 연성 90종 발동·피해·이름 검사 실패 0건, 오류 0건. `dev/check-warrior-art3.cjs` Chromium 320px·390px에서 기본 대검 및 연성 9종 동작 변화·이미지 누락 대체·위험 예고 순서·렌더링 전후 상태 및 저장 불변·동작 줄이기 확인. [배포 전 검사](https://github.com/1hyun-you/loop-game/actions/runs/43165960955) · [공개 게임 검사](https://github.com/1hyun-you/loop-game/actions/runs/43166718362) · [320px·390px 공개 게임 캡처 20장](https://github.com/1hyun-you/loop-game/actions/runs/43166718362/artifacts/13919609592)
- 전사 G44-1의 남은 제작 항목 없음. 폴드8 실기기 및 장시간 성능 미검증. 다른 직업의 G44-2~10은 `GPT_REQUESTS.md`의 제공 목록 참조.

## 0.46-art4

- 2026-11-12 한국시간. G44-2 도적 기본 수리검 및 연성 무기 9종 외형·동작 완료. 시작 main `36d065ef1dcbbd81ea3ce2a09385c40ca51c5d77`.
- `assets/rogue-art4/`에 알파 채널 포함 WebP 10종(50,138바이트) 선등록. 그림자 습격·연막탄·낙하 수리검 `b781066b1971602089eb9f80e3c176531342c080`, 관통 표창·마름쇠 살포·화약 주머니 `e1e575c31d8dd49deed87667f7292de2ee825ebc`, 그림자 결계·추적 그림자검·그림자 선·기본 수리검 `fabb01dd42c07ac6370df4e6d96bc80828951230`. 모두 그림만 저장한 `[skip deploy]` 커밋. 사선 탑다운, 왼쪽 위 조명, 어두운 자주색 외곽선과 청록·강철색 기준 적용.
- `node dev/pack-rogue-art.cjs`로 원화를 `src/rogue-art-data.js`에 내장. `build.sh`에서 `src/rogue-art.js` 로드. `src/v44.js`의 `FU44.rogue`·`hitC`·`fan44`에 효과 표시 연결. `drawJobAura`의 도적 광선·마름쇠 대체 표시와 다른 직업의 말뚝 표시 유지. `src/render.js`에서 신규 원화를 적 경고·개체 이전에 그리며 `drawWeapons`, `src/arsenal.js`, `src/vfx.js`의 기존 효과를 이미지 미로딩 시 사용.
- 그림자 분신 2연 베기, 연막 확산·회피 잔류, 수리검 상승·낙하·지면 균열, 3발 직선 표창, 마름쇠 설치·출혈 파편, 주머니 회전 투척·폭발, 그림자 속박 고리, 청록 구체 수리검 2개의 도탄, 도탄 경로 잔류 리본 적용. 기존 발동 위치·범위·시간·피해 및 자동 플레이·저장 데이터 유지.
- `src/config.js` 버전 `0.46-art4`. 배포 소스 `075dd8f62dbc2ae2c7299897281255ff45d22147`, 게임 HTML `c32cc5e1647499826a8749557ef4fbaa59cdd347`, 서비스 source-ref `6f12994f537a575004eadddd549df20d2d111f2d`, 서비스 HTML `875876f7f039a044ad6c044ce530204c435ac089`. [공개 게임](https://1hyun-you.github.io/field/) · [Pages 배포](https://github.com/1hyun-you/1hyun-you.github.io/actions/runs/43172893659).
- `dev/vfuse44.js` 연성 90종 발동·피해·이름 실패 0건, 브라우저 오류 0건. `dev/check-rogue-art4.cjs` Chromium 320px·390px 도적 9종 3단계 화면, 원화 사용, 그림자 선 이미지 누락 대체, 렌더링 전후 전투·저장 상태 불변 검사 통과. 공개 HTML과 검증 빌드 바이트 일치, SHA-256 `43fae6b5ba61efab20227c1efdd456014fa3d7a7754fcd7769c05230df697884`. [배포 전 검사](https://github.com/1hyun-you/loop-game/actions/runs/43172671384) · [공개 게임 검사](https://github.com/1hyun-you/loop-game/actions/runs/43172985772) · [공개 게임 캡처 54장](https://github.com/1hyun-you/loop-game/actions/runs/43172985772/artifacts/13922393633).
- G44-2의 남은 제작 항목 없음. 폴드8 실기기 및 장시간 성능 미검증. 다음 아트 작업은 사용자 지정 범위에 따라 최신 main·`ART_DIRECTION.md`·본 문서·`GPT_REQUESTS.md`부터 확인.

## 0.46-art5 — 진행 중

- 2026-11-12 한국시간. G44-3 군주 기본 방패 충격 및 연성 무기 9종 외형·동작 작업. 시작 main `0e8d6faa34302a83d16197a62ff30110509ca813`. `ART_DIRECTION.md`, 직전 인계 `0.46-art4`, `GPT_REQUESTS.md` G44-3 및 `src/v44.js`의 군주 조합표 확인.
- 첫 묶음 그림 선등록 `fc503ca1c2ff16e2e232bf48e79a056419c41d1f` (`[skip deploy]`). `assets/sovereign-art5/guard-cleave.webp` 근위 검열(왕관 방패와 대검을 든 근위병, 112×101), `assets/sovereign-art5/royal-advance.webp` 왕의 진격(쐐기형 하단과 돌 파편의 충격 방패, 86×112), `assets/sovereign-art5/archer-volley.webp` 궁수대 사격(오른쪽으로 향하는 왕실 화살, 112×22). 실제 알파 채널 확인, 3종 합계 14,212바이트. 왼쪽 위 조명, 어두운 자주색 외곽선, 군주 금색과 남색 적용.
- 두 번째 묶음 그림 선등록 `43123d6ca92c8a1347ecf87bd415c0d9b89e49ad` (`[skip deploy]`). `assets/sovereign-art5/royal-barricade.webp` 왕실 방책(왕관 문장의 목재 말뚝, 112×67), `assets/sovereign-art5/shield-throw.webp` 방패 투척(회전하는 원형 왕관 방패, 112×105), `assets/sovereign-art5/royal-bombardment.webp` 왕실 포격(아래로 낙하하는 금색 포격체, 35×112). 투명 알파와 34px 축소판 확인, 합계 17,608바이트. main 원격 파일 3종 바이트 일치 확인.
- 다음 첫 작업: 최신 main의 기존 WebP 6종을 확인하고 얼음 성벽·전령 매·군기 광휘·기본 방패 충격 원화 제작 및 선등록. 등록한 원화는 후속 적용에 재사용.
- 남은 적용: `src/v44.js`의 `FU44.sovereign`과 `drawJobAura`의 lines·traps·nodes에 준비·실행·여운 연결. 기존 판정 좌표·범위·시간, 적 공격 예고 및 이미지 실패 대체 유지. `src/config.js`의 VERSION을 `0.46-art5`로 변경하고 `dev/vfuse44.js` 연성 90종 검사, 320px·390px 군주 9종 화면 캡처, 실제 서비스 버전 확인 후 본 항목 및 `GPT_REQUESTS.md`의 완료 상태 갱신.
- 현재 상태: 그림 6종 선등록 완료. 코드 연결·동작·브라우저 검사·배포는 미착수. G44-3 요청은 제공 상태 유지.

## 0.46-art6

- 2026-11-12 한국시간. G44-4 궁수 기본 화살 및 연성 무기 9종 외형·동작 적용·배포 완료. 시작 main `7e698e4566a1c0620a593895bbcc957efbb1243f`. G44-3 군주 진행 기록과 선등록 원화 보존.
- `assets/archer-art6/` 투명 WebP 10종, 합계 29,208바이트. 그림 전용 선등록 커밋은 갈래·충격·낙하 `834d0eeb7edac00aacc01bc7c41ef49be4efd30f`, 사냥 덫·도탄·화염 `8e932389933cc089386bcccea641a334c27dc3f7`, 서리·사냥 매·충전·기본 `e88efef7ad1dd8fb460d8240b470c8495cc61d58`. 모두 `[skip deploy]`, 원격 WebP 10종 바이트 일치 확인. 잎색 깃, 짙은 자주색 외곽선, 왼쪽 위 조명 기준.
- `dev/pack-archer-art.cjs`로 원화를 `src/archer-art-data.js`에 내장. `build.sh`에서 `src/archer-art.js`와 함께 결합. `src/v44.js`의 FU44.archer 낙하 표식, 공통 착탄과 도탄 시점, drawJobAura의 궁수 광선·덫을 연결. `src/render.js`에서 적 예고와 개체보다 먼저 신규 그림을 표시하고 `src/vfx.js`에서 동일 효과의 기존 표시를 제어. 궁수 말뚝 노드 정의 없음. 이미지 누락 시 기존 투사체·고리·광선·육각 덫으로 대체.
- 갈래 5발, 방패촉 충격파, 표식 수렴과 낙하, 덫 설치·닫힘, 실제 도탄점의 꺾인 잔상, 불씨 폭발, 결정 냉기, 매의 날갯짓·급강하, 집중 5단계 직선 관통을 표현. 미충전 일격은 기본 화살 표시. 게임의 좌표·판정·재사용·자동 플레이·저장 데이터 변경 없음.
- `src/config.js` 버전 `0.46-art6`. 배포 소스 `06e2c76d823ae1b02f271106a7bac27a0799549b`, 게임 HTML `050e7e7fd011a5ced56f7ef2a7a4d1b8c4c0f332`, 서비스 source-ref `75f9a1254b4dc8d6bd9dd37f2b3b8b4501c50349`, 서비스 HTML `1064e1c01534252eb54ad13d8dc61c8de61ed6e1`. 공개 HTML과 검증 빌드 SHA-256 일치 `eb17ff5a41efd995e436df8ae19dfa4cd2af29f0871b04e0793b19cfc1dd29a7`. [공개 게임](https://1hyun-you.github.io/field/) · [Pages 배포](https://github.com/1hyun-you/1hyun-you.github.io/actions/runs/43189610821).
- `dev/vfuse44.js` 연성 90종 발동·피해·이름 실패 0건, 브라우저 오류 0건. `dev/check-archer-art6.cjs` 320px·390px Chromium에서 11상황 3시점 캡처, 이미지 대체 표시, 렌더링 전후 전투·저장 상태, 동작 줄이기 렌더 확인. [배포 전 검사](https://github.com/1hyun-you/loop-game/actions/runs/43189337820) · [공개 게임 검사](https://github.com/1hyun-you/loop-game/actions/runs/43189655426) · [공개 게임 캡처 66장](https://github.com/1hyun-you/loop-game/actions/runs/43189655426/artifacts/13930950678).
- 궁수 G44-4의 남은 제작 항목 없음. 실제 폴드8과 장시간 성능 미검증. 다음 작업은 사용자 지정 범위의 최신 main·아트 기준·인계·요청 목록 확인부터 시작.

## 0.46-art7

- 2026-11-12 한국시간. G44-5 기술자 기본 덫 및 연성 무기 9종 외형·동작 적용·검사·배포 완료. 시작 main `04dd2c4b4786bfb85b314e14eed83b4c6b3396f8`. `ART_DIRECTION.md`, 최신 인계 0.46-art6 및 군주 0.46-art5 진행 기록, `GPT_REQUESTS.md` G44-5, `src/v44.js`의 기술자 조합과 지속 개체 확인.
- 그림 제작 및 선등록 완료. `assets/engineer-art7/`에 투명 WebP 10종, 65,038바이트. 황토·황동과 강철 명암, 어두운 자주색 외곽선, 왼쪽 위 조명의 사선 탑다운. 투명 알파 및 45px 축소판 확인.
- 첫 묶음 `d81bdd8e26915b5454cb0fd414b8ce4927806468` — `rotary-blades.webp` 회전 칼날 덫, `repulsion-plate.webp` 반발판, `crush-mine.webp` 압착 지뢰.
- 둘째 묶음 `f55dc7a6e4a1029be46047a5200ecfae66ff313d` — `crossbow-turret.webp` 석궁 포대, `ricochet-saw.webp` 톱날 덫, `incendiary-mine.webp` 소이 지뢰.
- 셋째 묶음 `c960ab890b199251d0c93b43e775280483f1463b` — `cooling-trap.webp` 냉각 덫, `tracking-drone.webp` 추적 드론, `laser-pylon.webp` 레이저 울타리, `base-trap.webp` 기본 덫. 세 커밋 모두 그림만 포함하고 `[skip deploy]` 표기.
- `dev/pack-engineer-art.cjs`로 선등록 원화 10종을 빌드 시 HTML에 내장. Node 및 셸 빌드 결과 일치. `src/engineer-art.js`와 `src/v44.js`·`src/weapons.js`의 발동 지점을 연결하고 적 공격 예고보다 먼저 렌더링.
- 회전 칼날의 설치·회전, 반발판의 튕김, 압착 지뢰의 낙하와 충격, 석궁 포대의 조준·발사, 톱날의 도탄, 소이 지뢰 폭발·화염 장판, 냉각 덫의 냉기 파동, 드론 2기의 이륙·추적, 레이저 말뚝 설치·연결·소멸 및 기본 덫의 설치·발동 표시. 기존 발동 좌표·피해·시간·판정과 저장 데이터 유지. 원화 누락 시 기존 도형과 효과 사용.
- `dev/vfuse44.js`의 90종 발동·피해·이름 검사 실패 0건. `dev/check-engineer-art7.cjs`의 320px·390px Chromium 전투 화면 10상황×3시점, 이미지 누락 대체, 동작 줄이기, 레이저 연결 거리 경계, 렌더링 전후 전투·저장 상태 검사 통과. 브라우저 오류 0건. [검사 실행](https://github.com/1hyun-you/loop-game/actions/runs/43225823961) · [전투 화면 캡처 60장](https://github.com/1hyun-you/loop-game/actions/runs/43225823961/artifacts/13947617977)
- 배포 소스 `ac5eb6fb7f9cb7b5bfc307f0d84437c680b01714`, 게임 HTML `9e5029c9708f3e6e7da2553e8326e7295c30b134`, 서비스 source-ref `26feba9e35e0b2ac739732f1e26130f31e3214da`, 서비스 HTML `cd3bcc4321eed233afd9fe2bcd0cd9100c54ba32`, 서비스 버전 기록 `8c6e3540556b7da4b121996faf472c42d1bf97ab`. 공개 HTML `0.46-art7` 및 로컬 검증 빌드 2,393,670바이트 일치. SHA-256 `e98f0687dee1f65d1341fe6f35a1e05f5f17d93f7a0950530dd5d328eef9078b`. [실제 게임](https://1hyun-you.github.io/field/) · [Pages 게시](https://github.com/1hyun-you/1hyun-you.github.io/actions/runs/43226171311)
- G44-5 작업 완료. 폴드8 실기기 및 장시간 성능 미검증. 이후 새 대화에서 사용자가 지정한 묶음의 최신 main·아트 기준·인계·요청 목록을 확인한 뒤 재개.

## 0.46-art8

- 2026-11-12 한국시간. G44-6 시간술사 기본 얼음 고리·연성 무기 9종 외형과 동작. 시작 main `7e2096889a04d73e4aee92da6becc67f49e68753`. `ART_DIRECTION.md`, 최신 인계, `GPT_REQUESTS.md`의 G44-6 및 `FU44.chrono` 확인.
- `assets/chrono-art8/`에 투명 WebP 10종, 54,422바이트 선등록 완료. 멈춘 칼날·시간 역류·시간 붕괴 `f8d4b20ae8f5d70344516deb5bb8beddffb9363c`, 정지 화살·시간 균열·지연 폭발 `9cac140582f39806d3fc0ccbd60941f12e852cfc`, 기본 얼음 고리·되감기 칼날·시계추 구체·시간 바늘 `5ede04acfdffea8ea81c928007aeecbe17a795db`. 세 커밋 모두 그림 파일만 포함하며 `[skip deploy]` 적용. 45px 축소판과 원격 WebP 바이트 일치 확인.
- `dev/pack-chrono-art.cjs`와 `build.sh`·`dev/build.cjs`에서 선등록 원화를 내장. `src/chrono-art.js`의 전장 표시를 `src/render.js`에서 적 공격 예고와 개체 이전에 호출. `src/v44.js`의 `FU44.chrono` 발동 지점 및 `drawJobAura`의 시간 균열과 시간 바늘 연결. 시간술사 조합에 말뚝 노드 정의 없음. `src/weapons.js`의 기본 얼음 고리 발동 시점 및 `src/arsenal.js`·`src/vfx.js`의 기존 효과 대체 처리 연결.
- 기본 얼음 고리 맥동, 멈춘 칼날의 부채꼴 재생, 시간 역류 방패편 확산, 시간 붕괴 모래시계 낙하, 정지 화살 8발 대기·사출, 시간 균열 설치·발동, 되감기 칼날 도탄·역회전, 지연 폭발 시한 표시·폭발, 시계추 구체 3개의 진자 흔들림과 추적, 시간 바늘 1초 1회전 표시. 기존 반경·좌표·지속시간과 판정 기준 사용. 되감기 칼날은 기존 복귀 경로를 따라 역회전 잔상 표시. 이미지 미로딩 시 기존 효과와 도형 사용.
- `src/config.js` 버전 `0.46-art8`. 배포 소스 `4425ee57b03d3191225e00dde95021d6ef8d4d3a`, 게임 HTML `cd7471f4e7218c4122a747f3942e69301c7eec4d`, 서비스 source-ref `4cc3c11f96e9d0f2abf4a6fc37952cf624422591`, 서비스 HTML `288572d55662dda4007b837c9cf20c8e452a8d7b`, 서비스 버전 기록 `4d1754bef7648cd7dcd31d41ef4357bb5b6623a0`. Node·셸 및 공개 HTML 2,475,666바이트 일치. SHA-256 `fd88752e7cedd4ae0ff7d114fe8e0458184baa65ffa2fcbf66a71ba966a903e9`. [공개 게임](https://1hyun-you.github.io/field/) · [Pages 배포](https://github.com/1hyun-you/1hyun-you.github.io/actions/runs/43236728868).
- `dev/vfuse44.js` 연성 90종 발동·피해·이름 검사 실패 0건, 브라우저 오류 0건. `dev/check-chrono-art8.cjs`의 공개 게임 Chromium 320px·390px에서 기본 1종·연성 9종 각 3시점, 예고 표시 순서, 이미지 누락 대체, 동작 줄이기, 렌더링 전후 전투·저장 상태 검사 통과. [배포 전 검사](https://github.com/1hyun-you/loop-game/actions/runs/43236263914) · [공개 게임 검사](https://github.com/1hyun-you/loop-game/actions/runs/43236694655) · [공개 게임 캡처 60장](https://github.com/1hyun-you/loop-game/actions/runs/43236694655/artifacts/13952237705).
- G44-6 제작·검사·배포 완료. 폴드8 실기기 및 장시간 성능 미검증. 다음 작업은 사용자 지정 범위의 최신 main·아트 기준·인계·요청 목록 확인부터 시작.

## 0.46-art9

- 2026-11-13 한국시간. G44-7 마법사 기본 화염구와 연성 무기 9종 외형·동작 제작, 적용 및 배포 완료. 시작 main `ffc9d517c8489fdc2aafffb76b97185e44b39bba`. `ART_DIRECTION.md`, 최신 인계, `GPT_REQUESTS.md` G44-7과 `FU44.mage` 확인.
- `assets/mage-art9/`의 투명 WebP 10종, 67,834바이트. 45px 축소판 및 원격 바이트 일치 확인. 사선 탑다운, 왼쪽 위 조명, 어두운 자주색 외곽선. 그림만 저장한 세 커밋 모두 `[skip deploy]` 적용. 화염 채찍·원소 보호막·운석 낙하 `ab0b4b004d538511f7d84dae75b470e33e6e5848`, 화염 창·화염 룬·튕기는 불덩이 `6543ecfa2a005808f97c125a2f3e411286de470d`, 증기 폭발·원소 정령·화염 광선·기본 화염구 `5ee3ecc9e2e8eb3bde3fd0b67b09e5c00f460a20`.
- `dev/pack-mage-art.cjs`와 `build.sh`·`dev/build.cjs`에서 원화 내장. `src/v44.js`의 `FU44.mage`, `fan44`, `hitC`, `magFb`와 `drawJobAura`의 광선·룬 표시를 연결. 마법사 연성의 말뚝 노드 정의는 없음. `src/weapons.js`의 기본 화염구 발사·착탄 표시를 연결하고 `src/awaken.js`·`src/bal39.js`의 기존 폭발 감싸기에서 표시 인수 전달.
- `src/mage-art.js`를 `src/render.js`에서 적 공격 예고 및 개체보다 먼저 호출. `src/render.js`·`src/arsenal.js`·`src/vfx.js`의 임시 효과는 대응 원화가 로드된 경우에만 생략. 기존 발동 좌표·범위·피해·시간과 자동 플레이·저장 데이터 유지.
- 화염구 발사·착탄, 화염 채찍의 부채꼴 펼침, 원소 보호막의 속성 순환·팽창, 운석 낙하·충격·잔불, 화염 창의 직선 관통, 룬 설치·점화·발동 폭발, 회전 불덩이 3회 도탄, 냉기·증기의 서로 다른 착탄 범위, 원소 정령 3기의 속성·추적, 광선의 전개·관통·끝 지점 불길 표시. 화염 룬의 착탄은 기존 설치 동작을 따르며, 룬 폭발 판정은 적이 밟는 시점에 적용.
- `src/config.js` 버전 `0.46-art9`. 배포 소스 `f888010db406ddd7eeb01b3ad92724fe68b3b876`, 게임 HTML `2a19ddcb69c7b1fde4e4258139f9ac2cb348e1b9`, 서비스 source-ref `b625a5ae9b51d0ab7343c14a7303b33c53ff83e3`, 서비스 HTML `0072542e72322e312204d739f2847d7fe35cd956`, 서비스 버전 기록 `ea196b0cdf3ea380428c607168c527c62e45ab9a`. Node·셸·공개 HTML 2,575,911바이트 일치, SHA-256 `196d32198e359cd4c84dcf0c78c5ffa411b134971b604b3bd319b030bb3737f9`. [공개 게임](https://1hyun-you.github.io/field/) · [Pages 게시](https://github.com/1hyun-you/1hyun-you.github.io/actions/runs/43251362853).
- `dev/vfuse44.js`의 90종 발동·피해·이름 검사 실패 0건, 브라우저 오류 0건. `dev/check-mage-art9.cjs`로 공개 게임의 320px·390px Chromium에서 기본 1종·연성 9종·추가 증기 분기 각 3시점, 원화 누락 대체, 위험 예고 순서, 동작 줄이기 및 렌더링 전후 전투·저장 상태 확인. [배포 전 검사](https://github.com/1hyun-you/loop-game/actions/runs/43250998119) · [공개 게임 검사](https://github.com/1hyun-you/loop-game/actions/runs/43251293039) · [공개 게임 캡처 66장](https://github.com/1hyun-you/loop-game/actions/runs/43251293039/artifacts/13959695792).
- G44-7의 남은 제작·적용 항목 없음. 폴드8 실기기 및 장시간 성능 미검증. 다음 작업은 사용자 지정 묶음의 최신 main·아트 기준·인계·요청 목록 확인부터 시작.
