/* ============================================================
   사문의 수문장 4인 (0.11) — 3단계 결정 안건 2·3
   판 구조: 일반 페이즈 전부 돌파 → 예고 구간 → 수문장전(마지막 페이즈) → 처치 시 판 돌파·문 1개 개방
   등장: 미처치 수문장 중 1인 무작위 / 4문 개방 이후는 0.12 마왕성 반영 전까지 무작위 재대결
   기록: 처치 수문장 목록(저장 데이터 gates) 회귀 후에도 유지
   개인명 가칭: 바르간(돌진·강타) · 이그나(탄막·장판) · 모르덴(소환 물량) · 세렌(분신·본체 탐색)
   공통: 체력 50% 이하 격노(패턴 간격 단축·패턴 강화), 시간 정지·빙결 면역(둔화 0.3배), 넉백 면역
   ============================================================ */
const GATEKEEPERS = {
  bargan: { name: '바르간', gate: '돌진의 문', ds: '돌진·강타', color: '#c8503c', r: 30, hp: 1.1, speed: 64, shape: 'hex' },
  igna: { name: '이그나', gate: '불꽃의 문', ds: '탄막·장판', color: '#e8862a', r: 24, hp: 0.95, speed: 78, shape: 'tri' },
  morden: { name: '모르덴', gate: '망자의 문', ds: '소환 물량', color: '#5e7a62', r: 28, hp: 0.9, speed: 44, shape: 'sq' },
  seren: { name: '세렌', gate: '거울의 문', ds: '분신·본체 탐색', color: '#9ab8e8', r: 22, hp: 0.65, speed: 84, shape: 'blob' },
};
const GK_ORDER = ['bargan', 'igna', 'morden', 'seren'];
const GK_CFG = {
  hpMul: 140, dmgMul: 1.3, spawn: [230, 270], rage: 0.5, fail: 360,   // hpMul 80→140: 0.11 1차 10판 바르간 평균 36초·이그나 18~71초·세렌 74초
  bulletR: 6, bulletLife: 5,
  // 바르간
  bgEvery: [2.6, 1.9], bgTele: [0.75, 0.55], bgDashSp: 560, bgDashT: 0.6, bgSlamR: 120, bgSlamWarn: 0.9, bgSlamDmg: 26, bgAfterR: 62, bgAfterDmg: 20,
  // 이그나
  igEvery: [2.4, 1.7], igRing: [16, 22], igSp: [150, 175], igDmg: 12, igFan: 5, igPoolN: 3, igPoolR: 55, igPoolWarn: 1.0, igPoolDur: 4, igPoolDmg: 7,
  // 모르덴
  moEvery: [3.2, 2.4], moRaise: [10, 14], moPrison: 12, moPrisonR: 125, moBoltN: 3, moBoltSp: 130, moBoltDmg: 14,
  // 세렌
  seEvery: [9, 6.5], seClones: [3, 4], seCloneHp: 0.03, seShot: 1.6, seSp: 160, seDmg: 11, seBreak: 0.06, seBladeR: 80, seBladeDmg: 22, seShards: 8,
};
const isBossPhase = () => G.ph && (G.ph.id === 'gate' || G.ph.id === 'demon');
const gkLv = (a) => a[G.gkMob && G.gkMob.rage ? 1 : 0];
function gkDmg(v) { return v * (1 + CFG.scale.dmgPerMin * G.time / 60); }

/* 판 시작 시 수문장 결정 */
function gkPick() {
  if (STATE.dev.gk && GATEKEEPERS[STATE.dev.gk]) return STATE.dev.gk;
  const done = loadSave().gates || [], left = GK_ORDER.filter(k => !done.includes(k));
  return pick(left.length ? left : GK_ORDER);
}
function gkSpawn() {
  const D = GATEKEEPERS[G.gk], q = ringAt(GK_CFG.spawn[0], GK_CFG.spawn[1]), e = makeEnemy('brute', q.x, q.y);
  e.hp = e.maxHp = e.hp * GK_CFG.hpMul * D.hp; e.dmg *= GK_CFG.dmgMul; e.r = D.r; e.speed = D.speed; e.color = D.color; e.shape = D.shape; e.xp = 0;
  e.cmd = true; e.boss = true; e.gk = G.gk; e.ai = { cd: 2.2, act: null, at: 0 }; e.rage = false;
  G.gkMob = e; G.eb = []; G.hz = [];
  G.stats.gate = { id: G.gk, t0: G.time, rageAt: null };
  toast(`사문의 수문장 · ${D.name}`, D.color); toast(D.gate + ' · ' + D.ds, '#fff');
  fx({ kind: 'ring', x: e.x, y: e.y, r0: 10, r1: 120, dur: 0.8, color: D.color });
  if (G.gk === 'seren') e.ai.cd = 0.8;
}

