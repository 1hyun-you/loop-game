/* ============================================================
   무기·유물 확대 (0.27, 표현·보강 단계)
   회차 25 결정(2026-11-03) 1안: 공용 무기 18종(계열별 6) · 직업 전용 무기 직업당 2종 · 유물 16종 균등 배분
   — 공용 무기 6종 추가: 창 찌르기·사슬 철퇴(근접) / 수리검·폭탄 투척(원거리) / 빛줄기·회오리(마법)
   — 직업 전용 무기: 1차 전직 시 1종(EXW1) + 2차 전직 시 강화형 1종(기존 EXW)
   — 유물 8종 추가, 재료 배분: 공용 무기 18종·보조 효과 8종 모두 1~2회 (화염 덫 재료 화염구 → 폭탄 투척 교체로 화염구 3회 편중 해소)
   ============================================================ */

/* ---------- 공용 무기 6종 ---------- */
Object.assign(WEAPONS, {
  lance: { name: '창 찌르기', cat: 'melee', ic: '창', desc: '가까운 적 방향 긴 직선 찌르기, 경로의 적 모두 관통',
    base: { dmg: 24, cd: 1.5, range: 150, wid: 15, kb: 150 },
    ups: [{ dmg: 0.3 }, { area: 0.15 }, { cd: 0.15 }, { dmg: 0.3 }, { area: 0.15, dmg: 0.2 }] },
  flail: { name: '사슬 철퇴', cat: 'melee', ic: '퇴', desc: '철퇴를 크게 한 바퀴 휘둘러 주변 적 강타',
    base: { dmg: 22, cd: 2.6, R: 96, size: 15, dur: 0.7, kb: 260 },
    ups: [{ dmg: 0.3 }, { area: 0.15 }, { cd: 0.15 }, { dmg: 0.3 }, { area: 0.1, dmg: 0.2 }] },
  shuriken: { name: '수리검', cat: 'ranged', ic: '수', desc: '명중할 때마다 다음 적에게 튕기는 수리검',
    base: { dmg: 10, cd: 1.1, n: 1, pierce: 3, sp: 520, life: 1.4 },
    ups: [{ n: 1 }, { dmg: 0.3 }, { pierce: 1 }, { cd: 0.15 }, { n: 1, dmg: 0.2 }] },
  bomb: { name: '폭탄 투척', cat: 'ranged', ic: '탄', desc: '적이 가장 많이 모인 곳에 폭탄 투척, 착지 시 폭발',
    base: { dmg: 30, cd: 2.2, n: 1, R: 68, fly: 0.6 },
    ups: [{ dmg: 0.3 }, { area: 0.15 }, { n: 1 }, { cd: 0.15 }, { dmg: 0.3 }] },
  beam: { name: '빛줄기', cat: 'magic', ic: '광', desc: '가까운 적 방향으로 0.6초간 꿰뚫는 광선',
    base: { dmg: 7, cd: 2.0, len: 250, wid: 9, dur: 0.6, tick: 0.1 },
    ups: [{ dmg: 0.3 }, { area: 0.15 }, { cd: 0.15 }, { dmg: 0.3 }, { dmg: 0.2, area: 0.1 }] },
  vortex: { name: '회오리', cat: 'magic', ic: '풍', desc: '전방 적 무리 한가운데 회오리 생성, 주변 적을 끌어당기며 지속 피해',
    base: { dmg: 5, cd: 3.2, n: 1, R: 46, dur: 3, sp: 60, tick: 0.3, pull: 70 },
    ups: [{ dmg: 0.3 }, { area: 0.15 }, { n: 1 }, { cd: 0.15 }, { dmg: 0.3 }] },
});
WEAPON_ORDER.splice(0, WEAPON_ORDER.length, 'cleave', 'spin', 'shield', 'slam', 'lance', 'flail', 'arrow', 'boomerang', 'knife', 'trap', 'shuriken', 'bomb', 'fireball', 'lightning', 'icering', 'orb', 'beam', 'vortex');
Object.assign(W_UNIT, { shuriken: '수리검', bomb: '폭탄', vortex: '회오리' });
Object.assign(BRANCHES, {
  lance: [{ k: 'triple', nm: '삼연창', ds: '좌우로 창 2개 추가 (피해 60%)' }, { k: 'impale', nm: '꿰뚫기', ds: '찌르기 끝 지점 폭발 (피해 80%), 밀쳐내기 2배' }],
  flail: [{ k: 'twin', nm: '쌍철퇴', ds: '반대편에 철퇴 1개 추가' }, { k: 'quake', nm: '분쇄', ds: '휘두르기 종료 시 주변 충격파 (피해 60%)' }],
  shuriken: [{ k: 'ricochet', nm: '연쇄 투척', ds: '튕길 때마다 피해 +15%' }, { k: 'scatter', nm: '분산', ds: '첫 명중 시 작은 수리검 2개 분열 (피해 50%)' }],
  bomb: [{ k: 'cluster', nm: '집속탄', ds: '폭발 후 주변 작은 폭발 3회 (피해 40%)' }, { k: 'napalm', nm: '소이탄', ds: '폭발 자리에 2초 화염 장판 (0.4초마다 피해 20%)' }],
  beam: [{ k: 'prism', nm: '분광', ds: '광선 3갈래 (피해 55%)' }, { k: 'track', nm: '추적 광선', ds: '지속 중 가까운 적을 따라 회전, 지속 +0.3초' }],
  vortex: [{ k: 'storm', nm: '폭풍', ds: '지속 +1.5초, 크기 +20%' }, { k: 'burst', nm: '소멸 폭발', ds: '사라질 때 폭발 (지속 피해 1회분의 5배)' }],
});

