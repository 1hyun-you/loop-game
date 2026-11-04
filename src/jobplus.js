/* ============================================================
   직업 개편 (0.26, 표현·보강 단계)
   — 전직 체감: 직업 색 옷·발밑 문양·전직 알림판, 공용 무기 직업 변환(이름·효과·색)
   — 드루이드 야수 동료(늑대·곰), 시간술사 궁극기 '과거의 나'(되감기 잔상)
   — 회차 25 결정(2026-11-03) 반영
   ============================================================ */
const JOB_COL = { warrior: '#ff8a5a', rogue: '#7fe0c0', sovereign: '#ffd24a', archer: '#b8ff9a', engineer: '#ffd890', chrono: '#c8c0ff', mage: '#e8b0ff', summoner: '#b89cff', priest: '#fff2a8', druid: '#7fd07a' };
/* 공용 무기 직업 변환: 전직 계열과 같은 계열 무기에 접두어·추가 효과·직업 색 부여 */
const JOB_WX = {
  warrior: { pre: '투지의', ds: '명중 시 투지 +1' },
  rogue: { pre: '그림자', ds: '명중 시 8% 확률 그림자 일격 (피해 60%)' },
  sovereign: { pre: '왕실', ds: '명중 시 6% 확률 금빛 충격 (주변 피해 50%)' },
  archer: { pre: '사냥꾼의', ds: '명중 시 25% 확률 표식 2개 누적' },
  engineer: { pre: '개조', ds: '명중 시 10% 확률 소형 폭발 (피해 40%)' },
  chrono: { pre: '시간', ds: '명중 시 10% 확률 0.5초 뒤 같은 피해 재적용' },
  mage: { pre: '원소', ds: '명중 시 8% 확률 원소 파편 폭발 (피해 50%)' },
  summoner: { pre: '영혼', ds: '이 무기로 처치 시 망령 소환 확률 +12%' },
  priest: { pre: '신성', ds: '이 무기로 처치 시 정화 누적 +1 추가' },
  druid: { pre: '야생', ds: '명중한 적을 동료가 우선 공격' },
};
/* 피해원 → 무기 계열 (공용 무기 발생분만) */
const SRC_CAT = { cleave: 'melee', spin: 'melee', shield: 'melee', slam: 'melee', fissure: 'melee', arrow: 'ranged', split: 'ranged', boomerang: 'ranged', knife: 'ranged', trap: 'ranged', fireball: 'magic', fireball_pool: 'magic', lightning: 'magic', chain: 'magic', icering: 'magic', mbolt: 'magic', nova: 'magic' };
const wxOn = cat => !!G.p.job && jobCat(cat);
const wxSrc = src => { const c = SRC_CAT[src]; return c && wxOn(c); };
function wName(id) { const d = WEAPONS[id]; return wxOn(d.cat) ? JOB_WX[G.p.job].pre + ' ' + d.name : d.name; }
function jobTint(cat) { return wxOn(cat) ? JOB_COL[G.p.job] : null; }

function jobWeaponHit(e, o) {
  const p = G.p, j = p.job, src = o.src;
  if (e.dead || !wxSrc(src)) return;
  const base = o.dmg0 || 0;
  if (j === 'warrior') { p.fury = Math.min(100, p.fury + 1); G.tm.furyHold = Math.max(G.tm.furyHold || 0, 1); }
  if (j === 'rogue' && Math.random() < 0.08 && base) { fx({ kind: 'pop', x: e.x, y: e.y, r: 9, color: '#203040', dur: 0.18 }); G.later.push({ t: 0.08, f: () => damageEnemy(e, base * 0.6, { src: 'wx' }) }); }
  if (j === 'sovereign' && Math.random() < 0.06 && base) { const x = e.x, y = e.y; G.later.push({ t: 0, f: () => explode(x, y, 44, base * 0.5, 'wx', '#ffd24a') }); }
  if (j === 'archer' && Math.random() < 0.25) e.mk = (e.mk || 0) + 1;
  if (j === 'engineer' && Math.random() < 0.1 && base) { const x = e.x, y = e.y; G.later.push({ t: 0, f: () => explode(x, y, 32, base * 0.4, 'wx', '#ffd890') }); }
  if (j === 'chrono' && Math.random() < 0.1 && base) { fx({ kind: 'ring', x: e.x, y: e.y, r0: 4, r1: 18, dur: 0.5, color: '#c8c0ff' }); G.later.push({ t: 0.5, f: () => damageEnemy(e, base, { src: 'wx' }) }); }
  if (j === 'mage' && Math.random() < 0.08 && base) { const x = e.x, y = e.y, col = { ice: '#bfe8ff', fire: '#ff9a4a', bolt: '#bfe4ff', arcane: '#d0b8ff' }[ELEM[src]] || '#e8b0ff'; G.later.push({ t: 0, f: () => explode(x, y, 36, base * 0.5, 'wx', col) }); }
  if (j === 'druid') p.petMark = e;
}
/* 처치 시 변환 효과 (소환사·프리스트) */
function jobWeaponKill(e) {
  const p = G.p; if (!wxSrc(e.ls)) return;
  if (p.job === 'summoner' && !e.minionOf && G.minions.length < (p.job2 === 'necro' ? 10 : 6) && Math.random() < 0.12) addMinion(e.x, e.y);
  if (p.job === 'priest') p.holy++;
}