/* 수문장 갱신 — game.js updateEnemies에서 개체별 호출 (이동·접촉·패턴) */
function gkUpdate(e, dt, d, dx, dy) {
  if (e.gk === 'demon') return dmUpdate(e, dt, d, dx, dy);   // 마왕 (0.12)
  const p = G.p;
  if (G.result) return;
  if (G.tm.stop > 0) dt *= 0.3;                                   // 시간술사 궁극기: 둔화만 적용
  if (e.frz > 0) e.frz = 0;
  if (e.clone) return gkClone(e, dt, d, dx, dy);
  const ai = e.ai, D = GATEKEEPERS[e.gk];
  if (!e.rage && e.hp <= e.maxHp * GK_CFG.rage) {
    e.rage = true; G.stats.gate.rageAt = Math.round(G.time - G.stats.gate.t0);
    toast(`${D.name} 격노`, '#ff7a5a'); fx({ kind: 'ring', x: e.x, y: e.y, r0: 10, r1: 160, dur: 0.7, color: '#ff7a5a' });
  }
  let mv = 0, mx = dx / d, my = dy / d;
  if (e.gk === 'bargan') mv = gkBargan(e, ai, dt, d, mx, my);
  else if (e.gk === 'igna') mv = gkKeep(e, d, 210, 170, 270) * gkIgna(e, ai, dt);
  else if (e.gk === 'morden') mv = gkKeep(e, d, 250, 200, 310) * gkMorden(e, ai, dt);
  else if (e.gk === 'seren') mv = gkKeep(e, d, 200, 150, 260) * gkSeren(e, ai, dt, d);
  if (!ai.dash) {
    let sx = mx, sy = my;
    if (e.strafe) { const s = e.strafe; sx = mx * s.k - my * s.dir * (1 - Math.abs(s.k)); sy = my * s.k + mx * s.dir * (1 - Math.abs(s.k)); const m = Math.hypot(sx, sy) || 1; sx /= m; sy /= m; }
    const sp = e.speed * (e.rage ? 1.2 : 1) * (e.slowT > 0 ? 0.75 : 1) * (G.tm.roar > 0 ? 0.6 : 1) * mv;
    e.x += sx * sp * dt; e.y += sy * sp * dt;
  }
  if (e.slowT > 0) e.slowT -= dt;
  if (d > Math.hypot(VIEW.w, VIEW.h) * 0.8 && !ai.dash) { const q = ringAt(VIEW.w * 0.55, VIEW.w * 0.65); e.x = q.x; e.y = q.y; }
  if (d < e.r + p.r - 3) hurtPlayer(e.dmg * (ai.dash ? 1.4 : 1), D.name);
}
/* 거리 유지형 이동 배율 (원거리 수문장) — 반환 1: 접근, -1: 후퇴, 측면 이동은 strafe */
function gkKeep(e, d, want, lo, hi) {
  if (!e.strafe || G.time > e.strafe.until) e.strafe = { dir: Math.random() < 0.5 ? 1 : -1, until: G.time + rand(1.5, 3), k: 0 };
  e.strafe.k = d > hi ? 1 : d < lo ? -1 : 0;
  return 1;
}

