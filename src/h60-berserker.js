/* ============================================================
   0.61 광전사 구현 (회차 92, 분할 구현 2차) — 기준: docs/characters/berserker.md
   • 고유 규칙: 투지(피격·대검·연성 피해로 충전) → 가득 차면 격노 8초 (전용·연성 속도 +25%, 받는 피해 -15%)
   • 전용 무기 대검: 발현 A 광역 베기 → 무기 각성 A 회오리 베기 / 발현 B 무거운 베기 → 무기 각성 B 찌르기
   • 궁극기: 기본 대지 분쇄 / 인물 각성 A 광란 + 광란의 포효 / 인물 각성 B 광폭 + 분출 강타
   • 연성 7종: 칼자국·투기살·칼무덤·분화·피의 갈증·고동·투기 가시
   • 그림: 새 장면은 임시 도형 (최종본 아님, GPT 요청 대상), 수치는 전부 가안 (대규모 밸런스 단계 조정)
   ============================================================ */
const B60C = {
  fury: { max: 100, maxB: 60, hurt: 15, hurtA: 10, hit: 3, eliteK: 2, bossK: 3, hitCap: 1.5, idle: 2, decay: 6 },
  rage: { dur: 8, spd: 0.25, hurt: 0.85 },                                          // 격노
  frenzy: { drain: 8, accel: 2, spd: 0.5, hurt: 0.75, stack: 0.03, stackMax: 0.45, healMob: 0.005, healElite: 0.03 },   // 각성 A 광란 (게이지형 격노)
  ramp: { dur: 4, dmg: 1.4, area: 1.2, stun: 0.25, hurt: 0.7, spd: -0.15, body: 1.3 },   // 각성 B 광폭 (폭주)
  wide: { arc: 1.45, range: 1.25 },                                                   // 발현 A 광역 베기
  heavy: { wind: 0.25, cd: 1.2, range: 1.15, dmg: 1.2, kb: 1.2 },                    // 발현 B 무거운 베기 (동작 0.2 → 0.45초 = 추가 0.25초, 간격 1.25 → 1.5초)
  spin: { every: 4, dur: 1.2, turns: 3, k: 0.7, kbEnd: 2.2 },                        // 무기 각성 A 회오리 베기
  thrust: { every: 3, len: 1.6, w: 50, k: 2.2, stun: 0.3 },                          // 무기 각성 B 찌르기
  slam: { jump: 0.35, R: 0.5, k: 2, stun: 1.5, kb: 320 },                            // 기본 궁극기 대지 분쇄 (R = 화면 폭 비율)
  roar: { t: 1.0, R: 160, k: 0.5, kb: 360, dur: 8, spd: 1.0, hurt: 0.6, move: 1.3, burnT: 2, burnK: 0.15, boomR: 60, boomK: 0.5 },   // 광란의 포효
  burst: { jump: 0.4, arc: 140 * Math.PI / 180, R: 0.4, k: 2, n: 3, gap: 0.35, k2: 0.6, stun: 0.2 },                 // 분출 강타
};
const B60 = () => G.b60 || (G.b60 = { fury: 0, max: B60C.fury.max, mode: null, rageT: 0, frT: 0, idle: 9, sw: 0, ref: 19, refT: 0, spin: null, roar: 0, leap: null, burn: [], bt: 0, boomN: 0,
  cuts: [], bolts: [], graves: [], cracks: [], beats: [], spikes: [], trails: [], thrusts: [] });
const isB60 = () => G.p.job === 'berserker' && HERO60.berserker.impl;
const fz60 = id => G.p.weapons.find(w => w.fu && w.fu.job === 'berserker' && w.id === id) || null;
const mineSrc60 = src => src === 'cleave' || (PW60.includes(src) && !!fz60(src));
const tierK60 = e => e.gk || e.boss ? B60C.fury.bossK : e.elite ? B60C.fury.eliteK : 1;
const furyOn60 = () => !!B60().mode;
const furyFrac60 = () => { const B = B60(); return B.mode ? 1 : Math.min(1, B.fury / B.max); };
// 연성 수치: 기획 수치 × (그 짝 무기의 현재 강화·보조 효과·인물 보정 배율)
const fk60 = (w, S) => S.dmg / WEAPONS[w.id].base.dmg;
const fc60 = (w, S) => S.cd / WEAPONS[w.id].base.cd;

