/* ============================================================
   보스 패턴 확충 (0.33) — 수문장 4인·마왕 각 신규 3종 + 순번표 규칙
   순번표: 보스별 사용 가능 패턴을 섞어 차례대로 사용, 표 소진 시 다시 섞음, 직전 패턴 연속 금지
           격노·페이즈 전환으로 목록이 바뀌면 표 재작성 (새 패턴 즉시 편입)
   바르간: 대지 균열(3갈래 직선 폭발) · 바위 투척(낙하 후 장애물 잔존) · 격노 전용 투기장(바위 벽 + 연속 돌진, 벽 충돌 시 기절)
   이그나: 화염 회오리(느린 추적 2개) · 불기둥 격자(바둑판 2회 교차 폭발) · 격노 전용 태양(제자리 나선 탄막 + 확장 장판)
   모르덴: 망자 행렬(한 방향 대열 돌진) · 저주 표식(발밑 추적 후 고정·폭발) · 격노 전용 무덤(부수기 전까지 계속 소환)
   세렌:   거울진(분신이 주위를 돌며 광선 연결) · 반사막(받은 피해 일부를 탄환으로 반사) · 격노 전용 위치 교환
   마왕:   그림자 손(1페이즈, 발밑 연속 솟음) · 탄막 파도(2페이즈, 틈 있는 고리 3연속) · 화면 분할 낙하(3페이즈, 안전 구역 1칸 2회)
   모든 신규 패턴은 예고 표시 후 발동, 자동 플레이 회피 대상(dev.js autoDanger)에 포함
   ============================================================ */
const BP_CFG = {
  // 바르간
  crN: 3, crSpread: 0.5, crLen: 430, crW: 34, crWarn: [0.95, 0.75], crDmg: 22,
  rkN: [3, 4], rkR: 40, rkWarn: 1.0, rkDmg: 18, rkObR: 24, rkLife: 7,
  arN: 24, arR: 190, arLife: 9.5, arCd: 24, arDash: 3, stunWall: 2.2, stunRock: 1.2,
  // 이그나
  twN: [2, 3], twSp: 78, twTurn: 1.0, twLife: 7, twR: 15, twDmg: 15,
  grN: 5, grCell: 74, grR: 38, grWarn: [1.2, 1.0], grGap: 1.35, grDmg: 17,
  sunT: 4.2, sunEvery: 0.11, sunSp: 140, sunDmg: 10, sunR0: 45, sunGrow: 26, sunMax: 150, sunCd: 22,
  // 모르덴
  maN: 7, maGap: 27, maDist: 300, maWarn: 1.0, maSp: 250, maR: 12, maDmg: 16,
  mkR: 72, mkLock: 2.0, mkWarn: 3.0, mkDmg: 24,
  gvN: 3, gvHp: 0.022, gvR: 16, gvEvery: 2.8, gvRaise: 2, gvCd: 26,
  // 세렌
  seEvery2: [4.6, 3.6], miT: 5.0, miWarn: 1.0, miR0: 215, miR1: 150, miRot: 0.7, miW: 10, miDmg: 9,
  rfT: 3.0, rfUnit: 0.006, rfMax: 4, swWarn: 0.6, swRing: 8,
  // 마왕
  hdN: 5, hdGap: 0.36, hdR: 46, hdWarn: 0.65, hdDmg: 15,
  wvN: 3, wvGap: 0.9, wvCount: 30, wvHole: 6, wvSp: 125, wvDmg: 9,
  spR: 470, spWarn: [1.3, 1.1], spGap: 1.7, spDmg: 20,
};

/* 순번표 — list: 현재 사용 가능 패턴 id 목록 */
function bpNext(ai, list) {
  const key = list.join();
  if (ai.bagKey !== key || !ai.bag || !ai.bag.length) {
    ai.bagKey = key; ai.bag = list.slice();
    for (let i = ai.bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ai.bag[i], ai.bag[j]] = [ai.bag[j], ai.bag[i]]; }
    if (ai.bag.length > 1 && ai.bag[0] === ai.last) ai.bag.push(ai.bag.shift());
  }
  const k = ai.bag.shift(); ai.last = k; (G.stats.bpat || (G.stats.bpat = {}))[k] = (G.stats.bpat[k] || 0) + 1;   // 시험 기록용 패턴 사용 횟수
  return k;
}
const bpAlive = e => !e.dead && !G.result;

