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
  fight: { archer: [90, 130], mage: [70, 110], chrono: [60, 110], engineer: [95, 135], summoner: [110, 150], priest: [80, 120], druid: [70, 110], warrior: [0, 45], rogue: [0, 40], sovereign: [20, 70], berserker: [0, 45], pyromancer: [70, 110], necromancer: [60, 100] },
};
const S50 = () => G.stats.v50 || (G.stats.v50 = { ultHz: 0, ultStop: 0, sovT: 0, sovIn: 0, sqTele: 0, sqDrop: 0, deco: 0 });

/* ---------- 동료 지휘 ---------- */
SQ46.gap = V50.gap;
/* 망령: 공격 사거리 +10 (겹침 완화로 바깥에 선 망령도 공격) */

/* ---------- 범위 그림: 안쪽 옅게 + 가장자리 무기별 장식 ---------- */
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
const _paintedRing50 = paintedRing;

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
function autoVec() {
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
  if (J === 'archer' && heroImpl60('archer') && !inHz && here < (typeof V54 !== 'undefined' ? V54.arcStop : 2.5) && !(tg && (tg.k === 'goal' || tg.k === 'boss' || tg.k === 'gk'))) return (AUTO.out = { x: 0, y: 0, m: 0 });   // 궁수 정지 사격
  // 궁극기 정지 발동: 예고 밖에서만 (무적 궁극기 전사·도적은 발동까지 0.9초 넘게 남으면 허용)
  if (ultReady() && !autoUltSetting() && (here > 3 || G.time - G.tm.readyAt > 8)) {
    if (!inHz || ((J === 'warrior' || J === 'berserker' || J === 'rogue') && hz > 0.9)) { S.ultStop++; ultPress58('ai'); }   // 0.58 버튼 누름, 정지 없음
  }
  // 군주: 군기 안 유지 (회피·보석·목표 지점 이동 시 제외)
  // 0.51: 안전할 때(예고 없음·주변 위험 낮음·체력 50% 이상) 보석 수집 우선 — 위치 규칙 해제, 보석 끌림 2배, 위험 0.8배
  const safe = !inHz && here < 3 && p.hp > p.maxHp * 0.5 && tg && tg.k === 'gem' && td < 220;   // 근처(220 안) 보석만 if (safe) S.safeGem = (S.safeGem || 0) + 1;
  // 군주: 안전 수집은 군기 반경+140 안 보석만 (군기 안 경험치 1.3배 유지)
  const b = J === 'sovereign' && G.banner ? G.banner : null, bR = b ? bannerR49() : 0, bOff = !b || inHz || (safe && dist2(tg.x, tg.y, b.x, b.y) < (bR + 140) ** 2) || (tg && (tg.k === 'goal' || (tg.k === 'gem' && dist2(tg.x, tg.y, b.x, b.y) < (bR + 80) ** 2)));   // 보석은 군기 근처(반경+80)만 예외
  const hm = inHz || safe ? null : home50(p, tg);
  const melee = J === 'warrior' || J === 'berserker' || J === 'rogue', god = STATE.dev.god, dk = inHz && !god ? 1.2 : melee && p.hp > p.maxHp * 0.5 ? 0.75 : 1, tk = inHz && !god ? 0.3 : safe ? 2 : 1, dk2 = safe ? 0.8 : 1;   // 무적 시험은 회피 가중 미적용(판 길이 측정 기준 유지)
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
  if (!inHz && here < 1.5 && -here >= bs && !(tg && (tg.k === 'gem' || tg.k === 'goal'))) return (AUTO.out = { x: 0, y: 0, m: 0 });   // 0.60 옛 도적 '쉬지 않고 이동' 예외 삭제
  const k = here > 6 || inHz ? 1 : 0.55;
  let x = AUTO.dir.x * (1 - k) + best.x * k, y = AUTO.dir.y * (1 - k) + best.y * k; const m = Math.hypot(x, y) || 1;
  AUTO.dir = { x: x / m, y: y / m };
  return (AUTO.out = { x: x / m, y: y / m, m: 1 });
}
/* 집계: 예고 안 궁극기 정지 발동, 군주 군기 안 체류 */
const _updateUlt50 = updateUlt;
updateUlt = function (dt) {
  const p = G.p;
  if (p && p.job === 'sovereign' && G.banner && !G.result) { let n = 0; gridQuery(p.x, p.y, 200, () => { n++; if (n > 2) return false; }); if (n > 2) { const S = S50(); S.sovT += dt; if (inBanner()) S.sovIn += dt; } }
  return _updateUlt50(dt);
};