/* 바르간 — 추격·돌진·강타, 격노 시 연속 돌진·여진 */
function gkBargan(e, ai, dt, d, mx, my) {
  const p = G.p;
  if (ai.act === 'tele') {
    ai.at -= dt; if (ai.at <= 0) { ai.act = 'dash'; ai.dash = GK_CFG.bgDashT; }
    return 0;
  }
  if (ai.act === 'dash') {
    ai.dash -= dt; e.x += ai.dx * GK_CFG.bgDashSp * dt; e.y += ai.dy * GK_CFG.bgDashSp * dt;
    if (ai.dash <= 0) { ai.dash = 0; if (ai.again) { ai.again = false; gkDashAim(e, ai, 0.35); } else ai.act = null; }
    return 0;
  }
  if (ai.act === 'slam') { ai.at -= dt; if (ai.at <= 0) ai.act = null; return 0; }
  ai.cd -= dt;
  if (ai.cd <= 0) {
    ai.cd = gkLv(GK_CFG.bgEvery);
    if (Math.random() < (d > 160 ? 0.75 : 0.4)) { gkDashAim(e, ai, gkLv(GK_CFG.bgTele)); ai.again = e.rage; }
    else {
      ai.act = 'slam'; ai.at = GK_CFG.bgSlamWarn + 0.2;
      gkCircle(e.x, e.y, GK_CFG.bgSlamR, GK_CFG.bgSlamWarn, gkDmg(GK_CFG.bgSlamDmg), '바르간 강타', { follow: e });
      if (e.rage) for (let i = 0; i < 3; i++) G.later.push({ t: GK_CFG.bgSlamWarn + 0.1 + i * 0.5, f: () => { if (!e.dead && !G.result) gkCircle(G.p.x + rand(-20, 20), G.p.y + rand(-20, 20), GK_CFG.bgAfterR, 0.8, gkDmg(GK_CFG.bgAfterDmg), '바르간 여진'); } });
    }
  }
  return 1;
}
function gkDashAim(e, ai, tele) {
  const p = G.p, dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
  ai.act = 'tele'; ai.at = tele; ai.dx = dx / d; ai.dy = dy / d;
  G.hz.push({ k: 'line', x: e.x, y: e.y, dx: ai.dx, dy: ai.dy, len: GK_CFG.bgDashSp * GK_CFG.bgDashT, w: e.r * 2, warn: tele, t: 0, dmg: 0, follow: e });
}

/* 이그나 — 거리 유지, 원형 탄막·조준 부채꼴·화염 장판 */
function gkIgna(e, ai, dt) {
  ai.cd -= dt;
  if (ai.cd <= 0) {
    ai.cd = gkLv(GK_CFG.igEvery); ai.n = (ai.n || 0) + 1;
    const k = ai.n % 3, sp = gkLv(GK_CFG.igSp), dmg = gkDmg(GK_CFG.igDmg);
    if (k === 1) { const n = gkLv(GK_CFG.igRing); gkRing(e.x, e.y, n, sp, dmg, '이그나 화염탄', rand(6.28)); if (e.rage) G.later.push({ t: 0.4, f: () => { if (!e.dead) gkRing(e.x, e.y, n, sp, dmg, '이그나 화염탄', rand(6.28)); } }); }
    else if (k === 2) for (let v = 0; v < (e.rage ? 4 : 3); v++) G.later.push({ t: v * 0.28, f: () => { if (!e.dead && !G.result) gkFan(e, GK_CFG.igFan, 0.55, sp * 1.15, dmg, '이그나 화염탄'); } });
    else for (let i = 0; i < GK_CFG.igPoolN + (e.rage ? 2 : 0); i++) { const p = G.p, a = rand(6.28), R = i ? rand(40, 130) : 0; gkCircle(p.x + Math.cos(a) * R, p.y + Math.sin(a) * R, GK_CFG.igPoolR, GK_CFG.igPoolWarn, gkDmg(GK_CFG.igPoolDmg), '이그나 장판', { pool: GK_CFG.igPoolDur }); }
    return 0.3;
  }
  return 1;
}

