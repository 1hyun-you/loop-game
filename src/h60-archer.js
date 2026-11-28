/* ============================================================
   0.63 궁수 구현 (회차 94, 분할 구현 4차) — 기준: docs/characters/archer.md
   • 고유 규칙(제약형 + 연성형 + 자신형): "움직이면 느리게 쏘고, 서 있을수록 빨라짐" (0.69 회차 102 사용자 결정)
     - 이동 사격: 이동 중 전용·연성 무기 간격 3배, 멈추는 순간 서 있는 간격으로 줄어듦 / 매 횃대·미늘 줄화살은 서 있을 때만(가안) (이미 앉은 매는 움직여도 싸움)
     - 정지 중 공속 +180% (전용·연성만, 0.69 +80% → +180%), 0.69 버티기 사격: 서서 맞힌 공격은 반경 90 안 적을 밀어냄, 정지 중 경험치 흡수 범위 +60% (멈춤 인물 경험치 보조 수단)
   • 전용 무기 장궁: 발현 A 연사 → 무기 각성 A 속사 연발 / 발현 B 꿰뚫기 → 무기 각성 B 거대 화살
   • 궁극기: 기본 사냥 개시 / 인물 각성 A 매의 눈 + 매의 시선 / 인물 각성 B 치고 빠지기 + 화살 폭풍
   • 연성 7종: 초승달촉 화살·사냥칼 던지기·매 횃대·불화살·미늘 줄화살·우는살·가시줄 화살
   • 자동 플레이(시험·실기기 공용): 궁수 선택 후 '멈춰 쏘기' 전용 로직으로 전환 (아래 '자동 플레이')
   • 그림: 새 장면은 임시 도형 (최종본 아님, GPT 요청 대상), 수치는 전부 가안 (대규모 밸런스 단계 조정)
   ============================================================ */
const A63C = {
  still: { spd: 1.8, xp: 0.6, moveMin: 0.2 },                                       // 정지 공속 +180% (0.69 +80% → +180%), 흡수 범위 +60%, '움직였다' 판정 최소 이동 0.2초
  eye: { t0: 1, t1: 3, max: 2.8 },                                                  // 인물 각성 A 매의 눈: 1초 +180% → 3초 +280% (0.69 정지 공속 상향에 맞춰 +150% → +280%)
  hit: { n: 3, fan: 0.25, k: 1.5 },                                                 // 인물 각성 B 치고 빠지기: 멈춘 직후 첫 발동 부채꼴 3발 + 150%
  move: { k: 3 },                                                                    // 0.69 이동 사격(회차 102 사용자 결정): 움직이는 동안 전용·연성 무기 간격 3배
  guard: { R: 90, kb: 140, once: 0.4 },                                            // 0.69 버티기 사격: 서서 쏠 때 반경 90(0.6초) 안까지 붙은 적은 맞으면 밀려남 (같은 적 0.4초에 1번)
  bow: { sp: 540, r: 6 },
  rapidA: { n: 2, gap: 0.1 },                                                       // 발현 A 연사: 한 번에 2발·0.1초 간격
  pierceB: { dmg: 1.15 },                                                           // 발현 B 꿰뚫기: 사거리 끝까지 관통·피해 +15%
  volley: { every: 5, dur: 1.5, rate: 10, k: 0.5 },                                 // 무기 각성 A 속사 연발: 5번째 발동마다 1.5초·초당 10발·각 50%
  giant: { every: 4, w: 30, k: 2.5, kb: 260, sp: 760 },                             // 무기 각성 B 거대 화살: 4번째 발동마다 폭 30·화면 끝까지·250%·밀쳐냄
  hunt: { up: 0.35, rain: 1.0, n: 30, R: 0.5, r: 28, k: 2, dur: 5 },               // 사냥 개시: 화면 절반 범위, 화살 1발 = 장궁 피해 2배, 이후 5초 이동 중 사격
  flinch: { t: 0.4, k: 0.4, kBoss: 0.2 },                                           // 0.70 움찔: 전용·연성 화살에 맞은 적 0.4초 이동 -40% (수문장·마왕·정예 대장 -20%), 다시 맞으면 새로 시작 (회차 103 사용자 결정)
  gaze: { dur: 4, slow: 0.5, slowBoss: 0.25 },                                      // 매의 시선: 4초 화면 전체 적 이동 -50% (수문장·마왕 -25%)
  storm: { dur: 3, rate: 12, k: 0.7, buff: 4 },                                     // 화살 폭풍: 3초 사방 난사·초당 12발·각 70% → 4초 모든 발동 첫 발동 강화
  moon: { cd: 1.25, range: 220, R: 25, n: 3, sp: 560 },                             // 초승달촉 화살 (칼날 폭 50)
  knife: { cd: 0.9, range: 160, n: 2, sp: 480 },                                    // 사냥칼 던지기
  perch: { cd: 4, max: 3, life: 10, atk: 1.2, R: 180, dmg: 12, fly: 0.22 },         // 매 횃대
  fire: { cd: 1.2, range: 300, R: 60, sp: 520, crowd: 60 },                         // 불화살
  barb: { range: 140, reel: 0.2, dmg: 5, keep: 1.2 },                               // 미늘 줄화살 (0.25초마다 5, 되감아 다시 박기 0.2초)
  whistle: { cd: 3, range: 300, w: 40, stun: 0.2, R: 140, sp: 600 },               // 우는살
  vine: { cd: 1.3, range: 200, near: 60, more: 2, root: 0.5, sp: 560 },             // 가시줄 화살
};
const Ag = () => G.a63 || (G.a63 = { still: 0, mov: 0, hunt: 0, gaze: 0, storm: 0, stormBuf: 0, stormA: 0, stormT: 0, volley: null, rain: null,
  ar: [], perches: [], knives: [], booms: [], rings: [], lines: [], hawks: [] });
const isA63 = () => G.p && G.p.job === 'archer' && HERO60.archer.impl;
const ACOL = () => HERO60.archer;
const ak63 = (w, S) => fk60r(w, S);                              // 짝 무기 강화·보조 효과 배율
const ac63 = (w, S) => S.cd / WEAPONS[w.id].base.cd;
const own63 = w => !!(w && (w.base || w.fu));                                       // 인물 규칙 대상 (전용·연성)
const canShoot63 = () => !G.p.moving || Ag().hunt > 0;                              // 제 속도 사격 가능 여부 (서 있음, 사냥 개시 5초 동안은 이동 중에도) — 아니면 이동 사격(간격 3배)

/* ---------- 정지 공속 (전용·연성) ---------- */
function stillBonus63() {
  const A = Ag(), C = A63C;
  if (G.p.moving && !(A.hunt > 0)) return 0;
  if (G.p.job2 !== 'A') return C.still.spd;
  const t = A.still;                                                                 // 매의 눈: 서 있는 시간에 따라 +80% → +150%
  return t <= C.eye.t0 ? C.still.spd : t >= C.eye.t1 ? C.eye.max : C.still.spd + (C.eye.max - C.still.spd) * (t - C.eye.t0) / (C.eye.t1 - C.eye.t0);
}
/* 치고 빠지기: 움직였다 멈춘 뒤 각 전용·연성 무기의 첫 발동 강화 (화살 폭풍 뒤 4초는 모든 발동) */
function takeHB63(w) {
  const A = Ag();
  if (G.p.job2 !== 'B') return false;
  if (A.stormBuf > 0) { S60().hbStorm = (S60().hbStorm || 0) + 1; return true; }
  if (!w.hb63) return false; w.hb63 = false; S60().hb = (S60().hb || 0) + 1; return true;
}
let HBK63 = 1;                                                                       // 현재 발동의 치고 빠지기 배율 (연성 피해에 곱함)

