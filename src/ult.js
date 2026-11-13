/* ============================================================
   궁극기 재설계 (0.32) — 직업별 맞춤형 10종 + 2차 전직 변화형 20종 + 숙련 위력 +25%
   공통: 시전 0.25초 정지·직업색 섬광·전용 효과음·명칭 띠, 종료 시 '궁극기 피해 합계' 표시
   결정 출처: 회차 35 궁극기 초안·2차 전직 변화안 확정 (드루이드 2번째 변화형 '숲의 현자 계열'은 현 무리의 우두머리에 적용)
   ============================================================ */
const ULT_TXT = {
  warrior: ['대지 분쇄', '도약 후 착지, 화면 절반 충격파로 적을 날려 보냄, 착지 후 3초 무적'],
  rogue: ['그림자 난무', '6초간 이동 경로에 칼날 잔상, 체력 20% 이하 적 즉시 처치'],
  archer: ['천공 화살', '조준 방향 거대 관통 화살, 지나간 자리에 2초 화살비'],
  engineer: ['궤도 포격', '8초간 1.5초마다 밀집 지점 포탄 낙하, 포탑 발사 속도 2배'],
  mage: ['유성우', '밀집 지점 3곳 운석 연속 낙하, 착탄 자리 화염 장판'],
  summoner: ['망령 거인', '기존 망령 돌진 폭발, 10초간 거대 망령 동행'],
  sovereign: ['왕의 호령', '화면 내 적 피해·둔화, 7초간 군기 반경 2배·무기 재사용 2배'],
  chrono: ['시간 단절', '3초 시간 정지, 정지 중 피해를 쌓았다가 해제 순간 1.5배 폭발'],
  priest: ['빛의 강림', '화면 내 적 신성 피해, 6초간 따라다니는 성역 회복'],
  druid: ['대자연의 분노', '주변 적 덩굴 포박, 8초간 동료 거대화·피해 2배·공격 속도 1.5배'],
};
const ULT2_TXT = {
  berserk: '착지 후 무적 대신 6초 광폭화 (공격 속도 1.6배·피해 +25%, 받는 피해 +25%)',
  guard: '착지 자리에 6초 방벽, 방벽 안 받는 피해 -50%·접근한 적 밀쳐냄',
  assassin: '잔상 대신 화면 내 체력 낮은 적 5체 순간 이동 처형',
  dancer: '지속 9초, 분신 2체가 함께 이동하며 칼날 잔상',
  sniper: '천공 화살 위력 2배·폭 확대, 화살비 제거',
  hunter: '천공 화살 3갈래, 맞은 적 표식 5개 즉시 부여',
  artillery: '포탄 수 감소, 1발 위력·범위 대폭 증가',
  mechanic: '포격 대신 8초간 거대 기계 포탑 설치 (고속 연사)',
  elemental: '운석이 화염·냉기·번개 1발씩, 마지막에 원소 반응 연쇄 폭발',
  archmage: '운석 1발로 통합, 화면 절반 크기 대폭발',
  necro: '거인 대신 10초간 처치한 적 전부 망령으로 일어남',
  lord: '망령 거인 2체·지속 15초',
  conqueror: '시전 피해 대폭 증가, 7초간 처치 시 군기 추가 설치 (최대 4)',
  benevolent: '7초간 군기 안 초당 체력 3% 회복 + 피해 1회 막는 보호막',
  accel: '정지 2초, 정지 중 이동·공격 속도 2배',
  rewind: '해제 순간 폭발 + 시전 전 체력 복구·궁극기 게이지 30% 환급',
  judge: '성역 대신 6초간 화면 내 적에게 빛 기둥 연속 낙하',
  saint: '성역 지속 10초, 성역 안 피격 시 반격 섬광',
  ursa: '곰 1체가 8초간 거인 곰으로 변신, 주변 연속 강타',
  pack: '덩굴 포박 범위 2배, 8초간 덩굴이 계속 자라 둔화·지속 피해',
};
for (const j in ULT_TXT) JOBS[j].ult = ULT_TXT[j][0] + ': ' + ULT_TXT[j][1];
for (const j in JOB2) for (const o of JOB2[j]) if (ULT2_TXT[o.k] && !o.ds.includes('궁극기')) o.ds += ` · 궁극기: ${ULT2_TXT[o.k]}`;
if (!JOB2_STAT.ds.includes('궁극기')) JOB2_STAT.ds += ' · 궁극기 위력 +25%';

