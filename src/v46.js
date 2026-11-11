/* ============================================================
   0.46 동료 지휘 로직 (회차 52, 표현·보강 단계)
   • 대상: 소환사 망령·망령 무장(연성), 드루이드 야수 동료 — 공통 지휘 모듈 squad46
   • 거리: 대기 고리 반경 110~160, 동료 3체째부터 1체당 +6 (최대 +30), 활동 범위 210 + 동일 가산 (상한 240)
   • 평소: 고리를 동료 수만큼 구역 분할 → 각자 구역 방향 적 우선, 적 1체당 1명 배정 (분산)
   • 정예·수문장·보스: 동료 수 절반(올림)만 집중 투입, 보스 단독 구간은 전원 투입
   • 근접 위협(플레이어 반경 80 안 적) 최우선 처리
   • 같은 적을 여럿이 칠 때 적 둘레에 공격 자리를 각도로 나눠 배정 (겹침 방지), 동료 간 최소 간격 22
   • 표적 재판단 0.6초, 공격 중 표적은 처치·이탈 전까지 유지
   • 드루이드: 곰 정예·보스 담당, 늑대 잡몹 분산 담당
   • 활동 범위 밖 이탈 시 표적 해제 후 고리로 복귀 (속도 1.6배)
   • 망령 무기 발동은 망령 위치(고리·공격 자리) = 활동 범위 안에서만 발동
   ============================================================ */
