/* ============================================================
   전직 (0.6·0.7) — 전직 제단 · 6직업 고유 규칙 · 궁극기 · 2차 전직 · 직업 전용 무기
   2단계 결정(2026-11-03)
   • 1차 6직업: 근접 전사·도적 / 원거리 궁수·엔지니어 / 마법 마법사·소환사 (3단계에서 10종 확대)
   • 제단: 2번째 페이즈 돌파 후 출현, 3종 중 2종 주력 계열·1종 무작위, 보유 무기 1개 봉헌 시 재호출, 떠나면 다음 페이즈 뒤 재등장
   • 2차 전직: 1차 전직 후 1개 페이즈 돌파 시 3지선다 필수(1종 능력치형), 직업 전용 강화 무기 지급
   • 궁극기: 게이지 충전 후 손 떼고 정지 시 발동, 설정에서 자동 발동 전환
   구조 출처: 초안 0.2l 전직 제단·2차 전직 3지선다 (직업 규칙·궁극기·전용 무기는 본 제작 신규)
   ============================================================ */
const JOBS = {
  warrior: { name: '전사', cat: 'melee', ic: '전', rule: '피격 시 투지 누적, 투지 비례 공격력 증가·받는 피해 감소', ult: '대지 분쇄: 주변 충격파 + 3초 무적' },
  rogue: { name: '도적', cat: 'melee', ic: '도', rule: '쉬지 않고 이동할수록 치명타 확률 증가, 적 사이 근접 통과 시 짧은 무적', ult: '그림자 난무: 2.5초 무적, 주변 적 연속 타격' },
  archer: { name: '궁수', cat: 'ranged', ic: '궁', rule: '같은 적 원거리 명중 시 표식 누적, 5개 누적 시 표식 폭발', ult: '화살비: 3초간 주변에 화살 낙하' },
  engineer: { name: '엔지니어', cat: 'ranged', ic: '엔', rule: '10초마다 포탑 자동 설치 (최대 2), 포탑이 원거리 공격', ult: '포격 지원: 포탑 4개 즉시 설치, 8초간 발사 속도 2배' },
  mage: { name: '마법사', cat: 'magic', ic: '마', rule: '서로 다른 속성 마법을 연달아 맞히면 원소 반응 폭발', ult: '운석: 적 밀집 지점에 큰 폭발' },
  summoner: { name: '소환사', cat: 'magic', ic: '소', rule: '처치한 적 12% 확률로 망령 소환 (최대 6), 망령이 적 추적 공격', ult: '망령 군단: 망령 8체 즉시 소환' },
};
const JOB_ORDER = ['warrior', 'rogue', 'archer', 'engineer', 'mage', 'summoner'];
/* 2차 전직 — 직업마다 변화형 2종 + 능력치형 1종 */
const JOB2 = {
  warrior: [{ k: 'berserk', nm: '광전사', ds: '투지 효과 1.6배, 투지 최대 시 대검 베기 범위 +30%' }, { k: 'guard', nm: '수호기사', ds: '투지 최대 도달 시 최대 체력 25% 보호막 (10초 재사용)' }],
  rogue: [{ k: 'assassin', nm: '암살자', ds: '치명타 피해 2배 → 3배' }, { k: 'dancer', nm: '그림자 무희', ds: '근접 통과 시 주변 적에게 피해' }],
  archer: [{ k: 'sniper', nm: '저격수', ds: '표식 3개로 폭발, 폭발 피해 1.5배' }, { k: 'hunter', nm: '사냥꾼', ds: '표식 폭발 시 주변으로 화살 4발' }],
  engineer: [{ k: 'artillery', nm: '포병', ds: '포탑 최대 4, 포탑 탄환 착탄 폭발' }, { k: 'mechanic', nm: '기계공', ds: '포탑 지속 시간 무제한 (최대 3), 발사 속도 1.5배' }],
  mage: [{ k: 'elemental', nm: '원소술사', ds: '원소 반응 피해 1.7배·범위 1.4배' }, { k: 'archmage', nm: '대마법사', ds: '마법 무기 재사용 -20%' }],
  summoner: [{ k: 'necro', nm: '사령술사', ds: '소환 확률 2배, 망령 최대 10' }, { k: 'lord', nm: '망령 군주', ds: '망령 피해 2배, 크기 증가' }],
};
const JOB2_STAT = { k: 'veteran', nm: '숙련', ds: '최대 체력 +30, 모든 피해 +15%, 이동 속도 +8%' };
/* 직업 전용 강화 무기 (2차 전직 시 지급, 무기 칸 미점유) */
const EXW = {
  warrior: { name: '지진 망치', ic: '망', ds: '2.2초마다 주변 충격파', cd: 2.2, dmg: 26, R: 110 },
  rogue: { name: '독 단검', ic: '단', ds: '0.8초마다 이동 방향 단검 3연발', cd: 0.8, dmg: 10 },
  archer: { name: '관통 장궁', ic: '장', ds: '1.8초마다 무제한 관통 화살', cd: 1.8, dmg: 40 },
  engineer: { name: '지뢰', ic: '뢰', ds: '2.5초마다 발밑 지뢰 설치, 접촉 시 폭발', cd: 2.5, dmg: 34, R: 60 },
  mage: { name: '서리 고리', ic: '서', ds: '주변 냉기 장판: 둔화·지속 피해, 냉기 속성', cd: 0.5, dmg: 6, R: 90 },
  summoner: { name: '영혼 구체', ic: '혼', ds: '1.5초마다 추적 구체 2발', cd: 1.5, dmg: 16 },
};
const JOB_CFG = { altarAfter: 2, altarDist: [170, 240], altarR: 26, altarStay: 0.6, ultNeed: 100, ultKill: 0.12, ultSec: 0.3, job2Min: 60, ultStop: 0.6, ultAutoN: 10, jobCatW: 1.4 };

