/* ============================================================
   0.68 드루이드 구현 (회차 98, 분할 구현 9차) — 기준: docs/characters/druid.md
   • 고유 규칙(자신형 + 연성형): 야수 변신 — 늑대로 시작, 1.5초 멈추면 반대 형태로 전환, 전환 후 4초 재전환 불가, 두 형태 모두 자유 이동
     늑대 = 이동 +20%·전용·연성 발동 속도 +30% / 곰 = 받는 피해 -30%·전용·연성 범위 +30%
     전환 효과: 곰 = 바닥 내려찍기 충격, 늑대 = 포효(주변 적 0.5초 겁먹어 물러남), 연성 무기도 형태에 따라 모습만 바뀜
   • 전용 무기 가시 덩굴: 발현 A 얽는 덩굴 → 무기 각성 A 덩굴 덤불 / 발현 B 가시 창 → 무기 각성 B 가시꽃
   • 궁극기: 기본 수호목 / 인물 각성 A 깊어지는 야성 + 만월 / 인물 각성 B 자연의 응답 + 숲의 부름
   • 연성 7종: 앞발 휩쓸기·칼잎·매 강하·식충 꽃·포자 버섯·생명 뿌리·초롱꽃 (불 사용 없음)
   • 그림: 새 장면은 임시 도형 (최종본 아님, GPT 요청 대상), 수치는 전부 가안 (대규모 밸런스 단계 조정)
   ============================================================ */
const D68C = {
  form: { still: 1.5, lock: 4, wolfSpd: 0.2, wolfCd: 0.3, bearGuard: 0.3, bearArea: 0.3 },
  slam: { R: 110, k: 1, stun: 0.3 },                                                 // 곰 전환: 내려찍기 충격 (반경·피해 가안)
  roar: { R: 120, fear: 0.5, kb: 170 },                                              // 늑대 전환: 포효 (반경 가안), 바깥으로만 밀어냄
  tangle: { R: 70, n: 2, k: 0.7 },                                                   // 발현 A 얽는 덩굴
  bush: { life: 3, R: 30, k: 0.4, root: 0.5, gap: 1.5, max: 6 },                     // 무기 각성 A 덩굴 덤불 (반경 가안)
  spear: { k: 1.5, lift: 0.4 },                                                      // 발현 B 가시 창
  bloom: { late: 0.3, n: 6, L: 90, k: 0.5, w: 12 },                                  // 무기 각성 B 가시꽃
  tree: { rise: 0.5, n: 4, gap: 0.4, R: 90, k: 2, kb: 160, heal: 0.1, look: 300, dur: 2.5 },   // 수호목
  wild: { t1: 6, t2: 12, k: 0.5 },                                                   // 깊어지는 야성: 6초·12초 단계 상승, 단계마다 형태 효과 +50%
  moon: { dur: 8, k: 2 },                                                            // 만월
  answer: { R: 150, L: 200, arc: 100 * Math.PI / 180, k: 1.5, root: 1 },             // 자연의 응답 (늑대 부채꼴 각도 가안)
  forest: { R: 200, dur: 8, slow: 0.3 },                                             // 숲의 부름
  swipe: { cd: 1.25, range: 86, arc: 110 * Math.PI / 180, dmg: 19, late: 0.3, k: 0.7 },
  leaf: { cd: 0.9, range: 220, n: 3, dmg: 11 },
  hawk: { cd: 1.0, range: 300, w: 24, dmg: 16, sp: 620 },
  flower: { cd: 4, max: 3, life: 10, fire: 0.8, range: 240, dmg: 8, sp: 300, pool: { R: 28, life: 1.5, tick: 0.5, dmg: 3 }, dist: 38 },   // 식충 꽃 (바닥 독액: 반경 28·1.5초·0.5초마다 3, 구현 직전 작성 가안)
  shroom: { cd: 1.2, range: 260, R: 45, dmg: 18, late: 0.25 },
  root: { n: 2, range: 140, dmg: 5 },
  bellf: { cd: 3, R: 140, stun: 0.2, pollen: 0.8, slow: 0.2 },
};
const Dg = () => G.d68 || (G.d68 = { form: 'wolf', still: 0, lock: 0, keep: 0, moon: 0, nSw: 0, forest: null, tree: null, bushes: [], blooms: [], spikes: [], hawks: [], flowers: [], spits: [], pools: [], pollens: [], booms: [], swipes: [], leaves: [], fx: [] });
const isD68 = () => G.p && G.p.job === 'druid' && HERO60.druid.impl;
const DCOL = () => HERO60.druid;
const dk68 = (w, S) => S.dmg / WEAPONS[w.id].base.dmg;
const dc68 = (w, S) => S.cd / WEAPONS[w.id].base.cd;
const ref68 = () => { const b = baseW(); return b ? wStats(b).dmg : WEAPONS.thorn.base.dmg * TEMP60.dmg; };   // 무기 기준 = 가시 덩굴 1번 피해
const bear68 = () => Dg().form === 'bear';
function wildLv68() { const D = Dg(); if (G.p.job2 !== 'A') return 1; if (D.moon > 0) return 3; return D.keep >= D68C.wild.t2 ? 3 : D.keep >= D68C.wild.t1 ? 2 : 1; }
const formK68 = () => 1 + D68C.wild.k * (wildLv68() - 1);                            // 형태 효과 배율 (1 → 1.5 → 2)
function dense68(x, y, range, R) {
  let best = null, bs = -1;
  gridQuery(x, y, range, e => { if (e.dead) return; let n = 0; gridQuery(e.x, e.y, R, () => { n++; }); const s = n * 1000 - Math.sqrt(dist2(e.x, e.y, x, y)); if (s > bs) { bs = s; best = e; } });
  return best;
}
const inForest68 = (x, y) => { const F = Dg().forest; return F && dist2(x, y, F.x, F.y) < F.R * F.R; };