/* 발동 감싸기: 이동 중이면 간격 3배로 발동(서 있을 때만 무기는 대기), 치고 빠지기 판정은 서 있을 때만 */
function af63(fn, keepMove, stillOnly) {
  return function (w, S) {
    const mv = !canShoot63() && !keepMove;
    if (mv && stillOnly) { if (w.id === 'lamp') w.lk63 = null; S60().held = (S60().held || 0) + 1; return 0.05; }   // 매 횃대·미늘 줄화살은 서 있을 때만 (자리를 잡는 무기)                                            // 0.69 이동 사격: 움직이는 동안에도 발동, 간격 3배 (치고 빠지기 강화는 멈춘 뒤에만)
    if (mv) { const r = fn(w, S, false); if (r !== false) S60().mvShot = (S60().mvShot || 0) + 1; return typeof r === 'number' ? r * A63C.move.k : r; }
    const hb = takeHB63(w); HBK63 = hb ? A63C.hit.k : 1; w.hbNow = hb;
    try { const r = fn(w, S, hb); if (r === false && hb) w.hb63 = true; return r; } finally { HBK63 = 1; w.hbNow = false; }
  };
}

/* ---------- 화살 (궁수 전용 투사체: 관통·폭·밀쳐냄·꽂힘을 직접 다룸) ----------
   o: { x, y, a, sp, L(거리), r(판정 반경), dmg, src, pierce, kb, onHit(e, pr), onEnd(pr), noHit, kind, col, silver } */
function arrow63(o) {
  const A = Ag(); if (A.ar.length > 260) return null;
  const pr = Object.assign({ r: A63C.bow.r, pierce: 0, kind: 'arrow', col: ACOL().c3 }, o);
  pr.vx = Math.cos(pr.a) * pr.sp; pr.vy = Math.sin(pr.a) * pr.sp; pr.life = pr.L / pr.sp; pr.t = 0; pr.x0 = pr.x; pr.y0 = pr.y;
  pr.hits = new Set(); pr.cr = CR60;                                                  // 발동 때 치명타 판정을 들고 감
  A.ar.push(pr); return pr;
}
function arTick63(dt) {
  const A = Ag();
  for (const pr of A.ar) {
    if (pr.dead) continue;
    pr.t += dt; pr.x += pr.vx * dt; pr.y += pr.vy * dt;
    if (!pr.noHit) gridQuery(pr.x, pr.y, pr.r + 30, e => {
      if (pr.dead || e.dead || pr.hits.has(e) || dist2(e.x, e.y, pr.x, pr.y) > (e.r + pr.r) ** 2) return;
      pr.hits.add(e);
      if (pr.onHit) pr.onHit(e, pr); else damageEnemy(e, pr.dmg, { src: pr.src, cr60: pr.cr, kb: pr.kb, fx: pr.x - pr.vx * 0.05, fy: pr.y - pr.vy * 0.05 });
      if (pr.pass) pr.pass(e, pr);
      if (pr.hits.size > pr.pierce) { pr.dead = true; pr.hitEnd = true; }
    });
    else if (pr.pass) gridQuery(pr.x, pr.y, pr.r + 30, e => { if (!e.dead && !pr.hits.has(e) && dist2(e.x, e.y, pr.x, pr.y) <= (e.r + pr.r) ** 2) { pr.hits.add(e); pr.pass(e, pr); } });
    if (!pr.dead && pr.t >= pr.life) pr.dead = true;
    if (pr.dead && pr.onEnd) { const f = pr.onEnd; pr.onEnd = null; withCR60(pr.cr, () => f(pr)); }
  }
  A.ar = A.ar.filter(pr => !pr.dead);
}
const ang63 = (x, y, t) => Math.atan2(t.y - y, t.x - x);
function hitOpt63(pr, extra) { return Object.assign({ src: pr.src, cr60: pr.cr, fx: pr.x0, fy: pr.y0 }, extra || {}); }

/* ---------- 전용 무기 장궁 ---------- */
function aBow63(w, S, hb) {
  const C = A63C, p = G.p, D = WEAPONS.arrow.base, range = D.range * S.area, tg = nearestEnemy(p.x, p.y, range); if (!tg) return false;
  const k = (w.an = (w.an || 0) + 1), A = Ag(), sil = !!w.aw;
  if (w.aw === 'A' && k % C.volley.every === 0) {                                     // 속사 연발: 1.5초 연달아 (초당 10발·각 50%·가장 가까운 적)
    A.volley = { w, t: C.volley.dur, gap: 0, k: hb ? C.hit.k : 1 }; S60().volley = (S60().volley || 0) + 1;
    return C.volley.dur;
  }
  if (w.aw === 'B' && k % C.giant.every === 0) {                                     // 거대 화살: 폭 30·화면 끝까지 관통·250%·밀쳐냄
    const L = Math.hypot(VIEW.w, VIEW.h), a0 = ang63(p.x, p.y, tg), fan = hb ? [-C.hit.fan, 0, C.hit.fan] : [0];
    for (const da of fan) arrow63({ x: p.x, y: p.y, a: a0 + da, sp: C.giant.sp, L, r: C.giant.w / 2, dmg: S.dmg * C.giant.k * (hb ? C.hit.k : 1), src: 'arrow', pierce: 999, kb: C.giant.kb, kind: 'giant', silver: 1 });
    S60().giant = (S60().giant || 0) + 1; shake(2, 0.12);
    return S.cd;
  }
  const dmg = S.dmg * (w.br === 'B' ? C.pierceB.dmg : 1) * (hb ? C.hit.k : 1), pierce = w.br === 'B' ? 999 : S.pierce;
  const volley = () => {
    const t = nearestEnemy(G.p.x, G.p.y, range) || tg; if (t.dead && !nearestEnemy(G.p.x, G.p.y, range)) return;
    const a0 = ang63(G.p.x, G.p.y, t), fan = hb ? [-C.hit.fan, 0, C.hit.fan] : [0];
    for (const da of fan) for (let i = 0; i < S.n; i++) arrow63({ x: G.p.x, y: G.p.y, a: a0 + da + (i - (S.n - 1) / 2) * 0.12, sp: C.bow.sp, L: range, dmg, src: 'arrow', pierce, silver: sil, kind: w.br === 'B' ? 'long' : 'arrow' });
  };
  volley();
  if (w.br === 'A') for (let i = 1; i < C.rapidA.n; i++) G.later.push({ t: C.rapidA.gap * i, f: () => { if (!G.result && G.p.weapons.includes(w)) volley(); } });   // 연사: 같은 발동 = 같은 치명타 판정
  if (hb) for (const da of [-1, 1]) fx({ kind: 'arc', a: a0Of63(tg) + da * C.hit.fan, arc: 0.2, r: 40, dur: 0.15, color: ACOL().c1 });
  return S.cd;
}
const a0Of63 = t => ang63(G.p.x, G.p.y, t);
function volleyTick63(dt) {
  const A = Ag(), V = A.volley; if (!V) return;
  V.t -= dt; if (V.t <= 0 || !G.p.weapons.includes(V.w)) { A.volley = null; return; }
  V.gap -= canShoot63() ? dt : dt / A63C.move.k;                                    // 0.69 이동 중에는 3배 느리게
  if (V.gap > 0) return; V.gap = 1 / A63C.volley.rate;
  const w = V.w, S = wStats(w), range = WEAPONS.arrow.base.range * S.area, t = nearestEnemy(G.p.x, G.p.y, range); if (!t) return;
  withCR60(roll60(w), () => arrow63({ x: G.p.x, y: G.p.y, a: ang63(G.p.x, G.p.y, t) + rand(-0.04, 0.04), sp: A63C.bow.sp * 1.15, L: range, dmg: S.dmg * A63C.volley.k * V.k, src: 'arrow', pierce: S.pierce, silver: 1, kind: 'quick' }));   // 연달아 쏘는 1발 = 공격 1번
}