const SQ46 = { rIn: 110, rOut: 160, per: 6, extraMax: 30, act: 210, actMax: 240, near: 80, re: 0.6, gap: 22 };
function sqGeom46(n) { const ex = Math.min(SQ46.extraMax, SQ46.per * Math.max(0, n - 2)); return { rIn: SQ46.rIn + ex, rOut: SQ46.rOut + ex, act: Math.min(SQ46.actMax, SQ46.act + ex) }; }
const big46 = e => !!(e.boss || e.gk || e.elite);
const bigRank46 = e => e.boss ? 3 : e.gk ? 2 : e.elite ? 1 : 0;
/* 지휘: units에 tg(표적)·gx/gy(목표 위치)·ret(복귀 중) 지정 */
function squad46(U, o = {}) {
  const p = G.p, n = U.length; if (!n || !p) return;
  const Gm = sqGeom46(n), A2 = Gm.act * Gm.act, rOf = o.r || (u => u.r || 8);
  const st = o.state || (U._sq46 = U._sq46 || { t: 0 });
  U.forEach((u, i) => {
    u.sqi = i;
    const dp = Math.hypot(u.x - p.x, u.y - p.y);
    if (dp > Gm.act + 30) u.ret = true; else if (u.ret && dp < Gm.rOut) u.ret = false;
    if (u.ret || (u.tg && (u.tg.dead || dist2(u.tg.x, u.tg.y, p.x, p.y) > A2))) u.tg = null;
  });
  st.t -= o.dt || 1 / 60;
  const needs = U.some(u => !u.tg && !u.ret);
  if (st.t <= 0 || (needs && st.t < SQ46.re - 0.1)) {
    st.t = SQ46.re;
    const E = []; gridQuery(p.x, p.y, Gm.act, e => { if (!e.dead) E.push(e); });
    if (!E.length) U.forEach(u => u.tg = null);
    else assign46(U, E, o, Gm);
  }
  goals46(U, Gm, rOf);
}
function assign46(U, E, o, Gm) {
  const p = G.p, n = U.length, free = U.filter(u => !u.ret), cnt = new Map(), on = e => cnt.get(e) || 0;
  const setT = (u, e) => { if (u.tg) cnt.set(u.tg, on(u.tg) - 1); u.tg = e; if (e) cnt.set(e, on(e) + 1); };
  for (const u of free) if (u.tg) cnt.set(u.tg, on(u.tg) + 1);
  const d2 = (a, b) => dist2(a.x, a.y, b.x, b.y);
  /* 플레이어 지정 표적(야생 변환 표식): 전원 */
  if (o.mark && !o.mark.dead && E.includes(o.mark)) { free.forEach(u => setT(u, o.mark)); return; }
  const big = E.filter(big46).sort((a, b) => bigRank46(b) - bigRank46(a) || d2(a, p) - d2(b, p)), small = E.filter(e => !big46(e));
  /* 보스 단독 구간: 전원 투입 (큰 적 사이 균등) */
  if (big.length && !small.length) { free.forEach(u => { if (!u.tg || !big46(u.tg)) { const t = big.slice().sort((a, b) => on(a) - on(b) || d2(a, u) - d2(b, u))[0]; setT(u, t); } }); return; }
  /* 근접 위협 최우선 */
  const near = small.filter(e => d2(e, p) < SQ46.near * SQ46.near).sort((a, b) => d2(a, p) - d2(b, p));
  const nearSet = new Set();
  for (const e of near) {
    if (on(e)) { nearSet.add(e); continue; }
    const c = free.filter(u => !(u.tg && (big46(u.tg) || nearSet.has(u.tg)))).sort((a, b) => d2(a, e) - d2(b, e))[0];
    if (!c) break; setT(c, e); nearSet.add(e);
  }
  /* 큰 적 집중: 동료 수 절반(올림) */
  if (big.length) {
    const quota = Math.ceil(n / 2), onBig = () => free.filter(u => u.tg && big46(u.tg));
    let guard = 0;
    while (onBig().length < quota && guard++ < n) {
      const c = free.filter(u => !(u.tg && (big46(u.tg) || nearSet.has(u.tg))))
        .sort((a, b) => ((o.pref && o.pref(b)) - (o.pref && o.pref(a))) || ((o.avoid && o.avoid(a)) - (o.avoid && o.avoid(b))) || d2(a, big[0]) - d2(b, big[0]))[0];
      if (!c) break;
      const t = big.slice().sort((a, b) => on(a) - on(b) || bigRank46(b) - bigRank46(a) || d2(a, c) - d2(b, c))[0];
      setT(c, t);
    }
    const ob = onBig(); if (ob.length > quota) ob.sort((a, b) => ((o.pref && o.pref(b)) - (o.pref && o.pref(a)))).slice(quota).forEach(u => setT(u, null));
  } else free.forEach(u => { if (u.tg && big46(u.tg)) setT(u, null); });
  /* 나머지: 구역 분할 분산 */
  for (const u of free) {
    if (u.tg) continue;
    const th = u.sqi * Math.PI * 2 / n + G.time * 0.25, rm = (Gm.rIn + Gm.rOut) / 2, ax = G.p.x + Math.cos(th) * rm, ay = G.p.y + Math.sin(th) * rm;
    let best = null, bs = 1e18;
    for (const e of (small.length ? small : big)) { const s = (dist2(e.x, e.y, ax, ay) + 0.5 * d2(e, u)) * (1 + 4 * on(e)); if (s < bs) { bs = s; best = e; } }
    setT(u, best);
  }
}
/* 목표 위치: 표적 둘레 공격 자리(각도 분할) / 대기 고리 구역 */
function goals46(U, Gm, rOf) {
  const p = G.p, n = U.length, grp = new Map();
  for (const u of U) if (u.tg) { const a = grp.get(u.tg) || []; a.push(u); grp.set(u.tg, a); }
  for (const [e, a] of grp) {
    a.sort((x, y) => x.sqi - y.sqi);
    const m = a.length, a0 = Math.atan2(p.y - e.y, p.x - e.x), sp = m > 1 ? Math.min(Math.PI * 2 / m, 1.15) : 0;
    a.forEach((u, k) => { const ang = a0 + (k - (m - 1) / 2) * sp, D = e.r + rOf(u) + 2; u.gx = e.x + Math.cos(ang) * D; u.gy = e.y + Math.sin(ang) * D; u.ang = ang; });
  }
  U.forEach((u, i) => {
    if (u.tg) return;
    const th = i * Math.PI * 2 / n + G.time * 0.5, R = Gm.rIn + (Gm.rOut - Gm.rIn) * (0.5 + 0.5 * Math.sin(G.time * 0.8 + i * 1.7));
    u.gx = p.x + Math.cos(th) * R; u.gy = p.y + Math.sin(th) * R;
  });
}
/* 이동: 목표 위치로 이동 + 동료 간격 유지 */
function moveUnit46(u, sp, dt, list) {
  const dx = u.gx - u.x, dy = u.gy - u.y, d = Math.hypot(dx, dy) || 1;
  if (u.gx != null && d > 2) { const v = Math.min(d, sp * (u.ret ? 1.6 : 1) * dt); u.x += dx / d * v; u.y += dy / d * v; if (!u.tg) u.vx = dx; }
  for (const o of (list || sqPeers46(u))) { if (o === u) continue; const ox = u.x - o.x, oy = u.y - o.y, od = Math.hypot(ox, oy); if (od > 0 && od < SQ46.gap) { u.x += ox / od * (SQ46.gap - od) * 0.5; u.y += oy / od * (SQ46.gap - od) * 0.5; } }
}
const sqPeers46 = u => G.p && G.p.job === 'druid' ? (G.pets || []) : sumUnits46();
const sumUnits46 = () => G.minions.concat((G.f43 && G.p && G.p.job === 'summoner' && fusedWs().length) ? G.f43.wr : []);