/* ---------- 야수 변신 ---------- */
function formTick68(dt) {
  const D = Dg(), p = G.p, C = D68C.form;
  if (D.moon > 0) D.moon -= dt;
  D.keep += dt; if (D.lock > 0) D.lock -= dt;
  if (p.moving) { D.still = 0; return; }
  if (D.lock > 0) return;
  D.still += dt; if (D.still >= C.still) shift68();
}
function shift68() {
  const D = Dg(), p = G.p, S6 = S60();
  D.form = D.form === 'wolf' ? 'bear' : 'wolf'; D.lock = D68C.form.lock; D.still = 0; D.keep = 0; D.nSw++;
  S6.shift = (S6.shift || 0) + 1; S6[D.form === 'bear' ? 'toBear' : 'toWolf'] = (S6[D.form === 'bear' ? 'toBear' : 'toWolf'] || 0) + 1;
  shiftFx68(1);
  if (p.job2 === 'B') answer68();
}
function shiftFx68(k) {                                                               // 전환 효과 (만월 시작 = 2배)
  const D = Dg(), p = G.p, x = p.x, y = p.y, d = ref68() * D68C.slam.k * k;
  if (D.form === 'bear') { const C = D68C.slam; gridQuery(x, y, C.R, e => { damageEnemy(e, d, { src: 'thorn', kb: 90, fx: x, fy: y }); if (!e.dead) stun60(e, C.stun * k); }); D.booms.push({ x, y, R: C.R, t: 0, dur: 0.4, slam: 1 }); shake(3 * k, 0.2); S60().slam = (S60().slam || 0) + 1; }
  else { const C = D68C.roar; gridQuery(x, y, C.R, e => { damageEnemy(e, 0.01, { src: 'thorn', kb: C.kb, fx: x, fy: y }); if (!e.dead) stun60(e, C.fear * k); }); D.booms.push({ x, y, R: C.R, t: 0, dur: 0.45, roar: 1 }); S60().roar = (S60().roar || 0) + 1; }   // 겁먹어 물러남: 프리스트처럼 바깥으로만
}
function answer68() {                                                                // 자연의 응답: 변신하는 순간 주변 땅에서 가시 덩굴 일제 분출
  const D = Dg(), C = D68C.answer, p = G.p, d = ref68() * C.k, hit = new Set(), b = baseW(), ctx = b ? roll60(b) : null;
  const sp = e => { if (hit.has(e)) return; hit.add(e); withCR60(ctx, () => damageEnemy(e, d, { src: 'thorn' })); if (!e.dead) root60(e, C.root); D.spikes.push({ x: e.x, y: e.y, R: 16, t: 0, dur: 0.5, big: 1 }); };
  if (D.form === 'bear') gridQuery(p.x, p.y, C.R, sp);
  else { const a0 = Math.atan2(p.face.y, p.face.x); gridQuery(p.x, p.y, C.L, e => { let da = Math.atan2(e.y - p.y, e.x - p.x) - a0; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) <= C.arc / 2) sp(e); }); D.booms.push({ x: p.x, y: p.y, R: C.L, t: 0, dur: 0.4, fan: 1, a: a0, arc: C.arc }); }
  const F = D.forest; if (F && inForest68(p.x, p.y)) { gridQuery(F.x, F.y, F.R, sp); S60().forestVine = (S60().forestVine || 0) + 1; }   // 숲 안에서 변신하면 숲 전체에서 덩굴
  if (D.form === 'bear') D.booms.push({ x: p.x, y: p.y, R: C.R, t: 0, dur: 0.4, ring: 1 });
  S60().answer = (S60().answer || 0) + 1; S60().answerHit = (S60().answerHit || 0) + hit.size;
}

/* ---------- 전용 무기 가시 덩굴 ---------- */
function pThorn68(w, S) {
  const C = D68C, D = Dg(), p = G.p, B = WEAPONS.thorn.base, ts = nearN60(p.x, p.y, B.range * S.area, S.n); if (!ts.length) return false;
  const R = B.R * S.area, spear = w.br === 'B', d = S.dmg * (spear ? C.spear.k : 1), rt = spear ? C.spear.lift : B.root, ctx = CR60;
  for (const t of ts) {
    const x = t.x, y = t.y, hit = new Set();
    gridQuery(x, y, R, e => { hit.add(e); damageEnemy(e, d, { src: 'thorn' }); if (!e.dead) root60(e, rt); });
    D.spikes.push({ x, y, R, t: 0, dur: Math.max(0.55, rt + 0.15), e: t, lift: spear, aw: !!w.aw });
    if (w.br === 'A') { const L = nearN60(x, y, C.tangle.R * S.area, C.tangle.n + hit.size).filter(o => !hit.has(o)).slice(0, C.tangle.n);   // 얽는 덩굴: 줄기가 2마리에게 더 뻗음
      for (const o of L) { damageEnemy(o, d * C.tangle.k, { src: 'thorn' }); if (!o.dead) root60(o, rt); D.spikes.push({ x: o.x, y: o.y, R: R * 0.7, t: 0, dur: 0.55, e: o, from: { x, y } }); }
      S60().tangle = (S60().tangle || 0) + L.length; }
    if (w.aw === 'A') { D.bushes.push({ x, y, R: C.bush.R * S.area, t: 0, d: S.dmg * C.bush.k, last: new Map() }); if (D.bushes.length > C.bush.max) D.bushes.shift(); S60().bush = (S60().bush || 0) + 1; }   // 덩굴 덤불 (동시 6개)
    if (w.aw === 'B') G.later.push({ t: C.bloom.late, f: () => { if (G.result) return; const L = C.bloom.L * S.area, dd = S.dmg * C.bloom.k * (spear ? 1 : 1), a0 = rand(6.28), got = new Set();   // 가시꽃: 6방향 가시 줄기
      withCR60(ctx, () => { for (let i = 0; i < C.bloom.n; i++) { const a = a0 + i / C.bloom.n * Math.PI * 2, ux = Math.cos(a), uy = Math.sin(a);
        gridQuery(x + ux * L / 2, y + uy * L / 2, L / 2 + 10, e => { if (got.has(e) || e.dead) return; const rx = e.x - x, ry = e.y - y, al = rx * ux + ry * uy; if (al < 0 || al > L + e.r) return; if (Math.abs(rx * uy - ry * ux) > C.bloom.w + e.r) return; got.add(e); damageEnemy(e, dd, { src: 'thorn' }); }); } });
      D.blooms.push({ x, y, L, a0, t: 0, dur: 0.4 }); S60().bloom = (S60().bloom || 0) + 1; S60().bloomHit = (S60().bloomHit || 0) + got.size; } });
  }
}
function bushTick68(dt) {
  const D = Dg(), C = D68C.bush, now = G.time;
  for (const o of D.bushes) {
    o.t += dt; if (o.t >= C.life) { o.dead = true; continue; }
    gridQuery(o.x, o.y, o.R, e => { if (e.dead) return; const l = o.last.get(e); if (l != null && now - l < C.gap) return; if ((e.d68b || -9) > now - C.gap) return; o.last.set(e, now); e.d68b = now;   // 같은 적 1.5초에 1번 (덤불끼리도 공유)
      damageEnemy(e, o.d, { src: 'thorn' }); if (!e.dead) root60(e, C.root); S60().bushHit = (S60().bushHit || 0) + 1; });
  }
  D.bushes = D.bushes.filter(o => !o.dead);
}

