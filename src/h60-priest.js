/* ============================================================
   0.67 프리스트 구현 (회차 98, 분할 구현 8차) — 기준: docs/characters/priest.md
   • 고유 규칙(연성형): 기도 = 빛을 모으는 장치(스스로 피해 없음), 평소 천천히·멈추면 2배, 3단계 차면 0.3초 모으기 →
     축복 일제 발동(전용·연성 무기가 간격 무관 한꺼번에 강화 발동: 범위 +50%·피해 1.6배, 0.69 2배 → 1.6배) + 빛 파동(피해 없음)·종소리 + 보호막 2초
   • 머리 위 여신 형상: 기도의 출처·단계 표시 (임시 도형)
   • 전용 무기 축복의 종: 발현 A 잔향 → 무기 각성 A 공명 / 발현 B 뻗는 울림 → 무기 각성 B 겹울림
   • 궁극기: 기본 하늘의 대종 / 인물 각성 A 넘치는 기도 + 여신 강림 / 인물 각성 B 맡기는 기도 + 심판
   • 연성 7종: 성검·십자 긋기·갈라지는 빛살·금빛 촛대·성화·정화의 등불·결박진 (7종 모두 금빛, 모양으로 구분, 일제 발동 때 강화)
   • 그림: 새 장면은 임시 도형 (최종본 아님, GPT 요청 대상), 수치는 전부 가안 (대규모 밸런스 단계 조정)
   ============================================================ */
const R67C = {
  pray: { move: 1 / 3, stand: 2 / 3, max: 3, gather: 0.3, shield: 2 },               // 기도: 이동 중 9초·멈추면 4.5초에 3단계 (가안)
  boost: { area: 1.5, dmg: 1.6 },                                                    // 축복 일제 발동: 범위 +50%·피해 1.6배 (0.69 2배 → 1.6배, 종 피해 쏠림 55%)
  over: { hold: 4, area: 2, dmg: 3 },                                                // 넘치는 기도 4단계: 3단계 후 4초·범위 +100%·피해 3배
  echo: { late: 0.5, k: 0.3 },                                                       // 발현 A 잔향: 0.5초 뒤 같은 적 30%
  reso: { late: 0.3, R: 70, Rb: 105, k: 0.5, stun: 0.2 },                            // 무기 각성 A 공명: 0.3초 뒤 반경 70 작은 고리 50% + 멈칫 (일제 발동 105)
  fan: { arc: 120 * Math.PI / 180, R: 260, k: 1.2 },                                 // 발현 B 뻗는 울림: 부채꼴 120도·반경 260·피해 +20%
  layer: { n: 3, gap: 0.2, k: 0.7, kb: 70 },                                         // 무기 각성 B 겹울림: 세 겹 0.2초 간격·각 70%·마지막 겹 살짝 밀어냄 (밀어냄 70 가안)
  sky: { R: 150, look: 320, drop: 4, stun: 1, late: 0.4, kb: 160, dur: 6, tick: 1, k: 1.5, guard: 0.3, heal: 0.02 },   // 하늘의 대종 (반경·탐색 320·낙하 0.4초·낙하 피해·밀쳐냄 160 가안)
  descend: { n: 3, gap: 1 },                                                         // 여신 강림: 일제 발동 1초 간격 3번
  bolt: { R: 100, gap: 0.8, k: 0.8, stun: 0.2 },                                     // 맡기는 기도: 반경 100·0.8초 간격·종 기본 피해 80%
  judge: { dur: 2, n: 10, gap: 0.2, k: 3, R: 40 },                                   // 심판: 2초 이동 불가·피해 무효, 빛 번개 10줄기 (피해·반경 가안)
  sword: { cd: 1.25, range: 86, arc: 110 * Math.PI / 180, dmg: 19, per: 0.02, max: 0.08 },   // 성검: 벤 적 1마리당 기도 +2% (최대 +8%)
  cross: { cd: 0.9, range: 220, dmg: 14, late: 0.15, k: 0.6, side: 50, band: 16 },   // 십자 긋기 (위아래 폭 16 가안)
  prism: { cd: 1.0, range: 300, dmg: 16, sp: 520, R: 120, n: 2, k: 0.5 },            // 갈라지는 빛살 (화살 속도 가안)
  candle: { cd: 4, max: 3, life: 10, R: 70, tick: 0.5, dmg: 6, dist: 40 },           // 금빛 촛대 (놓는 거리 가안)
  holy: { cd: 1.2, range: 260, dmg: 18, sp: 300, R: [35, 45, 55, 55] },              // 성화: 기도 단계에 따라 폭발 반경
  purify: { range: 140, dmg: 5, heal: 0.1 },                                         // 정화의 등불: 준 피해의 10% 체력 회복
  bind: { cd: 1.3, range: 200, R: 60, n: 4, dmg: 15, root: 0.5 },                    // 결박진
};
const Qg = () => G.r67 || (G.r67 = { pray: 0, gT: 0, gLv: 0, hold: -1, boost: null, shieldT: 0, boltT: 0, sky: null, judge: null, descend: null,
  rings: [], waves: [], bolts: [], cuts: [], rays: [], candles: [], binds: [], sweeps: [], motes: [], bursts: 0 });
const isR67 = () => G.p && G.p.job === 'priest' && HERO60.priest.impl;
const QCOL = () => HERO60.priest;
const rk67 = (w, S) => fk60r(w, S);                              // 짝 무기 강화·보조 효과·일제 발동 배율
const rc67 = (w, S) => S.cd / WEAPONS[w.id].base.cd;
const ref67 = () => { const b = baseW(); return b ? wStats(b).dmg : WEAPONS.bell.base.dmg; };   // 무기 기준 = 종 1번 피해 (궁극기·번개, 가안)
const stage67 = () => Math.max(0, Math.min(R67C.pray.max, Math.floor(Qg().pray + 1e-6)));
function dense67(x, y, range, R) {                                                    // 범위 안에서 주변 적이 가장 많은 적
  let best = null, bs = -1;
  gridQuery(x, y, range, e => { if (e.dead) return; let n = 0; gridQuery(e.x, e.y, R, () => { n++; }); const s = n * 1000 - Math.sqrt(dist2(e.x, e.y, x, y)); if (s > bs) { bs = s; best = e; } });
  return best;
}
function sector67(x, y, a0, arc, R, f) {
  gridQuery(x, y, R, e => { let da = Math.atan2(e.y - y, e.x - x) - a0; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) <= arc / 2 + 0.08) f(e); });
}
function bestDir67(x, y, R, arc) {                                                    // 적이 가장 많은 방향 (12방향 표본)
  let ba = null, bn = 0;
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; let n = 0; sector67(x, y, a, arc, R, () => { n++; }); if (n > bn) { bn = n; ba = a; } }
  return ba;
}