/* ---------- 궁극기 ---------- */
const ref63 = () => { const b = baseW(); return b ? wStats(b).dmg : WEAPONS.arrow.base.dmg; };
function capStop63() {                                                              // 0.69 멈춤(또는 사냥 개시) 순간: 이동 사격의 3배 간격을 서 있는 간격으로 (치고 빠지기 강화 대기 무기는 즉시, 속사 연발 중인 무기는 연발 끝까지)
  const A = Ag();
  for (const w of G.p.weapons) if (own63(w) && w.t > 0) w.t = Math.min(w.t, w.hb63 ? 0.05 : Math.max(wStats(w).cd, A.volley && A.volley.w === w ? A.volley.t : 0));
}
function ultHunt63(p) {                                                             // 사냥 개시: 하늘로 쏜 화살이 화면 절반 범위에 쏟아짐 → 5초 이동 중에도 사격
  const C = A63C.hunt, A = Ag(); A.hunt = C.dur; S60().hunt = (S60().hunt || 0) + 1; capStop63();
  A.lines.push({ x: p.x, y: p.y, up: 1, t: 0, dur: C.up });
  uLater(C.up, () => { const R = VIEW.w * C.R, d = ref63() * C.k, x = G.p.x, y = G.p.y, ts = [];
    gridQuery(x, y, R, e => { if (!e.dead) ts.push(e); });
    for (let i = 0; i < C.n; i++) {
      const e = ts.length && i < C.n * 0.7 ? ts[i % ts.length] : null, a = rand(Math.PI * 2), rr = Math.sqrt(Math.random()) * R;
      const tx = e ? e.x + rand(-10, 10) : x + Math.cos(a) * rr, ty = e ? e.y + rand(-10, 10) : y + Math.sin(a) * rr;
      uLater(C.rain * i / C.n, () => { gridQuery(tx, ty, C.r, o => damageEnemy(o, d, { src: 'ult' })); Ag().booms.push({ x: tx, y: ty, R: C.r, t: 0, dur: 0.25, rain: 1 }); });
    }
    fx({ kind: 'ring', x, y, r0: R * 0.9, r1: R, dur: 0.5, color: ACOL().c1 });
  });
  return C.dur;
}
function ultGaze63(p) {                                                             // 매의 시선: 4초 화면 전체 적 이동 -50% (수문장·마왕 -25%) + 정지 공속 즉시 최대
  const C = A63C.gaze, A = Ag(); A.gaze = C.dur; A.still = Math.max(A.still, A63C.eye.t1); S60().gaze = (S60().gaze || 0) + 1;
  fx({ kind: 'ring', x: p.x, y: p.y, r0: 20, r1: VIEW.w * 0.6, dur: 0.6, color: ACOL().c3, follow: true });
  return C.dur;
}
function ultStorm63(p) {                                                            // 화살 폭풍: 제자리에서 돌며 3초 사방 난사 → 4초 모든 발동 첫 발동 강화
  const A = Ag(); A.storm = A63C.storm.dur; A.stormA = rand(Math.PI * 2); A.stormT = 0; S60().storm = (S60().storm || 0) + 1;
  return A63C.storm.dur;
}
function stormTick63(dt) {
  const A = Ag(), C = A63C.storm;
  if (A.stormBuf > 0) A.stormBuf -= dt;
  if (!(A.storm > 0)) return;
  A.storm -= dt; A.stormA += dt * 7; A.stormT -= dt;
  const d = ref63() * C.k, L = WEAPONS.arrow.base.range;
  while (A.stormT <= 0) { A.stormT += 1 / C.rate; arrow63({ x: G.p.x, y: G.p.y, a: A.stormA + rand(-0.1, 0.1), sp: 600, L, dmg: d, src: 'ult', pierce: 0, kind: 'quick', silver: 1 }); }
  if (A.storm <= 0) { A.stormBuf = C.buff; toast('화살 폭풍 · 4초 첫 발동 강화', ACOL().c1); }
}