/* ---------- 투지·격노 ---------- */
function furyGain60(v) {
  const B = B60(); B.idle = 0;
  if (B.mode === 'frenzy') { B.fury = Math.min(B.max, B.fury + v); return; }   // 광란: 격노 중에도 충전 (게이지 연장)
  if (B.mode) return;                                                           // 격노·폭주 중 충전 없음
  B.fury = Math.min(B.max, B.fury + v);
  if (B.fury >= B.max) furyStart60();
}
function furyStart60(force) {
  const B = B60(), p = G.p, k = force || (p.job2 === 'A' ? 'frenzy' : p.job2 === 'B' ? 'ramp' : 'rage');
  B.mode = k; B.fury = B.max; B.frT = 0; B.rageT = k === 'ramp' ? B60C.ramp.dur : B60C.rage.dur;
  S60().fury = (S60().fury || 0) + 1;
  const col = HERO60.berserker.c1;
  sfx('ult'); shake(3, 0.25); rcBig(col, 0.25);
  fx({ kind: 'ring', x: p.x, y: p.y, r0: 12, r1: 90, dur: 0.4, color: col, follow: true });
  toast(k === 'frenzy' ? '광란' : k === 'ramp' ? '폭주' : '격노', col);
  const a = fz60('arrow'); if (a) giantBolt60(a);                               // 투기살: 격노 진입 순간 거대 투기살
}
function furyEnd60() {
  const B = B60(); B.mode = null; B.fury = 0; B.frT = 0; B.idle = 0; S60().furyEnd = (S60().furyEnd || 0) + 1;
  const b = fz60('bell'); if (b) bigBeat60(b);                                  // 고동: 격노 종료 순간 큰 고동
}
function spdK60() {                                                             // 전용·연성 휘두르는 속도 배율
  const B = B60(); let s = 1;
  if (B.mode === 'rage') s += B60C.rage.spd; else if (B.mode === 'frenzy') s += B60C.frenzy.spd; else if (B.mode === 'ramp') s += B60C.ramp.spd;
  if (B.roar > 0) s += B60C.roar.spd;
  return Math.max(0.3, s);
}

/* ---------- 전용 무기 대검 ---------- */
function bSwing60(w, S) {
  const p = G.p, D = WEAPONS.cleave.base, B = B60(), br = w.br, C = B60C;
  const range = D.range * S.area * (br === 'A' ? C.wide.range : br === 'B' ? C.heavy.range : 1), arc = D.arc * (br === 'A' ? C.wide.arc : 1);
  const dmg = S.dmg * (br === 'B' ? C.heavy.dmg : 1), kb = D.kb * (br === 'B' ? C.heavy.kb : 1), cd = S.cd * (br === 'B' ? C.heavy.cd : 1);
  if (B.spin) return false;                                                    // 회오리 중에는 다음 베기 대기
  if (w.aw === 'B' && (B.sw + 1) % C.thrust.every === 0) { const r = thrust60(w, range, dmg); if (r !== false) { B.sw++; return cd; } }
  const tg = nearestEnemy(p.x, p.y, range * 1.4); if (!tg) return false;
  B.sw++;
  if (w.aw === 'A' && B.sw % C.spin.every === 0) { B.spin = { t: 0, n: 0, range, dmg, kb, col: HERO60.berserker.c1 }; S60().spin = (S60().spin || 0) + 1; return C.spin.dur + 0.15; }
  const a0 = Math.atan2(tg.y - p.y, tg.x - p.x);
  if (br === 'B') {                                                             // 무거운 베기: 칼끝이 바닥을 긁으며 늦게 내려침
    for (let i = 0; i < 4; i++) fx({ kind: 'pop', x: p.x + Math.cos(a0 + Math.PI + rand(-0.5, 0.5)) * 22, y: p.y + 8 + rand(-3, 3), r: 4 + rand(3), color: '#8a7a68', dur: 0.3 });
    G.later.push({ t: C.heavy.wind, f: () => { if (G.result) return; const t2 = nearestEnemy(G.p.x, G.p.y, range * 1.4), a = t2 ? Math.atan2(t2.y - G.p.y, t2.x - G.p.x) : a0; bCut60(w, a, arc, range, dmg, kb); } });
  } else bCut60(w, a0, arc, range, dmg, kb);
  return cd;
}
function bCut60(w, a0, arc, range, dmg, kb) {
  const H = HERO60.berserker;
  sweep60(a0, arc, range, dmg, kb, H.c1, 'cleave');
  if (w.aw) fx({ kind: 'arc', a: a0, arc: arc * 0.92, r: range * 1.08, dur: 0.2, color: H.c3 });   // 무기 각성 공통 모습: 칼날 확대·붉은 날 무늬
}
function thrust60(w, range, dmg) {                                              // 찌르기: 우선 조준(정예·수문장 > 단단한 적 > 가까운 적), 직선 꿰뚫기
  const p = G.p, C = B60C.thrust, L = range * C.len; let best = null, bs = -1;
  gridQuery(p.x, p.y, L, e => { const s = (e.gk || e.boss ? 3 : e.elite ? 2 : TOUGH60[e.type] ? 1 : 0) * 1e6 - dist2(p.x, p.y, e.x, e.y); if (s > bs) { bs = s; best = e; } });
  if (!best) return false;
  const a = Math.atan2(best.y - p.y, best.x - p.x), ux = Math.cos(a), uy = Math.sin(a);
  gridQuery(p.x, p.y, L, e => { const dx = e.x - p.x, dy = e.y - p.y, t = dx * ux + dy * uy; if (t < 0 || t > L) return; if (Math.abs(dx * -uy + dy * ux) > C.w / 2 + e.r) return;
    damageEnemy(e, dmg * C.k, { src: 'cleave', kb: 60, fx: p.x, fy: p.y }); if (!e.dead) stun60(e, C.stun); });
  B60().thrusts.push({ x: p.x, y: p.y, a, L, t: 0, dur: 0.22 }); S60().thrust = (S60().thrust || 0) + 1;
  shake(2, 0.12);
}
function spinTick60(dt) {
  const B = B60(), s = B.spin; if (!s) return;
  const C = B60C.spin, per = C.dur / C.turns, p = G.p; s.t += dt;
  B.trails.push({ x: p.x, y: p.y, r: s.range, a: s.t * Math.PI * 2 / per, t: 0, dur: 0.18 });
  while (s.n < C.turns && s.t >= per * (s.n + 1) - per * 0.5) {                // 한 바퀴마다 둘레 전부 판정
    s.n++; const last = s.n === C.turns;
    gridQuery(p.x, p.y, s.range, e => damageEnemy(e, s.dmg * C.k, { src: 'cleave', kb: s.kb * (last ? C.kbEnd : 0.4), fx: p.x, fy: p.y }));
    fx({ kind: 'ring', x: p.x, y: p.y, r0: s.range * 0.5, r1: s.range, dur: 0.2, color: s.col, follow: true });
    if (last) shake(3, 0.2);
  }
  if (s.t >= C.dur) B.spin = null;
}