/* ---------- 바르간 ---------- */
function bpCrack(e) {
  const p = G.p, base = Math.atan2(p.y - e.y, p.x - e.x), w = gkLv(BP_CFG.crWarn);
  for (let i = 0; i < BP_CFG.crN; i++) {
    const a = base + (i - (BP_CFG.crN - 1) / 2) * BP_CFG.crSpread;
    G.hz.push({ k: 'line', x: e.x, y: e.y, dx: Math.cos(a), dy: Math.sin(a), len: BP_CFG.crLen, w: BP_CFG.crW, warn: w, t: 0, dmg: gkDmg(BP_CFG.crDmg), src: '바르간 대지 균열', hit: true });
  }
  toast('대지 균열', '#e0a070');
}
function bpRocks(e) {
  const p = G.p, n = gkLv(BP_CFG.rkN);
  for (let i = 0; i < n; i++) { const a = rand(6.28), R = i ? rand(60, 150) : 0; gkCircle(p.x + Math.cos(a) * R, p.y + Math.sin(a) * R, BP_CFG.rkR, BP_CFG.rkWarn + i * 0.15, gkDmg(BP_CFG.rkDmg), '바르간 바위 투척', { rock: true }); }
}
function bpArena(e, ai) {
  const p = G.p; ai.arenaCd = G.time + BP_CFG.arCd;
  for (let i = 0; i < BP_CFG.arN; i++) { const a = i * 6.283 / BP_CFG.arN; G.rocks.push({ x: p.x + Math.cos(a) * BP_CFG.arR, y: p.y + Math.sin(a) * BP_CFG.arR, r: BP_CFG.rkObR, t: BP_CFG.arLife, wall: true }); }
  const a = rand(6.28); fx({ kind: 'pop', x: e.x, y: e.y, r: e.r, color: e.color, dur: 0.3 }); e.x = p.x + Math.cos(a) * 115; e.y = p.y + Math.sin(a) * 115;
  fx({ kind: 'ring', x: p.x, y: p.y, r0: 40, r1: BP_CFG.arR, dur: 0.6, color: '#c8a070' }); toast('투기장 · 벽에 유도하면 기절', '#e0a070');
  ai.chain = BP_CFG.arDash; gkDashAim(e, ai, 0.9);
}
/* 돌진 중 바위 충돌 → 기절 (gkBargan dash에서 호출) */
function bpDashHit(e, ai) {
  if (!G.rocks.length) return false;
  for (const r of G.rocks) if (dist2(r.x, r.y, e.x, e.y) < (r.r + e.r) ** 2) {
    ai.act = null; ai.dash = 0; ai.again = false; ai.chain = 0; e.stunT = r.wall ? BP_CFG.stunWall : BP_CFG.stunRock;
    r.t = Math.min(r.t, 0.3); sfx('boss'); fx({ kind: 'ring', x: e.x, y: e.y, r0: 10, r1: 90, dur: 0.5, color: '#ffe08a' }); toast('바르간 기절', '#ffe08a');
    return true;
  }
  return false;
}