/* ---------- 망령: 지휘 모듈 적용 ---------- */
updateMinions = function (dt) {
  const p = G.p, k = p.job2 === 'lord' ? 2 : 1, dmg = 8 * k * p.mod.dmg;
  const U = sumUnits46(); if (U.length) squad46(U, { dt, state: G.sq46m || (G.sq46m = { t: 0 }) });
  for (const m of G.minions) {
    m.life -= dt; m.hitT -= dt;
    moveUnit46(m, 170, dt, U);
    const e = m.tg;
    if (e && m.hitT <= 0 && Math.hypot(e.x - m.x, e.y - m.y) < e.r + m.r + 6) { m.hitT = 0.5; m.vx = e.x - m.x; damageEnemy(e, dmg, { src: 'minion' }); }
  }
  G.minions = G.minions.filter(m => m.life > 0);
};
/* 망령 무장(연성): 원래 이동 대신 지휘 위치로 이동 */
const _fuseTick46 = fuseTick;
fuseTick = function (dt) {
  const f = G.f43, keep = f && f.wr ? f.wr.map(m => [m.x, m.y]) : [];
  _fuseTick46(dt);
  if (!f || !f.wr || !f.wr.length || G.p.job !== 'summoner') return;
  const U = sumUnits46();
  f.wr.forEach((m, i) => { if (keep[i]) { m.x = keep[i][0]; m.y = keep[i][1]; } if (!m.r) m.r = 8; if (m.gx == null) { m.gx = m.x; m.gy = m.y; } moveUnit46(m, 210, dt, U); });
};

/* 망령 무기 발동: 복귀 중(활동 범위 밖) 망령은 발동 보류 → 발동은 항상 활동 범위 안 */
const _minionWeapons46 = minionWeapons;
minionWeapons = function (dt) { for (const m of G.minions) if (m.ret) m.wt = Math.max(m.wt == null ? 0 : m.wt, 0.1); return _minionWeapons46(dt); };

