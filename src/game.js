/* ============================================================
   판 상태 · 진행
   ============================================================ */
const STATE = { mode: 'title', fps: 60, dev: { god: false, fps: true, auto: false, speed: 1, gk: null, demon: null } };   // gk: 수문장 지정, demon: 판 구조 지정 final·retry (시험용)
let G = null;

function earlyOn() { return !!(G && G.ph && G.ph.i < CFG.early.phases && !isBossPhase()); }   // 0.16 초반 완화 구간
function xpNeed(l) { return Math.floor(CFG.xp.base + CFG.xp.linear * l + Math.pow(l, CFG.xp.pow) * CFG.xp.powMul); }

function newRun() {
  G = {
    time: 0, kills: 0, eid: 0, pid: 0, spawnAcc: 0, result: null, endT: 0, finished: false,
    p: { x: 0, y: 0, r: CFG.player.r, hp: CFG.player.hp, maxHp: CFG.player.hp, face: { x: 0, y: -1 }, invT: 0, flash: 0, moving: false,
      level: 1, xp: 0, need: xpNeed(1), weapons: [], passives: [], relics: [], bonusDmg: 0, mod: null,
      job: null, jobAt: -1, job2: null, exw: null, exw1: null, ult: 0, fury: 0, holy: 0, form: null, shield: false, vet: false, curses: [] },
    enemies: [], gems: [], eb: [], hz: [], gk: null, gkMob: null, proj: [], fx: [], toasts: [], later: [], chests: [], pools: [], traps: [], turrets: [], minions: [], mines: [], pets: [], trail: [], rw: null, altar: null, banner: null, sanct: null,
    pendingLv: 0, pendingBr: [], pendingChest: 0, pendingJob2: false, pendingCamp: false, pendingDoor: false, rerolls: CFG.select.rerolls, banishes: CFG.select.banishes, banished: new Set(), sel: null,
    tm: { shield: 3, trail: 0, charge: 8, storm: 0, inv: 0, dance: 0, rain: 0, overdrive: 0, guard: 0, passCd: 0, furyHold: 0, run: 0, stopT: 0, turret: 1, readyAt: 0 },
    stats: { crisis: [], start: null, dmg: {}, hurt: {}, xpDrop: 0, xpGot: 0, selOpen: 0, dmgMin: [],  maxEnemies: 0, levelAt: [], picks: [], wFullAt: null, pFullAt: null,
      kt: {}, branches: [], relics: [], elites: 0, eliteKills: 0, chests: 0, job: null, jobAt: null, job2: null, job2At: null, ults: 0, altarSeen: 0, altarOpen: 0, altarLeave: 0, offers: 0, passes: 0 }, lastHit: '',
  };
  if (typeof perfReset === 'function') perfReset();        // 성능 측정 판 단위 (0.18)
  G.opt = runOpt(); saveCache = null;                       // 고난도 단계·도전 조건 (0.15)
  recalc();
  startPickInit();                                           // 0.24 시작 무기 3지선다
  G.gk = gkPick();                                          // 수문장 결정 (0.11)
  G.runType = runTypeOf();                                  // 판 구조: normal·final·retry (0.12)
  if (G.runType === 'retry') G.gk = null;
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
    dmg: (1 + PASSIVES.might.per * passLv('might')) * (1 + p.bonusDmg) * (p.vet ? 1.15 : 1),
    speed: (hasCurse('heavy') ? 0.9 : 1) * (1 + PASSIVES.swift.per * passLv('swift')) * (p.vet ? 1.08 : 1) * (p.job2 === 'accel' ? 1.15 : 1),
    cd: Math.max(0.4, 1 - PASSIVES.haste.per * passLv('haste')),
  };
  p.maxHp = CFG.player.hp + PASSIVES.vit.per * passLv('vit') + (p.vet ? 30 : 0);
  traitMod(p);                                              // 숙련 특성 (0.23)
  if (p.maxHp > prevMax && !hasCond('noheal')) p.hp += p.maxHp - prevMax;     // 늘어난 최대 체력만큼 회복 (도전 조건 회복 없음 제외)
  p.hp = Math.min(p.hp, p.maxHp);
}
/* 0.35 처치 연동 회복 공통 상한: 흡혈·피의 칼날·피의 갈증 합계 초당 최대 체력 0.18% (최대 5초분 적립) */
const KILL_HEAL = { rate: 0.0018, keep: 5 };
function killHeal(v, src) { const p = G.p, K = G.kh || (G.kh = { b: p.maxHp * KILL_HEAL.rate * KILL_HEAL.keep, t: G.time }); K.b = Math.min(p.maxHp * KILL_HEAL.rate * KILL_HEAL.keep, K.b + (G.time - K.t) * p.maxHp * KILL_HEAL.rate); K.t = G.time; const g = Math.min(v, K.b); if (g <= 0) return; K.b -= g; heal(g, src); }
function heal(v, src = '기타') { const p = G.p; if (hasCond('noheal')) return; if (hasCurse('blight')) v *= 0.6; const b = p.hp; p.hp = Math.min(p.maxHp, p.hp + v); const H = G.stats.healBy || (G.stats.healBy = {}); H[src] = (H[src] || 0) + (p.hp - b) / p.maxHp; }   // 0.35 회복원별 실회복량(최대 체력 비율) 기록
function clearInput() { INPUT.active = false; INPUT.id = null; INPUT.mag = 0; }
function toast(text, color = '#fff') { G.toasts.push({ text, color, t: 0, dur: 2 }); if (G.toasts.length > 3) G.toasts.shift(); }
function fx(o) { if (G.fx.length < 220) G.fx.push(Object.assign({ t: 0 }, o)); }

