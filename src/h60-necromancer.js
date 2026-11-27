/* ============================================================
   0.64 사령술사 구현 (회차 96, 분할 구현 5차) — 기준: docs/characters/necromancer.md
   • 고유 규칙(전체형): "처치 시 영혼이 떨어지고, 주워 모으면 망령이 나와 싸움"
     - 모든 무기 처치 40% 영혼 → 경험치 흡수 범위로 주움 → 7개마다 망령 1마리 15초 (상한 5)
     - 망령은 적에게 공격받지 않음, 날아가 할퀴기 0.8초마다 20·이동 180
   • 전용 무기 영혼 등불: 발현 A 흡혼(3마리) → 무기 각성 A 봉혼 / 발현 B 수혼(등불 처치 영혼 즉시 흡수·피해 +25%) → 무기 각성 B 폭혼
   • 궁극기: 기본 거대 망령 / 인물 각성 A 작은 망령 3마리 + 영혼 방출 / 인물 각성 B 강한 망령 + 귀속
   • 연성 7종: 넋 먹는 칼날·넋 가르기·꿰뚫는 혼살·묘비·도깨비불·조종·망자의 손
   • 필드 위 아군 개체 공용 틀(망령): 적에게 공격받지 않는 아군 개체, 기준점(사령술사·묘비) 둘레를 지키며 가까운 적을 공격
     → 이후 엔지니어 기계·드루이드 짐승 구현 때 같은 틀(ally64) 재사용 검토
   • 그림: 새 장면은 임시 도형 (최종본 아님, GPT 요청 대상), 수치는 전부 가안 (대규모 밸런스 단계 조정)
   ============================================================ */
const N64C = {
  soul: { ch: 0.4, life: 15, per: 7, perB: 10, flyMax: 900 },                       // 처치 40% 영혼, 바닥 15초 뒤 사라짐(가안), 7개마다 망령 (각성 B 10개)
  wr: { life: 15, max: 5, atk: 0.8, dmg: 20, sp: 180, reach: 16, guard: 260 },      // 망령: 15초·상한 5·할퀴기 0.8초마다 20·이동 180, 지키는 범위 260(가안)
  small: { n: 3, life: 15, max: 15, atk: 0.5, dmg: 5, sp: 220, reach: 12 },        // 인물 각성 A 작은 망령: 3마리씩·쪼기 0.5초마다 5·이동 220·상한 15
  strong: { life: 40, max: 4, atk: 1.2, dmg: 50, R: 50, sp: 130, tether: 250 },    // 인물 각성 B 강한 망령: 영혼 10개마다·휘두르기 반경 50·1.2초마다 50·이동 130·결속 250
  lamp: { nA: 2, kB: 1.25 },                                                        // 발현 A 흡혼 3마리(+2), 발현 B 수혼 피해 +25%
  seal: { every: 3, open: 0.8, R: 110, n: 3 },                                       // 무기 각성 A 봉혼(가안): 3초마다 등불 구멍 0.8초, 반경 110(이동 시간 약 0.7초) 약한 적 최대 3마리 삼킴 (끌어당김 없음)
  burst: { grow: 1.2, R: 60, k: 1.5 },                                              // 무기 각성 B 폭혼: 1.2초 부풀어 반경 60 폭발, 등불 기준(초당 피해) 150%
  giant: { dur: 12, every: 1, R: 130, k: 2, kb: 160, look: 150 },                   // 거대 망령: 12초·1초마다 앞쪽 반원 반경 130·등불 기준 2배·밀쳐냄
  release: { n: 20, dur: 4, dmg: 30, sp: 280, life: 3 },                            // 영혼 방출: 작은 영혼 20개·4초·닿을 때 30
  bind: { dur: 8, k: 1.5, beam: 2, guard: 0.8, none: 0.7 },                         // 귀속: 8초 등불 피해 +50%·줄기 +2(1 → 3)·받는 피해 -20%, 망령 0이면 효과 70%(가안)
  eat: { cd: 1.25, range: 86, arc: 1.92, per: 0.06, arcPer: 0.12, max: 8 },        // 넋 먹는 칼날: 벤 적 1마리마다 다음 휩쓸기 사거리 +6%·각도 +7도 (최대 8마리분, 가안)
  rend: { cd: 0.9, range: 220, late: 0.2, k: 0.6 },                                 // 넋 가르기
  pierce: { cd: 1.0, range: 300, w: 24, dmg: 16, sp: 600 },                         // 꿰뚫는 혼살
  tomb: { cd: 4, max: 3, life: 10, R: 120, need: 3, guard: 140 },                   // 묘비: 반경 120(이동 시간 약 0.8초) 안 처치 영혼 3개 모이면 망령 1마리 (가안)
  wisp: { cd: 1.2, range: 260, sp: 180, R: 55, dmg: 18, life: 4 },                 // 도깨비불
  knell: { cd: 3, R: 140, stun: 0.2, wR: 60, wK: 0.5 },                             // 조종
  hand: { cd: 1.3, range: 200, near: 70, more: 2, dmg: 15, root: 0.5, tick: 0.25, tk: 0.27 },   // 망자의 손: 붙잡은 0.5초 동안 0.25초마다 첫 피해의 27% (가안)
};
const Ng = () => G.n64 || (G.n64 = { souls: [], soulN: 0, ally: [], tombs: [], wisps: [], rel: [], bombs: [], hands: [], booms: [], links: [], giant: null, bind: 0, bindK: 1, relT: 0, relN: 0 });
const isN64 = () => G.p && G.p.job === 'necromancer' && HERO60.necromancer.impl;
const NCOL = () => HERO60.necromancer;
const nk64 = (w, S) => S.dmg / WEAPONS[w.id].base.dmg;                              // 짝 무기 강화·보조 효과 배율
const nc64 = (w, S) => S.cd / WEAPONS[w.id].base.cd;
const nMod64 = () => G.p.mod.dmg * TEMP60.dmg;                                      // 망령 피해: 공격력 보조 효과·전환기 보정만 (무기 강화와 무관)
const ref64 = () => { const b = baseW(); if (!b) return 20; const S = wStats(b); return S.dmg / Math.max(0.05, S.cd); };   // 등불 기준 = 초당 피해 (가안)
const soulPer64 = () => G.p.job2 === 'B' ? N64C.soul.perB : N64C.soul.per;