/* ---------- 궁극기 ---------- */
function ultTree68(p) {                                                               // 수호목: 뒤로 거대한 고목이 솟아 가지 4번 내려치기 → 잎 흩뿌려 체력 10% 회복
  const D = Dg(); D.tree = { x: p.x - p.face.x * 30, y: p.y - 20, t: 0, n: 0, hits: [] }; S60().tree = (S60().tree || 0) + 1;
  return D68C.tree.dur;
}
function treeTick68(dt) {
  const D = Dg(), T = D.tree; if (!T) return; const C = D68C.tree, p = G.p;
  T.t += dt;
  while (T.n < C.n && T.t >= C.rise + T.n * C.gap) {
    T.n++; const tg = dense68(p.x, p.y, C.look, C.R); if (!tg) continue;
    const x = tg.x, y = tg.y; gridQuery(x, y, C.R, e => damageEnemy(e, ref68() * C.k, { src: 'ult', kb: C.kb, fx: p.x, fy: p.y }));   // 밀쳐냄은 드루이드 쪽에서 바깥으로
    T.hits.push({ x, y, t: 0 }); D.booms.push({ x, y, R: C.R, t: 0, dur: 0.35, slam: 1 }); shake(3, 0.15); S60().branch = (S60().branch || 0) + 1;
  }
  for (const h of T.hits) h.t += dt;
  if (T.t >= C.dur - 0.3 && !T.healed) { T.healed = 1; heal(p.maxHp * C.heal, '수호목'); for (let i = 0; i < 14; i++) D.fx.push({ x: T.x + rand(-40, 40), y: T.y - rand(40, 90), vx: rand(-30, 30), vy: rand(20, 60), t: 0, dur: 1, leaf: 1 }); S60().treeHeal = (S60().treeHeal || 0) + 1; }
  if (T.t >= C.dur) D.tree = null;
}
function ultMoon68() {                                                                // 만월: 지금 형태가 단번에 3단계, 8초 동안 바꿔도 3단계 유지, 시작 순간 전환 효과 2배
  const D = Dg(); D.moon = D68C.moon.dur; shiftFx68(D68C.moon.k); S60().moon = (S60().moon || 0) + 1;
  return 1;
}
function ultForest68(p) {                                                             // 숲의 부름: 반경 200 숲 8초·자리 고정, 숲 안 적 이동 -30%
  const D = Dg(); D.forest = { x: p.x, y: p.y, R: D68C.forest.R, t: 0, seed: rand(99) }; S60().forest = (S60().forest || 0) + 1;
  return 1;
}