/* ---------- 기도·축복 일제 발동 ---------- */
function prayTick67(dt) {
  const P = Qg(), C = R67C.pray, p = G.p, S6 = S60();
  if (P.shieldT > 0) P.shieldT -= dt;
  if (P.gT > 0) { P.gT -= dt; if (P.gT <= 0) { blessBurst67(P.gLv); P.pray = 0; P.hold = -1; } return; }   // 0.3초 모으기 동작 → 일제 발동
  if (P.pray < C.max) {
    P.pray = Math.min(C.max, P.pray + (p.moving ? C.move : C.stand) * dt);
    if (Math.random() < dt * (p.moving ? 6 : 12) && P.motes.length < 40) P.motes.push({ a: rand(6.28), r: rand(30, 60), t: 0, dur: 0.5 });   // 빛 입자가 여신에게 빨려 듦
    if (P.pray < C.max) return;
  }
  if (p.job2 !== 'A') return gather67(3);                                             // 기본: 3단계 차는 순간 모으기
  if (p.moving) return gather67(3);                                                   // 넘치는 기도: 움직이는 중이면 그 순간 3단계 크기로
  if (P.hold < 0) P.hold = 0;
  P.hold += dt; S6.holdMax = Math.max(S6.holdMax || 0, P.hold);
  if (P.hold >= R67C.over.hold) gather67(4);                                          // 서서 4초 더 모으면 4단계
}
function gather67(lv) { const P = Qg(); if (P.gT > 0) return; P.gT = R67C.pray.gather; P.gLv = lv; }
function blessBurst67(lv, keep) {                                                     // 축복 일제 발동: 전용·연성 무기가 간격 무관 한꺼번에 강화 발동
  const P = Qg(), p = G.p, K = lv >= 4 ? R67C.over : R67C.boost, S6 = S60();
  P.boost = K; P.bursts++;
  try {
    for (const w of p.weapons) {
      if (!(w.base || (w.fu && w.fu.job === 'priest'))) continue;
      const S = wStats(w), fd = w.fu && fuseDef60('priest', w.id), ctx = roll60(w); w.cr = ctx.cr;
      runCR60(ctx, () => fd ? fd.fire(w, S) : pBell67(w, S, true));
    }
  } finally { P.boost = null; }
  if (!keep) P.shieldT = R67C.pray.shield;
  const R = WEAPONS.bell.base.R * K.area * (baseW() ? wStats(baseW()).area : 1);
  let n = 0; if (G.eb) for (const b of G.eb) { if (b.life > 0 && dist2(b.x, b.y, p.x, p.y) < R * R) { b.life = 0; n++; } }   // 투사체 정화 = 일제 발동 종소리에만
  for (let i = 0; i < 3; i++) P.waves.push({ x: p.x, y: p.y, R: R * (1.1 + i * 0.25), t: -i * 0.12, dur: 0.6, big: lv >= 4 });   // 빛 파동 (피해 없음)
  sfx('preview'); shake(lv >= 4 ? 4 : 2.5, 0.2); if (typeof vib48 === 'function') vib48('ult');
  S6.bless = (S6.bless || 0) + 1; if (lv >= 4) S6.bless4 = (S6.bless4 || 0) + 1; S6.purify = (S6.purify || 0) + n;
}

/* ---------- 전용 무기 축복의 종 ---------- */
function pBell67(w, S, force) {
  const C = R67C, p = G.p, P = Qg(), D = WEAPONS.bell.base, R = D.R * S.area, burst = !!P.boost, ctx = CR60;
  if (w.br === 'B') {                                                                 // 뻗는 울림 / 겹울림: 적 많은 방향 부채꼴
    const FR = C.fan.R * S.area, a0 = bestDir67(p.x, p.y, FR, C.fan.arc);
    if (a0 == null) { if (!force) return false; P.waves.push({ x: p.x, y: p.y, R, t: 0, dur: 0.4 }); return; }
    const nL = w.aw === 'B' ? C.layer.n : 1, k = C.fan.k * (w.aw === 'B' ? C.layer.k : 1), d = S.dmg * k;
    for (let i = 0; i < nL; i++) {
      const last = w.aw === 'B' && i === nL - 1, f = () => { if (G.result) return; const x = G.p.x, y = G.p.y;
        withCR60(ctx, () => sector67(x, y, a0, C.fan.arc, FR, e => { damageEnemy(e, d, last ? { src: 'bell', kb: C.layer.kb, fx: x, fy: y } : { src: 'bell' }); if (!e.dead) stun60(e, D.stun); }));   // 밀어냄은 프리스트 쪽에서 바깥으로만
        P.rings.push({ x, y, R: FR, a: a0, arc: C.fan.arc, t: 0, dur: 0.35, fan: 1, big: burst }); if (w.aw === 'B') S60().layer = (S60().layer || 0) + 1; };
      i ? G.later.push({ t: i * C.layer.gap, f }) : f();
    }
    return;
  }
  if (!force && !nearestEnemy(p.x, p.y, R)) return false;
  const hit = []; gridQuery(p.x, p.y, R, e => { damageEnemy(e, S.dmg, { src: 'bell' }); if (!e.dead) { stun60(e, D.stun); hit.push(e); } });
  P.rings.push({ x: p.x, y: p.y, R, t: 0, dur: 0.35, big: burst, n: burst ? 3 : 1 });
  if (w.aw === 'A') {                                                                 // 공명: 맞은 적마다 작은 고리, 1번만 번짐
    const r = burst ? C.reso.Rb * S.area / P.boost.area : C.reso.R * S.area,   // 일제 발동 반경 105 (S.area에 든 1.5배를 빼고 적용, 교차 검토 반영)
     d = S.dmg * C.reso.k;
    for (const e of hit) { G.later.push({ t: C.reso.late, f: () => { if (G.result) return; const x = e.x, y = e.y;
      withCR60(ctx, () => gridQuery(x, y, r, o => { damageEnemy(o, d, { src: 'bell' }); if (!o.dead) stun60(o, C.reso.stun); })); P.rings.push({ x, y, R: r, t: 0, dur: 0.3, small: 1 }); S60().reso = (S60().reso || 0) + 1; } }); }
  } else if (w.br === 'A') {                                                          // 잔향: 0.5초 뒤 같은 적에게 약한 울림 (멈칫 없음)
    const d = S.dmg * C.echo.k;
    for (const e of hit) { e.r67e = G.time; G.later.push({ t: C.echo.late, f: () => { if (G.result || e.dead) return; withCR60(ctx, () => damageEnemy(e, d, { src: 'bell' })); P.rings.push({ x: e.x, y: e.y, R: e.r + 8, t: 0, dur: 0.25, small: 1 }); S60().echo = (S60().echo || 0) + 1; } }); }
  }
}