/* ---------- 필드 위 아군 개체 공용 틀 (망령) ----------
   o: { kind, x, y, life, t, atk, sp, reach, dmg, R?(범위 공격), anchor() → {x,y}, guard, src, k(크기) }
   적에게 공격받지 않음 (G.enemies에 넣지 않음, 충돌 없음) */
function ally64(o) {
  const A = Ng(); const a = Object.assign({ t: 0, cd: rand(0.1, 0.4), tg: null, ph: rand(6.28), k: 1 }, o);
  A.ally.push(a); return a;
}
function allyTick64(dt) {
  const A = Ng(), now = G.time;
  for (const a of A.ally) {
    a.t += dt; if (a.t >= a.life || (a.alive && !a.alive())) { a.dead = true; continue; }
    const an = a.anchor(); a.cd -= dt * ultCdMul();
    if (!a.tg || a.tg.dead || dist2(a.tg.x, a.tg.y, an.x, an.y) > (a.guard + 40) ** 2) {
      a.tg = null; let bd = a.guard * a.guard;
      gridQuery(an.x, an.y, a.guard, e => { if (e.dead || e.sleep) return; const d = dist2(e.x, e.y, a.x, a.y); if (d < bd) { bd = d; a.tg = e; } });
    }
    let tx, ty;
    if (a.tg) { tx = a.tg.x; ty = a.tg.y; }
    else { a.ph += dt * 1.6; const r = 26 + (a.slot || 0) % 5 * 8; tx = an.x + Math.cos(a.ph) * r; ty = an.y - 6 + Math.sin(a.ph) * r * 0.6; }
    const dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy) || 1, reach = a.tg ? a.tg.r + a.reach : 4;
    if (d > reach) { const s = Math.min(d - reach, a.sp * dt); a.x += dx / d * s; a.y += dy / d * s; a.face = Math.atan2(dy, dx); }
    if (a.tg && d <= reach + 4 && a.cd <= 0) {
      a.cd = a.atk; a.hitT = now; const dm = a.dmg * nMod64() * (a.dk || 1);
      if (a.R) { gridQuery(a.x, a.y, a.R, e => damageEnemy(e, dm, { src: a.src })); A.booms.push({ x: a.x, y: a.y, R: a.R, t: 0, dur: 0.2, sw: 1, a: a.face || 0 }); }
      else damageEnemy(a.tg, dm, { src: a.src, fx: a.x, fy: a.y });
      const S6 = S60(); S6.wrHit = (S6.wrHit || 0) + 1;
    }
  }
  A.ally = A.ally.filter(a => !a.dead);
}
const myWr64 = kind => Ng().ally.filter(a => a.kind === kind);
function capAlly64(kind, max) { const L = myWr64(kind); while (L.length >= max) { const o = L.shift(); o.dead = true; } Ng().ally = Ng().ally.filter(a => !a.dead); }
const pAnchor64 = () => G.p;
function summon64() {                                                               // 영혼이 다 차면 망령이 일어남
  const p = G.p, j2 = p.job2, S6 = S60(), C = N64C;
  if (j2 === 'A') {
    for (let i = 0; i < C.small.n; i++) { capAlly64('small', C.small.max);
      ally64({ kind: 'small', x: p.x + rand(-12, 12), y: p.y - 10 + rand(-8, 8), life: C.small.life, atk: C.small.atk, sp: C.small.sp, reach: C.small.reach, dmg: C.small.dmg, anchor: pAnchor64, guard: C.wr.guard, src: 'n64wr', k: 0.6, slot: i }); }
    S6.wrSmall = (S6.wrSmall || 0) + C.small.n;
  } else if (j2 === 'B') {
    capAlly64('strong', C.strong.max);
    ally64({ kind: 'strong', x: p.x, y: p.y - 10, life: C.strong.life, atk: C.strong.atk, sp: C.strong.sp, reach: C.strong.R * 0.6, dmg: C.strong.dmg, R: C.strong.R, anchor: pAnchor64, guard: C.strong.tether, src: 'n64wr', k: 1.5, slot: myWr64('strong').length });
    S6.wrStrong = (S6.wrStrong || 0) + 1;
  } else {
    capAlly64('wr', C.wr.max);
    ally64({ kind: 'wr', x: p.x, y: p.y - 10, life: C.wr.life, atk: C.wr.atk, sp: C.wr.sp, reach: C.wr.reach, dmg: C.wr.dmg, anchor: pAnchor64, guard: C.wr.guard, src: 'n64wr', slot: myWr64('wr').length });
    S6.wr = (S6.wr || 0) + 1;
  }
  fx({ kind: 'ring', x: p.x, y: p.y - 8, r0: 6, r1: 30, dur: 0.3, color: NCOL().c3, follow: true });
}
function gainSoul64(n) {
  const A = Ng(); A.soulN += n; const S6 = S60(); S6.soulGot = (S6.soulGot || 0) + n;
  while (A.soulN >= soulPer64()) { A.soulN -= soulPer64(); summon64(); }
}

