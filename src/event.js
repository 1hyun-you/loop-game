/* ============================================================
   곁가지 사건 (0.10) — 판당 1~2회, 3종 (3단계 결정 안건 6)
   공통: 일반 페이즈(기믹형·야영지 제외) 진행 중 플레이어 주변 생성, 간접 신호로 성격 암시,
         무시 가능(일정 시간 후 소멸), 진입 시 진행 중 페이즈 타이머 정지, 완료 후 복귀
   동굴 입구: 정예 소굴 45초 생존 → 유물 우선 보물 상자
   잠든 거대 몹: 접근·피격 시 각성, 강화 엘리트 처치 → 보물 상자 2개
   봉인된 문: 구역 체류 해제 → 저주 1개 감수 시 레벨업 3회
   ============================================================ */
const EVENTS = {
  cave: { name: '동굴 입구', sign: '어딘가에서 서늘한 바람이 분다', color: '#7fe0ff' },
  giant: { name: '잠든 거대 몹', sign: '땅이 낮게 울린다', color: '#ffb070' },
  door: { name: '봉인된 문', sign: '희미한 문양이 빛난다', color: '#c8a0ff' },
};
const EV_CFG = { perRun: [1, 2], at: [0.25, 0.55], dist: [200, 260], life: 40, r: 26,
  caveEnter: 1.0, caveDur: 45, caveSpawn: 2.2, caveElites: 2,
  giantHp: 14, giantDmg: 1.5, giantR: 30, giantWake: 110, giantMax: 90, giantChests: 2,
  doorStay: 2.5, doorLv: 3 };
const CURSES = {
  frail: { name: '연약', ds: '받는 피해 +15%' },
  heavy: { name: '둔중', ds: '이동 속도 -10%' },
  horde: { name: '소란', ds: '적 출현량 +15%' },
  blight: { name: '메마름', ds: '회복량 -40%' },
};

function eventInit() {
  const ph = G.ph, idx = [];
  ph.order.forEach((id, i) => { if (i > 0 && PHASES[id].type !== '보스') idx.push(i); });   // 0.24 순서 동적 결정 → 위치만 예약, 해당 페이즈가 부적합하면 다음 페이즈로 이월
  const evLeft = Object.keys(EVENTS).some(k => !(loadSave().frags || []).includes(k));   // 0.16: 사건 조각 미해금 시 2회 보장
  const n = Math.min(idx.length, evLeft || Math.random() >= 0.5 ? EV_CFG.perRun[1] : EV_CFG.perRun[0]);
  const at = shuffle(idx).slice(0, n).sort((a, b) => a - b), got = (loadSave().frags || []), types = shuffle(Object.keys(EVENTS)).sort((a, b) => got.includes(a) - got.includes(b));   // 0.16: 미해금 조각 유형 우선 등장
  G.ev = { plan: at.map((i, k) => ({ i, type: types[k], at: rand(EV_CFG.at[0], EV_CFG.at[1]) })), cur: null, log: [] };
}
function eventPaused() { const c = G.ev && G.ev.cur; return !!(c && c.state === 'active'); }
function eventSpawnMul() { const c = G.ev && G.ev.cur; return (c && c.state === 'active' && c.type === 'cave' ? EV_CFG.caveSpawn : 1) * crisisSpawnMul(); }
function hasCurse(k) { return G.p.curses && G.p.curses.includes(k); }
function eventPointer() { if (G.cr && G.cr.type === 'thief' && !G.cr.mob.dead) return G.cr.mob; const c = G.ev && G.ev.cur; if (!c) return null; if (c.type === 'giant' && c.mob && !c.mob.dead) return c.state === 'idle' ? c : null; return c.state === 'idle' ? c : null; }

