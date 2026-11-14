/* ============================================================
   0.50 실기기 의견 반영 (회차 55, 표현·보강 단계)
   • 연성 5회 후에도 기본 무기 계속 발동 (v43.js baseRetired 수정, 본 파일 기록만)
   • 동료 지휘: 동료 간 간격 규칙은 겹침 방지 수준(10)으로 완화, 동그란 자리 배치 폐지
     - 공격: 각자 다가온 쪽에서 붙어 공격(자리 수 제한 없음), 공격 중 약간씩 위치 이동, 공격 사거리 +10
     - 대기: 고정 간격 원형 회전 폐지, 동료마다 다른 반경·속도로 느슨하게 배회
     - 표적 유지 우선: 큰 적이 순간이동(한 번에 70 이상 이동)하면 110 밖 공격자를, 평소에는 190 밖 공격자를
       그 적에 60 이상 더 가까운 동료와 표적 맞교환(투입 인원 유지), 가까운 동료가 없으면 기존 공격자 유지
   • 범위 그림: 안쪽 그림 옅게(18%), 내려치는 순간만 진하게(62%), 가장자리에 무기별 장식을 코드로 그림
     - 얼음: 얼음 결정 조각 / 대지: 안쪽으로 갈라지는 균열 + 바깥 돌 부스러기 / 방패: 겹겹이 퍼지는 물결
     - 화염: 불꽃 혀 / 덩굴: 가시 / 회복: 반짝임 / 그 외 무기: 마름모 문양
     - 성장·직업 연출 고리 등 무기 외 고리는 기존 방식 유지, 적 공격 예고 표시 현행 유지
   • 자동 플레이: 공격 예고 안 회피 최우선(목표 끌림 약화), 궁극기 정지 발동은 예고 밖에서만
     (전사·도적 무적 궁극기는 예고 발동까지 0.9초 넘게 남았을 때만 예외), 직업별 유리한 위치 규칙 10종
   • 시험 집계: G.stats.v50 { ultHz, ultStop, sovT, sovIn, sqTele, sqDrop, deco }
   ============================================================ */
const V50 = {
  gap: 10, reach: 10, tele: 70, teleFar: 110, bigFar: 190,
  inner: 0.18, flash: 0.62, band: 0.22,
  fight: { archer: [90, 130], mage: [70, 110], chrono: [60, 110], engineer: [95, 135], summoner: [110, 150], priest: [80, 120], druid: [70, 110], warrior: [0, 45], rogue: [0, 40], sovereign: [20, 70] },
};
const S50 = () => G.stats.v50 || (G.stats.v50 = { ultHz: 0, ultStop: 0, sovT: 0, sovIn: 0, sqTele: 0, sqDrop: 0, deco: 0 });

