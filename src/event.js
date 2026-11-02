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
  ph.order.forEach((id, i) => { if (i > 0 && PHASES[id].type !== '기믹형' && PHASES[id].type !== '보스' && id !== 'camp') idx.push(i); });
  const n = Math.min(idx.length, Math.random() < 0.5 ? EV_CFG.perRun[0] : EV_CFG.perRun[1]);
  const at = shuffle(idx).slice(0, n).sort((a, b) => a - b), types = shuffle(Object.keys(EVENTS));
  G.ev = { plan: at.map((i, k) => ({ i, type: types[k], at: rand(EV_CFG.at[0], EV_CFG.at[1]) })), cur: null, log: [] };
}
function eventPaused() { const c = G.ev && G.ev.cur; return !!(c && c.state === 'active'); }
function eventSpawnMul() { const c = G.ev && G.ev.cur; return c && c.state === 'active' && c.type === 'cave' ? EV_CFG.caveSpawn : 1; }
function hasCurse(k) { return G.p.curses && G.p.curses.includes(k); }
function eventPointer() { const c = G.ev && G.ev.cur; if (!c) return null; if (c.type === 'giant' && c.mob && !c.mob.dead) return c.state === 'idle' ? c : null; return c.state === 'idle' ? c : null; }

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
  if (c.mob && !c.mob.dead && outcome !== 'ok') c.mob.dead = true;
  G.ev.cur = null;
}
function updateEvent(dt) {
  const E = G.ev, ph = G.ph, p = G.p; if (!E) return;
  if (!E.cur) {
    const pl = E.plan[0];
    if (pl && pl.i < ph.i) E.plan.shift();                            // 해당 페이즈를 지나침 (조기 종료 등)
    else if (pl && pl.i === ph.i && !ph.inGap) { const P = curPhase(), span = P.dur || P.fail || 120; if (ph.t >= span * pl.at) { E.plan.shift(); eventSpawn(pl); } }
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
  if (c.id === 'rest') { p.hp = p.maxHp; toast('휴식 · 체력 전부 회복', '#8ff0b0'); }
  if (c.id === 'train') { G.pendingLv += 2; toast('수련 · 레벨 업 2회', '#7fe0ff'); }
  if (c.id === 'supply') { G.pendingChest++; }
}

/* 지면 표시 */
function drawEventGround(c) {
  const E = G.ev, v = E && E.cur; if (!v || v.state === 'done') return;
  if (v.type === 'cave') {
    c.fillStyle = v.state === 'active' ? 'rgba(20,30,40,0.55)' : 'rgba(20,30,40,0.8)'; c.beginPath(); c.ellipse(v.x, v.y, v.r + 6, v.r, 0, 0, 7); c.fill();
    c.strokeStyle = '#7fe0ff'; c.lineWidth = 2; c.stroke();
    if (v.state === 'idle' && v.stay > 0) { c.strokeStyle = '#e8f8ff'; c.lineWidth = 4; c.beginPath(); c.arc(v.x, v.y, v.r + 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * v.stay / EV_CFG.caveEnter); c.stroke(); }
    if (v.state === 'active') { c.strokeStyle = '#ffd24a'; c.lineWidth = 4; c.beginPath(); c.arc(v.x, v.y, v.r + 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * v.act / EV_CFG.caveDur); c.stroke(); }
  }
  if (v.type === 'door') {
    c.fillStyle = 'rgba(200,160,255,0.15)'; c.beginPath(); c.arc(v.x, v.y, v.r + 8, 0, 7); c.fill();
    c.fillStyle = '#4a3a5a'; c.fillRect(v.x - 13, v.y - 22, 26, 30); c.strokeStyle = '#c8a0ff'; c.lineWidth = 2; c.strokeRect(v.x - 13, v.y - 22, 26, 30);
    if (v.stay > 0) { c.strokeStyle = '#f0e0ff'; c.lineWidth = 4; c.beginPath(); c.arc(v.x, v.y, v.r + 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * v.stay / EV_CFG.doorStay); c.stroke(); }
  }
  if (v.type === 'giant' && v.mob && v.mob.sleep && !v.mob.dead) {
    c.fillStyle = '#fff'; c.font = 'bold 14px system-ui'; c.textAlign = 'center'; c.fillText('Z', v.mob.x + 26, v.mob.y - 30 + Math.sin(G.time * 2) * 4);
  }
}