/* ---------- 주력 계열 ---------- */
function mainCat() {
  const s = { melee: 0, ranged: 0, magic: 0 };
  for (const w of G.p.weapons) s[WEAPONS[w.id].cat] += w.lvl;
  return Object.entries(s).sort((a, b) => b[1] - a[1] || Math.random() - 0.5)[0][0];
}
function jobCands(prev = []) {
  const mc = mainCat(), main = JOB_ORDER.filter(j => JOBS[j].cat === mc), rest = shuffle(JOB_ORDER.filter(j => JOBS[j].cat !== mc));
  const other = rest.find(j => !prev.includes(j)) || rest[0];
  return shuffle(main.concat(other)).map(id => ({ t: 'job', id }));
}

/* ---------- 제단 ---------- */
function altarCheck() {
  const ph = G.ph, p = G.p;
  if (!p.job && ph.i + 1 >= JOB_CFG.altarAfter && ph.i + 1 < ph.order.length) {
    const q = ringAt(JOB_CFG.altarDist[0], JOB_CFG.altarDist[1]);
    G.altar = { x: q.x, y: q.y, r: JOB_CFG.altarR, stay: 0, at: ph.i };
    G.stats.altarSeen++; toast('전직 제단 출현 · 다음 페이즈 끝까지 유지', '#d9a8ff');
  }
  if (p.job && !p.job2 && ph.i >= p.jobAt + 1) G.job2Ready = true;         // 1차 전직 후 1개 페이즈 돌파
}
function updateAltar(dt) {
  const a = G.altar, p = G.p; if (!a) return;
  if (dist2(a.x, a.y, p.x, p.y) < (a.r + p.r) ** 2) { a.stay += dt; if (a.stay >= JOB_CFG.altarStay && STATE.mode === 'play') openAltar(); }
  else a.stay = 0;
}
function openAltar() {
  STATE.mode = 'select'; clearInput(); G.stats.altarOpen++;
  G.sel = { kind: 'job', cards: jobCands(), offer: false };
  renderSelect(); autoLater();
}
function offerWeapon(id) {
  const p = G.p; if (p.weapons.length < 2) return;
  p.weapons = p.weapons.filter(w => w.id !== id); G.stats.offers++;
  recalc();
  G.sel.cards = jobCands(G.sel.cards.map(c => c.id)); G.sel.offer = false;
  toast(`${WEAPONS[id].name} 봉헌`, '#d9a8ff'); renderSelect(); autoLater();
}
function leaveAltar() { G.altar = null; G.sel = null; hideUI(); STATE.mode = 'play'; G.stats.altarLeave++; toast('제단을 떠남 · 다음 페이즈 뒤 재등장', '#bfb6d6'); }
function applyJob(id) {
  const p = G.p; p.job = id; p.jobAt = G.ph.i; p.ult = 50; G.altar = null;
  G.stats.job = id; G.stats.jobAt = Math.round(G.time);
  toast(`${JOBS[id].name} 전직`, '#d9a8ff'); fx({ kind: 'ring', x: p.x, y: p.y, r0: 10, r1: 120, dur: 0.6, color: '#d9a8ff', follow: true });
  recalc();
}
function openJob2() {
  G.pendingJob2 = false; G.job2Ready = false; STATE.mode = 'select'; clearInput();
  const j = G.p.job; G.sel = { kind: 'job2', cards: JOB2[j].concat(JOB2_STAT).map(o => ({ t: 'job2', id: j, k: o.k })) };
  renderSelect(); autoLater();
}
function applyJob2(k) {
  const p = G.p; p.job2 = k; p.exw = { id: p.job, t: 0.5 }; G.stats.job2 = k; G.stats.job2At = Math.round(G.time);
  if (k === 'veteran') { p.vet = true; }
  toast(`2차 전직 · ${(JOB2[p.job].concat(JOB2_STAT)).find(o => o.k === k).nm}`, '#d9a8ff');
  toast(`전용 무기 ${EXW[p.job].name} 획득`, '#ffe08a');
  recalc();
}

