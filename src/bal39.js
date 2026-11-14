/* ============================================================
   밸런스 패치 (0.39, 표현·보강 단계) — 수치 외 판정·구조 조정
   회차 43 확정(2026-11-06) 초안 12항목 반영
   — 판정: 적 탄환 대상 플레이어 판정 축소, 연속 피격 무적 연장, 수리검 튕김 감쇠, 회오리 중첩 제외, 폭탄 대상 근거리 밀집
   — 구조: 혼령 추적탄 격추, 대검 3타 강타, 얼음 고리 냉기 파쇄, 방패 중심 피해·이중 충격 재설계, 빛줄기 관통 연장, 초반 밀쳐냄
   ============================================================ */
const BAL = { bulletHit: 0.55, chainWin: 1, chainInv: 1.0, cleave3: { area: 1.4, dmg: 2 }, chill: { need: 4, mul: 1.2, R: 36 }, shieldCore: 0.6, beamExt: 0.1, beamExtMax: 5, starDecay: 0.9, earlyPush: 120 };

/* 판정: 적 탄환 대상 플레이어 판정 반지름 (p.r × 0.7 → 0.55) — 탄환 판정 함수는 boss.js updateBossFx 안 계수 교체 */
/* 판정: 1초 안 두 번째 피격 시 무적 1.0초 · 초반 2분 접촉 적 밀쳐냄 */
const _hurt39 = hurtPlayer;
hurtPlayer = function (dmg, src, e) {
  const p = G.p, h0 = p.hp, inv0 = p.invT;
  _hurt39(dmg, src, e);
  if (p.hp < h0) {
    if (G.time - (G.lastHurtT || -9) < BAL.chainWin) p.invT = Math.max(p.invT, BAL.chainInv);
    G.lastHurtT = G.time;
  }
  if (e && G.time < BAL.earlyPush && !e.gk && !e.cmd && inv0 <= 0) { const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1; e.kbx = (e.kbx || 0) + dx / d * 260; e.kby = (e.kby || 0) + dy / d * 260; }
};

/* 구조: 마왕 혼령 추적탄 격추 — 근접 무기 타격 지점·플레이어 폭발 범위 안 혼령 소멸 */
function killSouls(x, y, R) {
  if (!G.eb || !G.eb.length) return;
  for (const b of G.eb) if (b.life > 0 && b.src === '마왕 혼령' && dist2(b.x, b.y, x, y) < (R + b.r) ** 2) { b.life = 0; fx({ kind: 'pop', x: b.x, y: b.y, r: 8, color: '#c9a8ff', dur: 0.2 }); G.stats.souls = (G.stats.souls || 0) + 1; }
}
const _explode39 = explode;
explode = function (x, y, R, dmg, src, color, engineerArt, mageArt) { _explode39(x, y, R, dmg, src, color, engineerArt, mageArt); killSouls(x, y, R); };
const _shieldBash39 = shieldBash;
shieldBash = function (x, y, R, dmg, kb, sovereignBase) {
  // 방패 중심 피해: 가까운 적일수록 피해 증가 (중심 최대 +60%)
  gridQuery(x, y, R, e => { const d = Math.sqrt(dist2(e.x, e.y, x, y)); e._sc = 1 + BAL.shieldCore * Math.max(0, 1 - d / R); });
  G._shieldCore = true; try { _shieldBash39(x, y, R, dmg, kb, sovereignBase); } finally { G._shieldCore = false; }
  killSouls(x, y, R);
};
const _slamWave39 = slamWave;
slamWave = function (x, y, R, dmg, kb) { _slamWave39(x, y, R, dmg, kb); killSouls(x, y, R); };
const _slash39 = slash;
slash = function (a0, arc, range, dmg, kb, basicWeapon) {
  _slash39(a0, arc, range, dmg, kb, basicWeapon);
  const p = G.p; if (!G.eb || !G.eb.length) return;
  for (const b of G.eb) { if (b.life <= 0 || b.src !== '마왕 혼령') continue; const dx = b.x - p.x, dy = b.y - p.y; if (dx * dx + dy * dy > (range + b.r) ** 2) continue; let da = Math.atan2(dy, dx) - a0; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) <= arc / 2 + 0.15) killSouls(b.x, b.y, 1); }
};
const _updateSpin39 = updateSpin;
updateSpin = function (w, S, dt) {
  _updateSpin39(w, S, dt);
  const p = G.p; if (!G.eb || !G.eb.length) return;
  for (let i = 0; i < w.n; i++) { const a = w.a + i * Math.PI * 2 / w.n; killSouls(p.x + Math.cos(a) * w.R, p.y + Math.sin(a) * w.R, w.bs); }
};
const _updateArsenal39 = updateArsenal;
updateArsenal = function (dt) {
  _updateArsenal39(dt);
  const p = G.p;
  for (const w of p.weapons) if (w.sw && w.sw.R) for (let i = 0; i < w.sw.n; i++) { const a = w.sw.a + i * Math.PI; killSouls(p.x + Math.cos(a) * w.sw.R, p.y + Math.sin(a) * w.sw.R, w.sw.bs); }
};