/* ---------- 영혼 (바닥에 떨어져 흡수 범위로 주움) ---------- */
function dropSoul64(x, y) { const A = Ng(); if (A.souls.length > 120) A.souls.shift(); A.souls.push({ x, y, t: 0, mag: false }); S60().soulDrop = (S60().soulDrop || 0) + 1; }
function soulTick64(dt) {
  const A = Ng(), p = G.p, R = pickR(), R2 = R * R;
  for (const s of A.souls) {
    s.t += dt; if (s.t > N64C.soul.life && !s.mag) { s.dead = true; continue; }
    const d2 = dist2(s.x, s.y, p.x, p.y); if (!s.mag && d2 < R2) s.mag = true;
    if (s.mag) { const d = Math.sqrt(d2) || 1; s.sp = (s.sp || 100) + N64C.soul.flyMax * dt; s.x += (p.x - s.x) / d * s.sp * dt; s.y += (p.y - 12 - s.y) / d * s.sp * dt;
      if (d < p.r + 10) { s.dead = true; gainSoul64(1); } }
  }
  A.souls = A.souls.filter(s => !s.dead);
}

/* ---------- 전용 무기 영혼 등불 ---------- */
function nLamp64(w, S) {
  const C = N64C, A = Ng(), p = G.p, D = WEAPONS.lamp.base;
  const n = S.n + (w.br === 'A' ? C.lamp.nA : 0) + (A.bind > 0 ? C.bind.beam : 0);
  const ts = nearN60(p.x, p.y, D.range * S.area, n), prev = w.lk || [];
  w.lk = ts; w.lkT = G.time;
  if (!ts.length) return false;
  const dm = S.dmg * (w.br === 'B' ? C.lamp.kB : 1) * (A.bind > 0 ? 1 + (C.bind.k - 1) * A.bindK : 1);
  for (const e of ts) damageEnemy(e, dm, { src: 'lamp' });
  return prev.length ? 'tick' : 'start';
}
/* 무기 각성 A 봉혼 (가안): 등불 앞 구멍이 열려 약한 적을 삼킴 — 원칙 '플레이어 선택권'에 따라 끌어당기지 않음, 구멍 범위 안 적만 */
function sealTick64(dt) {
  const b = baseW(); if (!b || b.aw !== 'A') return;
  const C = N64C.seal, A = Ng(), p = G.p;
  b.seal64 = (b.seal64 == null ? C.every : b.seal64) - dt * ultCdMul();
  if (A.hole) { A.hole.t += dt; if (A.hole.t >= C.open) A.hole = null; }
  if (b.seal64 > 0) return;
  const tg = nearestEnemy(p.x, p.y, C.R * wStats(b).area + 30); if (!tg) { b.seal64 = 0.25; return; }
  b.seal64 = C.every; const S = wStats(b), R = C.R * S.area, a = Math.atan2(tg.y - p.y, tg.x - p.x);
  const hx = p.x + Math.cos(a) * 18, hy = p.y - 10 + Math.sin(a) * 18; A.hole = { x: hx, y: hy, a, t: 0, R };
  const L = []; gridQuery(p.x, p.y, R, e => { if (!e.dead) L.push(e); });
  L.sort((x, y) => x.hp - y.hp); let n = 0;
  for (const e of L) {
    if (n < C.n && noBoss60(e) && !e.elite && !TOUGH60[e.type]) { n++; A.links.push({ x: e.x, y: e.y, tx: hx, ty: hy, t: 0, dur: 0.35, eat: 1 }); damageEnemy(e, e.hp * 4 + 50, { src: 'lamp' }); S60().swallow = (S60().swallow || 0) + 1; }
  }
  S60().seal = (S60().seal || 0) + 1;
}
/* 무기 각성 B 폭혼: 줄기에 이어진 채 죽은 적의 영혼이 1.2초 부풀어 터짐 → 등불로 */
function bombTick64(dt) {
  const A = Ng(), C = N64C.burst;
  for (const o of A.bombs) {
    o.t += dt; if (o.t < C.grow) continue; o.dead = true;
    gridQuery(o.x, o.y, o.R, e => damageEnemy(e, o.d, { src: 'lamp' }));
    A.booms.push({ x: o.x, y: o.y, R: o.R, t: 0, dur: 0.3, soul: 1 }); A.links.push({ x: o.x, y: o.y, t: 0, dur: 0.3, home: 1 }); shake(1, 0.08);
    S60().burst = (S60().burst || 0) + 1;
  }
  A.bombs = A.bombs.filter(o => !o.dead);
}