/* ---------- 맡기는 기도 (인물 각성 B): 서서 기도하는 동안 가까운 적에게 빛 번개 ---------- */
function boltTick67(dt) {
  const P = Qg(), p = G.p, C = R67C.bolt;
  if (p.job2 !== 'B' || p.moving || P.gT > 0 || P.judge) { P.boltT = Math.min(P.boltT, 0); return; }
  P.boltT += dt; if (P.boltT < C.gap) return;
  const e = nearestEnemy(p.x, p.y, C.R); if (!e) { P.boltT = C.gap; return; }
  P.boltT = 0; const b = baseW(), S = b ? wStats(b) : null, d = (S ? S.dmg : ref67()) * C.k;
  withCR60(b ? roll60(b) : null, () => damageEnemy(e, d, { src: 'bell' })); if (!e.dead) stun60(e, C.stun);
  P.bolts.push({ x: e.x, y: e.y, t: 0, dur: 0.25, s: rand(9) }); S60().bolt = (S60().bolt || 0) + 1;
}

/* ---------- 궁극기 ---------- */
function ultSky67(p) {                                                                // 하늘의 대종: 적 무리 위로 떨어져 6초 머묾
  const C = R67C.sky, P = Qg(), tg = dense67(p.x, p.y, C.look, C.R), x = tg ? tg.x : p.x, y = tg ? tg.y : p.y - 40;
  P.sky = { x, y, t: -C.late, k: 0, land: 0 }; S60().sky = (S60().sky || 0) + 1;
  return C.dur + C.late + 0.2;
}
function skyTick67(dt) {
  const P = Qg(), B = P.sky; if (!B) return;
  const C = R67C.sky, p = G.p, d0 = ref67(); B.t += dt;
  if (!B.land && B.t >= 0) { B.land = 1; gridQuery(B.x, B.y, C.R, e => { damageEnemy(e, d0 * C.drop, { src: 'ult', kb: C.kb, fx: p.x, fy: p.y }); if (!e.dead) stun60(e, C.stun); }); shake(6, 0.35); P.waves.push({ x: B.x, y: B.y, R: C.R, t: 0, dur: 0.5, big: 1 }); }
  if (!B.land) return;
  while (B.t >= (B.k + 1) * C.tick && B.k < C.dur / C.tick) {
    B.k++; gridQuery(B.x, B.y, C.R, e => { damageEnemy(e, d0 * C.k, { src: 'ult' }); if (!e.dead) stun60(e, 0.2); });
    P.rings.push({ x: B.x, y: B.y, R: C.R, t: 0, dur: 0.45, big: 1 }); S60().skyRing = (S60().skyRing || 0) + 1;
    if (dist2(p.x, p.y, B.x, B.y) < C.R * C.R) { heal(p.maxHp * C.heal * C.tick, '하늘의 대종'); S60().skyHeal = (S60().skyHeal || 0) + 1; }
    if (B.k >= C.dur / C.tick) { blessBurst67(3, true); S60().skyBless = (S60().skyBless || 0) + 1; }   // 마지막 울림 = 일제 발동 1회
  }
  if (B.k >= C.dur / C.tick) P.sky = null;
}
const inSky67 = () => { const B = Qg().sky; return B && B.land && dist2(G.p.x, G.p.y, B.x, B.y) < R67C.sky.R * R67C.sky.R; };
function ultDescend67() {                                                             // 여신 강림: 일제 발동 1초 간격 3번 (기본 크기)
  const C = R67C.descend, P = Qg(); P.descend = { t: 0, n: 0 }; S60().descend = (S60().descend || 0) + 1;
  return C.gap * (C.n - 1) + 0.6;
}
function descendTick67(dt) {
  const P = Qg(), D = P.descend; if (!D) return; const C = R67C.descend;
  D.t += dt; while (D.n < C.n && D.t >= D.n * C.gap) { D.n++; blessBurst67(3, true); S60().descendB = (S60().descendB || 0) + 1; }
  if (D.n >= C.n && D.t > (C.n - 1) * C.gap + 0.5) P.descend = null;
}
function ultJudge67() {                                                               // 심판: 여신이 날개처럼 감쌈, 2초 이동 불가·피해 무효, 빛 번개 10줄기
  const P = Qg(); P.judge = { t: 0, n: 0 }; S60().judge = (S60().judge || 0) + 1;
  return R67C.judge.dur;
}
function judgeTick67(dt) {
  const P = Qg(), J = P.judge; if (!J) return; const C = R67C.judge, p = G.p;
  J.t += dt;
  while (J.n < C.n && J.t >= J.n * C.gap) {
    J.n++; const tg = dense67(p.x, p.y, Math.max(VIEW.w, VIEW.h) * 0.55, C.R * 1.5); if (!tg) continue;   // 화면 적, 적 많은 곳부터
    const x = tg.x, y = tg.y; gridQuery(x, y, C.R, e => damageEnemy(e, ref67() * C.k, { src: 'ult' }));
    P.bolts.push({ x, y, t: 0, dur: 0.3, s: rand(9), big: 1 }); shake(1.5, 0.08); S60().judgeBolt = (S60().judgeBolt || 0) + 1;
  }
  if (J.t >= C.dur) P.judge = null;
}