/* ---------- 궁극기 ---------- */
function ultSlam60(p) {                                                         // 대지 분쇄: 제자리 도약 → 착지 충격, 살아남은 적 기절
  const C = B60C.slam, B = B60(), col = HERO60.berserker.c1;
  p.invT = Math.max(p.invT, C.jump + 0.1); B.leap = { t: 0, dur: C.jump, h: 26 };
  uLater(C.jump, () => {
    const x = G.p.x, y = G.p.y, R = VIEW.w * C.R, d = B60().ref * C.k;
    shake(9, 0.45); uBlast(x, y, R, d, C.kb, col);
    gridQuery(x, y, R, e => { if (!e.dead) stun60(e, C.stun); });
    fx({ kind: 'ring', x, y, r0: R * 0.3, r1: R, dur: 0.6, color: HERO60.berserker.c3 });
    for (let i = 0; i < 10; i++) { const a = i * 0.628; B60().cracks.push({ x: x + Math.cos(a) * 30, y: y + Math.sin(a) * 18, a, L: R * 0.45, t: 0, dur: 0.7, big: 1 }); }
  });
  return 0.9;
}
function ultRoar60(p) {                                                         // 광란의 포효: 포효로 밀어냄 → 8초 광란 (속도·받는 피해·이동·화상·처치 폭발)
  const C = B60C.roar, B = B60(), col = HERO60.berserker.c1;
  gridQuery(p.x, p.y, C.R, e => damageEnemy(e, B.ref * C.k, { src: 'ult', kb: C.kb, fx: p.x, fy: p.y }));
  for (let i = 0; i < 3; i++) fx({ kind: 'ring', x: p.x, y: p.y, r0: 20 + i * 20, r1: C.R + i * 40, dur: 0.5 + i * 0.2, color: i ? HERO60.berserker.c3 : col, follow: true });
  shake(6, 0.5); B.roar = C.t + C.dur;
  return C.t + C.dur;
}
function ultBurst60(p) {                                                        // 분출 강타: 도약 내려찍기(앞쪽 부채꼴) → 핏빛 분출 3번 → 착지 즉시 폭주
  const C = B60C.burst, B = B60(), H = HERO60.berserker;
  const tg = nearestEnemy(p.x, p.y, VIEW.w), a0 = tg ? Math.atan2(tg.y - p.y, tg.x - p.x) : Math.atan2(p.face.y, p.face.x);
  p.invT = Math.max(p.invT, C.jump + 0.1); B.leap = { t: 0, dur: C.jump, h: 30 };
  const hit = (k, stun) => { const x = G.p.x, y = G.p.y, R = VIEW.w * C.R;
    gridQuery(x, y, R, e => { let da = Math.atan2(e.y - y, e.x - x) - a0; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) > C.arc / 2) return;
      damageEnemy(e, B60().ref * k, { src: 'ult', kb: 160, fx: x, fy: y }); if (!e.dead && stun) stun60(e, stun); });
    fx({ kind: 'arc', a: a0, arc: C.arc, r: R, dur: 0.3, color: H.c1 }); };
  uLater(C.jump, () => { shake(8, 0.4); hit(C.k, 0); furyStart60('ramp'); B60().rageT = B60C.ramp.dur; });
  for (let i = 1; i <= C.n; i++) uLater(C.jump + C.gap * i, () => { hit(C.k2, C.stun); const x = G.p.x, y = G.p.y; for (let j = 0; j < 5; j++) { const a = a0 + rand(-C.arc / 2, C.arc / 2), r = VIEW.w * C.R * rand(0.3, 0.9); B60().cracks.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, a, L: 26, t: 0, dur: 0.45, blood: 1 }); } });
  return C.jump + C.gap * C.n + 0.2;
}

