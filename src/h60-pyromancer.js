/* ============================================================
   0.66 화염술사 구현 (회차 97, 분할 구현 7차) — 기준: docs/characters/pyromancer.md
   • 고유 규칙(연성형): "화염구·연성 무기에 맞은 적이 불붙음" — 불 3초·매초 화염구 피해 10%, 화염술사 전용 상태 (옮겨붙음·번짐 없음)
   • 전용 무기 화염구: 발현 A 큰 불꽃 → 무기 각성 A 불기둥 / 발현 B 불의 창 → 무기 각성 B 폭렬 창
   • 궁극기: 기본 화염 해방 / 인물 각성 A 불 거두기 + 불사조 / 인물 각성 B 불티 + 거대 불덩이
   • 연성 7종: 불꽃 대검·X자 불칼금·불씨살·불꽃 정령·화염 등불·뜨거운 숨·불넝쿨 (7종 전부 불붙음, 색은 같게 두고 모양으로 구분)
   • 그림: 새 장면은 임시 도형 (최종본 아님, GPT 요청 대상), 수치는 전부 가안 (대규모 밸런스 단계 조정)
   ============================================================ */
const P66C = {
  burn: { dur: 3, k: 0.1, tick: 1 },                                                 // 불붙음: 3초·매초 화염구 피해 10%
  fb: { range: 260, R: 35, sp: 300 },                                                // 화염구: 1.2초마다·사거리 260·폭발 반경 35·피해 18
  big: { R: 1.6 },                                                                   // 발현 A 큰 불꽃: 폭발 반경 +60%
  pillar: { every: 4, dur: 1.5, R: 50, tick: 0.3, k: 0.4 },                          // 무기 각성 A 불기둥: 4번째 발동마다 1.5초·반경 50·0.3초마다 40%
  spear: { k: 1.3, sp: 460, w: 10 },                                                 // 발현 B 불의 창: 일직선 관통·피해 +30%
  burst: { every: 3, late: 1, R: 90, k: 2.5 },                                       // 무기 각성 B 폭렬 창: 3번째 발동마다 박힌 자리 1초 뒤 폭발 반경 90·250%
  ember: { max: 5, size: 0.15, dmg: 0.1 },                                           // 인물 각성 A 불 거두기: 최대 5개, 개당 크기·반경 +15%·피해 +10%
  spark: { n: 3, R: 90, k: 0.2, gap: 0.12, cd: 0.5 },                                // 인물 각성 B 불티: 3번 튐·반경 90·화염구 피해 20% (같은 적에서 0.5초에 1번, 가안)
  free: { k: 2 },                                                                    // 화염 해방: 화면 절반·무기 기준 2배
  phoenix: { dur: 6, pass: 3, k: 1.5, w: 60 },                                       // 불사조: 6초 동안 화면 3번 가로지름·지나간 적 화염구 피해 1.5배 (폭 60, 가안)
  meteor: { n: 10, R: 80, k: 2.5, gap: 0.25, look: 300 },                            // 거대 불덩이: 10번 튐·반경 80·화염구 피해 250%·적 많은 쪽 우선
  blade: { cd: 1.25, range: 130, arc: 150 * Math.PI / 180, dmg: 19 },               // 불꽃 대검
  xcut: { cd: 0.9, range: 220, dmg: 14, late: 0.2, k: 0.6 },                         // X자 불칼금
  ember66: { cd: 1.0, range: 300, dmg: 16, maxK: 1.8, w0: 24, w1: 40, sp: 420 },     // 불씨살: 가장 먼 적, 날아간 거리에 따라 최대 180%·폭 24 → 40
  spirit: { cd: 4, max: 3, life: 10, guard: 160, atk: 1.2, dmg: 12, sp: 420, dist: 34 },   // 불꽃 정령
  lamp: { n: 2, range: 140, tick: 0.25, dmg: 5, up: 0.25, max: 2 },                  // 화염 등불
  breath: { cd: 3, R1: 140, R2: 200, late: 0.3, k2: 0.6, stun: 0.2 },                // 뜨거운 숨
  vine: { cd: 1.3, range: 200, dmg: 15, tick: 0.25, tk: 4, root: 1, R: 35 },          // 불넝쿨: 처음 15 + 묶인 1초 동안 0.25초마다 4
};
const Pg = () => G.p66 || (G.p66 = { burn: [], embers: 0, pillars: [], spears: [], arrows: [], spirits: [], vines: [], booms: [], links: [], cuts: [], phoenix: null, meteor: null, nCast: 0 });
const isP66 = () => G.p && G.p.job === 'pyromancer' && HERO60.pyromancer.impl;
const PCOL = () => HERO60.pyromancer;
const pk66 = (w, S) => S.dmg / WEAPONS[w.id].base.dmg;                              // 짝 무기 강화·보조 효과 배율
const pc66 = (w, S) => S.cd / WEAPONS[w.id].base.cd;
const fbD66 = () => { const b = baseW(); return b ? wStats(b).dmg : WEAPONS.fireball.base.dmg; };   // 화염구 피해 (불붙음·불티·궁극기 기준)
const ref66 = () => { const b = baseW(); if (!b) return 15; const S = wStats(b); return S.dmg / Math.max(0.05, S.cd); };   // 무기 기준 = 화염구 초당 피해 (가안, 사령술사·엔지니어와 같은 방식)