/* ---------- 연성 7종 (짝 무기 + 장궁) · 7종 공통: 이동 중 간격 3배(매 횃대·미늘 줄화살은 서 있을 때만) + 정지 공속 ---------- */
// 초승달촉 화살: 넓은 초승달 칼날을 촉으로 단 화살, 맞은 적에 큰 칼자국 + 칼날 폭 안 적 함께 베임 (첫 적에서 멈춤, 최대 3마리)
function fMoon63(w, S) {
  const C = A63C.moon, p = G.p, tg = nearestEnemy(p.x, p.y, C.range * S.area); if (!tg) return false;
  const d = FREF60.cleave * ak63(w, S) * HBK63, R = C.R * S.area;
  arrow63({ x: p.x, y: p.y, a: ang63(p.x, p.y, tg), sp: C.sp, L: C.range * S.area, r: 9, dmg: d, src: 'cleave', kind: 'moon',
    onHit: (e, pr) => { const L = [e].concat(nearN60(e.x, e.y, R + 14, C.n + 1).filter(o => o !== e)).slice(0, C.n);
      for (const o of L) { cut60(o, ACOL().c1); damageEnemy(o, pr.dmg, hitOpt63(pr)); }
      Ag().booms.push({ x: e.x, y: e.y, R, a: Math.atan2(pr.vy, pr.vx), t: 0, dur: 0.25, moon: 1 }); S60().moonN = (S60().moonN || 0) + L.length; } });
  return C.cd * ac63(w, S);
}
// 사냥칼 던지기: 가까이 온 적 2마리에게 허리의 사냥칼을 던져 그음 (회전하며 날아가 상처 선, 바닥에 꽂혔다 사라짐)
function fKnife63(w, S) {
  const C = A63C.knife, p = G.p, ts = nearN60(p.x, p.y, C.range * S.area, C.n); if (!ts.length) return false;
  const d = FREF60.dagger * ak63(w, S) * HBK63;
  for (const e of ts) {
    const x0 = p.x, y0 = p.y, tt = Math.sqrt(dist2(x0, y0, e.x, e.y)) / C.sp, K = { x0, y0, x: e.x, y: e.y, t: 0, fly: tt, dur: 0.45 };
    Ag().knives.push(K);
    G.later.push({ t: tt, f: () => { if (G.result) return; if (!e.dead) { K.x = e.x; K.y = e.y + e.r * 0.7; cut60(e, ACOL().c2); damageEnemy(e, d, { src: 'dagger', fx: x0, fy: y0 }); } } });
  }
  return C.cd * ac63(w, S);
}
// 매 횃대: 멈춰 서 있으면 곁에 횃대가 세워지고 매가 앉음, 매는 가까이 온 적에게 날아가 할퀴고 돌아옴 (세운 횃대의 매는 궁수가 움직여도 싸움)
function fPerch63(w, S) {
  const C = A63C.perch, p = G.p, A = Ag(), mine = A.perches.filter(o => o.w === w);
  if (mine.length >= C.max) return 0.5;
  if (!nearestEnemy(p.x, p.y, 420)) return false;
  let q = null; for (let k = 0; k < 8 && !q; k++) { const a = rand(Math.PI * 2), x = p.x + Math.cos(a) * 40, y = p.y + Math.sin(a) * 40; if (!A.perches.some(o => dist2(o.x, o.y, x, y) < 26 * 26)) q = { x, y }; }
  q = q || { x: p.x + rand(-34, 34), y: p.y + rand(-34, 34) };
  A.perches.push({ w, x: q.x, y: q.y, t: 0, atk: 0.4, hk: null }); S60().perch = (S60().perch || 0) + 1;
  fx({ kind: 'ring', x: q.x, y: q.y, r0: 4, r1: 18, dur: 0.25, color: ACOL().c2 });
  return C.cd * ac63(w, S);
}
function perchTick63(dt) {
  const A = Ag(), C = A63C.perch;
  for (const o of A.perches) {
    o.t += dt; if (o.t >= C.life || !G.p.weapons.includes(o.w)) { o.dead = true; continue; }
    const h = o.hk;
    if (h) {                                                                           // 매: 날아가 할퀴고 돌아옴
      h.t += dt; const e = h.e;
      if (!h.hit && h.t >= C.fly) { h.hit = true; if (!e.dead) withCR60(h.cr, () => damageEnemy(e, h.d, { src: 'turret', fx: o.x, fy: o.y })); if (!e.dead) h.ex = e.x, h.ey = e.y; }
      if (!h.hit && !e.dead) { h.ex = e.x; h.ey = e.y; }
      if (h.t >= C.fly * 2) o.hk = null;
      continue;
    }
    o.atk -= dt * ultCdMul(); if (o.atk > 0) continue;
    const w = o.w, S = wStats(w), e = nearestEnemy(o.x, o.y, C.R * S.area);
    if (!e) { o.atk = 0.25; continue; }
    o.atk = C.atk * ac63(w, S);
    o.hk = { e, t: 0, ex: e.x, ey: e.y, d: C.dmg * ak63(w, S), cr: roll60(w) };       // 매 1번 공격 = 공격 1번 판정
    S60().hawk = (S60().hawk || 0) + 1;
  }
  A.perches = A.perches.filter(o => !o.dead);
}
// 불화살: 적이 가장 많이 몰린 곳 한가운데에 불화살을 꽂아 터뜨림 (곧게 날아가 바닥에 꽂힘 → 화염구 모양 불덩이 폭발, 불붙음 없음)
function fFire63(w, S) {
  const C = A63C.fire, p = G.p, range = C.range * S.area, L = []; gridQuery(p.x, p.y, range, e => { if (!e.dead) L.push(e); });
  if (!L.length) return false;
  let best = L[0], bn = -1;
  for (const e of L.length > 40 ? L.slice(0, 40) : L) { let n = 0; gridQuery(e.x, e.y, C.crowd, () => { n++; }); if (n > bn) { bn = n; best = e; } }
  const tx = best.x, ty = best.y, R = C.R * S.area, d = FREF60.fireball * ak63(w, S) * HBK63, Ld = Math.sqrt(dist2(p.x, p.y, tx, ty));
  arrow63({ x: p.x, y: p.y, a: Math.atan2(ty - p.y, tx - p.x), sp: C.sp, L: Ld, noHit: true, dmg: d, src: 'fireball', kind: 'fire',
    onEnd: pr => { gridQuery(tx, ty, R, e => damageEnemy(e, d, { src: 'fireball', kb: 80, fx: tx, fy: ty })); Ag().booms.push({ x: tx, y: ty, R, t: 0, dur: 0.35, fire: 1 }); shake(1.5, 0.1); S60().fireN = (S60().fireN || 0) + 1; } });
  return C.cd * ac63(w, S);
}
// 미늘 줄화살: 줄 달린 미늘 화살을 박아 줄이 이어진 동안 계속 파고듦, 쓰러지면 줄을 되감아 다음 적에게 바로 다시 박음 (궁수가 움직이면 줄이 풀림)
function fBarb63(w, S) {
  const C = A63C.barb, p = G.p, R = C.range * S.area, e0 = w.lk63;
  if (e0 && !e0.dead && dist2(p.x, p.y, e0.x, e0.y) <= (R * C.keep) ** 2) {
    damageEnemy(e0, C.dmg * ak63(w, S) * HBK63, { src: 'lamp' }); w.lkT63 = G.time; w.tw63 = G.time;
    return 'tick';
  }
  const nx = nearestEnemy(p.x, p.y, R); if (!nx) { w.lk63 = null; return false; }
  if (e0 && e0.dead) { Ag().lines.push({ x: e0.x, y: e0.y, reel: 1, t: 0, dur: C.reel }); S60().reel = (S60().reel || 0) + 1; w.lk63 = null; return C.reel; }   // 되감기 → 0.2초 뒤 다시 박음
  w.lk63 = nx; w.lkT63 = G.time; S60().barb = (S60().barb || 0) + 1;
  arrow63({ x: p.x, y: p.y, a: ang63(p.x, p.y, nx), sp: 900, L: Math.sqrt(dist2(p.x, p.y, nx.x, nx.y)), noHit: true, kind: 'barb', dmg: 0, src: 'lamp' });
  damageEnemy(nx, C.dmg * ak63(w, S) * HBK63, { src: 'lamp' });
  return 'start';
}
// 우는살: 날카로운 소리를 내며 멀리 날아가 지나는 길의 적을 움찔하게 하고(피해 없음), 꽂힌 자리에서 큰 소리 고리가 퍼짐
function fWhistle63(w, S) {
  const C = A63C.whistle, p = G.p, R0 = C.range * S.area; let far = null, fd = -1;
  gridQuery(p.x, p.y, R0, e => { if (e.dead) return; const d = dist2(p.x, p.y, e.x, e.y); if (d <= R0 * R0 && d > fd) { fd = d; far = e; } });
  if (!far) return false;
  const tx = far.x, ty = far.y, R = C.R * S.area, d = FREF60.bell * ak63(w, S) * HBK63;
  arrow63({ x: p.x, y: p.y, a: Math.atan2(ty - p.y, tx - p.x), sp: C.sp, L: Math.sqrt(fd), r: C.w / 2, noHit: true, kind: 'whistle', dmg: 0, src: 'bell',
    pass: e => { stun60(e, C.stun); S60().whPass = (S60().whPass || 0) + 1; },
    onEnd: () => { gridQuery(tx, ty, R, e => { damageEnemy(e, d, { src: 'bell' }); if (!e.dead) stun60(e, C.stun); }); Ag().rings.push({ x: tx, y: ty, R, t: 0, dur: 0.4 }); S60().whistle = (S60().whistle || 0) + 1; } });
  return C.cd * ac63(w, S);
}
// 가시줄 화살: 가시 덩굴을 감아 둔 화살이 꽂히면 덩굴이 풀려 그 적과 곁의 최대 2마리 다리를 휘감아 묶음
function fVine63(w, S) {
  const C = A63C.vine, p = G.p, tg = nearestEnemy(p.x, p.y, C.range * S.area); if (!tg) return false;
  const d = FREF60.thorn * ak63(w, S) * HBK63, R = C.near * S.area;
  arrow63({ x: p.x, y: p.y, a: ang63(p.x, p.y, tg), sp: C.sp, L: C.range * S.area, dmg: d, src: 'thorn', kind: 'vine',
    onHit: (e, pr) => { const L = [e].concat(nearN60(e.x, e.y, R, C.more + 1).filter(o => o !== e).slice(0, C.more)), F = F60();
      for (const o of L) { damageEnemy(o, pr.dmg, hitOpt63(pr)); if (!o.dead) root60(o, C.root); if (F.vines.length < 40) F.vines.push({ x: o.x, y: o.y, R: o.r + 6, e: o, t: 0, dur: Math.max(0.55, C.root + 0.15), col: ACOL().c1, s: rand(7) }); }
      if (L.length > 1) Ag().lines.push({ x: e.x, y: e.y, vine: L.slice(1), t: 0, dur: 0.3 });
      S60().vineN = (S60().vineN || 0) + L.length; } });
  return C.cd * ac63(w, S);
}
FUSE60.archer = {
  cleave: { nm: '초승달촉 화살', ds: '넓은 초승달 칼날 촉 화살, 맞은 적에 큰 칼자국 + 칼날 폭 안 적 함께 베임 (최대 3마리)', fire: af63(fMoon63) },
  dagger: { nm: '사냥칼 던지기', ds: '가까이 온 적 2마리에게 사냥칼을 던져 그음', fire: af63(fKnife63) },
  turret: { nm: '매 횃대', ds: '멈춰 서 있으면 곁에 횃대가 서고 매가 앉음, 매가 가까이 온 적을 할퀴고 돌아옴 (최대 3개, 움직여도 매는 싸움)', fire: af63(fPerch63, false, true) },
  fireball: { nm: '불화살', ds: '적이 가장 많이 몰린 곳 한가운데에 불화살을 꽂아 터뜨림', fire: af63(fFire63) },
  lamp: { nm: '미늘 줄화살', ds: '줄 달린 미늘 화살을 박아 계속 파고듦, 쓰러지면 줄을 되감아 다음 적에게 다시 박음 (움직이면 줄이 풀림)', fire: af63(fBarb63, false, true) },
  bell: { nm: '우는살', ds: '가장 먼 적 쪽으로 날아가며 지나는 길의 적을 움찔하게 하고, 꽂힌 자리에서 큰 소리 고리', fire: af63(fWhistle63) },
  thorn: { nm: '가시줄 화살', ds: '꽂히면 덩굴이 풀려 그 적과 곁의 최대 2마리를 휘감아 묶음', fire: af63(fVine63) },
};

