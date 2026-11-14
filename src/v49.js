/* ============================================================
   0.49 체감 수정 2차 (회차 54, 표현·보강 단계)
   • 진동: 자동 플레이에서도 울림, 가상 시험(브라우저 자동화)에서만 차단 (meta.js vibe 동일 수정)
   • 범위 안 그림: 절정 불투명도 90%대, 옅어지기 시작 시점 지연, 그라데이션은 가장자리에만 얇게
   • 타격 성격 표시 제거, 무기 분기 형태 표시 제거 (각성·연성 후 첫 발동 강조는 유지)
   • 몬스터 사망 동작: 터짐(슬라임·젤리·버섯)·무너짐(해골)·흩어짐(박쥐·불꽃)·쓰러짐(오우거·멧돼지·방패병·고블린)
     일반 잡몹은 가볍게, 정예는 크게 (가벼운 동작 = 가벼운 효과 원칙), 수문장·마왕은 기존 연출 유지
   • 군주 근위병: 군기 경계 안 적 30% 감속(수문장·마왕 제외), 침입 적에게 달려가 창 찌르기(중간 효과)·3타마다 방패 밀치기(큰 효과),
     침입자 없으면 군기 가장자리에서 바깥 경계(회전 폐지), 궁극기 군기 확대 시 대기 위치·활동 범위 확대
   • 전부 임시 표현, 최종본 아님 → GPT_REQUESTS G49 대상
   • 시험 집계: G.stats.v49 { corpse, kinds, gChase, gStab, gBash, slow }
   ============================================================ */
const V49 = {
  slow: 0.7, gSpd: 235, gReach: 26, bashN: 3, postR: 0.9, watch: 170,
  ringA: 0.92, poolA: 0.8, corpseMax: 90,
  death: { slime: 'pop', jelly: 'pop', mush: 'pop', skel: 'crumble', bat: 'scatter', wisp: 'scatter', brute: 'fall', boar: 'fall', knight: 'fall', gob: 'fall' },
  dur: { pop: 0.3, crumble: 0.42, scatter: 0.3, fall: 0.5 },
};
const S49 = () => G.stats.v49 || (G.stats.v49 = { corpse: 0, kinds: {}, gChase: 0, gStab: 0, gBash: 0, slow: 0 });
const BOT49 = !!navigator.webdriver;

/* ---------- 진동: 자동 플레이 허용 ---------- */
vib48 = function (k) {
  const V = S48().vib; V[k] = (V[k] || 0) + 1;
  if (!SETTINGS.vibe || BOT49 || !navigator.vibrate) return;
  try { navigator.vibrate(V48.vib[k]); } catch (err) { }
};

/* ---------- 표시 제거: 타격 성격·분기 형태 ---------- */
mark47 = function () { };
form47 = function (w) { if (w && w.big47) bigFire47(w); };