/* ---------- 유물 16종 (기존 8 + 신규 8) ---------- */
RELICS.firetrap.b = 'bomb';                                        // 0.27 재료 균등 배분: 화염구 3회 → 2회
Object.assign(RELICS, {
  windlance: { name: '질풍 창', ic: '질', a: 'lance', b: 'swift', ds: '찌르기마다 같은 방향 바람 칼날 1발 (관통, 피해 50%)' },
  earthflail: { name: '대지 철퇴', ic: '대', a: 'flail', b: 'slam', ds: '휘두르기 종료 시 대지 충격파 (피해 50%)' },
  chainstar: { name: '연환 수리검', ic: '연', a: 'shuriken', b: 'multi', ds: '수리검 튕김 +2' },
  thunderbeam: { name: '뇌광', ic: '광', a: 'beam', b: 'lightning', ds: '광선 종료 시 가장 먼 적에게 낙뢰 (번개 피해 80%)' },
  eyestorm: { name: '폭풍의 눈', ic: '눈', a: 'vortex', b: 'magnet', ds: '회오리 범위 안 경험치를 플레이어에게 끌어옴' },
  bloodspin: { name: '피의 칼날', ic: '혈', a: 'spin', b: 'regen', ds: '회전검 처치 시 체력 0.6 회복 (처치 회복 합계 초당 최대 체력 0.18% 상한)' },
  clockwork: { name: '태엽 장치', ic: '태', a: 'boomerang', b: 'haste', ds: '도끼가 손에 돌아올 때 다른 무기 재사용 0.3초 단축' },
  bigorb: { name: '거대 구체', ic: '거', a: 'orb', b: 'area', ds: '마력 구체 크기 2배, 명중 시 작은 폭발 (피해 40%)' },
});
RELIC_ORDER.push('windlance', 'earthflail', 'chainstar', 'thunderbeam', 'eyestorm', 'bloodspin', 'clockwork', 'bigorb');

/* ---------- 피해원 분류 (직업 변환·원거리 판정·원소) ---------- */
Object.assign(SRC_CAT, { lance: 'melee', lance_x: 'melee', flail: 'melee', flail_q: 'melee', shuriken: 'ranged', bomb: 'ranged', bomb_c: 'ranged', bomb_pool: 'ranged', beam: 'magic', vortex: 'magic', vortex_x: 'magic' });
Object.assign(RANGED_SRC, { shuriken: 1, bomb: 1, bomb_c: 1, xbow: 1, thornshot: 1 });
Object.assign(ELEM, { beam: 'arcane', bomb_pool: 'fire', flameorb: 'fire', vortex_x: 'arcane' });