/* ---------- 연성 7종 (짝 무기 + 대검) ---------- */
// 칼자국: 먼 적 몸에 굵게 찢긴 붉은 칼자국, 투지에 따라 굵기·피해 100~150%, 격노 중 2마리
function fCut60(w, S) {
  const p = G.p, R = 220 * S.area, ts = []; gridQuery(p.x, p.y, R, e => ts.push([dist2(p.x, p.y, e.x, e.y), e])); if (!ts.length) return false;
  const near = 86 * 86, far = ts.filter(t => t[0] > near).sort((a, b) => a[0] - b[0]), pool = (far.length ? far : ts.sort((a, b) => a[0] - b[0])).map(t => t[1]);
  const fr = furyFrac60(), k = 1 + 0.5 * fr, n = furyOn60() ? 2 : 1;
  for (const e of pool.slice(0, n)) {
    damageEnemy(e, 15 * fk60(w, S) * k, { src: 'dagger', kb: WEAPONS.cleave.base.kb * 0.4, fx: p.x, fy: p.y });
    B60().cuts.push({ e, x: e.x, y: e.y, a: rand(-0.9, 0.9), r: e.r + 9, t: 0, dur: 0.38, w: 3 + 5 * fr });
  }
  return 0.9 * fc60(w, S);
}
// 투기살: 붉은 투기 한 줄기가 멀리 꿰뚫고 날아감, 멈칫, 격노 진입 순간 거대 투기살
function boltFire60(w, S, wd, k) {
  const p = G.p, L = 300 * S.area, tg = nearestEnemy(p.x, p.y, L); if (!tg) return false;
  const a = Math.atan2(tg.y - p.y, tg.x - p.x), ux = Math.cos(a), uy = Math.sin(a), x0 = p.x, y0 = p.y, sp = 900, d = 16 * fk60(w, S) * k;
  gridQuery(x0, y0, L, e => { const dx = e.x - x0, dy = e.y - y0, t = dx * ux + dy * uy; if (t < 0 || t > L || Math.abs(dx * -uy + dy * ux) > wd / 2 + e.r) return;
    G.later.push({ t: t / sp, f: () => { if (e.dead || G.result) return; damageEnemy(e, d, { src: 'arrow' }); if (!e.dead) stun60(e, 0.2); } }); });
  B60().bolts.push({ x: x0, y: y0, a, L, w: wd, t: 0, dur: L / sp + 0.15, sp });
  return 1.0 * fc60(w, S);
}
function giantBolt60(w) { const S = wStats(w); boltFire60(w, S, 70, 3); shake(4, 0.25); }
// 칼무덤: 투지가 담긴 칼이 꽂혀 붉은 돔이 흔들림, 2.5초마다 확 커짐, 격노 중 더 커지고 짙어짐 (최대 3자루·10초)
function fGrave60(w, S) {
  const p = G.p, B = B60(), mine = B.graves.filter(g => g.w === w);
  if (mine.length >= 3) return 0.5;
  const tg = nearestEnemy(p.x, p.y, 300); if (!tg) return false;
  const a = Math.atan2(tg.y - p.y, tg.x - p.x), d = Math.min(60, Math.sqrt(dist2(p.x, p.y, tg.x, tg.y)));
  B.graves.push({ w, x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, t: 0, life: 10, tk: 0.5, bu: 2.5, pop: 0 });
  fx({ kind: 'pop', x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, r: 10, color: HERO60.berserker.c1, dur: 0.25 });
  return 4 * fc60(w, S);
}
function graveTick60(dt) {
  const B = B60(), on = furyOn60();
  for (const g of B.graves) {
    g.t += dt; g.pop = Math.max(0, g.pop - dt);
    if (g.t >= g.life || !G.p.weapons.includes(g.w)) { g.dead = true; continue; }
    const S = wStats(g.w), k = fk60(g.w, S) * (on ? 1.5 : 1), R = 65 * S.area + Math.sin(g.t * 9) * 5;
    if ((g.tk -= dt) <= 0) { g.tk = 0.5; gridQuery(g.x, g.y, R, e => damageEnemy(e, 6 * k, { src: 'turret' })); }
    if ((g.bu -= dt) <= 0) {
      g.bu = on ? 1.5 : 2.5; g.pop = 0.3; const RB = (on ? 150 : 110) * S.area;
      gridQuery(g.x, g.y, RB, e => damageEnemy(e, 20 * k, { src: 'turret', kb: 200, fx: g.x, fy: g.y }));
      fx({ kind: 'ring', x: g.x, y: g.y, r0: R, r1: RB, dur: 0.3, color: on ? HERO60.berserker.c2 : HERO60.berserker.c1 });
    }
  }
  B.graves = B.graves.filter(g => !g.dead);
}
// 분화: 광전사 주변 적 발밑 땅이 갈라지고 틈에서 불덩이가 솟구쳐 터짐, 3곳 차례로 (바닥에 남지 않음)
function fErupt60(w, S) {
  const p = G.p, ts = nearN60(p.x, p.y, 120 * S.area, 3); if (!ts.length) return false;
  const d = 18 * fk60(w, S), R = 40 * S.area;
  ts.forEach((e, i) => { const x = e.x, y = e.y;
    G.later.push({ t: i * 0.15, f: () => B60().cracks.push({ x, y, a: rand(7), L: R * 0.8, t: 0, dur: 0.5 }) });
    G.later.push({ t: i * 0.15 + 0.22, f: () => { if (G.result) return; gridQuery(x, y, R, t => damageEnemy(t, d, { src: 'fireball', kb: 60, fx: x, fy: y }));
      B60().spikes.push({ x, y, R, t: 0, dur: 0.4, fire: 1 }); fx({ kind: 'ring', x, y, r0: 6, r1: R, dur: 0.25, color: '#ff9a4a' }); } }); });
  return 1.2 * fc60(w, S);
}
// 피의 갈증: 주변 적 최대 3마리를 동시에 흡수, 가까운 적은 굵은 줄·피해 증가, 투지 충전 2배
function fDrain60(w, S) {
  const p = G.p, ts = nearN60(p.x, p.y, 140 * S.area, 3), prev = w.lk || []; w.lk = ts; w.lkT = G.time;
  if (!ts.length) return false;
  const d = 8 * fk60(w, S), in2 = (60 * S.area) ** 2;
  for (const e of ts) damageEnemy(e, d * (dist2(p.x, p.y, e.x, e.y) < in2 ? 1.5 : 1), { src: 'lamp' });
  if (!prev.length) S60().drain = (S60().drain || 0) + 1;
  return 0.3 * fc60(w, S);
}
// 고동: 몸에서 심장 박동처럼 붉은 고리 '쿵-쿵'(두 번째 60%), 격노 종료 순간 큰 고동
function beat60(R, d, stun, kb, big) {
  const p = G.p; gridQuery(p.x, p.y, R, e => { damageEnemy(e, d, { src: 'bell', kb, fx: p.x, fy: p.y }); if (!e.dead && stun) stun60(e, stun); });
  B60().beats.push({ R, t: 0, dur: big ? 0.6 : 0.32, big });
}
function fBeat60(w, S) {
  const R = 140 * S.area; if (!nearestEnemy(G.p.x, G.p.y, R)) return false;
  beat60(R, S.dmg, 0.2, 0); G.later.push({ t: 0.28, f: () => { if (!G.result) beat60(R, S.dmg * 0.6, 0.2, 0); } });
  return 3 * fc60(w, S);
}
function bigBeat60(w) { const S = wStats(w); beat60(220 * S.area, S.dmg * 2.5, 0, 300, 1); shake(4, 0.3); }
// 투기 가시: 주변 적 발밑에서 붉은 투기 가시가 솟아 하단을 휘감아 붙잡음(1.3초), 붙잡힌 적이 대검에 베이면 터져 주변에 흩어짐
function fSpike60(w, S) {
  const p = G.p; let tg = nearestEnemy(p.x, p.y, 130); if (!tg) tg = nearestEnemy(p.x, p.y, 200 * S.area); if (!tg) return false;
  const R = 35 * S.area, x = tg.x, y = tg.y, F = F60();
  gridQuery(x, y, R, e => { damageEnemy(e, 15 * fk60(w, S), { src: 'thorn' }); if (!e.dead) { root60(e, 1.3); if (noBoss60(e)) e.b60g = G.time + 1.3; } });
  if (F.vines.length < 40) F.vines.push({ x, y, R, e: tg, t: 0, dur: 1.45, col: HERO60.berserker.c1, s: rand(7) });
  return 1.3 * fc60(w, S);
}
function spikeBurst60(e) {
  const w = fz60('thorn'); e.b60g = 0; if (!w) return;
  S60().spikeBurst = (S60().spikeBurst || 0) + 1;
  const S = wStats(w), d = 15 * fk60(w, S), x = e.x, y = e.y, R = 50 * S.area;
  if (!e.dead) damageEnemy(e, d, { src: 'thorn' });
  gridQuery(x, y, R, t => { if (t !== e) damageEnemy(t, d * 0.6, { src: 'thorn' }); });
  B60().spikes.push({ x, y, R, t: 0, dur: 0.35 });
}
FUSE60.berserker = {
  dagger: { nm: '칼자국', ds: '먼 적 몸에 굵은 붉은 칼자국, 투지가 높을수록 굵고 강함 · 격노 중 2마리', fire: fCut60 },
  arrow: { nm: '투기살', ds: '붉은 투기가 멀리 꿰뚫고 날아가 멈칫 · 격노에 들어가는 순간 거대 투기살', fire: (w, S) => boltFire60(w, S, 24, 1) },
  turret: { nm: '칼무덤', ds: '투지가 담긴 칼이 꽂혀 붉은 돔이 흔들리고 주기적으로 확 커짐 · 격노 중 더 크고 짙게', fire: fGrave60 },
  fireball: { nm: '분화', ds: '주변 적 발밑 땅이 갈라지며 불덩이가 솟구쳐 터짐 (3곳 차례로)', fire: fErupt60 },
  lamp: { nm: '피의 갈증', ds: '주변 적 최대 3마리를 동시에 흡수, 가까운 적일수록 강함 · 투지 충전 2배', fire: fDrain60 },
  bell: { nm: '고동', ds: '몸에서 심장 박동처럼 붉은 고리 두 번 · 격노가 끝나는 순간 큰 고동', fire: fBeat60 },
  thorn: { nm: '투기 가시', ds: '주변 적 발밑에서 붉은 가시가 솟아 붙잡음 · 붙잡힌 적을 대검으로 베면 터져 주변에 박힘', fire: fSpike60 },
};