/* ---------- 전직 연출 ---------- */
function jobCeremony(id, second) {
  const p = G.p, col = JOB_COL[id];
  if (second) { const o = JOB2[id].concat(JOB2_STAT).find(x => x.k === p.job2); banner('2차 전직 · ' + o.nm, '전용 무기 ' + EXW[id].name + ' 획득', col, 2.2); }
  else { banner(JOBS[id].name + ' 전직', '전용 무기 ' + EXW1[id].name + ' 획득', col, 2.2); toast(JOBS[id].rule.split(',')[0], col); }
  sfx('ult'); shake(4, 0.3); rcBig(col, 0.4);               // 3등급 반응 (0.28)
  fx({ kind: 'ring', x: p.x, y: p.y, r0: 10, r1: 150, dur: 0.7, color: col, fill: true, follow: true });
  fx({ kind: 'ring', x: p.x, y: p.y, r0: 40, r1: 220, dur: 0.9, color: '#ffffff', follow: true });
  sparkBurst(p.x, p.y, 120, col);
  const n = p.weapons.filter(w => wxOn(WEAPONS[w.id].cat)).length;
  if (!second && n) toast(`공용 무기 ${n}종 ${JOB_WX[id].pre} 무기로 변환`, col);
}
/* 발밑 직업 문양 (그림자 위, 주인공 아래) */
function drawJobAura(c) {
  const p = G.p; if (!p.job) return;
  const col = JOB_COL[p.job], t = G.time, y = p.y + p.r * 0.85, pulse = 0.55 + 0.25 * Math.sin(t * 3);
  c.globalAlpha = pulse; c.strokeStyle = col; c.lineWidth = 2;
  c.beginPath(); c.ellipse(p.x, y, p.r + 7, (p.r + 7) * 0.38, 0, 0, 7); c.stroke();
  if (p.job2) {                                              // 2차: 회전하는 점선 고리
    c.globalAlpha = 0.8; c.fillStyle = col;
    for (let i = 0; i < 6; i++) { const a = t * 1.6 + i * Math.PI / 3; c.fillRect(p.x + Math.cos(a) * (p.r + 12) - 1.5, y + Math.sin(a) * (p.r + 12) * 0.38 - 1.5, 3, 3); }
  }
  c.globalAlpha = 1;
}
/* 주인공 옷 색: 기본 색일 때만 직업 색 적용 (칭호 색상 변형 우선) */
function heroTint() { const base = playerColor(); return G.p.job && base === COLORS[0].c ? JOB_COL[G.p.job] : base; }

