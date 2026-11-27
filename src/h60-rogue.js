/* ============================================================
   0.62 도적 구현 (회차 93, 분할 구현 3차) — 기준: docs/characters/rogue.md
   • 고유 규칙: 무기 칸 3개(전용 포함) + 그림자 연격 "치명타가 나면 그림자가 나타나 거든다"
     - 치명타 확률 = 공통(보조 효과 '치명타') + 도적 30% (전용·연성 무기만, 0.69 20% → 30%), 판정은 공격 1번에 1회 (hero60.js 치명타 공통)
     - 그림자 = 같은 공격 한 번 더(원래 피해 90%, 0.69 70% → 90%) 또는 무기마다 정해진 추가 동작, 기본형은 1번만
   • 전용 무기 단검: 발현 A 쌍단검 → 무기 각성 A 그림자 난무 / 발현 B 긴 선 → 무기 각성 B 그림자 균열
   • 궁극기: 기본 그림자 잠행 / 인물 각성 A 연격 최대 3번 + 그림자 분신 / 인물 각성 B 늦게 터지는 상처 + 일섬 → 단검 집중
   • 연성 7종: 흑풍·그림자 표창·대역 통나무·기폭찰 쿠나이·그림자 도둑·숨죽인 파문·올가미
   • 그림: 새 장면은 임시 도형 (최종본 아님, GPT 요청 대상), 수치는 전부 가안 (대규모 밸런스 단계 조정)
   ============================================================ */
const R60C = {
  crit: 0.3,                                                                       // 도적 치명타 확률 (전용·연성 무기, 0.69 20% → 30%)
  sh: { k: 0.9, gap: 0.15 },                                                        // 그림자 = 원래 공격 90%, 0.15초 뒤 (0.69 70% → 90%)
  chain: { n: 3, step: 0.2, xR: 60 },                                               // 인물 각성 A: 연격 최대 3번, 단계마다 +20%, 3번째 붉은 X자 반경 60
  wound: { t: 1.0, k: 1.8, max: 3 },                                                // 인물 각성 B: 늦게 터지는 상처 1초 뒤 1.8배, 최대 3겹
  twin: { cd: 0.5, dmg: 10 / 14 },                                                  // 발현 A 쌍단검: 간격 절반, 회당 피해 14 → 10
  long: { dmg: 16 / 14, ext: 40, w: 16 },                                           // 발현 B 긴 선: 피해 14 → 16, 대상 뒤로 40
  flurry: { every: 6, n: 5, gap: 0.08 },                                            // 무기 각성 A 그림자 난무: 6번째 발동마다 최대 5체 차례로
  rift: { every: 5, dur: 2.5, w: 40, L: 160, k: 2, tick: 0.3, tk: 0.25 },          // 무기 각성 B 그림자 균열: 5번째 공격마다
  stealth: { dur: 2, spd: 0.5, R: 60, k: 0.6, crit: 2 },                           // 그림자 잠행
  clone: { dur: 8, k: 0.4, gap: 0.08, off: 44 },                                    // 그림자 분신 2명
  slash: { w: 80, k: 1.0, crit: 3, wait: 0.4, wk: 0.5, focus: 4, fcd: 0.5, fdmg: 1.3 },   // 일섬 → 단검 집중 (단검 간격 절반·피해 +30%)
  gale: { cd: 1.25, range: 220, arc: 110 * Math.PI / 180, R: 86, kb: 180, sep: 90 },      // 흑풍
  star: { cd: 1.0, range: 300, w: 24, sp: 700 },                                    // 그림자 표창
  log: { cd: 10, hide: 1.5, hideK: 0.3, lure: 120, R: 55, k: 10 / 8, spinCd: 0.6, hits: 8, life: 8, kn: 10, kL: 140, kk: 12 / 8, hitCd: 0.5 },   // 대역 통나무
  kunai: { cd: 1.2, range: 260, R: 35, fuse: 0.5, stun: 0.2, sp: 600 },            // 기폭찰 쿠나이
  thief: { range: 140, crT: 1, freeze: 0.8, tear: 4 },                              // 그림자 도둑 (치명타 판정 1초에 1번, 뜯기 = 1초분 흡수 × 그림자 배율)
  ripple: { cd: 3, R: 140, stun: 0.2, back: 0.5, backT: 0.35, n: 5 },              // 숨죽인 파문
  snare: { more: 2, near: 90, pull: 40 },                                           // 올가미 (평소 = 가시 덩굴 기본형)
};
const Rg = () => G.r62 || (G.r62 = { inClone: false, stealth: 0, marks: null, sD: 0, clone: 0, focus: 0, hide: 0,
  cuts: [], shades: [], xs: [], wounds: [], rifts: [], gales: [], stars: [], logs: [], kunai: [], ripples: [], pulls: [], tears: [], slash: null });
const isR60 = () => G.p.job === 'rogue' && HERO60.rogue.impl;
const rk60 = (w, S) => fk60r(w, S);                              // 짝 무기 강화·보조 효과 배율
const rc60 = (w, S) => S.cd / WEAPONS[w.id].base.cd;
const RCOL = () => HERO60.rogue;
function rStat60(S, k) { return Object.assign({}, S, { dmg: S.dmg * k }); }
function rHit60(e, d, o) { if (e.dead) return null; damageEnemy(e, d, o); return { e, d }; }
function cutFx60(e, dark) { const R = Rg(); if (R.cuts.length < 80) R.cuts.push({ e, x: e.x, y: e.y, a: rand(-0.9, 0.9) + (Math.random() < 0.5 ? 0 : Math.PI / 2), r: e.r + 7, t: 0, dur: 0.3, dark }); }
function rCut60(e, d, src, dark) { cutFx60(e, dark); return rHit60(e, d, { src, fx: G.p.x, fy: G.p.y }); }   // 적 몸에 상처 선 + 피해

/* ---------- 그림자 연격 ----------
   act(m, n): 그림자 동작 (m = 피해 배율, n = 몇 번째 그림자), 맞힌 적 [{ e, d }] 반환
   opt.x: '한 번 더'형 → 인물 각성 A 3번째는 붉은 X자 (pos() 중심, d 기준 피해) / 추가 동작형은 같은 동작 반복 */
