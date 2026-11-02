/* ============================================================
   무기 — 레벨별 수치 계산 · 발동 · 투사체
   구현 출처: 초안 0.2l weapons.js 동작 재사용 (분기·유물·직업 연계 제거, 레벨 강화 표 방식으로 재구성)
   ============================================================ */
const W_UNIT = { spin: '검', arrow: '화살', boomerang: '도끼', fireball: '화염구', lightning: '낙뢰' };

/* 강화 1단계 설명문 (수치에서 생성) */
function upText(id, u) {
  const a = [];
  if (u.n) a.push(`${W_UNIT[id] || '개수'} +${u.n}`);
  if (u.dmg) a.push(`피해 +${Math.round(u.dmg * 100)}%`);
  if (u.area) a.push(`범위 +${Math.round(u.area * 100)}%`);
  if (u.cd) a.push(`재사용 -${Math.round(u.cd * 100)}%`);
  if (u.pierce) a.push(id === 'boomerang' ? `타격 수 +${u.pierce}` : `관통 +${u.pierce}`);
  if (u.rot) a.push(`회전 속도 +${Math.round(u.rot * 100)}%`);
  return a.join(', ');
}

/* 현재 레벨 수치: 1레벨 기본값 + 2~L레벨 강화 누적 + 보조 효과 */
function wStats(w) {
  const D = WEAPONS[w.id], B = D.base, M = G.p.mod;
  const s = { dmg: 0, area: 0, cd: 0, n: 0, pierce: 0, rot: 0 };
  for (let i = 0; i < w.lvl - 1; i++) for (const k in D.ups[i]) s[k] += D.ups[i][k];
  // 분기 (0.5)
  let dm = 1, cm = 1;
  const br = w.br;
  if (br === 'wide') s.area += w.id === 'spin' ? 0.35 : 0.25;
  if (br === 'pierce') { s.pierce += 3; dm *= 1.15; }
  if (br === 'multi') s.n += 1;
  if (br === 'big') { s.area += 0.45; dm *= 1.2; cm *= 1.15; }
  if (pBr('might') === 'pen' && (w.id === 'arrow' || w.id === 'boomerang')) s.pierce += 1;
  // 직업 (0.6·0.7)
  if (G.p.job2 === 'archmage' && D.cat === 'magic') cm *= 0.8;
  if (G.p.job2 === 'berserk' && w.id === 'cleave' && G.p.fury >= 100) s.area += 0.3;
  if (G.p.job && JOBS[G.p.job].cat === D.cat) dm *= 1.1;                 // 전직 계열 무기 피해 +10%
  return {
    dmg: B.dmg * (1 + s.dmg) * M.dmg * dm,
    area: 1 + s.area,
    cd: (B.cd || 0) * (1 - s.cd) * M.cd * cm,
    n: (B.n || 1) + s.n,
    pierce: (B.pierce || 0) + s.pierce,
    rot: (B.rot || 0) * (1 + s.rot) / M.cd,          // 재사용 감소는 회전검 회전 속도로 환산
  };
}

function aimAng(range = 520) { const t = nearestEnemy(G.p.x, G.p.y, range); return t ? Math.atan2(t.y - G.p.y, t.x - G.p.x) : Math.atan2(G.p.face.y, G.p.face.x); }
function enemiesInRange(x, y, r) { const a = []; gridQuery(x, y, r, e => { a.push(e); }); return a; }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function shoot(o) {
  const pr = Object.assign({ id: ++G.pid, t: 0, life: 1, r: 4, pierce: 0, hits: new Set(), color: '#fff', kind: 'bolt', src: '' }, o);
  pr.vx = Math.cos(o.ang) * o.sp; pr.vy = Math.sin(o.ang) * o.sp;
  if (G.proj.length < 400) G.proj.push(pr);
  return pr;
}
function explode(x, y, R, dmg, src, color = '#ff9a4a') {
  gridQuery(x, y, R, e => damageEnemy(e, dmg, { src, kb: 80, fx: x, fy: y }));
  fx({ kind: 'ring', x, y, r0: R * 0.3, r1: R, dur: 0.28, color, fill: true });
}