/* ---------- 발동 ---------- */
function lineHit(x, y, a, L, wd, f) {
  const cx = x + Math.cos(a) * L / 2, cy = y + Math.sin(a) * L / 2, ux = Math.cos(a), uy = Math.sin(a);
  gridQuery(cx, cy, L / 2 + wd + 20, e => { const dx = e.x - x, dy = e.y - y, t = dx * ux + dy * uy; if (t < -e.r || t > L + e.r) return; if (Math.abs(dx * uy - dy * ux) <= wd + e.r) f(e); });
}
function afx(o) { if (!G.afx) G.afx = []; if (G.afx.length < 120) G.afx.push(Object.assign({ t: 0 }, o)); }
Object.assign(WEAPON_FIRE, {
  /* 창 찌르기: 직선 관통 · 삼연창 분기 좌우 2개 · 꿰뚫기 분기 끝 폭발 */
  lance(w, S) {
    const D = WEAPONS.lance.base, p = G.p, L = D.range * S.area, wd = D.wid * (0.8 + 0.2 * S.area), a0 = aimAng(L * 1.3);
    const kb = D.kb * (w.br === 'impale' ? 2 : 1), col = jobTint('melee') || '#fff0d0';
    const one = (a, dm) => { lineHit(p.x, p.y, a, L, wd, e => damageEnemy(e, dm, { src: 'lance', kb, fx: p.x, fy: p.y })); afx({ k: 'thrust', x: p.x, y: p.y, a, L, wd, dur: 0.2, col }); };
    one(a0, S.dmg);
    if (w.br === 'triple') { one(a0 - 0.35, S.dmg * 0.6); one(a0 + 0.35, S.dmg * 0.6); }
    if (w.br === 'impale') { const x = p.x + Math.cos(a0) * L, y = p.y + Math.sin(a0) * L; G.later.push({ t: 0.08, f: () => explode(x, y, 40, S.dmg * 0.8, 'lance_x', col) }); }
    if (hasRelic('windlance')) shoot({ kind: 'arrow', x: p.x, y: p.y, ang: a0, sp: 560, r: 8, dmg: S.dmg * 0.5, pierce: 99, life: 0.7, color: '#d8fff0', src: 'wind', wind: true });
  },
  /* 사슬 철퇴: 0.7초간 한 바퀴 휘두르기 (휘두르기 1회당 적별 1회 타격) */
  flail(w, S) {
    const p = G.p, tg = nearestEnemy(p.x, p.y, 200);
    w.sw = { t: 0, a0: tg ? Math.atan2(tg.y - p.y, tg.x - p.x) - Math.PI / 2 : rand(Math.PI * 2), id: ++G.pid, S };
  },
  /* 수리검: 명중 시 다음 적으로 튕김 */
  shuriken(w, S) {
    const D = WEAPONS.shuriken.base, a0 = aimAng(), b = S.pierce + (hasRelic('chainstar') ? 2 : 0);
    for (let i = 0; i < S.n; i++) shoot({ kind: 'star', x: G.p.x, y: G.p.y, ang: a0 + (i - (S.n - 1) / 2) * 0.3, sp: D.sp, r: 6, dmg: S.dmg, pierce: b, life: D.life, color: '#e8ecff', src: 'shuriken', bounce: true, ric: w.br === 'ricochet', scat: w.br === 'scatter' });
  },
  /* 폭탄 투척: 밀집 지점 착탄 */
  bomb(w, S) {
    const D = WEAPONS.bomb.base, p = G.p, cand = shuffle(enemiesInRange(p.x, p.y, 320)).slice(0, 10);
    if (!cand.length) return false;
    if (!G.bombs) G.bombs = [];
    const scored = cand.map(e => { let n = 0; gridQuery(e.x, e.y, 60, () => { n++; }); return [n - Math.sqrt(dist2(e.x, e.y, p.x, p.y)) / 60, e]; }).sort((a, b) => b[0] - a[0]);   // 0.39 가까운 밀집 지점 우선
    for (let i = 0; i < S.n; i++) {
      const e = (scored[i] || scored[0])[1], j = i ? 30 : 0;
      G.bombs.push({ x0: p.x, y0: p.y, x: e.x + rand(-j, j), y: e.y + rand(-j, j), t: 0, fly: D.fly + i * 0.08, R: D.R * S.area, dmg: S.dmg, br: w.br });
    }
  },
  /* 빛줄기: 0.6초 지속 광선 */
  beam(w, S) {
    const D = WEAPONS.beam.base, p = G.p, L = D.len * (0.85 + 0.15 * S.area);
    if (!nearestEnemy(p.x, p.y, L)) return false;
    w.bm = { t: 0, tk: 0, a: aimAng(L), dur: D.dur + (w.br === 'track' ? 0.3 : 0), S, L, wd: D.wid * S.area, far: null };
  },
  /* 회오리 (0.37): 전방 적 무리 지점(플레이어와 140 이상)에 생성, 바깥쪽으로 천천히 이동 */
  vortex(w, S) {
    const D = WEAPONS.vortex.base, p = G.p; if (!G.vortex) G.vortex = [];
    const fa = Math.atan2(p.face.y, p.face.x), far = enemiesInRange(p.x, p.y, 440).filter(e => dist2(e.x, e.y, p.x, p.y) >= 140 * 140);
    if (!far.length && !nearestEnemy(p.x, p.y, 440)) return false;
    const front = far.filter(e => Math.cos(Math.atan2(e.y - p.y, e.x - p.x) - fa) > 0), pool = shuffle(front.length ? front : far).slice(0, 12);
    const scored = pool.map(e => { let n = 0; gridQuery(e.x, e.y, 70, () => { n++; }); return [n, e]; }).sort((a, b) => b[0] - a[0]);
    for (let i = 0; i < S.n; i++) {
      if (G.vortex.length >= 8) G.vortex.shift();
      let x, y;
      if (scored.length) { const e = (scored[i] || scored[0])[1], j = i && !scored[i] ? 40 : 0; x = e.x + rand(-j, j); y = e.y + rand(-j, j); }
      else { const a = fa + i * 2.1; x = p.x + Math.cos(a) * 180; y = p.y + Math.sin(a) * 180; }
      const dx = x - p.x, dy = y - p.y, d = Math.hypot(dx, dy) || 1;
      if (d < 140) { x = p.x + dx / d * 140; y = p.y + dy / d * 140; }
      const a = Math.atan2(y - p.y, x - p.x) + rand(-0.5, 0.5), sp = D.sp * 0.5;
      G.vortex.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, tk: 0, dur: D.dur + (w.br === 'storm' ? 1.5 : 0), R: D.R * S.area * (w.br === 'storm' ? 1.2 : 1), dmg: S.dmg, burst: w.br === 'burst', spin: rand(7) });
    }
  },
});