function shadow60(w, act, opt = {}) { shStage60(w, act, opt, 1); }
function shStage60(w, act, opt, n) {
  const C = R60C, R = Rg();
  G.later.push({ cr60: 1, t: C.sh.gap, f: () => {
    if (G.result || !G.p.weapons.includes(w)) return;
    const ctx = roll60(w), m = C.sh.k * (1 + C.chain.step * (n - 1)), S6 = S60();
    const hits = runCR60(ctx, () => n === 3 && opt.x ? redX60(w, opt.pos(), opt.d * m) : act(m, n)) || [];
    S6.shadow = (S6.shadow || 0) + 1; if (n > 1) S6.chain = (S6.chain || 0) + 1;
    for (const h of hits) if (h) { S6.shD = (S6.shD || 0) + h.d; if (G.p.job2 === 'B') wound60(h.e, h.d, srcOf60(w)); }
    if (G.p.job2 === 'A' && ctx.cr && n < C.chain.n) shStage60(w, act, opt, n + 1);
  } });
}
const srcOf60 = w => w.id;
function shadeAt60(x, y, a) { const R = Rg(); if (R.shades.length < 40) R.shades.push({ x, y, a: a || 0, t: 0, dur: 0.32 }); }
function behind60(e, d = 16) { const p = G.p, a = Math.atan2(e.y - p.y, e.x - p.x); return { x: e.x + Math.cos(a) * d, y: e.y + Math.sin(a) * d, a }; }
function redX60(w, pos, d) {                                                         // 3번째 연격: 붉은 X자 (반경 60)
  if (!pos) return [];
  const R = Rg(), x = pos.x, y = pos.y, hits = [], src = srcOf60(w);
  gridQuery(x, y, R60C.chain.xR, e => { const h = rHit60(e, d, { src, kb: 60, fx: x, fy: y }); if (h) hits.push(h); });
  R.xs.push({ x, y, t: 0, dur: 0.4 }); shake(2, 0.12); S60().redX = (S60().redX || 0) + 1;
  return hits;
}
/* 인물 각성 B: 늦게 터지는 상처 (그림자가 그은 자리, 1초 뒤 1.8배, 터지기 전 또 그으면 겹쳐 함께 터짐) */
function wound60(e, d, src) {
  if (!e || e.dead) return;
  const R = Rg(), W = R.wounds.find(o => o.e === e);
  if (W) { if (W.n < R60C.wound.max) { W.n++; W.d += d; } return; }
  if (R.wounds.length < 120) R.wounds.push({ e, d, n: 1, t: R60C.wound.t, src, a: rand(-0.8, 0.8) });
}
function woundTick60(dt) {
  const R = Rg();
  for (const W of R.wounds) {
    W.t -= dt; if (W.t > 0) continue; W.done = true;
    if (W.e.dead) continue;
    const x = W.e.x, y = W.e.y; damageEnemy(W.e, W.d * R60C.wound.k, { src: W.src, cr: false });
    S60().wound = (S60().wound || 0) + 1;
    R.xs.push({ x, y, t: 0, dur: 0.3, wound: W.n });
  }
  R.wounds = R.wounds.filter(o => !o.done);
}

/* ---------- 분신이 따라 하는 공격 (인물 각성 A 궁극기 그림자 분신, 전용·연성만) ---------- */
function rw60(fn, noClone) {
  return function (w, S) {
    const r = fn(w, S), R = Rg();
    if (r !== false && !noClone && !R.inClone && R.clone > 0) cloneFire60(w, S, fn);
    return r;
  };
}
function clonePos60(i) { const p = G.p, a = Math.atan2(p.face.y, p.face.x) + Math.PI + (i ? 0.9 : -0.9); return { x: p.x + Math.cos(a) * R60C.clone.off, y: p.y + Math.sin(a) * R60C.clone.off }; }
function cloneFire60(w, S, fn) {
  const R = Rg(), C = R60C.clone;
  for (let i = 0; i < 2; i++) G.later.push({ cr60: 1, t: C.gap * (i + 1), f: () => {
    if (G.result || !(R.clone > 0) || !G.p.weapons.includes(w)) return;
    const p = G.p, ox = p.x, oy = p.y, cr0 = w.cr, ctx = roll60(w), c = clonePos60(i);   // 분신도 치명타 판정
    p.x = c.x; p.y = c.y; R.inClone = true; w.cr = ctx.cr;
    try { runCR60(ctx, () => fn(w, rStat60(S, C.k))); } finally { p.x = ox; p.y = oy; R.inClone = false; w.cr = cr0; }
    S60().cloneHit = (S60().cloneHit || 0) + 1;
  } });
}

/* ---------- 전용 무기 단검 ---------- */
function rDagger60(w, S) {
  const C = R60C, p = G.p, D = WEAPONS.dagger.base, R = Rg(), br = w.br, range = D.range * S.area;
  const ts = nearN60(p.x, p.y, range, S.n); if (!ts.length) return false;
  const k = R.inClone ? (w.rn || 0) : (w.rn = (w.rn || 0) + 1);
  const cd = S.cd * (br === 'A' ? C.twin.cd : 1), dk = br === 'A' ? C.twin.dmg : br === 'B' ? C.long.dmg : 1, dmg = S.dmg * dk;
  let act, opt;
  if (w.aw === 'A' && k % C.flurry.every === 0) {                                     // 그림자 난무: 사거리 안 적 최대 5체를 차례로 긋기
    const L = nearN60(p.x, p.y, range, C.flurry.n);
    act = m => L.map((e, i) => { G.later.push({ t: i * C.flurry.gap, f: () => { if (!G.result && !e.dead) { const b = behind60(e); shadeAt60(b.x, b.y, b.a); rCut60(e, dmg * m, 'dagger', 1); } } }); return { e, d: dmg * m }; });
    opt = { x: true, pos: () => L[0], d: dmg }; S60().flurry = (S60().flurry || 0) + (R.inClone ? 0 : 1);
  } else if (w.aw === 'B' && k % C.rift.every === 0) {                                // 그림자 균열: 큰 가르기 200% + 균열 2.5초
    const e0 = ts[0], a = Math.atan2(e0.y - p.y, e0.x - p.x), cx = e0.x, cy = e0.y;
    act = (m, n) => { const hits = riftCut60(cx, cy, a, dmg * C.rift.k * m); if (!n) { R.rifts.push({ x: cx, y: cy, a, t: 0, tk: C.rift.tick, d: dmg }); S60().rift = (S60().rift || 0) + 1; } return hits; };
    opt = {};
  } else {
    act = m => ts.flatMap(e => br === 'B' ? longCut60(e, dmg * m) : [rCut60(e, dmg * m, 'dagger', w.aw ? 1 : 0)]).filter(Boolean);
    opt = { x: true, pos: () => ts[0], d: dmg };
  }
  const hits = act(1, 0);
  if (w.cr && hits.length) { shadow60(w, act, opt); for (const e of ts.slice(0, 1)) { const b = behind60(e); shadeAt60(b.x, b.y, b.a); } }
  return cd;
}
function longCut60(e0, d) {                                                           // 긴 선: 대상 뒤로 40 이어진 선 위 적 모두
  const p = G.p, C = R60C.long, a = Math.atan2(e0.y - p.y, e0.x - p.x), ux = Math.cos(a), uy = Math.sin(a), x0 = e0.x - ux * e0.r, y0 = e0.y - uy * e0.r, L = e0.r * 2 + C.ext, hits = [];
  gridQuery(e0.x + ux * C.ext / 2, e0.y + uy * C.ext / 2, L, e => { const dx = e.x - x0, dy = e.y - y0, t = dx * ux + dy * uy; if (t < -e.r || t > L + e.r || Math.abs(dx * -uy + dy * ux) > C.w / 2 + e.r) return;
    const h = rHit60(e, d, { src: 'dagger', fx: p.x, fy: p.y }); if (h) hits.push(h); });
  Rg().cuts.push({ x: x0, y: y0, a, L, line: 1, t: 0, dur: 0.3 });
  return hits;
}
function riftCut60(x, y, a, d) {
  const C = R60C.rift, ux = Math.cos(a), uy = Math.sin(a), hits = [];
  gridQuery(x, y, C.L / 2 + 20, e => { const dx = e.x - x, dy = e.y - y, t = dx * ux + dy * uy; if (Math.abs(t) > C.L / 2 + e.r || Math.abs(dx * -uy + dy * ux) > C.w / 2 + e.r) return;
    const h = rHit60(e, d, { src: 'dagger', fx: G.p.x, fy: G.p.y }); if (h) hits.push(h); });
  Rg().cuts.push({ x: x - ux * C.L / 2, y: y - uy * C.L / 2, a, L: C.L, line: 2, t: 0, dur: 0.35 }); shake(2, 0.1);
  return hits;
}
function riftTick60(dt) {
  const R = Rg(), C = R60C.rift;
  for (const r of R.rifts) {
    r.t += dt; if ((r.tk -= dt) > 0) continue; r.tk = C.tick;
    const ux = Math.cos(r.a), uy = Math.sin(r.a);
    gridQuery(r.x, r.y, C.L / 2 + 20, e => { const dx = e.x - r.x, dy = e.y - r.y, t = dx * ux + dy * uy; if (Math.abs(t) > C.L / 2 + e.r || Math.abs(dx * -uy + dy * ux) > C.w / 2 + e.r) return;
      damageEnemy(e, r.d * C.tk, { src: 'dagger', cr: false }); });                  // 균열 다단 히트는 치명타 없음
  }
  R.rifts = R.rifts.filter(r => r.t < C.dur);
}