/* ---------- 이그나 ---------- */
function bpTwister(e) {
  const p = G.p, n = gkLv(BP_CFG.twN), base = Math.atan2(p.y - e.y, p.x - e.x);
  for (let i = 0; i < n; i++) { const a = base + (i - (n - 1) / 2) * 1.2; if (G.eb.length < 260) G.eb.push({ x: e.x, y: e.y, vx: Math.cos(a) * BP_CFG.twSp, vy: Math.sin(a) * BP_CFG.twSp, r: BP_CFG.twR, dmg: gkDmg(BP_CFG.twDmg), src: '이그나 화염 회오리', life: BP_CFG.twLife, col: '#ff8a30', home: BP_CFG.twTurn, tw: true }); }
  toast('화염 회오리', '#ffa050');
}
function bpGrid(e) {
  const p = G.p, cx = p.x, cy = p.y, N = BP_CFG.grN, S = BP_CFG.grCell, par = Math.random() < 0.5 ? 0 : 1, w = gkLv(BP_CFG.grWarn);
  const wave = (pp, warn) => { for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if ((i + j) % 2 === pp) gkCircle(cx + (i - (N - 1) / 2) * S, cy + (j - (N - 1) / 2) * S, BP_CFG.grR, warn, gkDmg(BP_CFG.grDmg), '이그나 불기둥'); };
  wave(par, w); G.later.push({ t: BP_CFG.grGap, f: () => { if (bpAlive(e)) wave(1 - par, w * 0.85); } });
  toast('불기둥 격자', '#ffa050');
}
function bpSun(e, ai) {
  ai.sun = BP_CFG.sunT; ai.sunCd = G.time + BP_CFG.sunCd; ai.spin = rand(6.28); ai.sunE = 0;
  gkCircle(e.x, e.y, BP_CFG.sunR0, 0.8, gkDmg(GK_CFG.igPoolDmg), '이그나 태양', { pool: BP_CFG.sunT + 0.6, follow: e, grow: BP_CFG.sunGrow, rMax: BP_CFG.sunMax });
  fx({ kind: 'ring', x: e.x, y: e.y, r0: 10, r1: 160, dur: 0.7, color: '#ffd070' }); toast('작열하는 태양', '#ffd070');
}
function bpSunTick(e, ai, dt) {
  ai.sun -= dt; ai.sunE -= dt;
  if (ai.sunE <= 0) { ai.sunE = BP_CFG.sunEvery; ai.spin += 0.37; for (let k = 0; k < 2; k++) { const a = ai.spin + k * Math.PI; gkShot(e.x, e.y, Math.cos(a) * BP_CFG.sunSp, Math.sin(a) * BP_CFG.sunSp, gkDmg(BP_CFG.sunDmg), '이그나 태양 화염탄'); } }
  return ai.sun > 0;
}

/* ---------- 모르덴 ---------- */
function bpMarch(e) {
  const p = G.p, a = rand(6.28), ux = Math.cos(a), uy = Math.sin(a), ox = p.x - ux * BP_CFG.maDist, oy = p.y - uy * BP_CFG.maDist, W = BP_CFG.maN * BP_CFG.maGap;
  G.hz.push({ k: 'line', x: ox, y: oy, dx: ux, dy: uy, len: BP_CFG.maDist * 2, w: W, warn: BP_CFG.maWarn, t: 0, dmg: 0 });
  G.later.push({ t: BP_CFG.maWarn, f: () => { if (!bpAlive(e)) return; for (let i = 0; i < BP_CFG.maN; i++) { const s = (i - (BP_CFG.maN - 1) / 2) * BP_CFG.maGap; if (G.eb.length < 260) G.eb.push({ x: ox - uy * s, y: oy + ux * s, vx: ux * BP_CFG.maSp, vy: uy * BP_CFG.maSp, r: BP_CFG.maR, dmg: gkDmg(BP_CFG.maDmg), src: '모르덴 망자 행렬', life: BP_CFG.maDist * 2.4 / BP_CFG.maSp, col: '#e8e4d0' }); } } });
  toast('망자 행렬', '#a8c8a8');
}
function bpMark() {
  gkCircle(G.p.x, G.p.y, BP_CFG.mkR, BP_CFG.mkWarn, gkDmg(BP_CFG.mkDmg), '모르덴 저주 표식', { follow: G.p, lock: BP_CFG.mkLock, mark: true });
  toast('저주 표식 · 벗어나기', '#c8a0ff');
}
function bpGraves(e, ai) {
  ai.graveCd = G.time + BP_CFG.gvCd; ai.graves = [];
  for (let i = 0; i < BP_CFG.gvN; i++) {
    const a = rand(6.28), R = rand(70, 120), g = makeEnemy('brute', e.x + Math.cos(a) * R, e.y + Math.sin(a) * R); if (!g) continue;
    Object.assign(g, { r: BP_CFG.gvR, speed: 0, color: '#8a8478', shape: 'grave', xp: 4, dmg: 0, cmd: true, fixed: true, grave: true, sumT: 1.2 + i * 0.4 });
    g.hp = g.maxHp = e.maxHp * BP_CFG.gvHp; ai.graves.push(g);
    fx({ kind: 'ring', x: g.x, y: g.y, r0: 6, r1: 40, dur: 0.4, color: '#a8c8a8' });
  }
  toast('망자의 무덤 · 부수기', '#a8c8a8');
}
function bpGraveTick(ai, dt) {
  if (!ai.graves) return;
  for (const g of ai.graves) {
    if (g.dead) continue; g.sumT -= dt;
    if (g.sumT <= 0 && aliveCount() < CFG.spawn.max) { g.sumT = BP_CFG.gvEvery; for (let i = 0; i < BP_CFG.gvRaise; i++) { const m = makeEnemy('skel', g.x + rand(-24, 24), g.y + rand(-24, 24)); if (m) m.color = '#a8b8a0'; } fx({ kind: 'ring', x: g.x, y: g.y, r0: 4, r1: 30, dur: 0.35, color: '#a8c8a8' }); }
  }
  ai.graves = ai.graves.filter(g => !g.dead);
}

