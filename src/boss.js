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
function gkDmg(v) { return v * (1 + CFG.scale.dmgPerMin * G.time / 60) * (G.ph && G.ph.id === 'demon' && !loadSaveCached().trueEnd ? DM_CFG.preDmg : 1); }   // 0.16 진엔딩 전 마왕 패턴 피해 완화

/* 판 시작 시 수문장 결정 */
function gkPick() {
  if (STATE.dev.gk && GATEKEEPERS[STATE.dev.gk]) return STATE.dev.gk;
  const done = loadSave().gates || [], left = GK_ORDER.filter(k => !done.includes(k));
  return pick(left.length ? left : GK_ORDER);
}
function gkSpawn() {
  sfx('boss'); jBoss(GATEKEEPERS[G.gk].name, GATEKEEPERS[G.gk].gate + ' · 수문장 등장');
  const D = GATEKEEPERS[G.gk], q = ringAt(GK_CFG.spawn[0], GK_CFG.spawn[1]), e = makeEnemy('brute', q.x, q.y);
  e.hp = e.maxHp = e.hp * GK_CFG.hpMul * D.hp; e.dmg *= GK_CFG.dmgMul; e.r = D.r; e.speed = D.speed; e.color = D.color; e.shape = D.shape; e.xp = 0;
  e.cmd = true; e.boss = true; e.gk = G.gk; e.ai = { cd: 2.2, act: null, at: 0 }; e.rage = false;
  G.gkMob = e; G.eb = []; G.hz = []; G.rocks = [];
  G.stats.gate = { id: G.gk, t0: G.time, rageAt: null };
  toast(`사문의 수문장 · ${D.name}`, D.color); toast(D.gate + ' · ' + D.ds, '#fff');
  fx({ kind: 'ring', x: e.x, y: e.y, r0: 10, r1: 120, dur: 0.8, color: D.color });
  if (G.gk === 'seren') e.ai.cd = 0.8;
  storyBoss(G.gk);                                          // 첫 대면 대사 (0.13)
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
  if (e.stunT > 0) { e.stunT -= dt; if (d < e.r + p.r - 3) hurtPlayer(e.dmg * 0.5, D.name); return; }   // 0.33 바르간 기절 (공격 기회)
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
    const sp = e.speed * (e.rage ? 1.2 : 1) * (e.slowT > 0 ? 0.75 : 1) * (G.tm.roar > 0 ? 0.6 : 1) * mv * chronoSlow(e);
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
    if (bpDashHit(e, ai)) return 0;                                  // 0.33 바위 충돌 기절
    if (ai.dash <= 0) { ai.dash = 0; if (ai.chain > 1) { ai.chain--; gkDashAim(e, ai, 0.45); } else if (ai.again) { ai.again = false; ai.chain = 0; gkDashAim(e, ai, 0.35); } else { ai.chain = 0; ai.act = null; } }
    return 0;
  }
  if (ai.act === 'slam') { ai.at -= dt; if (ai.at <= 0) ai.act = null; return 0; }
  ai.cd -= dt;
  if (ai.cd <= 0) {
    ai.cd = gkLv(GK_CFG.bgEvery);
    const L = ['dash', 'slam', 'crack', 'rock'].concat(e.rage ? ['dash2'] : []).concat(e.rage && G.time > (ai.arenaCd || 0) ? ['arena'] : []);   // 0.33 순번표
    let k = bpNext(ai, L); if (k === 'slam' && d > 220) k = 'dash';
    if (k === 'crack') { bpCrack(e); ai.act = 'slam'; ai.at = gkLv(BP_CFG.crWarn) + 0.15; }
    else if (k === 'rock') bpRocks(e);
    else if (k === 'arena') bpArena(e, ai);
    else if (k === 'dash' || k === 'dash2') { gkDashAim(e, ai, gkLv(GK_CFG.bgTele)); ai.again = e.rage; }
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
  if (ai.sun > 0) return bpSunTick(e, ai, dt) ? 0 : 1;            // 0.33 격노 전용 태양: 제자리 고정
  ai.cd -= dt;
  if (ai.cd <= 0) {
    ai.cd = gkLv(GK_CFG.igEvery);
    const K = bpNext(ai, ['ring', 'fan', 'pool', 'twist', 'grid'].concat(e.rage && G.time > (ai.sunCd || 0) ? ['sun'] : [])), sp = gkLv(GK_CFG.igSp), dmg = gkDmg(GK_CFG.igDmg);   // 0.33 순번표
    const k = { ring: 1, fan: 2, pool: 0 }[K];
    if (K === 'twist') bpTwister(e); else if (K === 'grid') bpGrid(e); else if (K === 'sun') { bpSun(e, ai); return 0; }
    else if (k === 1) { const n = gkLv(GK_CFG.igRing); gkRing(e.x, e.y, n, sp, dmg, '이그나 화염탄', rand(6.28)); if (e.rage) G.later.push({ t: 0.4, f: () => { if (!e.dead) gkRing(e.x, e.y, n, sp, dmg, '이그나 화염탄', rand(6.28)); } }); }
    else if (k === 2) for (let v = 0; v < (e.rage ? 4 : 3); v++) G.later.push({ t: v * 0.28, f: () => { if (!e.dead && !G.result) gkFan(e, GK_CFG.igFan, 0.55, sp * 1.15, dmg, '이그나 화염탄'); } });
    else for (let i = 0; i < GK_CFG.igPoolN + (e.rage ? 2 : 0); i++) { const p = G.p, a = rand(6.28), R = i ? rand(40, 130) : 0; gkCircle(p.x + Math.cos(a) * R, p.y + Math.sin(a) * R, GK_CFG.igPoolR, GK_CFG.igPoolWarn, gkDmg(GK_CFG.igPoolDmg), '이그나 장판', { pool: GK_CFG.igPoolDur }); }
    return 0.3;
  }
  return 1;
}