/* ---------- 궁극기 ---------- */
function ultStealth60(p, D) {                                                         // 그림자 잠행: 2초 피격 없음·이동 +50%, 스친 적 표식 → 끝에 확정 치명타 2배
  const C = R60C.stealth, R = Rg(); R.stealth = C.dur; R.marks = new Set(); R.sD = D;
  p.invT = Math.max(p.invT, C.dur);
  fx({ kind: 'ring', x: p.x, y: p.y, r0: 30, r1: 6, dur: 0.3, color: RCOL().c3, follow: true });
  uLater(C.dur, () => {
    const R2 = Rg(), M = R2.marks; R2.marks = null; if (!M) return; let n = 0;
    for (const e of M) { if (e.dead) continue; n++; const b = behind60(e); shadeAt60(b.x, b.y, b.a); cutFx60(e, 1); damageEnemy(e, R2.sD * C.k, { src: 'ult', cr: true, critMul: C.crit }); if (G.p.job2 === 'B') wound60(e, R2.sD * C.k * 0.3, 'ult'); }
    S60().stealthHit = (S60().stealthHit || 0) + n; if (n) shake(5, 0.3);
    fx({ kind: 'ring', x: G.p.x, y: G.p.y, r0: 8, r1: 60, dur: 0.3, color: RCOL().c3, follow: true });
  });
  return C.dur + 0.3;
}
function ultClone60(p) {                                                              // 그림자 분신: 분신 2명 8초, 전용·연성만 따라 함 (피해 40%)
  const R = Rg(); R.clone = R60C.clone.dur; S60().clone = (S60().clone || 0) + 1;
  for (let i = 0; i < 2; i++) { const c = clonePos60(i); fx({ kind: 'pop', x: c.x, y: c.y, r: 16, color: RCOL().c3, dur: 0.3 }); }
  return R60C.clone.dur;
}
function ultSlash60(p, D) {                                                           // 일섬: 화면을 가로지르는 거대한 한 줄 (확정 치명타 3배) → 0.4초 정적 → 상처 동시 폭발 → 4초 단검 집중
  const C = R60C.slash, R = Rg(), tg = nearestEnemy(p.x, p.y, VIEW.w), a = tg ? Math.atan2(tg.y - p.y, tg.x - p.x) : Math.atan2(p.face.y, p.face.x);
  const L = Math.hypot(VIEW.w, VIEW.h), ux = Math.cos(a), uy = Math.sin(a), x = p.x, y = p.y; let n = 0;
  gridQuery(x, y, L / 2, e => { const dx = e.x - x, dy = e.y - y; if (e.dead || Math.abs(dx * ux + dy * uy) > L / 2 || Math.abs(dx * -uy + dy * ux) > C.w / 2 + e.r) return;
    n++; damageEnemy(e, D * C.k, { src: 'ult', cr: true, critMul: C.crit }); wound60(e, D * C.wk, 'ult'); });
  R.slash = { x, y, a, L, t: 0, dur: C.wait + 0.3 }; shake(7, 0.35); S60().slashHit = (S60().slashHit || 0) + n;
  uLater(C.wait, () => { const R2 = Rg(); for (const W of R2.wounds) W.t = 0; R2.focus = C.focus; toast('단검 집중', RCOL().c3); });
  return C.wait + C.focus;
}