/* ---------- 세렌 ---------- */
function bpSerenImgs(e) { return [e].concat(G.enemies.filter(o => o.clone && !o.dead && o.real === e)); }
function bpMirror(e, ai) {
  if (bpSerenImgs(e).length < 4) gkSplit(e);
  ai.orb = { t: BP_CFG.miT + BP_CFG.miWarn, a: rand(6.28), dir: Math.random() < 0.5 ? 1 : -1, cx: G.p.x, cy: G.p.y };   // 중심은 시전 위치 고정
  ai.orbHz = { k: 'mir', t: 0, warn: BP_CFG.miWarn, dur: BP_CFG.miT, pts: [], links: [], w: BP_CFG.miW, dmg: gkDmg(BP_CFG.miDmg), src: '세렌 거울진', tick: 0 };
  G.hz.push(ai.orbHz); toast('거울진', '#cfe0ff');
}
function bpMirrorTick(e, ai, dt) {
  const O = ai.orb; O.t -= dt; if (O.t <= 0 || !G.hz.includes(ai.orbHz)) { ai.orb = null; return false; }
  const imgs = bpSerenImgs(e), n = imgs.length, k = 1 - O.t / (BP_CFG.miT + BP_CFG.miWarn), R = BP_CFG.miR0 + (BP_CFG.miR1 - BP_CFG.miR0) * k;
  O.a += BP_CFG.miRot * O.dir * dt;
  imgs.forEach((o, i) => { const a = O.a + i * 6.283 / n; o.x = O.cx + Math.cos(a) * R; o.y = O.cy + Math.sin(a) * R; });
  const H = ai.orbHz; H.pts = imgs.map(o => [o.x, o.y]); H.links = [];
  const step = n >= 4 ? 2 : 1; for (let i = 0; i < n; i++) { const j = (i + step) % n; if (step === 2 && n % 2 === 0 && i >= n / 2 && j < i) continue; H.links.push([i, j]); }
  return true;
}
function bpReflect(e, ai) { ai.refl = BP_CFG.rfT; ai.rh = e.hp; ai.racc = 0; toast('반사막 · 공격 자제', '#cfe0ff'); fx({ kind: 'ring', x: e.x, y: e.y, r0: e.r, r1: e.r + 30, dur: 0.4, color: '#ffffff' }); }
function bpReflectTick(e, ai, dt) {
  ai.refl -= dt; const drop = Math.max(0, ai.rh - e.hp); ai.rh = e.hp; ai.racc += drop;
  const unit = e.maxHp * BP_CFG.rfUnit; let n = 0;
  while (ai.racc >= unit && n < BP_CFG.rfMax) { ai.racc -= unit; n++; const p = G.p, a = Math.atan2(p.y - e.y, p.x - e.x) + rand(-0.25, 0.25); gkShot(e.x, e.y, Math.cos(a) * 190, Math.sin(a) * 190, gkDmg(GK_CFG.seDmg), '세렌 반사', '#ffffff'); }
  if (ai.refl <= 0) ai.refl = 0;
}
function bpSwap(e, ai) {
  if (bpSerenImgs(e).length < 2) gkSplit(e);
  ai.swapT = BP_CFG.swWarn; toast('위치 교환', '#cfe0ff');
}
function bpSwapTick(e, ai, dt) {
  ai.swapT -= dt; if (ai.swapT > 0) return;
  ai.swapT = 0; const cs = bpSerenImgs(e).slice(1); if (!cs.length) return;
  const c = pick(cs), x = e.x, y = e.y; e.x = c.x; e.y = c.y; c.x = x; c.y = y;
  for (const o of [e].concat(cs)) { gkRing(o.x, o.y, BP_CFG.swRing, 130, gkDmg(GK_CFG.seDmg) * 0.8, '세렌 빛살', rand(6.28), '#cfe0ff'); fx({ kind: 'ring', x: o.x, y: o.y, r0: 6, r1: 50, dur: 0.35, color: '#ffffff' }); }
}