/* 한 틱 진행 */
function step(dt) {
  if (!G.storyOn) { G.storyOn = true; if (storyRunStart()) return; }   // 판 시작 대사 (0.13)
  G.time += dt;
  if (G.time >= (G.stats.dmgMin.length + 1) * 60) G.stats.dmgMin.push(Object.assign({}, G.stats.dmg));   // 분 단위 피해 누적 스냅숏
  updatePlayer(dt);
  guideUpdate(dt);                                           // 첫 판 안내 (0.31)
  if (!G.result) { updatePhase(dt); if (!G.result) updateEvent(dt); updateEliteSpawn(dt); }
  if (!G.result) updateSpawn(dt);
  gridBuild(G.enemies);
  if (!G.result) { updateWeapons(dt); updateJob(dt); updatePassiveBranches(dt); updateRelics(dt); }
  updateProjectiles(dt);
  updatePools(dt);
  updateEnemies(dt);
  updateBossFx(dt);
  updateGems(dt);
  if (!G.result) { updateChests(); updateAltar(dt); }
  updateMisc(dt);
  if (G.result) { G.endT -= dt; if (G.endT <= 0 && !G.finished) { G.finished = true; finishRun(); } }
  else if (STATE.mode === 'play') {                         // 선택 화면 우선순위: 2차 전직 → 분기 → 보물 상자 → 레벨업
    if (G.pendingStart) openStart();
    else if (G.pendingJob2) openJob2();
    else if (G.pendingBond && G.pendingBond.length) openBond();
    else if (G.pendingBr.length) openBranch();
    else if (G.pendingDoor) openDoor();
    else if (G.pendingCamp) openCamp();
    else if (G.pendingChest > 0) openChest();
    else if (G.pendingLv > 0) openSelect();
  }
}