/* ---------- 연성 7종 (짝 무기 + 단검) ---------- */
// 흑풍: 가까운 적 무리 두 곳에서 그림자가 솟아 부채꼴로 휩쓸고 밀쳐냄 · 치명타 한 번 더
function fGale60(w, S) {
  const C = R60C.gale, p = G.p, range = C.range * S.area, a = nearestEnemy(p.x, p.y, range); if (!a) return false;
  let b = null, bd = 1e18;
  gridQuery(p.x, p.y, range, e => { if (e === a || dist2(a.x, a.y, e.x, e.y) < C.sep * C.sep) return; const d = dist2(p.x, p.y, e.x, e.y); if (d < bd) { bd = d; b = e; } });
  const spots = [a, b].filter(Boolean).map(e => { const g = Math.atan2(e.y - p.y, e.x - p.x); return { x: e.x - Math.cos(g) * 24, y: e.y - Math.sin(g) * 24, a: g }; });
  const act = m => spots.flatMap(s => galeAt60(s, S.dmg * m, C.R * S.area));
  act(1); if (w.cr) shadow60(w, act, { x: true, pos: () => a, d: S.dmg });
  return C.cd * rc60(w, S);
}
function galeAt60(s, d, R) {
  const C = R60C.gale, hits = [];
  gridQuery(s.x, s.y, R + 20, e => { let da = Math.atan2(e.y - s.y, e.x - s.x) - s.a; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) > C.arc / 2 + 0.15 || dist2(s.x, s.y, e.x, e.y) > (R + e.r) ** 2) return;
    const h = rHit60(e, d, { src: 'cleave', kb: C.kb, fx: s.x, fy: s.y }); if (h) hits.push(h); });
  Rg().gales.push({ x: s.x, y: s.y, a: s.a, R, t: 0, dur: 0.3 });
  return hits;
}
// 그림자 표창: 도적 그림자에서 별 모양 표창이 회전하며 일직선으로 날아가 지나는 적 모두 벰 · 치명타 한 번 더
function fStar60(w, S) {
  const C = R60C.star, p = G.p, L = C.range * S.area, tg = nearestEnemy(p.x, p.y, L); if (!tg) return false;
  const a = Math.atan2(tg.y - p.y, tg.x - p.x), x0 = p.x, y0 = p.y;
  const act = m => starLine60(x0, y0, a, L, S.dmg * m);
  act(1); if (w.cr) shadow60(w, act, { x: true, pos: () => tg, d: S.dmg });
  return C.cd * rc60(w, S);
}
function starLine60(x0, y0, a, L, d) {
  const C = R60C.star, ux = Math.cos(a), uy = Math.sin(a), hits = [];
  gridQuery(x0 + ux * L / 2, y0 + uy * L / 2, L / 2 + 30, e => { const dx = e.x - x0, dy = e.y - y0, t = dx * ux + dy * uy; if (t < 0 || t > L || Math.abs(dx * -uy + dy * ux) > C.w / 2 + e.r) return;
    hits.push({ e, d }); G.later.push({ t: t / C.sp, f: () => { if (!G.result && !e.dead) damageEnemy(e, d, { src: 'arrow' }); } }); });
  Rg().stars.push({ x: x0, y: y0, a, L, t: 0, dur: L / C.sp + 0.05 });
  return hits;
}
// 대역 통나무: 10초마다 도적 자리에 도적 두건을 두른 가시 통나무 + 도적 1.5초 반투명(표적에서 잠시 벗어남)
//  주변 반경 120 적만 통나무를 도적으로 알고 공격, 맞으면 한 바퀴 회전 반격, 8번 맞거나 8초 뒤 쿠나이 10자루 폭발
//  치명타(회전 1번 = 공격 1번 판정) → 그림자가 통나무를 한 바퀴 더 돌림 (인물 각성 A: 최대 3바퀴)
function fLog60(w, S) {
  const C = R60C.log, p = G.p, R = Rg();
  if (R.logs.some(l => l.w === w)) return 0.5;
  if (!nearestEnemy(p.x, p.y, 300)) return false;
  R.logs.push({ w, x: p.x, y: p.y + 4, t: 0, hits: 0, spinCd: 0, spinT: 0 }); R.hide = C.hide;
  S60().log = (S60().log || 0) + 1;
  for (let i = 0; i < 6; i++) fx({ kind: 'pop', x: p.x + rand(-18, 18), y: p.y + rand(-12, 12), r: 8 + rand(6), color: '#b8bcc8', dur: 0.4 });   // 연기
  return C.cd * rc60(w, S);
}
function logSpin60(l, m) {
  const C = R60C.log, S = wStats(l.w), hits = [];
  gridQuery(l.x, l.y, C.R * S.area, e => { const h = rHit60(e, S.dmg * C.k * m, { src: 'turret', kb: 120, fx: l.x, fy: l.y }); if (h) hits.push(h); });
  l.spinT = 0.3; l.rot = (l.rot || 0) + 1; S60().logSpin = (S60().logSpin || 0) + 1;
  return hits;
}
function logTick60(dt) {
  const C = R60C.log, R = Rg(), now = G.time;
  for (const l of R.logs) {
    l.t += dt; l.spinCd -= dt; l.spinT = Math.max(0, l.spinT - dt);
    if (!G.p.weapons.includes(l.w)) { l.dead = true; continue; }
    gridQuery(l.x, l.y, C.lure, e => { if (noBoss60(e)) { e.r60d = l; e.r60dT = now; } });   // 주변 적만 통나무를 도적으로 인식
    gridQuery(l.x, l.y, 30, e => { if (!noBoss60(e) || (e.r60lh || 0) > now || dist2(l.x, l.y, e.x, e.y) > (e.r + 16) ** 2) return;   // 통나무를 공격
      e.r60lh = now + C.hitCd; l.hits++;
      if (l.spinCd <= 0) { l.spinCd = C.spinCd; const ctx = roll60(l.w); runCR60(ctx, () => logSpin60(l, 1)); if (ctx.cr) shadow60(l.w, m => logSpin60(l, m)); }
    });
    if (l.hits >= C.hits || l.t >= C.life) logBurst60(l);
  }
  R.logs = R.logs.filter(l => !l.dead);
}
function logBurst60(l) {                                                               // 쿠나이 10자루 사방 폭발 (폭발 1번 = 공격 1번 판정)
  const C = R60C.log, S = wStats(l.w), d = S.dmg * C.kk; l.dead = true;
  runCR60(roll60(l.w), () => { for (let i = 0; i < C.kn; i++) { const a = i / C.kn * Math.PI * 2, ux = Math.cos(a), uy = Math.sin(a);
    gridQuery(l.x + ux * C.kL / 2, l.y + uy * C.kL / 2, C.kL / 2 + 16, e => { const dx = e.x - l.x, dy = e.y - l.y, t = dx * ux + dy * uy; if (t < 0 || t > C.kL || Math.abs(dx * -uy + dy * ux) > 10 + e.r) return; damageEnemy(e, d, { src: 'turret' }); }); } });
  Rg().stars.push({ x: l.x, y: l.y, burst: 1, L: C.kL, t: 0, dur: 0.3 }); shake(2, 0.15);
  S60().logBurst = (S60().logBurst || 0) + 1;
}
// 기폭찰 쿠나이: 부적을 붙인 쿠나이가 곧게 날아가 가장 가까운 적 발아래에 꽂혀 멈칫 0.2초, 0.5초 뒤 폭발 · 치명타 한 번 더
function fKunai60(w, S) {
  const C = R60C.kunai, p = G.p, tg = nearestEnemy(p.x, p.y, C.range * S.area); if (!tg) return false;
  const act = m => kunaiThrow60(G.p.x, G.p.y, tg, S.dmg * m, C.R * S.area);
  act(1); if (w.cr) shadow60(w, act, { x: true, pos: () => tg, d: S.dmg });
  return C.cd * rc60(w, S);
}
function kunaiThrow60(x0, y0, tg, d, R) {
  const C = R60C.kunai, tt = Math.sqrt(dist2(x0, y0, tg.x, tg.y)) / C.sp, K = { x0, y0, x: tg.x, y: tg.y, t: 0, fly: tt, fuse: C.fuse, dur: 0.05 };
  Rg().kunai.push(K);
  G.later.push({ t: tt, f: () => { if (G.result) return; if (!tg.dead) { K.x = tg.x; K.y = tg.y + tg.r * 0.6; stun60(tg, C.stun); } } });   // 꽂힐 때 멈칫
  G.later.push({ t: tt + C.fuse, f: () => { if (G.result) return; K.boom = 1; gridQuery(K.x, K.y, R, e => damageEnemy(e, d, { src: 'fireball', kb: 70, fx: K.x, fy: K.y })); fx({ kind: 'ring', x: K.x, y: K.y, r0: 6, r1: R, dur: 0.25, color: '#ff8a4a', fill: true }); } });
  return [{ e: tg, d }];
}
// 그림자 도둑: 그림자 실이 적 그림자를 빨아들임, 적이 죽으면 가까운 적으로 실이 옮겨 감 · 치명타(1초에 1번 판정): 그림자를 뜯어내 0.8초 굳음
function fThief60(w, S) {
  const C = R60C.thief, p = G.p, R = C.range * S.area, prev = w.lk && w.lk[0];
  let e = prev && !prev.dead && dist2(p.x, p.y, prev.x, prev.y) <= R * R ? prev : nearestEnemy(p.x, p.y, R);
  if (!e) { w.lk = []; return false; }
  if (prev && prev !== e && prev.dead) Rg().pulls.push({ x: prev.x, y: prev.y, e, t: 0, dur: 0.25, hop: 1 });   // 실이 옮겨 감
  w.lk = [e]; w.lkT = G.time;
  let cr = false; if (!Rg().inClone && G.time - (w.crT60 == null ? -9 : w.crT60) >= C.crT) { w.crT60 = G.time; cr = roll60(w).cr; }
  damageEnemy(e, S.dmg, { src: 'lamp', cr });
  if (cr) shadow60(w, (m, n) => { const t = n === 1 ? e : nearN60(G.p.x, G.p.y, R, 4).find(x => x !== e && !(x.frz > 0)) || e; if (!t || t.dead) return [];
    root60(t, C.freeze); Rg().tears.push({ e: t, t: 0, dur: 0.5 }); S60().tear = (S60().tear || 0) + 1;
    return [rHit60(t, S.dmg * C.tear * m, { src: 'lamp', cr: false })].filter(Boolean); });
  return prev === e ? 'tick' : 'start';
}
// 숨죽인 파문: 소리 없는 어두운 파문, 퍼졌다 되돌아오며 한 번 더(50%) · 치명타: 파문 안 적 최대 5마리 등 뒤에 그림자가 동시에 나타나 긋기
function fRipple60(w, S) {
  const C = R60C.ripple, p = G.p, R = C.R * S.area; if (!nearestEnemy(p.x, p.y, R)) return false;
  const x = p.x, y = p.y, R0 = Rg();
  gridQuery(x, y, R, e => { damageEnemy(e, S.dmg, { src: 'bell' }); if (!e.dead) stun60(e, C.stun); });
  R0.ripples.push({ x, y, R, t: 0, dur: 0.4 });
  G.later.push({ t: C.backT, f: () => { if (G.result) return; gridQuery(x, y, R, e => damageEnemy(e, S.dmg * C.back, { src: 'bell' })); Rg().ripples.push({ x, y, R, t: 0, dur: 0.35, back: 1 }); } });
  if (w.cr) shadow60(w, m => nearN60(x, y, R, C.n).map(e => { const b = behind60(e); shadeAt60(b.x, b.y, b.a); return rCut60(e, S.dmg * m, 'bell', 1); }).filter(Boolean));
  return C.cd * rc60(w, S);
}
// 올가미: 평소 가시 덩굴 기본 · 치명타: 덩굴이 가까운 적 2마리를 더 꿰어 엮어 한곳으로 당긴 뒤(최대 40, 적끼리 모음) 그림자가 한 번에 그음
function fSnare60(w, S) {
  const r = PAIR60.thorn(w, S); if (r === false) return false;
  const C = R60C.snare, D = WEAPONS.thorn.base, p = G.p, t0 = nearestEnemy(p.x, p.y, D.range * S.area);
  if (w.cr && t0) shadow60(w, m => {
    if (t0.dead) return [];
    const more = nearN60(t0.x, t0.y, C.near, C.more + 1).filter(e => e !== t0).slice(0, C.more), grp = [t0].concat(more), R = Rg();
    for (const e of more) { root60(e, D.root); const dx = t0.x - e.x, dy = t0.y - e.y, d = Math.hypot(dx, dy) || 1, s = Math.min(C.pull, Math.max(0, d - e.r - t0.r));
      if (noBoss60(e)) { e.x += dx / d * s; e.y += dy / d * s; } R.pulls.push({ x: e.x, y: e.y, e: t0, t: 0, dur: 0.35 }); }
    const b = behind60(t0, 26); shadeAt60(b.x, b.y, b.a); R.cuts.push({ x: t0.x - 40 * Math.cos(b.a + 1.57), y: t0.y - 40 * Math.sin(b.a + 1.57), a: b.a + 1.57, L: 80, line: 1, t: 0, dur: 0.32 });
    S60().snareGrp = (S60().snareGrp || 0) + 1;
    return grp.map(e => rHit60(e, S.dmg * m, { src: 'thorn', fx: t0.x, fy: t0.y })).filter(Boolean);
  });
  return r;
}
FUSE60.rogue = {
  cleave: { nm: '흑풍', ds: '가까운 적 무리 두 곳, 적 곁 바닥에서 그림자가 솟아 부채꼴로 휩쓸고 밀쳐냄 · 치명타 한 번 더', fire: rw60(fGale60) },
  arrow: { nm: '그림자 표창', ds: '그림자에서 별 모양 표창이 회전하며 일직선으로 날아가 지나는 적 모두 벰 · 치명타 한 번 더', fire: rw60(fStar60) },
  turret: { nm: '대역 통나무', ds: '10초마다 도적 두건을 두른 가시 통나무와 바꿔치기, 잠시 표적에서 벗어남 · 주변 적이 통나무를 공격하면 회전 반격 · 치명타 한 바퀴 더', fire: rw60(fLog60, true) },
  fireball: { nm: '기폭찰 쿠나이', ds: '부적 쿠나이가 적 발아래에 꽂혀 멈칫, 잠시 뒤 폭발 · 치명타 한 번 더', fire: rw60(fKunai60) },
  lamp: { nm: '그림자 도둑', ds: '그림자 실로 적 그림자를 빨아들임, 적이 죽으면 다음 적으로 옮겨 감 · 치명타: 그림자를 뜯어내 0.8초 굳음', fire: rw60(fThief60, true) },
  bell: { nm: '숨죽인 파문', ds: '소리 없는 어두운 파문이 퍼졌다 되돌아옴 · 치명타: 파문 안 적 최대 5마리 등 뒤에서 그림자가 동시에 그음', fire: rw60(fRipple60) },
  thorn: { nm: '올가미', ds: '덩굴로 묶음 · 치명타: 가까운 적 2마리를 더 엮어 한곳으로 당긴 뒤 그림자가 한 번에 그음', fire: rw60(fSnare60) },
};