/* ---------- 불붙음 (화염술사 전용 상태) ---------- */
function burn66(e) {
  if (e.dead) return; const P = Pg(), now = G.time;
  if (!(e.p66b > now)) { P.burn.push(e); e.p66t = now + P66C.burn.tick; }
  e.p66b = now + P66C.burn.dur; const S6 = S60(); S6.burnN = (S6.burnN || 0) + 1;
}
const burning66 = e => e.p66b > G.time;
/* 화염술사 불 공격 1회 적중: 피해 + 불붙음, 불티(인물 각성 B) = 이미 불붙은 적을 또 맞히면 */
function hit66(e, d, src, o) {
  if (e.dead) return; const was = burning66(e);
  damageEnemy(e, d, Object.assign({ src }, o || {}));
  if (e.dead) return;
  burn66(e);
  if (was && G.p.job2 === 'B' && G.time - (e.p66s || -9) >= P66C.spark.cd) { e.p66s = G.time; spark66(e); }
}
function burnTick66() {
  const P = Pg(), now = G.time; if (!P.burn.length) return;
  const d = fbD66() * P66C.burn.k;
  for (const e of P.burn) { if (e.dead || !(e.p66b > now)) continue; if (now >= e.p66t) { e.p66t += P66C.burn.tick; damageEnemy(e, d, { src: 'burn66' }); } }
  P.burn = P.burn.filter(e => !e.dead && e.p66b > now);
}
function spark66(e) {                                                                  // 불티: 통통 3번 튀며 불을 옮김 (반경 90 안 불 안 붙은 가장 가까운 적)
  const C = P66C.spark, d = fbD66() * C.k, ctx = CR60; let cur = e, k = 0;
  const hop = () => {
    if (G.result || k >= C.n) return; let best = null, bd = C.R * C.R;
    gridQuery(cur.x, cur.y, C.R, o => { if (o === cur || o.dead || burning66(o)) return; const dd = dist2(o.x, o.y, cur.x, cur.y); if (dd < bd) { bd = dd; best = o; } });
    if (!best) return; Pg().links.push({ x: cur.x, y: cur.y, tx: best.x, ty: best.y, t: 0, dur: 0.18, spark: 1 });
    withCR60(ctx, () => damageEnemy(best, d, { src: 'fireball' })); burn66(best); S60().spark = (S60().spark || 0) + 1;
    cur = best; k++; G.later.push({ t: C.gap, f: hop });
  };
  hop();
}

/* ---------- 전용 무기 화염구 ---------- */
function pFire66(w, S) {
  const C = P66C, P = Pg(), p = G.p, range = C.fb.range * S.area, tg = nearestEnemy(p.x, p.y, range); if (!tg) return false;
  P.nCast++; const a0 = Math.atan2(tg.y - p.y, tg.x - p.x), em = G.p.job2 === 'A' ? P.embers : 0;   // 불 거두기: 모인 불꽃이 다음 화염구에 실림
  const kS = 1 + C.ember.size * em, kD = 1 + C.ember.dmg * em; if (em) { P.embers = 0; S60().emberUse = (S60().emberUse || 0) + em; }
  if (w.br === 'B') {                                                                // 불의 창: 일직선 관통 (무기 각성 B: 3번째마다 박힌 자리 폭발)
    const bomb = w.aw === 'B' && P.nCast % C.burst.every === 0;
    for (let i = 0; i < S.n; i++) P.spears.push({ x: p.x, y: p.y - 4, a: a0 + (i - (S.n - 1) / 2) * 0.12, d: 0, max: range * 1.1, dmg: S.dmg * C.spear.k * kD, w: C.spear.w * kS, hit: new Set(), cr: CR60, bomb: bomb && i === 0, R: C.burst.R * S.area * kS, last: null });
    return;
  }
  const R = C.fb.R * S.area * (w.br === 'A' ? C.big.R : 1) * kS, pil = w.aw === 'A' && P.nCast % C.pillar.every === 0, dmg = S.dmg * kD;
  for (let i = 0; i < S.n; i++) shoot({ kind: 'fire', x: p.x, y: p.y, ang: a0 + (i - (S.n - 1) / 2) * 0.25, sp: C.fb.sp, r: 8 * kS, dmg, R, life: range / C.fb.sp, color: PCOL().col, src: 'fireball', p66: 1,
    on44: pr => { const x = pr.x, y = pr.y; withCR60(pr.cr60 || null, () => gridQuery(x, y, pr.R, e => hit66(e, pr.dmg, 'fireball', { kb: 80, fx: x, fy: y })));
      P.booms.push({ x, y, R: pr.R, t: 0, dur: 0.3 }); if (pil && i === 0) { P.pillars.push({ x, y, t: 0, tk: 0, R: C.pillar.R * S.area * kS, d: S.dmg * C.pillar.k * kD, cr: pr.cr60 }); S60().pillar = (S60().pillar || 0) + 1; } } });
}
function spearTick66(dt) {
  const P = Pg(), C = P66C;
  for (const s of P.spears) {
    const st = C.spear.sp * dt; s.x += Math.cos(s.a) * st; s.y += Math.sin(s.a) * st; s.d += st;
    gridQuery(s.x, s.y, s.w, e => { if (s.hit.has(e) || e.dead) return; s.hit.add(e); s.last = e; withCR60(s.cr, () => hit66(e, s.dmg, 'fireball', { kb: 30, fx: s.x, fy: s.y })); });
    if (s.d >= s.max) { s.dead = true;
      if (s.bomb) { const x = s.last && !s.last.dead ? s.last.x : s.x, y = s.last && !s.last.dead ? s.last.y : s.y, d = s.dmg / C.spear.k * C.burst.k, R = s.R, cr = s.cr;   // 폭렬 창: 마지막으로 꿰뚫은 적(없으면 끝 지점)에 박혀 1초 뒤 폭발 (가안)
        P.booms.push({ x, y, R: 10, t: 0, dur: C.burst.late, stuck: 1 });
        G.later.push({ t: C.burst.late, f: () => { if (G.result) return; withCR60(cr, () => gridQuery(x, y, R, e => hit66(e, d, 'fireball', { kb: 120, fx: x, fy: y }))); P.booms.push({ x, y, R, t: 0, dur: 0.4, big: 1 }); shake(2.5, 0.15); S60().burstSp = (S60().burstSp || 0) + 1; } }); } }
  }
  P.spears = P.spears.filter(s => !s.dead);
  for (const o of P.pillars) {                                                       // 불기둥: 기둥 안 적 0.3초마다 40%·계속 불붙음
    o.t += dt; o.tk -= dt; if (o.t >= C.pillar.dur) { o.dead = true; continue; }
    if (o.tk <= 0) { o.tk += C.pillar.tick; gridQuery(o.x, o.y, o.R, e => hit66(e, o.d, 'fireball')); }   // 지속 피해 = 치명타 없음 (교차 검토 반영)
  }
  P.pillars = P.pillars.filter(o => !o.dead);
}