/* ---------- 드루이드 야수 동료: 지휘 모듈 적용 (원래 표적·이동 부분만 교체) ---------- */
updatePets = function (dt) {
  const p = G.p; if (p.job !== 'druid') return;
  updateBleeds(dt);
  squad46(G.pets, { dt, r: m => petStat(m.kind).r, pref: m => m.kind === 'bear', avoid: m => m.kind === 'wolf', mark: p.petMark });
  for (const m of G.pets) {
    const S = petStat(m.kind); m.t -= dt; m.sk -= dt;
    moveUnit46(m, S.sp, dt);
    const e = m.tg, d = e ? Math.hypot(e.x - m.x, e.y - m.y) : 1e9, reach = e ? e.r + S.r : 4;
    if (e) m.vx = e.x - m.x;
    if (e && m.t <= 0 && d <= reach + 6) {
      m.t = S.atk; m.bite = 0.15; e.lpk = m.kind;
      if (m.kind === 'wolf' && bondHas('wolf', 'bleed') && G.bleeds.length < 120 && !G.bleeds.some(b => b.e === e)) G.bleeds.push({ e, t: 3, tick: 0.5, d: S.dmg * 0.4 });
      damageEnemy(e, S.dmg, { src: 'pet', kb: m.kind === 'bear' ? 120 : 30, fx: m.x, fy: m.y });
    }
    if (m.lvT > 0) m.lvT -= dt;
    if (m.kind === 'bear' && bondHas('bear', 'thorn')) { m.th = (m.th || 0) - dt; if (m.th <= 0) { m.th = 1; gridQuery(m.x, m.y, S.r + 26, t => { t.lpk = 'bear'; damageEnemy(t, S.dmg * 0.5, { src: 'pet' }); }); } }
    if (m.bite > 0) m.bite -= dt;
    if (m.sk <= 0 && (e || m.kind === 'wolf')) {                       // 주기 자동 스킬
      m.sk = S.sk;
      if (m.kind === 'wolf') { let n = 0; gridQuery(m.x, m.y, S.skR, t => { n++; t.slowT = Math.max(t.slowT || 0, 2); t.lpk = 'wolf'; damageEnemy(t, S.dmg * (bondHas('wolf', 'howl2') ? 0.3 : 0.45), { src: 'howl' }); }); if (n && bondHas('wolf', 'alpha')) G.tm.alpha = 4; fx({ kind: 'ring', x: m.x, y: m.y, r0: 8, r1: S.skR, dur: 0.4, color: '#c8d4e0' }); if (!n) m.sk = 1; }
      else {
        const x = m.x, y = m.y, R = S.skR, dm = S.dmg; gridQuery(x, y, R, t => { t.lpk = 'bear'; damageEnemy(t, dm * 2.5, { src: 'maul', kb: 260, fx: x, fy: y }); }); fx({ kind: 'ring', x, y, r0: 10, r1: R, dur: 0.35, color: '#c89060', fill: true });
        if (p.job2 === 'ursa') heal(1, '수호 곰'); if (bondHas('bear', 'guard')) heal(2, '보호 본능');
        if (bondHas('bear', 'after')) (G.petLater = G.petLater || []).push({ t: G.time + 0.5, x, y, R, d: dm * 1.5 });
      }
    }
  }
  if (G.petLater && G.petLater.length) G.petLater = G.petLater.filter(u => { if (G.time < u.t) return true; gridQuery(u.x, u.y, u.R, t => { t.lpk = 'bear'; damageEnemy(t, u.d, { src: 'maul', kb: 140, fx: u.x, fy: u.y }); }); fx({ kind: 'ring', x: u.x, y: u.y, r0: 10, r1: u.R, dur: 0.3, color: '#e0b080' }); return false; });
  if (p.petMark && p.petMark.dead) p.petMark = null;
};

/* ---------- 점검용 집계: 활동 범위 이탈·겹침 ---------- */
function sqStat46() {
  const p = G.p; if (!p) return;
  const U = p.job === 'druid' ? (G.pets || []) : p.job === 'summoner' ? sumUnits46() : null; if (!U || !U.length) return;
  const S = G.stats.sq46 = G.stats.sq46 || { n: 0, out: 0, ov: 0, ring: 0, idle: 0 }, Gm = sqGeom46(U.length);
  for (const u of U) { S.n++; const d = Math.hypot(u.x - p.x, u.y - p.y); if (d > Gm.act + 40) S.out++; if (!u.tg) { S.idle++; if (d >= Gm.rIn - 20 && d <= Gm.rOut + 20) S.ring++; } for (const o of U) if (o !== u && Math.hypot(o.x - u.x, o.y - u.y) < 12) { S.ov++; break; } }
}
const _updateJob46 = updateJob;
updateJob = function (dt) { _updateJob46(dt); if ((G.sqT46 = (G.sqT46 || 0) + dt) >= 0.5) { G.sqT46 = 0; sqStat46(); } };