/* ---------- 인물 연결점 ---------- */
Object.assign(HERO60.rogue, {
  impl: true,
  br: [{ k: 'A', nm: '쌍단검', ds: '두 자루로 긋기: 간격 절반, 회당 피해 14 → 10' }, { k: 'B', nm: '긴 선', ds: '긋는 선이 대상 뒤로 이어져 선 위 적 모두, 피해 14 → 16' }],
  wak: { A: { nm: '그림자 난무', ds: '6번째 발동마다 사거리 안 적 최대 5체를 그림자가 차례로 그음' }, B: { nm: '그림자 균열', ds: '5번째 공격마다 큰 가르기 200% + 2.5초 균열 (0.3초마다 25%)' } },
  fire: rw60(rDagger60),
  critAdd(w) { return w.base || w.fu ? R60C.crit : 0; },
  stat(w) { const R = Rg(); return w.base && R.focus > 0 ? { cd: R60C.slash.fcd, dmg: R60C.slash.fdmg } : {}; },
  spdMul() { return Rg().stealth > 0 ? 1 + R60C.stealth.spd : 1; },
  onPick() { G.r62 = null; Rg(); },
  ultFn(k) { return k === 'A' ? ultClone60 : k === 'B' ? ultSlash60 : ultStealth60; },
  tick(dt) {
    const R = Rg(), p = G.p;
    if (R.stealth > 0) { R.stealth -= dt; if (R.marks) gridQuery(p.x, p.y, R60C.stealth.R, e => { if (!R.marks.has(e)) { R.marks.add(e); R.cuts.push({ e, x: e.x, y: e.y, a: 0, r: e.r + 4, t: 0, dur: R60C.stealth.dur, mark: 1 }); } }); }
    if (R.clone > 0) R.clone -= dt;
    if (R.hide > 0) R.hide -= dt;
    if (R.focus > 0) { R.focus -= dt; for (const w of p.weapons) if (!w.base) w.t = Math.max(w.t, 0.1); }   // 단검 집중: 다른 무기 멈춤
    riftTick60(dt); logTick60(dt); woundTick60(dt);
    for (const k of ['cuts', 'shades', 'xs', 'gales', 'stars', 'kunai', 'ripples', 'pulls', 'tears']) { const L = R[k]; for (const o of L) o.t += dt; R[k] = L.filter(o => o.t < (o.dur + (o.fly || 0) + (o.fuse || 0))); }
    if (R.slash) { R.slash.t += dt; if (R.slash.t >= R.slash.dur) R.slash = null; }
  },
  status() { const R = Rg(); return R.stealth > 0 ? '잠행' : R.focus > 0 ? '단검 집중 ' + Math.ceil(R.focus) : R.clone > 0 ? '분신 ' + Math.ceil(R.clone) : R.hide > 0 ? '바꿔치기' : ''; },
  dials() { return []; },
  draw: drawR60,
  drawBody(c, fn) { const R = Rg(); if (!(R.stealth > 0 || R.hide > 0)) return fn(); c.save(); c.globalAlpha = R.stealth > 0 ? 0.35 : 0.5; fn(); c.restore(); },
});