/* ---------- 궁극기 ---------- */
function ultFree66(p) {                                                                // 화염 해방: 몸 중심 큰 폭발 (화면 절반·무기 기준 2배), 범위 안 적 전부 불붙음
  const R = VIEW.w * 0.5, d = ref66() * P66C.free.k, P = Pg();
  fx({ kind: 'ring', x: p.x, y: p.y, r0: 40, r1: 8, dur: 0.25, color: PCOL().col, follow: true });
  uLater(0.25, () => { if (G.result) return; const x = G.p.x, y = G.p.y; let n = 0; gridQuery(x, y, R, e => { damageEnemy(e, d, { src: 'ult', kb: 260, fx: x, fy: y }); if (!e.dead) burn66(e); n++; }); P.booms.push({ x, y, R, t: 0, dur: 0.6, big: 1 }); shake(7, 0.4); S60().freeN = (S60().freeN || 0) + n; });
  S60().free = (S60().free || 0) + 1;
  return 1;
}
function ultPhoenix66(p) {                                                             // 불사조: 몸 주위 불꽃이 모여 화면을 3번 가로지름 (총 6초), 끝나면 불꽃 5개 가득
  const P = Pg(); P.embers = 0; P.phoenix = { t: 0, pass: -1, x: p.x, y: p.y, hit: null }; S60().phoenix = (S60().phoenix || 0) + 1;
  return P66C.phoenix.dur;
}
function phoenixTick66(dt) {
  const P = Pg(), F = P.phoenix; if (!F) return;
  const C = P66C.phoenix, per = C.dur / C.pass, p = G.p; F.t += dt;
  const k = Math.floor(F.t / per);
  if (k >= C.pass) { P.phoenix = null; if (G.p.job2 === 'A') P.embers = P66C.ember.max; return; }
  if (k !== F.pass) { F.pass = k; F.hit = new Set(); const a = rand(6.28), W = VIEW.w * 0.6; F.x0 = p.x - Math.cos(a) * W; F.y0 = p.y - Math.sin(a) * W; F.x1 = p.x + Math.cos(a) * W; F.y1 = p.y + Math.sin(a) * W; F.a = a; }
  const u = (F.t - k * per) / per; F.x = F.x0 + (F.x1 - F.x0) * u; F.y = F.y0 + (F.y1 - F.y0) * u;
  const d = fbD66() * C.k;
  gridQuery(F.x, F.y, C.w / 2, e => { if (F.hit.has(e)) return; F.hit.add(e); damageEnemy(e, d, { src: 'ult' }); if (!e.dead) burn66(e); S60().phHit = (S60().phHit || 0) + 1; });
}
function ultMeteor66(p) {                                                              // 거대 불덩이: 적에서 적으로 10번 튐 (적 많은 쪽 우선)
  const P = Pg(); P.meteor = { x: p.x, y: p.y - 10, n: 0, t: 0, from: { x: p.x, y: p.y - 10 }, to: null, prev: null }; S60().meteor = (S60().meteor || 0) + 1;
  return P66C.meteor.n * P66C.meteor.gap + 0.3;
}
function meteorTick66(dt) {
  const P = Pg(), M = P.meteor; if (!M) return;
  const C = P66C.meteor; M.t -= dt; if (M.t > 0) return;
  if (M.n >= C.n) { P.meteor = null; return; }
  let best = null, bs = -1;                                                           // 다음 대상: 반경 300 안, 주변 적이 가장 많은 적 (같은 적 연속 제외)
  gridQuery(M.x, M.y, C.look, e => { if (e.dead || e === M.prev) return; let n = 0; gridQuery(e.x, e.y, C.R, () => { n++; }); const s = n * 1000 - Math.sqrt(dist2(e.x, e.y, M.x, M.y)); if (s > bs) { bs = s; best = e; } });
  if (!best) { P.meteor = null; return; }
  M.from = { x: M.x, y: M.y }; M.x = best.x; M.y = best.y; M.prev = best; M.n++; M.t = C.gap; M.at = G.time;
  const d = fbD66() * C.k, x = M.x, y = M.y; gridQuery(x, y, C.R, e => { damageEnemy(e, d, { src: 'ult', kb: 120, fx: x, fy: y }); if (!e.dead) burn66(e); });
  P.booms.push({ x, y, R: C.R, t: 0, dur: 0.35, big: 1 }); shake(2, 0.1); S60().meteorHop = (S60().meteorHop || 0) + 1;
}