function eventSpawn(pl) {
  const q = ringAt(EV_CFG.dist[0], EV_CFG.dist[1]), D = EVENTS[pl.type];
  const c = { ev: true, type: pl.type, x: q.x, y: q.y, r: EV_CFG.r, t: 0, stay: 0, state: 'idle', at: G.time };
  if (pl.type === 'giant') {
    const e = makeEnemy('brute', q.x, q.y);
    e.hp = e.maxHp = e.hp * EV_CFG.giantHp; e.dmg *= EV_CFG.giantDmg; e.r = EV_CFG.giantR; e.color = '#7a5a8a'; e.xp = 40;
    e.cmd = true; e.sleep = true; e.ev = c; c.mob = e;
  }
  G.ev.cur = c; toast(D.sign, D.color);
}
function eventEnd(outcome) {
  const c = G.ev.cur; if (!c) return;
  G.ev.log.push([c.type, outcome, Math.round(G.time - c.at)]);
  if (outcome === 'ok' || outcome === 'refuse') fragUnlock(c.type);   // 곁가지 사건 첫 해결 조각 (0.13), 0.16: 봉인된 문은 열기만 해도 해금
  if (c.mob && !c.mob.dead && outcome !== 'ok') c.mob.dead = true;
  G.ev.cur = null;
}
function updateEvent(dt) {
  const E = G.ev, ph = G.ph, p = G.p; if (!E) return;
  updateCrisis(dt);
  if (!E.cur) {
    const pl = E.plan[0];
    if (pl && pl.i < ph.i) E.plan.shift();                            // 해당 페이즈를 지나침 (조기 종료 등)
    else if (pl && pl.i === ph.i && !ph.inGap) {
      const P = curPhase();
      if (P.type === '기믹형' || P.type === '보스' || ph.id === 'camp' || ph.ambush || G.cr) {   // 부적합 페이즈·고비 사건 진행 중 → 다음 페이즈로 이월
        let k = ph.i + 1; for (const q of E.plan) { if (q.i < k) q.i = k; k = q.i + 1; }
        if (E.plan[E.plan.length - 1].i >= ph.order.length - 1) E.plan.pop();
        return;
      }
      const span = P.dur || P.fail || 120; if (ph.t >= span * pl.at) { E.plan.shift(); eventSpawn(pl); }
    }
    return;
  }
  const c = E.cur; c.t += dt;
  const inside = dist2(p.x, p.y, c.x, c.y) < (c.r + p.r) ** 2;
  if (c.state === 'idle') {
    if (c.type !== 'giant' && c.t > EV_CFG.life) return eventEnd('ignore');
    if (c.type === 'cave') { c.stay = inside ? c.stay + dt : 0; if (c.stay >= EV_CFG.caveEnter) eventStart(c); }
    if (c.type === 'door') { c.stay = inside ? c.stay + dt : Math.max(0, c.stay - dt); if (c.stay >= EV_CFG.doorStay) { c.state = 'done'; G.pendingDoor = true; } }
    if (c.type === 'giant') {
      const m = c.mob;
      if (m.dead) return eventEnd('ok');
      if (c.t > EV_CFG.life && m.hp >= m.maxHp) return eventEnd('ignore');
      if (dist2(p.x, p.y, m.x, m.y) < EV_CFG.giantWake ** 2 || m.hp < m.maxHp) { m.sleep = false; m.giant = true; eventStart(c); toast('거대 몹 각성', '#ffb070'); }
    }
    return;
  }
  if (c.state === 'active') {
    c.act += dt;
    if (c.type === 'cave' && c.act >= EV_CFG.caveDur) { G.chests.push({ x: c.x, y: c.y, r: 14, relic: true }); toast('소굴 소탕 · 보물 상자', '#ffd24a'); return eventEnd('ok'); }
    if (c.type === 'giant') {
      if (c.mob.dead) return eventEnd('ok');
      if (c.act >= EV_CFG.giantMax) { fx({ kind: 'ring', x: c.mob.x, y: c.mob.y, r0: 10, r1: 80, dur: 0.6, color: '#ffb070' }); toast('거대 몹 퇴각', '#ffb070'); return eventEnd('flee'); }
    }
  }
}
function eventStart(c) {
  c.state = 'active'; c.act = 0;
  if (c.type === 'cave') { toast('동굴 진입 · 45초 생존', '#7fe0ff'); for (let i = 0; i < EV_CFG.caveElites; i++) { const e = spawnElite(); e.noChest = true; } }
}
/* 거대 몹 처치 (killEnemy에서 호출) */
function eventMobKilled(e) {
  for (let i = 0; i < EV_CFG.giantChests; i++) G.chests.push({ x: e.x + (i ? 20 : -20), y: e.y, r: 14 });
  toast('거대 몹 처치 · 보물 상자 2개', '#ffd24a');
}
/* 봉인된 문 선택 */
function openDoor() {
  G.pendingDoor = false; STATE.mode = 'select'; clearInput();
  const left = Object.keys(CURSES).filter(k => !hasCurse(k)), k = pick(left.length ? left : Object.keys(CURSES));
  G.sel = { kind: 'door', curse: k, cards: [{ t: 'doorYes', id: k }, { t: 'doorNo', id: k }], banish: false };
  renderSelect(); autoLater();
}
function applyDoor(c) {
  if (c.t === 'doorYes') {
    (G.p.curses = G.p.curses || []).push(c.id); G.pendingLv += EV_CFG.doorLv;
    toast(`저주 ${CURSES[c.id].name} · 레벨 업 ${EV_CFG.doorLv}회`, '#c8a0ff'); recalc(); eventEnd('ok');
  } else eventEnd('refuse');
}
/* 떠돌이 야영지 선택 */
const CAMP_CARDS = [{ t: 'campRest', id: 'rest' }, { t: 'campTrain', id: 'train' }, { t: 'campSupply', id: 'supply' }];
function openCamp() {
  G.pendingCamp = false; STATE.mode = 'select'; clearInput();
  G.sel = { kind: 'camp', cards: CAMP_CARDS.slice(), banish: false };
  renderSelect(); autoLater();
}
function applyCamp(c) {
  const p = G.p; (G.stats.camp = G.stats.camp || []).push(c.id);
  if (c.id === 'rest') { if (!hasCond('noheal')) p.hp = p.maxHp; toast('휴식 · 체력 전부 회복', '#8ff0b0'); }
  if (c.id === 'train') { G.pendingLv += 2; toast('수련 · 레벨 업 2회', '#7fe0ff'); }
  if (c.id === 'supply') { G.pendingChest++; }
}