/* ---------- 매 틱 갱신 ---------- */
function updateArsenal(dt) {
  const p = G.p;
  for (const w of p.weapons) {
    if (w.sw) {                                                     // 사슬 철퇴 휘두르기
      const D = WEAPONS.flail.base, s = w.sw, S = s.S, R = D.R * S.area, bs = D.size * (0.8 + 0.2 * S.area);
      s.t += dt; const k = Math.min(1, s.t / D.dur), n = w.br === 'twin' ? 2 : 1;
      for (let i = 0; i < n; i++) {
        const a = s.a0 + Math.PI * 2 * k + i * Math.PI, bx = p.x + Math.cos(a) * R, by = p.y + Math.sin(a) * R;
        gridQuery(bx, by, bs, e => { const key = 'fl' + s.id; if (!e.ht[key]) { e.ht[key] = 1; damageEnemy(e, S.dmg, { src: 'flail', kb: D.kb, fx: p.x, fy: p.y }); } });
      }
      s.a = s.a0 + Math.PI * 2 * k; s.R = R; s.bs = bs; s.n = n;
      if (k >= 1) {
        if (w.br === 'quake') explode(p.x, p.y, R * 1.05, S.dmg * 0.6, 'flail_q', jobTint('melee') || '#d8c8a0');
        if (hasRelic('earthflail')) slamWave(p.x, p.y, R * 0.8, S.dmg * 0.5, 120);
        w.sw = null;
      }
    }
    if (w.bm) {                                                     // 빛줄기 지속
      const D = WEAPONS.beam.base, b = w.bm; b.t += dt; b.tk -= dt;
      if (w.br === 'track') { const t = nearestEnemy(p.x, p.y, b.L); if (t) { let da = Math.atan2(t.y - p.y, t.x - p.x) - b.a; da = Math.atan2(Math.sin(da), Math.cos(da)); b.a += clamp(da, -3 * dt, 3 * dt); } }
      if (b.tk <= 0) {
        b.tk = D.tick; const angs = w.br === 'prism' ? [b.a - 0.3, b.a, b.a + 0.3] : [b.a], dm = b.S.dmg * (w.br === 'prism' ? 0.55 : 1);
        for (const a of angs) lineHit(p.x, p.y, a, b.L, b.wd, e => { damageEnemy(e, dm, { src: 'beam' }); if (!e.dead && (!b.far || dist2(e.x, e.y, p.x, p.y) > dist2(b.far.x, b.far.y, p.x, p.y))) b.far = e; });
      }
      if (b.t >= b.dur) {
        if (hasRelic('thunderbeam') && b.far && !b.far.dead) { const e = b.far; fx({ kind: 'bolt', x: e.x, y: e.y, dur: 0.18 }); damageEnemy(e, WEAPONS.lightning.base.dmg * 0.8 * p.mod.dmg, { src: 'thunder' }); }
        w.bm = null;
      }
    }
  }
  if (G.bombs && G.bombs.length) {                                  // 폭탄 비행·착탄
    for (const b of G.bombs) {
      b.t += dt; if (b.t < b.fly) continue; b.dead = true;
      const col = jobTint('ranged') || '#ffb860';
      explode(b.x, b.y, b.R, b.dmg, 'bomb', col); shake(1.5, 0.12);
      if (b.br === 'napalm') addPool({ x: b.x, y: b.y, r: b.R * 0.8, dur: 2, every: 0.4, dmg: b.dmg * 0.2, src: 'bomb_pool', kind: 'fire' });
      if (b.br === 'cluster') for (let i = 0; i < 3; i++) { const a = rand(Math.PI * 2), d = rand(30, 60), x = b.x + Math.cos(a) * d, y = b.y + Math.sin(a) * d; G.later.push({ t: 0.15 + i * 0.1, f: () => explode(x, y, b.R * 0.5, b.dmg * 0.4, 'bomb_c', col) }); }
    }
    G.bombs = G.bombs.filter(b => !b.dead);
  }
  if (G.vortex && G.vortex.length) {                                // 회오리
    const D = WEAPONS.vortex.base;
    for (const v of G.vortex) {
      v.t += dt; v.tk -= dt; v.spin += dt * 9; v.x += v.vx * dt; v.y += v.vy * dt;
      gridQuery(v.x, v.y, v.R * 1.6, e => { if (e.cmd || e.boss || e.gk) return; if (dist2(e.x, e.y, G.p.x, G.p.y) < 90 * 90) return; const dx = v.x - e.x, dy = v.y - e.y, d = Math.hypot(dx, dy) || 1; if (d > 8) { e.x += dx / d * D.pull * dt; e.y += dy / d * D.pull * dt; } });
      if (v.tk <= 0) { v.tk = D.tick; gridQuery(v.x, v.y, v.R, e => { if ((e.vxT || 0) > G.time) return; e.vxT = G.time + D.tick * 0.9; damageEnemy(e, v.dmg, { src: 'vortex' }); }); }   // 0.39 회오리 중첩 지속 피해 중복 제외
      if (hasRelic('eyestorm')) for (const g of G.gems) if (!g.mag && dist2(g.x, g.y, v.x, v.y) < v.R * v.R * 2.2) g.mag = true;
      if (v.t >= v.dur) { v.dead = true; if (v.burst) explode(v.x, v.y, v.R * 1.3, v.dmg * 5, 'vortex_x', jobTint('magic') || '#c8f0ff'); }
    }
    G.vortex = G.vortex.filter(v => !v.dead);
  }
  if (G.afx && G.afx.length) { for (const f of G.afx) f.t += dt; G.afx = G.afx.filter(f => f.t < f.dur); }
}
/* 수리검 튕김: 맞힌 적 제외 가장 가까운 적으로 방향 전환 */
function bounceProj(pr, e) {
  let best = null, bd = 220 * 220;
  gridQuery(pr.x, pr.y, 220, t => { if (t === e || pr.hits.has(t.id) || t.dead) return; const d = dist2(t.x, t.y, pr.x, pr.y); if (d < bd) { bd = d; best = t; } });
  if (!best) { pr.dead = true; return; }
  const a = Math.atan2(best.y - pr.y, best.x - pr.x), sp = Math.hypot(pr.vx, pr.vy);
  pr.vx = Math.cos(a) * sp; pr.vy = Math.sin(a) * sp; pr.life = Math.max(pr.life, 0.6);
  if (pr.ric) pr.dmg *= 1.15;
  if (pr.scat) { pr.scat = false; for (const da of [-0.6, 0.6]) { const s2 = shoot({ kind: 'star', x: pr.x, y: pr.y, ang: a + da, sp: 460, r: 4, dmg: pr.dmg * 0.5, pierce: 1, life: 0.8, color: '#e8ecff', src: 'shuriken', bounce: true, mini: true }); s2.hits.add(e.id); } }
}
/* 공용 유물 명중·처치 연계 */
function arsenalHit(e, o) {
  if (o.src === 'mbolt' && hasRelic('bigorb') && !o.bo) { const x = e.x, y = e.y, d = WEAPONS.orb.base.dmg * 0.4 * G.p.mod.dmg; G.later.push({ t: 0, f: () => explode(x, y, 34, d, 'mbolt_x', '#b8c8ff') }); }
  if (o.src === 'shard' && !e.dead) e.slowT = Math.max(e.slowT || 0, 1);
}
function relicKill(e) {
  if (e.ls === 'spin' && hasRelic('bloodspin')) killHeal(0.6, '피의 칼날');
}
function clockTick() { for (const w of G.p.weapons) if (w.id !== 'boomerang' && w.t > 0) w.t = Math.max(0.02, w.t - 0.3); }