/* ---------- 연성 7종 (짝 무기 + 화염구), 전부 불붙음 ---------- */
// 불꽃 대검: 불로 빚은 대검이 앞에 떠올라 넓게 휩쓸고 밀어냄 (대검보다 길고 넓게)
function fBlade66(w, S) {
  const C = P66C.blade, p = G.p, range = C.range * S.area, tg = nearestEnemy(p.x, p.y, range * 1.3); if (!tg) return false;
  const a0 = Math.atan2(tg.y - p.y, tg.x - p.x), d = C.dmg * pk66(w, S);
  gridQuery(p.x, p.y, range, e => { let da = Math.atan2(e.y - p.y, e.x - p.x) - a0; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) <= C.arc / 2 + 0.1) hit66(e, d, 'cleave', { kb: WEAPONS.cleave.base.kb, fx: p.x, fy: p.y }); });
  Pg().booms.push({ x: p.x, y: p.y, R: range, t: 0, dur: 0.25, sw: 1, a: a0, arc: C.arc }); S60().blade = (S60().blade || 0) + 1;
  return C.cd * pc66(w, S);
}
// X자 불칼금: 불꽃 칼날이 적 몸에 엇갈린 두 줄을 그어 X자로 태움
function fXcut66(w, S) {
  const C = P66C.xcut, p = G.p, ts = nearN60(p.x, p.y, C.range * S.area, S.n); if (!ts.length) return false;
  const d = C.dmg * pk66(w, S), P = Pg();
  for (const e of ts) { const a = rand(-0.5, 0.5); P.cuts.push({ e, x: e.x, y: e.y, a: a + 0.785, t: 0, dur: 0.35, r: e.r + 7 }); hit66(e, d, 'dagger', { fx: p.x, fy: p.y });
    G.later.push({ t: C.late, f: () => { if (G.result || e.dead) return; P.cuts.push({ e, x: e.x, y: e.y, a: a - 0.785, t: 0, dur: 0.35, r: e.r + 7 }); hit66(e, d * C.k, 'dagger'); S60().xcut = (S60().xcut || 0) + 1; } }); }
  return C.cd * pc66(w, S);
}
// 불씨살: 불로 빚은 활이 불화살을 쏘고, 화살은 멀리 날수록 바람을 먹고 커져 강해짐 (가장 먼 적 우선)
function fArrow66(w, S) {
  const C = P66C.ember66, p = G.p, range = C.range * S.area; let tg = null, bd = -1;
  gridQuery(p.x, p.y, range, e => { if (e.dead) return; const d = dist2(e.x, e.y, p.x, p.y); if (d > bd && d < range * range) { bd = d; tg = e; } });
  if (!tg) return false; const a0 = Math.atan2(tg.y - p.y, tg.x - p.x), d = C.dmg * pk66(w, S);
  for (let i = 0; i < S.n; i++) Pg().arrows.push({ x: p.x, y: p.y - 4, a: a0 + (i - (S.n - 1) / 2) * 0.1, d: 0, max: range * 1.15, range, dmg: d, cr: CR60 });
  return C.cd * pc66(w, S);
}
function arrowTick66(dt) {
  const P = Pg(), C = P66C.ember66;
  for (const s of P.arrows) {
    const st = C.sp * dt; s.x += Math.cos(s.a) * st; s.y += Math.sin(s.a) * st; s.d += st;
    const g = Math.min(1, s.d / s.range); s.g = g; s.wd = C.w0 + (C.w1 - C.w0) * g;
    let hit = null; gridQuery(s.x, s.y, s.wd / 2, e => { if (!hit && !e.dead) hit = e; });
    if (hit) { s.dead = true; const k = 1 + (C.maxK - 1) * g; withCR60(s.cr, () => hit66(hit, s.dmg * k, 'arrow', { kb: 40, fx: s.x, fy: s.y })); P.booms.push({ x: s.x, y: s.y, R: s.wd * 0.6, t: 0, dur: 0.2 }); const S6 = S60(); S6.arrowK = Math.max(S6.arrowK || 0, k); continue; }
    if (s.d >= s.max) s.dead = true;
  }
  P.arrows = P.arrows.filter(s => !s.dead);
}
// 불꽃 정령: 곁에 작은 불꽃 정령이 생겨 자리를 지키고, 다가온 적에게 달려들어 들이받아 불붙인 뒤 제자리로 (쏘지 않음)
function fSpirit66(w, S) {
  const C = P66C.spirit, p = G.p, P = Pg(), mine = P.spirits.filter(o => o.w === w);
  if (mine.length >= C.max) return 0.5;
  if (!nearestEnemy(p.x, p.y, 420)) return false;
  const a = rand(6.28), hx = p.x + Math.cos(a) * C.dist, hy = p.y + Math.sin(a) * C.dist * 0.7;
  P.spirits.push({ w, hx, hy, x: hx, y: hy, t: 0, cd: 0.3, tg: null, go: 0, ph: rand(6.28) }); S60().spirit = (S60().spirit || 0) + 1;
  return C.cd * pc66(w, S);
}
function spiritTick66(dt) {
  const P = Pg(), C = P66C.spirit, now = G.time;
  for (const o of P.spirits) {
    o.t += dt; if (o.t >= C.life || !G.p.weapons.includes(o.w)) { o.dead = true; continue; }
    o.cd -= dt * ultCdMul();
    if (o.go === 0 && o.cd <= 0) { const e = nearestEnemy(o.hx, o.hy, C.guard); if (e) { o.tg = e; o.go = 1; o.ctx = roll60(o.w); } else o.cd = 0.2; }
    let tx = o.hx, ty = o.hy - 6 + Math.sin(now * 3 + o.ph) * 3;
    if (o.go === 1) { if (!o.tg || o.tg.dead) { o.go = 2; } else { tx = o.tg.x; ty = o.tg.y; } }
    const dx = tx - o.x, dy = ty - o.y, d = Math.hypot(dx, dy) || 1, s = Math.min(d, C.sp * dt * (o.go ? 1 : 0.4)); o.x += dx / d * s; o.y += dy / d * s;
    if (o.go === 1 && o.tg && d < o.tg.r + 6) { const S = wStats(o.w); withCR60(o.ctx, () => hit66(o.tg, C.dmg * pk66(o.w, S), 'turret', { kb: 60, fx: o.x, fy: o.y })); P.booms.push({ x: o.x, y: o.y, R: 18, t: 0, dur: 0.25 }); o.go = 2; o.cd = C.atk * pc66(o.w, S); S60().spiritHit = (S60().spiritHit || 0) + 1; }
    if (o.go === 2 && Math.hypot(o.x - o.hx, o.y - o.hy) < 4) o.go = 0;
    if (o.go === 2 && o.cd <= 0 && o.tg && o.tg.dead) o.go = 0;
  }
  P.spirits = P.spirits.filter(o => !o.dead);
}
// 화염 등불: 불꽃 등불에서 불줄기 두 가닥이 뻗어 가까운 적 둘을 태우고, 오래 쬘수록 뜨거워짐
function fLamp66(w, S) {
  const C = P66C.lamp, p = G.p, ts = nearN60(p.x, p.y, C.range * S.area, C.n + Math.max(0, S.n - 1)), prev = w.lk66 || new Map(), nx = new Map();
  w.lk = ts; w.lkT = G.time; if (!ts.length) { w.lk66 = nx; return false; }
  const d = C.dmg * pk66(w, S);
  for (const e of ts) { const t0 = prev.has(e) ? prev.get(e) : G.time; nx.set(e, t0); const k = Math.min(C.max, 1 + C.up * Math.floor(G.time - t0)); hit66(e, d * k, 'lamp'); const S6 = S60(); S6.lampMax = Math.max(S6.lampMax || 0, k); }
  w.lk66 = nx;
  return prev.size ? 'tick' : 'start';                                                // 줄기가 새로 이어질 때만 발동 반응 (공용 등불과 같음)
}
// 뜨거운 숨: 숨을 내쉬듯 몸에서 열기 고리가 두 번 퍼지고, 두 번째가 더 멀리 퍼짐
function fBreath66(w, S) {
  const C = P66C.breath, p = G.p, R1 = C.R1 * S.area, R2 = C.R2 * S.area, d = WEAPONS.bell.base.dmg * pk66(w, S), P = Pg(), ctx = CR60;
  if (!nearestEnemy(p.x, p.y, R2)) return false;
  gridQuery(p.x, p.y, R1, e => { hit66(e, d, 'bell'); if (!e.dead) stun60(e, C.stun); });
  P.booms.push({ x: p.x, y: p.y, R: R1, t: 0, dur: 0.35, ring: 1 });
  G.later.push({ t: C.late, f: () => { if (G.result) return; const x = G.p.x, y = G.p.y; withCR60(ctx, () => gridQuery(x, y, R2, e => hit66(e, d * C.k2, 'bell'))); P.booms.push({ x, y, R: R2, t: 0, dur: 0.4, ring: 1 }); S60().breath2 = (S60().breath2 || 0) + 1; } });
  return C.cd * pc66(w, S);
}
// 불넝쿨: 발밑에서 불꽃 넝쿨이 솟아 적을 휘감고, 묶인 동안 조이며 태움 (다리부터 몸통까지 감아 오름)
function fVine66(w, S) {
  const C = P66C.vine, p = G.p, ts = nearN60(p.x, p.y, C.range * S.area, S.n); if (!ts.length) return false;
  const d = C.dmg * pk66(w, S), P = Pg();
  for (const e of ts) { hit66(e, d, 'thorn'); if (e.dead) continue; root60(e, C.root); P.vines.push({ e, x: e.x, y: e.y, t: 0, tk: C.tick, d: C.tk * pk66(w, S), cr: CR60 }); }
  S60().vine = (S60().vine || 0) + ts.length;
  return C.cd * pc66(w, S);
}
function vineTick66(dt) {
  const P = Pg(), C = P66C.vine;
  for (const o of P.vines) {
    o.t += dt; if (!o.e.dead) { o.x = o.e.x; o.y = o.e.y; }
    if (o.t <= C.root && !o.e.dead) { o.tk -= dt; if (o.tk <= 0) { o.tk += C.tick; hit66(o.e, o.d, 'thorn'); S60().vineTk = (S60().vineTk || 0) + 1; } }
  }
  P.vines = P.vines.filter(o => o.t < C.root + 0.2);
}
FUSE60.pyromancer = {
  cleave: { nm: '불꽃 대검', ds: '불로 빚은 대검이 앞에 떠올라 대검보다 길고 넓게 휩쓸고 밀어냄, 불붙음', fire: fBlade66 },
  dagger: { nm: 'X자 불칼금', ds: '불꽃 칼날이 엇갈린 두 줄을 그어 X자로 태움 (둘째 줄 60%), 불붙음', fire: fXcut66 },
  arrow: { nm: '불씨살', ds: '가장 먼 적에게 불화살, 멀리 날수록 커지고 강해짐 (최대 180%), 불붙음', fire: fArrow66 },
  turret: { nm: '불꽃 정령', ds: '곁의 불꽃 정령이 자리를 지키다 다가온 적을 들이받아 불붙임 (최대 3마리)', fire: fSpirit66 },
  lamp: { nm: '화염 등불', ds: '불줄기 두 가닥이 가까운 적 둘을 태움, 오래 쬘수록 뜨거워짐 (최대 2배)', fire: fLamp66 },
  bell: { nm: '뜨거운 숨', ds: '열기 고리가 두 번 퍼짐, 두 번째가 더 멀리 (60%), 불붙음', fire: fBreath66 },
  thorn: { nm: '불넝쿨', ds: '불꽃 넝쿨이 적을 휘감고 묶인 1초 동안 조이며 태움, 불붙음', fire: fVine66 },
};