const WEAPON_FIRE = {
  /* 대검 베기: 가까운 적 방향 부채꼴 */
  cleave(w, S) {
    const D = WEAPONS.cleave.base, p = G.p, range = D.range * S.area, arc = D.arc * (w.br === 'wide' ? 1.45 : 1);
    const tg = nearestEnemy(p.x, p.y, range * 1.4);
    const a0 = tg ? Math.atan2(tg.y - p.y, tg.x - p.x) : Math.atan2(p.face.y, p.face.x);
    slash(a0, arc, range, S.dmg, D.kb);
    if (w.br === 'double') G.later.push({ t: 0.18, f: () => slash(a0 + Math.PI, arc, range, S.dmg * 0.7, D.kb) });
    if (hasRelic('bladestorm')) G.tm.storm = 1.5;
  },
  /* 화살: 가까운 적 방향 직선, 다발 시 좁은 부채꼴 */
  arrow(w, S) {
    const D = WEAPONS.arrow.base, a0 = aimAng();
    for (let i = 0; i < S.n; i++) shoot({ kind: 'arrow', x: G.p.x, y: G.p.y, ang: a0 + (i - (S.n - 1) / 2) * 0.12, sp: D.sp, r: 5, dmg: S.dmg, pierce: S.pierce, life: D.life, color: '#d8ffc8', src: 'arrow', split: w.br === 'split' });
  },
  /* 부메랑 도끼: 0.45초 후 되돌아오며 왕복 타격, 관통 무제한, 적별 왕·복 각 1회 */
  boomerang(w, S) {
    const D = WEAPONS.boomerang.base, a0 = aimAng(400);
    const spread = w.br === 'multi' ? 0.9 : 0.5;
    for (let i = 0; i < S.n; i++) shoot({ kind: 'boom', x: G.p.x, y: G.p.y, ang: a0 + (i - (S.n - 1) / 2) * spread, sp: D.sp, r: D.size * S.area, dmg: S.dmg, pierce: 999, cap: S.pierce, ho: 0, hr: 0, life: 3, color: '#f0c890', src: 'boomerang', spin: 0, burst: w.br === 'burst', flame: hasRelic('flameaxe') ? 0.25 : 0 });
  },
  /* 화염구: 착탄 또는 사거리 끝에서 폭발 */
  fireball(w, S) {
    const D = WEAPONS.fireball.base, a0 = aimAng(420), R = D.R * S.area;
    for (let i = 0; i < S.n; i++) shoot({ kind: 'fire', x: G.p.x, y: G.p.y, ang: a0 + (i - (S.n - 1) / 2) * 0.25, sp: D.sp, r: 8, dmg: S.dmg, R, life: 1.0, color: '#ff8a3a', src: 'fireball', pool: w.br === 'pool' });
  },
  /* 번개: 사거리 안 무작위 적 낙뢰, 대상 없으면 0.25초 후 재시도 */
  lightning(w, S) {
    let ts = shuffle(enemiesInRange(G.p.x, G.p.y, WEAPONS.lightning.base.range));
    if (!ts.length) return false;
    if (w.br === 'focus') ts.sort((a, b) => b.hp - a.hp);
    for (let i = 0; i < S.n && i < ts.length; i++) {
      const e = ts[i]; fx({ kind: 'bolt', x: e.x, y: e.y, dur: 0.18 });
      if (w.br === 'focus') { const x = e.x, y = e.y; gridQuery(x, y, 40, t => damageEnemy(t, S.dmg * 1.3, { src: 'lightning' })); fx({ kind: 'ring', x, y, r0: 6, r1: 40, dur: 0.2, color: '#bfe4ff' }); }
      else { damageEnemy(e, S.dmg, { src: 'lightning' }); if (w.br === 'chain') chainBolt(e, 2, S.dmg * 0.6, 'chain'); }
    }
  },
};

function slash(a0, arc, range, dmg, kb) {
  const p = G.p;
  gridQuery(p.x, p.y, range, e => {
    let da = Math.atan2(e.y - p.y, e.x - p.x) - a0; da = Math.atan2(Math.sin(da), Math.cos(da));
    if (Math.abs(da) <= arc / 2 + 0.15) damageEnemy(e, dmg, { kb, fx: p.x, fy: p.y, src: 'cleave' });
  });
  fx({ kind: 'arc', a: a0, arc, r: range, dur: 0.16, color: '#ffe0d0' });
}
/* 회전검: 상시 회전, 적별 타격 간격 0.35초 · 투척 궤도 분기: 2.4초마다 0.8초간 반경 확장 (피해 130%) */
function updateSpin(w, S, dt) {
  const D = WEAPONS.spin.base, p = G.p, storm = G.tm.storm > 0 ? 2 : 1;
  let R = D.R * S.area, dm = S.dmg; const bsz = D.size * S.area;
  if (w.br === 'throw') { w.tt = ((w.tt || 0) + dt) % 2.4; if (w.tt < 0.8) { R *= 1 + 1.4 * Math.sin(Math.PI * w.tt / 0.8); dm *= 1.3; } }
  w.a = (w.a || 0) + S.rot * storm * dt; w.n = S.n; w.R = R; w.bs = bsz;
  for (let i = 0; i < S.n; i++) {
    const a = w.a + i * Math.PI * 2 / S.n, bx = p.x + Math.cos(a) * R, by = p.y + Math.sin(a) * R;
    gridQuery(bx, by, bsz, e => { if ((e.ht.spin || 0) <= G.time) { e.ht.spin = G.time + D.hitCd; damageEnemy(e, dm, { kb: D.kb, fx: p.x, fy: p.y, src: 'spin' }); } });
  }
}