/* ---------- 마왕 ---------- */
function bpHands(e) {
  for (let i = 0; i < BP_CFG.hdN; i++) G.later.push({ t: i * BP_CFG.hdGap, f: () => {
    if (!bpAlive(e)) return; const p = G.p, v = p.moving ? CFG.player.speed * p.mod.speed * 0.25 : 0;
    gkCircle(p.x + p.face.x * v, p.y + p.face.y * v, BP_CFG.hdR, BP_CFG.hdWarn, gkDmg(BP_CFG.hdDmg), '마왕 그림자 손', { hand: true });
  } });
  toast('그림자 손', '#c9a8ff');
}
function bpWave(e) {
  const A = G.arena, cx = A ? A.x : e.x, cy = A ? A.y : e.y, N = BP_CFG.wvCount;
  let gap = Math.atan2(G.p.y - cy, G.p.x - cx) + rand(-0.8, 0.8);
  for (let w = 0; w < BP_CFG.wvN; w++) {
    const g = gap + (w ? rand(-0.9, 0.9) : 0);
    G.later.push({ t: w * BP_CFG.wvGap, f: () => {
      if (!bpAlive(e)) return; const hole = BP_CFG.wvHole;
      for (let i = 0; i < N; i++) { const a = g + i * 6.283 / N; if (i < hole / 2 || i > N - 1 - hole / 2) continue; gkShot(cx, cy, Math.cos(a) * BP_CFG.wvSp, Math.sin(a) * BP_CFG.wvSp, gkDmg(BP_CFG.wvDmg), '마왕 탄막 파도', '#c9a8ff'); }
      fx({ kind: 'ring', x: cx, y: cy, r0: 10, r1: 60, dur: 0.3, color: '#c9a8ff' });
    } });
    gap = g;
  }
  toast('탄막 파도 · 틈으로', '#c9a8ff');
}
function bpSplit(e) {
  const p = G.p, x = p.x, y = p.y, a0 = rand(6.28), safe = Math.floor(rand(4));
  const wave = (sf, warn) => { for (let i = 0; i < 4; i++) if (i !== sf) G.hz.push({ k: 'sect', x, y, a: a0 + i * Math.PI / 2 + Math.PI / 4, arc: Math.PI / 2 + 0.02, r: BP_CFG.spR, warn, t: 0, dmg: gkDmg(BP_CFG.spDmg), src: '마왕 분할 낙하', noCore: true }); };
  wave(safe, BP_CFG.spWarn[0]);
  G.later.push({ t: BP_CFG.spGap, f: () => { if (bpAlive(e)) wave((safe + (Math.random() < 0.5 ? 1 : 3)) % 4, BP_CFG.spWarn[1]); } });
  toast('분할 낙하 · 안전 구역 1칸', '#c9a8ff');
}