/* 모르덴 — 원거리 유지, 망자 소환(외곽·포위)·뼈 화살, 격노 시 정예 소환 */
function gkMorden(e, ai, dt) {
  ai.cd -= dt;
  if (ai.cd <= 0) {
    ai.cd = gkLv(GK_CFG.moEvery); ai.n = (ai.n || 0) + 1;
    const k = ai.n % 3, p = G.p, min = G.time / 60;
    if (k === 1) { const n = gkLv(GK_CFG.moRaise); for (let i = 0; i < n && aliveCount() < CFG.spawn.max; i++) { const a = rand(6.28), R = rand(60, 110); const m = makeEnemy(i % 3 ? 'skel' : 'slime', e.x + Math.cos(a) * R, e.y + Math.sin(a) * R); m.color = '#a8b8a0'; } toast('망자 소환', '#a8c8a8'); fx({ kind: 'ring', x: e.x, y: e.y, r0: 20, r1: 120, dur: 0.5, color: '#a8c8a8' }); }
    else if (k === 2) {
      const a0 = rand(6.28); for (let i = 0; i < GK_CFG.moPrison && aliveCount() < CFG.spawn.max; i++) { const a = a0 + i * 6.283 / GK_CFG.moPrison; const m = makeEnemy('skel', p.x + Math.cos(a) * GK_CFG.moPrisonR, p.y + Math.sin(a) * GK_CFG.moPrisonR); m.color = '#a8b8a0'; }
      toast('뼈의 감옥', '#a8c8a8');
    } else {
      for (let v = 0; v < (e.rage ? 2 : 1); v++) G.later.push({ t: v * 0.5, f: () => { if (!e.dead && !G.result) gkFan(e, GK_CFG.moBoltN, 0.35, GK_CFG.moBoltSp, gkDmg(GK_CFG.moBoltDmg), '모르덴 뼈 화살', '#e8e4d0'); } });
      if (e.rage && ai.n % 2 === 0) { const el = spawnElite(); el.x = e.x + rand(-40, 40); el.y = e.y + rand(-40, 40); el.noChest = true; }
    }
    return 0.4;
  }
  return 1;
}

/* 세렌 — 분신 분열(본체 1·분신 3~4), 본체만 주기적 미광, 분신 파괴 시 파편 탄막, 본체 근접 시 칼날 */
function gkSeren(e, ai, dt, d) {
  ai.cd -= dt; ai.shot = (ai.shot || GK_CFG.seShot) - dt; ai.blade = (ai.blade || 0) - dt;
  if (ai.cd <= 0 || (ai.hp0 && ai.hp0 - e.hp > e.maxHp * GK_CFG.seBreak)) { ai.cd = gkLv(GK_CFG.seEvery); gkSplit(e); }
  if (ai.shot <= 0) {
    ai.shot = GK_CFG.seShot * (e.rage ? 0.75 : 1);
    const imgs = [e].concat(G.enemies.filter(o => o.clone && !o.dead));
    for (const o of imgs) gkFan(o, 1, 0, GK_CFG.seSp, gkDmg(GK_CFG.seDmg), '세렌 빛살', '#cfe0ff');
  }
  if (ai.blade <= 0 && d < GK_CFG.seBladeR + 20) { ai.blade = 2.2; gkCircle(e.x, e.y, GK_CFG.seBladeR, 0.6, gkDmg(GK_CFG.seBladeDmg), '세렌 칼날', { follow: e }); }
  return 1;
}
function gkSplit(e) {
  const p = G.p, n = gkLv(GK_CFG.seClones), a0 = rand(6.28), slot = Math.floor(rand(n + 1));
  for (const o of G.enemies) if (o.clone && !o.dead) { o.dead = true; fx({ kind: 'pop', x: o.x, y: o.y, r: o.r, color: o.color, dur: 0.25 }); }
  for (let i = 0; i <= n; i++) {
    const a = a0 + i * 6.283 / (n + 1), x = p.x + Math.cos(a) * 200, y = p.y + Math.sin(a) * 200;
    if (i === slot) { e.x = x; e.y = y; continue; }
    const c = makeEnemy('brute', x, y);
    Object.assign(c, { r: e.r, speed: e.speed, color: e.color, shape: e.shape, xp: 0, dmg: e.dmg, cmd: true, boss: true, gk: 'seren', clone: true, real: e });
    c.hp = c.maxHp = e.maxHp * GK_CFG.seCloneHp;
  }
  e.ai.hp0 = e.hp; e.ai.splitAt = G.time;
  fx({ kind: 'ring', x: p.x, y: p.y, r0: 40, r1: 220, dur: 0.6, color: '#cfe0ff' }); toast('거울 분열', '#cfe0ff');
}
function gkClone(e, dt, d, dx, dy) {
  const p = G.p;
  if (!e.real || e.real.dead) { e.dead = true; return; }
  gkKeep(e, d, 200, 150, 260);
  const s = e.strafe, mx = dx / d, my = dy / d;
  let sx = mx * s.k - my * s.dir * (1 - Math.abs(s.k)), sy = my * s.k + mx * s.dir * (1 - Math.abs(s.k)); const m = Math.hypot(sx, sy) || 1;
  e.x += sx / m * e.speed * (e.real.rage ? 1.2 : 1) * dt; e.y += sy / m * e.speed * (e.real.rage ? 1.2 : 1) * dt;
  if (d < e.r + p.r - 3) hurtPlayer(e.dmg, '세렌');
}
/* 분신 파괴 — 파편 탄막 (game.js killEnemy에서 호출) */
function gkKilled(e) {
  if (e.gk === 'demon') return dmKilled(e);
  if (e.clone) { gkRing(e.x, e.y, GK_CFG.seShards, 140, gkDmg(GK_CFG.seDmg) * 0.8, '거울 파편', rand(6.28), '#cfe0ff'); return; }
  const D = GATEKEEPERS[e.gk];
  G.stats.gate.killed = true; G.stats.gate.dur = Math.round(G.time - G.stats.gate.t0);
  for (const o of G.enemies) if (o.clone && !o.dead) o.dead = true;
  G.eb = []; G.hz = [];
  fx({ kind: 'ring', x: e.x, y: e.y, r0: 10, r1: 260, dur: 1.2, color: D.color });
}

