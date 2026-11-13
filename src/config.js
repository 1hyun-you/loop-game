'use strict';
/* ============================================================
   설정 — 조정 대상 수치 일괄 관리
   초기값 출처: 초안 0.2l, 본 제작 시험 기록으로 재조정 (0.2: 경험치 곡선·흡수 범위, 0.3: 페이즈 도입에 따른 출현 증가율·적 강화율 하향)
   ============================================================ */
const CFG = {
  VERSION: '0.46-art5',
  DEV: true,
  SAVE_KEY: 'hoegwi_main_v1',
  dprMax: 2,
  viewWidth: 400,                       // 기준 시야 폭(논리 px)
  player: { hp: 100, speed: 150, r: 12, pickup: 70, invuln: 0.5 },
  xp: { base: 5, linear: 5, pow: 1.75, powMul: 0.9 },
  spawn: { base: 1.6, perMin: 2.7, max: 460, soft: 300, softSpan: 250, softMin: 0.35, ramp: 1.25, rampBase: 170 },
  scale: { hpPerMin: 0.45, dmgPerMin: 0.07, speedPerMin: 0.04 },
  early: { phases: 2, hp: 0.8, spawn: 0.8, xp: 1.25 },   // 0.16 초반 완화: 첫 2페이즈(예고 구간 포함) 적 체력·출현 밀도 하향, 경험치 획득 증가(레벨업 간격 단축)
  gemMerge: 300,
  joyR: 56,
  // 성장 — 기획서: 무기 5칸·보조 효과 5칸, 다시 뽑기·제외 판당 2~3회
  slots: { weapon: 5, passive: 5 },
  weaponMax: 6, passiveMax: 5,
  select: { cards: 3, rerolls: 3, banishes: 2, wupW: 3, wupW3: 1.2, wnewW: 1.2, wnewW3: 1.0, pupW: 2.2, pnewW: 1, wnewPool: 10 },   // 후보 가중치 (3칸 이상 보유 시 W3)
  fill: { heal: 30, power: 0.04 },      // 후보 소진 시 대체 카드
  colors: { melee: '#e0655a', ranged: '#5fbf6a', magic: '#5f8fe8', passive: '#d6b45a' },
};
const CAT_NAME = { melee: '근접', ranged: '원거리', magic: '마법' };

/* 적 — 1단계: 근접형 4종 (원거리형은 적 탄환 도입 시 추가) */
const ENEMIES = {
  slime: { name: '초록 슬라임', hp: 9, speed: 46, dmg: 6, r: 10, color: '#5cc46b', shape: 'blob', xp: 1, from: 0, w: 5 },
  bat: { name: '동굴 박쥐', hp: 5, speed: 92, dmg: 5, r: 8, color: '#9a7be0', shape: 'tri', xp: 1, from: 0, w: 3 },
  skel: { name: '해골 병사', hp: 18, speed: 58, dmg: 9, r: 11, color: '#ddd6c2', shape: 'sq', xp: 2, from: 1.5, w: 4 },
  brute: { name: '오우거', hp: 70, speed: 40, dmg: 16, r: 18, color: '#c27a40', shape: 'hex', xp: 6, from: 3.5, w: 1 },
};
const ENEMY_ORDER = ['slime', 'bat', 'skel', 'brute'];

/* ============================================================
   무기 6종 (1단계 확정) — 계열별 2종
   base: 1레벨 수치 · ups: 2~6레벨 강화 내용 (설명문은 수치에서 자동 생성)
   강화 키: dmg 피해 비율, area 범위 비율, cd 재사용 감소 비율, n 개수, pierce 관통, rot 회전 속도 비율
   초기 수치 출처: 초안 0.2l, 0.2 시험 1~2차 조정(회전검·화살·번개 상향, 대검 베기·부메랑 도끼 하향), 0.2a 부메랑 왕복 1회 타격·피해 하향, 화살 관통 보강, 번개 상향, 화염구 하향, 0.2b 부메랑 구간별 타격 상한 6(5레벨 +2)·피해 10, 2차 화살 17→15·회전검 16→18·번개 26→28
   ============================================================ */