/* ---------- 직업 전용 무기 1차 (전직 시 지급) ---------- */
const EXW1 = {
  warrior: { name: '전투 도끼', ic: '부', ds: '1.6초마다 가까운 적 방향 넓은 도끼 휘두르기', cd: 1.6, dmg: 31, R: 100 },
  rogue: { name: '그림자 칼날', ic: '영', ds: '2초마다 가까운 적 3체에게 그림자 베기', cd: 2.0, dmg: 25 },
  sovereign: { name: '금빛 방패', ic: '패', ds: '3초마다 주변 적 밀쳐내기, 1초간 받는 피해 -40%', cd: 3.0, dmg: 25, R: 90 },
  archer: { name: '연발 석궁', ic: '석', ds: '1.3초마다 가까운 적에게 석궁 3연사', cd: 1.3, dmg: 20 },
  engineer: { name: '전기 코일', ic: '코', ds: '1초마다 가까운 적 2체에게 전기 방전', cd: 1.0, dmg: 22, R: 200 },
  chrono: { name: '시간 파편', ic: '편', ds: '1.5초마다 네 방향 시간 파편, 명중 적 1초 둔화', cd: 1.5, dmg: 21 },
  mage: { name: '불꽃 구슬', ic: '불', ds: '1.4초마다 작은 화염구 2발, 화염 속성', cd: 1.4, dmg: 20, R: 44 },
  summoner: { name: '해골 손', ic: '손', ds: '1.8초마다 적 2체 발밑에서 뼈 손이 솟아 피해·짧은 속박', cd: 1.8, dmg: 28, R: 34 },
  priest: { name: '축복 고리', ic: '복', ds: '4초마다 체력 2% 회복 + 주변 신성 피해', cd: 4.0, dmg: 22, R: 100 },
  druid: { name: '가시 사출', ic: '가', ds: '1.6초마다 여덟 방향 가시 발사', cd: 1.6, dmg: 14 },
};
function updateExw1(dt) {
  const p = G.p, x = p.exw1; if (!x) return;
  const D = EXW1[x.id], dm = D.dmg * p.mod.dmg;
  x.t -= dt / p.mod.cd; if (x.t > 0) return; x.t = D.cd;
  const col = JOB_COL[x.id];
  switch (x.id) {
    case 'warrior': { const t = nearestEnemy(p.x, p.y, D.R * 1.4); const a0 = t ? Math.atan2(t.y - p.y, t.x - p.x) : Math.atan2(p.face.y, p.face.x);
      gridQuery(p.x, p.y, D.R, e => { let da = Math.atan2(e.y - p.y, e.x - p.x) - a0; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) <= 1.25) damageEnemy(e, dm, { src: 'waraxe', kb: 200, fx: p.x, fy: p.y }); });
      fx({ kind: 'arc', a: a0, arc: 2.5, r: D.R, dur: 0.18, color: col }); break; }
    case 'rogue': { const ts = enemiesInRange(p.x, p.y, 220).sort((a, b) => dist2(a.x, a.y, p.x, p.y) - dist2(b.x, b.y, p.x, p.y)).slice(0, 3); if (!ts.length) { x.t = 0.3; break; }
      ts.forEach((e, i) => G.later.push({ t: i * 0.07, f: () => { if (e.dead) return; fx({ kind: 'slash', x: e.x, y: e.y, a: rand(7), dur: 0.22, color: '#203040' }); damageEnemy(e, dm, { src: 'shade' }); } })); break; }
    case 'sovereign': gridQuery(p.x, p.y, D.R, e => damageEnemy(e, dm, { src: 'gshield', kb: 380, fx: p.x, fy: p.y })); G.tm.wall = Math.max(G.tm.wall || 0, 1);
      fx({ kind: 'ring', x: p.x, y: p.y, r0: 12, r1: D.R, dur: 0.25, color: col, fill: true }); break;
    case 'archer': { if (!nearestEnemy(p.x, p.y, 500)) { x.t = 0.3; break; } for (let i = 0; i < 3; i++) G.later.push({ t: i * 0.1, f: () => shoot({ kind: 'arrow', x: G.p.x, y: G.p.y, ang: aimAng(), sp: 640, r: 5, dmg: dm, pierce: 1, life: 0.9, color: col, src: 'xbow' }) }); break; }
    case 'engineer': { const ts = enemiesInRange(p.x, p.y, D.R).sort((a, b) => dist2(a.x, a.y, p.x, p.y) - dist2(b.x, b.y, p.x, p.y)).slice(0, 2); if (!ts.length) { x.t = 0.3; break; }
      for (const e of ts) { fx({ kind: 'zap', x: p.x, y: p.y, x2: e.x, y2: e.y, dur: 0.16 }); damageEnemy(e, dm, { src: 'coil' }); } break; }
    case 'chrono': { x.rot = (x.rot || 0) + 0.4; for (let i = 0; i < 4; i++) shoot({ kind: 'orb', x: p.x, y: p.y, ang: x.rot + i * Math.PI / 2, sp: 300, r: 5, dmg: dm, pierce: 2, life: 1.0, color: col, src: 'shard' }); break; }
    case 'mage': { const a0 = aimAng(420); for (let i = 0; i < 2; i++) shoot({ kind: 'fire', x: p.x, y: p.y, ang: a0 + (i ? 0.3 : -0.3), sp: 300, r: 6, dmg: dm, R: D.R, life: 1.0, color: '#ff8a3a', src: 'flameorb' }); break; }
    case 'summoner': { const ts = shuffle(enemiesInRange(p.x, p.y, 300)).slice(0, 2); if (!ts.length) { x.t = 0.3; break; }
      for (const e of ts) { const ex = e.x, ey = e.y; afx({ k: 'hand', x: ex, y: ey, dur: 0.45 }); gridQuery(ex, ey, D.R, t => { if (!t.cmd && !t.boss && !t.gk) t.frz = Math.max(t.frz || 0, 0.4); damageEnemy(t, dm, { src: 'bonehand' }); }); } break; }
    case 'priest': heal(p.maxHp * 0.02, '축복 고리'); gridQuery(p.x, p.y, D.R, e => damageEnemy(e, dm, { src: 'bless' }));
      fx({ kind: 'ring', x: p.x, y: p.y, r0: 20, r1: D.R, dur: 0.4, color: col, fill: true, follow: true }); break;
    case 'druid': for (let i = 0; i < 8; i++) shoot({ kind: 'arrow', x: p.x, y: p.y, ang: i * Math.PI / 4 + (x.t2 = !x.t2) * 0.2, sp: 420, r: 4, dmg: dm, pierce: 1, life: 0.5, color: '#9fe08a', src: 'thornshot' }); break;
  }
}