/* ---------- 인물 연결점 ---------- */
Object.assign(HERO60.pyromancer, {
  impl: true,
  br: [{ k: 'A', nm: '큰 불꽃', ds: '화염구 폭발 반경 +60%' }, { k: 'B', nm: '불의 창', ds: '화염구가 일직선으로 꿰뚫는 불의 창, 피해 +30%' }],
  wak: { A: { nm: '불기둥', ds: '4번째 발동마다 맞은 자리에 불기둥 1.5초 (0.3초마다 40%)' }, B: { nm: '폭렬 창', ds: '3번째 발동마다 박힌 자리가 1초 뒤 폭발 (반경 90·250%)' } },
  fire: pFire66,
  onKill(e) { if (G.p.job2 === 'A' && burning66(e)) { const P = Pg(); if (P.embers < P66C.ember.max) { P.embers++; P.links.push({ x: e.x, y: e.y, t: 0, dur: 0.35, home: 1 }); S60().ember = (S60().ember || 0) + 1; } } },   // 불 거두기
  onPick() { G.p66 = null; Pg(); SRC_NM.burn66 = '불붙음'; },
  ultFn(k) { return k === 'A' ? ultPhoenix66 : k === 'B' ? ultMeteor66 : ultFree66; },
  tick(dt) {
    const P = Pg();
    burnTick66(); spearTick66(dt); arrowTick66(dt); spiritTick66(dt); vineTick66(dt); phoenixTick66(dt); meteorTick66(dt);
    for (const k of ['booms', 'links', 'cuts']) { const L = P[k]; for (const o of L) o.t += dt; P[k] = L.filter(o => o.t < o.dur); }
    const S6 = S60(); S6.burnMax = Math.max(S6.burnMax || 0, P.burn.length);
  },
  status() { const P = Pg(); if (P.phoenix) return '불사조'; if (P.meteor) return '거대 불덩이'; return '불붙음 ' + P.burn.length + (G.p.job2 === 'A' ? ' · 불꽃 ' + P.embers + '/' + P66C.ember.max : ''); },
  dials() { const P = Pg(); return G.p.job2 === 'A' ? [{ ic: '불', col: PCOL().col, k: P.embers / P66C.ember.max }] : []; },
  draw: drawP66,
});