/* ---------- 피해·피격 연계 ---------- */
function jobDmgMul(e, o) {
  const p = G.p; let m = 1;
  if (p.job === 'warrior') m *= 1 + 0.4 * (p.job2 === 'berserk' ? 1.6 : 1) * p.fury / 100;
  let cc = 0, cm = 2;
  if (pBr('might') === 'crit') cc += 0.15;
  if (p.job === 'rogue') { cc += Math.min(0.35, 0.05 + G.tm.run * 0.075); if (p.job2 === 'assassin') cm = 3; }
  if (cc && Math.random() < cc) { m *= cm; o.crit = true; }
  if (pBr('might') === 'pen' && (e.r >= 16 || e.elite || e.cmd)) m *= 1.25;
  return m;
}
const ELEM = { fireball: 'fire', fireball_pool: 'fire', flame: 'fire', firefield: 'fire', lightning: 'bolt', chain: 'bolt', thunder: 'bolt', frost: 'ice', meteor: 'fire' };
const RANGED_SRC = { arrow: 1, split: 1, boomerang: 1, longbow: 1, turret: 1, dagger: 1, rain: 1 };
function onEnemyHit(e, o) {
  const p = G.p, src = o.src;
  if (src === 'arrow' && hasRelic('thunderarrow') && Math.random() < 0.2) chainBolt(e, 2, WEAPONS.lightning.base.dmg * 0.5 * p.mod.dmg, 'thunder');
  if (!p.job || e.dead) return;
  if (p.job === 'archer' && RANGED_SRC[src]) {
    e.mk = (e.mk || 0) + 1; const need = p.job2 === 'sniper' ? 3 : 5;
    if (e.mk >= need) { e.mk = 0; markBurst(e); }
  }
  if (p.job === 'mage') {
    const el = ELEM[src]; if (!el) return;
    if (e.el && e.el !== el && G.time - e.elT < 2 && !(e.rcT > G.time)) { e.rcT = G.time + 1; reaction(e); }
    e.el = el; e.elT = G.time;
  }
}
function onEnemyKill(e) {
  const p = G.p; if (!p.job) return;
  ultGain(JOB_CFG.ultKill);
  if (p.job === 'summoner' && !e.minionOf) {
    const cap = p.job2 === 'necro' ? 10 : 6, ch = p.job2 === 'necro' ? 0.24 : 0.12;
    if (G.minions.length < cap && Math.random() < ch) addMinion(e.x, e.y);
  }
}
function playerHurtMul() {
  const p = G.p; let m = 1;
  if (p.job === 'warrior') m *= 1 - 0.3 * p.fury / 100;
  return m;
}
/* 피격 직전 판정: true 반환 시 피해 무효 */
function playerAvoid() {
  const p = G.p, T = G.tm;
  if (T.inv > 0) return true;
  if (p.shield) { p.shield = false; G.tm.shield = 12; fx({ kind: 'ring', x: p.x, y: p.y, r0: 10, r1: 34, dur: 0.3, color: '#8fd0ff', follow: true }); p.invT = CFG.player.invuln; return true; }
  if (pBr('swift') === 'dodge' && Math.random() < 0.2) { p.invT = 0.3; fx({ kind: 'ring', x: p.x, y: p.y, r0: 8, r1: 26, dur: 0.25, color: '#c8ffd8', follow: true }); return true; }
  return false;
}
function onPlayerHurt() {
  const p = G.p;
  if (p.job === 'warrior') {
    p.fury = Math.min(100, p.fury + 20); G.tm.furyHold = 3;
    if (p.fury >= 100 && p.job2 === 'guard' && G.tm.guard <= 0) { G.tm.guard = 10; p.shield = true; }
  }
}