/* 모르덴 — 원거리 유지, 망자 소환(외곽·포위)·뼈 화살, 격노 시 정예 소환 */
function gkMorden(e, ai, dt) {
  bpGraveTick(ai, dt);                                            // 0.33 무덤 소환
  ai.cd -= dt;
  if (ai.cd <= 0) {
    ai.cd = gkLv(GK_CFG.moEvery); ai.n = (ai.n || 0) + 1;
    const K = bpNext(ai, ['raise', 'prison', 'bolt', 'march', 'mark'].concat(e.rage && G.time > (ai.graveCd || 0) && !(ai.graves && ai.graves.length) ? ['grave'] : []));   // 0.33 순번표
    const k = { raise: 1, prison: 2, bolt: 0 }[K], p = G.p;
    if (K === 'march') bpMarch(e); else if (K === 'mark') bpMark(); else if (K === 'grave') bpGraves(e, ai);
    else if (k === 1) { const n = gkLv(GK_CFG.moRaise); for (let i = 0; i < n && aliveCount() < CFG.spawn.max; i++) { const a = rand(6.28), R = rand(60, 110); const m = makeEnemy(i % 3 ? 'skel' : 'slime', e.x + Math.cos(a) * R, e.y + Math.sin(a) * R); m.color = '#a8b8a0'; } toast('망자 소환', '#a8c8a8'); fx({ kind: 'ring', x: e.x, y: e.y, r0: 20, r1: 120, dur: 0.5, color: '#a8c8a8' }); }
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
  ai.cd -= dt; ai.shot = (ai.shot || GK_CFG.seShot) - dt; ai.blade = (ai.blade || 0) - dt; ai.cd2 = (ai.cd2 == null ? 3.5 : ai.cd2) - dt;
  if (ai.refl > 0) bpReflectTick(e, ai, dt);                       // 0.33 반사막
  if (ai.swapT > 0) bpSwapTick(e, ai, dt);                         // 0.33 위치 교환
  const orb = ai.orb && bpMirrorTick(e, ai, dt);                    // 0.33 거울진 (분열 정지)
  if (!orb && (ai.cd <= 0 || (ai.hp0 && ai.hp0 - e.hp > e.maxHp * GK_CFG.seBreak))) { ai.cd = gkLv(GK_CFG.seEvery); gkSplit(e); }
  if (!orb && ai.cd2 <= 0) { ai.cd2 = gkLv(BP_CFG.seEvery2); const K = bpNext(ai, ['mirror', 'reflect'].concat(e.rage ? ['swap'] : [])); if (K === 'mirror') bpMirror(e, ai); else if (K === 'reflect') bpReflect(e, ai); else bpSwap(e, ai); }   // 0.33 순번표
  if (orb) return 0;
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
  if (e.real.ai.orb) { if (d < e.r + p.r - 3) hurtPlayer(e.dmg, '세렌'); return; }   // 0.33 거울진 중 위치는 본체가 지정
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
  fragUnlock(e.gk);                                         // 기록 조각 (0.13)
  G.stats.gate.killed = true; G.stats.gate.dur = Math.round(G.time - G.stats.gate.t0);
  for (const o of G.enemies) if ((o.clone || o.grave) && !o.dead) o.dead = true;
  G.eb = []; G.hz = []; G.rocks = [];
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
  if (!G.eb || (!G.eb.length && !G.hz.length && !G.arena && !(G.rocks && G.rocks.length))) return;
  const p = G.p;
  dmFx(dt);                                                        // 마왕 결계·광선·부채꼴·추적탄 (0.12)
  for (const b of G.eb) {
    const bk = chronoBullet(b); b.x += b.vx * dt * bk; b.y += b.vy * dt * bk; b.life -= dt;   // 0.41 시간술사 탄환 감속
    if (!G.result && dist2(b.x, b.y, p.x, p.y) < (b.r + p.r * 0.55) ** 2) { b.life = 0; hurtPlayer(b.dmg, b.src); }
  }
  G.eb = G.eb.filter(b => b.life > 0);
  for (const h of G.hz) {
    h.t += dt;
    if (h.k === 'sect' || h.k === 'beam') continue;                 // 마왕 패턴은 dmFx에서 처리
    if (h.k === 'mir') { bpMirFx(h, dt); continue; }                // 0.33 거울진
    if (h.follow && !h.fired && !(h.lock && h.t > h.lock)) { h.x = h.follow.x; h.y = h.follow.y; }   // 0.33 lock: 추적 후 위치 고정
    if (h.k === 'line' && h.hit && h.t >= h.warn && !h.fired) {     // 0.33 대지 균열
      h.fired = true; for (let i = 1; i <= 5; i++) fx({ kind: 'ring', x: h.x + h.dx * h.len * i / 5, y: h.y + h.dy * h.len * i / 5, r0: 6, r1: h.w, dur: 0.35, color: '#e0a070' });
      const rx = p.x - h.x, ry = p.y - h.y, al = rx * h.dx + ry * h.dy; if (!G.result && al > -10 && al < h.len && Math.abs(rx * h.dy - ry * h.dx) < h.w / 2 + p.r * 0.5) hurtPlayer(h.dmg, h.src);
    }
    if (h.k === 'circ' && h.t >= h.warn && !h.fired) {
      h.fired = true; fx({ kind: 'ring', x: h.x, y: h.y, r0: h.r * 0.4, r1: h.r * 1.1, dur: 0.35, color: h.pool ? '#e0306a' : '#ff5a4a' });
      if (!G.result && dist2(p.x, p.y, h.x, h.y) < (h.r + p.r * 0.5) ** 2) hurtPlayer(h.dmg * (h.pool ? 1.6 : 1), h.src);
      if (h.rock) G.rocks.push({ x: h.x, y: h.y, r: BP_CFG.rkObR, t: BP_CFG.rkLife });   // 0.33 바위 장애물
    }
    if (h.grow && h.fired) { if (h.follow && !h.follow.dead) { h.x = h.follow.x; h.y = h.follow.y; } h.r = Math.min(h.rMax, h.r + h.grow * dt); }   // 0.33 확장 장판
    if (h.pool && h.fired) { h.tick = (h.tick || 0) - dt; if (h.tick <= 0) { h.tick = 0.5; if (!G.result && dist2(p.x, p.y, h.x, h.y) < (h.r + p.r * 0.5) ** 2) hurtPlayer(h.dmg, h.src); } }
  }
  bpRocksTick(dt);                                                 // 0.33 바위 장애물
  G.hz = G.hz.filter(h => h.k === 'sect' || h.k === 'beam' ? dmHzAlive(h) : h.k === 'mir' ? h.t < h.warn + h.dur : h.k === 'line' ? h.t < h.warn + GK_CFG.bgDashT : h.t < h.warn + (h.pool || 0.35));
}

/* 그리기: 예고·장판(지면), 탄환·수문장 장식(적 위) */
function drawBossGround(c) {
  if (!G.hz) return;
  drawDemonGround(c); drawBpGround(c);                             // 0.33 거울진·바위
  for (const h of G.hz) {
    if (h.k === 'sect' || h.k === 'beam' || h.k === 'mir') continue;
    const a = Math.min(1, h.t / h.warn);
    if (h.k === 'line') {
      if (h.t > h.warn) continue;
      c.save(); c.translate(h.x, h.y); c.rotate(Math.atan2(h.dy, h.dx));
      c.fillStyle = 'rgba(255,40,70,0.13)'; c.fillRect(0, -h.w / 2, h.len, h.w);
      c.fillStyle = `rgba(255,40,70,${0.18 + 0.22 * a})`; c.fillRect(0, -h.w / 2, h.len * a, h.w);       // 0.26a 진행 방향으로 차오르는 예고
      c.strokeStyle = `rgba(255,${90 + 120 * a},${110 + 100 * a},0.9)`; c.lineWidth = 2; c.strokeRect(0, -h.w / 2, h.len, h.w);
      c.restore(); drawChevrons(c, h, a);   // 0.30 돌진 방향 도트 화살표
    } else if (!h.fired) {
      c.fillStyle = 'rgba(255,40,70,0.12)'; c.beginPath(); c.arc(h.x, h.y, h.r, 0, 7); c.fill();
      c.fillStyle = `rgba(255,40,70,${0.16 + 0.2 * a})`; c.beginPath(); c.arc(h.x, h.y, h.r, 0, 6.2832); c.moveTo(h.x + h.r * (1 - a), h.y); c.arc(h.x, h.y, h.r * (1 - a), 6.2832, 0, true); c.fill();   // 0.26a 가장자리부터 차오름
      c.strokeStyle = `rgba(255,${90 + 140 * a},${110 + 120 * a},0.95)`; c.lineWidth = 2 + a; c.beginPath(); c.arc(h.x, h.y, h.r, 0, 7); c.stroke();
      c.save(); c.translate(h.x, h.y); c.rotate(G.time * 1.6); c.setLineDash([6, 8]); c.strokeStyle = 'rgba(255,120,140,0.55)'; c.lineWidth = 1.5;
      c.beginPath(); c.arc(0, 0, h.r * 0.78, 0, 7); c.stroke(); c.restore(); c.setLineDash([]);
      drawWarnMark(c, h.x, h.y, a);                                                  // 0.30 중심 위험 표식
    } else if (h.pool) {
      const k = 1 - (h.t - h.warn) / h.pool;
      const g = c.createRadialGradient(h.x, h.y, h.r * 0.1, h.x, h.y, h.r);
      g.addColorStop(0, `rgba(120,10,50,${0.45 * k + 0.1})`); g.addColorStop(0.75, `rgba(220,30,80,${0.35 * k + 0.08})`); g.addColorStop(1, `rgba(255,80,120,${0.5 * k})`);
      c.fillStyle = g; c.beginPath(); c.arc(h.x, h.y, h.r, 0, 7); c.fill();
      c.save(); c.translate(h.x, h.y); c.rotate(-G.time * 1.2); c.setLineDash([5, 6]); c.strokeStyle = `rgba(255,110,150,${0.8 * k})`; c.lineWidth = 2;
      c.beginPath(); c.arc(0, 0, h.r - 2, 0, 7); c.stroke(); c.restore(); c.setLineDash([]);
      drawLavaPool(c, h, k);                                                         // 0.30 장판 기포 도트
    }
  }
}
function drawBossTop(c, inView) {
  if (!G.eb) return;
  for (const e of G.enemies) {
    if (e.dead || !e.gk || !inView(e.x, e.y, e.r)) continue;
    drawSprite(c, 'crown', 0, e.x, e.y - e.r - 1 + (f2(2) ? -1 : 0));             // 0.30 도트 관 (수문장 표식), 격노는 도트 외곽선(rage)으로 표시
    drawBpTop(c, e);                                                              // 0.33 기절 별·반사막·교환 예고
    if (e.gk === 'seren' && !e.clone && (G.time % 1.3) < 0.2) { c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = 3; c.beginPath(); c.arc(e.x, e.y, e.r + 8, 0, 7); c.stroke(); }   // 본체 미광
  }
  drawEnemyShots(c, inView);
}
/* 상단 수문장 체력 막대 */
function pixelDrawBossBar(c, y, txt) {
  const e = G.gkMob; if (!e || e.dead || !G.ph || !isBossPhase()) return;
  const D = bossDef(e.gk), W = VIEW.cw, bw = W - 48;
  c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(24, y, bw, 8);
  c.fillStyle = e.rage || e.st === 2 ? '#ff6a4a' : D.color; c.fillRect(24, y, bw * Math.max(0, e.hp / e.maxHp), 8);
  if (e.gk === 'demon') { c.fillStyle = 'rgba(255,255,255,0.8)'; for (const k of DM_CFG.stages) c.fillRect(24 + bw * k - 1, y - 2, 2, 12); }   // 페이즈 전환 눈금
  c.font = 'bold 12px system-ui, Galmuri11, sans-serif'; c.fillStyle = '#fff'; txt(e.gk === 'demon' ? `${D.name} · ${['그림자 군주', '암흑 결계', '종언'][e.st]} (${e.st + 1}/3)` : `${D.name} · ${D.gate}`, W / 2, y + 18, 'center');
}

/* 저장: 처치 수문장 누적 (finishRun에서 호출) */
function gkSave(s) {
  const g = G.stats.gate; s.gates = s.gates || [];
  if (g && g.killed && !s.gates.includes(g.id)) s.gates.push(g.id);
}

/* 0.26a 적 탄환: 발광 구슬(흰 중심·소스 색 띠·적색 번짐) + 진행 방향 잔광, 빠른 탄은 창날형, 대형탄은 회전 고리
   모양은 색·크기별로 미리 그려 두고 찍는 방식 (매 프레임 그라데이션 생성 없음) */
const ESHOT_CACHE = {};
function eShotImg(col, r) {
  const key = col + '|' + r; if (ESHOT_CACHE[key]) return ESHOT_CACHE[key];
  const S = 3, R = r + 6, cv2 = document.createElement('canvas'); cv2.width = cv2.height = Math.ceil(R * 2 * S);
  const g = cv2.getContext('2d'); g.scale(S, S); const o = R;
  let gr = g.createRadialGradient(o, o, r * 0.6, o, o, R); gr.addColorStop(0, 'rgba(255,20,60,0.75)'); gr.addColorStop(0.5, 'rgba(255,20,60,0.3)'); gr.addColorStop(1, 'rgba(255,20,60,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(o, o, R, 0, 7); g.fill();                                     // 적색 번짐
  g.fillStyle = 'rgba(40,0,14,0.9)'; g.beginPath(); g.arc(o, o, r + 1.3, 0, 7); g.fill();               // 밝은 지형 대비용 얇은 어두운 테
  gr = g.createRadialGradient(o - r * 0.25, o - r * 0.25, 0, o, o, r);
  gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.35, col); gr.addColorStop(1, '#ff2a55');
  g.fillStyle = gr; g.beginPath(); g.arc(o, o, r, 0, 7); g.fill();
  return (ESHOT_CACHE[key] = { cv: cv2, R });
}
function drawEnemyShots(c, inView) {
  if (!G.eb.length) return;
  drawEnemyShotsDot(c, inView);                              // 0.29 출처별 도트 + 공통 위험 표시 (dot29.js)
}
function drawEnemyShotOrb(c, b, t) {                         // 도트 없는 출처용 발광 구슬 (0.26a)
  {
    const r = Math.round(b.r), I = eShotImg(b.col || '#ffb050', r), sp = Math.hypot(b.vx, b.vy) || 1, ux = b.vx / sp, uy = b.vy / sp;
    c.globalAlpha = 0.22; c.drawImage(I.cv, b.x - ux * r * 2.6 - I.R * 0.7, b.y - uy * r * 2.6 - I.R * 0.7, I.R * 1.4, I.R * 1.4);   // 잔광 2개
    c.globalAlpha = 0.4; c.drawImage(I.cv, b.x - ux * r * 1.4 - I.R * 0.85, b.y - uy * r * 1.4 - I.R * 0.85, I.R * 1.7, I.R * 1.7);
    c.globalAlpha = 1;
    if (sp > 260 && r <= 7) {                                                                          // 빠른 탄: 진행 방향 창날형
      c.save(); c.translate(b.x, b.y); c.rotate(Math.atan2(uy, ux)); c.scale(1.55, 0.8);
      c.drawImage(I.cv, -I.R, -I.R, I.R * 2, I.R * 2); c.restore();
    } else c.drawImage(I.cv, b.x - I.R, b.y - I.R, I.R * 2, I.R * 2);
    if (r > 7) {                                                                                       // 대형탄: 회전 고리
      c.strokeStyle = 'rgba(255,170,190,0.85)'; c.lineWidth = 1.6; const a0 = t * 5;
      c.beginPath(); c.arc(b.x, b.y, r + 4, a0, a0 + 1.4); c.stroke(); c.beginPath(); c.arc(b.x, b.y, r + 4, a0 + 3.14, a0 + 4.54); c.stroke();
    }
  }
}