/* 플레이어 */
function updatePlayer(dt) {
  const p = G.p;
  p.invT -= dt; p.flash -= dt;
  if (G.result) { p.moving = false; return; }
  const mv = moveVec(), sp = CFG.player.speed * p.mod.speed * (G.tm.alpha > 0 ? 1.2 : 1) * ultSpdMul();   // 0.26a 늑대 우두머리의 함성
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
    id: ++G.eid, type, x, y, r: d.r, hp: d.hp * (1 + CFG.scale.hpPerMin * min) * (1 + tierK()) * (earlyOn() ? CFG.early.hp : 1), dmg: d.dmg * (1 + CFG.scale.dmgPerMin * min),   // 고난도 체력 (0.15)
    speed: d.speed * rand(0.9, 1.1) * (1 + CFG.scale.speedPerMin * Math.min(min, 10)),
    color: d.color, shape: d.shape, xp: d.xp, flash: 0, kbx: 0, kby: 0, dead: false, ht: {},
  };
  if (d.mb) e.mb = d.mb;                                     // 잡몹 행동 유형 (0.23)
  if (G.ph && G.ph.cart && !G.ph.cart.done && !G.ph.inGap && Math.random() < PH_CFG.cartAggro) e.tgtCart = true;   // 0.24 수레 표적
  e.maxHp = e.hp; G.enemies.push(e); return e;
}
function aliveCount() { let n = 0; for (const e of G.enemies) if (!e.dead) n++; return n; }
function updateSpawn(dt) {
  const S = CFG.spawn, min = G.time / 60;
  let rate = (S.base + S.perMin * min) * phaseSpawnMul() * (earlyOn() ? CFG.early.spawn : 1);
  let alive = aliveCount();
  if (alive > S.soft) rate *= Math.max(S.softMin, 1 - (alive - S.soft) / S.softSpan);
  G.spawnAcc += rate * dt;
  const cap = Math.min(S.max, S.rampBase + G.time * S.ramp);
  while (G.spawnAcc >= 1) {
    G.spawnAcc -= 1;
    if (alive >= cap) break;
    const P = curPhase(), q = P && P.spawnR && !G.ph.inGap ? ringAt(P.spawnR[0], P.spawnR[1]) : ringPos(); makeEnemy(pickType(), q.x, q.y); alive++;   // 안개 평원: 근접 출현 (0.10)
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
    if (G.tm.roar > 0) sp *= 0.5;                                                 // 군주 궁극기
    if (G.tm.stop > 0) sp *= e.boss ? 0.3 : 0;                                    // 시간술사 궁극기
    if (e.elite) sp *= eliteMove(e, dt);
    if (e.slowT > 0) { e.slowT -= dt; sp *= 0.55; }
    if (e.frz > 0) { e.frz -= dt; sp = 0; }
    if (e.mb && !e.frz) { sp = mobMove(e, dt, sp, d, dx, dy); if (e.dead) continue; }   // 사격·자폭·돌진·흔들림 (0.23)
    if (e.sleep || e.fixed) sp = 0;                                               // 잠든 거대 몹·마법진 (0.10)                                       // 빙결·속박 (0.8)
    if (e.bl > 0) { e.bl -= dt; e.blT = (e.blT || 0) - dt; if (e.blT <= 0) { e.blT = 0.5; damageEnemy(e, e.blD, { src: 'bleed' }); if (e.dead) continue; } }
    if (e.gk) { gkUpdate(e, dt, d, dx, dy); continue; }                      // 수문장 전용 이동·패턴 (0.11)
    if (e.thief) { thiefMove(e, dt, d, dx, dy); continue; }                    // 도망치는 보물 몹 (0.24)
    const z = G.ph.zone; if (z && dist2(e.x, e.y, z.x, z.y) < z.r * z.r) sp *= PH_CFG.zoneSlow;   // 봉인석 구역 둔화 (0.3)
    const ct = e.tgtCart && G.ph.cart && !G.ph.cart.done ? G.ph.cart : null;   // 수레 표적 적 (0.24): 수레로 돌진, 붙으면 정지
    if (ct) { const cx = ct.x - e.x, cy = ct.y - e.y, cd = Math.hypot(cx, cy) || 1; if (cd > e.r + ct.r) { e.x += cx / cd * sp * dt; e.y += cy / cd * sp * dt; } }
    else { e.x += dx / d * sp * dt; e.y += dy / d * sp * dt; }
    if (d > farR && !e.fixed && !e.sleep) { const q = e.cmd ? ringAt(VIEW.w * 0.6, VIEW.w * 0.7) : ringPos(10); e.x = q.x; e.y = q.y; e.kbx = e.kby = 0; }   // 시야 밖 재배치
    if (d < e.r + p.r - 3 && !e.fixed && !e.sleep) hurtPlayer(e.dmg, ENEMIES[e.type].name, e);
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
  if (e.dead) return;                                       // 0.31 마왕 전환 무적 폐지
  if (e.mhp == null) e.mhp = e.hp;                          // 0.32 최대 체력 기록 (처형 판정)
  dmg *= ultDmgMul() * jobDmgMul(e, o) * traitDmgMul(e) * (e.mb ? mobDmgMul(e, o) : 1);   // 숙련 특성·방패병 (0.23)
  if (G.tm.storm > 0 && o.src === 'spin') dmg *= 1.3;
  if (e.gk === 'demon') { dmg = dmAdjust(e, dmg); if (dmg <= 0) return; }   // 마왕 처치 시간 편차 억제 (0.16) — 모든 피해 배율 적용 후 보정 (0.18: 칼날 폭풍 배율이 보정 뒤에 곱해져 페이즈 조기 전환되던 결함 수정)
  if (ultHoldDmg(e, dmg, o)) return;                        // 0.32 시간 단절 피해 보류
  if (e.sh > 0) { const a = Math.min(e.sh, dmg); e.sh -= a; dmg -= a; G.stats.dmg[o.src || '기타'] = (G.stats.dmg[o.src || '기타'] || 0) + a; e.flash = 0.05; if (dmg <= 0) return; }
  const eff = Math.min(dmg, Math.max(0, e.hp));          // 실제 깎은 체력 기준 집계(초과 피해 제외, 0.2a)
  e.hp -= dmg; sfx('hit'); jHit(e, eff, o);                   // 타격 연출·피해 숫자 (0.22)
  G.stats.dmg[o.src || '기타'] = (G.stats.dmg[o.src || '기타'] || 0) + eff;
  if (o.kb && o.fx !== undefined && !e.cmd) { const dx = e.x - o.fx, dy = e.y - o.fy, d = Math.hypot(dx, dy) || 1; e.kbx += dx / d * o.kb * JUICE.kbMul; e.kby += dy / d * o.kb * JUICE.kbMul; }   // 밀림 강화 (0.22)
  if (o.src !== 'ult') ultHitGain(e);                       // 0.26a 엘리트·수문장 타격 충전
  e.ls = o.src;                                              // 마지막 피해원 (0.26 변환 처치 효과)
  if (e.hp <= 0) killEnemy(e);
  else { o.dmg0 = dmg; onEnemyHit(e, o); }
}
function killEnemy(e) {
  e.dead = true; G.kills++; G.stats.kt[e.type] = 1; sfx(e.gk && !e.clone ? 'bossdie' : 'kill');
  const xv = e.xp * crisisXpMul(); if (xv > 0) { G.gems.push({ x: e.x, y: e.y, v: xv, mag: false }); G.stats.xpDrop += xv; }   // 균열 폭주 경험치 2배 (0.24)
  if (e.thief) crisisThiefKilled(e);
  if (e.elite) eliteKilled(e);
  if (e.ev) eventMobKilled(e);
  if (e.gk) gkKilled(e);
  ultOnKill(e);                                              // 0.32 사령술사·정복왕
  if (e.slowT > 0 && wBr('icering') === 'shatter') { const x = e.x, y = e.y, d = wStats(G.p.weapons.find(w => w.id === 'icering')).dmg * 2.5; G.later.push({ t: 0, f: () => explode(x, y, 46, d, 'shatter', '#bfe8ff') }); }
  if (pBr('regen') === 'vamp') killHeal(0.4, '흡혈');
  relicKill(e);                                              // 0.27 유물 처치 연계
  onEnemyKill(e);
  if (e.mb) mobKilled(e); traitKill(e);                     // 분열·숙련 특성 (0.23)
  fx({ kind: 'pop', x: e.x, y: e.y, r: e.r, color: e.color, dur: 0.22 });
  jKill(e);                                                  // 처치 파편 (0.22)
}
function hurtPlayer(dmg, src) {
  const p = G.p;
  if (p.invT > 0 || STATE.dev.god || G.result) return;
  if (playerAvoid() || traitAvoid()) return;
  if (ultBlockHit()) return;                                 // 0.32 성군 보호막
  dmg *= playerHurtMul() * traitHurtMul() * (hasCurse('frail') ? 1.15 : 1) * (1 + tierK()) * (G.ph && G.ph.id === 'demon' ? DM_CFG.hurtMul : 1);   // 고난도 피해: 모든 피해원 공통 (0.15) · 0.37 마왕전 받는 피해 감소
  vibe(25); sfx('hurt');
  onPlayerHurt();
  G.ph.hurtEma += dmg / 40;                                  // 강함 판정용 최근 피해 (0.24)
  ultHurtGain(Math.min(dmg, Math.max(0, p.hp)));                // 0.35 피격 충전
  p.hp -= dmg; p.invT = CFG.player.invuln + (tr('guard') ? 0.2 : 0); p.flash = 0.2; G.lastHit = src;
  G.stats.hurt[src] = (G.stats.hurt[src] || 0) + dmg; ultOnHurt();   // 0.32 성자 반격 섬광
  if (p.hp <= 0 && pBr('regen') === 'second' && !p.revived) { p.revived = true; p.hp = p.maxHp * 0.4; p.invT = 2; toast('불굴', '#ffb070'); return; }
  if (p.hp <= 0) { p.hp = 0; sfx('dead'); G.result = 'dead'; G.endT = 1.4; fx({ kind: 'ring', x: p.x, y: p.y, r0: 10, r1: 200, dur: 1, color: '#ff6a6a' }); }
}

/* 흡수 범위 (경험치·고기 공용, 0.35) */
function pickR() { return CFG.player.pickup * (1 + PASSIVES.magnet.per * passLv('magnet')) * (tr('magnet') ? 1.25 : 1); }
/* 경험치·레벨업 (레벨업마다 3지선다 대기열 적재) */
function updateGems(dt) {
  const p = G.p, R = pickR(), R2 = R * R;
  for (const g of G.gems) {
    const d2 = dist2(g.x, g.y, p.x, p.y);
    if (!g.mag && d2 < R2) g.mag = true;
    if (g.mag) {
      const d = Math.sqrt(d2) || 1; g.sp = (g.sp || 120) + 900 * dt;
      g.x += (p.x - g.x) / d * g.sp * dt; g.y += (p.y - g.y) / d * g.sp * dt;
      if (d < p.r + 6) { g.dead = true; sfx('gem'); G.stats.xpGot += g.v; addXp(g.v); }
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
  const p = G.p; p.xp += v * (pBr('magnet') === 'greed' ? 1.15 : 1) * (earlyOn() ? CFG.early.xp : 1) * (tr('study') ? 1.08 : 1);
  while (p.xp >= p.need) { p.xp -= p.need; levelUp(); }
}
function levelUp() {
  const p = G.p; p.level++; p.need = xpNeed(p.level); sfx('level'); bondShareLevel();
  G.pendingLv++;
  G.stats.levelAt.push(Math.round(G.time));
  fx({ kind: 'ring', x: p.x, y: p.y, r0: 8, r1: 70, dur: 0.4, color: '#7fe0ff', follow: true });
  jLevel(); rcLevel();                                       // 레벨업 연출 (0.22), 게이지 빛 흐름 (0.28)
}

function updateMisc(dt) {
  for (const f of G.fx) f.t += dt; G.fx = G.fx.filter(f => f.t < f.dur);
  for (const t of G.toasts) t.t += dt; G.toasts = G.toasts.filter(t => t.t < t.dur);
  updateJuice(dt); updateTraits(dt); updateReact(dt);
}

/* 판 종료 */
function buildReport() {
  const tot = Object.values(G.stats.dmg).reduce((s, x) => s + x, 0) || 1;
  return {
    v: CFG.VERSION, result: G.result, time: Math.round(G.time), level: G.p.level, kills: G.kills, lastHit: G.lastHit,
    dmgShare: Object.entries(G.stats.dmg).map(([k, v]) => [k, Math.round(v / tot * 100)]).sort((a, b) => b[1] - a[1]),
    hurt: G.stats.hurt, maxEnemies: G.stats.maxEnemies, levelAt: G.stats.levelAt,
    build: { w: G.p.weapons.map(w => w.id + ':' + w.lvl), p: G.p.passives.map(x => x.id + ':' + x.lvl) },
    meat: G.rc ? [G.rc.meatN, G.rc.meatEat, G.rc.meatTimes, G.rc.meatFar || 0] : [0, 0, [], 0], healBy: G.stats.healBy || {}, ultBy: G.stats.ultBy || {}, ultAt: G.ultAt || [],
    xp: [G.stats.xpGot, G.stats.xpDrop], selOpen: G.stats.selOpen, pendingLv: G.pendingLv, lastMinShare: lastMinShare(), picks: G.stats.picks, wFullAt: G.stats.wFullAt, pFullAt: G.stats.pFullAt,
    phases: G.ph.log, phaseReached: G.ph.i + 1, phaseAt: G.ph.id || 'gap',
    rerollsUsed: CFG.select.rerolls - G.rerolls, banishUsed: CFG.select.banishes - G.banishes,
    branches: G.stats.branches, relics: G.p.relics, elites: [G.stats.elites, G.stats.eliteKills], chests: G.stats.chests,
    job: G.stats.job, jobAt: G.stats.jobAt, job2: G.stats.job2, job2At: G.stats.job2At, ults: G.stats.ults, bond: G.stats.bond || null, bondPicks: G.stats.bondPicks || [],
    altar: [G.stats.altarSeen, G.stats.altarOpen, G.stats.altarLeave, G.stats.offers], passes: G.stats.passes, chestPicks: G.stats.chestPicks || [], maxMinions: G.stats.maxMinions || 0,
    order: G.ph.order, gate: G.stats.gate ? [G.stats.gate.id, G.stats.gate.killed ? 'kill' : G.result, G.stats.gate.dur || Math.round(G.time - G.stats.gate.t0), G.stats.gate.killed ? 0 : G.gkMob ? Math.round(Math.max(0, G.gkMob.hp) / G.gkMob.maxHp * 100) : 100, G.stats.gate.rageAt] : null, gk: G.gk, runType: G.runType, demon: dmReport(), events: G.ev ? G.ev.log : [], curses: G.p.curses, camp: G.stats.camp || [], traits: G.stats.traits || [], mobs: Object.keys(G.stats.kt), crisis: G.stats.crisis, start: G.stats.start,
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
  fragUnlock('loop');                                       // 기록 조각: 첫 회귀 (0.13), 0.16: 첫 판 종료로 완화
  G.report = buildReport();
  let show = showResult;
  try {
    const s = loadSave(); G.report.newBest = G.report.time > (s.bestTime || 0);
    s.runs = (s.runs || 0) + 1; s.bestTime = Math.max(s.bestTime || 0, G.report.time); if (G.report.result === 'clear') s.clears = (s.clears || 0) + 1; gkSave(s); dmSave(s); G.report.gates = s.gates.length; G.report.demonKills = s.demonKills || 0;
    metaSave(s);                                             // 도감 기록·점수·칭호 (0.14·0.15)
    show = storyRunEnd(s, showResult);                        // 판 종료 대사·엔딩 (0.13)
    G.report.frags = (s.frags || []).length; G.report.story = [s.released ? 1 : 0, s.trueEnd ? 1 : 0, s.ending1 ? 1 : 0];
    localStorage.setItem(CFG.SAVE_KEY, JSON.stringify(s));
  } catch (e) { console.error(e); if (window.__onErr) window.__onErr(e); }
  show();
}