/* ---------- 그리기 (임시 도형, 최종본 아님) ---------- */
function flame66(c, x, y, s, a) {                                                      // 불꽃 한 송이 (주황 + 노란 속불)
  const fl = Math.sin(G.time * 18 + x) * s * 0.25;
  c.globalAlpha = a; c.fillStyle = '#FF8A1F'; c.beginPath(); c.moveTo(x, y - s * 1.6 + fl); c.quadraticCurveTo(x + s, y - s * 0.2, x, y + s * 0.5); c.quadraticCurveTo(x - s, y - s * 0.2, x, y - s * 1.6 + fl); c.fill();
  c.fillStyle = '#FFD23F'; c.beginPath(); c.moveTo(x, y - s * 0.9 + fl); c.quadraticCurveTo(x + s * 0.5, y - s * 0.1, x, y + s * 0.3); c.quadraticCurveTo(x - s * 0.5, y - s * 0.1, x, y - s * 0.9 + fl); c.fill();
}
function drawP66(c) {
  const P = G.p66; if (!P) return;
  const p = G.p, H = HERO60.pyromancer, tau = Math.PI * 2, now = G.time, b = baseW();
  c.lineCap = 'round';
  for (const e of P.burn) if (!e.dead && e.p66b > now) flame66(c, e.x + Math.sin(e.id) * e.r * 0.3, e.y - e.r * 0.4, 3 + e.r * 0.15, 0.85);   // 불붙은 적: 몸 위 작은 불꽃
  for (const o of P.pillars) { const k = o.t / P66C.pillar.dur, al = k < 0.1 ? k * 10 : k > 0.85 ? (1 - k) / 0.15 : 1;   // 불기둥
    c.globalAlpha = 0.25 * al; c.fillStyle = H.c1; c.beginPath(); c.ellipse(o.x, o.y, o.R, o.R * 0.45, 0, 0, tau); c.fill();
    c.globalAlpha = 0.6 * al; c.fillStyle = H.c1; c.fillRect(o.x - o.R * 0.35, o.y - o.R * 2.2, o.R * 0.7, o.R * 2.2); c.fillStyle = H.c2; c.fillRect(o.x - o.R * 0.15, o.y - o.R * 2.4, o.R * 0.3, o.R * 2.4); }
  for (const o of P.vines) { const er = o.e.r || 10, up = Math.min(1, o.t / 0.4), x = o.x, y = o.y;   // 불넝쿨: 다리부터 몸통까지 감아 오르는 불꽃 줄기
    c.globalAlpha = 0.9; c.strokeStyle = '#ff7a2a'; c.lineWidth = 2.5; c.beginPath();
    for (let i = 0; i <= 14; i++) { const u = i / 14 * up, a = u * 9 + o.t * 3, px = x + Math.cos(a) * (er + 2), py = y + er * 0.7 - u * er * 1.6 + Math.sin(a) * 2; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); }
  for (const o of P.spirits) { const fade = Math.min(1, o.t * 4) * Math.min(1, (P66C.spirit.life - o.t) * 2); flame66(c, o.x, o.y, o.go === 1 ? 6 : 4.5, 0.9 * fade);   // 불꽃 정령: 일렁이는 불덩이 + 눈
    c.globalAlpha = fade; c.fillStyle = '#3a1a08'; c.fillRect(o.x - 2.5, o.y - 3, 1.5, 1.5); c.fillRect(o.x + 1, o.y - 3, 1.5, 1.5); }
  for (const w of p.weapons) if (w.fu && w.fu.job === 'pyromancer' && w.id === 'lamp' && w.lk && G.time - w.lkT < 0.35) {   // 화염 등불: 곁에 뜬 등불 + 휘어지는 불줄기 (오래 이어질수록 굵고 하얗게)
    const hx = p.x - 14, hy = p.y - 20 + Math.sin(now * 3) * 2; flame66(c, hx, hy + 3, 4, 1); c.globalAlpha = 1; c.strokeStyle = '#6b3a1a'; c.lineWidth = 1.5; c.strokeRect(hx - 4, hy - 4, 8, 9);
    for (const e of w.lk) { if (e.dead) continue; const t0 = w.lk66 && w.lk66.get(e), k = t0 != null ? Math.min(1, (now - t0) / 4) : 0;
      c.globalAlpha = 0.85; c.strokeStyle = k > 0.6 ? '#fff4d6' : '#ff9a3a'; c.lineWidth = 2 + k * 3; c.beginPath(); const dx = e.x - hx, dy = e.y - hy, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
      for (let i = 0; i <= 10; i++) { const u = i / 10, wv = Math.sin(u * 7 + now * 12) * 6 * Math.sin(u * Math.PI), x = hx + dx * u + nx * wv, y = hy + dy * u + ny * wv; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); } }
  for (const s of P.spears) { const ux = Math.cos(s.a), uy = Math.sin(s.a), L = 26;   // 불의 창
    c.globalAlpha = 0.4; c.strokeStyle = H.c1; c.lineWidth = s.w; c.beginPath(); c.moveTo(s.x - ux * L * 1.6, s.y - uy * L * 1.6); c.lineTo(s.x, s.y); c.stroke();
    c.globalAlpha = 1; c.strokeStyle = H.c2; c.lineWidth = 3; c.beginPath(); c.moveTo(s.x - ux * L, s.y - uy * L); c.lineTo(s.x + ux * 6, s.y + uy * 6); c.stroke(); }
  for (const s of P.arrows) { const ux = Math.cos(s.a), uy = Math.sin(s.a), L = 14 + (s.g || 0) * 12, w = (s.wd || 24) * 0.25;   // 불씨살: 날수록 커지는 불화살
    c.globalAlpha = 0.45; c.fillStyle = H.c1; c.beginPath(); c.ellipse(s.x - ux * L * 0.4, s.y - uy * L * 0.4, L, w, s.a, 0, tau); c.fill();
    c.globalAlpha = 1; c.strokeStyle = '#7a4a28'; c.lineWidth = 2; c.beginPath(); c.moveTo(s.x - ux * L, s.y - uy * L); c.lineTo(s.x, s.y); c.stroke(); c.fillStyle = H.c2; c.beginPath(); c.arc(s.x, s.y, 2 + w * 0.4, 0, tau); c.fill(); }
  for (const o of P.cuts) { const k = o.t / o.dur, x = o.e && !o.e.dead ? o.e.x : o.x, y = o.e && !o.e.dead ? o.e.y : o.y, L = o.r * Math.min(1, o.t / 0.06);   // X자 불칼금
    c.globalAlpha = 1 - k; c.strokeStyle = k < 0.3 ? '#fff4d6' : H.c1; c.lineWidth = 3.5 * (1 - k * 0.5); c.beginPath(); c.moveTo(x - Math.cos(o.a) * L, y - Math.sin(o.a) * L); c.lineTo(x + Math.cos(o.a) * L, y + Math.sin(o.a) * L); c.stroke(); }
  for (const o of P.links) { const k = o.t / o.dur;
    if (o.spark) { c.globalAlpha = 1 - k; c.fillStyle = H.c2; const x = o.x + (o.tx - o.x) * k, y = o.y + (o.ty - o.y) * k - Math.sin(k * Math.PI) * 16; c.beginPath(); c.arc(x, y, 2.5, 0, tau); c.fill(); continue; }   // 불티: 통통 튀는 작은 불씨
    if (o.home) { const x = o.x + (p.x - o.x) * k, y = o.y + (p.y - 10 - o.y) * k; flame66(c, x, y, 3, 1 - k * 0.3); } }
  if (G.p.job2 === 'A' && P.embers) for (let i = 0; i < P.embers; i++) { const a = now * 2.4 + i * tau / P.embers; flame66(c, p.x + Math.cos(a) * 18, p.y - 4 + Math.sin(a) * 9, 3, 0.9); }   // 몸 주위를 도는 불꽃
  for (const o of P.booms) { const k = o.t / o.dur;
    if (o.stuck) { c.globalAlpha = 0.7 + Math.sin(now * 30) * 0.3; c.fillStyle = H.c2; c.beginPath(); c.arc(o.x, o.y, 4 + k * 4, 0, tau); c.fill(); continue; }   // 박힌 폭렬 창
    if (o.ring) { c.globalAlpha = 0.55 * (1 - k); c.strokeStyle = '#ffb060'; c.lineWidth = 5 * (1 - k) + 1; c.beginPath(); c.arc(o.x, o.y, o.R * (0.2 + 0.8 * k), 0, tau); c.stroke(); c.globalAlpha = 0.12 * (1 - k); c.fillStyle = '#ff9a4a'; c.fill(); continue; }   // 열기 고리
    if (o.sw) { c.globalAlpha = 0.75 * (1 - k); c.strokeStyle = H.c1; c.lineWidth = 7; c.beginPath(); c.arc(o.x, o.y, o.R * 0.85, o.a - o.arc / 2, o.a - o.arc / 2 + o.arc * Math.min(1, k * 3)); c.stroke();   // 불꽃 대검: 허공의 불칼 + 궤적
      const sa = o.a - o.arc / 2 + o.arc * Math.min(1, k * 3); c.globalAlpha = 0.95 * (1 - k); c.strokeStyle = H.c3; c.lineWidth = 4; c.beginPath(); c.moveTo(o.x + Math.cos(sa) * 18, o.y + Math.sin(sa) * 18); c.lineTo(o.x + Math.cos(sa) * o.R, o.y + Math.sin(sa) * o.R); c.stroke(); continue; }
    c.globalAlpha = 0.6 * (1 - k); c.fillStyle = o.big ? H.c1 : '#ff9a4a'; c.beginPath(); c.arc(o.x, o.y, o.R * (0.3 + 0.7 * Math.min(1, k * 2.5)), 0, tau); c.fill();
    if (o.big) { c.globalAlpha = 0.4 * (1 - k); c.fillStyle = H.c2; c.beginPath(); c.arc(o.x, o.y, o.R * 0.45 * (0.3 + k), 0, tau); c.fill(); } }
  if (P.phoenix && P.phoenix.x0 != null) { const F = P.phoenix, ux = Math.cos(F.a), uy = Math.sin(F.a), fl = Math.sin(now * 14) * 10;   // 불사조: 날개 편 큰 불새
    c.globalAlpha = 0.35; c.fillStyle = H.c1; c.beginPath(); c.ellipse(F.x - ux * 30, F.y - uy * 30, 46, 10, F.a, 0, tau); c.fill();
    c.globalAlpha = 0.9; c.fillStyle = H.c1; c.beginPath(); c.moveTo(F.x + ux * 22, F.y + uy * 22); c.lineTo(F.x - uy * (34 + fl), F.y + ux * (34 + fl)); c.lineTo(F.x - ux * 14, F.y - uy * 14); c.lineTo(F.x + uy * (34 + fl), F.y - ux * (34 + fl)); c.closePath(); c.fill();
    c.fillStyle = H.c2; c.beginPath(); c.arc(F.x + ux * 10, F.y + uy * 10, 7, 0, tau); c.fill(); }
  if (P.meteor && P.meteor.at) { const M = P.meteor, k = Math.min(1, (now - M.at) / 0.12), x = M.from.x + (M.x - M.from.x) * k, y = M.from.y + (M.y - M.from.y) * k - Math.sin(k * Math.PI) * 30;   // 거대 불덩이
    flame66(c, x, y + 8, 12, 1); }
  if (b) { const a = Math.atan2(p.face.y, p.face.x), tx = p.x + Math.cos(a) * 9, ty = p.y - 12 + Math.sin(a) * 3;   // 지팡이 끝 불꽃 (무기 각성 = 불꽃 확대)
    flame66(c, tx, ty, b.aw ? 5 : 3, 0.95); }
  c.globalAlpha = 1;
}
/* 화염구 불꽃 꼬리 (무기 각성 공통) */
const _drawWeaponsP66 = drawWeapons;
drawWeapons = function (c, inView) {
  const r = _drawWeaponsP66(c, inView); if (!isP66() || !G.proj) return r;
  const b = baseW(); if (!b || !b.aw) return r;
  c.save(); for (const pr of G.proj) if (pr.p66) { const ux = pr.vx / (Math.hypot(pr.vx, pr.vy) || 1), uy = pr.vy / (Math.hypot(pr.vx, pr.vy) || 1); for (let i = 1; i <= 4; i++) { c.globalAlpha = 0.35 - i * 0.07; c.fillStyle = '#FF8A1F'; c.beginPath(); c.arc(pr.x - ux * i * 6, pr.y - uy * i * 6, pr.r * (1 - i * 0.15), 0, 7); c.fill(); } }
  c.restore(); return r;
};