const WEAPONS = {
  cleave: { name: '대검 베기', cat: 'melee', ic: '검', desc: '가까운 적 방향 부채꼴 베기',
    base: { dmg: 19, cd: 1.25, range: 86, arc: 1.9, kb: 180 },
    ups: [{ dmg: 0.3 }, { area: 0.15 }, { cd: 0.15 }, { dmg: 0.3 }, { area: 0.1, dmg: 0.2 }] },
  spin: { name: '회전검', cat: 'melee', ic: '회', desc: '캐릭터 주변을 도는 검',
    base: { dmg: 14, n: 2, R: 62, rot: 3, size: 12, hitCd: 0.35, kb: 120 },
    ups: [{ n: 1 }, { dmg: 0.3 }, { n: 1 }, { rot: 0.3 }, { n: 1, dmg: 0.2 }] },
  arrow: { name: '화살', cat: 'ranged', ic: '활', desc: '가장 가까운 적에게 직선 발사',
    base: { dmg: 15, cd: 0.95, n: 1, pierce: 1, sp: 540, life: 1.1 },
    ups: [{ n: 1 }, { dmg: 0.3, pierce: 1 }, { cd: 0.15 }, { n: 1 }, { dmg: 0.3, pierce: 1 }] },
  boomerang: { name: '부메랑 도끼', cat: 'ranged', ic: '도', desc: '던졌다 되돌아오며 왕복 타격',
    base: { dmg: 10, cd: 2.0, n: 1, size: 12, sp: 380, pierce: 6 },   // pierce: 가는 길·돌아오는 길 구간별 타격 수 상한
    ups: [{ dmg: 0.3 }, { area: 0.25 }, { n: 1 }, { dmg: 0.3, pierce: 2 }, { cd: 0.15 }] },
  fireball: { name: '화염구', cat: 'magic', ic: '화', desc: '착탄 시 폭발',
    base: { dmg: 12, cd: 1.4, n: 1, R: 54, sp: 300 },
    ups: [{ dmg: 0.3 }, { area: 0.15 }, { n: 1 }, { cd: 0.15 }, { dmg: 0.3 }] },
  lightning: { name: '번개', cat: 'magic', ic: '번', desc: '무작위 적에게 낙뢰',
    base: { dmg: 28, cd: 1.25, n: 1, range: 360 },
    ups: [{ n: 1 }, { dmg: 0.3 }, { cd: 0.15 }, { n: 1 }, { dmg: 0.3 }] },
  /* 3단계 추가 6종 (0.8) — 기획서 무기 12종 표 */
  shield: { name: '방패 충격', cat: 'melee', ic: '방', desc: '주변 적을 크게 밀쳐내는 충격',
    base: { dmg: 22, cd: 2.4, R: 82, kb: 420 },
    ups: [{ dmg: 0.3 }, { area: 0.15 }, { cd: 0.15 }, { dmg: 0.3 }, { area: 0.15, dmg: 0.2 }] },
  slam: { name: '대지 강타', cat: 'melee', ic: '강', desc: '주기적으로 넓은 원형 충격파',
    base: { dmg: 26, cd: 3.0, R: 125, kb: 150 },
    ups: [{ dmg: 0.3 }, { cd: 0.15 }, { area: 0.15 }, { dmg: 0.3 }, { cd: 0.1, dmg: 0.2 }] },
  knife: { name: '투척 단검', cat: 'ranged', ic: '단', desc: '이동 방향으로 단검 연사',
    base: { dmg: 11, cd: 0.42, n: 1, pierce: 0, sp: 620, life: 0.75 },
    ups: [{ n: 1 }, { dmg: 0.3 }, { cd: 0.15 }, { n: 1, pierce: 1 }, { dmg: 0.3 }] },
  trap: { name: '덫', cat: 'ranged', ic: '덫', desc: '지나간 자리에 덫 설치, 밟은 적 주변 폭발',
    base: { dmg: 24, cd: 1.5, n: 1, R: 52, max: 8 },
    ups: [{ dmg: 0.3 }, { area: 0.2 }, { n: 1 }, { cd: 0.15 }, { dmg: 0.3, n: 1 }] },
  icering: { name: '얼음 고리', cat: 'magic', ic: '빙', desc: '주변 냉기 고리, 적 둔화·지속 피해',
    base: { dmg: 8, cd: 0.5, R: 72 },
    ups: [{ dmg: 0.3 }, { area: 0.15 }, { dmg: 0.3 }, { area: 0.15 }, { dmg: 0.4 }] },
  orb: { name: '마력 구체', cat: 'magic', ic: '구', desc: '적을 추적하는 유도 구체',
    base: { dmg: 20, cd: 1.1, n: 1, sp: 270, life: 2.4 },
    ups: [{ n: 1 }, { dmg: 0.3 }, { cd: 0.15 }, { n: 1 }, { dmg: 0.3 }] },
};
const WEAPON_ORDER = ['cleave', 'spin', 'shield', 'slam', 'arrow', 'boomerang', 'knife', 'trap', 'fireball', 'lightning', 'icering', 'orb'];
const START_WEAPON = 'cleave';
const START_POOL = ['cleave', 'spin', 'arrow', 'boomerang', 'fireball', 'lightning'];   // 0.24 시작 무기 3지선다 후보 (1단계 공용 무기 6종)

/* 보조 효과 8종 — 1단계 4종 + 3단계 4종, 단계당 효과, 최대 5단계 */
const PASSIVES = {
  vit: { name: '최대 체력', ic: '체', per: 20, desc: L => `최대 체력 +${20 * L}` },
  might: { name: '공격력', ic: '공', per: 0.1, desc: L => `모든 피해 +${10 * L}%` },
  swift: { name: '이동 속도', ic: '속', per: 0.08, desc: L => `이동 속도 +${8 * L}%` },
  haste: { name: '재사용 감소', ic: '재', per: 0.06, desc: L => `재사용 대기 -${6 * L}%` },
  /* 3단계 추가 4종 (0.8) */
  area: { name: '공격 범위', ic: '범', per: 0.08, desc: L => `모든 무기 범위 +${8 * L}%` },
  multi: { name: '투사체 수', ic: '투', per: 0.03, desc: L => `개수형 무기 개수 +${multiN(L)}, 해당 무기 피해 +${3 * L}%` },
  magnet: { name: '경험치 흡수', ic: '흡', per: 0.3, desc: L => `경험치 흡수 범위 +${30 * L}%` },
  regen: { name: '체력 회복', ic: '생', per: 0.25, desc: L => `초당 체력 ${(0.25 * L).toFixed(2)} 회복` },
};
const PASSIVE_ORDER = ['vit', 'might', 'swift', 'haste', 'area', 'multi', 'magnet', 'regen'];
function multiN(L) { return L >= 5 ? 2 : L >= 2 ? 1 : 0; }   // 0.26 하향 (1→2단계부터 +1, 3→5단계에 +2)