/* ---------- 연성 7종 (짝 무기 + 축복의 종), 금빛, 일제 발동 때 강화 ---------- */
// 성검: 빛의 검이 곁을 휩쓸고, 벤 적 수만큼 빛 조각이 여신에게 날아가 기도가 빨리 참
function fSword67(w, S) {
  const C = R67C.sword, p = G.p, P = Qg(), range = C.range * S.area, tg = nearestEnemy(p.x, p.y, range * 1.4); if (!tg) return false;
  const a0 = Math.atan2(tg.y - p.y, tg.x - p.x), d = C.dmg * rk67(w, S); let n = 0;
  sector67(p.x, p.y, a0, C.arc, range, e => { damageEnemy(e, d, { src: 'cleave', kb: WEAPONS.cleave.base.kb, fx: p.x, fy: p.y }); n++; if (P.motes.length < 40) P.motes.push({ x: e.x, y: e.y, t: 0, dur: 0.4, shard: 1 }); });
  if (n && P.gT <= 0 && P.pray < R67C.pray.max) { const add = Math.min(C.max, C.per * n) * R67C.pray.max; P.pray = Math.min(R67C.pray.max, P.pray + add); S60().swordPray = (S60().swordPray || 0) + add; }
  P.sweeps.push({ x: p.x, y: p.y, R: range, a: a0, arc: C.arc, t: 0, dur: 0.25, big: !!P.boost }); S60().sword = (S60().sword || 0) + 1;
  return C.cd * rc67(w, S);
}
// 십자 긋기: 세로 획 → 0.15초 뒤 가로 획(양옆 적까지 길게)
function fCross67(w, S) {
  const C = R67C.cross, p = G.p, P = Qg(), ts = nearN60(p.x, p.y, C.range * S.area, S.n); if (!ts.length) return false;
  const d = C.dmg * rk67(w, S), side = C.side * S.area, ctx = CR60;
  for (const e of ts) { damageEnemy(e, d, { src: 'dagger' }); P.cuts.push({ e, x: e.x, y: e.y, v: 1, t: 0, dur: 0.35, L: e.r + 8 });
    G.later.push({ t: C.late, f: () => { if (G.result) return; const x = e.x, y = e.y; let n = 0;
      withCR60(ctx, () => gridQuery(x, y, side + 20, o => { if (o.dead || Math.abs(o.y - y) > C.band + o.r * 0.5 || Math.abs(o.x - x) > side + o.r) return; damageEnemy(o, d * C.k, { src: 'dagger' }); n++; }));
      P.cuts.push({ e, x, y, v: 0, t: 0, dur: 0.35, L: side + (e.r || 8) }); const S6 = S60(); S6.cross = (S6.cross || 0) + 1; S6.crossSide = Math.max(S6.crossSide || 0, n); } }); }
  return C.cd * rc67(w, S);
}
// 갈라지는 빛살: 빛 화살이 맞으면 갈라져 가까운 적 둘에게 작은 빛살
function fPrism67(w, S) {
  const C = R67C.prism, p = G.p, range = C.range * S.area, tg = nearestEnemy(p.x, p.y, range); if (!tg) return false;
  const a0 = Math.atan2(tg.y - p.y, tg.x - p.x), d = C.dmg * rk67(w, S), P = Qg();
  for (let i = 0; i < S.n; i++) P.rays.push({ x: p.x, y: p.y - 4, a: a0 + (i - (S.n - 1) / 2) * 0.12, d: 0, max: range * 1.1, dmg: d, cr: CR60, R: C.R * S.area });
  return C.cd * rc67(w, S);
}
function rayTick67(dt) {
  const P = Qg(), C = R67C.prism;
  for (const s of P.rays) {
    const st = C.sp * dt; s.x += Math.cos(s.a) * st; s.y += Math.sin(s.a) * st; s.d += st;
    let hit = null; gridQuery(s.x, s.y, 8, e => { if (!hit && !e.dead) hit = e; });
    if (hit) { s.dead = true; const x = hit.x, y = hit.y;
      withCR60(s.cr, () => { damageEnemy(hit, s.dmg, { src: 'arrow' }); const L = nearN60(x, y, s.R, C.n + 1).filter(o => o !== hit).slice(0, C.n);
        for (const o of L) { damageEnemy(o, s.dmg * C.k, { src: 'arrow' }); P.cuts.push({ x, y, tx: o.x, ty: o.y, t: 0, dur: 0.22, split: 1 }); } S60().split = (S60().split || 0) + L.length; });
      continue; }
    if (s.d >= s.max) s.dead = true;
  }
  P.rays = P.rays.filter(s => !s.dead);
}
// 금빛 촛대: 곁에 촛대가 세워지고, 촛불 빛 범위 안 적은 계속 그을림 (쏘지 않음)
function fCandle67(w, S) {
  const C = R67C.candle, p = G.p, P = Qg(), mine = P.candles.filter(o => o.w === w), burst = !!P.boost;
  if (mine.length >= C.max) { if (burst) for (const o of mine) { const fr = C.R * S.area; gridQuery(o.x, o.y, fr, e => damageEnemy(e, C.dmg * rk67(w, S), { src: 'turret' })); P.rings.push({ x: o.x, y: o.y, R: fr, t: 0, dur: 0.35, small: 1 }); S60().candleFlare = (S60().candleFlare || 0) + 1; } return 0.5; }   // 일제 발동 때 가득 차 있으면 세워진 촛대가 크게 타오름
  if (!nearestEnemy(p.x, p.y, 420)) return false;
  let q = null; for (let k = 0; k < 6 && !q; k++) { const a = rand(6.28), x = p.x + Math.cos(a) * C.dist, y = p.y + Math.sin(a) * C.dist * 0.8; if (!P.candles.some(o => dist2(o.x, o.y, x, y) < 26 * 26)) q = { x, y }; }
  q = q || { x: p.x + rand(-34, 34), y: p.y + rand(-30, 30) };
  P.candles.push({ w, x: q.x, y: q.y, t: 0, tk: 0, R: C.R * S.area / (burst ? R67C.boost.area : 1), k: rk67(w, S) / (burst ? R67C.boost.dmg : 1), big: burst });   // 일제 발동 중 세워도 촛대 자체는 기본 크기 (교차 검토 반영) S60().candle = (S60().candle || 0) + 1;
  return C.cd * rc67(w, S);
}
function candleTick67(dt) {
  const P = Qg(), C = R67C.candle;
  for (const o of P.candles) {
    o.t += dt; if (o.t >= C.life || !G.p.weapons.includes(o.w)) { o.dead = true; continue; }
    o.tk -= dt * ultCdMul(); if (o.tk > 0) continue; o.tk += C.tick;
    const d = C.dmg * o.k;
    gridQuery(o.x, o.y, o.R, e => { damageEnemy(e, d, { src: 'turret' }); S60().candleTk = (S60().candleTk || 0) + 1; });   // 그을림 = 지속 피해, 치명타 없음
  }
  P.candles = P.candles.filter(o => !o.dead);
}
// 성화: 흰 불꽃 덩이를 던져 터뜨림, 기도가 차오를수록 불꽃이 커짐 (불붙음 없음)
function fHoly67(w, S) {
  const C = R67C.holy, p = G.p, range = C.range * S.area, tg = nearestEnemy(p.x, p.y, range); if (!tg) return false;
  const a0 = Math.atan2(tg.y - p.y, tg.x - p.x), st = Math.min(2, stage67()), R = C.R[st] * S.area, d = C.dmg * rk67(w, S), P = Qg();
  S60().holyR = Math.max(S60().holyR || 0, C.R[st]);
  for (let i = 0; i < S.n; i++) shoot({ kind: 'fire', x: p.x, y: p.y, ang: a0 + (i - (S.n - 1) / 2) * 0.25, sp: C.sp, r: 6 + st * 1.5, dmg: d, R, life: range / C.sp, color: '#FFF8E7', src: 'fireball', r67: 1,
    on44: pr => { const x = pr.x, y = pr.y; withCR60(pr.cr60 || null, () => gridQuery(x, y, pr.R, e => damageEnemy(e, pr.dmg, { src: 'fireball', kb: 60, fx: G.p.x, fy: G.p.y }   /* 밀쳐냄 60 가안 */))); P.waves.push({ x, y, R: pr.R, t: 0, dur: 0.3, holy: 1 }); } });
  return C.cd * rc67(w, S);
}
// 정화의 등불: 가까운 적의 어둠을 빨아들여 빛으로 바꿔 체력을 채움
function fPurify67(w, S) {
  const C = R67C.purify, p = G.p, ts = nearN60(p.x, p.y, C.range * S.area, Math.max(1, S.n)), prev = w.lk || [];
  w.lk = ts; w.lkT = G.time; if (!ts.length) return false;
  const d = C.dmg * rk67(w, S); let got = 0;
  for (const e of ts) { const h0 = Math.max(0, e.hp); damageEnemy(e, d, { src: 'lamp' }); got += h0 - Math.max(0, e.hp); }
  if (got > 0) { heal(got * C.heal, '정화의 등불'); S60().purHeal = (S60().purHeal || 0) + got * C.heal; }
  return prev.length ? 'tick' : 'start';
}
// 결박진: 적이 몰린 곳 바닥에 빛 문양 원 → 둘레에서 빛 사슬이 솟아 원 안 적들을 감아 묶음 (끌어당김 없음)
function fBind67(w, S) {
  const C = R67C.bind, p = G.p, tg = dense67(p.x, p.y, C.range * S.area, C.R * S.area); if (!tg) return false;
  const x = tg.x, y = tg.y, R = C.R * S.area, d = C.dmg * rk67(w, S), L = nearN60(x, y, R, C.n), P = Qg();
  for (const e of L) { damageEnemy(e, d, { src: 'thorn' }); if (!e.dead) root60(e, C.root); }
  P.binds.push({ x, y, R, t: 0, dur: 0.7, es: L.slice(), big: !!P.boost }); const S6 = S60(); S6.bind = (S6.bind || 0) + 1; S6.bindMax = Math.max(S6.bindMax || 0, L.length);
  return C.cd * rc67(w, S);
}
FUSE60.priest = {
  cleave: { nm: '성검', ds: '빛의 검이 곁을 휩쓸고, 벤 적 1마리당 기도 +2% (최대 +8%)', fire: fSword67 },
  dagger: { nm: '십자 긋기', ds: '세로 획 뒤 0.15초에 가로 획(60%), 가로 획은 양옆 적까지 길게', fire: fCross67 },
  arrow: { nm: '갈라지는 빛살', ds: '빛 화살이 맞으면 갈라져 가까운 적 둘에게 작은 빛살 (각 50%)', fire: fPrism67 },
  turret: { nm: '금빛 촛대', ds: '곁에 촛대 최대 3개, 촛불 빛 범위 안 적은 계속 그을림', fire: fCandle67 },
  fireball: { nm: '성화', ds: '흰 불꽃 덩이를 던져 터뜨림, 기도가 차오를수록 폭발 범위가 커짐', fire: fHoly67 },
  lamp: { nm: '정화의 등불', ds: '가까운 적의 어둠을 빨아들여 준 피해의 10%만큼 체력 회복', fire: fPurify67 },
  thorn: { nm: '결박진', ds: '적이 몰린 곳에 빛 문양 원, 빛 사슬이 원 안 적 최대 4마리를 묶음', fire: fBind67 },
};