const UC = { stop: 0.25, totalAt: 0.4 };
const UU = () => G.U || (G.U = { end: 0, sum0: 0, on: false, blades: [], giants: [], beams: [], warn: [], banners: [] });
const ult2 = k => G.p.job2 === k;
const viewR = () => Math.hypot(VIEW.w, VIEW.h) / 2;
const onScreen = () => { const p = G.p, L = []; gridQuery(p.x, p.y, viewR(), e => { if (!e.dead) L.push(e); }); return L; };
const isBossE = e => !!(e.gk || e.boss || e.cmd);
function denseAt(range, r, skip = []) {
  const p = G.p; let best = null, bn = -1;
  for (let i = 0; i < 16; i++) {
    const a = i * Math.PI / 8, R = i % 2 ? range : range * 0.55, cx = p.x + Math.cos(a) * R, cy = p.y + Math.sin(a) * R;
    if (skip.some(s => dist2(s.x, s.y, cx, cy) < r * r)) continue;
    let n = 0; gridQuery(cx, cy, r, e => { n += isBossE(e) ? 4 : 1; }); if (n > bn) { bn = n; best = { x: cx, y: cy }; }
  }
  return best || { x: p.x + rand(-60, 60), y: p.y + rand(-60, 60) };
}
function uLater(t, f) { G.later.push({ t, f }); }
function uBlast(x, y, r, d, kb, col) { ultBlast(x, y, r, d, kb, col); }
function uWarn(x, y, r, t, col) { UU().warn.push({ x, y, r, t: 0, dur: t, col }); }
function uLine(x, y, ang, len, wid, d, kb, hitF) {
  const ca = Math.cos(ang), sa = Math.sin(ang), mx = x + ca * len / 2, my = y + sa * len / 2;
  gridQuery(mx, my, len / 2 + wid, e => {
    const dx = e.x - x, dy = e.y - y, u = dx * ca + dy * sa, v = Math.abs(-dx * sa + dy * ca);
    if (u < -10 || u > len || v > wid / 2 + e.r) return;
    damageEnemy(e, d, { src: 'ult', kb, fx: e.x - ca * 10, fy: e.y - sa * 10 }); if (hitF) hitF(e);
  });
}