/* ---------- 인물 연결점 ---------- */
Object.assign(HERO60.archer, {
  impl: true,
  br: [{ k: 'A', nm: '연사', ds: '한 번에 2발씩 0.1초 간격으로 쏨' }, { k: 'B', nm: '꿰뚫기', ds: '화살이 사거리 끝까지 꿰뚫음, 피해 +15%' }],
  wak: { A: { nm: '속사 연발', ds: '5번째 발동마다 1.5초 동안 초당 10발 연달아 사격 (각 50%)' }, B: { nm: '거대 화살', ds: '4번째 발동마다 화면 끝까지 꿰뚫는 거대 화살 (250%·밀쳐냄)' } },
  fire: af63(aBow63),
  stat(w) { const b = stillBonus63(); return b > 0 ? { cd: 1 / (1 + b) } : {}; },
  onHit(e, o) {
    if (!e.dead && o && o.src) { const w = G.p.weapons.find(x => x.id === o.src); if (own63(w)) e.fl63 = G.time + A63C.flinch.t; }   // 0.70 움찔 (전용·연성 화살만)
    // 0.69 버티기 사격 (대규모 밸런스: 서 있는 동안 몰려든 적에 맞아 쓰러지는 구조 보완, 밀어냄 기준점 = 캐릭터)
    const p = G.p, C = A63C.guard; if ((p.moving && !(Ag().hunt > 0)) || e.dead || !noBoss60(e) || (e.ag63 || 0) > G.time) return;
    const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1; if (d > C.R + e.r) return;
    e.ag63 = G.time + C.once; e.kbx += dx / d * C.kb * JUICE.kbMul; e.kby += dy / d * C.kb * JUICE.kbMul; S60().guard = (S60().guard || 0) + 1;
  },
  onPick() { G.a63 = null; Ag(); },
  ultFn(k) { return k === 'A' ? ultGaze63 : k === 'B' ? ultStorm63 : ultHunt63; },
  tick(dt) {
    const A = Ag(), p = G.p;
    if (p.moving) { A.mov += dt; A.still = 0; if (!(A.hunt > 0)) for (const w of p.weapons) if (w.lk63) w.lk63 = null; }   // 움직이면 미늘 줄이 풀림
    else { if (A.mov >= A63C.still.moveMin && p.job2 === 'B') for (const w of p.weapons) if (own63(w)) w.hb63 = true;
      if (A.mov > 0) capStop63();   // 0.69 멈추는 순간: 이동 중 3배 간격을 서 있는 간격으로 줄임 (멈추면 바로 빠르게)
      A.mov = 0; A.still += dt; }
    if (A.hunt > 0) A.hunt -= dt;
    if (A.gaze > 0) A.gaze -= dt;
    volleyTick63(dt); stormTick63(dt); arTick63(dt); perchTick63(dt);
    for (const k of ['knives', 'booms', 'rings', 'lines']) { const L = A[k]; for (const o of L) o.t += dt; A[k] = L.filter(o => o.t < o.dur + (o.fly || 0)); }
    const S6 = S60(); S6.stillT = (S6.stillT || 0) + (p.moving ? 0 : dt); S6.moveT = (S6.moveT || 0) + (p.moving ? dt : 0);
    if (nearestEnemy(p.x, p.y, WEAPONS.arrow.base.range)) { if (p.moving) S6.rngMove = (S6.rngMove || 0) + dt; else S6.rngStill = (S6.rngStill || 0) + dt; }   // 시험 집계: 사거리 안에 적이 있을 때 서 있던 시간
  },
  status() { const A = Ag(); if (A.storm > 0) return '화살 폭풍'; if (A.hunt > 0) return '사냥 개시 ' + Math.ceil(A.hunt); if (A.gaze > 0) return '매의 시선 ' + Math.ceil(A.gaze);
    if (A.stormBuf > 0) return '첫 발동 강화 ' + Math.ceil(A.stormBuf); const b = stillBonus63(); return b > 0 ? '정지 +' + Math.round(b * 100) + '%' : '이동 중'; },
  dials() { const b = stillBonus63(), mx = G.p.job2 === 'A' ? A63C.eye.max : A63C.still.spd; return [{ ic: '정', col: b > 0 ? ACOL().c1 : '#6a7060', k: Math.max(0, Math.min(1, b / mx)) }]; },
  draw: drawA63,
});

/* 정지 중 경험치 흡수 범위 +60% */
const _pickRA63 = pickR;
pickR = function () { const r = _pickRA63.apply(this, arguments); return isA63() && !G.p.moving ? r * (1 + A63C.still.xp) : r; };

/* 매의 시선: 화면 안 적 이동 속도 감소 (수문장·마왕 -25%) — 이동 계산 동안만 속도를 낮췄다가 되돌림 */
const _updateEnemiesA63 = updateEnemies;
updateEnemies = function (dt) {
  const A = G && G.a63; if (!A || !(A.gaze > 0) || !isA63()) return _updateEnemiesA63.apply(this, arguments);
  const p = G.p, hw = VIEW.w / 2 + 30, hh = VIEW.h / 2 + 30, C = A63C.gaze, ch = [];
  for (const e of G.enemies) if (!e.dead && Math.abs(e.x - p.x) < hw && Math.abs(e.y - p.y) < hh) { const k = 1 - (e.boss || e.gk || e.cmd ? C.slowBoss : C.slow); ch.push([e, e.speed, e.sp0]); if (e.sp0 == null) e.sp0 = e.speed; e.speed *= k; }
  try { return _updateEnemiesA63.apply(this, arguments); } finally { for (let i = ch.length - 1; i >= 0; i--) { const [e, s, s0] = ch[i]; e.speed = s; e.sp0 = s0; } }   // 0.71 sp0 = 원래 속도 (돌진 예고선·분신 복사용)
};