/* ---------- 효과 함수 ---------- */
function chainBolt(from, n, dmg, src) {
  const hit = new Set([from.id]); let cur = from;
  for (let i = 0; i < n; i++) {
    let best = null, bd = 120 * 120;
    gridQuery(cur.x, cur.y, 120, e => { if (hit.has(e.id)) return; const d = dist2(e.x, e.y, cur.x, cur.y); if (d < bd) { bd = d; best = e; } });
    if (!best) break; hit.add(best.id);
    fx({ kind: 'zap', x: cur.x, y: cur.y, x2: best.x, y2: best.y, dur: 0.15 });
    damageEnemy(best, dmg, { src }); cur = best;
  }
}
function markBurst(e) {
  const p = G.p, k = p.job2 === 'sniper' ? 1.5 : 1, dmg = (25 + p.level * 2) * p.mod.dmg * k;
  fx({ kind: 'ring', x: e.x, y: e.y, r0: 6, r1: 46, dur: 0.25, color: '#b8ff9a' });
  gridQuery(e.x, e.y, 46, t => damageEnemy(t, dmg, { src: 'mark' }));
  if (p.job2 === 'hunter') for (let i = 0; i < 4; i++) shoot({ kind: 'arrow', x: e.x, y: e.y, ang: i * Math.PI / 2 + Math.PI / 4, sp: 480, r: 5, dmg: dmg * 0.5, pierce: 1, life: 0.6, color: '#b8ff9a', src: 'mark' });
}
function reaction(e) {
  const p = G.p, el = p.job2 === 'elemental', R = 52 * (el ? 1.4 : 1), dmg = (16 + p.level * 1.2) * p.mod.dmg * (el ? 1.7 : 1);
  fx({ kind: 'ring', x: e.x, y: e.y, r0: 8, r1: R, dur: 0.3, color: '#e8b0ff', fill: true });
  gridQuery(e.x, e.y, R, t => damageEnemy(t, dmg, { src: 'react' }));
}
function addMinion(x, y) { G.stats.maxMinions = Math.max(G.stats.maxMinions || 0, G.minions.length + 1); G.minions.push({ x, y, r: G.p.job2 === 'lord' ? 9 : 7, life: 20, hitT: 0 }); }

/* ---------- 궁극기 ---------- */
function ultGain(v) { const p = G.p; if (!p.job || p.ult >= JOB_CFG.ultNeed) return; p.ult = Math.min(JOB_CFG.ultNeed, p.ult + v); if (p.ult >= JOB_CFG.ultNeed) { G.tm.readyAt = G.time; toast('궁극기 준비 · 손 떼고 정지', '#ffe08a'); } }
function ultReady() { return G.p.job && G.p.ult >= JOB_CFG.ultNeed; }
function useUlt() {
  const p = G.p, j = p.job, D = (60 + p.level * 4) * p.mod.dmg;
  p.ult = 0; G.stats.ults++; G.tm.stopT = 0;
  toast(JOBS[j].ult.split(':')[0], '#ffe08a');
  if (j === 'warrior') { G.tm.inv = 3; fx({ kind: 'ring', x: p.x, y: p.y, r0: 10, r1: 170, dur: 0.5, color: '#ffb070', fill: true }); gridQuery(p.x, p.y, 170, e => damageEnemy(e, D, { src: 'ult', kb: 420, fx: p.x, fy: p.y })); }
  if (j === 'rogue') { G.tm.inv = 2.5; G.tm.dance = 2.5; }
  if (j === 'archer') G.tm.rain = 3;
  if (j === 'engineer') { for (let i = 0; i < 4; i++) addTurret(p.x + Math.cos(i * 1.57 + 0.78) * 40, p.y + Math.sin(i * 1.57 + 0.78) * 40, true); G.tm.overdrive = 8; }
  if (j === 'mage') {
    let best = null, bn = -1;
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, cx = p.x + Math.cos(a) * 110, cy = p.y + Math.sin(a) * 110; let n = 0; gridQuery(cx, cy, 140, () => { n++; }); if (n > bn) { bn = n; best = { x: cx, y: cy }; } }
    const c = best || p; fx({ kind: 'ring', x: c.x, y: c.y, r0: 20, r1: 180, dur: 0.6, color: '#ff7a3a', fill: true });
    gridQuery(c.x, c.y, 180, e => damageEnemy(e, D * 2, { src: 'ult', kb: 300, fx: c.x, fy: c.y }));
  }
  if (j === 'summoner') for (let i = 0; i < 8; i++) addMinion(p.x + Math.cos(i) * 30, p.y + Math.sin(i) * 30);
}
function autoUltSetting() { return SETTINGS.autoUlt || (STATE.dev.auto && G.ai && G.ai.autoUlt); }
function updateUlt(dt) {
  const p = G.p; if (!p.job) return;
  ultGain(JOB_CFG.ultSec * dt);
  if (!ultReady()) { G.tm.stopT = 0; return; }
  if (autoUltSetting()) { let n = 0; gridQuery(p.x, p.y, 200, () => { n++; }); if (n >= JOB_CFG.ultAutoN || G.time - G.tm.readyAt > 12) useUlt(); return; }
  // 정지 입력: 조이스틱에서 손을 뗀 채(이동 입력 없음) 일정 시간 정지 시 발동
  if (!p.moving && !INPUT.active) { G.tm.stopT += dt; if (G.tm.stopT >= JOB_CFG.ultStop) useUlt(); }
  else G.tm.stopT = 0;
}