/* ---------- 드루이드 야수 동료 ---------- */
const PET = {
  wolf: { name: '늑대', sp: 235, dmg: 9, atk: 0.55, sk: 8, skR: 120, r: 9, ic: '늑' },
  bear: { name: '곰', sp: 150, dmg: 24, atk: 1.15, sk: 10, skR: 90, r: 12, ic: '곰' },
};
function petMul() { const p = G.p; return { dmg: p.mod.dmg * (1 + p.level * 0.04) * (G.tm.wrath > 0 ? 2 : 1) * (p.vet ? 1 : 1), sp: p.mod.speed, area: 1 + PASSIVES.area.per * passLv('area'), cd: p.mod.cd / (G.tm.wrath > 0 ? 1.5 : 1) }; }
function petStat(kind) {
  const D = PET[kind], M = petMul(), big = kind === 'bear' && G.p.job2 === 'ursa' ? 1.5 : 1, B = bondOf(kind), L = B.lv - 1, h = k => bondHas(kind, k);
  const lvDmg = 1 + BOND_CFG.dmgPer * L, lvAtk = Math.max(0.75, 1 - BOND_CFG.atkPer * L), lvR = Math.min(1.3, 1 + BOND_CFG.rPer * L);
  const dm = (h('titan') ? 1.5 : 1), spd = h('swift') ? 1.25 : 1;
  return { dmg: D.dmg * M.dmg * big * lvDmg * dm, sp: D.sp * M.sp * spd, atk: D.atk * M.cd * lvAtk / spd, sk: D.sk * M.cd * (h('rampage') ? 0.6 : 1),
    skR: D.skR * M.area * (big > 1 ? 1.4 : 1) * (1 + 0.02 * L) * (h('howl2') ? 1.25 : h('quake') ? 1.35 : 1), r: D.r * (big > 1 ? 1.3 : 1) * lvR * (h('titan') ? 1.25 : 1), lv: B.lv };
}
/* 0.26a 유대 성장: 늑대·곰 종류별 레벨, 동료 처치·플레이어 레벨업으로 경험치, 5·10·15레벨 전용 능력 2지선다 */
const BOND_CFG = { xpBase: 6, xpPer: 6, kill: 1, eliteKill: 6, share: 2, dmgPer: 0.05, atkPer: 0.015, rPer: 0.02, maxLv: 20, tiers: [5, 10, 15] };
const BOND_PERKS = {
  wolf: [
    [{ k: 'bleed', nm: '찢는 이빨', ds: '물린 적 3초간 출혈 (초당 늑대 피해 40%)' }, { k: 'swift', nm: '바람 발', ds: '늑대 이동·공격 속도 +25%' }],
    [{ k: 'howl2', nm: '긴 울음', ds: '울부짖음 범위 +25%, 둔화된 적이 받는 모든 피해 +20% (울부짖음 자체 피해 감소)' }, { k: 'litter', nm: '새 식구', ds: '늑대 1마리 합류' }],
    [{ k: 'alpha', nm: '우두머리의 함성', ds: '울부짖음 때 주인 공격력·이동 속도 4초간 +20%' }, { k: 'frenzy', nm: '사냥 광란', ds: '늑대가 적 처치 시 울부짖음 재사용 1초 단축' }],
  ],
  bear: [
    [{ k: 'thorn', nm: '가시 털', ds: '곰 주변 적에게 1초마다 곰 피해 50%' }, { k: 'quake', nm: '넓은 강타', ds: '강타 범위 +35%' }],
    [{ k: 'after', nm: '대지 울림', ds: '강타 0.5초 뒤 같은 자리에 2차 충격 (피해 60%)' }, { k: 'guard', nm: '보호 본능', ds: '강타마다 주인 체력 2 회복' }],
    [{ k: 'titan', nm: '거대 곰', ds: '곰 피해 +50%·몸집 +25%' }, { k: 'rampage', nm: '난폭', ds: '강타 재사용 대기 40% 단축' }],
  ],
};
function bondOf(kind) { G.bond = G.bond || {}; return G.bond[kind] || (G.bond[kind] = { lv: 1, xp: 0, perks: [] }); }
function bondHas(kind, k) { const b = G.bond && G.bond[kind]; return !!(b && b.perks.includes(k)); }
function bondNeed(lv) { return BOND_CFG.xpBase + BOND_CFG.xpPer * lv; }
function bondXp(kind, v) {
  if (G.p.job !== 'druid' || !G.pets.some(m => m.kind === kind)) return;
  const B = bondOf(kind); if (B.lv >= BOND_CFG.maxLv) return; B.xp += v;
  while (B.lv < BOND_CFG.maxLv && B.xp >= bondNeed(B.lv)) {
    B.xp -= bondNeed(B.lv); B.lv++;
    for (const m of G.pets) if (m.kind === kind) { m.lvT = 1.2; fx({ kind: 'ring', x: m.x, y: m.y, r0: 6, r1: 34, dur: 0.4, color: '#a8e08a' }); }
    const ti = BOND_CFG.tiers.indexOf(B.lv);
    if (ti >= 0) { (G.pendingBond = G.pendingBond || []).push({ kind, ti }); toast(`${PET[kind].name} 유대 Lv ${B.lv} · 전용 능력 선택`, '#a8e08a'); }
    G.stats.bond = G.stats.bond || {}; G.stats.bond[kind] = B.lv;
  }
}
function bondShareLevel() { if (G.p.job === 'druid') for (const k of ['wolf', 'bear']) bondXp(k, BOND_CFG.share); }
function openBond() {
  const q = G.pendingBond.shift(); STATE.mode = 'select'; clearInput();
  G.sel = { kind: 'bond', q, cards: BOND_PERKS[q.kind][q.ti].map(o => ({ t: 'bond', id: q.kind, k: o.k })) };
  renderSelect(); autoLater();
}
function applyBond(c) {
  const B = bondOf(c.id); B.perks.push(c.k); (G.stats.bondPicks = G.stats.bondPicks || []).push(c.id + ':' + c.k);
  if (c.k === 'litter') addPet('wolf');
  toast(`${PET[c.id].name} · ${bondPerk(c.k).nm}`, '#a8e08a');
}
function bondPerk(k) { for (const kind in BOND_PERKS) for (const t of BOND_PERKS[kind]) for (const o of t) if (o.k === k) return o; return null; }
function updateBleeds(dt) {
  if (!G.bleeds || !G.bleeds.length) return;
  for (const b of G.bleeds) { b.t -= dt; b.tick -= dt; if (b.tick <= 0 && !b.e.dead) { b.tick = 0.5; b.e.lpk = 'wolf'; damageEnemy(b.e, b.d * 0.5, { src: 'pet' }); } }
  G.bleeds = G.bleeds.filter(b => b.t > 0 && !b.e.dead);
}
function addPet(kind) { const p = G.p, a = rand(Math.PI * 2); G.pets.push({ kind, x: p.x + Math.cos(a) * 30, y: p.y + Math.sin(a) * 30, t: 0.5, sk: PET[kind].sk * 0.5, tg: null, vx: 0, i: G.pets.length }); }
function petsInit() { G.pets = []; G.bond = {}; G.bleeds = []; G.pendingBond = []; addPet('wolf'); addPet('bear'); }
function updatePets(dt) {
  const p = G.p; if (p.job !== 'druid') return;
  updateBleeds(dt);
  const claimed = new Set();
  for (const m of G.pets) {
    const S = petStat(m.kind); m.t -= dt; m.sk -= dt;
    // 표적: 야생 변환 표식 → 기존 표적 유지 → 플레이어 주변 미점유 적
    if (p.petMark && !p.petMark.dead && dist2(p.petMark.x, p.petMark.y, p.x, p.y) < 300 * 300 && !claimed.has(p.petMark.id)) m.tg = p.petMark;
    if (m.tg && (m.tg.dead || dist2(m.tg.x, m.tg.y, p.x, p.y) > 320 * 320)) m.tg = null;
    if (!m.tg) { let best = null, bd = 260 * 260; gridQuery(p.x, p.y, 260, e => { if (claimed.has(e.id)) return; const d = dist2(e.x, e.y, m.x, m.y) * (m.kind === 'bear' && (e.elite || e.gk) ? 0.4 : 1); if (d < bd) { bd = d; best = e; } }); m.tg = best; }
    if (m.tg) claimed.add(m.tg.id);
    const e = m.tg, leash = dist2(m.x, m.y, p.x, p.y) > 300 * 300;
    const tx = e && !leash ? e.x : p.x + Math.cos(m.i * 2.4 + G.time * 0.6) * 36, ty = e && !leash ? e.y : p.y + Math.sin(m.i * 2.4 + G.time * 0.6) * 36;
    const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy) || 1, reach = e ? e.r + S.r : 4;
    if (d > reach) { const v = Math.min(d - reach, S.sp * (leash ? 1.6 : 1) * dt); m.x += dx / d * v; m.y += dy / d * v; m.vx = dx; }
    for (const o of G.pets) if (o !== m) { const ox = m.x - o.x, oy = m.y - o.y, od = Math.hypot(ox, oy); if (od > 0 && od < 16) { m.x += ox / od * (16 - od) * 0.5; m.y += oy / od * (16 - od) * 0.5; } }
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
        if (p.job2 === 'ursa') heal(1); if (bondHas('bear', 'guard')) heal(2);
        if (bondHas('bear', 'after')) (G.petLater = G.petLater || []).push({ t: G.time + 0.5, x, y, R, d: dm * 1.5 });
      }
    }
  }
  if (G.petLater && G.petLater.length) G.petLater = G.petLater.filter(u => { if (G.time < u.t) return true; gridQuery(u.x, u.y, u.R, t => { t.lpk = 'bear'; damageEnemy(t, u.d, { src: 'maul', kb: 140, fx: u.x, fy: u.y }); }); fx({ kind: 'ring', x: u.x, y: u.y, r0: 10, r1: u.R, dur: 0.3, color: '#e0b080' }); return false; });
  if (p.petMark && p.petMark.dead) p.petMark = null;
}
function petKilled(e) {
  const own = e.lpk && (e.ls === 'pet' || e.ls === 'howl' || e.ls === 'maul');
  if (G.p.job2 === 'pack' && e.ls === 'pet') for (const m of G.pets) if (m.kind === 'wolf') m.sk -= 1;
  if (own) { bondXp(e.lpk, e.elite || e.gk ? BOND_CFG.eliteKill : BOND_CFG.kill); if (e.lpk === 'wolf' && bondHas('wolf', 'frenzy')) for (const m of G.pets) if (m.kind === 'wolf') m.sk -= 1; }
}
function drawPets(c, inView) {
  if (!G.pets || !G.pets.length) return;
  for (const m of G.pets) {
    if (!inView(m.x, m.y, 16)) continue;
    const S = petStat(m.kind), fr = Math.floor(G.time * (m.kind === 'wolf' ? 9 : 5) + m.i) & 1;
    c.fillStyle = 'rgba(0,0,0,0.22)'; c.beginPath(); c.ellipse(m.x, m.y + S.r * 0.7, S.r, S.r * 0.32, 0, 0, 7); c.fill();
    if (G.tm.wrath > 0) { c.strokeStyle = 'rgba(127,208,122,0.8)'; c.lineWidth = 2; c.beginPath(); c.ellipse(m.x, m.y + S.r * 0.7, S.r + 4, (S.r + 4) * 0.35, 0, 0, 7); c.stroke(); }
    const sc = S.r / PET[m.kind].r;                                 // 0.26a 유대 레벨에 따른 몸집
    if (sc > 1.01) { c.save(); c.translate(m.x, m.y + S.r * 0.8); c.scale(sc, sc); drawSprite(c, m.kind, fr, (m.bite > 0 ? Math.sign(m.vx || 1) * 3 : 0), 0, { flip: (m.vx || 0) < 0 }); c.restore(); }
    else drawSprite(c, m.kind, fr, m.x + (m.bite > 0 ? Math.sign(m.vx || 1) * 3 : 0), m.y + S.r * 0.8, { flip: (m.vx || 0) < 0 });
    if (m.lvT > 0) { c.globalAlpha = Math.min(1, m.lvT); c.strokeStyle = '#d8ffb8'; c.lineWidth = 2; c.beginPath(); c.arc(m.x, m.y, S.r + 6 + (1.2 - m.lvT) * 10, 0, 7); c.stroke(); c.globalAlpha = 1; }
    c.font = 'bold 9px Galmuri11, system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 2.5; c.strokeStyle = 'rgba(0,0,0,0.7)'; c.fillStyle = '#c8f0a8';
    const ly = m.y - S.r * 1.6 - 6; c.strokeText('Lv' + S.lv, m.x, ly); c.fillText('Lv' + S.lv, m.x, ly);
  }
}
Object.assign(SPR, {
  wolf: { px: 2, frames: [[
    '..........k.', '.........kMk', 'kk..kkkkkMMk', 'kMkkMMMMMMwk', '.kMMMMMMMMMk',
    '..kMMMMMMMk.', '..kmMmmmMmk.', '..kmk..kmk..', '..kk....kk..',
  ], [
    '..........k.', '.........kMk', 'kk..kkkkkMMk', 'kMkkMMMMMMwk', '.kMMMMMMMMMk',
    '..kMMMMMMMk.', '..kmMmmmMmk.', '.kmk....kmk.', '.kk......kk.',
  ]] },
  bear: { px: 2, frames: [[
    '..........kk..', '..kkkkkkkknnk.', '.knnnnnnnnnnnk', 'knnnnnnnnnkwnk', 'knnnnnnnnnnnek',
    'knNnnnnnnnnkk.', '.knNNNNNNNNk..', '..kNNk..kNNk..', '..kkk....kkk..',
  ], [
    '..........kk..', '..kkkkkkkknnk.', '.knnnnnnnnnnnk', 'knnnnnnnnnkwnk', 'knnnnnnnnnnnek',
    'knNnnnnnnnnkk.', '.knNNNNNNNNk..', '.kNNk....kNNk.', '.kkk......kkk.',
  ]] },
});