/* 0.70 움찔: 화살에 맞은 적 잠깐 느려짐 — 매의 시선·포효·다른 둔화와 겹치면 더 강한 쪽 하나만 (겹쳐서 거의 멈추는 일 방지) */
const _updateEnemiesF63 = updateEnemies;
updateEnemies = function (dt) {
  if (!isA63() || G.tm.roar > 0) return _updateEnemiesF63.apply(this, arguments);
  const A = G.a63, gz = A && A.gaze > 0, p = G.p, hw = VIEW.w / 2 + 30, hh = VIEW.h / 2 + 30, C = A63C.flinch, now = G.time, ch = [];
  for (const e of G.enemies) if (!e.dead && e.fl63 > now && !(e.slowT > 0) && !(gz && Math.abs(e.x - p.x) < hw && Math.abs(e.y - p.y) < hh)) {   // 매의 시선은 화면 안 적에만 걸리므로 그 적만 제외
    ch.push([e, e.speed, e.sp0]); if (e.sp0 == null) e.sp0 = e.speed; e.speed *= 1 - (e.boss || e.gk || e.cmd ? C.kBoss : C.k); }
  try { return _updateEnemiesF63.apply(this, arguments); } finally { for (let i = ch.length - 1; i >= 0; i--) { const [e, s, s0] = ch[i]; e.speed = s; e.sp0 = s0; } }   // 역순 복원, sp0 = 원래 속도 (돌진 예고선·분신 복사용)
};

/* ---------- 자동 플레이: 궁수 전용 '멈춰 쏘기' (시험·실기기 자동 플레이 공용) ----------
   궁수는 서 있어야 제 속도로 공격하므로 기본은 '선다', 움직이는 것은 이유가 있을 때만:
   ① 공격 예고 안
   ② 가장 빠른 적이 닿기까지 0.25초 미만(체력 40% 미만 0.45초) → 트인 쪽으로 물러섬, 0.6초 여유가 생기거나 0.5초 지나면 다시 섬 (봉인석 구역 안 제외)
   ③ 목표 지점(봉인석·상자·야영지·수레·돌발 사건·샘) ④ 적 탄환이 0.5초 안에 닿음 → 비킴
   ⑤ 수문장·대장·거대 몹은 사거리 안 거리 유지 ⑥ 쏠 적이 없거나 바로 곁일 때 보석 ⑦ 사거리 안에 적이 없음 → 다가감
   인물 각성 A(매의 눈) = 더 오래 버팀, 인물 각성 B(치고 빠지기) = 짧게 물러섰다 멈추기를 반복 (멈춘 직후 강화 활용)
   예고 회피·목표 지점·다가가기는 공용 로직(autoVec), 물러서기·비키기 방향은 궁수 전용(위험이 적고 앞이 트인 쪽)
   기준값은 회차 94 비교 시험으로 정함: 일찍 물러설수록(0.9초) 서 있는 시간이 줄어 오히려 빨리 죽음, 0.25초가 궁수 8판 평균 생존 가장 김 */
const AUTO63 = { tcGo: 0.25, tcGoLow: 0.45, tcOk: 0.6, fleeMax: 0.5, minMove: 0.2, minStand: 0.45, lowHp: 0.4, keepLo: 150, keepHi: 270, hopAt: 1.4, hopT: 0.35, look: 180 };
V50.fight.archer = [AUTO63.keepLo, AUTO63.keepHi];
const _autoVecA63 = autoVec;
function aAutoState63() { return AUTO.a63 && AUTO.a63.run === G ? AUTO.a63 : (AUTO.a63 = { run: G, mode: 'stand', t: 0, at: G.time, why: '', hop: 0, fd: null }); }
/* 가장 빨리 닿을 적까지 남은 시간 (거리 ÷ 적 속도), 서 있을지 물러설지의 기준 */
function tcMin63(x, y) {
  const p = G.p; let m = Infinity;
  gridQuery(x, y, AUTO63.look, e => { if (e.dead || e.fixed || e.sleep) return; const dd = Math.sqrt(dist2(e.x, e.y, x, y)) - e.r - p.r, t = Math.max(0, dd) / Math.max(30, e.speed || 60); if (t < m) m = t; });
  return m;
}
/* 날아오는 적 탄환이 곧 닿는지 (서 있는 궁수는 탄환을 피하려면 움직여야 함) */
function shotT63() {
  const p = G.p; let m = Infinity; if (!G.eb) return m;
  for (const b of G.eb) { if (b.life <= 0) continue; const rx = p.x - b.x, ry = p.y - b.y; if (Math.abs(rx) > 220 || Math.abs(ry) > 220) continue;
    const sp = Math.hypot(b.vx, b.vy) || 1, ux = b.vx / sp, uy = b.vy / sp, al = rx * ux + ry * uy; if (al < -6) continue;
    if (Math.abs(rx * uy - ry * ux) < (b.r || 4) + p.r + 6) m = Math.min(m, al / sp); }
  return m;
}
/* 물러설 방향: 예고·탄환·결계 위험이 적고 앞쪽이 트인 쪽 (같은 방향 유지 가산) */
function fleeDir63(s) {
  const p = G.p; let best = AUTO_DIRS[0], bs = -1e9;
  for (const dv of AUTO_DIRS) {
    let n = 0; gridQuery(p.x + dv.x * 90, p.y + dv.y * 90, 110, e => { if (!e.dead && !e.fixed && !e.sleep) n++; });
    let sc = -autoDanger(p.x + dv.x * 35, p.y + dv.y * 35) - 0.7 * autoDanger(p.x + dv.x * 80, p.y + dv.y * 80) - 0.6 * n;
    if (s.fd) sc += 1.5 * (dv.x * s.fd.x + dv.y * s.fd.y);
    if (sc > bs) { bs = sc; best = dv; }
  }
  s.fd = best; AUTO.dir = { x: best.x, y: best.y };
  return (AUTO.out = { x: best.x, y: best.y, m: 1 });
}
autoVec = function () {
  if (!isA63()) return _autoVecA63.apply(this, arguments);
  const A = Ag(), s = aAutoState63(), p = G.p, S6 = S60(), j2 = p.job2;
  if (A.hunt > 0 || A.storm > 0) { s.mode = 'move'; s.why = 'hunt'; return _autoVecA63.apply(this, arguments); }   // 사냥 개시·화살 폭풍 중: 움직이며 쏨
  if (G.time < (s.next || 0) && s.out) return s.out;
  s.next = G.time + rand(0.06, 0.12);                                                 // 반응 지연 (공용보다 짧게: 서기·물러서기 전환이 잦음)
  const hz = hazT50(p.x, p.y), inHz = hz < Infinity, tg = autoTarget(), el = G.time - s.at, here = autoDanger(p.x, p.y);
  const range = WEAPONS.arrow.base.range * (baseW() ? wStats(baseW()).area : 1), tc = tcMin63(p.x, p.y);
  const go = (p.hp < p.maxHp * AUTO63.lowHp ? AUTO63.tcGoLow : AUTO63.tcGo) * (j2 === 'A' ? 0.8 : 1) * (STATE.dev.god ? 0.6 : 1);
  const fleeing = s.mode === 'move' && s.why === 'flee';
  let want = null;
  const inZone = G.ph.zone && dist2(p.x, p.y, G.ph.zone.x, G.ph.zone.y) < (G.ph.zone.r - 20) ** 2;
  if (inHz) want = 'hz';
  else if (tc < go && !inZone) want = 'flee';                                         // 적이 곧 닿음 → 물러섬 (목표 지점보다 우선, 봉인석 구역 안에서는 버팀)
  else if (tg && tg.k === 'goal') want = 'goal';
  else if (shotT63() < 0.5) want = 'dodge';                                           // 탄환이 곧 닿음 → 옆으로 비킴
  else if (fleeing && el < AUTO63.fleeMax && (tc < AUTO63.tcOk || el < AUTO63.minMove)) want = 'flee';   // 조금 여유가 생길 때까지 (최대 0.7초)
  else if (tg && (tg.k === 'boss' || tg.k === 'gk')) { const d = Math.sqrt(dist2(tg.x, tg.y, p.x, p.y)); if (d > range * 0.85) want = 'close'; else if (d < AUTO63.keepLo * 0.8) want = 'flee'; }
  else if (tg && tg.k === 'gem' && here < 0.8 && (!nearestEnemy(p.x, p.y, range) || dist2(tg.x, tg.y, p.x, p.y) < 70 * 70)) want = 'gem';   // 보석: 쏠 적이 없거나 바로 곁일 때만 (서 있으면 흡수 범위 +60%)
  else if (!nearestEnemy(p.x, p.y, range) && tg) want = 'close';
  else if (j2 === 'B' && s.mode === 'stand' && el > AUTO63.hopAt && tc < 2) { want = 'hop'; s.hop = G.time + AUTO63.hopT; }   // 치고 빠지기: 잠깐 물러섰다 멈춤
  if (!want && s.mode === 'move' && s.why === 'hop' && G.time < s.hop) want = 'hop';
  if (want && s.mode === 'stand' && el < AUTO63.minStand && (want === 'gem' || want === 'close' || want === 'hop')) want = null;   // 서자마자 다시 움직이지 않음 (가벼운 이유만)
  if (want) {
    if (s.mode !== 'move' || s.why !== want) { if (want === 'flee' && !fleeing) s.fd = null; s.mode = 'move'; s.why = want; s.at = G.time; S6.aMove = (S6.aMove || 0) + 1; const W = S6.aWhy || (S6.aWhy = {}); W[want] = (W[want] || 0) + 1; }
    if (want === 'flee' || want === 'hop' || want === 'dodge') return (s.out = fleeDir63(s));
    return (s.out = _autoVecA63.apply(this, arguments));
  }
  if (s.mode !== 'stand') { s.mode = 'stand'; s.why = ''; s.at = G.time; S6.aStand = (S6.aStand || 0) + 1; }
  if (ultReady() && !autoUltSetting() && (here > 2 || G.time - G.tm.readyAt > 8)) { S50().ultStop++; ultPress58('ai'); }   // 선 채로 궁극기
  return (s.out = AUTO.out = { x: 0, y: 0, m: 0 });
};