/* ---------- 궁극기 ---------- */
function ultGiant64(p) {                                                            // 거대 망령: 등불 뚜껑이 열리며 큰 망령이 흘러나와 12초 곁에서 낫 휘두르기
  const A = Ng(), C = N64C.giant; A.giant = { t: 0, dur: C.dur, sw: 0.4, swT: -1, a: 0 }; S60().giant = (S60().giant || 0) + 1;
  fx({ kind: 'ring', x: p.x + 10, y: p.y - 12, r0: 4, r1: 60, dur: 0.45, color: NCOL().c3 });
  return C.dur;
}
function giantTick64(dt) {
  const A = Ng(), Gt = A.giant; if (!Gt) return;
  const C = N64C.giant; Gt.t += dt; if (Gt.t >= Gt.dur) { A.giant = null; A.links.push({ x: G.p.x - 30, y: G.p.y - 40, t: 0, dur: 0.4, home: 1 }); return; }
  Gt.sw -= dt; const p = G.p, tg = nearestEnemy(p.x, p.y, C.look); if (tg) Gt.a = Math.atan2(tg.y - p.y, tg.x - p.x);
  if (Gt.sw > 0 || !tg) return; Gt.sw = C.every; Gt.swT = G.time;
  const d = ref64() * C.k, a0 = Gt.a;
  gridQuery(p.x, p.y, C.R, e => { let da = Math.atan2(e.y - p.y, e.x - p.x) - a0; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) <= Math.PI / 2 + 0.1) damageEnemy(e, d, { src: 'ult', kb: C.kb, fx: p.x, fy: p.y }); });
  S60().giantSw = (S60().giantSw || 0) + 1; shake(1.5, 0.1);
}
function ultRelease64(p) {                                                          // 영혼 방출: 작은 영혼 20개가 4초 동안 흘러나와 적에게 닿을 때 30
  const A = Ng(), C = N64C.release; A.relN = C.n; A.relT = 0; S60().release = (S60().release || 0) + 1;
  return C.dur;
}
function relTick64(dt) {
  const A = Ng(), C = N64C.release, p = G.p;
  if (A.relN > 0) { A.relT -= dt; while (A.relT <= 0 && A.relN > 0) { A.relT += C.dur / C.n; A.relN--; const a = rand(6.28);
    A.rel.push({ x: p.x + 10, y: p.y - 12, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, t: 0, d: C.dmg * nMod64() }); } }
  for (const o of A.rel) {
    o.t += dt; if (o.t > C.life) { o.dead = true; continue; }
    if (!o.tg || o.tg.dead) o.tg = nearestEnemy(o.x, o.y, 320);
    if (o.tg) { const dx = o.tg.x - o.x, dy = o.tg.y - o.y, d = Math.hypot(dx, dy) || 1; o.vx += (dx / d * C.sp - o.vx) * Math.min(1, dt * 5); o.vy += (dy / d * C.sp - o.vy) * Math.min(1, dt * 5);
      if (d < o.tg.r + 6) { damageEnemy(o.tg, o.d, { src: 'ult' }); o.dead = true; A.booms.push({ x: o.x, y: o.y, R: 14, t: 0, dur: 0.2, soul: 1 }); continue; } }
    o.x += o.vx * dt; o.y += o.vy * dt;
  }
  A.rel = A.rel.filter(o => !o.dead);
}
function ultBind64(p) {                                                             // 귀속: 망령이 줄에 끌려 등불로 흡수 → 8초 강화
  const A = Ng(), C = N64C.bind, L = A.ally.filter(a => a.anchor === pAnchor64);
  for (const a of L) { a.dead = true; A.links.push({ x: a.x, y: a.y, t: 0, dur: 0.45, home: 1 }); }
  A.ally = A.ally.filter(a => !a.dead);
  A.bind = C.dur; A.bindK = L.length ? 1 : C.none; S60().bind = (S60().bind || 0) + 1; S60().bindWr = (S60().bindWr || 0) + L.length;
  return C.dur;
}

