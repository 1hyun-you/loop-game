/* ============================================================
   판 상태 · 진행
   ============================================================ */
const STATE = { mode: 'title', fps: 60, dev: { god: false, fps: true, auto: false, speed: 1 } };
let G = null;

function xpNeed(l) { return Math.floor(CFG.xp.base + CFG.xp.linear * l + Math.pow(l, CFG.xp.pow) * CFG.xp.powMul); }

function newRun() {
  G = {
    time: 0, kills: 0, eid: 0, pid: 0, spawnAcc: 0, result: null, endT: 0, finished: false,
    p: { x: 0, y: 0, r: CFG.player.r, hp: CFG.player.hp, maxHp: CFG.player.hp, face: { x: 0, y: -1 }, invT: 0, flash: 0, moving: false,
      level: 1, xp: 0, need: xpNeed(1), weapons: [], passives: [], bonusDmg: 0, mod: null },
    enemies: [], gems: [], proj: [], fx: [], toasts: [],
    pendingLv: 0, rerolls: CFG.select.rerolls, banishes: CFG.select.banishes, banished: new Set(), sel: null,
    stats: { dmg: {}, hurt: {}, xpDrop: 0, xpGot: 0, selOpen: 0, dmgMin: [],  maxEnemies: 0, levelAt: [], picks: [], wFullAt: null, pFullAt: null }, lastHit: '',
  };
  recalc();
  addWeapon(START_WEAPON);
  phaseInit();
  STATE.mode = 'play';
  hideUI();
}
function addWeapon(id) { G.p.weapons.push({ id, lvl: 1, t: 0.3 }); }
function hasW(id) { return G.p.weapons.some(w => w.id === id); }
function hasP(id) { return G.p.passives.some(w => w.id === id); }
function passLv(id) { const ps = G.p.passives.find(x => x.id === id); return ps ? ps.lvl : 0; }

/* 보조 효과·추가 성장 반영 능력치 재계산 */
function recalc() {
  const p = G.p, prevMax = p.maxHp;
  p.mod = {
    dmg: (1 + PASSIVES.might.per * passLv('might')) * (1 + p.bonusDmg),
    speed: 1 + PASSIVES.swift.per * passLv('swift'),
    cd: Math.max(0.4, 1 - PASSIVES.haste.per * passLv('haste')),
  };
  p.maxHp = CFG.player.hp + PASSIVES.vit.per * passLv('vit');
  if (p.maxHp > prevMax) p.hp += p.maxHp - prevMax;     // 늘어난 최대 체력만큼 회복
  p.hp = Math.min(p.hp, p.maxHp);
}
function heal(v) { const p = G.p; p.hp = Math.min(p.maxHp, p.hp + v); }
function toast(text, color = '#fff') { G.toasts.push({ text, color, t: 0, dur: 2 }); if (G.toasts.length > 3) G.toasts.shift(); }
function fx(o) { if (G.fx.length < 220) G.fx.push(Object.assign({ t: 0 }, o)); }

/* 한 틱 진행 */
function step(dt) {
  G.time += dt;
  if (G.time >= (G.stats.dmgMin.length + 1) * 60) G.stats.dmgMin.push(Object.assign({}, G.stats.dmg));   // 분 단위 피해 누적 스냅숏
  updatePlayer(dt);
  if (!G.result) updatePhase(dt);
  if (!G.result) updateSpawn(dt);
  gridBuild(G.enemies);
  if (!G.result) updateWeapons(dt);
  updateProjectiles(dt);
  updateEnemies(dt);
  updateGems(dt);
  updateMisc(dt);
  if (G.result) { G.endT -= dt; if (G.endT <= 0 && !G.finished) { G.finished = true; finishRun(); } }
  else if (G.pendingLv > 0 && STATE.mode === 'play') openSelect();
}

/* 플레이어 */
function updatePlayer(dt) {
  const p = G.p;
  p.invT -= dt; p.flash -= dt;
  if (G.result) { p.moving = false; return; }
  const mv = moveVec(), sp = CFG.player.speed * p.mod.speed;
  p.moving = mv.m > 0.05;
  if (p.moving) {
    p.x += mv.x * sp * dt; p.y += mv.y * sp * dt;
    const m = Math.hypot(mv.x, mv.y); p.face.x = mv.x / m; p.face.y = mv.y / m;
  }
}