/* 대역 통나무 유인·바꿔치기: 주변 적은 통나무로, 바꿔치기 1.5초 동안 나머지 적은 도적을 놓침(추적 속도 30%) — 이동 뒤 보정 */
const _updateEnemiesR60 = updateEnemies;
updateEnemies = function (dt) {
  const R = G && G.r62; if (!R || !isR60() || (!R.logs.length && !(R.hide > 0))) return _updateEnemiesR60.apply(this, arguments);
  const p = G.p, now = G.time, rec = [];
  for (const e of G.enemies) if (!e.dead && noBoss60(e) && !e.fixed && !e.sleep && !e.thief && !e.tgtCart) { const l = e.r60dT >= now - 0.1 && e.r60d && !e.r60d.dead ? e.r60d : null; if (l || R.hide > 0) rec.push([e, e.x, e.y, l]); }
  const r = _updateEnemiesR60.apply(this, arguments);
  for (const [e, x0, y0, l] of rec) {
    if (e.dead) continue;
    const dx = e.x - x0, dy = e.y - y0, px = p.x - x0, py = p.y - y0, pd = Math.hypot(px, py) || 1, ux = px / pd, uy = py / pd, ch = dx * ux + dy * uy;
    if (ch <= 0) continue;
    e.x -= ux * ch; e.y -= uy * ch;                                                   // 도적 쪽으로 다가간 만큼 되돌림
    if (l) { const lx = l.x - e.x, ly = l.y - e.y, ld = Math.hypot(lx, ly) || 1, s = Math.min(ch, Math.max(0, ld - e.r - 14)); e.x += lx / ld * s; e.y += ly / ld * s; }
    else { e.x += ux * ch * R60C.log.hideK; e.y += uy * ch * R60C.log.hideK; }
  }
  return r;
};