/* ---------- 동료 지휘 ---------- */
SQ46.gap = V50.gap;
const sd50 = u => u.sd50 || (u.sd50 = [Math.random(), Math.random(), Math.random(), Math.random() < 0.5 ? -1 : 1]);
goals46 = function (U, Gm, rOf) {
  const p = G.p;
  for (const u of U) {
    const s = sd50(u), e = u.tg;
    if (e) {
      // 다가온 쪽에서 붙음 + 약간의 흔들림 (자리 고정 없음)
      let ang = Math.atan2(u.y - e.y, u.x - e.x); if (!Number.isFinite(ang)) ang = s[0] * Math.PI * 2;
      ang += Math.sin(G.time * (0.7 + 0.5 * s[1]) + s[0] * 9) * 0.22;
      const D = e.r + rOf(u) + 1 + 3 * Math.sin(G.time * (1.1 + s[2]) + s[1] * 7);
      u.gx = e.x + Math.cos(ang) * D; u.gy = e.y + Math.sin(ang) * D; u.ang = ang;
    } else {
      // 느슨한 배회: 동료마다 다른 기준 각도·회전 속도·반경 주기
      const th = s[0] * Math.PI * 2 + G.time * (0.12 + 0.22 * s[1]) * s[3] + Math.sin(G.time * 0.37 + s[2] * 11) * 0.5;
      const R = Gm.rIn + (Gm.rOut - Gm.rIn) * (0.5 + 0.5 * Math.sin(G.time * (0.45 + 0.4 * s[2]) + s[0] * 13));
      u.gx = p.x + Math.cos(th) * R; u.gy = p.y + Math.sin(th) * R;
    }
  }
};
const _squad50 = squad46;
squad46 = function (U, o = {}) {
  if (U && U.length && G.p) {
    const S = S50(), p = G.p, nr2 = SQ46.near * SQ46.near;
    for (const e of G.enemies) {
      if (e.dead || !big46(e)) continue;
      if (e.px50 != null && Math.hypot(e.x - e.px50, e.y - e.py50) > V50.tele) { e.tp50 = G.time; S.sqTele++; }
      e.px50 = e.x; e.py50 = e.y;
    }
    // 교대: 큰 적과 멀리 떨어진 공격자 ↔ 그 적에 훨씬 가까운 다른 동료 (표적 맞교환, 투입 인원 유지)
    const per = !(U._t50 > G.time); if (per) U._t50 = G.time + 0.5;
    for (const a of U) {
      const e = a.tg; if (!e || e.dead || !big46(e) || a.ret) continue;
      const d = Math.hypot(a.x - e.x, a.y - e.y);
      if (!((e.tp50 === G.time && d > V50.teleFar) || (per && d > V50.bigFar))) continue;
      let c = null, cd = d - 60;
      for (const v of U) { if (v === a || v.ret || (v.tg && (big46(v.tg) || dist2(v.tg.x, v.tg.y, p.x, p.y) < nr2))) continue; const dv = Math.hypot(v.x - e.x, v.y - e.y); if (dv < cd) { cd = dv; c = v; } }
      if (c) { a.tg = c.tg || null; c.tg = e; S.sqDrop++; }
    }
  }
  return _squad50(U, o);
};
/* 망령: 공격 사거리 +10 (겹침 완화로 바깥에 선 망령도 공격) */
updateMinions = function (dt) {
  const p = G.p, k = p.job2 === 'lord' ? 2 : 1, dmg = 8 * k * p.mod.dmg;
  const U = sumUnits46(); if (U.length) squad46(U, { dt, state: G.sq46m || (G.sq46m = { t: 0 }) });
  for (const m of G.minions) {
    m.life -= dt; m.hitT -= dt;
    moveUnit46(m, 170, dt, U);
    const e = m.tg;
    if (e && m.hitT <= 0 && Math.hypot(e.x - m.x, e.y - m.y) < e.r + m.r + 6 + V50.reach) { m.hitT = 0.5; m.vx = e.x - m.x; if (m.giant) markSummonAttack(m, Math.atan2(e.y - m.y, m.vx)); damageEnemy(e, dmg, { src: 'minion' }); }
  }
  G.minions = G.minions.filter(m => m.life > 0);
};