/* ---------- 시간술사 궁극기 '과거의 나' ---------- */
const RW = { keep: 5, every: 0.1, dur: 3, R: 38 };
function recordTrail(dt) {
  const p = G.p; if (p.job !== 'chrono') return;
  G.tm.trl = (G.tm.trl || 0) - dt; if (G.tm.trl > 0) return; G.tm.trl = RW.every;
  G.trail.push({ x: p.x, y: p.y, hp: p.hp }); if (G.trail.length > RW.keep / RW.every) G.trail.shift();
}
function startRewind() {
  const p = G.p, pts = G.trail.slice().reverse();               // 현재 → 5초 전 순서로 되감기
  if (pts.length < 2) pts.push({ x: p.x, y: p.y, hp: p.hp });
  G.rw = { pts, t: 0, tick: 0, hp: pts[pts.length - 1].hp };
  G.tm.stop = 1.5;
  fx({ kind: 'ring', x: p.x, y: p.y, r0: 10, r1: 360, dur: 0.8, color: '#c8c0ff' });
  banner('과거의 나', '되감기', '#c8c0ff', 1.2);
}
function rwPos(k) { const P = G.rw.pts, f = clamp(k, 0, 1) * (P.length - 1), i = Math.floor(f), j = Math.min(P.length - 1, i + 1), u = f - i; return { x: lerp(P[i].x, P[j].x, u), y: lerp(P[i].y, P[j].y, u) }; }
function updateRewind(dt) {
  const R = G.rw; if (!R) return;
  const p = G.p; R.t += dt; R.tick -= dt;
  const k = R.t / RW.dur, q = rwPos(k * k * (3 - 2 * k));         // 부드러운 가감속
  R.x = q.x; R.y = q.y;
  if (R.tick <= 0) { R.tick = 0.15; const d = (22 + p.level * 1.6) * p.mod.dmg; gridQuery(q.x, q.y, RW.R, e => { if ((e.ht.rw || 0) > G.time) return; e.ht.rw = G.time + 0.5; e.slowT = Math.max(e.slowT || 0, 2.5); damageEnemy(e, d, { src: 'ult', kb: 90, fx: q.x, fy: q.y }); }); }
  if (R.t >= RW.dur) {
    if (R.hp > p.hp) { const g = R.hp - p.hp; heal(g); toast(`시간 역행 · 체력 +${Math.round(g)}`, '#c8c0ff'); }
    fx({ kind: 'ring', x: p.x, y: p.y, r0: 6, r1: 60, dur: 0.4, color: '#c8c0ff', follow: true });
    G.rw = null;
  }
}
function drawRewind(c) {
  const R = G.rw; if (!R || R.x == null) return;
  const k = R.t / RW.dur;
  c.globalAlpha = 0.35; c.strokeStyle = '#c8c0ff'; c.lineWidth = 2; c.setLineDash([4, 5]); c.beginPath();   // 남은 되감기 경로
  const n = 14; for (let i = 0; i <= n; i++) { const u = k + (1 - k) * i / n, q = rwPos(u * u * (3 - 2 * u)); i ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y); } c.stroke(); c.setLineDash([]);
  for (let i = 3; i >= 1; i--) {                                   // 잔상 3겹
    const u = Math.max(0, k - i * 0.04), q = rwPos(u * u * (3 - 2 * u));
    c.globalAlpha = 0.12 * (4 - i); drawSprite(c, 'hero', 0, q.x, q.y + G.p.r * 1.1, { flip: true, tint: '#8a7ae0', mode: 'white' });
  }
  c.globalAlpha = 0.7; drawSprite(c, 'hero', Math.floor(G.time * 8) & 1, R.x, R.y + G.p.r * 1.1, { flip: true, tint: '#c8c0ff' });
  c.globalAlpha = 0.25; c.fillStyle = '#c8c0ff'; c.beginPath(); c.arc(R.x, R.y, RW.R, 0, 7); c.fill();
  c.globalAlpha = 1;
}