/* ---------- 시전 ---------- */
function useUlt() {
  const p = G.p, j = p.job, U = UU(), vet = ult2('veteran');
  const D = (90 + p.level * 7) * p.mod.dmg * (vet ? 1.25 : 1);
  p.ult = 0; p.ultRef = 0; G.ultB && (G.ultB.ref = 0); G.stats.ults++; (G.ultAt || (G.ultAt = [])).push(Math.round(G.time)); G.tm.stopT = 0; sfx('ult');
  rcSlow(0.05, UC.stop); rcBig(JOB_COL[j] || '#ffe08a', 0.42); shake(5, 0.35);
  const nm2 = p.job2 && p.job2 !== 'veteran' ? JOB2[j].find(o => o.k === p.job2).nm : vet ? '숙련' : '';
  banner(ULT_TXT[j][0], nm2 || null, JOB_COL[j] || '#ffe08a', 1.1);
  U.sum0 = G.stats.dmg.ult || 0; U.on = true; U.hpAt = p.hp;
  const dur = (ULT_FN[j] || (() => 1))(p, D, U) || 1;
  U.end = G.time + dur; G.tm.ultWin = Math.max(JOB_CFG.ultWin, dur);
}
const ULT_FN = {
  warrior(p, D, U) {
    p.invT = Math.max(p.invT, 0.6); fx({ kind: 'ring', x: p.x, y: p.y, r0: 40, r1: 8, dur: 0.35, color: '#ffb070' });
    U.leap = 0.35;
    uLater(0.35, () => {
      const R = VIEW.w * 0.5, x = G.p.x, y = G.p.y; shake(9, 0.5);
      uBlast(x, y, R, D * 2, 520, '#ffb070'); fx({ kind: 'ring', x, y, r0: R * 0.6, r1: R * 1.1, dur: 0.6, color: '#ffd0a0' });
      if (ult2('berserk')) U.rage = 6;
      else if (ult2('guard')) U.wall = { x, y, r: 120, t: 6 };
      else G.p.invT = Math.max(G.p.invT, 3);
    });
    return ult2('berserk') || ult2('guard') ? 6.4 : 3.4;
  },
  rogue(p, D, U) {
    p.invT = Math.max(p.invT, 1);
    if (ult2('assassin')) {
      const ts = onScreen().sort((a, b) => a.hp / (a.mhp || a.hp) - b.hp / (b.mhp || b.hp) || a.hp - b.hp).slice(0, 5);
      ts.forEach((e, i) => uLater(0.12 * i, () => {
        const ex = e.x, ey = e.y; uLater(0.02, () => uBlast(ex, ey, 70, D * 1.6, 200, '#d0b0ff'));
        if (e.dead) return; const P = G.p; fx({ kind: 'ring', x: P.x, y: P.y, r0: 14, r1: 2, dur: 0.15, color: '#203040' });
        P.x = e.x - 14; P.y = e.y; P.invT = Math.max(P.invT, 0.4);
        fx({ kind: 'slash', x: e.x, y: e.y, a: rand(7), dur: 0.3, color: '#d0b0ff' });
        damageEnemy(e, isBossE(e) || e.elite ? D * 4 : Math.max(D * 4, e.hp + 1), { src: 'ult', kb: 160, fx: P.x, fy: P.y });
      }));
      return 1;
    }
    U.dance = ult2('dancer') ? 9 : 6; U.bladeT = 0; U.clones = ult2('dancer') ? [0, 1].map(i => ({ a: i * Math.PI, x: p.x, y: p.y })) : [];
    U.bd = D * 0.6; return U.dance;
  },
  archer(p, D, U) {
    const a0 = aimAng(500), L = Math.max(VIEW.w, VIEW.h) * 1.1;
    const angs = ult2('hunter') ? [a0 - 0.35, a0, a0 + 0.35] : [a0];
    const W = ult2('sniper') ? 100 : 60, d = D * (ult2('sniper') ? 9 : ult2('hunter') ? 3.5 : 4.5);
    for (const a of angs) {
      U.beams.push({ x: p.x, y: p.y, a, L, w: W, t: 0, dur: 0.45, col: '#d8ffc8' });
      uLine(p.x, p.y, a, L, W, d, 220, ult2('hunter') ? e => { e.mk = (e.mk || 0) + 5; } : null);
      if (!ult2('sniper') && !ult2('hunter')) U.rainLine = { x: p.x, y: p.y, a, L, t: 2, tick: 0, d: D * 0.6 };
    }
    return 2.2;
  },
  engineer(p, D, U) {
    G.tm.overdrive = 8;
    if (ult2('mechanic')) { U.mech = { x: p.x, y: p.y, t: 8, sh: 0, d: D * 0.42 }; return 8; }
    const art = ult2('artillery'), gap = art ? 2.5 : 1.5, n = art ? 4 : 6, R = art ? 170 : 110, d = D * (art ? 3.4 : 1.6);
    for (let i = 0; i < n; i++) uLater(i * gap, () => {
      if (G.result) return; const q = denseAt(170, R * 0.8); uWarn(q.x, q.y, R, 0.5, '#9ad8ff');
      uLater(0.5, () => { uBlast(q.x, q.y, R, d, 300, '#9ad8ff'); shake(art ? 7 : 4, 0.3); });
    });
    return (n - 1) * gap + 0.7;
  },
  mage(p, D, U) {
    if (ult2('archmage')) {
      const q = denseAt(140, 160), R = VIEW.w * 0.5; uWarn(q.x, q.y, R, 0.6, '#ff7a3a');
      uLater(0.6, () => { uBlast(q.x, q.y, R, D * 5, 420, '#ff7a3a'); shake(10, 0.6); addPool({ x: q.x, y: q.y, r: R * 0.5, dur: 3, every: 0.5, dmg: D * 0.12, src: 'ult', kind: 'fire' }); });
      return 1.2;
    }
    const pts = [], el = ult2('elemental'), E = ['fire', 'ice', 'bolt'], C = { fire: '#ff7a3a', ice: '#bfe8ff', bolt: '#bfe4ff' };
    for (let i = 0; i < 3; i++) pts.push(denseAt(150, 120, pts));
    pts.forEach((q, i) => {
      const k = el ? E[i] : 'fire'; uWarn(q.x, q.y, 130, 0.35 + i * 0.35, C[k]);
      uLater(0.35 + i * 0.35, () => {
        uBlast(q.x, q.y, 130, D * 2, 300, C[k]); shake(5, 0.25);
        if (k === 'fire') addPool({ x: q.x, y: q.y, r: 70, dur: 3, every: 0.4, dmg: D * 0.08, src: 'ult', kind: 'fire' });
        if (k === 'ice') gridQuery(q.x, q.y, 150, e => { e.slowT = Math.max(e.slowT || 0, 3); if (!isBossE(e)) e.frz = Math.max(e.frz || 0, 1.2); });
        if (k === 'bolt') { const ts = onScreen().sort((a, b) => dist2(a.x, a.y, q.x, q.y) - dist2(b.x, b.y, q.x, q.y)).slice(0, 6); for (const e of ts) { fx({ kind: 'bolt', x: e.x, y: e.y, dur: 0.2 }); damageEnemy(e, D * 0.6, { src: 'ult' }); } }
      });
    });
    if (el) uLater(1.4, () => { const cx = (pts[0].x + pts[1].x + pts[2].x) / 3, cy = (pts[0].y + pts[1].y + pts[2].y) / 3; for (const q of pts) U.beams.push({ x: q.x, y: q.y, a: Math.atan2(cy - q.y, cx - q.x), L: Math.hypot(cx - q.x, cy - q.y), w: 14, t: 0, dur: 0.35, col: '#e8b0ff' }); uBlast(cx, cy, 170, D * 1.8, 260, '#e8b0ff'); });
    return el ? 1.8 : 1.4;
  },
  summoner(p, D, U) {
    for (const m of G.minions) { const e = nearestEnemy(m.x, m.y, 260), x = e ? e.x : m.x, y = e ? e.y : m.y; fx({ kind: 'ring', x: m.x, y: m.y, r0: 4, r1: 20, dur: 0.2, color: '#c9a8ff' }); uLater(0.2, () => uBlast(x, y, 55, D * 0.7, 140, '#c9a8ff')); }
    G.minions.length = 0;
    if (ult2('necro')) { U.raise = 10; uBlast(p.x, p.y, 160, D * 0.8, 200, '#c9a8ff'); return 10; }
    const n = ult2('lord') ? 2 : 1, dur = ult2('lord') ? 15 : 10;
    for (let i = 0; i < n; i++) U.giants.push({ x: p.x + (i ? 30 : -30), y: p.y - 20, t: dur, hit: 0.5, d: D * 0.75, r: 22 });
    return dur;
  },
  sovereign(p, D, U) {
    const d = D * (ult2('conqueror') ? 2.6 : 1.2);
    fx({ kind: 'ring', x: p.x, y: p.y, r0: 10, r1: viewR(), dur: 0.6, color: '#ffd24a' });
    for (const e of onScreen()) { e.slowT = Math.max(e.slowT || 0, 3); damageEnemy(e, d, { src: 'ult', kb: 120, fx: p.x, fy: p.y }); }
    U.rally = 7; U.banners = []; if (ult2('benevolent')) U.shield = 1;
    return 7;
  },
  chrono(p, D, U) {
    const acc = ult2('accel'), dur = acc ? 2 : 3;
    G.tm.stop = dur; U.hold = dur; U.held = new Set(); U.hx = D; U.hpAt = p.hp;
    fx({ kind: 'ring', x: p.x, y: p.y, r0: 10, r1: viewR(), dur: 0.8, color: '#c8c0ff' });
    if (acc) U.haste = dur;
    return dur + 0.6;
  },
  priest(p, D, U) {
    if (ult2('judge')) { U.judge = 6; U.jt = 0; U.jd = D * 0.9; for (const e of onScreen()) { fx({ kind: 'bolt', x: e.x, y: e.y, dur: 0.25 }); damageEnemy(e, D * 0.8, { src: 'ult' }); } return 6; }
    for (const e of onScreen()) { fx({ kind: 'bolt', x: e.x, y: e.y, dur: 0.25 }); damageEnemy(e, D * 1.2, { src: 'ult' }); }
    const dur = ult2('saint') ? 10 : 6; G.sanct = { x: p.x, y: p.y, r: 150, follow: true }; G.tm.sanct = dur; U.saint = ult2('saint') ? dur : 0;
    return dur;
  },
  druid(p, D, U) {
    const R = ult2('pack') ? 340 : 170;
    fx({ kind: 'ring', x: p.x, y: p.y, r0: 10, r1: R, dur: 0.5, color: '#7fd07a', fill: true });
    gridQuery(p.x, p.y, R, e => { e.slowT = Math.max(e.slowT || 0, 3); if (!isBossE(e)) e.frz = Math.max(e.frz || 0, 2); damageEnemy(e, D * 0.9, { src: 'ult' }); });
    if (ult2('ursa')) { const b = G.pets.find(m => m.kind === 'bear'); U.bigBear = { t: 8, hit: 0, d: D * 0.7, m: b }; return 8; }
    if (ult2('pack')) { U.grow = 8; U.gt = 0; U.gd = D * 0.12; return 8; }
    G.tm.wrath = 8; U.bigPets = 8; return 8;
  },
};