/* ---------- 범위 안 그림 또렷하게 ---------- */
remap48 = (function (prev) {
  return function (f, k) {
    if (f.kind !== 'ring') return prev(f, k);
    if (k < 0.35) return k * 1.6;                       // 확장: 판정 속도와 맞춤
    if (k < 0.7) return 0.56 + (k - 0.35) * 0.4;        // 절정 유지 (진하게 오래)
    return 0.7 + (k - 0.7);                             // 소멸
  };
})(remap48);
const fade49 = k => k < 0.45 ? 1 : Math.max(0, 1 - ((k - 0.45) / 0.55) ** 1.6);
paintedRing = function (c, f, k, x, y) {
  if (f.kind !== 'ring') return false;
  const r = Math.max(1, lerp(f.r0, f.r1, 1 - (1 - k) ** 2));
  const key = f.art || (f.element === 'ice' ? (f.fill ? 'shatter' : 'frost') : f.element === 'earth' ? 'earth' : effectKey(f.color, f.fill));
  const A = fade49(k);
  if (!paintedEffect(c, key, x, y, r, V49.ringA * A, k * .2)) return false;
  rangeEdge48(c, x, y, r, f.color || '#dfcfaa', .42 * A, f.k48 || (f.element === 'ice' ? 'dot' : null), f); return true;
};
paintedPool = function (c, z) {
  const key = { trail: 'heal', vine: 'vine', crack: 'earth', fire: 'fire' }[z.kind] || 'fire', fade = clamp((z.dur - z.t) * 3, 0, 1);
  if (!paintedEffect(c, key, z.x, z.y, z.r, V49.poolA * fade)) return false;
  rangeEdge48(c, z.x, z.y, z.r, z.kind === 'fire' || !z.kind ? '#ffcc8a' : '#c0d5ad', .3 * fade, z.kind ? POOLK48[z.kind] : 'blast', z); return true;
};
/* 가장자리 띠: 안쪽 채움 제거, 바깥 테두리 부근만 얇게 */
bandStamp48 = function (col) {
  const key = 'v49' + col; let cv = BAND48.get(key); if (cv) return cv;
  const [r, g, b] = rgb48(col), S = 128;
  cv = document.createElement('canvas'); cv.width = cv.height = S;
  const x = cv.getContext('2d'), gr = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  gr.addColorStop(0, `rgba(${r},${g},${b},0)`); gr.addColorStop(0.86, `rgba(${r},${g},${b},0)`);
  gr.addColorStop(0.94, `rgba(${r},${g},${b},0.55)`); gr.addColorStop(0.975, `rgba(${r},${g},${b},0.8)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
  x.fillStyle = gr; x.fillRect(0, 0, S, S);
  if (BAND48.size >= 28) BAND48.delete(BAND48.keys().next().value);
  BAND48.set(key, cv); return cv;
};

/* ---------- 몬스터 사망 동작 ---------- */
const C49 = () => G.c49 || (G.c49 = []);
const _jKill49 = jKill;
jKill = function (e) {
  _jKill49(e);
  try { corpse49(e); } catch (err) { if (BOT49) throw err; }
};
function corpse49(e) {
  if (!e || e.gk || e.boss || e.rit || e.fixed) return;
  const kind = V49.death[e.type]; if (!kind) return;
  const L = C49(), max = vfxLite() ? 40 : V49.corpseMax;
  if (L.length >= max) L.shift();
  const nm = spriteFor(e), pose = nm ? motionPose(e) : null, big = !!e.elite;
  const away = Math.atan2(e.y - G.p.y, e.x - G.p.x);
  L.push({ kind, x: e.x, y: e.y, r: e.r, color: e.color || '#ccc', nm, fr: pose ? pose.frame : 0, flip: pose ? pose.flip : false, mul: nm ? spriteMul(e) : 1,
    big, t: 0, dur: V49.dur[kind] * (big ? 1.5 : 1), side: Math.cos(away) >= 0 ? 1 : -1, a: away, e });
  const S = S49(); S.corpse++; S.kinds[kind] = (S.kinds[kind] || 0) + 1;
  bits49(e, kind, big);
}
/* 사망 파편: 터짐 방울·뼛조각·흩어지는 입자 (G.d48 입자 재사용, 생성은 사망 시점만) */
function bits49(e, kind, big) {
  if (VFX.reduced.matches) return;
  const D = D48(); if (D.length >= V48.dMax) return;
  const n = Math.min(V48.dMax - D.length, (kind === 'fall' ? 2 : 4) * (big ? 2 : 1) >> (vfxLite() ? 1 : 0));
  for (let i = 0; i < n; i++) {
    const b = vfxRand(Math.PI * 2), sp = vfxRand(50, 110) * (big ? 1.4 : 1);
    const q = { x: e.x, y: e.y, vx: Math.cos(b) * sp, vy: Math.sin(b) * sp, g: 0, t: 0, dur: vfxRand(0.25, 0.4), s: vfxRand(1.6, 2.6) * (big ? 1.4 : 1), col: e.color || '#ccc', sh: 'heavy', a: b };
    if (kind === 'pop') { q.sh = 'dot'; q.vy -= 30; q.g = 260; }
    else if (kind === 'crumble') { q.sh = 'heavy'; q.col = '#e6dfcc'; q.vy = -vfxRand(40, 90); q.g = 380; }
    else if (kind === 'scatter') { q.sh = 'blast'; q.vy -= 40; q.g = -30; q.s *= 0.8; }
    else { q.sh = 'heavy'; q.col = '#bba98c'; q.y += e.r * 0.8; q.vy = -vfxRand(20, 50); q.g = 300; q.vx *= 0.6; }
    D.push(q);
  }
}
function updCorpse49(dt) {
  const L = G.c49; if (!L || !L.length) return;
  for (const q of L) q.t += dt;
  G.c49 = L.filter(q => q.t < q.dur);
}
function drawCorpse49(c, inView) {
  const L = G.c49; if (!L || !L.length) return;
  const reduced = VFX.reduced.matches;
  for (const q of L) {
    if (!inView(q.x, q.y, q.r * 3)) continue;
    const k = clamp(q.t / q.dur, 0, 1), by = q.y + q.r * 0.95;
    let A = 1 - k, sx = 1, sy = 1, rot = 0, dx = 0, dy = 0, white = k < 0.12;
    if (reduced) { A = 1 - k; }
    else if (q.kind === 'pop') { const s = k < 0.35 ? 1 + 0.35 * (k / 0.35) : 1.35 + 0.4 * (k - 0.35); sx = s * (k < 0.35 ? 1.1 : 1); sy = s * (k < 0.35 ? 0.8 : 1); A = k < 0.35 ? 1 : 1 - (k - 0.35) / 0.65; }
    else if (q.kind === 'crumble') { sy = Math.max(0.15, 1 - k * 0.9); sx = 1 + k * 0.25; dy = 0; A = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4; }
    else if (q.kind === 'scatter') { sx = sy = 1 - k * 0.6; rot = q.side * k * 1.6; dy = -14 * k; }
    else { rot = q.side * (Math.PI / 2) * Math.min(1, ease48.out(Math.min(1, k / 0.55))); dx = Math.cos(q.a) * 8 * Math.min(1, k * 2); A = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3; }
    const S = q.big ? 1.12 : 1;
    c.save(); c.globalAlpha = clamp(A, 0, 1);
    c.translate(q.x + dx, by + dy); c.rotate(rot); c.scale(sx * S, sy * S); c.translate(-q.x, -by);
    if (q.nm) drawSprite(c, q.nm, q.fr, q.x, by, { flip: q.flip, mul: q.mul, mode: white ? 'white' : 'n' });
    else { c.fillStyle = white ? '#fff' : q.color; c.beginPath(); enemyPath(c, { x: q.x, y: q.y, r: q.r, shape: q.e.shape, type: q.e.type, t: q.e.t || 0, a: q.e.a || 0 }); c.fill(); }
    c.restore();
  }
  c.globalAlpha = 1;
}
const _drawEnemies49 = drawEnemies;
drawEnemies = function (c, inView) { drawCorpse49(c, inView); _drawEnemies49(c, inView); };

/* ---------- 군주 근위병: 경계 감속 + 침입자 요격 + 가장자리 경계 ---------- */
function bannerR49() { const b = G.banner; return b ? b.r * ultBannerR() : 0; }
const _chronoSlow49 = chronoSlow;
chronoSlow = function (e) {
  let m = _chronoSlow49(e);
  const b = G.banner;
  if (b && G.p.job === 'sovereign' && !e.gk && !e.boss) {
    const R = bannerR49();
    if (dist2(e.x, e.y, b.x, b.y) < R * R) { m *= V49.slow; S49().slow++; }
  }
  return m;
};
sovTick = function (dt) {
  const p = G.p, C = V41.sov, J = J41(), b = G.banner;
  if (b && p.job2 === 'conqueror') { b.x = p.x; b.y = p.y; }
  const n = b ? (p.job2 === 'benevolent' ? C.guardsB : C.guards) : 0;
  while (J.gd.length < n) J.gd.push({ x: p.x, y: p.y, t: 0, a: 0, pa: 0, n: 0, stab: 0, bash: 0, tg: null });
  J.gd.length = n; if (!n) return;
  const R = bannerR49(), R2 = R * R, S = S49();
  // 침입 적 목록 (군기 안), 가까운 순
  const intr = [];
  gridQuery(b.x, b.y, R, e => { if (!e.dead && !e.fixed && dist2(e.x, e.y, b.x, b.y) < R2) intr.push(e); });
  intr.sort((u, v) => dist2(u.x, u.y, b.x, b.y) - dist2(v.x, v.y, b.x, b.y));
  // 바깥 경계 방향: 군기 밖 가장 가까운 적
  let watchA = null, wd = 1e18;
  if (!intr.length) gridQuery(b.x, b.y, R + V49.watch, e => { if (e.dead) return; const d = dist2(e.x, e.y, b.x, b.y); if (d >= R2 && d < wd) { wd = d; watchA = Math.atan2(e.y - b.y, e.x - b.x); } });
  const taken = new Set();
  J.gd.forEach((g, i) => {
    g.stab = Math.max(0, g.stab - dt); g.bash = Math.max(0, g.bash - dt); g.t -= dt;
    // 표적 유지·배정: 다른 근위병과 겹치지 않게
    if (g.tg && (g.tg.dead || dist2(g.tg.x, g.tg.y, b.x, b.y) > R2 * 1.1)) g.tg = null;
    if (g.tg && taken.has(g.tg) && intr.length > taken.size) g.tg = null;
    if (!g.tg && intr.length) {
      let best = null, bd = 1e18;
      for (const e of intr) { if (taken.has(e) && intr.length > taken.size) continue; const d = dist2(e.x, e.y, g.x, g.y); if (d < bd) { bd = d; best = e; } }
      g.tg = best; if (best) S.gChase++;
    }
    if (g.tg) taken.add(g.tg);
    const e = g.tg;
    if (e) {
      const dx = e.x - g.x, dy = e.y - g.y, d = Math.hypot(dx, dy) || 1, reach = V49.gReach + (e.r || 10);
      g.a = Math.atan2(dy, dx);
      if (d > reach) { const st = Math.min(d - reach, V49.gSpd * dt); g.x += dx / d * st; g.y += dy / d * st; }
      else if (g.t <= 0) attack49(g, e, b, p, C);
    } else {
      // 가장자리 대기: 바깥 위협 방향 기준 균등 배치, 천천히 회전 보정
      const base = watchA != null ? watchA : g.pa;
      const want = base + i * Math.PI * 2 / n;
      let da = ((want - g.pa + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      if (i === 0 || watchA == null) g.pa += clamp(da, -2.2 * dt, 2.2 * dt);
      else g.pa = J.gd[0].pa;
      const pa = (i === 0 ? g.pa : J.gd[0].pa) + i * Math.PI * 2 / n;
      const tx = b.x + Math.cos(pa) * R * V49.postR, ty = b.y + Math.sin(pa) * R * V49.postR;
      const dx = tx - g.x, dy = ty - g.y, d = Math.hypot(dx, dy);
      if (d > 2) { const st = Math.min(d, V49.gSpd * dt); g.x += dx / d * st; g.y += dy / d * st; }
      g.a = pa;                                                // 바깥을 바라봄
      if (g.t <= 0) { const t = _nearestEnemy41(g.x, g.y, C.gR); if (t) { g.a = Math.atan2(t.y - g.y, t.x - g.x); attack49(g, t, b, p, C); } }
    }
  });
};
function attack49(g, e, b, p, C) {
  g.t = C.gAtk; g.n++;
  markSummonAttack(g, g.a);
  const dmg = (C.gDmg + C.gDmgLv * p.level) * p.mod.dmg, S = S49();
  if (g.n % V49.bashN === 0) {                                // 방패 밀치기: 큰 효과
    const ox = e.x - b.x, oy = e.y - b.y, od = Math.hypot(ox, oy) || 1;
    g.bash = 0.28; S.gBash++;
    damageEnemy(e, dmg * 1.2, { src: 'guardian', kb: 0, fx: g.x, fy: g.y });
    if (!e.dead && !e.gk && !e.boss) { e.kbx = (e.kbx || 0) + ox / od * 330; e.kby = (e.kby || 0) + oy / od * 330; }
    const fxX = g.x + Math.cos(g.a) * 14, fxY = g.y + Math.sin(g.a) * 14;
    fx({ kind: 'ring', x: fxX, y: fxY, r0: 6, r1: 38, dur: 0.3, color: '#ffd24a', fill: true });
    fx({ kind: 'arc', x: g.x, y: g.y, a: g.a, r: 26, spread: 1.6, dur: 0.22, color: '#fff2c0' });
    sparkBurst(fxX, fxY, 30, '#ffd24a'); shake(1.4, 0.1);
  } else {                                                     // 창 찌르기: 중간 효과
    g.stab = 0.18; S.gStab++;
    damageEnemy(e, dmg, { src: 'guardian', kb: 110, fx: g.x, fy: g.y });
    fx({ kind: 'slash', x: e.x, y: e.y, a: g.a, dur: 0.18, color: '#ffe9a8' });
  }
}
/* 근위병 동작 표시 (임시): 찌르기 시 앞으로 내딛기 + 창 궤적, 밀치기 시 방패 반원 */
function drawGuard49(c, inView) {
  const J = J41(); if (!J.gd || !J.gd.length || G.p.job !== 'sovereign') return;
  c.save(); c.lineCap = 'round';
  for (const g of J.gd) {
    if (!inView(g.x, g.y, 60)) continue;
    const gr = G.p.r * 1.55, ca = Math.cos(g.a), sa = Math.sin(g.a);
    if (g.stab > 0) {
      const k = 1 - g.stab / 0.18, L = gr * (1.1 + 1.4 * Math.sin(k * Math.PI));
      c.globalAlpha = 0.85 * (1 - k * 0.5); c.strokeStyle = '#fff6d0'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(g.x + ca * gr * 0.4, g.y + sa * gr * 0.4); c.lineTo(g.x + ca * L, g.y + sa * L); c.stroke();
      c.fillStyle = '#ffe08a'; c.beginPath(); c.arc(g.x + ca * L, g.y + sa * L, 2.6, 0, 7); c.fill();
    }
    if (g.bash > 0) {
      const k = 1 - g.bash / 0.28, rr = gr * (0.9 + 0.7 * k);
      c.globalAlpha = 0.8 * (1 - k); c.strokeStyle = '#ffd24a'; c.lineWidth = 5 * (1 - k) + 2;
      c.beginPath(); c.arc(g.x, g.y, rr, g.a - 0.9, g.a + 0.9); c.stroke();
      vfxGlow(c, g.x + ca * rr, g.y + sa * rr, 16, '#ffd24a', 0.5 * (1 - k));
    }
  }
  c.restore(); c.globalAlpha = 1;
}
const _drawFx49 = drawFx;
drawFx = function (c) { _drawFx49(c); drawGuard49(c, (x, y, r) => Math.abs(x - G.p.x) < VIEW.cameraW / 2 + r && Math.abs(y - G.p.y) < VIEW.cameraH / 2 + r); };

const _updateJuice49 = updateJuice;
updateJuice = function (dt) { _updateJuice49(dt); updCorpse49(dt); };