/* ---------- 연성 7종 (짝 무기 + 가시 덩굴), 형태에 따라 모습만 바뀜 ---------- */
// 앞발 휩쓸기: 앞발 발톱 자국이 앞을 휩쓸고, 반대쪽 앞발이 이어서 한 번 더 (0.3초 뒤 70%)
function fSwipe68(w, S) {
  const C = D68C.swipe, p = G.p, D = Dg(), range = C.range * S.area, tg = nearestEnemy(p.x, p.y, range * 1.4); if (!tg) return false;
  const a0 = Math.atan2(tg.y - p.y, tg.x - p.x), d = C.dmg * dk68(w, S), kb = WEAPONS.cleave.base.kb, ctx = CR60;
  const sw = (k, side) => { const x = G.p.x, y = G.p.y; gridQuery(x, y, range, e => { let da = Math.atan2(e.y - y, e.x - x) - a0; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) <= C.arc / 2 + 0.1) damageEnemy(e, d * k, { src: 'cleave', kb, fx: x, fy: y }); });
    D.swipes.push({ x, y, R: range, a: a0, arc: C.arc, side, t: 0, dur: 0.25, bear: bear68() }); };
  sw(1, 1); G.later.push({ t: C.late, f: () => { if (G.result) return; withCR60(ctx, () => sw(C.k, -1)); S60().swipe2 = (S60().swipe2 || 0) + 1; } });
  return C.cd * dc68(w, S);
}
// 칼잎: 칼잎 3장이 흩날리듯 날아가 가까운 적 3마리를 한 장씩 그음
function fLeaf68(w, S) {
  const C = D68C.leaf, p = G.p, D = Dg(), ts = nearN60(p.x, p.y, C.range * S.area, C.n); if (!ts.length) return false;   // 3장 고정 (단검 수 증가는 연성 업그레이드로 대체)
  const d = C.dmg * dk68(w, S);
  for (const e of ts) { damageEnemy(e, d, { src: 'dagger' }); D.leaves.push({ x: p.x, y: p.y - 6, e, tx: e.x, ty: e.y, t: 0, dur: 0.22, s: rand(6.28), bear: bear68() }); }
  const S6 = S60(); S6.leafMax = Math.max(S6.leafMax || 0, ts.length);
  return C.cd * dc68(w, S);
}
// 매 강하: 숲의 매가 멀리 있는 적을 향해 낮게 곧게 내리꽂히며 지나는 길의 적을 할퀴고 지나감 (관통)
function fHawk68(w, S) {
  const C = D68C.hawk, p = G.p, range = C.range * S.area; let tg = null, bd = -1;
  gridQuery(p.x, p.y, range, e => { if (e.dead) return; const d = dist2(e.x, e.y, p.x, p.y); if (d > bd && d < range * range) { bd = d; tg = e; } });
  if (!tg) return false; const a0 = Math.atan2(tg.y - p.y, tg.x - p.x), d = C.dmg * dk68(w, S);
  for (let i = 0; i < S.n; i++) Dg().hawks.push({ x: p.x, y: p.y - 6, a: a0 + (i - (S.n - 1) / 2) * 0.12, d: 0, max: range * 1.1, dmg: d, hit: new Set(), cr: CR60, w: C.w * (bear68() ? 1.25 : 1), bear: bear68() });
  return C.cd * dc68(w, S);
}
function hawkTick68(dt) {
  const D = Dg(), C = D68C.hawk;
  for (const s of D.hawks) {
    const st = C.sp * dt; s.x += Math.cos(s.a) * st; s.y += Math.sin(s.a) * st; s.d += st;
    gridQuery(s.x, s.y, s.w / 2 + 6, e => { if (s.hit.has(e) || e.dead) return; s.hit.add(e); withCR60(s.cr, () => damageEnemy(e, s.dmg, { src: 'arrow' })); const S6 = S60(); S6.hawkMax = Math.max(S6.hawkMax || 0, s.hit.size); });
    if (s.d >= s.max) s.dead = true;
  }
  D.hawks = D.hawks.filter(s => !s.dead);
}
// 식충 꽃: 곁에 핀 꽃이 적에게 독액을 뱉고, 독액은 바닥에 원형으로 잠시 남아 밟는 적에게 피해 (물기·중독 상태 없음)
function fFlower68(w, S) {
  const C = D68C.flower, p = G.p, D = Dg(), mine = D.flowers.filter(o => o.w === w);
  if (mine.length >= C.max) return 0.5;
  if (!nearestEnemy(p.x, p.y, 420)) return false;
  let q = null; for (let k = 0; k < 6 && !q; k++) { const a = rand(6.28), x = p.x + Math.cos(a) * C.dist, y = p.y + Math.sin(a) * C.dist * 0.8; if (!D.flowers.some(o => dist2(o.x, o.y, x, y) < 24 * 24)) q = { x, y }; }
  q = q || { x: p.x + rand(-34, 34), y: p.y + rand(-30, 30) };
  D.flowers.push({ w, x: q.x, y: q.y, t: 0, cd: 0.3, a: -1.57, bear: bear68() }); S60().flower = (S60().flower || 0) + 1;
  return C.cd * dc68(w, S);
}
function flowerTick68(dt) {
  const D = Dg(), C = D68C.flower, P = C.pool;
  for (const o of D.flowers) {
    o.t += dt; if (o.t >= C.life || !G.p.weapons.includes(o.w)) { o.dead = true; continue; }
    o.cd -= dt * ultCdMul(); if (o.cd > 0) continue;
    const S = wStats(o.w), e = nearestEnemy(o.x, o.y, C.range * S.area); if (!e) { o.cd = 0.25; continue; }
    o.a = Math.atan2(e.y - o.y, e.x - o.x); o.cd = C.fire * dc68(o.w, S) / (C.cd / WEAPONS.turret.base.cd);
    D.spits.push({ x: o.x, y: o.y - 8, tx: e.x, ty: e.y, e, t: 0, dur: Math.max(0.15, Math.sqrt(dist2(e.x, e.y, o.x, o.y)) / C.sp), d: C.dmg * dk68(o.w, S), pd: P.dmg * dk68(o.w, S), R: P.R * S.area, ctx: roll60(o.w), bear: o.bear });   // 한 번 뱉기 = 공격 1번
  }
  D.flowers = D.flowers.filter(o => !o.dead);
  for (const s of D.spits) { s.t += dt; if (s.t < s.dur) continue; s.dead = true; const x = s.e && !s.e.dead ? s.e.x : s.tx, y = s.e && !s.e.dead ? s.e.y : s.ty;
    withCR60(s.ctx, () => { if (s.e && !s.e.dead && dist2(s.e.x, s.e.y, x, y) < 400) damageEnemy(s.e, s.d, { src: 'turret' }); });
    D.pools.push({ x, y, R: s.R, t: 0, tk: P.tick, d: s.pd, bear: s.bear }); S60().spit = (S60().spit || 0) + 1; }
  D.spits = D.spits.filter(s => !s.dead);
  for (const o of D.pools) { o.t += dt; if (o.t >= P.life) { o.dead = true; continue; } o.tk -= dt; if (o.tk > 0) continue; o.tk += P.tick;
    gridQuery(o.x, o.y, o.R, e => { damageEnemy(e, o.d, { src: 'turret' }); S60().poolTk = (S60().poolTk || 0) + 1; }); }   // 바닥 독액 = 지속 피해, 치명타 없음
  D.pools = D.pools.filter(o => !o.dead);
}
// 포자 버섯: 적이 몰린 곳 발밑에서 큰 버섯이 순식간에 부풀어 '펑' 터짐 (포자 가루는 바로 사라짐, 상태 효과 없음)
function fShroom68(w, S) {
  const C = D68C.shroom, p = G.p, D = Dg(), tg = dense68(p.x, p.y, C.range * S.area, C.R * S.area); if (!tg) return false;
  const x = tg.x, y = tg.y, R = C.R * S.area, d = C.dmg * dk68(w, S), ctx = CR60, bear = bear68();
  D.booms.push({ x, y, R: R * 0.45, t: 0, dur: C.late, grow: 1, bear });
  G.later.push({ t: C.late, f: () => { if (G.result) return; withCR60(ctx, () => gridQuery(x, y, R, e => damageEnemy(e, d, { src: 'fireball' }))); D.booms.push({ x, y, R, t: 0, dur: 0.35, spore: 1, bear }); S60().shroom = (S60().shroom || 0) + 1; } });
  return C.cd * dc68(w, S);
}
// 생명 뿌리: 땅속 뿌리 2가닥이 가까운 적 2마리 발밑까지 뻗어 생기를 빨아들임 (휘감지 않음, 회복 없음)
function fRoot68(w, S) {
  const C = D68C.root, p = G.p, ts = nearN60(p.x, p.y, C.range * S.area, C.n), prev = w.lk || [];   // 2가닥 고정
  w.lk = ts; w.lkT = G.time; if (!ts.length) return false;
  const d = C.dmg * dk68(w, S); for (const e of ts) damageEnemy(e, d, { src: 'lamp' });
  const S6 = S60(); S6.rootMax = Math.max(S6.rootMax || 0, ts.length);
  return prev.length ? 'tick' : 'start';
}
// 초롱꽃: 곁에 핀 초롱꽃이 흔들리면 꽃가루 고리가 퍼져 적을 움찔하게 하고, 꽃가루가 잠시 남아 적을 느리게 함
function fBellf68(w, S) {
  const C = D68C.bellf, p = G.p, D = Dg(), R = C.R * S.area; if (!nearestEnemy(p.x, p.y, R)) return false;
  const d = WEAPONS.bell.base.dmg * dk68(w, S);
  gridQuery(p.x, p.y, R, e => { damageEnemy(e, d, { src: 'bell' }); if (!e.dead) stun60(e, C.stun); });
  D.pollens.push({ x: p.x, y: p.y, R, t: 0, bear: bear68() }); S60().pollen = (S60().pollen || 0) + 1;
  return C.cd * dc68(w, S);
}
FUSE60.druid = {
  cleave: { nm: '앞발 휩쓸기', ds: '짐승 앞발 발톱 자국이 앞을 휩쓸고, 반대쪽 앞발이 0.3초 뒤 한 번 더 (70%)', fire: fSwipe68 },
  dagger: { nm: '칼잎', ds: '칼잎 3장이 흩날리듯 날아가 가까운 적 3마리를 한 장씩 그음', fire: fLeaf68 },
  arrow: { nm: '매 강하', ds: '숲의 매가 가장 먼 적을 향해 낮게 내리꽂히며 지나는 길의 적을 할큄 (관통)', fire: fHawk68 },
  turret: { nm: '식충 꽃', ds: '곁의 식충 꽃(최대 3)이 독액을 뱉고, 독액이 바닥에 잠시 남아 밟는 적에게 피해', fire: fFlower68 },
  fireball: { nm: '포자 버섯', ds: '적이 몰린 곳 발밑에서 큰 버섯이 부풀어 펑 터짐', fire: fShroom68 },
  lamp: { nm: '생명 뿌리', ds: '땅속 뿌리 2가닥이 가까운 적 2마리 발밑까지 뻗어 생기를 빨아들임', fire: fRoot68 },
  bell: { nm: '초롱꽃', ds: '초롱꽃이 흔들려 꽃가루 고리 (멈칫), 꽃가루가 0.8초 남아 적 이동 -20%', fire: fBellf68 },
};