/* ---------- 지속 효과 (updateJob 끝에서 호출) ---------- */
function updateUltFx(dt) {
  const U = G.U; if (!U) return; const p = G.p;
  for (const k of ['rage', 'rally', 'haste', 'raise', 'bigPets', 'saint']) if (U[k] > 0) U[k] -= dt;
  if (U.wall) { U.wall.t -= dt; const W = U.wall; gridQuery(W.x, W.y, W.r + 8, e => { if (isBossE(e)) return; const dx = e.x - W.x, dy = e.y - W.y, d = Math.hypot(dx, dy) || 1; if (d < W.r) { e.kbx += dx / d * 260 * dt * 6; e.kby += dy / d * 260 * dt * 6; } }); if (W.t <= 0) U.wall = null; }   // 0.41 복구: 0.40-art 패치에서 갱신 함수의 방벽 밀어내기·시간 감소가 그리기 코드로 대체된 결함
  if (U.dance > 0) {
    U.dance -= dt; U.bladeT -= dt;
    U.clones.forEach((c, i) => { c.a += dt * 3; const tx = p.x + Math.cos(c.a) * 46, ty = p.y + Math.sin(c.a) * 46; c.x += (tx - c.x) * Math.min(1, dt * 8); c.y += (ty - c.y) * Math.min(1, dt * 8); });
    if (U.bladeT <= 0) {
      U.bladeT = 0.08;
      for (const s of [p, ...U.clones]) if (U.blades.length < 160) {
        U.blades.push({ x: s.x, y: s.y, t: 0.7, a: rand(7) });
        if (s !== p && !(U.tk > dt)) markSummonAttack(s, s.a + Math.PI / 2);
      }
    }
  }
  if (U.blades.length) {
    U.tk = (U.tk || 0) - dt; const hit = U.tk <= 0; if (hit) U.tk = 0.2;
    for (const b of U.blades) {
      b.t -= dt; if (!hit) continue;
      gridQuery(b.x, b.y, 26, e => {
        if ((e.ht.ub || 0) > G.time) return; e.ht.ub = G.time + 0.3;
        const low = !isBossE(e) && !e.elite && e.mhp && e.hp <= e.mhp * 0.2;
        damageEnemy(e, low ? e.hp + 1 : U.bd, { src: 'ult' }); if (low) fx({ kind: 'slash', x: e.x, y: e.y, a: b.a, dur: 0.25, color: '#d0b0ff' });
      });
    }
    U.blades = U.blades.filter(b => b.t > 0);
  }
  if (U.rainLine) {
    const R = U.rainLine; R.t -= dt; R.tick -= dt;
    if (R.tick <= 0) { R.tick = 0.08; const u = rand(0, R.L), v = rand(-40, 40), x = R.x + Math.cos(R.a) * u - Math.sin(R.a) * v, y = R.y + Math.sin(R.a) * u + Math.cos(R.a) * v; fx({ kind: 'ring', x, y, r0: 4, r1: 34, dur: 0.2, color: '#d8ffc8' }); gridQuery(x, y, 34, e => damageEnemy(e, R.d, { src: 'ult' })); }
    if (R.t <= 0) U.rainLine = null;
  }
  if (U.mech) {
    const M = U.mech; M.t -= dt; M.sh -= dt;
    if (M.sh <= 0) { const e = nearestEnemy(M.x, M.y, 420); M.sh = 0.2; if (e) { M.a = Math.atan2(e.y - M.y, e.x - M.x); shoot({ kind: 'arrow', x: M.x, y: M.y, ang: M.a + rand(-0.06, 0.06), sp: 640, r: 6, dmg: M.d, pierce: 2, life: 0.8, color: '#9ad8ff', src: 'ult' }); } }
    if (M.t <= 0) { uBlast(M.x, M.y, 110, M.d * 3, 220, '#9ad8ff'); U.mech = null; }
  }
  for (const g of U.giants) {
    g.t -= dt; g.hit -= dt; const e = nearestEnemy(g.x, g.y, 340), tx = e ? e.x : p.x + 30, ty = e ? e.y : p.y - 30, dx = tx - g.x, dy = ty - g.y, d = Math.hypot(dx, dy) || 1;
    if (d > g.r + 6) { g.x += dx / d * 150 * dt; g.y += dy / d * 150 * dt; g.vx = dx; }
    if (dist2(g.x, g.y, p.x, p.y) > 360 * 360) { g.x = p.x; g.y = p.y - 30; }
    if (g.hit <= 0 && e && d < 90) { g.hit = 0.8; markSummonAttack(g, Math.atan2(dy, dx)); uBlast(g.x + dx / d * 30, g.y + dy / d * 30, 75, g.d, 220, '#c9a8ff'); }
  }
  if (U.giants.length) U.giants = U.giants.filter(g => g.t > 0);
  if (U.judge > 0) { U.judge -= dt; U.jt -= dt; if (U.jt <= 0) { U.jt = 0.22; const L = onScreen(); const e = L[Math.floor(Math.random() * L.length)]; if (e) { fx({ kind: 'bolt', x: e.x, y: e.y, dur: 0.22 }); fx({ kind: 'ring', x: e.x, y: e.y, r0: 6, r1: 45, dur: 0.25, color: '#fff2a8' }); gridQuery(e.x, e.y, 45, t => damageEnemy(t, U.jd, { src: 'ult' })); } } }
  if (G.sanct && G.sanct.follow) { G.sanct.x = p.x; G.sanct.y = p.y; }
  if (U.bigBear) { const B = U.bigBear, m = B.m && G.pets.includes(B.m) ? B.m : null; B.t -= dt; B.hit -= dt; if (m && B.hit <= 0) { B.hit = 0.9; uBlast(m.x, m.y, 100, B.d, 240, '#c89060'); } if (B.t <= 0 || !m) U.bigBear = null; }
  if (U.grow > 0) { U.grow -= dt; U.gt -= dt; if (U.gt <= 0) { U.gt = 0.5; const q = ringAt(30, 200); addPool({ x: q.x, y: q.y, r: 56, dur: 3, every: 0.4, dmg: U.gd, src: 'ult', kind: 'vine', slow: true }); } }
  if (U.hold > 0) { U.hold -= dt; if (U.hold <= 0) ultRelease(U); }
  for (const w of U.warn) w.t += dt; if (U.warn.length) U.warn = U.warn.filter(w => w.t < w.dur);
  for (const b of U.beams) b.t += dt; if (U.beams.length) U.beams = U.beams.filter(b => b.t < b.dur);
  if (U.leap > 0) U.leap -= dt;
  if (U.on && G.time >= U.end + UC.totalAt) {
    U.on = false; const n = Math.round((G.stats.dmg.ult || 0) - U.sum0);
    if (n > 0) banner('궁극기 피해 합계', n.toLocaleString('ko-KR'), JOB_COL[p.job] || '#ffe08a', 1.4);
  }
}
/* 시간 단절 해제: 정지 중 쌓인 피해 1.5배 폭발 */
function ultRelease(U) {
  const p = G.p; shake(8, 0.5); fx({ kind: 'ring', x: p.x, y: p.y, r0: viewR(), r1: 20, dur: 0.5, color: '#c8c0ff' });
  for (const e of U.held) { if (e.dead || !e.held) continue; const h = e.held; e.held = 0; fx({ kind: 'pop', x: e.x, y: e.y, r: 12, color: '#c8c0ff', dur: 0.25 }); damageEnemy(e, h * 1.5, { src: 'ult', kb: 160, fx: p.x, fy: p.y }); }
  U.held = null;
  for (const e of onScreen()) damageEnemy(e, U.hx * (ult2('rewind') ? 2.2 : 1.6), { src: 'ult', kb: 120, fx: p.x, fy: p.y });
  if (ult2('rewind')) { if (U.hpAt > p.hp) { const g = U.hpAt - p.hp; heal(g, '시간 역행'); toast(`시간 역행 · 체력 +${Math.round(g)}`, '#c8c0ff'); } uLater(0.7, () => { G.p.ult = Math.max(G.p.ult, JOB_CFG.ultNeed * 0.3); }); }
}