/* ---------- 포탑·망령 ---------- */
function addTurret(x, y, temp) {
  const p = G.p, cap = p.job2 === 'artillery' ? 4 : p.job2 === 'mechanic' ? 3 : 2;
  if (!temp) while (G.turrets.filter(t => !t.temp).length >= cap) { const i = G.turrets.findIndex(t => !t.temp); G.turrets.splice(i, 1); }
  G.turrets.push({ x, y, t: 0.3, life: temp ? 10 : (p.job2 === 'mechanic' ? 1e9 : 20), temp });
}
function turretDmg() { const p = G.p; let d = 10 * p.mod.dmg; for (const w of p.weapons) if (WEAPONS[w.id].cat === 'ranged') d = Math.max(d, wStats(w).dmg * 0.6); return d; }
function updateTurrets(dt) {
  const p = G.p;
  if (p.job === 'engineer') { G.tm.turret -= dt; if (G.tm.turret <= 0) { G.tm.turret = 10; addTurret(p.x, p.y); } }
  const rate = (p.job2 === 'mechanic' ? 1.5 : 1) * (G.tm.overdrive > 0 ? 2 : 1);
  for (const t of G.turrets) {
    t.life -= dt; t.t -= dt * rate;
    if (t.t <= 0) {
      t.t = 0.8; const e = nearestEnemy(t.x, t.y, 360);
      if (e) { const a = Math.atan2(e.y - t.y, e.x - t.x); t.a = a; shoot({ kind: p.job2 === 'artillery' ? 'shell' : 'arrow', x: t.x, y: t.y, ang: a, sp: 520, r: 4, dmg: turretDmg(), pierce: 0, life: 0.8, R: 30, color: '#ffd890', src: 'turret' }); }
    }
  }
  G.turrets = G.turrets.filter(t => t.life > 0);
}
function updateMinions(dt) {
  const p = G.p, k = p.job2 === 'lord' ? 2 : 1, dmg = 8 * k * p.mod.dmg;
  for (const m of G.minions) {
    m.life -= dt; m.hitT -= dt;
    const e = nearestEnemy(m.x, m.y, 300);
    const tx = e ? e.x : p.x + 30, ty = e ? e.y : p.y, dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy) || 1;
    if (d > 4) { m.x += dx / d * 170 * dt; m.y += dy / d * 170 * dt; }
    if (e && m.hitT <= 0 && d < e.r + m.r + 2) { m.hitT = 0.5; damageEnemy(e, dmg, { src: 'minion' }); }
  }
  G.minions = G.minions.filter(m => m.life > 0);
}