/* 숲·꽃가루 감속 (적 이동 속도 배율 경로에 합침) */
const _chronoSlowD68 = chronoSlow;
chronoSlow = function (e) {
  let m = _chronoSlowD68(e); if (!isD68() || !G.d68 || e.gk) return m;
  const D = G.d68;
  if (D.forest && dist2(e.x, e.y, D.forest.x, D.forest.y) < D.forest.R * D.forest.R) m *= 1 - D68C.forest.slow;
  for (const o of D.pollens) if (dist2(e.x, e.y, o.x, o.y) < o.R * o.R) { m *= 1 - D68C.bellf.slow; break; }
  return m;
};

/* ---------- 인물 연결점 ---------- */
Object.assign(HERO60.druid, {
  impl: true,
  br: [{ k: 'A', nm: '얽는 덩굴', ds: '솟는 순간 반경 70 안 최대 2마리에게 줄기가 더 뻗음 (70%·묶임 동일)' }, { k: 'B', nm: '가시 창', ds: '굵은 가시가 적을 꿰어 들어 올림, 피해 +50%·들어 올림 0.4초' }],
  wak: { A: { nm: '덩굴 덤불', ds: '솟은 자리에 덤불 3초, 들어온 적 40%·묶임 (같은 적 1.5초에 1번, 동시 6개)' }, B: { nm: '가시꽃', ds: '솟고 0.3초 뒤 6방향 가시 줄기 (길이 90·각 50%)' } },
  fire: pThorn68,
  stat(w) { const k = formK68(); return bear68() ? { area: 1 + D68C.form.bearArea * k } : { cd: 1 / (1 + D68C.form.wolfCd * k) }; },
  spdMul() { return bear68() ? 1 : 1 + D68C.form.wolfSpd * formK68(); },
  hurtMul() { return bear68() ? Math.max(0.3, 1 - D68C.form.bearGuard * formK68()) : 1; },
  onPick() { G.d68 = null; Dg(); },
  ultFn(k) { return k === 'A' ? ultMoon68 : k === 'B' ? ultForest68 : ultTree68; },
  tick(dt) {
    const D = Dg(), S6 = S60();
    formTick68(dt); bushTick68(dt); treeTick68(dt); hawkTick68(dt); flowerTick68(dt);
    if (D.forest) { D.forest.t += dt; if (D.forest.t >= D68C.forest.dur) D.forest = null; }
    for (const o of D.pollens) o.t += dt; D.pollens = D.pollens.filter(o => o.t < D68C.bellf.pollen);
    for (const k of ['blooms', 'spikes', 'booms', 'swipes', 'leaves', 'fx']) { const L = D[k]; for (const o of L) o.t += dt; D[k] = L.filter(o => o.t < o.dur); }
    S6[D.form === 'bear' ? 'bearT' : 'wolfT'] = (S6[D.form === 'bear' ? 'bearT' : 'wolfT'] || 0) + dt; S6.wildMax = Math.max(S6.wildMax || 0, wildLv68());
  },
  status() { const D = Dg(), f = bear68() ? '곰' : '늑대', lv = wildLv68(); if (D.tree) return '수호목'; return f + (G.p.job2 === 'A' ? ' ' + lv + '단계' : '') + (D.moon > 0 ? ' · 만월' : '') + (D.forest ? ' · 숲' : '') + (D.lock > 0 ? '' : D.still > 0.2 ? ' · 변신 ' + Math.round(D.still / D68C.form.still * 100) + '%' : ''); },
  dials() { const D = Dg(); return [{ ic: bear68() ? '곰' : '늑', col: bear68() ? DCOL().c2 : DCOL().col, k: D.lock > 0 ? 1 - D.lock / D68C.form.lock : Math.min(1, D.still / D68C.form.still) }]; },
  draw: drawD68,
  drawBody(c, fn) { const o = drawHeroReact; drawHeroReact = () => beast68(c); try { return fn(); } finally { drawHeroReact = o; } },   // 사람 그림 자리에 짐승 그림 (그림자·체력 막대 등은 그대로)
});

/* ---------- 드루이드 전용 자동 플레이 ----------
   변신은 1.5초 멈춰야 하므로 공용 자동 플레이(늘 움직임)로는 늑대에서 거의 바뀌지 않음 → 여유가 있을 때 서서 원하는 형태로 바꿈
   곰을 고르는 때: 가까이 적이 많음(반경 200 안 6마리 이상, 체력 60% 넘으면 맞으면서도 서서 바꿈)·체력 50% 미만·수문장 근처 / 그 밖에는 늑대
   깊어지는 야성(A)은 단계를 지키려고 꼭 필요할 때만 바꿈, 자연의 응답(B)은 적이 몰렸을 때 일부러 변신 (기준값 가안) */
const AUTO68 = { tcStand: 0.9, dense: 6, denseR: 200, lowHp: 0.5, bTrig: 5, bearHp: 0.6 };
const _autoVecD68 = autoVec;
function dAuto68() { return AUTO.d68 && AUTO.d68.run === G ? AUTO.d68 : (AUTO.d68 = { run: G, mode: 'move', at: G.time }); }
autoVec = function () {
  if (!isD68() || !G.d68) return _autoVecD68.apply(this, arguments);
  const s = dAuto68(), p = G.p, D = Dg(), S6 = S60();
  if (G.time < (s.next || 0) && s.out) return s.out;
  s.next = G.time + rand(0.06, 0.12);
  const out = () => (s.out = _autoVecD68.apply(this, arguments));
  if (D.lock > 0 || D.tree) { s.mode = 'move'; return out(); }
  const inHz = hazT50(p.x, p.y) < Infinity, tg = autoTarget(), tc = tcMin63(p.x, p.y), here = autoDanger(p.x, p.y);
  let n = 0; gridQuery(p.x, p.y, AUTO68.denseR, e => { if (!e.dead) n++; });
  const boss = tg && (tg.k === 'boss' || tg.k === 'gk'), want = (n >= AUTO68.dense || p.hp < p.maxHp * AUTO68.lowHp || boss) ? 'bear' : 'wolf';
  let sw = want !== D.form;
  if (p.job2 === 'A' && wildLv68() >= 2 && !(D.form === 'wolf' && p.hp < p.maxHp * 0.35)) sw = false;   // 깊어지는 야성: 단계 지킴
  if (p.job2 === 'B' && n >= AUTO68.bTrig) sw = true;                                 // 자연의 응답: 적이 몰리면 변신으로 덩굴 분출
  const base0 = !inHz && shotT63() > 0.5 && !(tg && tg.k === 'goal');
  const safe = base0 && (tc > AUTO68.tcStand * (STATE.dev.god ? 0.6 : 1) || (want === 'bear' && p.hp > p.maxHp * AUTO68.bearHp));   // 곰으로 바꿀 때는 체력이 넉넉하면 맞으면서도 섬
  if (sw && (safe || (s.mode === 'stand' && base0 && (want === 'bear' || tc > 0.35)))) {
    if (s.mode !== 'stand') { s.mode = 'stand'; s.at = G.time; S6.dStand = (S6.dStand || 0) + 1; }
    return (s.out = AUTO.out = { x: 0, y: 0, m: 0 });
  }
  s.mode = 'move'; return out();
};