/* ---------- 그리기 (임시 도형, 최종본 아님) ---------- */
function drawArrow63(c, pr, H) {
  const a = Math.atan2(pr.vy, pr.vx), ux = Math.cos(a), uy = Math.sin(a), x = pr.x, y = pr.y;
  const L = pr.kind === 'giant' ? 34 : pr.kind === 'quick' ? 12 : 16;
  if (pr.silver || pr.kind === 'giant') {                                             // 무기 각성 공통: 화살 깃 빛 꼬리
    c.globalAlpha = 0.35; c.strokeStyle = H.c3; c.lineWidth = pr.kind === 'giant' ? pr.r * 1.2 : 3; c.beginPath(); c.moveTo(x - ux * (L + 26), y - uy * (L + 26)); c.lineTo(x - ux * L, y - uy * L); c.stroke();
  }
  c.globalAlpha = 1;
  if (pr.kind === 'giant') { c.strokeStyle = '#d8dce0'; c.lineWidth = 6; c.beginPath(); c.moveTo(x - ux * L, y - uy * L); c.lineTo(x, y); c.stroke();
    c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(x + ux * 14, y + uy * 14); c.lineTo(x - uy * pr.r, y + ux * pr.r); c.lineTo(x + uy * pr.r, y - ux * pr.r); c.closePath(); c.fill(); return; }
  c.strokeStyle = pr.kind === 'fire' ? '#ff9a4a' : pr.kind === 'vine' ? '#6faa4a' : H.c2; c.lineWidth = 2; c.beginPath(); c.moveTo(x - ux * L, y - uy * L); c.lineTo(x, y); c.stroke();
  c.fillStyle = pr.kind === 'moon' ? '#e8eef2' : pr.kind === 'fire' ? '#ffd23f' : H.c3;
  if (pr.kind === 'moon') { c.beginPath(); c.arc(x, y, 9, a - 1.6, a + 1.6); c.arc(x - ux * 4, y - uy * 4, 7, a + 1.4, a - 1.4, true); c.closePath(); c.fill(); }   // 초승달 칼날 촉
  else { c.beginPath(); c.moveTo(x + ux * 5, y + uy * 5); c.lineTo(x - uy * 3, y + ux * 3); c.lineTo(x + uy * 3, y - ux * 3); c.closePath(); c.fill(); }
  if (pr.kind === 'fire') { c.globalAlpha = 0.7; c.fillStyle = '#ff7a2a'; c.beginPath(); c.arc(x - ux * 2, y - uy * 2, 4 + Math.sin(G.time * 30), 0, Math.PI * 2); c.fill(); }
  if (pr.kind === 'vine') { c.strokeStyle = '#4f8a3a'; c.lineWidth = 1.5; c.beginPath(); for (let i = 0; i <= 6; i++) { const u = i / 6 * L, s = Math.sin(i * 2.2) * 3; const px = x - ux * u - uy * s, py = y - uy * u + ux * s; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); }
  if (pr.kind === 'whistle') { c.globalAlpha = 0.5; c.strokeStyle = H.c3; c.lineWidth = 1.5; for (let i = 1; i <= 2; i++) { c.beginPath(); c.arc(x, y, 6 + i * 5 + Math.sin(G.time * 40) * 2, a + 2.2, a + 4.1); c.stroke(); } }   // 우는 소리 물결
}
function drawA63(c) {
  const A = G.a63; if (!A) return;
  const p = G.p, H = HERO60.archer, tau = Math.PI * 2, b = baseW();
  c.lineCap = 'round';
  if (b) {                                                                             // 장궁: 몸 곁의 활 (무기 각성 = 은빛 시위)
    const a = Math.atan2(p.face.y, p.face.x), x = p.x + Math.cos(a) * 10, y = p.y + Math.sin(a) * 10 - 4, drawK = p.moving && !(A.hunt > 0) ? 0 : 1;
    c.globalAlpha = 0.95; c.strokeStyle = H.c2; c.lineWidth = 2.5; c.beginPath(); c.arc(x, y, 11, a - 1.2, a + 1.2); c.stroke();
    c.strokeStyle = b.aw ? '#e8eef6' : '#d8d0b8'; c.lineWidth = b.aw ? 1.6 : 1; c.beginPath(); c.moveTo(x + Math.cos(a - 1.2) * 11, y + Math.sin(a - 1.2) * 11); c.lineTo(x - Math.cos(a) * 4 * drawK, y - Math.sin(a) * 4 * drawK); c.lineTo(x + Math.cos(a + 1.2) * 11, y + Math.sin(a + 1.2) * 11); c.stroke();
  }
  const sb = stillBonus63();                                                           // 정지 표시: 발밑 연두 고리 (서 있는 동안, 매의 눈은 단계마다 진해짐)
  if (sb > 0 && !(A.storm > 0)) { c.globalAlpha = 0.25 + 0.3 * (sb / A63C.eye.max); c.strokeStyle = H.c1; c.lineWidth = 1.5; c.beginPath(); c.ellipse(p.x, p.y + 12, 13 + sb * 3, 5 + sb, 0, 0, tau); c.stroke(); }
  if (A.gaze > 0) { c.globalAlpha = 0.18; c.strokeStyle = H.c3; c.lineWidth = 2; c.setLineDash([6, 8]); c.beginPath(); c.arc(p.x, p.y, VIEW.w * 0.5, 0, tau); c.stroke(); c.setLineDash([]); }
  if (A.storm > 0) { c.globalAlpha = 0.5; c.strokeStyle = H.c1; c.lineWidth = 2; c.beginPath(); c.arc(p.x, p.y, 22, A.stormA, A.stormA + 4); c.stroke(); }
  for (const o of A.perches) {                                                         // 매 횃대: 나무 기둥 + 가로대 + 앉은 매
    const fade = Math.min(1, o.t * 5) * (o.t > A63C.perch.life - 0.6 ? (A63C.perch.life - o.t) / 0.6 : 1);
    c.globalAlpha = fade; c.strokeStyle = '#6b4a2b'; c.lineWidth = 3; c.beginPath(); c.moveTo(o.x, o.y + 10); c.lineTo(o.x, o.y - 14); c.moveTo(o.x - 8, o.y - 14); c.lineTo(o.x + 8, o.y - 14); c.stroke();
    const h = o.hk; let hx = o.x, hy = o.y - 19;
    if (h) { const u = h.t < A63C.perch.fly ? h.t / A63C.perch.fly : 2 - h.t / A63C.perch.fly; hx = o.x + (h.ex - o.x) * u; hy = (o.y - 19) + (h.ey - (o.y - 19)) * u - Math.sin(u * Math.PI) * 18; }
    c.fillStyle = '#8a6a48'; c.beginPath(); c.ellipse(hx, hy, 5, 4, 0, 0, tau); c.fill();
    const fl = h ? Math.sin(G.time * 30) * 5 : 1; c.beginPath(); c.moveTo(hx - 2, hy); c.lineTo(hx - 9, hy - fl); c.lineTo(hx - 3, hy + 2); c.moveTo(hx + 2, hy); c.lineTo(hx + 9, hy - fl); c.lineTo(hx + 3, hy + 2); c.fill();
    c.fillStyle = '#f0d070'; c.fillRect(hx + 3, hy - 3, 2, 2);
    if (h && h.hit && h.t < A63C.perch.fly + 0.12) { c.strokeStyle = H.c3; c.lineWidth = 1.5; c.beginPath(); for (let i = -1; i <= 1; i++) { c.moveTo(h.ex - 6 + i * 4, h.ey - 6); c.lineTo(h.ex + 2 + i * 4, h.ey + 6); } c.stroke(); }   // 할퀸 자국
  }
  const lw = p.weapons.find(w => w.fu && w.fu.job === 'archer' && w.id === 'lamp');   // 미늘 줄화살: 궁수와 적 사이 팽팽한 가는 줄, 파고들 때마다 떨림
  if (lw && lw.lk63 && !lw.lk63.dead && G.time - (lw.lkT63 || 0) < 0.5) {
    const e = lw.lk63, tr = G.time - (lw.tw63 || 0) < 0.08 ? 2 : 0, mx = (p.x + e.x) / 2, my = (p.y + e.y) / 2 + (tr ? Math.sin(G.time * 60) * tr : 0);
    c.globalAlpha = 0.9; c.strokeStyle = '#e8e0c8'; c.lineWidth = 1; c.beginPath(); c.moveTo(p.x, p.y - 4); c.quadraticCurveTo(mx, my, e.x, e.y); c.stroke();
    c.fillStyle = H.c2; c.beginPath(); c.arc(e.x, e.y, 2.5 + tr, 0, tau); c.fill();
  }
  for (const pr of A.ar) drawArrow63(c, pr, H);
  for (const K of A.knives) {                                                          // 사냥칼: 회전하며 날아가 바닥에 꽂힘
    const f = Math.min(1, K.t / K.fly), x = K.x0 + (K.x - K.x0) * f, y = K.y0 + (K.y - K.y0) * f, rot = f < 1 ? K.t * 24 : 2.3;
    c.globalAlpha = f < 1 ? 1 : Math.max(0, 1 - (K.t - K.fly) / K.dur); c.save(); c.translate(x, y); c.rotate(rot);
    c.fillStyle = '#d8dce0'; c.beginPath(); c.moveTo(8, 0); c.lineTo(0, -2.5); c.lineTo(0, 2.5); c.closePath(); c.fill(); c.fillStyle = H.c2; c.fillRect(-6, -1.5, 6, 3); c.restore();
  }
  for (const o of A.booms) { const k = o.t / o.dur;
    if (o.fire) { c.globalAlpha = 1 - k; c.fillStyle = '#ff8a2a'; c.beginPath(); c.arc(o.x, o.y, o.R * (0.4 + 0.6 * Math.min(1, k * 3)), 0, tau); c.fill(); c.globalAlpha = (1 - k) * 0.9; c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(o.x, o.y, o.R * 0.45 * (1 - k * 0.5), 0, tau); c.fill(); continue; }   // 화염구 모양 불덩이
    if (o.moon) { c.globalAlpha = 1 - k; c.strokeStyle = '#eef4f8'; c.lineWidth = 4; c.beginPath(); c.arc(o.x, o.y, o.R, o.a - 1.3, o.a + 1.3); c.stroke(); c.strokeStyle = H.c1; c.lineWidth = 1.5; c.stroke(); continue; }
    if (o.rain) { c.globalAlpha = 1 - k; c.strokeStyle = H.c3; c.lineWidth = 2; c.beginPath(); c.moveTo(o.x, o.y - 26 * (1 - Math.min(1, k * 4))); c.lineTo(o.x, o.y); c.stroke(); c.strokeStyle = H.c1; c.beginPath(); c.arc(o.x, o.y, o.R * k, 0, tau); c.stroke(); }
  }
  for (const o of A.rings) { const k = o.t / o.dur; c.globalAlpha = 0.7 * (1 - k); c.strokeStyle = H.c3; c.lineWidth = 5; c.beginPath(); c.arc(o.x, o.y, o.R * (0.2 + 0.8 * k), 0, tau); c.stroke(); c.strokeStyle = H.c1; c.lineWidth = 1.5; c.stroke(); }   // 우는살 소리 고리
  for (const o of A.lines) { const k = o.t / o.dur;
    if (o.up) { c.globalAlpha = 1 - k; c.strokeStyle = H.c3; c.lineWidth = 2; c.beginPath(); c.moveTo(o.x, o.y - 10 - k * 160); c.lineTo(o.x, o.y - 30 - k * 160); c.stroke(); continue; }   // 하늘로 쏜 화살
    if (o.reel) { c.globalAlpha = 1 - k; c.strokeStyle = '#e8e0c8'; c.lineWidth = 1; c.beginPath(); c.moveTo(p.x, p.y - 4); c.lineTo(o.x + (p.x - o.x) * k, o.y + (p.y - o.y) * k); c.stroke(); continue; }   // 줄 되감기
    if (o.vine) { c.globalAlpha = 1 - k; c.strokeStyle = '#6faa4a'; c.lineWidth = 2; for (const e of o.vine) { if (e.dead) continue; c.beginPath(); c.moveTo(o.x, o.y); c.quadraticCurveTo((o.x + e.x) / 2, (o.y + e.y) / 2 - 8, e.x, e.y + e.r * 0.6); c.stroke(); } }   // 풀려 튀는 덩굴
  }
  c.globalAlpha = 1;
}