/* 지면 표시 */
function drawEventGround(c) {
  const E = G.ev, v = E && E.cur; if (!v || v.state === 'done') return;
  if (v.type === 'cave') {
    c.strokeStyle = 'rgba(127,224,255,0.5)'; c.lineWidth = 2; c.beginPath(); c.ellipse(v.x, v.y, v.r + 6, v.r, 0, 0, 7); c.stroke();
    drawSprite(c, 'cave', 0, v.x, v.y + 18, { mul: 2, mode: v.state === 'active' ? 'gold' : 'n' });   // 0.30 동굴 입구 도트
    if (v.state === 'idle' && v.stay > 0) { c.strokeStyle = '#e8f8ff'; c.lineWidth = 4; c.beginPath(); c.arc(v.x, v.y, v.r + 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * v.stay / EV_CFG.caveEnter); c.stroke(); }
    if (v.state === 'active') { c.strokeStyle = '#ffd24a'; c.lineWidth = 4; c.beginPath(); c.arc(v.x, v.y, v.r + 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * v.act / EV_CFG.caveDur); c.stroke(); }
  }
  if (v.type === 'door') {
    c.fillStyle = 'rgba(200,160,255,0.15)'; c.beginPath(); c.arc(v.x, v.y, v.r + 8, 0, 7); c.fill();
    drawSprite(c, 'sdoor', f2(2), v.x, v.y + 14, { mul: 2 });                                    // 0.30 봉인된 문 도트
    if (v.stay > 0) { c.strokeStyle = '#f0e0ff'; c.lineWidth = 4; c.beginPath(); c.arc(v.x, v.y, v.r + 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * v.stay / EV_CFG.doorStay); c.stroke(); }
  }
  if (v.type === 'giant' && v.mob && v.mob.sleep && !v.mob.dead) {
    const zt = G.time % 2.4;                                                          // 0.30 'Z' 도트 3개가 차례로 떠오름
    for (let i = 0; i < 3; i++) { const q = (zt / 2.4 + i / 3) % 1; c.globalAlpha = Math.sin(q * Math.PI); drawSpriteC(c, 'zzz', 0, v.mob.x + v.mob.r * 0.7 + q * 14, v.mob.y - v.mob.r - 6 - q * 26, { mul: q > 0.5 ? 2 : 1 }); }
    c.globalAlpha = 1;
  }
}