/* ---------- 공용 갱신·그리기 ---------- */
/* 바위 장애물: 수명 감소·플레이어 밀어내기 (updateBossFx에서 호출) */
function bpRocksTick(dt) {
  if (!G.rocks || !G.rocks.length) return;
  const p = G.p;
  for (const r of G.rocks) {
    r.t -= dt; const dx = p.x - r.x, dy = p.y - r.y, d = Math.hypot(dx, dy) || 1, m = r.r + p.r;
    if (d < m) { p.x = r.x + dx / d * m; p.y = r.y + dy / d * m; }
  }
  if (G.rocks.some(r => r.t <= 0)) { for (const r of G.rocks) if (r.t <= 0) fx({ kind: 'pop', x: r.x, y: r.y, r: r.r * 0.7, color: '#8a7a68', dur: 0.25 }); G.rocks = G.rocks.filter(r => r.t > 0); }
}
/* 거울진 광선 피해 */
function bpSegDist(px, py, x1, y1, x2, y2) { const vx = x2 - x1, vy = y2 - y1, L = vx * vx + vy * vy || 1, t = Math.max(0, Math.min(1, ((px - x1) * vx + (py - y1) * vy) / L)); return Math.hypot(px - x1 - vx * t, py - y1 - vy * t); }
function bpOnMirror(h, x, y, pad) { for (const [i, j] of h.links) { const a = h.pts[i], b = h.pts[j]; if (a && b && bpSegDist(x, y, a[0], a[1], b[0], b[1]) < h.w / 2 + pad) return true; } return false; }
function bpMirFx(h, dt) {
  const p = G.p; if (h.t <= h.warn) return; h.tick -= dt;
  if (h.tick <= 0 && !G.result && bpOnMirror(h, p.x, p.y, p.r * 0.5)) { h.tick = 0.3; hurtPlayer(h.dmg, h.src); }
}
function drawBpGround(c) {
  for (const h of G.hz) if (h.k === 'mir' && h.pts.length) {
    const on = h.t > h.warn, a = Math.min(1, h.t / h.warn);
    for (const [i, j] of h.links) {
      const A = h.pts[i], B = h.pts[j]; if (!A || !B) continue;
      c.strokeStyle = on ? 'rgba(200,225,255,0.45)' : `rgba(200,225,255,${0.15 + 0.2 * a})`; c.lineWidth = on ? h.w + 6 : 3;
      c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke();
      if (on) { c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = 3; c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke(); }
    }
  }
  if (G.rocks) for (const r of G.rocks) { const fade = r.t < 0.6 ? r.t / 0.6 : 1; c.globalAlpha = fade; drawSpriteC(c, 'rock', 0, r.x, r.y, { mul: 2 }); c.globalAlpha = 1; }
}
function drawBpTop(c, e) {
  const ai = e.ai || {};
  if (e.stunT > 0) for (let i = 0; i < 3; i++) { const a = G.time * 5 + i * 2.09; drawSprite(c, 'stunstar', 0, e.x + Math.cos(a) * (e.r + 4) - 4, e.y - e.r - 10 + Math.sin(a) * 4); }
  if (e.gk === 'seren' && !e.clone && ai.refl > 0) {
    c.strokeStyle = `rgba(255,255,255,${0.55 + 0.35 * Math.sin(G.time * 20)})`; c.lineWidth = 3; c.beginPath();
    for (let i = 0; i <= 6; i++) { const a = i * Math.PI / 3 + G.time; const x = e.x + Math.cos(a) * (e.r + 12), y = e.y + Math.sin(a) * (e.r + 12); i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
  }
  if (e.gk === 'seren' && !e.clone && ai.swapT > 0) for (const o of bpSerenImgs(e)) { c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 2; c.beginPath(); c.arc(o.x, o.y, o.r + 6 + ai.swapT * 20, 0, 7); c.stroke(); }
}
Object.assign(SPR, {
  rock: { px: 2, frames: [['...kkkkk....', '..kEEeeEkk..', '.kEeeeeEEEk.', 'kEeeEEEEEEEk', 'kEeEEEEEEnEk', 'kEEEEEEEnnEk', 'kEEEEnEEEEnk', 'kEEEEEEEEnNk', '.kEnEEEEnNk.', '..kkNNNNkk..', '....kkkk....']] },
  grave: { px: 2, frames: [['...kkkk...', '..kMMMMk..', '.kMMWWMMk.', '.kMWkkWMk.', '.kMMkkMMk.', '.kMWkkWMk.', '.kMMMMMMk.', '.kMMMMMmk.', 'kkmmmmmmkk', 'kGGgGGgGGk', '.kkkkkkkk.']] },
  stunstar: { px: 2, frames: [['..k..', '.kyk.', 'kyyyk', '.kyk.', '..k..']] },
});