/* 공용 패턴 요소: 예고 원(즉발·장판), 원형 탄막, 조준 탄 */
function gkCircle(x, y, r, warn, dmg, src, o = {}) { G.hz.push(Object.assign({ k: 'circ', x, y, r, warn, t: 0, dmg, src }, o)); }
function gkRing(x, y, n, sp, dmg, src, a0 = 0, col) { for (let i = 0; i < n; i++) { const a = a0 + i * 6.283 / n; gkShot(x, y, Math.cos(a) * sp, Math.sin(a) * sp, dmg, src, col); } }
function gkFan(e, n, spread, sp, dmg, src, col) {
  const p = G.p, base = Math.atan2(p.y - e.y, p.x - e.x);
  for (let i = 0; i < n; i++) { const a = base + (n > 1 ? (i / (n - 1) - 0.5) * spread * 2 : 0); gkShot(e.x, e.y, Math.cos(a) * sp, Math.sin(a) * sp, dmg, src, col); }
}
function gkShot(x, y, vx, vy, dmg, src, col) { if (G.eb.length < 260) G.eb.push({ x, y, vx, vy, r: GK_CFG.bulletR, dmg, src, life: GK_CFG.bulletLife, col: col || '#ffb050' }); }

/* 적 탄환·예고 구역 갱신 (step에서 매 틱 호출) */
function updateBossFx(dt) {
  if (!G.eb || (!G.eb.length && !G.hz.length && !G.arena)) return;
  const p = G.p;
  dmFx(dt);                                                        // 마왕 결계·광선·부채꼴·추적탄 (0.12)
  for (const b of G.eb) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (!G.result && dist2(b.x, b.y, p.x, p.y) < (b.r + p.r * 0.7) ** 2) { b.life = 0; hurtPlayer(b.dmg, b.src); }
  }
  G.eb = G.eb.filter(b => b.life > 0);
  for (const h of G.hz) {
    h.t += dt;
    if (h.k === 'sect' || h.k === 'beam') continue;                 // 마왕 패턴은 dmFx에서 처리
    if (h.follow && !h.fired) { h.x = h.follow.x; h.y = h.follow.y; }
    if (h.k === 'circ' && h.t >= h.warn && !h.fired) {
      h.fired = true; fx({ kind: 'ring', x: h.x, y: h.y, r0: h.r * 0.4, r1: h.r * 1.1, dur: 0.35, color: h.pool ? '#ff7a30' : '#ff5a4a' });
      if (!G.result && dist2(p.x, p.y, h.x, h.y) < (h.r + p.r * 0.5) ** 2) hurtPlayer(h.dmg * (h.pool ? 1.6 : 1), h.src);
    }
    if (h.pool && h.fired) { h.tick = (h.tick || 0) - dt; if (h.tick <= 0) { h.tick = 0.5; if (!G.result && dist2(p.x, p.y, h.x, h.y) < (h.r + p.r * 0.5) ** 2) hurtPlayer(h.dmg, h.src); } }
  }
  G.hz = G.hz.filter(h => h.k === 'sect' || h.k === 'beam' ? dmHzAlive(h) : h.k === 'line' ? h.t < h.warn + GK_CFG.bgDashT : h.t < h.warn + (h.pool || 0.35));
}

