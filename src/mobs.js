/* ============================================================
   잡몹 확대·숙련 특성 (0.23, 표현·보강 단계)
   — 잡몹 6종 추가(4→10종): 원거리 사격·분열·자폭·돌진·방패·흔들림 이동
   — 숙련 특성 20종: 무기·보조 효과 전부 최대 후 대체 카드 대신 3지선다(칸 미점유, 종류별 1회)
   ============================================================ */
Object.assign(ENEMIES, {
  gob: { name: '고블린 궁수', hp: 12, speed: 60, dmg: 6, r: 10, color: '#7fbf4a', shape: 'tri', xp: 2, from: 2, w: 1.3, mb: 'shoot' },
  jelly: { name: '분열 젤리', hp: 22, speed: 44, dmg: 8, r: 12, color: '#6ad8f0', shape: 'blob', xp: 2, from: 3, w: 2, mb: 'split' },
  mush: { name: '자폭 버섯', hp: 14, speed: 66, dmg: 8, r: 10, color: '#e8503c', shape: 'blob', xp: 2, from: 4.5, w: 1.4, mb: 'bomb' },
  boar: { name: '돌진 멧돼지', hp: 40, speed: 50, dmg: 14, r: 13, color: '#8a5a3a', shape: 'hex', xp: 3, from: 6, w: 1.4, mb: 'dash' },
  knight: { name: '방패병', hp: 60, speed: 42, dmg: 12, r: 13, color: '#9aa8bc', shape: 'sq', xp: 4, from: 7.5, w: 1.3, mb: 'shield' },
  wisp: { name: '떠도는 불꽃', hp: 10, speed: 105, dmg: 7, r: 9, color: '#b08cf0', shape: 'tri', xp: 2, from: 9, w: 1.8, mb: 'weave' },
});
ENEMY_ORDER.push('gob', 'jelly', 'mush', 'boar', 'knight', 'wisp');
const MOB = {
  shoot: { keep: [140, 200], range: 240, cd: [4, 5.5], sp: 130, dmgK: 0.5 },   // 0.23 1차: 받은 피해 1위(2030, 2위 457) → 2차 1008 → 주기·피해 추가 하향
  bomb: { near: 44, fuse: 0.75, R: 54, dmgK: 2.4 },
  dash: { near: 230, cd: [3, 4.5], tele: 0.55, dur: 0.45, spK: 4.2 },
  shield: { mul: 0.55 },                 // 치명타·출혈은 방패 무시
  split: { n: 2, hpK: 0.3 },
  weave: { amp: 0.9, freq: 3.2 },
};
/* 이동 보정: 기본 추적 속도(sp)를 받아 행동별로 바꾼 속도 반환 (game.js updateEnemies) */
function mobMove(e, dt, sp, d, dx, dy) {
  const k = e.mb;
  if (k === 'shoot') {
    const C = MOB.shoot; e.cd = (e.cd == null ? rand(C.cd[0], C.cd[1]) : e.cd) - dt;
    if (e.cd <= 0 && d < C.range && !G.result) { e.cd = rand(C.cd[0], C.cd[1]); gkShot(e.x, e.y, dx / d * C.sp, dy / d * C.sp, e.dmg * C.dmgK, ENEMIES.gob.name, '#c8ff7a'); }
    return d < C.keep[0] ? -sp * 0.8 : d < C.keep[1] ? 0 : sp;
  }
  if (k === 'bomb') {
    const C = MOB.bomb;
    if (e.fuse != null) { e.fuse -= dt; e.flash = Math.floor(e.fuse * 12) & 1 ? 0.05 : 0; if (e.fuse <= 0) mobBlast(e); return 0; }
    if (d < C.near && !G.result) { e.fuse = C.fuse; gkCircle(e.x, e.y, C.R, C.fuse, e.dmg * C.dmgK, ENEMIES.mush.name); return 0; }
    return sp;
  }
  if (k === 'dash') {
    const C = MOB.dash; e.cd = (e.cd == null ? rand(C.cd[0], C.cd[1]) : e.cd) - dt;
    if (e.dsh > 0) { e.dsh -= dt; e.x += e.ddx * e.speed * C.spK * dt; e.y += e.ddy * e.speed * C.spK * dt; return 0; }
    if (e.tl > 0) { e.tl -= dt; if (e.tl <= 0) e.dsh = C.dur; return 0; }
    if (e.cd <= 0 && d < C.near && !G.result && sp > 0) {
      e.cd = rand(C.cd[0], C.cd[1]); e.tl = C.tele; e.ddx = dx / d; e.ddy = dy / d;
      G.hz.push({ k: 'line', x: e.x, y: e.y, dx: e.ddx, dy: e.ddy, len: e.speed * C.spK * C.dur, w: e.r * 2, warn: C.tele, t: 0, dmg: 0, follow: e });
      return 0;
    }
    return sp;
  }
  if (k === 'weave') { const C = MOB.weave, s = Math.cos(G.time * C.freq + e.id) * sp * C.amp; e.x += -dy / d * s * dt; e.y += dx / d * s * dt; return sp; }
  return sp;
}
function mobBlast(e) { e.dead = true; burst(e.x, e.y, 8, '#ff9a4a', 160, 0.5, 3); }
function mobDmgMul(e, o) { return e.mb === 'shield' && !o.crit && o.src !== 'bleed' ? MOB.shield.mul : 1; }
function mobKilled(e) {
  if (e.mb !== 'split') return;
  const C = MOB.split;
  for (let i = 0; i < C.n; i++) { const a = rand(Math.PI * 2), c = makeEnemy('slime', e.x + Math.cos(a) * 10, e.y + Math.sin(a) * 10); c.hp = c.maxHp = e.maxHp * C.hpK; c.xp = 1; c.kbx = Math.cos(a) * 90; c.kby = Math.sin(a) * 90; }
}