/* ---------- 인물 연결점 ---------- */
Object.assign(HERO60.berserker, {
  impl: true,
  br: [{ k: 'A', nm: '광역 베기', ds: '베는 각도 +45%, 사거리 +25%' }, { k: 'B', nm: '무거운 베기', ds: '느리지만 무겁게 내려침: 사거리 +15%, 피해·밀쳐냄 +20%, 간격 1.5초' }],
  wak: { A: { nm: '회오리 베기', ds: '4번째 베기마다 1.2초 동안 3바퀴 회전 베기, 마지막에 강하게 밀쳐냄' }, B: { nm: '찌르기', ds: '3번째 베기마다 강한 적을 노려 길게 꿰뚫는 찌르기 220%·멈칫' } },
  fire: bSwing60,
  stat(w) {
    const B = B60(), C = B60C; let dmg = 1, area = 1;
    if (B.mode === 'ramp') { dmg *= C.ramp.dmg; area *= C.ramp.area; }
    if (B.mode === 'frenzy') dmg *= 1 + Math.min(C.frenzy.stackMax, B.frT * C.frenzy.stack);
    return { dmg, area, cd: 1 / spdK60() };
  },
  onHit(e, o) {
    if (!mineSrc60(o.src)) return;
    const B = B60(), C = B60C;
    furyGain60(C.fury.hit * Math.min(C.fury.hitCap, (o.dmg0 || B.ref) / B.ref) * tierK60(e) * (o.src === 'lamp' ? 2 : 1));
    if (B.mode === 'ramp') stun60(e, C.ramp.stun);
    if (B.roar > 0 && B.roar <= C.roar.dur) burn60(e);
    if (o.src === 'cleave' && e.b60g > G.time) spikeBurst60(e);
  },
  onKill(e) {
    const B = B60(), C = B60C, src = e.ls;
    if (mineSrc60(src)) {
      furyGain60(C.fury.hit * tierK60(e) * (src === 'lamp' ? 2 : 1));
      if (B.mode === 'frenzy') heal(G.p.maxHp * (e.elite || e.gk ? C.frenzy.healElite : C.frenzy.healMob), '광란');
      if (src === 'cleave' && e.b60g > G.time) spikeBurst60(e);
    }
    if (B.roar > 0 && B.roar <= C.roar.dur && (mineSrc60(src) || src === 'b60burn') && B.boomN < 6) {   // 광란의 포효: 처치 시 화염 폭발 (폭발끼리 연쇄 없음)
      B.boomN++; const x = e.x, y = e.y;
      G.later.push({ t: 0.05, f: () => { if (G.result) return; gridQuery(x, y, C.roar.boomR, t => damageEnemy(t, B60().ref * C.roar.boomK, { src: 'b60boom' })); fx({ kind: 'ring', x, y, r0: 6, r1: C.roar.boomR, dur: 0.3, color: '#ff8a3a', fill: true }); } });
    }
  },
  hurtMul() {
    const B = B60(), C = B60C; let m = 1;
    if (B.mode === 'rage') m *= C.rage.hurt; else if (B.mode === 'frenzy') m *= C.frenzy.hurt; else if (B.mode === 'ramp') m *= C.ramp.hurt;
    if (B.roar > 0 && B.roar <= C.roar.dur) m *= C.roar.hurt;
    return m;
  },
  onHurt() { const B = B60(); furyGain60(B.mode === 'frenzy' ? B60C.fury.hurtA : B60C.fury.hurt); },
  spdMul() { const B = B60(); return B.roar > 0 && B.roar <= B60C.roar.dur ? B60C.roar.move : 1; },
  onPick() { G.b60 = null; B60(); SRC_NM.b60burn = '광란 화상'; SRC_NM.b60boom = '광란 폭발'; },
  onAwaken(k) { const B = B60(); B.max = k === 'B' ? B60C.fury.maxB : B60C.fury.max; B.fury = Math.min(B.fury, B.max); if (B.mode) { B.mode = null; B.fury = 0; } },
  ultFn(k) { return k === 'A' ? ultRoar60 : k === 'B' ? ultBurst60 : ultSlam60; },
  tick(dt) {
    const B = B60(), C = B60C;
    if ((B.refT -= dt) <= 0) { B.refT = 0.5; const b = baseW(); if (b) B.ref = Math.max(1, wStats(b).dmg); }
    B.idle += dt; B.boomN = 0;
    if (!B.mode && B.idle > C.fury.idle && B.fury > 0) B.fury = Math.max(0, B.fury - C.fury.decay * dt);
    if (B.mode === 'rage' || B.mode === 'ramp') { B.rageT -= dt; B.fury = B.max * Math.max(0, B.rageT) / (B.mode === 'ramp' ? C.ramp.dur : C.rage.dur); if (B.rageT <= 0) furyEnd60(); }
    else if (B.mode === 'frenzy') { B.frT += dt; B.fury -= (C.frenzy.drain + C.frenzy.accel * Math.floor(B.frT)) * dt; if (B.fury <= 0) furyEnd60(); }
    if (B.roar > 0) B.roar -= dt;
    if (B.leap) { B.leap.t += dt; if (B.leap.t >= B.leap.dur) B.leap = null; }
    spinTick60(dt); graveTick60(dt);
    if ((B.bt -= dt) <= 0) {                                                    // 광란의 포효 화상 (초당 대검 15%, 0.25초마다)
      B.bt = 0.25; const now = G.time;
      B.burn = B.burn.filter(e => !e.dead && e.b60b > now);
      for (const e of B.burn) damageEnemy(e, e.b60bd * 0.25, { src: 'b60burn' });
    }
    for (const k of ['cuts', 'bolts', 'cracks', 'beats', 'spikes', 'trails', 'thrusts']) { const L = B[k]; for (const o of L) o.t += dt; B[k] = L.filter(o => o.t < o.dur); }
  },
  status() { const B = B60(); return B.mode === 'rage' ? '격노 ' + Math.ceil(B.rageT) : B.mode === 'ramp' ? '폭주 ' + Math.ceil(B.rageT) : B.mode === 'frenzy' ? '광란' : B.roar > 0 && B.roar <= B60C.roar.dur ? '포효' : ''; },
  dials() { const B = B60(); return [{ ic: '투', col: B.mode ? '#ff5a3c' : HERO60.berserker.c1, k: Math.max(0, Math.min(1, B.fury / B.max)) }]; },
  draw: drawB60,
  drawBody(c, fn) {
    const B = B60(), p = G.p, s = B.mode === 'ramp' ? B60C.ramp.body : 1, h = B.leap ? Math.sin(Math.PI * B.leap.t / B.leap.dur) * B.leap.h : 0;
    if (s === 1 && !h) return fn();
    const by = p.y + p.r * 1.1; c.save(); c.translate(p.x, by - h); c.scale(s, s); c.translate(-p.x, -by); fn(); c.restore();
  },
});
function burn60(e) {
  const B = B60(), C = B60C.roar; if (!(e.b60b > G.time)) B.burn.push(e);
  e.b60b = G.time + C.burnT; e.b60bd = B.ref * C.burnK;
}