/* 그리기: 예고·장판(지면), 탄환·수문장 장식(적 위) */
function drawBossGround(c) {
  if (!G.hz) return;
  drawDemonGround(c);
  for (const h of G.hz) {
    if (h.k === 'sect' || h.k === 'beam') continue;
    const a = Math.min(1, h.t / h.warn);
    if (h.k === 'line') {
      if (h.t > h.warn) continue;
      c.save(); c.translate(h.x, h.y); c.rotate(Math.atan2(h.dy, h.dx));
      c.fillStyle = `rgba(255,70,50,${0.1 + 0.22 * a})`; c.fillRect(0, -h.w / 2, h.len, h.w);
      c.strokeStyle = 'rgba(255,110,80,0.8)'; c.lineWidth = 2; c.strokeRect(0, -h.w / 2, h.len, h.w); c.restore();
    } else if (!h.fired) {
      c.fillStyle = `rgba(255,60,40,${0.1 + 0.25 * a})`; c.beginPath(); c.arc(h.x, h.y, h.r * a, 0, 7); c.fill();
      c.strokeStyle = 'rgba(255,120,90,0.9)'; c.lineWidth = 2; c.beginPath(); c.arc(h.x, h.y, h.r, 0, 7); c.stroke();
    } else if (h.pool) {
      const k = 1 - (h.t - h.warn) / h.pool;
      c.fillStyle = `rgba(255,110,30,${0.35 * k + 0.1})`; c.beginPath(); c.arc(h.x, h.y, h.r, 0, 7); c.fill();
    }
  }
}
function drawBossTop(c, inView) {
  if (!G.eb) return;
  for (const e of G.enemies) {
    if (e.dead || !e.gk || !inView(e.x, e.y, e.r)) continue;
    c.fillStyle = '#ffd24a'; c.beginPath();                                       // 관 장식 (수문장 표식)
    for (let i = 0; i < 3; i++) { const x = e.x - 10 + i * 10; c.moveTo(x - 4, e.y - e.r + 2); c.lineTo(x, e.y - e.r - 9); c.lineTo(x + 4, e.y - e.r + 2); }
    c.fill();
    if (e.rage) { c.strokeStyle = 'rgba(255,90,60,0.7)'; c.lineWidth = 3; c.beginPath(); c.arc(e.x, e.y, e.r + 5, 0, 7); c.stroke(); }
    if (e.gk === 'seren' && !e.clone && (G.time % 1.3) < 0.2) { c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = 3; c.beginPath(); c.arc(e.x, e.y, e.r + 8, 0, 7); c.stroke(); }   // 본체 미광
  }
  for (const b of G.eb) { if (!inView(b.x, b.y, b.r)) continue; c.fillStyle = b.col; c.beginPath(); c.arc(b.x, b.y, b.r, 0, 7); c.fill(); c.strokeStyle = 'rgba(80,20,0,0.7)'; c.lineWidth = 1.5; c.stroke(); }
}
/* 상단 수문장 체력 막대 */
function drawBossBar(c, y, txt) {
  const e = G.gkMob; if (!e || e.dead || !G.ph || !isBossPhase()) return;
  const D = bossDef(e.gk), W = VIEW.cw, bw = W - 48;
  c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(24, y, bw, 8);
  c.fillStyle = e.rage || e.st === 2 ? '#ff6a4a' : D.color; c.fillRect(24, y, bw * Math.max(0, e.hp / e.maxHp), 8);
  if (e.gk === 'demon') { c.fillStyle = 'rgba(255,255,255,0.8)'; for (const k of DM_CFG.stages) c.fillRect(24 + bw * k - 1, y - 2, 2, 12); }   // 페이즈 전환 눈금
  c.font = 'bold 12px system-ui'; c.fillStyle = '#fff'; txt(e.gk === 'demon' ? `${D.name} · ${['그림자 군주', '암흑 결계', '종언'][e.st]} (${e.st + 1}/3)` : `${D.name} · ${D.gate}`, W / 2, y + 18, 'center');
}

/* 저장: 처치 수문장 누적 (finishRun에서 호출) */
function gkSave(s) {
  const g = G.stats.gate; s.gates = s.gates || [];
  if (g && g.killed && !s.gates.includes(g.id)) s.gates.push(g.id);
}