/* ---------- 인물 연결점 ---------- */
Object.assign(HERO60.priest, {
  impl: true,
  br: [{ k: 'A', nm: '잔향', ds: '맞은 적이 떨리고 0.5초 뒤 같은 적에게 약한 울림 (30%)' }, { k: 'B', nm: '뻗는 울림', ds: '적 많은 방향 부채꼴 120도·반경 260, 피해 +20%' }],
  wak: { A: { nm: '공명', ds: '맞은 적마다 0.3초 뒤 작은 고리 (50%·멈칫), 1번만 번짐' }, B: { nm: '겹울림', ds: '부채꼴이 세 겹으로 0.2초 간격 (각 70%), 마지막 겹 살짝 밀어냄' } },
  fire: pBell67,
  stat(w) { const B = Qg().boost; return B ? { dmg: B.dmg, area: B.area } : {}; },   // 일제 발동 중 강화 (전용·연성 무기만)
  hurtMul() { return inSky67() ? 1 - R67C.sky.guard : 1; },
  avoid() { const P = Qg(); if (P.judge) return true; if (P.shieldT > 0) { P.shieldT = 0; G.p.invT = CFG.player.invuln; S60().shieldBlock = (S60().shieldBlock || 0) + 1; fx({ kind: 'ring', x: G.p.x, y: G.p.y - 4, r0: 12, r1: 34, dur: 0.3, color: QCOL().c1, follow: true }); return true; } return false; },   // 0.69 보호막 = 2초 동안 피격 1번 막고 깨짐 (회차 102 해석: '근거 없는 무적' 원칙, 옛 2초 피해 무효)
  spdMul() { return Qg().judge ? 1e-6 : 1; },   // 0은 연결점에서 기본값 1로 바뀌므로 아주 작은 값
  onPick() { G.r67 = null; Qg(); },
  ultFn(k) { return k === 'A' ? ultDescend67 : k === 'B' ? ultJudge67 : ultSky67; },
  tick(dt) {
    const P = Qg(), S6 = S60();
    prayTick67(dt); boltTick67(dt); skyTick67(dt); descendTick67(dt); judgeTick67(dt); rayTick67(dt); candleTick67(dt);
    for (const k of ['rings', 'waves', 'bolts', 'cuts', 'binds', 'sweeps', 'motes']) { const L = P[k]; for (const o of L) o.t += dt; P[k] = L.filter(o => o.t < o.dur); }
    S6.prayMax = Math.max(S6.prayMax || 0, P.pray); S6.stillT = (S6.stillT || 0) + (G.p.moving ? 0 : dt); S6.moveT = (S6.moveT || 0) + (G.p.moving ? dt : 0);
  },
  status() { const P = Qg(); if (P.judge) return '심판'; if (P.sky) return '하늘의 대종'; if (P.gT > 0) return '축복!'; if (P.hold >= 0) return '넘치는 기도 ' + Math.min(100, Math.round(P.hold / R67C.over.hold * 100)) + '%'; return '기도 ' + stage67() + '단계' + (G.p.moving ? '' : ' · 서서 기도'); },
  dials() { const P = Qg(); return [{ ic: '기', col: QCOL().col, k: P.hold >= 0 ? 1 : P.pray / R67C.pray.max }]; },
  draw: drawR67,
});