/* 적 생성 — 시야 바깥 고리 위치, 시간 경과에 따라 출현량 증가, 적 수 완만한 상한 */
function pickType() {
  const min = G.time / 60, items = [];
  const bias = phaseBias();                                  // 페이즈별 출현 비중 (0.3)
  for (const k of ENEMY_ORDER) { const d = ENEMIES[k]; if (bias && bias[k]) items.push({ k, w: bias[k] }); else if (d.from <= min) items.push({ k, w: d.w }); }
  return weightedPick(items).k;
}
function ringPos(extra = 40) {
  const a = rand(Math.PI * 2), R = Math.hypot(VIEW.w, VIEW.h) / 2 + extra;
  return { x: G.p.x + Math.cos(a) * R, y: G.p.y + Math.sin(a) * R };
}
function makeEnemy(type, x, y) {
  const d = ENEMIES[type], min = G.time / 60;
  const e = {
    id: ++G.eid, type, x, y, r: d.r, hp: d.hp * (1 + CFG.scale.hpPerMin * min), dmg: d.dmg * (1 + CFG.scale.dmgPerMin * min),
    speed: d.speed * rand(0.9, 1.1) * (1 + CFG.scale.speedPerMin * Math.min(min, 10)),
    color: d.color, shape: d.shape, xp: d.xp, flash: 0, kbx: 0, kby: 0, dead: false, ht: {},
  };
  e.maxHp = e.hp; G.enemies.push(e); return e;
}
function aliveCount() { let n = 0; for (const e of G.enemies) if (!e.dead) n++; return n; }
function updateSpawn(dt) {
  const S = CFG.spawn, min = G.time / 60;
  let rate = (S.base + S.perMin * min) * phaseSpawnMul();
  let alive = aliveCount();
  if (alive > S.soft) rate *= Math.max(S.softMin, 1 - (alive - S.soft) / S.softSpan);
  G.spawnAcc += rate * dt;
  const cap = Math.min(S.max, S.rampBase + G.time * S.ramp);
  while (G.spawnAcc >= 1) {
    G.spawnAcc -= 1;
    if (alive >= cap) break;
    const q = ringPos(); makeEnemy(pickType(), q.x, q.y); alive++;
  }
  if (alive > G.stats.maxEnemies) G.stats.maxEnemies = alive;
}

/* 적 이동·접촉 */
function updateEnemies(dt) {
  const p = G.p, farR = Math.hypot(VIEW.w, VIEW.h) * 0.85;
  for (const e of G.enemies) {
    if (e.dead) continue;
    e.flash -= dt;
    if (e.kbx || e.kby) { e.x += e.kbx * dt; e.y += e.kby * dt; const k = Math.max(0, 1 - dt * 9); e.kbx *= k; e.kby *= k; if (Math.abs(e.kbx) + Math.abs(e.kby) < 2) e.kbx = e.kby = 0; }
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
    let sp = G.result ? -e.speed * 0.3 : e.speed;
    const z = G.ph.zone; if (z && dist2(e.x, e.y, z.x, z.y) < z.r * z.r) sp *= PH_CFG.zoneSlow;   // 봉인석 구역 둔화 (0.3)
    e.x += dx / d * sp * dt; e.y += dy / d * sp * dt;
    if (d > farR) { const q = e.cmd ? ringAt(VIEW.w * 0.6, VIEW.w * 0.7) : ringPos(10); e.x = q.x; e.y = q.y; e.kbx = e.kby = 0; }   // 시야 밖 재배치
    if (d < e.r + p.r - 3) hurtPlayer(e.dmg, ENEMIES[e.type].name);
  }
  // 적끼리 겹침 완화(가벼운 분리)
  for (const e of G.enemies) {
    if (e.dead) continue;
    gridQuery(e.x, e.y, e.r, o => {
      if (o === e || o.id < e.id) return;
      const dx = o.x - e.x, dy = o.y - e.y, d = Math.hypot(dx, dy) || 0.01, ov = e.r + o.r - d;
      if (ov > 0) { const k = ov * 0.25 / d, ke = e.cmd ? 0 : k, ko = o.cmd ? 0 : k; e.x -= dx * ke; e.y -= dy * ke; o.x += dx * ko; o.y += dy * ko; }   // 대장은 밀리지 않음
    });
  }
  if (G.enemies.length > 600) G.enemies = G.enemies.filter(e => !e.dead);
}

/* 피해·처치 */
function damageEnemy(e, dmg, o = {}) {
  if (e.dead) return;
  const eff = Math.min(dmg, Math.max(0, e.hp));          // 실제 깎은 체력 기준 집계(초과 피해 제외, 0.2a)
  e.hp -= dmg; e.flash = 0.08;
  G.stats.dmg[o.src || '기타'] = (G.stats.dmg[o.src || '기타'] || 0) + eff;
  if (o.kb && o.fx !== undefined && !e.cmd) { const dx = e.x - o.fx, dy = e.y - o.fy, d = Math.hypot(dx, dy) || 1; e.kbx += dx / d * o.kb; e.kby += dy / d * o.kb; }
  if (e.hp <= 0) killEnemy(e);
}
function killEnemy(e) {
  e.dead = true; G.kills++;
  G.gems.push({ x: e.x, y: e.y, v: e.xp, mag: false }); G.stats.xpDrop += e.xp;
  fx({ kind: 'pop', x: e.x, y: e.y, r: e.r, color: e.color, dur: 0.22 });
}
function hurtPlayer(dmg, src) {
  const p = G.p;
  if (p.invT > 0 || STATE.dev.god || G.result) return;
  p.hp -= dmg; p.invT = CFG.player.invuln; p.flash = 0.2; G.lastHit = src;
  G.stats.hurt[src] = (G.stats.hurt[src] || 0) + dmg;
  if (p.hp <= 0) { p.hp = 0; G.result = 'dead'; G.endT = 1.4; fx({ kind: 'ring', x: p.x, y: p.y, r0: 10, r1: 200, dur: 1, color: '#ff6a6a' }); }
}