/* ---------- 연성 7종 (짝 무기 + 영혼 등불) ---------- */
// 넋 먹는 칼날: 영혼 대검이 휩쓸 때 벤 적들의 푸른 기운이 칼날로 빨려 들어가고, 많이 빨아들일수록 다음 휩쓸기가 넓어짐
function fEat64(w, S) {
  const C = N64C.eat, p = G.p, st = w.eat64 || 0, range = C.range * S.area * (1 + C.per * st), arc = C.arc + C.arcPer * st;
  const tg = nearestEnemy(p.x, p.y, range * 1.4); if (!tg) return false;
  const a0 = Math.atan2(tg.y - p.y, tg.x - p.x), d = WEAPONS.cleave.base.dmg * nk64(w, S), hit = [];
  gridQuery(p.x, p.y, range, e => { let da = Math.atan2(e.y - p.y, e.x - p.x) - a0; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) <= arc / 2 + 0.15) hit.push(e); });
  for (const e of hit) { damageEnemy(e, d, { kb: WEAPONS.cleave.base.kb, fx: p.x, fy: p.y, src: 'cleave' }); Ng().links.push({ x: e.x, y: e.y, t: 0, dur: 0.3, home: 1, blade: 1 }); }
  fx({ kind: 'arc', a: a0, arc, r: range, dur: 0.18, color: NCOL().c3, basicArt: 'cleave', artX: p.x, artY: p.y });
  w.eat64 = Math.min(C.max, hit.length); const S6 = S60(); S6.eatMax = Math.max(S6.eatMax || 0, st); S6.eatHit = (S6.eatHit || 0) + hit.length;
  return C.cd * nc64(w, S);
}
// 넋 가르기: 영혼 칼날이 몸을 긋고 한 박자 뒤 같은 자리에 반투명 칼날이 한 번 더 그어 넋까지 벰
function fRend64(w, S) {
  const C = N64C.rend, p = G.p, ts = nearN60(p.x, p.y, C.range * S.area, S.n); if (!ts.length) return false;
  const d = WEAPONS.dagger.base.dmg * nk64(w, S);
  for (const e of ts) { cut60(e, NCOL().c3); damageEnemy(e, d, { src: 'dagger', fx: p.x, fy: p.y });
    G.later.push({ t: C.late, f: () => { if (G.result || e.dead) return; cut60(e, '#d8f4ff'); damageEnemy(e, d * C.k, { src: 'dagger' }); S60().rend = (S60().rend || 0) + 1; } }); }
  return C.cd * nc64(w, S);
}
// 꿰뚫는 혼살: 영혼 화살은 몸을 통과하므로 일직선 위 적을 모두 꿰뚫음
function fPierce64(w, S) {
  const C = N64C.pierce, p = G.p, range = C.range * S.area, tg = nearestEnemy(p.x, p.y, range); if (!tg) return false;
  const a0 = Math.atan2(tg.y - p.y, tg.x - p.x), d = C.dmg * nk64(w, S);
  for (let i = 0; i < S.n; i++) shoot({ kind: 'arrow', x: p.x, y: p.y, ang: a0 + (i - (S.n - 1) / 2) * 0.12, sp: C.sp, r: C.w / 2, dmg: d, pierce: 999, life: range / C.sp, color: NCOL().c3, src: 'arrow', n64: 1 });
  S60().pierceN = (S60().pierceN || 0) + 1;
  return C.cd * nc64(w, S);
}
// 묘비: 쏘지 않음, 근처에서 죽은 적의 영혼을 빨아들여 모으고 다 차면 묘비에서 망령이 일어나 묘비 주변을 지킴 (묘비당 1마리)
function fTomb64(w, S) {
  const C = N64C.tomb, p = G.p, A = Ng(), mine = A.tombs.filter(o => o.w === w);
  if (mine.length >= C.max) return 0.5;
  if (!nearestEnemy(p.x, p.y, 420)) return false;
  let q = null; for (let k = 0; k < 8 && !q; k++) { const a = rand(6.28), x = p.x + Math.cos(a) * 46, y = p.y + Math.sin(a) * 46; if (!A.tombs.some(o => dist2(o.x, o.y, x, y) < 30 * 30)) q = { x, y }; }
  q = q || { x: p.x + rand(-40, 40), y: p.y + rand(-40, 40) };
  A.tombs.push({ w, x: q.x, y: q.y, t: 0, s: 0, wr: null }); S60().tomb = (S60().tomb || 0) + 1;
  fx({ kind: 'ring', x: q.x, y: q.y, r0: 4, r1: 20, dur: 0.25, color: NCOL().c1 });
  return C.cd * nc64(w, S);
}
function tombTick64(dt) {
  const A = Ng(), C = N64C.tomb;
  for (const o of A.tombs) { o.t += dt; if (o.t >= C.life || !G.p.weapons.includes(o.w)) o.dead = true; }
  A.tombs = A.tombs.filter(o => !o.dead);
}
function tombKill64(e) {                                                            // 묘비 근처 처치 → 영혼이 묘비로
  const A = Ng(), C = N64C.tomb;
  for (const o of A.tombs) {
    if (o.wr || dist2(o.x, o.y, e.x, e.y) > (C.R * wStats(o.w).area) ** 2) continue;
    o.s++; A.links.push({ x: e.x, y: e.y, tx: o.x, ty: o.y - 10, t: 0, dur: 0.3 });
    if (o.s >= C.need) {
      const w = o.w, S = wStats(w), T = o;
      o.wr = ally64({ kind: 'tomb', x: o.x, y: o.y - 12, life: C.life - o.t + 0.1, atk: N64C.wr.atk, sp: N64C.wr.sp, reach: N64C.wr.reach, dmg: WEAPONS.turret.base.dmg * 2.5 * nk64(w, S) / nMod64(), anchor: () => T, alive: () => !T.dead, guard: C.guard, src: 'turret' });
      S60().tombWr = (S60().tombWr || 0) + 1; fx({ kind: 'ring', x: o.x, y: o.y - 8, r0: 4, r1: 26, dur: 0.3, color: NCOL().c3 });
    }
    break;
  }
}
// 도깨비불: 푸른 도깨비불이 흔들흔들 떠가며 적을 따라가 반드시 닿고, 닿으면 크게 터짐 (불붙음 없음)
function fWisp64(w, S) {
  const C = N64C.wisp, p = G.p, tg = nearestEnemy(p.x, p.y, C.range * S.area); if (!tg) return false;
  const A = Ng(); if (A.wisps.length > 30) return 0.3;
  A.wisps.push({ x: p.x, y: p.y - 6, tg, t: 0, R: C.R * S.area, d: C.dmg * nk64(w, S), cr: CR60, ph: rand(6.28) });
  return C.cd * nc64(w, S);
}
function wispTick64(dt) {
  const A = Ng(), C = N64C.wisp;
  for (const o of A.wisps) {
    o.t += dt; if (!o.tg || o.tg.dead) o.tg = nearestEnemy(o.x, o.y, 300);
    if (!o.tg) { if (o.t > C.life) o.dead = true; continue; }                     // 대상이 있으면 닿을 때까지 따라감 (반드시 닿음)
    const dx = o.tg.x - o.x, dy = o.tg.y - o.y, d = Math.hypot(dx, dy) || 1, wob = Math.sin(o.t * 9 + o.ph) * 40;
    o.x += (dx / d * C.sp - dy / d * wob) * dt; o.y += (dy / d * C.sp + dx / d * wob) * dt;
    if (d < o.tg.r + 6) { o.dead = true; const x = o.x, y = o.y; withCR60(o.cr, () => gridQuery(x, y, o.R, e => damageEnemy(e, o.d, { src: 'fireball' })));
      A.booms.push({ x, y, R: o.R, t: 0, dur: 0.4, wisp: 1 }); S60().wisp = (S60().wisp || 0) + 1; }
  }
  A.wisps = A.wisps.filter(o => !o.dead);
}
// 조종: 낡은 종이 울리면 소환된 망령들도 함께 울부짖어, 망령 곁에도 울림이 퍼짐
function fKnell64(w, S) {
  const C = N64C.knell, p = G.p, A = Ng(), R = C.R * S.area, d = WEAPONS.bell.base.dmg * nk64(w, S);
  const wr = A.ally; if (!nearestEnemy(p.x, p.y, R) && !wr.some(a => nearestEnemy(a.x, a.y, C.wR))) return false;
  gridQuery(p.x, p.y, R, e => { damageEnemy(e, d, { src: 'bell' }); if (!e.dead) stun60(e, C.stun); });
  A.booms.push({ x: p.x, y: p.y, R, t: 0, dur: 0.4, ring: 1, bell: 1 });
  for (const a of wr) { gridQuery(a.x, a.y, C.wR * S.area, e => { damageEnemy(e, d * C.wK, { src: 'bell' }); if (!e.dead) stun60(e, C.stun); }); A.booms.push({ x: a.x, y: a.y, R: C.wR * S.area, t: 0, dur: 0.3, ring: 1 }); a.howl = G.time; }
  S60().knell = (S60().knell || 0) + 1; S60().knellWr = (S60().knellWr || 0) + wr.length;
  return C.cd * nc64(w, S);
}
// 망자의 손: 땅에서 망자의 손들이 솟아 최대 3마리 발목을 움켜쥐고, 붙잡은 동안 기운을 빨아들임 (끌어당김 없음)
function fHand64(w, S) {
  const C = N64C.hand, p = G.p, tg = nearestEnemy(p.x, p.y, C.range * S.area); if (!tg) return false;
  const L = [tg].concat(nearN60(tg.x, tg.y, C.near * S.area, C.more + 1).filter(o => o !== tg).slice(0, C.more)), d = C.dmg * nk64(w, S), A = Ng();
  for (const e of L) { damageEnemy(e, d, { src: 'thorn' }); if (e.dead) continue; root60(e, C.root);
    A.hands.push({ e, x: e.x, y: e.y, t: 0, dur: C.root + 0.15, tk: C.tick, d: d * C.tk, cr: CR60 }); }
  S60().hand = (S60().hand || 0) + L.length;
  return C.cd * nc64(w, S);
}
function handTick64(dt) {
  const A = Ng(), C = N64C.hand;
  for (const o of A.hands) {
    o.t += dt; if (!o.e.dead) { o.x = o.e.x; o.y = o.e.y; }
    if (o.t <= C.root && !o.e.dead) { o.tk -= dt; if (o.tk <= 0) { o.tk += C.tick; withCR60(o.cr, () => damageEnemy(o.e, o.d, { src: 'thorn' })); S60().handTk = (S60().handTk || 0) + 1; } }
  }
  A.hands = A.hands.filter(o => o.t < o.dur);
}
FUSE60.necromancer = {
  cleave: { nm: '넋 먹는 칼날', ds: '영혼 대검 휩쓸기, 벤 적이 많을수록 다음 휩쓸기가 넓어짐', fire: fEat64 },
  dagger: { nm: '넋 가르기', ds: '영혼 칼날로 긋고, 한 박자 뒤 같은 자리를 반투명 칼날이 한 번 더 그음 (60%)', fire: fRend64 },
  arrow: { nm: '꿰뚫는 혼살', ds: '몸을 통과하는 영혼 화살, 일직선 위 적을 모두 꿰뚫음', fire: fPierce64 },
  turret: { nm: '묘비', ds: '근처에서 죽은 적의 영혼을 모아, 다 차면 망령이 일어나 묘비 주변을 지킴 (최대 3개)', fire: fTomb64 },
  fireball: { nm: '도깨비불', ds: '푸른 도깨비불이 흔들흔들 적을 따라가 반드시 닿고 크게 터짐', fire: fWisp64 },
  bell: { nm: '조종', ds: '낡은 종이 울리면 망령들도 함께 울부짖어 망령 곁에도 울림 (50%)', fire: fKnell64 },
  thorn: { nm: '망자의 손', ds: '망자의 손이 최대 3마리 발목을 움켜쥐고, 붙잡은 동안 기운을 빨아들임', fire: fHand64 },
};