/* ---------- 범위 그림: 안쪽 옅게 + 가장자리 무기별 장식 ---------- */
const DECO50 = { t: -1, n: 0 };
function fam50(f) {
  const w = f.w48, a = f.art || '';
  if (w === 'icering' || f.element === 'ice' || a === 'frost' || a === 'shatter') return 'ice';
  if (w === 'slam' || f.element === 'earth' || a === 'earth' || a === 'dust') return 'earth';
  if (w === 'shield') return 'shock';
  if (w === 'fireball' || w === 'trap' || a === 'explosion' || a === 'fire') return 'fire';
  if (w) return f.k48 === 'heavy' ? 'earth' : f.k48 === 'blast' ? 'fire' : f.k48 === 'dot' ? 'ice' : 'arcane';
  return null;
}
const seed50 = o => o.seed48 || (o.seed48 = 1 + Math.floor(hash2(Math.round(o.x || 0), Math.round(o.y || 0) + 7) * 1e6));
function deco50(c, fam, x, y, r, a, sd, col) {
  if (!(a > 0.02) || !(r > 10) || !Number.isFinite(x + y)) return;
  if (DECO50.t !== G.time) { DECO50.t = G.time; DECO50.n = 0; }
  const cap = vfxLite() ? 260 : 640; if (DECO50.n >= cap) return;
  const tau = Math.PI * 2, n = clamp(Math.round(tau * r / (fam === 'earth' ? 30 : fam === 'shock' ? 40 : 22)), 6, 24), s = clamp(r * 0.085, 4, 11);
  DECO50.n += n; S50().deco++;
  c.save(); c.globalAlpha = clamp(a, 0, 1); c.lineJoin = 'round'; c.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const h = hash2(sd, i), b = i * tau / n + (h - 0.5) * 0.5, cs = Math.cos(b), sn = Math.sin(b), px = x + cs * r, py = y + sn * r;
    if (fam === 'ice') {
      const L = s * (1.1 + 0.9 * hash2(sd, i + 31)), w = s * 0.42;
      c.beginPath(); c.moveTo(px - sn * w, py + cs * w); c.lineTo(px + cs * L * 0.75, py + sn * L * 0.75); c.lineTo(px + sn * w, py - cs * w); c.lineTo(px - cs * L * 0.45, py - sn * L * 0.45); c.closePath();
      c.fillStyle = '#eef9ff'; c.fill(); c.lineWidth = 1.2; c.strokeStyle = '#6aaedc'; c.stroke();
      if (h > 0.5) { const q = s * 0.5, bx = px + sn * w * 1.6, by = py - cs * w * 1.6; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + cs * q * 1.4 + sn * q * 0.4, by + sn * q * 1.4 - cs * q * 0.4); c.stroke(); }
    } else if (fam === 'earth') {
      const L = s * (1.8 + 0.8 * hash2(sd, i + 31)), pr = (hash2(sd, i + 61) - 0.5) * 2;
      const q1x = px - cs * L * 0.35 - sn * s * 0.35 * pr, q1y = py - sn * L * 0.35 + cs * s * 0.35 * pr, q2x = px - cs * L * 0.7 + sn * s * 0.3 * pr, q2y = py - sn * L * 0.7 - cs * s * 0.3 * pr, q3x = px - cs * L, q3y = py - sn * L;
      c.beginPath(); c.moveTo(px, py); c.lineTo(q1x, q1y); c.lineTo(q2x, q2y); c.lineTo(q3x, q3y);
      c.strokeStyle = '#4e331c'; c.lineWidth = 2.4; c.stroke(); c.strokeStyle = '#e6c48c'; c.lineWidth = 0.8; c.stroke();
      const rx = x + cs * (r + s * 0.7), ry = y + sn * (r + s * 0.7), k2 = s * (0.35 + 0.25 * h);
      c.beginPath(); c.moveTo(rx - k2, ry); c.lineTo(rx, ry - k2 * 0.8); c.lineTo(rx + k2 * 0.9, ry + k2 * 0.2); c.lineTo(rx + k2 * 0.1, ry + k2 * 0.8); c.closePath(); c.fillStyle = '#9c7444'; c.fill();
    } else if (fam === 'shock') {
      const st = tau / n, w = st * 0.62;
      c.strokeStyle = col || '#dfe8ff'; c.lineWidth = 3.2; c.beginPath(); c.arc(x, y, r, b, b + w); c.stroke();
      c.globalAlpha = clamp(a, 0, 1) * 0.55; c.lineWidth = 2; c.beginPath(); c.arc(x, y, r * 0.86, b + st * 0.5, b + st * 0.5 + w * 0.8); c.stroke();
      c.globalAlpha = clamp(a, 0, 1) * 0.3; c.lineWidth = 1.4; c.beginPath(); c.arc(x, y, r * 0.74, b + st * 0.2, b + st * 0.2 + w * 0.6); c.stroke();
      c.globalAlpha = clamp(a, 0, 1);
    } else if (fam === 'fire') {
      const fl = 0.75 + 0.25 * Math.sin(G.time * 10 + i * 2.3), L = s * 1.6 * fl * (0.8 + 0.4 * hash2(sd, i + 31)), w = s * 0.5;
      const tx = px + cs * L, ty = py + sn * L;
      c.beginPath(); c.moveTo(px - sn * w, py + cs * w); c.quadraticCurveTo(px + cs * L * 0.5 - sn * w * 0.9, py + sn * L * 0.5 + cs * w * 0.9, tx, ty); c.quadraticCurveTo(px + cs * L * 0.5 + sn * w * 0.9, py + sn * L * 0.5 - cs * w * 0.9, px + sn * w, py - cs * w); c.closePath();
      c.fillStyle = '#ff7f32'; c.fill();
      c.beginPath(); c.moveTo(px - sn * w * 0.45, py + cs * w * 0.45); c.lineTo(px + cs * L * 0.55, py + sn * L * 0.55); c.lineTo(px + sn * w * 0.45, py - cs * w * 0.45); c.closePath(); c.fillStyle = '#ffd77a'; c.fill();
    } else if (fam === 'vine') {
      const L = s * (1.2 + 0.6 * h), w = s * 0.35, cv = (h - 0.5) * 2;
      c.beginPath(); c.moveTo(px - sn * w, py + cs * w); c.quadraticCurveTo(px + cs * L * 0.6 + sn * L * 0.35 * cv, py + sn * L * 0.6 - cs * L * 0.35 * cv, px + cs * L, py + sn * L); c.lineTo(px + sn * w, py - cs * w); c.closePath();
      c.fillStyle = '#3d6a2c'; c.fill(); c.strokeStyle = '#a6d07c'; c.lineWidth = 0.9; c.stroke();
    } else if (fam === 'heal') {
      const q = s * (0.5 + 0.3 * Math.sin(G.time * 4 + i)), ix = x + cs * r * 0.94, iy = y + sn * r * 0.94;
      c.beginPath(); c.moveTo(ix, iy - q); c.lineTo(ix + q * 0.25, iy - q * 0.25); c.lineTo(ix + q, iy); c.lineTo(ix + q * 0.25, iy + q * 0.25); c.lineTo(ix, iy + q); c.lineTo(ix - q * 0.25, iy + q * 0.25); c.lineTo(ix - q, iy); c.lineTo(ix - q * 0.25, iy - q * 0.25); c.closePath();
      c.fillStyle = '#e4ffd8'; c.fill();
    } else {
      const q = s * 0.55, rb = b + G.time * 0.6;
      c.save(); c.translate(x + Math.cos(rb) * r, y + Math.sin(rb) * r); c.rotate(rb);
      c.beginPath(); c.moveTo(q * 1.3, 0); c.lineTo(0, q * 0.6); c.lineTo(-q * 1.3, 0); c.lineTo(0, -q * 0.6); c.closePath();
      c.fillStyle = col || '#d8c8ff'; c.fill(); c.strokeStyle = '#ffffff'; c.lineWidth = 0.8; c.stroke(); c.restore();
    }
  }
  c.restore();
}
const _paintedRing50 = paintedRing;
paintedRing = function (c, f, k, x, y) {
  if (f.kind !== 'ring') return false;
  const fam = fam50(f); if (!fam) return _paintedRing50(c, f, k, x, y);
  const r = Math.max(1, lerp(f.r0, f.r1, 1 - (1 - k) ** 2));
  const key = f.art || (f.element === 'ice' ? (f.fill ? 'shatter' : 'frost') : f.element === 'earth' ? 'earth' : effectKey(f.color, f.fill));
  const A = fade49(k), fl = k < 0.12 ? 1 : k < 0.3 ? 1 - (k - 0.12) / 0.18 : 0;
  if (!paintedEffect(c, key, x, y, r, (V50.inner + (V50.flash - V50.inner) * fl) * A, k * .2)) return false;
  rangeEdge48(c, x, y, r, f.color || '#dfcfaa', V50.band * A, null, f);
  deco50(c, fam, x, y, r, (0.6 + 0.4 * fl) * A, seed50(f), f.color);
  return true;
};
paintedPool = function (c, z) {
  const key = { trail: 'heal', vine: 'vine', crack: 'earth', fire: 'fire' }[z.kind] || 'fire', fam = { trail: 'heal', vine: 'vine', crack: 'earth', fire: 'fire' }[z.kind] || 'fire';
  const fade = clamp((z.dur - z.t) * 3, 0, 1), fl = z.t < 0.25 ? 1 - z.t / 0.25 : 0;
  if (!paintedEffect(c, key, z.x, z.y, z.r, (0.2 + 0.35 * fl) * fade)) return false;
  rangeEdge48(c, z.x, z.y, z.r, z.kind === 'fire' || !z.kind ? '#ffcc8a' : '#c0d5ad', 0.18 * fade, null, z);
  deco50(c, fam, z.x, z.y, z.r, 0.7 * fade, seed50(z));
  return true;
};

