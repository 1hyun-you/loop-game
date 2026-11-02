'use strict';
/* ============================================================
   설정 — 조정 대상 수치 일괄 관리
   초기값 출처: 초안 0.2l, 본 제작 시험 기록으로 재조정 (0.2: 경험치 곡선·흡수 범위, 0.3: 페이즈 도입에 따른 출현 증가율·적 강화율 하향)
   ============================================================ */
const CFG = {
  VERSION: '0.4',
  DEV: true,
  SAVE_KEY: 'hoegwi_main_v1',
  dprMax: 2,
  viewWidth: 400,                       // 기준 시야 폭(논리 px)
  player: { hp: 100, speed: 150, r: 12, pickup: 70, invuln: 0.5 },
  xp: { base: 5, linear: 5, pow: 1.75, powMul: 0.9 },
  spawn: { base: 1.6, perMin: 2.7, max: 460, soft: 300, softSpan: 250, softMin: 0.35, ramp: 1.25, rampBase: 170 },
  scale: { hpPerMin: 0.45, dmgPerMin: 0.07, speedPerMin: 0.04 },
  gemMerge: 300,
  joyR: 56,
  // 성장 — 기획서: 무기 5칸·보조 효과 5칸, 다시 뽑기·제외 판당 2~3회
  slots: { weapon: 5, passive: 5 },
  weaponMax: 6, passiveMax: 5,
  select: { cards: 3, rerolls: 3, banishes: 2, wupW: 3, wupW3: 1.2, wnewW: 1.2, wnewW3: 1.0, pupW: 2.2, pnewW: 1 },   // 후보 가중치 (3칸 이상 보유 시 W3)
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
    base: { dmg: 18, n: 2, R: 62, rot: 3, size: 12, hitCd: 0.35, kb: 120 },
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
};
const WEAPON_ORDER = ['cleave', 'spin', 'arrow', 'boomerang', 'fireball', 'lightning'];
const START_WEAPON = 'cleave';

/* 보조 효과 4종 (1단계 확정) — 단계당 효과, 최대 5단계 */
const PASSIVES = {
  vit: { name: '최대 체력', ic: '체', per: 20, desc: L => `최대 체력 +${20 * L}` },
  might: { name: '공격력', ic: '공', per: 0.1, desc: L => `모든 피해 +${10 * L}%` },
  swift: { name: '이동 속도', ic: '속', per: 0.08, desc: L => `이동 속도 +${8 * L}%` },
  haste: { name: '재사용 감소', ic: '재', per: 0.06, desc: L => `재사용 대기 -${6 * L}%` },
};
const PASSIVE_ORDER = ['vit', 'might', 'swift', 'haste'];