/* ---------- 그리기 (임시 도형, 최종본 아님) ---------- */
function drawB60(c) {
  const B = G.b60; if (!B) return;
  const p = G.p, H = HERO60.berserker, tau = Math.PI * 2;
  c.lineCap = 'round';
  if (B.mode) {                                                                 // 격노·광란·폭주: 몸 둘레 붉은 불길
    const n = 9, R = p.r + 6;
    c.globalAlpha = 0.55; c.fillStyle = B.mode === 'frenzy' ? '#ff5a3c' : H.c1;
    for (let i = 0; i < n; i++) { const a = i / n * tau + G.time * 2, fl = 8 + 6 * Math.abs(Math.sin(G.time * 11 + i * 1.7)), bx = p.x + Math.cos(a) * R * 0.8, by = p.y + Math.sin(a) * R * 0.45 + 4;
      c.beginPath(); c.moveTo(bx - 4, by); c.quadraticCurveTo(bx, by - fl * 1.4, bx + 4, by); c.closePath(); c.fill(); }
    c.globalAlpha = 0.22; c.beginPath(); c.ellipse(p.x, p.y + 6, R + 6, (R + 6) * 0.5, 0, 0, tau); c.fill();
  }
  if (B.roar > 0 && B.roar <= B60C.roar.dur) { c.globalAlpha = 0.35 + 0.15 * Math.sin(G.time * 14); c.strokeStyle = '#ff8a3a'; c.lineWidth = 3; c.beginPath(); c.arc(p.x, p.y, p.r + 14, 0, tau); c.stroke(); }
  if (B.leap) { c.globalAlpha = 0.35; c.fillStyle = '#000'; const k = 1 - Math.sin(Math.PI * B.leap.t / B.leap.dur) * 0.4; c.beginPath(); c.ellipse(p.x, p.y + p.r, p.r * k, p.r * 0.4 * k, 0, 0, tau); c.fill(); }
  for (const o of B.trails) { c.globalAlpha = 0.5 * (1 - o.t / o.dur); c.strokeStyle = H.c1; c.lineWidth = 5; c.beginPath(); c.arc(o.x, o.y, o.r, o.a, o.a + 1.6); c.stroke(); }
  for (const o of B.thrusts) { const k = o.t / o.dur; c.globalAlpha = 1 - k; c.strokeStyle = H.c1; c.lineWidth = 10 * (1 - k * 0.6); c.beginPath(); c.moveTo(o.x, o.y); c.lineTo(o.x + Math.cos(o.a) * o.L * Math.min(1, o.t / 0.06), o.y + Math.sin(o.a) * o.L * Math.min(1, o.t / 0.06)); c.stroke();
    c.strokeStyle = H.c3; c.lineWidth = 2; c.stroke(); }
  for (const o of B.cuts) { const k = o.t / o.dur, x = o.e && !o.e.dead ? o.e.x : o.x, y = o.e && !o.e.dead ? o.e.y : o.y, L = o.r * Math.min(1, o.t / 0.05);   // 칼자국: 굵게 찢긴 상처
    c.globalAlpha = 1 - k; c.strokeStyle = H.c2; c.lineWidth = o.w + 3; c.beginPath(); c.moveTo(x - Math.cos(o.a) * L, y - Math.sin(o.a) * L); c.lineTo(x + Math.cos(o.a) * L, y + Math.sin(o.a) * L); c.stroke();
    c.strokeStyle = H.c1; c.lineWidth = o.w; c.stroke(); }
  for (const o of B.bolts) { const head = Math.min(o.L, o.t * o.sp), tail = Math.max(0, head - 90), k = Math.max(0, (o.t - o.L / o.sp) / 0.15);   // 투기살: 붉은 줄기가 날아감
    c.globalAlpha = 0.85 * (1 - k); c.strokeStyle = H.c1; c.lineWidth = o.w * 0.6; c.beginPath(); c.moveTo(o.x + Math.cos(o.a) * tail, o.y + Math.sin(o.a) * tail); c.lineTo(o.x + Math.cos(o.a) * head, o.y + Math.sin(o.a) * head); c.stroke();
    c.strokeStyle = H.c3; c.lineWidth = Math.max(2, o.w * 0.18); c.stroke(); }
  for (const g of B.graves) {                                                   // 칼무덤: 꽂힌 칼 + 흔들리는 붉은 돔
    const on = furyOn60(), S = wStats(g.w), R = 65 * S.area + Math.sin(g.t * 9) * 5 + g.pop * 60, fade = Math.min(1, g.t * 4) * (g.life - g.t < 1 ? g.life - g.t : 1);
    c.globalAlpha = (on ? 0.32 : 0.18) * fade; c.fillStyle = on ? H.c2 : H.c1; c.beginPath(); c.ellipse(g.x, g.y, R, R * 0.62, 0, 0, tau); c.fill();
    c.globalAlpha = 0.7 * fade; c.strokeStyle = H.c1; c.lineWidth = 2; c.stroke();
    c.globalAlpha = fade; c.strokeStyle = '#d8d2cc'; c.lineWidth = 4; c.beginPath(); c.moveTo(g.x, g.y + 4); c.lineTo(g.x, g.y - 22); c.stroke();
    c.strokeStyle = H.c1; c.lineWidth = 3; c.beginPath(); c.moveTo(g.x - 7, g.y - 14); c.lineTo(g.x + 7, g.y - 14); c.stroke(); }
  for (const o of B.cracks) { const k = o.t / o.dur;                            // 갈라진 땅 (분화·대지 분쇄·분출)
    c.globalAlpha = 1 - k; c.strokeStyle = o.blood ? H.c1 : o.big ? '#5a3a2a' : '#ff6a2a'; c.lineWidth = o.big ? 4 : 3;
    c.beginPath(); for (let i = 0; i < 3; i++) { const a = o.a + i * 2.1, L = o.L * Math.min(1, o.t / 0.12); c.moveTo(o.x, o.y); c.lineTo(o.x + Math.cos(a) * L * 0.5, o.y + Math.sin(a) * L * 0.3 + 2); c.lineTo(o.x + Math.cos(a + 0.4) * L, o.y + Math.sin(a + 0.4) * L * 0.5); } c.stroke(); }
  for (const o of B.spikes) { const k = o.t / o.dur;                            // 솟구치는 불덩이(분화) · 터져 흩어지는 가시(투기 가시)
    c.globalAlpha = 1 - k;
    if (o.fire) { c.fillStyle = '#ff8a2a'; c.beginPath(); c.arc(o.x, o.y - 26 * Math.sin(Math.min(1, k * 2) * Math.PI / 2), o.R * 0.55 * (1 - k * 0.5), 0, tau); c.fill(); c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(o.x, o.y - 26 * Math.sin(Math.min(1, k * 2) * Math.PI / 2), o.R * 0.25, 0, tau); c.fill(); }
    else { c.strokeStyle = H.c1; c.lineWidth = 3; c.beginPath(); for (let i = 0; i < 8; i++) { const a = i * 0.785, r0 = 6, r1 = o.R * Math.min(1, o.t / 0.1); c.moveTo(o.x + Math.cos(a) * r0, o.y + Math.sin(a) * r0); c.lineTo(o.x + Math.cos(a) * r1, o.y + Math.sin(a) * r1); } c.stroke(); } }
  for (const o of B.beats) { const k = o.t / o.dur, r = o.R * (0.25 + 0.75 * Math.min(1, k * 1.6));   // 고동: 심장 박동 고리
    c.globalAlpha = 0.8 * (1 - k); c.strokeStyle = H.c1; c.lineWidth = o.big ? 7 : 4; c.beginPath(); c.arc(p.x, p.y, r, 0, tau); c.stroke(); }
  const lw = fz60('lamp');                                                      // 피의 갈증: 적 → 광전사로 흐르는 핏줄기
  if (lw && lw.lk && lw.lk.length && G.time - lw.lkT < 0.45) {
    const S = wStats(lw), in2 = (60 * S.area) ** 2;
    for (const e of lw.lk) { if (e.dead) continue; const close = dist2(p.x, p.y, e.x, e.y) < in2, dx = p.x - e.x, dy = p.y - e.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
      c.globalAlpha = 0.8; c.strokeStyle = H.c1; c.lineWidth = close ? 4.5 : 2; c.beginPath();
      for (let k = 0; k <= 10; k++) { const u = k / 10, wv = Math.sin(u * 8 + G.time * 16) * 4 * Math.sin(u * Math.PI), x = e.x + dx * u + nx * wv, y = e.y + dy * u + ny * wv; k ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke(); }
  }
  c.globalAlpha = 1;
}