/* 구조: 대검 베기 3타째 강타 (범위 1.4배·피해 2배) */
const _cleave39 = AW_BASE.cleave;
AW_BASE.cleave = function (w, S) {
  w.c3 = ((w.c3 || 0) + 1) % 3;
  if (w.c3 !== 0) return _cleave39(w, S);
  const S2 = Object.assign({}, S, { area: S.area * BAL.cleave3.area, dmg: S.dmg * BAL.cleave3.dmg });
  const r = _cleave39(w, S2); shake(1.5, 0.1); return r;
};

/* 피해 감싸기: 방패 중심 배율 · 얼음 고리 냉기 누적 · 빛줄기 관통 연장 */
const _damage39 = damageEnemy;
damageEnemy = function (e, dmg, o = {}) {
  if (e.dead) return;
  const src = o.src;
  if (src === 'shield' && G._shieldCore && e._sc) dmg *= e._sc;
  if (src === 'beam') { const w = wObj('beam'); if (w && w.bm) { const b = w.bm; b.seen = b.seen || new Set(); if (!b.seen.has(e.id) && b.seen.size < BAL.beamExtMax) { b.seen.add(e.id); b.dur += BAL.beamExt; } } }
  _damage39(e, dmg, o);
  if (src === 'icering' && !e.dead) {
    e.chl = (e.chl || 0) + 1;
    if (e.chl >= BAL.chill.need) { e.chl = 0; const x = e.x, y = e.y, d = dmg * BAL.chill.mul; fx({ kind: 'ring', x, y, r0: 6, r1: BAL.chill.R, dur: 0.22, color: '#bfe8ff', fill: true }); G.later.push({ t: 0, f: () => gridQuery(x, y, BAL.chill.R, t => damageEnemy(t, d, { src: 'icering_x' })) }); }
  }
};
Object.assign(SRC_CAT, { icering_x: 'magic' }); Object.assign(ELEM, { icering_x: 'ice' });
WEAPONS.icering.desc = '주변 냉기 고리, 적 둔화·지속 피해, 4회 누적 시 냉기 파쇄';
WEAPONS.shield.desc = '주변 적을 크게 밀쳐내는 충격, 가까운 적일수록 피해 증가';
WEAPONS.cleave.desc = '가까운 적 방향 부채꼴 베기, 3타째 강타 (범위 1.4배·피해 2배)';
WEAPONS.beam.desc = '가까운 적 방향으로 0.6초간 꿰뚫는 광선, 관통한 적 1체당 지속 +0.1초 (최대 +0.5초)';

/* 판정: 수리검 튕길 때마다 피해 10% 감쇠 */
const _bounce39 = bounceProj;
bounceProj = function (pr, e) { _bounce39(pr, e); if (!pr.dead) pr.dmg *= BAL.starDecay; };
WEAPONS.shuriken.desc = '명중할 때마다 다음 적에게 튕기는 수리검, 튕길 때마다 피해 -10%';

/* 방패 이중 충격 분기 재설계: 0.4초 뒤 범위 140% 2차 충격 (피해 50% → 90%) */
(function () { const o = BRANCHES.shield.find(x => x.k === 'twin'); if (o) o.ds = '0.4초 뒤 범위 140% 2차 충격 (피해 90%)'; })();
