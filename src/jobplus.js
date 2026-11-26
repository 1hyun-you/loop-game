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
const wxOn = cat => false;   // 0.41 계열 변환 규칙 폐지 (직업 핵심 규칙·연성으로 흡수)
const wxSrc = src => { const c = SRC_CAT[src]; return c && wxOn(c); };
function wName(id) { const d = WEAPONS[id]; return wxOn(d.cat) ? JOB_WX[G.p.job].pre + ' ' + d.name : d.name; }
function jobTint(cat) { return G.p.job ? JOB_COL[G.p.job] : null; }   // 0.41 직업 색 발광은 유지

/* 처치 시 변환 효과 (소환사·프리스트) */

/* ---------- 전직 연출 ---------- */
/* 2차 전직 문양은 지면층에서 그려 적 공격 예고가 위에 표시되도록 함 */
function drawJobAura(c, ground = false) {
  const p = G.p; if (!p.job) return;
  if (ground !== !!p.job2) return;
  if (p.job2 && drawJobFootCrest(c, p)) return;
  if(EFFECT_ART.image){
    const key={warrior:'earth',rogue:'arcane',archer:'wind',engineer:'lightning',mage:'frost',summoner:'summon',sovereign:'blessing',chrono:'time',priest:'holy',druid:'vine'}[p.job];
    paintedEffect(c,key,p.x,p.y+p.r*.85,p.r+12,.48,0,.38);return;
  }
  const col = JOB_COL[p.job], t = G.time, y = p.y + p.r * 0.85, pulse = 0.55 + 0.25 * Math.sin(t * 3);
  c.globalAlpha = pulse; c.strokeStyle = col; c.lineWidth = 2;
  c.beginPath(); c.ellipse(p.x, y, p.r + 7, (p.r + 7) * 0.38, 0, 0, 7); c.stroke();
  if (p.job2) {                                              // 2차: 회전하는 점선 고리
    c.globalAlpha = 0.8; c.fillStyle = col;
    for (let i = 0; i < 6; i++) { const a = t * 1.6 + i * Math.PI / 3; c.fillRect(p.x + Math.cos(a) * (p.r + 12) - 1.5, y + Math.sin(a) * (p.r + 12) * 0.38 - 1.5, 3, 3); }
  }
  c.globalAlpha = 1;
}
const drawJobAuraBase = drawJobAura;
function drawJobAuraGround(c) { drawJobAuraBase(c, true); }
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
function addPet(kind) { const p = G.p, a = rand(Math.PI * 2); G.pets.push({ kind, x: p.x + Math.cos(a) * 30, y: p.y + Math.sin(a) * 30, t: 0.5, sk: PET[kind].sk * 0.5, tg: null, vx: 0, i: G.pets.length }); }
function petsInit() { G.pets = []; G.bond = {}; G.bleeds = []; G.pendingBond = []; addPet('wolf'); addPet('bear'); }
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
    c.font = 'bold 9px system-ui, Galmuri11, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 2.5; c.strokeStyle = 'rgba(0,0,0,0.7)'; c.fillStyle = '#c8f0a8';
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
function rwPos(k) { const P = G.rw.pts, f = clamp(k, 0, 1) * (P.length - 1), i = Math.floor(f), j = Math.min(P.length - 1, i + 1), u = f - i; return { x: lerp(P[i].x, P[j].x, u), y: lerp(P[i].y, P[j].y, u) }; }
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
    paintedAura(c,'time',R.x,R.y,RW.R,.45);
  c.globalAlpha = 1;
}