/* 경험치·레벨업 (레벨업마다 3지선다 대기열 적재) */
function updateGems(dt) {
  const p = G.p, R = CFG.player.pickup, R2 = R * R;
  for (const g of G.gems) {
    const d2 = dist2(g.x, g.y, p.x, p.y);
    if (!g.mag && d2 < R2) g.mag = true;
    if (g.mag) {
      const d = Math.sqrt(d2) || 1; g.sp = (g.sp || 120) + 900 * dt;
      g.x += (p.x - g.x) / d * g.sp * dt; g.y += (p.y - g.y) / d * g.sp * dt;
      if (d < p.r + 6) { g.dead = true; G.stats.xpGot += g.v; addXp(g.v); }
    }
  }
  G.gems = G.gems.filter(g => !g.dead);
  if (G.gems.length > CFG.gemMerge) {   // 먼 경험치 병합(개체 수 제한)
    const far = G.gems.filter(g => !g.mag).sort((a, b) => dist2(b.x, b.y, p.x, p.y) - dist2(a.x, a.y, p.x, p.y));
    const n = far.length - Math.floor(CFG.gemMerge * 0.7);
    if (n > 1) { let sum = 0; for (let i = 0; i < n; i++) { sum += far[i].v; far[i].dead = true; } far[n - 1].dead = false; far[n - 1].v = sum; G.gems = G.gems.filter(g => !g.dead); }
  }
}
function addXp(v) {
  const p = G.p; p.xp += v;
  while (p.xp >= p.need) { p.xp -= p.need; levelUp(); }
}
function levelUp() {
  const p = G.p; p.level++; p.need = xpNeed(p.level);
  G.pendingLv++;
  G.stats.levelAt.push(Math.round(G.time));
  fx({ kind: 'ring', x: p.x, y: p.y, r0: 8, r1: 70, dur: 0.4, color: '#7fe0ff', follow: true });
}

function updateMisc(dt) {
  for (const f of G.fx) f.t += dt; G.fx = G.fx.filter(f => f.t < f.dur);
  for (const t of G.toasts) t.t += dt; G.toasts = G.toasts.filter(t => t.t < t.dur);
}

/* 판 종료 */
function buildReport() {
  const tot = Object.values(G.stats.dmg).reduce((s, x) => s + x, 0) || 1;
  return {
    v: CFG.VERSION, result: G.result, time: Math.round(G.time), level: G.p.level, kills: G.kills, lastHit: G.lastHit,
    dmgShare: Object.entries(G.stats.dmg).map(([k, v]) => [k, Math.round(v / tot * 100)]).sort((a, b) => b[1] - a[1]),
    hurt: G.stats.hurt, maxEnemies: G.stats.maxEnemies, levelAt: G.stats.levelAt,
    build: { w: G.p.weapons.map(w => w.id + ':' + w.lvl), p: G.p.passives.map(x => x.id + ':' + x.lvl) },
    xp: [G.stats.xpGot, G.stats.xpDrop], selOpen: G.stats.selOpen, pendingLv: G.pendingLv, lastMinShare: lastMinShare(), picks: G.stats.picks, wFullAt: G.stats.wFullAt, pFullAt: G.stats.pFullAt,
    phases: G.ph.log, phaseReached: G.ph.i + 1, phaseAt: G.ph.id || 'gap',
    rerollsUsed: CFG.select.rerolls - G.rerolls, banishUsed: CFG.select.banishes - G.banishes,
  };
}
/* 마지막 1분 피해 비중 (빌드 완성도 반영 판독용) */
function lastMinShare() {
  const snap = G.stats.dmgMin[G.stats.dmgMin.length - 2] || {}, d = {};
  for (const k in G.stats.dmg) d[k] = G.stats.dmg[k] - (snap[k] || 0);
  const tot = Object.values(d).reduce((s, x) => s + x, 0) || 1;
  return Object.entries(d).map(([k, v]) => [k, Math.round(v / tot * 100)]).sort((a, b) => b[1] - a[1]);
}
function loadSave() { try { return JSON.parse(localStorage.getItem(CFG.SAVE_KEY) || '{}') || {}; } catch (e) { return {}; } }
function finishRun() {
  G.report = buildReport();
  try {
    const s = loadSave(); G.report.newBest = G.report.time > (s.bestTime || 0);
    s.runs = (s.runs || 0) + 1; s.bestTime = Math.max(s.bestTime || 0, G.report.time); if (G.report.result === 'clear') s.clears = (s.clears || 0) + 1;
    localStorage.setItem(CFG.SAVE_KEY, JSON.stringify(s));
  } catch (e) { }
  showResult();
}