/* ---------- 프리스트 전용 자동 플레이 ----------
   기도는 멈추면 2배로 차고(맡기는 기도는 서 있을 때만 번개), 공용 자동 플레이는 늘 움직이므로 여유가 있을 때 서서 기도함
   위험(예고·곧 닿는 적·탄환·목표 지점)은 공용 로직 우선, 넘치는 기도는 3단계 뒤 서서 4단계까지 버팀 (기준값 가안) */
const AUTO67 = { tcGo: 0.7, tcGoLow: 1.1, tcB: 0.5, minStand: 0.4, lowHp: 0.4 };
const _autoVecR67 = autoVec;
function rAuto67() { return AUTO.r67 && AUTO.r67.run === G ? AUTO.r67 : (AUTO.r67 = { run: G, mode: 'move', at: G.time, why: '', fd: null }); }
autoVec = function () {
  if (!isR67() || !G.r67) return _autoVecR67.apply(this, arguments);
  const s = rAuto67(), p = G.p, P = Qg(), S6 = S60();
  if (P.judge) return (AUTO.out = { x: 0, y: 0, m: 0 });
  if (G.time < (s.next || 0) && s.out) return s.out;
  s.next = G.time + rand(0.06, 0.12);
  const inHz = hazT50(p.x, p.y) < Infinity, tg = autoTarget(), tc = tcMin63(p.x, p.y), here = autoDanger(p.x, p.y), el = G.time - s.at;
  let go = (p.hp < p.maxHp * AUTO67.lowHp ? AUTO67.tcGoLow : AUTO67.tcGo); if (p.job2 === 'B') go = Math.min(go, AUTO67.tcB + (p.hp < p.maxHp * AUTO67.lowHp ? 0.3 : 0)); if (STATE.dev.god) go *= 0.6;
  const hold = P.hold >= 0;
  let stand = !inHz && tc > (hold ? go * 0.7 : go) && !(tg && tg.k === 'goal') && shotT63() > 0.5 && here < 1.5 && !(tg && (tg.k === 'boss' || tg.k === 'gk') && here > 1);
  if (stand && !nearestEnemy(p.x, p.y, 260) && tg && tg.k !== 'gem') stand = false;      // 주변에 적이 없으면 다가감
  if (!stand && s.mode === 'stand' && el < AUTO67.minStand && !inHz && tc > go * 0.5) stand = true;
  if (stand) {
    if (s.mode !== 'stand') { s.mode = 'stand'; s.at = G.time; S6.rStand = (S6.rStand || 0) + 1; }
    if (ultReady() && !autoUltSetting() && (here > 2 || G.time - G.tm.readyAt > 6)) { S50().ultStop++; ultPress58('ai'); }
    return (s.out = AUTO.out = { x: 0, y: 0, m: 0 });
  }
  if (s.mode !== 'move') { s.mode = 'move'; s.at = G.time; }
  if (!inHz && tc < go) return (s.out = fleeDir63(s));
  return (s.out = _autoVecR67.apply(this, arguments));
};