/* ============================================================
   0.24 후반 고비 사건 — 10분 이후 일반 페이즈 중 페이즈당 최대 1회
   엘리트 습격대: 정예 3~4체 동시 출현 → 전부 처치 시 보물 상자
   도망치는 보물 몹: 달아나는 몹 추격 → 처치 시 보석 다량 (20초 후 도주)
   균열 폭주: 20초간 적 출현 2배·경험치 2배
   ============================================================ */
const CRISES = {
  raid: { name: '엘리트 습격대', sub: '정예 무리 습격 · 전부 처치 시 보물 상자', color: '#ffb070' },
  thief: { name: '도망치는 보물 몹', sub: '달아나기 전에 잡아라 · 보석 다량', color: '#ffe08a' },
  rift: { name: '균열 폭주', sub: '20초간 출현·경험치 2배', color: '#c9a8ff' },
};
const CR_CFG = { from: 600, chance: 0.55, at: [0.2, 0.55], raidN: [3, 4], raidLife: 75, thiefLife: 20, thiefHp: 30, thiefSpeed: 128, thiefGems: 12, thiefXp: 5, riftDur: 20, riftMul: 2 };
function crisisPlan() {
  const ph = G.ph, P = curPhase(); ph.crisis = null;
  if (!P || P.type === '보스' || (REST_PH.includes(ph.id) && !ph.ambush) || G.time < CR_CFG.from || Math.random() >= CR_CFG.chance) return;
  ph.crisis = { type: pick(Object.keys(CRISES)), at: rand(CR_CFG.at[0], CR_CFG.at[1]) };
}
function crisisSpawnMul() { return G.cr && G.cr.type === 'rift' ? CR_CFG.riftMul : 1; }
const crisisXpMul = () => (G.cr && G.cr.type === 'rift' ? CR_CFG.riftMul : 1) * (G._xk41 || 1);   // 0.41 드루이드 동료 처치 경험치
function updateCrisis(dt) {
  const ph = G.ph;
  if (!G.cr) {
    const q = ph.crisis; if (!q || ph.inGap || eventPaused() || (G.ev && G.ev.cur)) return;
    const P = curPhase(), span = P.dur || P.fail || 120;
    if (ph.t < span * q.at) return;
    ph.crisis = null; crisisStart(q.type); return;
  }
  const c = G.cr; c.t += dt;
  if (c.type === 'raid') {
    const left = c.mobs.filter(e => !e.dead);
    if (!left.length) { G.chests.push({ x: c.lx, y: c.ly, r: 14 }); toast('습격대 격퇴 · 보물 상자', '#ffd24a'); return crisisEnd('ok'); }
    for (const e of c.mobs) if (e.dead && !e.cnt) { e.cnt = true; c.lx = e.x; c.ly = e.y; }
    if (c.t >= CR_CFG.raidLife) return crisisEnd('timeout');
  }
  if (c.type === 'thief') {
    if (c.mob.dead && c.mob.got) return crisisEnd('ok');
    if (c.t >= CR_CFG.thiefLife) { fx({ kind: 'ring', x: c.mob.x, y: c.mob.y, r0: 8, r1: 50, dur: 0.4, color: '#ffe08a' }); c.mob.dead = true; toast('보물 몹 도주', '#ffe08a'); return crisisEnd('flee'); }
  }
  if (c.type === 'rift' && c.t >= CR_CFG.riftDur) { toast('균열 진정', '#c9a8ff'); return crisisEnd('ok'); }
}
function crisisStart(type) {
  const D = CRISES[type], c = G.cr = { type, t: 0 }, min = G.time / 60;
  banner(D.name, D.sub, D.color, 1.8); shake(3, 0.35); sfx('preview');
  if (type === 'raid') { const n = min >= 14 ? CR_CFG.raidN[1] : CR_CFG.raidN[0]; c.mobs = []; for (let i = 0; i < n; i++) { const e = spawnElite(); e.noChest = true; e.raid = true; c.mobs.push(e); } c.lx = G.p.x; c.ly = G.p.y; }
  if (type === 'thief') {
    const q = ringAt(150, 200), e = makeEnemy('slime', q.x, q.y);
    e.hp = e.maxHp = e.hp * CR_CFG.thiefHp; e.speed = CR_CFG.thiefSpeed; e.dmg = 0; e.xp = 0; e.thief = true; e.color = '#ffd24a'; e.r = 13; e.cmd = true;
    c.mob = e;
  }
}
function crisisEnd(outcome) { const c = G.cr; (G.stats.crisis = G.stats.crisis || []).push([c.type, outcome, Math.round(c.t)]); G.cr = null; }
/* 보물 몹 처치 (killEnemy에서 호출) */
function crisisThiefKilled(e) {
  e.got = true; const v = Math.round(CR_CFG.thiefXp * (1 + G.time / 300));
  for (let i = 0; i < CR_CFG.thiefGems; i++) { const a = i * Math.PI * 2 / CR_CFG.thiefGems; G.gems.push({ x: e.x + Math.cos(a) * 26, y: e.y + Math.sin(a) * 26, v, mag: false }); G.stats.xpDrop += v; }
  burst(e.x, e.y, 20, '#ffd24a', 180, 0.6, 3); toast('보물 몹 포획 · 보석 다량', '#ffe08a');
}
/* 보물 몹 이동 — 플레이어 반대 방향 도주 (updateEnemies에서 호출) */
function thiefMove(e, dt, d, dx, dy) {
  e.wob = (e.wob || rand(6)) + dt * 1.3;
  const ax = -dx / d + Math.cos(e.wob) * 0.6, ay = -dy / d + Math.sin(e.wob) * 0.6, m = Math.hypot(ax, ay) || 1;
  let sp = e.speed; if (e.slowT > 0) sp *= 0.55; if (e.frz > 0) sp = 0; if (G.tm.stop > 0) sp = 0;
  e.x += ax / m * sp * dt; e.y += ay / m * sp * dt;
}
function drawCrisisGround(c) {
  const k = G.cr; if (!k) return;
  if (k.type === 'thief' && !k.mob.dead) { const e = k.mob; c.strokeStyle = 'rgba(255,224,138,0.85)'; c.lineWidth = 2; c.beginPath(); c.arc(e.x, e.y, e.r + 8 + Math.sin(G.time * 8) * 2, 0, 7); c.stroke(); }
  if (k.type === 'raid') for (const e of k.mobs) if (!e.dead) { c.strokeStyle = 'rgba(255,150,90,0.6)'; c.lineWidth = 2; c.beginPath(); c.arc(e.x, e.y, e.r + 6, 0, 7); c.stroke(); }
}