function updateWeapons(dt) {
  for (const w of G.p.weapons) {
    const S = wStats(w);
    if (w.id === 'spin') { updateSpin(w, S, dt); continue; }
    w.t -= dt;
    if (w.t <= 0) {
      const r = WEAPON_FIRE[w.id](w, S); w.t = r === false ? 0.25 : S.cd;
      if (r !== false && pBr('haste') === 'echo' && Math.random() < 0.12) w.t = 0.05;   // 연속 발동 분기
    }
  }
  // 지연 실행 (연속 베기 등)
  for (const L of G.later) { L.t -= dt; if (L.t <= 0) { L.done = true; L.f(); } }
  if (G.later.length) G.later = G.later.filter(L => !L.done);
}

/* 투사체 이동·충돌 */
function updateProjectiles(dt) {
  const p = G.p;
  for (const pr of G.proj) {
    if (pr.dead) continue;
    pr.t += dt; pr.life -= dt;
    if (pr.kind === 'boom') {
      pr.spin += dt * 14;
      if (pr.t > 0.45) {
        const dx = p.x - pr.x, dy = p.y - pr.y, d = Math.hypot(dx, dy) || 1;
        pr.vx += dx / d * 1100 * dt; pr.vy += dy / d * 1100 * dt;
        const sp = Math.hypot(pr.vx, pr.vy); if (sp > 520) { pr.vx *= 520 / sp; pr.vy *= 520 / sp; }
        if (d < 22 && pr.t > 0.6) { pr.dead = true; continue; }
      }
      pr.x += pr.vx * dt; pr.y += pr.vy * dt;
      if (pr.burst && !pr.burstDone && pr.t > 0.45) { pr.burstDone = true; explode(pr.x, pr.y, 56, pr.dmg * 1.2, 'boomerang', '#f0c890'); }
      if (pr.flame) { pr.ft = (pr.ft || 0) - dt; if (pr.ft <= 0) { pr.ft = pr.flame; explode(pr.x, pr.y, 26, WEAPONS.fireball.base.dmg * 0.3 * G.p.mod.dmg, 'flame', '#ff9a4a'); } }
      const ret = pr.t > 0.45, key = 'b' + pr.id + (ret ? 'r' : 'o');   // 가는 길·돌아오는 길 적별 1회씩 타격 (0.2a)
      if ((ret ? pr.hr : pr.ho) < pr.cap)                                // 구간별 타격 수 상한 (0.2b)
        gridQuery(pr.x, pr.y, pr.r, e => { if (!e.ht[key]) { e.ht[key] = 1; damageEnemy(e, pr.dmg, { kb: 90, fx: pr.x, fy: pr.y, src: pr.src }); if (++pr[ret ? 'hr' : 'ho'] >= pr.cap) return false; } });
      if (pr.life <= 0) pr.dead = true;
      continue;
    }
    if (pr.home) {                                             // 추적 구체
      const t = nearestEnemy(pr.x, pr.y, 300);
      if (t) { const a = Math.atan2(t.y - pr.y, t.x - pr.x); pr.vx += Math.cos(a) * 900 * dt; pr.vy += Math.sin(a) * 900 * dt; const sp = Math.hypot(pr.vx, pr.vy); if (sp > 320) { pr.vx *= 320 / sp; pr.vy *= 320 / sp; } }
    }
    pr.x += pr.vx * dt; pr.y += pr.vy * dt;
    gridQuery(pr.x, pr.y, pr.r, e => {
      if (pr.dead || pr.hits.has(e.id)) return;
      pr.hits.add(e.id);
      if (pr.kind === 'fire' || pr.kind === 'shell') { fireBurst(pr); pr.dead = true; return false; }
      damageEnemy(e, pr.dmg, { kb: 40, fx: pr.x - pr.vx * 0.05, fy: pr.y - pr.vy * 0.05, src: pr.src });
      if (pr.split) { pr.split = false; const a = Math.atan2(pr.vy, pr.vx); for (const da of [-0.5, 0, 0.5]) { const s2 = shoot({ kind: 'arrow', x: pr.x, y: pr.y, ang: a + da, sp: 480, r: 4, dmg: pr.dmg * 0.5, pierce: 0, life: 0.5, color: '#d8ffc8', src: 'split' }); s2.hits.add(e.id); } }
      if (--pr.pierce < 0) { pr.dead = true; return false; }
    });
    if (pr.life <= 0 && !pr.dead) { pr.dead = true; if (pr.kind === 'fire' || pr.kind === 'shell') fireBurst(pr); }
  }
  G.proj = G.proj.filter(x => !x.dead);
}

/* 화염구 착탄: 폭발 + 불길 분기·화염 장판 유물 장판 */
function fireBurst(pr) {
  if (pr.kind === 'shell') { explode(pr.x, pr.y, pr.R, pr.dmg, pr.src, '#ffd890'); return; }
  explode(pr.x, pr.y, pr.R, pr.dmg, pr.src);
  if (pr.pool) addPool({ x: pr.x, y: pr.y, r: pr.R * 0.8, dur: 2.5, every: 0.4, dmg: pr.dmg * 0.25, src: 'fireball_pool', kind: 'fire' });
  if (hasRelic('firefield')) addPool({ x: pr.x, y: pr.y, r: pr.R * 0.9, dur: 2, every: 0.5, dmg: pr.dmg * 0.2, src: 'firefield', kind: 'fire' });
}