/* ---------- 숙련 특성 ---------- */
const TRAITS = {
  sharp: { nm: '날 세우기', ic: '날', ds: '모든 피해 +6%' },
  tough: { nm: '굳은살', ic: '살', ds: '최대 체력 +25' },
  stride: { nm: '가벼운 발', ic: '발', ds: '이동 속도 +6%' },
  tempo: { nm: '숨 고르기', ic: '숨', ds: '재사용 시간 -5%' },
  giant: { nm: '거인 사냥', ic: '거', ds: '대형 적·엘리트·보스 피해 +15%' },
  execute: { nm: '마무리', ic: '끝', ds: '체력 25% 이하 적에게 피해 +25%' },
  first: { nm: '첫 일격', ic: '첫', ds: '체력이 가득 찬 적에게 피해 +30%' },
  last: { nm: '최후의 저항', ic: '저', ds: '내 체력 30% 이하일 때 피해 +20%' },
  armor: { nm: '강철 피부', ic: '철', ds: '받는 피해 -8%' },
  dodge: { nm: '회피 본능', ic: '피', ds: '6% 확률로 피해 무시' },
  calm: { nm: '냉정', ic: '냉', ds: '보스전 중 받는 피해 -10%' },
  guard: { nm: '버티기', ic: '버', ds: '피격 후 무적 시간 +0.2초' },
  leech: { nm: '피의 갈증', ic: '갈', ds: '처치 시 5% 확률로 체력 2 회복' },
  hunter: { nm: '사냥꾼의 보상', ic: '사', ds: '엘리트 처치 시 체력 15 회복' },
  breath: { nm: '응급 호흡', ic: '호', ds: '10초마다 체력 3 회복' },
  magnet: { nm: '자석 손', ic: '자', ds: '경험치 흡수 범위 +25%' },
  study: { nm: '배움', ic: '배', ds: '획득 경험치 +8%' },
  focus: { nm: '집중', ic: '집', ds: '궁극기 충전 +15%' },
  chain: { nm: '연쇄 폭발', ic: '폭', ds: '처치 시 8% 확률로 주변 소폭발' },
  luck: { nm: '행운', ic: '운', ds: '즉시 다시 뽑기 +1·제외 +1' },
};
const TRAIT_ORDER = Object.keys(TRAITS);
const tr = k => !!(G.p.tr && G.p.tr[k]);
function traitCands(exclude) { const t = G.p.tr || {}; return shuffle(TRAIT_ORDER.filter(k => !t[k] && !exclude.some(x => x.t === 'trait' && x.id === k))).map(id => ({ t: 'trait', id })); }
function applyTrait(k) {
  const p = G.p; (p.tr = p.tr || {})[k] = 1; (G.stats.traits = G.stats.traits || []).push(k);
  if (k === 'luck') { G.rerolls++; G.banishes++; }
  toast('숙련 특성 · ' + TRAITS[k].nm, '#c8b0ff');
}
/* 능력치 반영 (recalc에서 호출) */
function traitMod(p) {
  if (!p.tr) return;
  if (p.tr.sharp) p.mod.dmg *= 1.06;
  if (p.tr.stride) p.mod.speed *= 1.06;
  if (p.tr.tempo) p.mod.cd = Math.max(0.4, p.mod.cd * 0.95);
  if (p.tr.tough) p.maxHp += 25;
}
function traitDmgMul(e) {
  const p = G.p; if (!p.tr) return 1; let m = 1;
  if (p.tr.giant && (e.r >= 16 || e.elite || e.boss)) m *= 1.15;
  if (p.tr.execute && e.hp <= e.maxHp * 0.25) m *= 1.25;
  if (p.tr.first && e.hp >= e.maxHp) m *= 1.3;
  if (p.tr.last && p.hp <= p.maxHp * 0.3) m *= 1.2;
  return m;
}
function traitHurtMul() { const p = G.p; if (!p.tr) return 1; return (p.tr.armor ? 0.92 : 1) * (p.tr.calm && isBossPhase() ? 0.9 : 1); }
function traitAvoid() { return tr('dodge') && Math.random() < 0.06; }
function traitKill(e) {
  const p = G.p; if (!p.tr) return;
  if (p.tr.leech && Math.random() < 0.05) heal(2);
  if (p.tr.hunter && e.elite) heal(15);
  if (p.tr.chain && Math.random() < 0.08) { const x = e.x, y = e.y; G.later.push({ t: 0, f: () => explode(x, y, 40, 10 * p.mod.dmg * (1 + G.time / 600), 'trait', '#c8b0ff') }); }
}
function updateTraits(dt) { const p = G.p; if (!p.tr || !p.tr.breath) return; p.brT = (p.brT || 0) + dt; if (p.brT >= 10) { p.brT = 0; heal(3); } }