/* ---------- 인물 연결점 ---------- */
Object.assign(HERO60.necromancer, {
  impl: true,
  br: [{ k: 'A', nm: '흡혼', ds: '줄기가 3마리까지 이어짐' }, { k: 'B', nm: '수혼', ds: '등불로 처치한 적의 영혼은 줍지 않아도 바로 모임, 줄기 피해 +25%' }],
  wak: { A: { nm: '봉혼', ds: '3초마다 등불 앞 구멍이 열려 곁의 약한 적을 삼킴' }, B: { nm: '폭혼', ds: '줄기에 이어진 채 죽은 적의 영혼이 부풀어 터짐 (반경 60)' } },
  fire: nLamp64,
  onKill(e) {
    const b = baseW(), lampK = e.ls === 'lamp' && b;
    if (b && b.aw === 'B' && b.lk && b.lk.includes(e) && G.time - (b.lkT || 0) < 0.4) { const S = wStats(b); Ng().bombs.push({ x: e.x, y: e.y, t: 0, R: N64C.burst.R * S.area, d: ref64() * N64C.burst.k }); }
    if (Ng().tombs.length) tombKill64(e);
    if (lampK && b.br === 'B') { Ng().links.push({ x: e.x, y: e.y, t: 0, dur: 0.3, home: 1 }); gainSoul64(1); S60().soulLamp = (S60().soulLamp || 0) + 1; return; }   // 수혼: 즉시 흡수
    if (Math.random() < N64C.soul.ch) dropSoul64(e.x, e.y);
  },
  hurtMul() { const A = Ng(); return A.bind > 0 ? 1 - (1 - N64C.bind.guard) * A.bindK : 1; },
  onPick() { G.n64 = null; Ng(); SRC_NM.n64wr = '망령'; },
  onAwaken() { const A = Ng(); A.soulN = Math.min(A.soulN, soulPer64() - 1); },
  ultFn(k) { return k === 'A' ? ultRelease64 : k === 'B' ? ultBind64 : ultGiant64; },
  tick(dt) {
    const A = Ng();
    if (A.bind > 0) A.bind -= dt;
    soulTick64(dt); allyTick64(dt); sealTick64(dt); bombTick64(dt); giantTick64(dt); relTick64(dt); tombTick64(dt); wispTick64(dt); handTick64(dt);
    for (const k of ['booms', 'links']) { const L = A[k]; for (const o of L) o.t += dt; A[k] = L.filter(o => o.t < o.dur); }
    const S6 = S60(); S6.wrMax = Math.max(S6.wrMax || 0, A.ally.filter(a => a.anchor === pAnchor64).length);
  },
  status() { const A = Ng(); if (A.giant) return '거대 망령 ' + Math.ceil(A.giant.dur - A.giant.t); if (A.bind > 0) return '귀속 ' + Math.ceil(A.bind);
    return '영혼 ' + A.soulN + '/' + soulPer64() + ' · 망령 ' + A.ally.filter(a => a.anchor === pAnchor64).length; },
  dials() { const A = Ng(); return [{ ic: '혼', col: NCOL().c3, k: Math.max(0, Math.min(1, A.soulN / soulPer64())) }]; },
  draw: drawN64,
});