/* ---------- 그리기 (임시 도형, 최종본 아님) ---------- */
function beast68(c) {                                                                 // 짐승 형태: 늑대 = 날렵한 회록색, 곰 = 크고 둥근 갈색 (깊어지는 야성 단계마다 커짐, 3단계 = 은빛 큰 늑대·거대 곰)
  const D = G.d68; if (!D) return; const p = G.p, H = HERO60.druid, lv = wildLv68(), s = 1 + (lv - 1) * 0.15, fx = p.face.x >= 0 ? 1 : -1, now = G.time, bob = p.moving ? Math.sin(now * 14) * 1.5 : 0, tau = Math.PI * 2;
  c.save(); c.translate(p.x, p.y + 2 + bob); c.scale(fx * s, s);
  if (D.form === 'bear') {
    c.globalAlpha = 0.95; c.fillStyle = lv >= 3 ? '#4a3220' : H.c2; c.beginPath(); c.ellipse(0, -6, 15, 11, 0, 0, tau); c.fill();
    c.beginPath(); c.arc(11, -13, 7.5, 0, tau); c.fill(); c.beginPath(); c.arc(8, -20, 2.8, 0, tau); c.arc(14, -20, 2.8, 0, tau); c.fill();
    c.fillStyle = '#c7a478'; c.beginPath(); c.ellipse(16, -11, 3.5, 2.6, 0, 0, tau); c.fill(); c.fillStyle = '#1a120a'; c.fillRect(12, -16, 2, 2); c.fillRect(17.5, -12, 2, 1.6);
    c.fillStyle = lv >= 3 ? '#4a3220' : H.c2; for (const lx of [-9, -2, 5, 10]) c.fillRect(lx - 2.5, 1, 5, 6);
  } else {
    const fur = lv >= 3 ? '#cfd8d4' : '#7f8f86'; c.globalAlpha = 0.95; c.fillStyle = fur;
    c.beginPath(); c.ellipse(-1, -7, 12, 6, 0, 0, tau); c.fill();
    c.beginPath(); c.moveTo(-12, -9); c.quadraticCurveTo(-22, -14 + Math.sin(now * 8) * 2, -21, -6); c.lineTo(-12, -6); c.fill();   // 꼬리
    c.beginPath(); c.moveTo(7, -11); c.lineTo(18, -10); c.lineTo(20, -7); c.lineTo(9, -4); c.fill();   // 주둥이
    c.beginPath(); c.arc(9, -11, 5, 0, tau); c.fill(); c.beginPath(); c.moveTo(6, -14); c.lineTo(8, -21); c.lineTo(11, -15); c.fill();   // 귀
    c.fillStyle = '#E6D86A'; c.fillRect(11, -13, 2, 1.6); c.fillStyle = '#1a1a1a'; c.fillRect(19, -9.5, 1.6, 1.6);
    c.fillStyle = fur; for (const lx of [-8, -3, 4, 8]) c.fillRect(lx - 1.5, -2, 3, 8);
  }
  c.restore();
  if (D.moon > 0) { c.globalAlpha = 0.25 + 0.1 * Math.sin(now * 6); c.strokeStyle = '#EEF4FF'; c.lineWidth = 2; c.beginPath(); c.arc(p.x, p.y - 6, 24 * s, 0, tau); c.stroke(); }   // 만월 빛
  if (!D.lock && D.still > 0.15) { const k = Math.min(1, D.still / D68C.form.still); c.globalAlpha = 0.8; c.strokeStyle = D.form === 'wolf' ? H.c2 : H.col; c.lineWidth = 2.5; c.beginPath(); c.arc(p.x, p.y + 4, 16, -Math.PI / 2, -Math.PI / 2 + tau * k); c.stroke(); }   // 변신 진행 고리
  c.globalAlpha = 1;
}
function thornShape68(c, x, y, R, k, bear, big) {                                     // 솟는 가시 덩굴 (늑대 = 가는 초록, 곰 = 굵은 갈색)
  const H = HERO60.druid, up = Math.min(1, k * 4), n = bear ? 4 : 5, w = bear ? 4 : 2.5;
  c.strokeStyle = bear ? '#7a5634' : '#5fae4f'; c.lineWidth = w * (big ? 1.4 : 1);
  for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.45, L = R * (0.9 + (i % 2) * 0.3) * up; c.beginPath(); c.moveTo(x + (i - (n - 1) / 2) * 3, y + 4); c.quadraticCurveTo(x + Math.cos(a) * L * 0.5 + 4, y + Math.sin(a) * L * 0.5, x + Math.cos(a) * L, y + Math.sin(a) * L); c.stroke(); }
  c.fillStyle = H.c3; if (up >= 1) { c.beginPath(); c.arc(x, y - R * 0.9, 1.6, 0, 7); c.fill(); }
}
function drawD68(c) {
  const D = G.d68; if (!D) return;
  const p = G.p, H = HERO60.druid, tau = Math.PI * 2, now = G.time;
  c.lineCap = 'round';
  if (D.forest) { const F = D.forest, k = Math.min(1, F.t * 3) * Math.min(1, (D68C.forest.dur - F.t) * 2);   // 숲의 부름: 나무 둘레 + 바닥 숲
    c.globalAlpha = 0.16 * k; c.fillStyle = H.c1; c.beginPath(); c.arc(F.x, F.y, F.R, 0, tau); c.fill();
    for (let i = 0; i < 14; i++) { const a = i / 14 * tau + F.seed, x = F.x + Math.cos(a) * F.R * 0.92, y = F.y + Math.sin(a) * F.R * 0.92; c.globalAlpha = 0.8 * k; c.fillStyle = H.c2; c.fillRect(x - 2, y - 10, 4, 10); c.fillStyle = H.c1; c.beginPath(); c.arc(x, y - 14, 8, 0, tau); c.fill(); } }
  for (const o of D.pollens) { const k = o.t / D68C.bellf.pollen; c.globalAlpha = 0.18 * (1 - k); c.fillStyle = H.c3; c.beginPath(); c.arc(o.x, o.y, o.R, 0, tau); c.fill();   // 꽃가루 고리 + 남는 꽃가루
    c.globalAlpha = 0.6 * (1 - k); c.strokeStyle = H.c3; c.lineWidth = 3 * (1 - k) + 1; c.beginPath(); c.arc(o.x, o.y, o.R * Math.min(1, 0.3 + k * 2), 0, tau); c.stroke();
    c.fillStyle = H.c3; for (let i = 0; i < 10; i++) { const a = i * 2.4 + o.x, r = o.R * ((i * 0.37) % 1); c.globalAlpha = 0.7 * (1 - k); c.fillRect(o.x + Math.cos(a) * r, o.y + Math.sin(a) * r, 2, 2); }
    const fx0 = o.x + 16, fy0 = o.y - 16; c.globalAlpha = 1 - k * 0.5; c.strokeStyle = H.c1; c.lineWidth = 1.5; c.beginPath(); c.moveTo(fx0, fy0 + 10); c.lineTo(fx0, fy0); c.stroke(); c.fillStyle = o.bear ? '#a47ad0' : '#c8a0f0'; c.beginPath(); c.arc(fx0 + Math.sin(now * 10) * 2, fy0, o.bear ? 5 : 3.5, 0, Math.PI); c.fill(); }
  for (const o of D.pools) { const k = o.t / D68C.flower.pool.life; c.globalAlpha = 0.45 * (1 - k * 0.7); c.fillStyle = '#8fd14a'; c.beginPath(); c.ellipse(o.x, o.y, o.R, o.R * 0.55, 0, 0, tau); c.fill(); }   // 바닥 독액
  for (const o of D.bushes) { const k = o.t / D68C.bush.life, al = Math.min(1, o.t * 5) * Math.min(1, (1 - k) * 4), b = bear68();   // 덩굴 덤불 (잎·꽃망울)
    c.globalAlpha = 0.7 * al; c.fillStyle = b ? '#5b4a2a' : '#3f8a3a'; for (let i = 0; i < 6; i++) { const a = i / 6 * tau; c.beginPath(); c.arc(o.x + Math.cos(a) * o.R * 0.55, o.y + Math.sin(a) * o.R * 0.35, o.R * 0.4, 0, tau); c.fill(); }
    c.fillStyle = H.c3; c.globalAlpha = al; c.beginPath(); c.arc(o.x - 4, o.y - 3, 2, 0, tau); c.arc(o.x + 5, o.y + 2, 2, 0, tau); c.fill(); }
  for (const o of D.spikes) { const k = o.t / o.dur, al = k > 0.75 ? (1 - k) / 0.25 : 1, x = o.e && !o.e.dead ? o.e.x : o.x, y = o.e && !o.e.dead ? o.e.y : o.y;   // 가시 덩굴 (가시 창 = 들어 올림)
    c.globalAlpha = al; if (o.from) { c.strokeStyle = bear68() ? '#7a5634' : '#5fae4f'; c.lineWidth = 2; c.beginPath(); c.moveTo(o.from.x, o.from.y); c.quadraticCurveTo((o.from.x + x) / 2, (o.from.y + y) / 2 - 12, x, y); c.stroke(); }
    if (o.lift) { c.strokeStyle = bear68() ? '#6b4a2b' : '#4f9a3f'; c.lineWidth = bear68() ? 6 : 4.5; c.beginPath(); c.moveTo(x, y + 6); c.lineTo(x, y - Math.min(1, k * 5) * 22); c.stroke(); c.fillStyle = H.c3; c.beginPath(); c.moveTo(x - 3, y - 20); c.lineTo(x, y - 28); c.lineTo(x + 3, y - 20); c.fill(); }
    else thornShape68(c, x, y + 4, o.R * 0.8, k, bear68(), o.big || o.aw); }
  for (const o of D.blooms) { const k = o.t / o.dur, u = Math.min(1, k * 3);         // 가시꽃: 6방향 가시 줄기
    c.globalAlpha = 1 - k; c.strokeStyle = bear68() ? '#7a5634' : '#5fae4f'; c.lineWidth = bear68() ? 4 : 2.5;
    for (let i = 0; i < 6; i++) { const a = o.a0 + i / 6 * tau; c.beginPath(); c.moveTo(o.x, o.y); c.lineTo(o.x + Math.cos(a) * o.L * u, o.y + Math.sin(a) * o.L * u); c.stroke(); }
    c.fillStyle = '#E88AB8'; c.beginPath(); c.arc(o.x, o.y, 5 * (1 - k * 0.5), 0, tau); c.fill(); c.fillStyle = H.c3; c.beginPath(); c.arc(o.x, o.y, 2, 0, tau); c.fill(); }
  for (const o of D.flowers) { const fade = Math.min(1, o.t * 4) * Math.min(1, (D68C.flower.life - o.t) * 2), s = o.bear ? 1.35 : 1;   // 식충 꽃
    c.globalAlpha = fade; c.strokeStyle = H.c1; c.lineWidth = 2 * s; c.beginPath(); c.moveTo(o.x, o.y); c.lineTo(o.x, o.y - 8 * s); c.stroke();
    c.fillStyle = '#c0392b'; c.beginPath(); c.arc(o.x + Math.cos(o.a) * 2, o.y - 10 * s + Math.sin(o.a) * 2, 5 * s, o.a + 0.5, o.a - 0.5 + tau); c.lineTo(o.x, o.y - 10 * s); c.fill();
    c.fillStyle = '#f5e08a'; c.fillRect(o.x - 1, o.y - 11 * s, 2, 2); }
  for (const s of D.spits) { const k = s.t / s.dur, x = s.x + (s.tx - s.x) * k, y = s.y + (s.ty - s.y) * k - Math.sin(k * Math.PI) * 18; c.globalAlpha = 1; c.fillStyle = '#9be05a'; c.beginPath(); c.arc(x, y, 3, 0, tau); c.fill(); }
  for (const o of D.swipes) { const k = o.t / o.dur;                                  // 앞발 휩쓸기: 발톱 자국 3줄
    for (let i = -1; i <= 1; i++) { const a = o.a + i * (o.arc / 4) * o.side, r0 = o.R * 0.35, r1 = o.R * (0.6 + 0.4 * Math.min(1, k * 4));
      c.globalAlpha = 0.9 * (1 - k); c.strokeStyle = o.bear ? '#d8c0a0' : '#eef7e8'; c.lineWidth = o.bear ? 4.5 : 2.5; c.beginPath(); c.moveTo(o.x + Math.cos(a - 0.2 * o.side) * r0, o.y + Math.sin(a - 0.2 * o.side) * r0); c.lineTo(o.x + Math.cos(a + 0.2 * o.side) * r1, o.y + Math.sin(a + 0.2 * o.side) * r1); c.stroke(); } }
  for (const o of D.leaves) { const k = Math.min(1, o.t / o.dur), x = o.x + ((o.e && !o.e.dead ? o.e.x : o.tx) - o.x) * k, y = o.y + ((o.e && !o.e.dead ? o.e.y : o.ty) - o.y) * k;   // 칼잎
    c.save(); c.translate(x, y); c.rotate(o.s + k * 12); c.globalAlpha = 1; c.fillStyle = o.bear ? '#8a6a3a' : '#6cc456'; c.beginPath(); c.ellipse(0, 0, o.bear ? 7 : 5.5, o.bear ? 3 : 2, 0, 0, tau); c.fill(); c.restore(); }
  for (const s of D.hawks) { const ux = Math.cos(s.a), uy = Math.sin(s.a), sc = s.bear ? 1.4 : 1, fl = Math.sin(now * 30) * 4 * sc;   // 매 강하 (곰 = 큰 수리)
    c.globalAlpha = 0.3; c.strokeStyle = '#eef7e8'; c.lineWidth = s.w * 0.4; c.beginPath(); c.moveTo(s.x - ux * 40, s.y - uy * 40); c.lineTo(s.x, s.y); c.stroke();
    c.globalAlpha = 1; c.fillStyle = s.bear ? '#5a3e22' : '#8a6a46'; c.beginPath(); c.moveTo(s.x + ux * 8 * sc, s.y + uy * 8 * sc); c.lineTo(s.x - uy * (10 * sc + fl), s.y + ux * (10 * sc + fl)); c.lineTo(s.x - ux * 6 * sc, s.y - uy * 6 * sc); c.lineTo(s.x + uy * (10 * sc + fl), s.y - ux * (10 * sc + fl)); c.closePath(); c.fill(); }
  for (const w of p.weapons) if (w.fu && w.fu.job === 'druid' && w.id === 'lamp' && w.lk && G.time - w.lkT < 0.35) {   // 생명 뿌리: 발밑에서 땅 위로 이어진 뿌리, 맥박치듯 초록 빛
    for (const e of w.lk) { if (e.dead) continue; const dx = e.x - p.x, dy = e.y - p.y + 4;
      c.globalAlpha = 0.95; c.strokeStyle = bear68() ? '#6b4a2b' : '#7a5c3a'; c.lineWidth = bear68() ? 4 : 2.5; c.beginPath();
      for (let i = 0; i <= 10; i++) { const u = i / 10, x = p.x + dx * u + Math.sin(u * 9 + e.id) * 4, y = p.y + 4 + dy * u + Math.cos(u * 7) * 2; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
      const u = (now * 1.8) % 1; c.fillStyle = '#9fe06a'; c.beginPath(); c.arc(e.x - dx * u, e.y + 4 - dy * u, 3, 0, tau); c.fill(); } }
  for (const o of D.booms) { const k = o.t / o.dur;
    if (o.grow) { c.globalAlpha = 1; c.fillStyle = o.bear ? '#a0522d' : '#c0603a'; const r = o.R * (0.4 + k * 1.2); c.beginPath(); c.arc(o.x, o.y - r * 0.5, r, Math.PI, 0); c.fill(); c.fillStyle = '#f0e0c0'; c.fillRect(o.x - r * 0.3, o.y - r * 0.5, r * 0.6, r * 0.6); c.fillStyle = '#fff'; c.fillRect(o.x - r * 0.5, o.y - r * 0.9, 2, 2); continue; }   // 포자 버섯 부풂
    if (o.spore) { c.globalAlpha = 0.55 * (1 - k); c.fillStyle = '#d8c89a'; c.beginPath(); c.arc(o.x, o.y, o.R * (0.3 + 0.7 * Math.min(1, k * 3)), 0, tau); c.fill(); continue; }
    if (o.roar) { c.globalAlpha = 0.6 * (1 - k); c.strokeStyle = '#eef7e8'; c.lineWidth = 3; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(o.x, o.y, o.R * Math.min(1, k * 1.6 + i * 0.15), 0, tau); c.stroke(); } continue; }   // 포효
    if (o.slam) { c.globalAlpha = 0.5 * (1 - k); c.fillStyle = '#8a6a3a'; c.beginPath(); c.ellipse(o.x, o.y, o.R * (0.3 + 0.7 * k), o.R * 0.45 * (0.3 + 0.7 * k), 0, 0, tau); c.fill(); c.strokeStyle = '#5a3e22'; c.lineWidth = 3; c.stroke(); continue; }   // 내려찍기·가지 충격
    if (o.fan) { c.globalAlpha = 0.45 * (1 - k); c.fillStyle = '#5fae4f'; c.beginPath(); c.moveTo(o.x, o.y); c.arc(o.x, o.y, o.R * Math.min(1, k * 3), o.a - o.arc / 2, o.a + o.arc / 2); c.closePath(); c.fill(); continue; }
    if (o.ring) { c.globalAlpha = 0.5 * (1 - k); c.strokeStyle = '#7a5634'; c.lineWidth = 5; c.beginPath(); c.arc(o.x, o.y, o.R * Math.min(1, k * 3), 0, tau); c.stroke(); } }
  if (D.tree) { const T = D.tree, C = D68C.tree, up = Math.min(1, T.t / C.rise), fade = Math.min(1, (C.dur - T.t) * 3);   // 수호목: 뒤로 솟는 고목 + 내려치는 가지
    c.globalAlpha = 0.95 * fade; c.fillStyle = H.c2; c.fillRect(T.x - 9, T.y - 90 * up, 18, 90 * up); c.fillStyle = H.c1; c.beginPath(); c.arc(T.x, T.y - 96 * up, 34 * up, 0, tau); c.arc(T.x - 26, T.y - 80 * up, 22 * up, 0, tau); c.arc(T.x + 26, T.y - 80 * up, 22 * up, 0, tau); c.fill();
    for (const h of T.hits) { if (h.t > 0.35) continue; c.globalAlpha = 0.9 * (1 - h.t / 0.35); c.strokeStyle = H.c2; c.lineWidth = 7; c.beginPath(); c.moveTo(T.x, T.y - 80); c.quadraticCurveTo((T.x + h.x) / 2, Math.min(T.y, h.y) - 70, h.x, h.y); c.stroke(); } }
  for (const o of D.fx) { const k = o.t / o.dur; c.globalAlpha = 1 - k; c.fillStyle = '#6cc456'; c.fillRect(o.x + o.vx * o.t, o.y + o.vy * o.t, 3, 2); }
  c.globalAlpha = 1;
}