/* ---------- 그리기 (임시 도형, 최종본 아님) ---------- */
function goddess67(c, x, y, s, glow, now, wing) {                                     // 기도하는 작은 반투명 여신 (머리 뒤쪽 위)
  const H = HERO60.priest, tau = Math.PI * 2, br = Math.sin(now * 2) * 0.8;
  c.globalAlpha = 0.18 + glow * 0.3; c.fillStyle = H.c2; c.beginPath(); c.arc(x, y + s * 0.3, s * (0.9 + glow * 0.5), 0, tau); c.fill();   // 빛무리
  if (wing) { c.globalAlpha = 0.6; c.fillStyle = H.c2; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(x, y + s * 0.2); c.quadraticCurveTo(x + sd * s * 2.4, y - s * 0.8, x + sd * s * 2.2, y + s * 1.6); c.quadraticCurveTo(x + sd * s, y + s * 1.1, x, y + s * 0.9); c.fill(); } }
  c.globalAlpha = 0.45 + glow * 0.35; c.fillStyle = '#FFF4D0';
  c.beginPath(); c.moveTo(x, y - s * 0.15 + br); c.lineTo(x + s * 0.55, y + s * 1.25); c.lineTo(x - s * 0.55, y + s * 1.25); c.closePath(); c.fill();   // 옷자락
  c.beginPath(); c.arc(x, y - s * 0.35 + br, s * 0.28, 0, tau); c.fill();             // 머리
  c.fillStyle = H.c1; c.beginPath(); c.arc(x, y + s * 0.25 + br, s * 0.12, 0, tau); c.fill();   // 모은 두 손
  c.strokeStyle = H.c1; c.lineWidth = 1.2; c.globalAlpha = 0.5 + glow * 0.4; c.beginPath(); c.ellipse(x, y - s * 0.72 + br, s * 0.32, s * 0.1, 0, 0, tau); c.stroke();   // 고리
}
function zig67(c, x, y, top, seed, w) {                                               // 하늘에서 내리치는 빛 번개
  c.lineWidth = w; c.beginPath(); c.moveTo(x + Math.sin(seed) * 10, y - top);
  for (let i = 1; i <= 6; i++) { const u = i / 6; c.lineTo(x + (i < 6 ? Math.sin(seed * 3 + i * 1.7) * 9 : 0), y - top * (1 - u)); } c.stroke();
}
function drawR67(c) {
  const P = G.r67; if (!P) return;
  const p = G.p, H = HERO60.priest, tau = Math.PI * 2, now = G.time;
  c.lineCap = 'round';
  for (const o of P.candles) { const fade = Math.min(1, o.t * 4) * Math.min(1, (R67C.candle.life - o.t) * 2), fl = Math.sin(now * 16 + o.x) * 1.5;   // 금빛 촛대 + 촛불 빛 범위
    c.globalAlpha = 0.12 * fade + 0.04 * Math.sin(now * 5); c.fillStyle = H.c1; c.beginPath(); c.arc(o.x, o.y, o.R, 0, tau); c.fill();
    c.globalAlpha = fade; c.fillStyle = '#B8902F'; c.fillRect(o.x - 1.5, o.y - 12, 3, 12); c.fillRect(o.x - 5, o.y - 1, 10, 3);
    c.fillStyle = '#FFF8E7'; c.fillRect(o.x - 1.2, o.y - 17, 2.4, 5); c.fillStyle = '#FFD86A'; c.beginPath(); c.ellipse(o.x, o.y - 20 + fl * 0.3, 2.4, 4 + (o.big ? 2 : 0), 0, 0, tau); c.fill(); }
  for (const o of P.binds) { const k = o.t / o.dur, al = Math.min(1, (1 - k) * 3);   // 결박진: 빛 문양 원 + 둘레에서 솟는 빛 사슬
    c.globalAlpha = 0.5 * al; c.strokeStyle = H.c1; c.lineWidth = 2; c.beginPath(); c.arc(o.x, o.y, o.R, 0, tau); c.stroke(); c.beginPath(); c.arc(o.x, o.y, o.R * 0.7, 0, tau); c.stroke();
    for (let i = 0; i < 6; i++) { const a = i / 6 * tau + o.t; c.beginPath(); c.moveTo(o.x + Math.cos(a) * o.R * 0.7, o.y + Math.sin(a) * o.R * 0.7); c.lineTo(o.x + Math.cos(a + 1.05) * o.R, o.y + Math.sin(a + 1.05) * o.R); c.stroke(); }
    c.globalAlpha = 0.9 * al; c.strokeStyle = '#FFE9A0'; c.lineWidth = 2.5; c.setLineDash([4, 3]);
    o.es.forEach((e, i) => { if (e.dead) return; const a = i / Math.max(1, o.es.length) * tau, sx = o.x + Math.cos(a) * o.R, sy = o.y + Math.sin(a) * o.R, u = Math.min(1, o.t / 0.15); c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + (e.x - sx) * u, sy + (e.y - sy) * u); c.stroke(); });
    c.setLineDash([]); }
  if (P.sky) { const B = P.sky, C = R67C.sky, fall = B.land ? 0 : Math.min(1, -B.t / C.late) * 220, sw = B.land ? Math.sin(now * 6) * 0.15 : 0;   // 하늘의 대종
    if (B.land) { c.globalAlpha = 0.14; c.fillStyle = H.c1; c.beginPath(); c.arc(B.x, B.y, C.R, 0, tau); c.fill(); c.globalAlpha = 0.4; c.strokeStyle = H.c1; c.lineWidth = 2; c.stroke(); }
    c.save(); c.translate(B.x, B.y - 30 - fall); c.rotate(sw); c.globalAlpha = 0.95; c.fillStyle = H.c1;
    c.beginPath(); c.moveTo(-10, -26); c.quadraticCurveTo(-12, 8, -26, 22); c.lineTo(26, 22); c.quadraticCurveTo(12, 8, 10, -26); c.closePath(); c.fill();
    c.fillStyle = H.c2; c.fillRect(-26, 18, 52, 5); c.fillStyle = '#B8902F'; c.beginPath(); c.arc(0, 26, 5, 0, tau); c.fill(); c.restore(); }
  for (const o of P.rings) { const k = o.t / o.dur;
    if (o.fan) { c.globalAlpha = 0.5 * (1 - k); c.strokeStyle = o.big ? '#FFF8E7' : H.c1; c.lineWidth = 4 * (1 - k) + 1; c.beginPath(); c.arc(o.x, o.y, o.R * (0.25 + 0.75 * k), o.a - o.arc / 2, o.a + o.arc / 2); c.stroke(); continue; }   // 뻗는 울림 부채꼴
    const nR = o.n || 1; for (let i = 0; i < nR; i++) { const kk = Math.max(0, k - i * 0.15); if (kk <= 0) continue; c.globalAlpha = (o.small ? 0.6 : 0.5) * (1 - kk); c.strokeStyle = o.big ? '#FFF8E7' : H.c1; c.lineWidth = (o.small ? 2 : 4) * (1 - kk) + 1; c.beginPath(); c.arc(o.x, o.y, o.R * (0.2 + 0.8 * kk), 0, tau); c.stroke(); } }
  for (const o of P.waves) { if (o.t < 0) continue; const k = o.t / o.dur;          // 빛 파동 (피해 없음)·성화 폭발
    if (o.holy) { c.globalAlpha = 0.6 * (1 - k); c.fillStyle = '#FFF8E7'; c.beginPath(); c.arc(o.x, o.y, o.R * (0.3 + 0.7 * Math.min(1, k * 2.5)), 0, tau); c.fill(); c.globalAlpha = 0.5 * (1 - k); c.strokeStyle = H.c1; c.lineWidth = 2; c.stroke(); continue; }
    c.globalAlpha = 0.35 * (1 - k); c.strokeStyle = o.big ? '#FFFFFF' : '#FFF4D0'; c.lineWidth = 8 * (1 - k) + 2; c.beginPath(); c.arc(o.x, o.y, o.R * (0.1 + 0.9 * k), 0, tau); c.stroke(); }
  for (const o of P.sweeps) { const k = o.t / o.dur, sa = o.a - o.arc / 2 + o.arc * Math.min(1, k * 3);   // 성검: 빛의 검 궤적
    c.globalAlpha = 0.6 * (1 - k); c.strokeStyle = H.c2; c.lineWidth = o.big ? 9 : 6; c.beginPath(); c.arc(o.x, o.y, o.R * 0.85, o.a - o.arc / 2, sa); c.stroke();
    c.globalAlpha = 0.95 * (1 - k); c.strokeStyle = H.c1; c.lineWidth = 4; c.beginPath(); c.moveTo(o.x + Math.cos(sa) * 16, o.y + Math.sin(sa) * 16); c.lineTo(o.x + Math.cos(sa) * o.R, o.y + Math.sin(sa) * o.R); c.stroke(); }
  for (const o of P.cuts) { const k = o.t / o.dur;
    if (o.split) { c.globalAlpha = 0.9 * (1 - k); c.strokeStyle = '#FFF8E7'; c.lineWidth = 2; c.beginPath(); c.moveTo(o.x, o.y); c.lineTo(o.x + (o.tx - o.x) * Math.min(1, k * 3), o.y + (o.ty - o.y) * Math.min(1, k * 3)); c.stroke(); continue; }   // 갈라진 빛살
    const x = o.e && !o.e.dead ? o.e.x : o.x, y = o.e && !o.e.dead ? o.e.y : o.y, L = o.L * Math.min(1, o.t / 0.06);   // 십자: 세로·가로 획
    c.globalAlpha = 1 - k; c.strokeStyle = k < 0.3 ? '#FFFFFF' : H.c1; c.lineWidth = 3.2 * (1 - k * 0.5); c.beginPath();
    if (o.v) { c.moveTo(x, y - L); c.lineTo(x, y + L); } else { c.moveTo(x - L, y); c.lineTo(x + L, y); } c.stroke(); }
  for (const s of P.rays) { const ux = Math.cos(s.a), uy = Math.sin(s.a);            // 빛 화살
    c.globalAlpha = 0.45; c.strokeStyle = H.c1; c.lineWidth = 5; c.beginPath(); c.moveTo(s.x - ux * 20, s.y - uy * 20); c.lineTo(s.x, s.y); c.stroke();
    c.globalAlpha = 1; c.strokeStyle = '#FFFFFF'; c.lineWidth = 2; c.beginPath(); c.moveTo(s.x - ux * 12, s.y - uy * 12); c.lineTo(s.x + ux * 4, s.y + uy * 4); c.stroke(); }
  for (const w of p.weapons) if (w.fu && w.fu.job === 'priest' && w.id === 'lamp' && w.lk && G.time - w.lkT < 0.35) {   // 정화의 등불: 금빛 등불 + 검은 기운이 줄기를 타고 오다 빛으로 바뀜
    const hx = p.x + 14, hy = p.y - 20 + Math.sin(now * 3) * 2; c.globalAlpha = 1; c.fillStyle = '#FFE9A0'; c.beginPath(); c.arc(hx, hy, 4.5, 0, tau); c.fill(); c.strokeStyle = '#B8902F'; c.lineWidth = 1.5; c.strokeRect(hx - 5, hy - 5, 10, 11);
    for (const e of w.lk) { if (e.dead) continue; const dx = hx - e.x, dy = hy - e.y;
      for (let i = 0; i < 5; i++) { const u = ((now * 1.6 + i / 5) % 1); c.globalAlpha = 0.9; c.fillStyle = u < 0.6 ? '#2a1f33' : '#FFF4D0'; c.beginPath(); c.arc(e.x + dx * u, e.y + dy * u, 2.4, 0, tau); c.fill(); }
      c.globalAlpha = 0.35; c.strokeStyle = H.c1; c.lineWidth = 1.5; c.beginPath(); c.moveTo(e.x, e.y); c.lineTo(hx, hy); c.stroke(); } }
  for (const o of P.bolts) { const k = o.t / o.dur;                                   // 빛 번개
    c.globalAlpha = 1 - k; c.strokeStyle = '#FFFFFF'; zig67(c, o.x, o.y, o.big ? 260 : 120, o.s, o.big ? 4 : 2.5); c.strokeStyle = H.c3; c.globalAlpha = 0.5 * (1 - k); zig67(c, o.x, o.y, o.big ? 260 : 120, o.s, o.big ? 9 : 5);
    c.globalAlpha = 0.5 * (1 - k); c.fillStyle = '#FFF8E7'; c.beginPath(); c.arc(o.x, o.y, o.big ? R67C.judge.R : 10, 0, tau); c.fill(); }
  if (P.shieldT > 0) { c.globalAlpha = 0.25 + 0.1 * Math.sin(now * 10); c.strokeStyle = H.c1; c.lineWidth = 2.5; c.beginPath(); c.arc(p.x, p.y - 4, 22, 0, tau); c.stroke(); c.fillStyle = H.c2; c.globalAlpha = 0.1; c.fill(); }   // 보호막
  const gx = p.x - p.face.x * 4, gy = p.y - 40, st = stage67(), glow = P.gT > 0 ? 1 : P.hold >= 0 ? 0.75 + 0.25 * Math.sin(now * 12) : st / 3 * 0.7;   // 머리 위 여신 (모일수록 밝고 빛무리 증가)
  for (const o of P.motes) { const k = o.t / o.dur;                                   // 빨려 드는 빛 입자·성검 빛 조각
    if (o.shard) { const x = o.x + (gx - o.x) * k, y = o.y + (gy - o.y) * k; c.globalAlpha = 1 - k * 0.5; c.fillStyle = '#FFF8E7'; c.fillRect(x - 1.5, y - 1.5, 3, 3); continue; }
    const r = o.r * (1 - k); c.globalAlpha = 0.8 * k; c.fillStyle = H.c1; c.beginPath(); c.arc(gx + Math.cos(o.a) * r, gy + Math.sin(o.a) * r * 0.7, 1.6, 0, tau); c.fill(); }
  goddess67(c, gx, gy, 13, glow, now, !!P.judge);
  if (P.gT > 0) { const k = 1 - P.gT / R67C.pray.gather; c.globalAlpha = 0.7 * k; c.strokeStyle = '#FFFFFF'; c.lineWidth = 2; c.beginPath(); c.arc(gx, gy, 30 * (1 - k) + 4, 0, tau); c.stroke(); }   // 0.3초 모으기
  if (P.judge) { c.globalAlpha = 0.25; c.fillStyle = H.c2; c.beginPath(); c.arc(p.x, p.y - 4, 30, 0, tau); c.fill(); }
  c.globalAlpha = 1;
}