/* ---------- 그리기 (임시 도형, 최종본 아님) ---------- */
function ghost64(c, x, y, s, a, col, face) {                                         // 망령: 반투명 두건 + 흐르는 옷자락 + 빛나는 눈
  const t = G.time * 6 + x * 0.1;
  c.globalAlpha = a; c.fillStyle = col; c.beginPath(); c.arc(x, y - 4 * s, 6 * s, Math.PI, 0);
  for (let i = 0; i <= 4; i++) { const u = i / 4, px = x + 6 * s - u * 12 * s, py = y + 6 * s + Math.sin(t + i * 1.6) * 2 * s; c.lineTo(px, py); }
  c.closePath(); c.fill();
  c.globalAlpha = Math.min(1, a + 0.3); c.fillStyle = '#d8f4ff'; const fx0 = Math.cos(face || 0) * 1.5 * s;
  c.fillRect(x - 2.6 * s + fx0, y - 5 * s, 1.6 * s, 1.6 * s); c.fillRect(x + 1 * s + fx0, y - 5 * s, 1.6 * s, 1.6 * s);
}
function drawN64(c) {
  const A = G.n64; if (!A) return;
  const p = G.p, H = HERO60.necromancer, tau = Math.PI * 2, b = baseW(), now = G.time;
  c.lineCap = 'round';
  for (const s of A.souls) {                                                         // 바닥 영혼: 작은 청백 불꽃 (사라지기 3초 전 깜빡임)
    if (s.t > N64C.soul.life - 3 && !s.mag && Math.floor(s.t * 6) % 2) continue;
    const fl = Math.sin(now * 8 + s.x) * 1.5; c.globalAlpha = 0.85; c.fillStyle = H.c3; c.beginPath(); c.moveTo(s.x, s.y - 8 + fl); c.quadraticCurveTo(s.x + 4, s.y - 2, s.x, s.y + 2); c.quadraticCurveTo(s.x - 4, s.y - 2, s.x, s.y - 8 + fl); c.fill();
    c.globalAlpha = 0.25; c.beginPath(); c.arc(s.x, s.y - 3, 7, 0, tau); c.fill();
  }
  for (const o of A.tombs) {                                                         // 묘비: 회색 비석 + 모인 영혼 수만큼 푸른 점
    const fade = Math.min(1, o.t * 5) * (o.t > N64C.tomb.life - 0.6 ? (N64C.tomb.life - o.t) / 0.6 : 1);
    c.globalAlpha = fade; c.fillStyle = '#5a5866'; c.beginPath(); c.moveTo(o.x - 7, o.y + 8); c.lineTo(o.x - 7, o.y - 6); c.arc(o.x, o.y - 6, 7, Math.PI, 0); c.lineTo(o.x + 7, o.y + 8); c.closePath(); c.fill();
    c.strokeStyle = '#2a2833'; c.lineWidth = 1; c.stroke(); c.fillStyle = H.c3;
    for (let i = 0; i < Math.min(o.s, N64C.tomb.need); i++) { c.beginPath(); c.arc(o.x - 4 + i * 4, o.y - 2, 1.5, 0, tau); c.fill(); }
  }
  for (const o of A.hands) {                                                         // 망자의 손: 발밑에서 솟은 잿빛 손가락
    const up = Math.min(1, o.t / 0.1) * (o.t > o.dur - 0.12 ? (o.dur - o.t) / 0.12 : 1), er = o.e.r || 10;
    c.globalAlpha = 0.9 * up; c.strokeStyle = '#8f8aa0'; c.lineWidth = 2.5;
    for (let i = 0; i < 4; i++) { const bx = o.x - er * 0.6 + i * er * 0.4, by = o.y + er * 0.6; c.beginPath(); c.moveTo(bx, by + 3); c.lineTo(bx + (i - 1.5) * 1.5, by - 9 * up); c.stroke(); }
    c.globalAlpha = 0.35 * up; c.strokeStyle = H.c3; c.lineWidth = 1.5; c.beginPath(); c.ellipse(o.x, o.y + er * 0.6, er + 3, (er + 3) * 0.35, 0, 0, tau); c.stroke();
  }
  for (const a of A.ally) {                                                          // 망령 (작은·보통·강한·묘비)
    const s = a.k * (a.kind === 'tomb' ? 1 : 1), fade = Math.min(1, a.t * 4) * Math.min(1, (a.life - a.t) * 2);
    if (a.kind === 'strong') { c.globalAlpha = 0.3 * fade; c.strokeStyle = H.c3; c.lineWidth = 1; c.setLineDash([3, 4]); c.beginPath(); c.moveTo(p.x, p.y - 8); c.lineTo(a.x, a.y); c.stroke(); c.setLineDash([]); }   // 결속 줄
    ghost64(c, a.x, a.y, s, 0.55 * fade, a.kind === 'small' ? '#b8a8e8' : H.col, a.face);
    if (a.hitT && now - a.hitT < 0.15) { c.globalAlpha = 0.8; c.strokeStyle = H.c3; c.lineWidth = 1.5; const ex = a.x + Math.cos(a.face || 0) * 10, ey = a.y + Math.sin(a.face || 0) * 10;
      c.beginPath(); for (let i = -1; i <= 1; i++) { c.moveTo(ex - 4 + i * 3, ey - 5); c.lineTo(ex + 2 + i * 3, ey + 5); } c.stroke(); }
    if (a.howl && now - a.howl < 0.3) { c.globalAlpha = 0.6 * (1 - (now - a.howl) / 0.3); c.strokeStyle = H.c3; c.lineWidth = 1; c.beginPath(); c.arc(a.x, a.y - 4, 10 + (now - a.howl) * 30, 0, tau); c.stroke(); }
  }
  if (A.giant) {                                                                     // 거대 망령: 사령술사 곁 큰 망령 + 낫
    const Gt = A.giant, gx = p.x - 22, gy = p.y - 34, fade = Math.min(1, Gt.t * 3) * Math.min(1, (Gt.dur - Gt.t) * 2);
    ghost64(c, gx, gy, 3, 0.45 * fade, H.col, Gt.a);
    const sw = now - Gt.swT < 0.25 ? (now - Gt.swT) / 0.25 : -1;
    if (sw >= 0) { c.globalAlpha = 0.6 * (1 - sw); c.strokeStyle = H.c3; c.lineWidth = 6; c.beginPath(); c.arc(p.x, p.y, N64C.giant.R * (0.6 + 0.4 * sw), Gt.a - Math.PI / 2, Gt.a - Math.PI / 2 + Math.PI * Math.min(1, sw * 1.6)); c.stroke(); }
    c.globalAlpha = 0.8 * fade; c.strokeStyle = '#c8c4d8'; c.lineWidth = 2.5; const sa = Gt.a + (sw >= 0 ? -1.2 + sw * 2.4 : -0.6);
    c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx + Math.cos(sa) * 30, gy + Math.sin(sa) * 30); c.stroke(); c.beginPath(); c.arc(gx + Math.cos(sa) * 30, gy + Math.sin(sa) * 30, 10, sa + 1.6, sa + 3.4); c.stroke();
  }
  if (b) {                                                                           // 영혼 등불: 손에 든 등불, 불빛 4단계 = 영혼 차오름
    const hx = p.x + 10, hy = p.y - 12, st = Math.min(4, Math.floor(A.soulN / soulPer64() * 4) + 1), sw = Math.sin(now * 3) * 1.5;
    c.globalAlpha = 0.12 + st * 0.06; c.fillStyle = H.c3; c.beginPath(); c.arc(hx, hy + sw, 6 + st * 2.5, 0, tau); c.fill();
    c.globalAlpha = 1; c.strokeStyle = '#3a3048'; c.lineWidth = 1.5; c.strokeRect(hx - 3.5, hy - 4 + sw, 7, 8); c.beginPath(); c.moveTo(hx, hy - 4 + sw); c.lineTo(hx, hy - 8 + sw); c.stroke();
    c.fillStyle = b.aw ? '#e8fbff' : H.c3; c.globalAlpha = 0.5 + st * 0.12; c.fillRect(hx - 2, hy - 2.5 + sw, 4, 5);
    if (A.bind > 0) { c.globalAlpha = 0.35; c.strokeStyle = H.c3; c.lineWidth = 2; c.beginPath(); c.arc(p.x, p.y, 20 + Math.sin(now * 8) * 2, 0, tau); c.stroke(); }
  }
  if (A.hole) { const o = A.hole, k = o.t / N64C.seal.open; c.globalAlpha = 0.7 * (1 - k); c.fillStyle = '#120a1e'; c.beginPath(); c.ellipse(o.x, o.y, 9 * (1 - k * 0.5), 6, o.a, 0, tau); c.fill();
    c.strokeStyle = H.c3; c.lineWidth = 1; c.stroke(); c.globalAlpha = 0.18 * (1 - k); c.beginPath(); c.arc(p.x, p.y, o.R, o.a - 0.9, o.a + 0.9); c.stroke(); }
  for (const o of A.bombs) { const k = o.t / N64C.burst.grow; c.globalAlpha = 0.4 + 0.5 * k; c.fillStyle = H.c3; c.beginPath(); c.arc(o.x, o.y - 4, 4 + 8 * k + Math.sin(now * 30) * k * 1.5, 0, tau); c.fill(); }   // 폭혼: 부풀며 빛나는 영혼
  for (const o of A.wisps) { const fl = Math.sin(now * 14 + o.ph) * 2; c.globalAlpha = 0.35; c.fillStyle = '#7fd8ff'; c.beginPath(); c.arc(o.x, o.y, 9, 0, tau); c.fill();   // 도깨비불: 화염구 모양 푸른 불꽃
    c.globalAlpha = 0.9; c.fillStyle = '#bfefff'; c.beginPath(); c.moveTo(o.x, o.y - 9 + fl); c.quadraticCurveTo(o.x + 6, o.y, o.x, o.y + 5); c.quadraticCurveTo(o.x - 6, o.y, o.x, o.y - 9 + fl); c.fill(); }
  for (const o of A.rel) { c.globalAlpha = 0.85; c.fillStyle = H.c3; c.beginPath(); c.arc(o.x, o.y, 3.5, 0, tau); c.fill(); c.globalAlpha = 0.3; c.beginPath(); c.arc(o.x - o.vx * 0.03, o.y - o.vy * 0.03, 3, 0, tau); c.fill(); }
  for (const o of A.links) { const k = o.t / o.dur, tx = o.home ? p.x + 10 : o.tx, ty = o.home ? p.y - 12 : o.ty;   // 영혼이 등불(또는 묘비·구멍)로 빨려 감
    const x = o.x + (tx - o.x) * k, y = o.y + (ty - o.y) * k; c.globalAlpha = 0.8 * (1 - k * 0.5); c.fillStyle = o.eat ? '#9a7ad8' : H.c3; c.beginPath(); c.arc(x, y, o.eat ? 5 * (1 - k) + 1 : 2.5, 0, tau); c.fill(); }
  for (const o of A.booms) { const k = o.t / o.dur;
    if (o.ring) { c.globalAlpha = 0.6 * (1 - k); c.strokeStyle = o.bell ? '#c8c4d8' : H.c3; c.lineWidth = o.bell ? 4 : 2; c.beginPath(); c.arc(o.x, o.y, o.R * (0.25 + 0.75 * k), 0, tau); c.stroke(); continue; }
    if (o.sw) { c.globalAlpha = 0.6 * (1 - k); c.strokeStyle = H.c3; c.lineWidth = 3; c.beginPath(); c.arc(o.x, o.y, o.R, o.a - 1.4, o.a + 1.4); c.stroke(); continue; }
    c.globalAlpha = 0.7 * (1 - k); c.fillStyle = o.wisp ? '#7fd8ff' : H.c3; c.beginPath(); c.arc(o.x, o.y, o.R * (0.3 + 0.7 * Math.min(1, k * 2.5)), 0, tau); c.fill();
  }
  c.globalAlpha = 1;
}