/* ---------- 자동 플레이 ---------- */
/* 공격 예고가 덮는 지점: 발동까지 남은 시간(이미 발동 중 장판 0), 없으면 Infinity */
function hazT50(qx, qy) {
  const p = G.p; let t = Infinity;
  if (G.ph && G.ph.cracks) for (const k of G.ph.cracks) if (!k.done && Math.sqrt(dist2(k.x, k.y, qx, qy)) - k.r - p.r < 10) t = Math.min(t, Math.max(0, PH_CFG.crackWarn - k.t));
  if (G.hz) for (const h of G.hz) {
    const left = Math.max(0, (h.warn || 0) - (h.t || 0));
    if (h.k === 'sect') { if (!h.fired && dmInSect(h, qx, qy, p.r + 12)) t = Math.min(t, left); continue; }
    if (h.k === 'beam') { if (h.t > h.warn - 0.5 && dmOnBeam(h, qx, qy, p.r + 14)) t = Math.min(t, left); continue; }
    if (h.k === 'mir') { if (h.t > h.warn - 0.5 && bpOnMirror(h, qx, qy, p.r + 14)) t = Math.min(t, left); continue; }
    if (h.k === 'circ') { if (h.fired && !h.pool) continue; if (Math.sqrt(dist2(h.x, h.y, qx, qy)) - h.r - p.r * 0.5 < 12) t = Math.min(t, h.fired ? 0 : left); }
    else if (h.t <= h.warn + 0.6) { const rx = qx - h.x, ry = qy - h.y, al = rx * h.dx + ry * h.dy; if (al > -20 && al < h.len + 20 && Math.abs(rx * h.dy - ry * h.dx) < h.w / 2 + p.r + 10) t = Math.min(t, left); }
  }
  return t;
}
function home50(p, tg) {
  const J = p.job; if (!J || (tg && tg.k !== 'fight' && tg.k !== 'gem')) return null;   // 목표 지점·대장·수문장 교전 중에는 미적용
  const cen = L => { let x = 0, y = 0; for (const u of L) { x += u.x; y += u.y; } return { x: x / L.length, y: y / L.length }; };
  if (J === 'engineer' && G.turrets && G.turrets.length) { const c = cen(G.turrets); return { ...c, d: 140, w: 12 }; }
  if (J === 'summoner') { const L = sumUnits46(); if (L.length >= 2) { const c = cen(L); return { ...c, d: 130, w: 10 }; } }
  if (J === 'druid' && G.pets && G.pets.length) { const c = cen(G.pets); return { ...c, d: 110, w: 10 }; }
  return null;
}
autoVec = function () {
  if (AUTO.run !== G) { AUTO.run = G; AUTO.next = 0; AUTO.out = null; }
  if (G.time < AUTO.next && AUTO.out) return AUTO.out;
  AUTO.next = G.time + rand(0.1, 0.2);          // 사람 반응 지연 재현
  const p = G.p, J = p.job, S = S50();
  let tg = autoTarget();
  // 시간술사: 정지된 적이 가까우면 접근해 시계추 타격
  if (J === 'chrono' && tg && tg.k === 'fight') { let fz = null, bd = 220 * 220; for (const e of G.enemies) if (!e.dead && e.frz > 0.3) { const d = dist2(e.x, e.y, p.x, p.y); if (d < bd) { bd = d; fz = e; } } if (fz) tg = { x: fz.x, y: fz.y, k: 'fight', frz: true }; }
  let tx = 0, ty = 0, td = 0, pull = 1;
  if (tg) { tx = tg.x - p.x; ty = tg.y - p.y; td = Math.hypot(tx, ty) || 1; tx /= td; ty /= td; }
  if (tg && tg.k === 'fight') {
    const [lo, hi] = tg.frz ? [30, 60] : (V50.fight[J] || [90, 130]);
    pull = lo === 0 ? (td > hi ? 1 : 0.3) : td > hi ? 1 : td > lo ? 0.2 : -0.4;
  }
  if (tg && tg.k === 'boss') pull = td > 60 ? 1 : 0;
  if (tg && tg.k === 'gk') { const mel = p.weapons.filter(w => WEAPONS[w.id].cat === 'melee').length >= 2, lo = mel ? 55 : 110, hi = mel ? 95 : 170; pull = td > hi ? 1 : td < lo ? -0.6 : 0.1; }
  const here = autoDanger(p.x, p.y), hz = hazT50(p.x, p.y), inHz = hz < Infinity;
  if (J === 'archer' && !inHz && here < 2.5 && !(tg && (tg.k === 'goal' || tg.k === 'boss' || tg.k === 'gk'))) return (AUTO.out = { x: 0, y: 0, m: 0 });   // 궁수 정지 사격
  // 궁극기 정지 발동: 예고 밖에서만 (무적 궁극기 전사·도적은 발동까지 0.9초 넘게 남으면 허용)
  if (ultReady() && !autoUltSetting() && (here > 3 || G.time - G.tm.readyAt > 8)) {
    if (!inHz || ((J === 'warrior' || J === 'rogue') && hz > 0.9)) { S.ultStop++; return (AUTO.out = { x: 0, y: 0, m: 0 }); }
  }
  // 군주: 군기 안 유지 (회피·보석·목표 지점 이동 시 제외)
  // 0.51: 안전할 때(예고 없음·주변 위험 낮음·체력 50% 이상) 보석 수집 우선 — 위치 규칙 해제, 보석 끌림 2배, 위험 0.8배
  const safe = !inHz && here < 3 && p.hp > p.maxHp * 0.5 && tg && tg.k === 'gem' && td < 220;   // 근처(220 안) 보석만 if (safe) S.safeGem = (S.safeGem || 0) + 1;
  // 군주: 안전 수집은 군기 반경+140 안 보석만 (군기 안 경험치 1.3배 유지)
  const b = J === 'sovereign' && G.banner ? G.banner : null, bR = b ? bannerR49() : 0, bOff = !b || inHz || (safe && dist2(tg.x, tg.y, b.x, b.y) < (bR + 140) ** 2) || (tg && (tg.k === 'goal' || (tg.k === 'gem' && dist2(tg.x, tg.y, b.x, b.y) < (bR + 80) ** 2)));   // 보석은 군기 근처(반경+80)만 예외
  const hm = inHz || safe ? null : home50(p, tg);
  const melee = J === 'warrior' || J === 'rogue', god = STATE.dev.god, dk = inHz && !god ? 1.2 : melee && p.hp > p.maxHp * 0.5 ? 0.75 : 1, tk = inHz && !god ? 0.3 : safe ? 2 : 1, dk2 = safe ? 0.8 : 1;   // 무적 시험은 회피 가중 미적용(판 길이 측정 기준 유지)
  let best = AUTO_DIRS[0], bs = -1e9;
  for (const dv of AUTO_DIRS) {
    const dg = autoDanger(p.x + dv.x * 30, p.y + dv.y * 30) + 0.6 * autoDanger(p.x + dv.x * 70, p.y + dv.y * 70);
    let s = -dg * (STATE.dev.god ? 0.15 : 1) * dk * dk2 + (tg ? (dv.x * tx + dv.y * ty) * (tg.k === 'goal' || tg.k === 'boss' || tg.k === 'gk' ? 26 : 6) * pull * tk : 0) + (dv.x * AUTO.dir.x + dv.y * AUTO.dir.y) * 1.2;
    if (b && !bOff) { const qx = p.x + dv.x * 30, qy = p.y + dv.y * 30, dq = Math.sqrt(dist2(qx, qy, b.x, b.y)); if (dq > bR * 0.85) s -= (tg && (tg.k === 'boss' || tg.k === 'gk') ? 8 : 14) * Math.min(2, 1 + (dq - bR * 0.85) / 40); }
    if (hm) { const hx = hm.x - p.x, hy = hm.y - p.y, hd = Math.hypot(hx, hy) || 1; if (hd > hm.d) s += (dv.x * hx + dv.y * hy) / hd * hm.w; }
    if (s > bs) { bs = s; best = dv; }
  }
  const ev2 = G.ev && G.ev.cur, stopR = G.ph.zone ? G.ph.zone.r - 20 : ev2 && ev2.state === 'idle' && tg && tg.x === ev2.x ? 12 : 20;
  if (tg && tg.k === 'goal' && td < stopR) return (AUTO.out = { x: 0, y: 0, m: 0 });
  if (J !== 'rogue' && !inHz && here < 1.5 && -here >= bs && !(tg && (tg.k === 'gem' || tg.k === 'goal'))) return (AUTO.out = { x: 0, y: 0, m: 0 });   // 도적: 쉬지 않고 이동
  const k = here > 6 || inHz ? 1 : 0.55;
  let x = AUTO.dir.x * (1 - k) + best.x * k, y = AUTO.dir.y * (1 - k) + best.y * k; const m = Math.hypot(x, y) || 1;
  AUTO.dir = { x: x / m, y: y / m };
  return (AUTO.out = { x: x / m, y: y / m, m: 1 });
};
/* 집계: 예고 안 궁극기 정지 발동, 군주 군기 안 체류 */
const _useUlt50 = useUlt;
useUlt = function () {
  if (STATE.dev.auto && G.p && !autoUltSetting() && !(G.p.job === 'warrior' || G.p.job === 'rogue') && hazT50(G.p.x, G.p.y) < Infinity) S50().ultHz++;
  return _useUlt50.apply(this, arguments);
};
const _updateUlt50 = updateUlt;
updateUlt = function (dt) {
  const p = G.p;
  if (p && p.job === 'sovereign' && G.banner && !G.result) { let n = 0; gridQuery(p.x, p.y, 200, () => { n++; if (n > 2) return false; }); if (n > 2) { const S = S50(); S.sovT += dt; if (inBanner()) S.sovIn += dt; } }
  return _updateUlt50(dt);
};