/* 잡몹 6종 도트 (밝은 판타지 레트로, 2프레임) */
Object.assign(SPR, {
  gob: { px: 2, frames: [[
    '...kkkkk....', '..kgggggk...', '.kgwkgwkgk.n', '.kgggggggknn', '..kGGGGGk.n.',
    '..knnnnnk.n.', '.knnNNNnnkn.', '..knnnnnk...', '..kGk.kGk...', '..kk...kk...',
  ], [
    '...kkkkk....', '..kgggggk...', '.kgwkgwkgk.n', '.kgggggggknn', '..kGGGGGk.n.',
    '..knnnnnk.n.', '.knnNNNnnkn.', '..knnnnnk...', '.kGk...kGk..', '.kk.....kk..',
  ]] },
  jelly: { px: 2, frames: [[
    '....kkkk....', '..kkwcccck..', '.kwcccccccck', 'kcccccccccck', 'kckkcccckkck',
    'kcccccccccck', 'kcccMMMMccck', '.kcccccccck.', '..kkkkkkkk..',
  ], [
    '............', '....kkkk....', '.kkwcccccck.', 'kcccccccccck', 'kckkcccckkck',
    'kcccccccccck', 'kcccMMMMccck', '.kccccccccck', '..kkkkkkkkk.',
  ]] },
  mush: { px: 2, frames: [[
    '...kkkkkk...', '.kkrrwrrrkk.', 'krrwrrrrwrrk', 'krrrrrwrrrrk', 'kRRRRRRRRRRk',
    '.kkkkkkkkkk.', '...keeeek...', '...kekkek...', '...keeeek...', '....kkkk....',
  ], [
    '............', '...kkkkkk...', '.kkrrwrrrkk.', 'krrwrrrrwrrk', 'kRRRRRRRRRRk',
    '.kkkkkkkkkk.', '...keeeek...', '...kekkek...', '...keeeek...', '....kkkk....',
  ]] },
  boar: { px: 2, frames: [[
    '............', '..kkkkkkk...', '.kNnnnnnnkk.', 'kNnnnnnnnnnk', 'kNnnnnnnkwnk',
    'kNnnnnnnnnek', '.kNNNNNNNkwk', '..kNk..kNk..', '..kk....kk..',
  ], [
    '............', '..kkkkkkk...', '.kNnnnnnnkk.', 'kNnnnnnnnnnk', 'kNnnnnnnkwnk',
    'kNnnnnnnnnek', '.kNNNNNNNkwk', '.kNk....kNk.', '.kk......kk.',
  ]] },
  knight: { px: 2, frames: [[
    '...kkkkk....', '..kMMMMMk...', '..kMkkkMk...', '..kMMMMMkkk.', '.kmMMMMkuuuk',
    '.kmMMMMkuyuk', '.kmmmmmkuuuk', '..kmmmmkkkk.', '..kmk.kmk...', '..kkk.kkk...',
  ], [
    '...kkkkk....', '..kMMMMMk...', '..kMkkkMk...', '..kMMMMMkkk.', '.kmMMMMkuuuk',
    '.kmMMMMkuyuk', '.kmmmmmkuuuk', '..kmmmmkkkk.', '.kmk...kmk..', '.kkk...kkk..',
  ]] },
  wisp: { px: 2, frames: [[
    '.....k....', '....kuk...', '...kuuuk..', '..kuwwwuk.', '.kuwkwkwuk',
    '.kuwwwwwuk', '.kuuwwwuuk', '..kuuuuuk.', '...kuUuk..', '....kUk...',
  ], [
    '....k.....', '...kuk....', '..kuuuk...', '..kuwwwuk.', '.kuwkwkwuk',
    '.kuwwwwwuk', '.kuuwwwuuk', '..kuuuuuk.', '..kuUuk...', '...kUk....',
  ]] },
});