/* ---------- 다른 체계 연계 훅 ---------- */
/* 시간 단절 중 일반 적 피해 보류 (해제 시 일괄 적용), true 반환 시 즉시 적용 생략 */
function ultHoldDmg(e, dmg, o) {
  const U = G.U; if (!U || !(U.hold > 0) || !U.held || isBossE(e) || o.src === 'ult') return false;
  e.held = (e.held || 0) + dmg; e.heldSrc = o.src; U.held.add(e); e.flash = 0.05;
  if (e.held >= e.hp * 1.6 && !e.hm) { e.hm = 1; fx({ kind: 'ring', x: e.x, y: e.y, r0: e.r, r1: e.r + 6, dur: 0.3, color: '#c8c0ff' }); }
  return true;
}
function ultCdMul() { const U = G.U; let m = G.tm.roar > 0 ? 2 : 1; if (!U) return m; if (U.rage > 0) m *= 1.6; if (U.rally > 0) m *= 2; if (U.haste > 0) m *= 2; return m; }
function ultSpdMul() { const U = G.U; return U && U.haste > 0 ? 2 : 1; }
function ultDmgMul() { const U = G.U; return U && U.rage > 0 ? 1.25 : 1; }
function ultHurtMul() {
  const U = G.U, p = G.p; if (!U) return 1; let m = 1;
  if (U.rage > 0) m *= 1.25;
  if (U.wall && dist2(U.wall.x, U.wall.y, p.x, p.y) < U.wall.r * U.wall.r) m *= 0.5;
  return m;
}
function ultBlockHit() { const U = G.U; if (U && U.shield && U.rally > 0) { U.shield = 0; G.p.invT = Math.max(G.p.invT, 0.6); fx({ kind: 'ring', x: G.p.x, y: G.p.y, r0: 30, r1: 6, dur: 0.3, color: '#ffd24a' }); toast('보호막', '#ffd24a'); return true; } return false; }
function ultOnHurt() {
  const U = G.U, p = G.p; if (!U || !(U.saint > 0) || !G.sanct) return;
  if ((U.ctr || 0) > G.time) return; U.ctr = G.time + 0.4;
  uBlast(p.x, p.y, 130, (90 + p.level * 7) * p.mod.dmg * 0.8, 220, '#fff3b0');
}
function ultOnKill(e) {
  const U = G.U; if (!U) return; const p = G.p;
  if (U.raise > 0 && !isBossE(e) && G.minions.length < 24) { addMinion(e.x, e.y); G.minions[G.minions.length - 1].life = Math.max(3, U.raise); }
  if (U.rally > 0 && ult2('conqueror') && U.banners.length < 4 && (U.bnT || 0) <= G.time) { U.bnT = G.time + 0.5; U.banners.push({ x: e.x, y: e.y, r: 110 * 1.5 }); fx({ kind: 'ring', x: e.x, y: e.y, r0: 10, r1: 80, dur: 0.35, color: '#ffd24a' }); }
}
function ultBannerR() { const U = G.U; return U && U.rally > 0 && G.p.job === 'sovereign' ? 2 : 1; }
function ultInBanner() { const U = G.U, p = G.p; return !!(U && U.rally > 0 && U.banners.some(b => dist2(b.x, b.y, p.x, p.y) < b.r * b.r)); }
function benevolentHeal(dt) { const U = G.U; if (U && U.rally > 0 && ult2('benevolent') && inBanner()) heal(G.p.maxHp * 0.03 * dt, '성군 호령'); }