/* ---------- 그리기 (임시 도형, 최종본 아님) ---------- */
function shadeFig60(c, x, y, k, col) {                                               // 그림자 형체: 짙은 남색 몸 + 청록 눈빛
  c.globalAlpha = 0.75 * k; c.fillStyle = col.c1; c.beginPath(); c.ellipse(x, y + 2, 7, 10, 0, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(x, y - 11, 5.5, 0, Math.PI * 2); c.fill();
  c.globalAlpha = 0.9 * k; c.fillStyle = col.c3; c.fillRect(x - 3, y - 12, 2, 1.5); c.fillRect(x + 1, y - 12, 2, 1.5);
}
function drawR60(c) {
  const R = G.r62; if (!R) return;
  const p = G.p, H = HERO60.rogue, tau = Math.PI * 2;
  c.lineCap = 'round';
  if (R.clone > 0) for (let i = 0; i < 2; i++) { const q = clonePos60(i); shadeFig60(c, q.x, q.y, 0.8, H); c.globalAlpha = 0.25; c.fillStyle = '#000'; c.beginPath(); c.ellipse(q.x, q.y + 12, 7, 3, 0, 0, tau); c.fill(); }
  for (const l of R.logs) {                                                           // 대역 통나무: 가시 통나무 + 도적 두건·망토 자락 (회전 반격 시 한 바퀴)
    const fade = Math.min(1, l.t * 5), rot = l.spinT > 0 ? (1 - l.spinT / 0.3) * tau : 0;
    c.save(); c.translate(l.x, l.y); c.rotate(rot); c.globalAlpha = fade;
    c.fillStyle = '#7a5530'; c.fillRect(-7, -14, 14, 24); c.strokeStyle = '#4a3418'; c.lineWidth = 2; c.strokeRect(-7, -14, 14, 24);
    c.strokeStyle = '#d8cfc0'; c.lineWidth = 2; c.beginPath(); for (const s of [-1, 1]) for (let j = 0; j < 3; j++) { const yy = -8 + j * 7; c.moveTo(s * 7, yy); c.lineTo(s * 12, yy - 2); } c.stroke();
    c.fillStyle = H.c1; c.beginPath(); c.arc(0, -16, 8, Math.PI, 0); c.fill(); c.fillRect(-8, -16, 16, 4);   // 두건
    c.fillStyle = H.c3; c.fillRect(-4, -14, 8, 2);
    c.fillStyle = H.c2; c.beginPath(); c.moveTo(-8, -12); c.lineTo(-13, 6 + Math.sin(G.time * 6) * 2); c.lineTo(-6, 2); c.closePath(); c.fill();   // 망토 자락
    c.restore();
    if (l.spinT > 0) { c.globalAlpha = l.spinT / 0.3 * 0.6; c.strokeStyle = H.c3; c.lineWidth = 3; c.beginPath(); c.arc(l.x, l.y, R60C.log.R * wStats(l.w).area, 0, tau); c.stroke(); }
    c.globalAlpha = 0.15; c.strokeStyle = H.c3; c.lineWidth = 1; c.setLineDash([4, 6]); c.beginPath(); c.arc(l.x, l.y, R60C.log.lure, 0, tau); c.stroke(); c.setLineDash([]);
  }
  for (const r of R.rifts) { const k = r.t / R60C.rift.dur, ux = Math.cos(r.a), uy = Math.sin(r.a), L = R60C.rift.L / 2;   // 그림자 균열: 바닥의 검은 틈
    c.globalAlpha = 0.7 * (1 - k * 0.6); c.strokeStyle = H.c1; c.lineWidth = R60C.rift.w * 0.5; c.beginPath(); c.moveTo(r.x - ux * L, r.y - uy * L); c.lineTo(r.x + ux * L, r.y + uy * L); c.stroke();
    c.globalAlpha = 0.6 * (1 - k); c.strokeStyle = H.c3; c.lineWidth = 2; c.stroke(); }
  for (const g of R.gales) { const k = g.t / g.dur;                                  // 흑풍: 바닥에서 솟은 그림자의 부채꼴 휩쓸기
    shadeFig60(c, g.x, g.y, 1 - k, H);
    c.globalAlpha = 0.55 * (1 - k); c.fillStyle = H.c2; c.beginPath(); c.moveTo(g.x, g.y); c.arc(g.x, g.y, g.R * (0.4 + 0.6 * Math.min(1, k * 3)), g.a - R60C.gale.arc / 2, g.a + R60C.gale.arc / 2); c.closePath(); c.fill();
    c.globalAlpha = 0.9 * (1 - k); c.strokeStyle = H.c3; c.lineWidth = 2; c.beginPath(); c.arc(g.x, g.y, g.R * (0.4 + 0.6 * Math.min(1, k * 3)), g.a - R60C.gale.arc / 2, g.a + R60C.gale.arc / 2); c.stroke(); }
  for (const s of R.stars) {                                                          // 그림자 표창 (회전하는 별) · 통나무 쿠나이 폭발
    if (s.burst) { const k = s.t / s.dur; c.globalAlpha = 1 - k; c.strokeStyle = '#d8d2cc'; c.lineWidth = 2; c.beginPath(); for (let i = 0; i < R60C.log.kn; i++) { const a = i / R60C.log.kn * tau, r1 = s.L * Math.min(1, k * 2.5); c.moveTo(s.x + Math.cos(a) * r1 * 0.6, s.y + Math.sin(a) * r1 * 0.6); c.lineTo(s.x + Math.cos(a) * r1, s.y + Math.sin(a) * r1); } c.stroke(); continue; }
    const d = Math.min(s.L, s.t * R60C.star.sp), x = s.x + Math.cos(s.a) * d, y = s.y + Math.sin(s.a) * d, sp = s.t * 30;
    c.globalAlpha = 0.35; c.strokeStyle = H.c1; c.lineWidth = 6; c.beginPath(); c.moveTo(s.x + Math.cos(s.a) * Math.max(0, d - 60), s.y + Math.sin(s.a) * Math.max(0, d - 60)); c.lineTo(x, y); c.stroke();
    c.globalAlpha = 1; c.fillStyle = '#c8ccd8'; c.beginPath(); for (let i = 0; i < 8; i++) { const a = sp + i * Math.PI / 4, r = i % 2 ? 3 : 9; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); c.fill();
    c.strokeStyle = H.c3; c.lineWidth = 1; c.stroke(); }
  for (const K of R.kunai) {                                                          // 기폭찰 쿠나이: 곧게 날아가 꽂힘 → 부적 깜빡임 → 폭발
    if (K.boom) continue;
    const f = Math.min(1, K.t / K.fly), x = K.x0 + (K.x - K.x0) * f, y = K.y0 + (K.y - K.y0) * f, a = Math.atan2(K.y - K.y0, K.x - K.x0);
    c.globalAlpha = 1; c.save(); c.translate(x, y); c.rotate(f < 1 ? a : Math.PI / 2 + 0.3);
    c.fillStyle = '#c8ccd8'; c.beginPath(); c.moveTo(9, 0); c.lineTo(0, -3); c.lineTo(0, 3); c.closePath(); c.fill(); c.fillStyle = H.c2; c.fillRect(-7, -1.5, 7, 3); c.strokeStyle = '#d8d2cc'; c.lineWidth = 1; c.beginPath(); c.arc(-9, 0, 2.5, 0, tau); c.stroke();
    if (f >= 1) { c.fillStyle = Math.sin(G.time * 30) > 0 ? '#ff5a3a' : '#f3e6b0'; c.fillRect(-5, 2, 5, 7); }   // 부적
    c.restore(); }
  for (const r of R.ripples) { const k = r.t / r.dur, rr = r.back ? r.R * (1 - k * 0.8) : r.R * (0.2 + 0.8 * k);   // 숨죽인 파문: 소리 없는 어두운 물결
    c.globalAlpha = 0.5 * (1 - k * 0.7); c.strokeStyle = H.c2; c.lineWidth = 7; c.beginPath(); c.arc(r.x, r.y, rr, 0, tau); c.stroke();
    c.globalAlpha = 0.5 * (1 - k); c.strokeStyle = H.c3; c.lineWidth = 1.5; c.stroke(); }
  const lw = p.weapons.find(w => w.fu && w.fu.job === 'rogue' && w.id === 'lamp');   // 그림자 도둑: 적 발밑 그림자 → 도적으로 흐르는 실
  if (lw && lw.lk && lw.lk[0] && !lw.lk[0].dead && G.time - lw.lkT < 0.45) {
    const e = lw.lk[0], ex = e.x, ey = e.y + e.r * 0.8; c.globalAlpha = 0.45; c.fillStyle = H.c1; c.beginPath(); c.ellipse(ex, ey, e.r * 0.9 * (0.85 + 0.15 * Math.sin(G.time * 9)), e.r * 0.35, 0, 0, tau); c.fill();
    c.globalAlpha = 0.85; c.strokeStyle = H.c1; c.lineWidth = 2; c.beginPath(); for (let i = 0; i <= 10; i++) { const u = i / 10, x = ex + (p.x - ex) * u, y = ey + (p.y + 8 - ey) * u + Math.sin(u * 9 - G.time * 14) * 3 * Math.sin(u * Math.PI); i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
    c.strokeStyle = H.c3; c.lineWidth = 0.8; c.stroke(); }
  for (const o of R.pulls) { const k = o.t / o.dur, ex = o.e && !o.e.dead ? o.e.x : o.x, ey = o.e && !o.e.dead ? o.e.y : o.y;   // 올가미 엮기·실 옮겨 감
    c.globalAlpha = 1 - k; c.strokeStyle = o.hop ? H.c1 : '#6faa4a'; c.lineWidth = o.hop ? 2 : 3; c.beginPath(); c.moveTo(o.x, o.y); c.quadraticCurveTo((o.x + ex) / 2 + 8, (o.y + ey) / 2 - 10, ex, ey); c.stroke(); }
  for (const o of R.tears) { const e = o.e, k = o.t / o.dur; if (e.dead) continue;  // 그림자 뜯기: 적 발밑 그림자가 찢겨 들림
    c.globalAlpha = 1 - k; c.fillStyle = H.c1; c.beginPath(); c.ellipse(e.x, e.y + e.r - 6 * k, e.r, e.r * 0.35, 0, 0, tau); c.fill(); c.strokeStyle = H.c3; c.lineWidth = 1.5; c.beginPath(); c.moveTo(e.x - e.r, e.y + e.r); c.lineTo(e.x + e.r, e.y + e.r - 4); c.stroke(); }
  for (const o of R.shades) { const k = o.t / o.dur; shadeFig60(c, o.x, o.y, k < 0.3 ? k / 0.3 : 1 - (k - 0.3) / 0.7, H); }
  for (const o of R.cuts) {                                                           // 상처 선 (그림자 긋기는 짙게) · 긴 선 · 잠행 표식
    const k = o.t / o.dur;
    if (o.mark) { const e = o.e; if (e.dead || !Rg().marks) continue; c.globalAlpha = 0.8; c.strokeStyle = H.c3; c.lineWidth = 1.5; c.beginPath(); c.moveTo(e.x - 5, e.y - e.r - 9); c.lineTo(e.x, e.y - e.r - 4); c.lineTo(e.x + 5, e.y - e.r - 9); c.stroke(); continue; }
    if (o.line) { const L = o.L * Math.min(1, o.t / 0.06); c.globalAlpha = 1 - k; c.strokeStyle = o.line === 2 ? H.c1 : H.c2; c.lineWidth = o.line === 2 ? 9 : 5; c.beginPath(); c.moveTo(o.x, o.y); c.lineTo(o.x + Math.cos(o.a) * L, o.y + Math.sin(o.a) * L); c.stroke(); c.strokeStyle = H.c3; c.lineWidth = 1.5; c.stroke(); continue; }
    const x = o.e && !o.e.dead ? o.e.x : o.x, y = o.e && !o.e.dead ? o.e.y : o.y, L = o.r * Math.min(1, o.t / 0.05);
    c.globalAlpha = 1 - k; c.strokeStyle = o.dark ? H.c1 : H.c2; c.lineWidth = o.dark ? 4 : 3; c.beginPath(); c.moveTo(x - Math.cos(o.a) * L, y - Math.sin(o.a) * L); c.lineTo(x + Math.cos(o.a) * L, y + Math.sin(o.a) * L); c.stroke();
    c.strokeStyle = H.c3; c.lineWidth = 1.2; c.stroke(); }
  for (const W of R.wounds) { const e = W.e; if (e.dead) continue;                   // 늦게 터지는 상처: 붉은 선 (겹칠수록 굵게·빠르게 깜빡)
    c.globalAlpha = 0.6 + 0.4 * Math.abs(Math.sin(G.time * (8 + W.n * 6))); c.strokeStyle = '#d23a3a'; c.lineWidth = 1.5 + W.n * 1.2;
    c.beginPath(); for (let i = 0; i < W.n; i++) { const a = W.a + i * 0.7, L = e.r + 5; c.moveTo(e.x - Math.cos(a) * L, e.y - Math.sin(a) * L); c.lineTo(e.x + Math.cos(a) * L, e.y + Math.sin(a) * L); } c.stroke(); }
  for (const o of R.xs) { const k = o.t / o.dur, L = (o.wound ? 14 + o.wound * 6 : R60C.chain.xR) * Math.min(1, o.t / 0.08);   // 붉은 X자 · 상처 폭발
    c.globalAlpha = 1 - k; c.strokeStyle = '#e03a3a'; c.lineWidth = o.wound ? 3 : 6; c.beginPath(); c.moveTo(o.x - L * 0.7, o.y - L * 0.7); c.lineTo(o.x + L * 0.7, o.y + L * 0.7); c.moveTo(o.x + L * 0.7, o.y - L * 0.7); c.lineTo(o.x - L * 0.7, o.y + L * 0.7); c.stroke();
    if (!o.wound) { c.strokeStyle = '#ffd0c0'; c.lineWidth = 1.5; c.stroke(); } }
  if (R.slash) { const s = R.slash, k = Math.min(1, s.t / 0.08), ux = Math.cos(s.a), uy = Math.sin(s.a), L = s.L / 2 * k, f = s.t > R60C.slash.wait ? 1 - (s.t - R60C.slash.wait) / 0.3 : 1;   // 일섬
    c.globalAlpha = 0.85 * f; c.strokeStyle = H.c1; c.lineWidth = R60C.slash.w * 0.45; c.beginPath(); c.moveTo(s.x - ux * L, s.y - uy * L); c.lineTo(s.x + ux * L, s.y + uy * L); c.stroke();
    c.strokeStyle = H.c3; c.lineWidth = 4; c.stroke(); c.strokeStyle = '#ffffff'; c.lineWidth = 1.5; c.stroke(); }
  if (R.stealth > 0) { c.globalAlpha = 0.25; c.strokeStyle = H.c3; c.lineWidth = 1.5; c.setLineDash([3, 5]); c.beginPath(); c.arc(p.x, p.y, R60C.stealth.R, 0, tau); c.stroke(); c.setLineDash([]); }
  c.globalAlpha = 1;
}