/* ---------- 그리기 ---------- */
SPR.star = { px: 2, frames: [['...k...', '..kMk..', '..kWk..', 'kMWWWMk', '..kWk..', '..kMk..', '...k...']] };
function drawArsenal(c, inView) {
  const p = G.p;
  if (G.vortex) for (const v of G.vortex) {                         // 회오리: 회전 나선 3겹
    if (!inView(v.x, v.y, v.R + 10)) continue;
    const fade = Math.min(1, (v.dur - v.t) * 3, v.t * 5), col = jobTint('magic') || '#c8f0ff';
    if(paintedEffect(c,'wind',v.x,v.y,v.R,.7*fade,v.spin)){effectBoundary(c,v.x,v.y,v.R,col,.2*fade);continue;}
    c.globalAlpha = 0.18 * fade; c.fillStyle = col; c.beginPath(); c.arc(v.x, v.y, v.R, 0, 7); c.fill();
    c.lineWidth = 2.5;
    for (let i = 0; i < 3; i++) { c.globalAlpha = (0.75 - i * 0.18) * fade; c.strokeStyle = i ? col : '#ffffff'; const r = v.R * (0.35 + i * 0.28); c.beginPath(); c.arc(v.x, v.y, r, v.spin * (1 + i * 0.3) + i * 2, v.spin * (1 + i * 0.3) + i * 2 + 3.6); c.stroke(); }
    c.globalAlpha = 1;
  }
  for (const w of p.weapons) {
    if (w.sw && w.sw.R) {                                           // 사슬 철퇴: 사슬 + 철퇴 + 궤적
      const s = w.sw, col = jobTint('melee') || '#e8e0d0';
      for (let i = 0; i < s.n; i++) {
        const a = s.a + i * Math.PI, bx = p.x + Math.cos(a) * s.R, by = p.y + Math.sin(a) * s.R;
        c.globalAlpha = 0.35; c.strokeStyle = col; c.lineWidth = s.bs * 1.2; c.beginPath(); c.arc(p.x, p.y, s.R, a - 0.9, a); c.stroke();
        c.globalAlpha = 0.9; c.strokeStyle = '#8a8a9a'; c.lineWidth = 2; c.setLineDash([4, 3]); c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(bx, by); c.stroke(); c.setLineDash([]);
        c.globalAlpha = 1; drawSpriteRot(c, 'flail', 0, bx, by, a + G.time * 6, { mul: s.bs > 11 ? 2 : 1 });   // 0.29 도트 철퇴
      }
    }
    if (w.bm && !summonerUsesBaseArt(w)) {                          // 빛줄기: 외곽 발광 + 백색 중심선
      const b = w.bm, fade = Math.min(1, (b.dur - b.t) * 6, b.t * 12), col = jobTint('magic') || '#9fd8ff';
      const angs = w.br === 'prism' ? [b.a - 0.3, b.a, b.a + 0.3] : [b.a];
      for (const a of angs) {
        const ex = p.x + Math.cos(a) * b.L, ey = p.y + Math.sin(a) * b.L;
        if(paintedBeam(c,p.x,p.y,a,b.L,b.wd*1.4,fade)){paintedAura(c,'holy',ex,ey,b.wd*1.3,.6*fade);continue;}c.lineCap = 'round';
        for (const [wd, cl, al] of [[b.wd * 2.6, col, 0.25], [b.wd * 1.4, col, 0.55], [b.wd * 0.5, '#ffffff', 1]]) { c.globalAlpha = al * fade; c.strokeStyle = cl; c.lineWidth = wd; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(ex, ey); c.stroke(); }
        c.globalAlpha = 0.8 * fade; c.fillStyle = '#ffffff'; c.beginPath(); c.arc(ex, ey, b.wd * 0.9 + Math.sin(G.time * 40) * 2, 0, 7); c.fill();
        c.lineCap = 'butt';
      }
      c.globalAlpha = 1;
    }
  }
  if (G.bombs) for (const b of G.bombs) {                           // 폭탄: 착탄 표시(금색 점선) + 그림자 + 포물선 비행
    const k = b.t / b.fly, x = lerp(b.x0, b.x, k), y = lerp(b.y0, b.y, k), h = Math.sin(Math.PI * k) * 60;
    c.strokeStyle = 'rgba(255,214,120,0.7)'; c.lineWidth = 1.5; c.setLineDash([5, 4]); c.beginPath(); c.arc(b.x, b.y, b.R * (0.5 + 0.5 * k), 0, 7); c.stroke(); c.setLineDash([]);
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(x, y + 4, 6, 3, 0, 0, 7); c.fill();
    drawSpriteRot(c, 'bomb', (G.time * 12) & 1, x, y - h, k * 6);   // 0.29 도트 폭탄 (회전 비행, 심지 깜빡임)
  }
  if (G.afx) for (const f of G.afx) {
    if (warriorArtReady(f.warArt) || rogueArtReady(f.rogueArt) || chronoArtReady(f.chronoArt) || mageArtReady(f.mageArt) || summonerArtReady(f.summonerArt) || priestArtReady(f.priestArt)) continue;
    const k = f.t / f.dur;
    if (f.k === 'thrust') {                                         // 창 찌르기: 뻗었다 사라지는 창날 궤적
      const ext = Math.min(1, k * 4), L = f.L * ext, ux = Math.cos(f.a), uy = Math.sin(f.a), nx = -uy, ny = ux, x = p.x, y = p.y, fade = 1 - Math.max(0, (k - 0.3) / 0.7);
      c.globalAlpha = 0.3 * fade; c.fillStyle = f.col; c.beginPath(); c.moveTo(x + nx * f.wd, y + ny * f.wd); c.lineTo(x + ux * L, y + uy * L); c.lineTo(x - nx * f.wd, y - ny * f.wd); c.closePath(); c.fill();
      c.globalAlpha = 0.95 * fade; c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + ux * L * 0.2, y + uy * L * 0.2); c.lineTo(x + ux * L, y + uy * L); c.stroke();
      drawSpriteRot(c, 'spear', 0, x + ux * (L - 2), y + uy * (L - 2), f.a);   // 0.29 도트 창날
    }
    if (f.k === 'hand') {                                           // 해골 손: 솟았다 가라앉는 뼈 손가락
      const up = Math.sin(Math.PI * Math.min(1, k)) * 16; c.globalAlpha = 1 - k * 0.5;
      c.fillStyle = 'rgba(40,20,60,0.45)'; c.beginPath(); c.ellipse(f.x, f.y + 3, 14, 5, 0, 0, 7); c.fill();
      c.save(); c.beginPath(); c.rect(f.x - 14, f.y - 30, 28, 32); c.clip(); drawSprite(c, 'bhand', 0, f.x, f.y + 16 - up, {}); c.restore();   // 0.29 도트 해골 손 (땅에서 솟음)
    }
    c.globalAlpha = 1;
  }
}