/* ---------- 그리기 (월드 좌표) ---------- */
function drawUlt(c) {
  const U = G.U; if (!U) return; const p = G.p;
  for(const w of U.warn){const k=w.t/w.dur;paintedAura(c,effectKey(w.col),w.x,w.y,w.r*k,.45);effectBoundary(c,w.x,w.y,w.r,w.col,.7);}
  for(const b of U.beams){const k=1-b.t/b.dur;if(!paintedBeam(c,b.x,b.y,b.a,b.L,b.w,k)) {c.save();c.translate(b.x,b.y);c.rotate(b.a);c.globalAlpha=.5*k;c.fillStyle=b.col;c.fillRect(0,-b.w/2,b.L,b.w);c.restore();}}
  if(U.wall){const W=U.wall,k=Math.min(1,W.t);paintedAura(c,'shield',W.x,W.y,W.r,.6*k);effectBoundary(c,W.x,W.y,W.r,'#ffd0a0',.4*k);}
  if(U.rage>0)paintedAura(c,'fire',p.x,p.y,p.r+12,.6);
  for(const b of U.blades){c.save();c.globalAlpha=Math.min(1,b.t*2)*.8;drawSpriteRot(c,'knife',0,b.x,b.y,b.a);c.restore();}
  if (U.dance > 0 && (!p.job || !summonUnitReady('clone'))) for (const s of U.clones) { c.globalAlpha = 0.45; drawSprite(c, 'hero', Math.floor(G.time * 8) & 1, s.x, s.y + p.r * 1.1, { tint: '#6a5aa0' }); }
  if (U.mech) { const M = U.mech; c.globalAlpha = 1;
    if(EFFECT_ART.image){drawSpriteC(c,'turret',0,M.x,M.y,{mul:2});paintedAura(c,'lightning',M.x,M.y,28,.35);}else{ c.fillStyle = '#3a4a5a'; c.fillRect(M.x - 14, M.y - 10, 28, 20); c.save(); c.translate(M.x, M.y - 4); c.rotate(M.a || 0); c.fillStyle = '#9ad8ff'; c.fillRect(0, -4, 22, 8); c.restore(); c.strokeStyle = '#9ad8ff'; c.lineWidth = 2; c.strokeRect(M.x - 14, M.y - 10, 28, 20); }}
  if (!p.job || !summonUnitReady('wraith')) for (const g of U.giants) { const a = Math.min(1, g.t); paintedAura(c,'summon',g.x,g.y,g.r+10,.6*a); c.globalAlpha = 0.85 * a; c.save(); c.translate(g.x, g.y); c.scale(2.4, 2.4); drawSprite(c, 'hero', Math.floor(G.time * 6) & 1, 0, 8, { flip: (g.vx || 0) < 0, tint: '#b89cff', mode: 'white' }); c.restore(); }
  if(U.bigBear&&U.bigBear.m){const m=U.bigBear.m;paintedAura(c,'earth',m.x,m.y,34,.65);}
  if(U.bigPets>0)for(const m of G.pets)paintedAura(c,'heal',m.x,m.y,26,.55);
  if(U.rally>0&&U.banners.length)for(const b of U.banners){paintedAura(c,'blessing',b.x,b.y,b.r,.5);effectBoundary(c,b.x,b.y,b.r,'#ffd24a',.3);drawSpriteC(c,'flag',0,b.x,b.y);}
  if(U.shield&&U.rally>0)paintedAura(c,'shield',p.x,p.y,p.r+10,.7);
  if(U.hold>0&&U.held)for(const e of U.held)if(!e.dead&&e.held)paintedAura(c,'time',e.x,e.y,e.r+5,.65);
  c.globalAlpha = 1;
}
/* 화면 좌표: 시간 단절 중 화면 색조 */
function drawUltScreen(c) {
  const U = G.U; if (!U || !(U.hold > 0)) return;
  c.globalAlpha = 0.14; c.fillStyle = '#5a4a9a'; c.fillRect(0, 0, VIEW.cw, VIEW.ch); c.globalAlpha = 1;
}