/* ---------- 직업 전용 무기 ---------- */
function updateExw(dt) {
  const p = G.p, x = p.exw; if (!x) return;
  const D = EXW[x.id], dm = D.dmg * p.mod.dmg;
  x.t -= dt / p.mod.cd; if (x.t > 0) return; x.t = D.cd;
  if (x.id === 'warrior') { fx({ kind: 'ring', x: p.x, y: p.y, r0: 10, r1: D.R, dur: 0.3, color: '#d8a070', fill: true }); gridQuery(p.x, p.y, D.R, e => damageEnemy(e, dm, { src: 'quake', kb: 160, fx: p.x, fy: p.y })); }
  if (x.id === 'rogue') { const a0 = Math.atan2(p.face.y, p.face.x); for (let i = 0; i < 3; i++) shoot({ kind: 'arrow', x: p.x, y: p.y, ang: a0 + (i - 1) * 0.18, sp: 560, r: 4, dmg: dm, pierce: 1, life: 0.7, color: '#b0f0a0', src: 'dagger' }); }
  if (x.id === 'archer') shoot({ kind: 'arrow', x: p.x, y: p.y, ang: aimAng(), sp: 700, r: 7, dmg: dm, pierce: 99, life: 1.0, color: '#fff6a0', src: 'longbow' });
  if (x.id === 'engineer') { if (G.mines.length < 8) G.mines.push({ x: p.x, y: p.y, r: 10, arm: 0.5 }); }
  if (x.id === 'mage') { gridQuery(p.x, p.y, D.R, e => { e.slowT = 0.6; damageEnemy(e, dm, { src: 'frost' }); }); }
  if (x.id === 'summoner') for (let i = 0; i < 2; i++) shoot({ kind: 'orb', x: p.x, y: p.y, ang: rand(Math.PI * 2), sp: 260, r: 6, dmg: dm, pierce: 0, life: 2.2, color: '#c8a8ff', src: 'orb', home: true });
}
function updateMines(dt) {
  const D = EXW.engineer, dm = D.dmg * G.p.mod.dmg;
  for (const m of G.mines) {
    m.arm -= dt; if (m.arm > 0) continue;
    let hit = false; gridQuery(m.x, m.y, m.r, () => { hit = true; return false; });
    if (hit) { m.dead = true; explode(m.x, m.y, D.R, dm, 'mine', '#ffcf70'); }
  }
  G.mines = G.mines.filter(m => !m.dead);
}

/* ---------- 직업 갱신 (매 틱) ---------- */
function updateJob(dt) {
  const p = G.p, T = G.tm;
  if (G.job2Ready && !p.job2 && G.time - G.stats.jobAt >= JOB_CFG.job2Min) { G.job2Ready = false; G.pendingJob2 = true; }   // 최소 60초 경과 후
  for (const k of ['inv', 'dance', 'rain', 'overdrive', 'guard', 'passCd']) if (T[k] > 0) T[k] -= dt;
  if (p.job === 'warrior') { if (T.furyHold > 0) T.furyHold -= dt; else p.fury = Math.max(0, p.fury - 4 * dt); }
  if (p.job === 'rogue') {
    T.run = p.moving ? Math.min(4, T.run + dt) : Math.max(0, T.run - dt * 3);
    if (p.moving && T.passCd <= 0) {
      let n = 0; gridQuery(p.x, p.y, p.r + 10, () => { n++; });
      if (n >= 2) { T.passCd = 1.5; p.invT = Math.max(p.invT, 0.25); G.stats.passes++;
        if (p.job2 === 'dancer') { const d = (14 + p.level) * p.mod.dmg; gridQuery(p.x, p.y, 60, e => damageEnemy(e, d, { src: 'dance' })); fx({ kind: 'ring', x: p.x, y: p.y, r0: 6, r1: 60, dur: 0.25, color: '#b0f0a0', follow: true }); } }
    }
    if (T.dance > 0) { T.danceT = (T.danceT || 0) - dt; if (T.danceT <= 0) { T.danceT = 0.15; const ts = shuffle(enemiesInRange(p.x, p.y, 160)).slice(0, 4), d = (30 + p.level * 2) * p.mod.dmg; for (const e of ts) { fx({ kind: 'pop', x: e.x, y: e.y, r: 8, color: '#202030', dur: 0.15 }); damageEnemy(e, d, { src: 'ult' }); } } }
  }
  if (T.rain > 0) { T.rainT = (T.rainT || 0) - dt; if (T.rainT <= 0) { T.rainT = 0.1; const q = ringAt(0, 200), d = (24 + p.level * 1.5) * p.mod.dmg; fx({ kind: 'ring', x: q.x, y: q.y, r0: 4, r1: 40, dur: 0.2, color: '#d8ffc8' }); gridQuery(q.x, q.y, 40, e => damageEnemy(e, d, { src: 'ult' })); } }
  updateTurrets(dt); updateMinions(dt); updateMines(dt); updateExw(dt); updateUlt(dt);
}
