/* ============================================================
   페이즈 — 1단계 풀 5종(기본형 2·전투형 2·기믹형 1), 판마다 순서 무작위 자동 진행
   구성: 페이즈 → 예고 구간(색감 전환·다음 페이즈 이름 표시) → 다음 페이즈, 전부 돌파 시 판 완료
   기믹 융합 원칙: 기믹 진행 중에도 일반 몹 출현 지속 (기획서 페이즈 풀)
   ============================================================ */
// 0.4 판 길이 조정: 무적 완주 기준 8~10분 맞춤 (물결 140→180, 언덕 80→90, 몰아치는 무리 120→150초, 봉인석 체류 4→5초)
const PHASES = {
  horde: { name: '들판의 물결', type: '기본형', goal: 'time', dur: 180, spawnMul: 1.0, tint: null,
    hint: '버텨라' },
  calm: { name: '고요한 언덕', type: '기본형', goal: 'time', dur: 90, spawnMul: 0.45, tint: [150, 210, 140],
    hint: '회복의 샘을 찾아라' },
  surge: { name: '몰아치는 무리', type: '전투형', goal: 'time', dur: 150, spawnMul: 1.8, bias: { bat: 6, slime: 6 }, tint: [200, 70, 60],
    hint: '물량 폭주' },
  warband: { name: '오우거 전열', type: '전투형', goal: 'kill', fail: 150, spawnMul: 0.9, bias: { brute: 1.5, skel: 5, slime: 3 }, tint: [190, 130, 60],
    hint: '오우거 대장 처치' },
  seal: { name: '봉인석', type: '기믹형', goal: 'zone', fail: 170, spawnMul: 0.45, tint: [90, 140, 230],
    hint: '봉인석 4개 해제 (빛나는 구역에 머물기, 구역 안 적 둔화)' },
};
const PHASE_ORDER = ['horde', 'calm', 'surge', 'warband', 'seal'];
const PH_CFG = { gap: 6, warnAt: 3, zoneR: 70, zoneNeed: 5, zoneN: 4, zoneDist: [150, 230], springHeal: 0.5, cmdHp: 7, zoneSlow: 0.35, cmdR: 26, zonePush: 2.2, zoneKb: 420 };   // 0.3a 봉인석 보완: 구역 거리 단축·둔화 강화·해제 파동

function phaseInit() {
  G.ph = { order: shuffle(PHASE_ORDER.slice()), i: -1, id: null, t: 0, gapT: 2.5, inGap: true, tint: null, tintFrom: null, tintK: 1,
    zone: null, spring: null, cmd: null, log: [] };
}
function curPhase() { return G.ph.id ? PHASES[G.ph.id] : null; }
function phaseSpawnMul() { return G.ph.inGap ? 0.6 : curPhase().spawnMul; }
function phaseBias() { const P = curPhase(); return !G.ph.inGap && P && P.bias || null; }

function phaseStart() {
  const ph = G.ph; ph.i++; ph.id = ph.order[ph.i]; ph.t = 0; ph.inGap = false;
  const P = PHASES[ph.id];
  scheduleElites();
  toast(`${ph.i + 1}/${ph.order.length} · ${P.name}`, '#ffe08a'); toast(P.hint, '#fff');
  if (ph.id === 'calm') { const q = ringAt(180, 260); ph.spring = { x: q.x, y: q.y, r: 22, used: false }; }
  if (ph.id === 'seal') { ph.zone = newZone(0); }
  if (ph.id === 'warband') {
    const q = ringPos(20), e = makeEnemy('brute', q.x, q.y);
    e.hp = e.maxHp = e.hp * PH_CFG.cmdHp; e.r = PH_CFG.cmdR; e.dmg *= 1.3; e.speed *= 1.35; e.color = '#e8a83c'; e.xp = 30; e.cmd = true;
    ph.cmd = e;
  }
}
function ringAt(a, b) { const ang = rand(Math.PI * 2), R = rand(a, b); return { x: G.p.x + Math.cos(ang) * R, y: G.p.y + Math.sin(ang) * R }; }
function newZone(i) { const q = ringAt(PH_CFG.zoneDist[0], PH_CFG.zoneDist[1]); return { x: q.x, y: q.y, r: PH_CFG.zoneR, prog: 0, i }; }

function phaseEnd(outcome) {
  const ph = G.ph;
  ph.log.push([ph.id, Math.round(ph.t), outcome].concat(ph.cmd ? [Math.round(Math.max(0, ph.cmd.hp) / ph.cmd.maxHp * 100), Math.round(Math.sqrt(dist2(ph.cmd.x, ph.cmd.y, G.p.x, G.p.y)))] : []));
  ph.zone = null; ph.spring = null;
  if (ph.cmd && !ph.cmd.dead) { ph.cmd.dead = true; fx({ kind: 'ring', x: ph.cmd.x, y: ph.cmd.y, r0: 10, r1: 60, dur: 0.5, color: '#e8a83c' }); }
  ph.cmd = null;
  if (ph.i >= ph.order.length - 1) {                       // 마지막 페이즈 돌파 → 판 완료
    G.result = 'clear'; G.endT = 1.6; toast('들판 돌파', '#ffe08a');
    fx({ kind: 'ring', x: G.p.x, y: G.p.y, r0: 10, r1: 260, dur: 1.2, color: '#ffe08a' });
    return;
  }
  ph.inGap = true; ph.gapT = PH_CFG.gap; ph.id = null;
  altarCheck();
  toast(outcome === 'ok' ? '페이즈 돌파' : '페이즈 종료', '#9fe0a0');
}

function updatePhase(dt) {
  const ph = G.ph, p = G.p;
  // 색감 전환 (예고 구간에 다음 페이즈 색으로 이동)
  if (ph.tintK < 1) ph.tintK = Math.min(1, ph.tintK + dt / 2);
  if (ph.inGap) {
    ph.gapT -= dt;
    const nx = ph.order[ph.i + 1];
    if (nx && ph.gapT <= PH_CFG.warnAt && !ph.warned) {
      ph.warned = true; ph.tintFrom = ph.tint; ph.tint = PHASES[nx].tint; ph.tintK = 0;
      toast('다음: ' + PHASES[nx].name, '#cfc6ff');
    }
    if (ph.gapT <= 0) { ph.warned = false; phaseStart(); }
    return;
  }
  ph.t += dt;
  const P = PHASES[ph.id];
  if (P.goal === 'time' && ph.t >= P.dur) return phaseEnd('ok');
  if (P.fail && ph.t >= P.fail) return phaseEnd('timeout');
  if (ph.spring && !ph.spring.used && dist2(p.x, p.y, ph.spring.x, ph.spring.y) < (ph.spring.r + p.r) ** 2) {
    ph.spring.used = true; heal(p.maxHp * PH_CFG.springHeal); toast('회복의 샘', '#8ff0b0');
    fx({ kind: 'ring', x: ph.spring.x, y: ph.spring.y, r0: 8, r1: 60, dur: 0.5, color: '#8ff0b0' });
  }
  if (P.goal === 'kill' && ph.cmd && ph.cmd.dead) return phaseEnd('ok');
  if (P.goal === 'zone' && ph.zone) {
    const z = ph.zone;
    if (dist2(p.x, p.y, z.x, z.y) < z.r * z.r) z.prog += dt;
    if (z.prog >= PH_CFG.zoneNeed) {
      fx({ kind: 'ring', x: z.x, y: z.y, r0: z.r * 0.5, r1: z.r * PH_CFG.zonePush, dur: 0.6, color: '#9fc4ff' });
      sealPulse(z);
      if (z.i + 1 >= PH_CFG.zoneN) { ph.zone = null; return phaseEnd('ok'); }
      ph.zone = newZone(z.i + 1); toast(`봉인석 ${z.i + 1}/${PH_CFG.zoneN} 해제`, '#9fc4ff');
    }
  }
}

/* 봉인석 해제 파동 — 주변 적 밀어내기 (0.3a, 해제 직후 포위 상태 탈출 보조) */
function sealPulse(z) {
  const R = z.r * PH_CFG.zonePush;
  gridQuery(z.x, z.y, R, e => { if (e.cmd || e.dead) return; const dx = e.x - z.x, dy = e.y - z.y, d = Math.hypot(dx, dy) || 1; e.kbx += dx / d * PH_CFG.zoneKb; e.kby += dy / d * PH_CFG.zoneKb; });
}

/* 진행도(0~1) — 상단 표시용 */
function phaseProgress() {
  const ph = G.ph, P = curPhase(); if (!P) return 0;
  if (P.goal === 'time') return ph.t / P.dur;
  if (P.goal === 'kill') return ph.cmd ? 1 - Math.max(0, ph.cmd.hp) / ph.cmd.maxHp : 1;
  if (P.goal === 'zone') return ph.zone ? (ph.zone.i + ph.zone.prog / PH_CFG.zoneNeed) / PH_CFG.zoneN : 1;
  return 0;
}

/* 지면 위 표시: 봉인석 구역·회복의 샘 */
function drawPhaseGround(c) {
  const ph = G.ph;
  if (ph.zone) {
    const z = ph.zone, pulse = 0.5 + 0.5 * Math.sin(G.time * 4);
    c.fillStyle = `rgba(120,170,255,${0.14 + pulse * 0.08})`; c.beginPath(); c.arc(z.x, z.y, z.r, 0, 7); c.fill();
    c.strokeStyle = 'rgba(160,200,255,0.8)'; c.lineWidth = 3; c.beginPath(); c.arc(z.x, z.y, z.r, 0, 7); c.stroke();
    c.strokeStyle = '#e8f0ff'; c.lineWidth = 6; c.beginPath(); c.arc(z.x, z.y, z.r - 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * z.prog / PH_CFG.zoneNeed); c.stroke();
    c.fillStyle = '#5a6f9a'; c.fillRect(z.x - 9, z.y - 16, 18, 26); c.strokeStyle = '#cfe0ff'; c.lineWidth = 2; c.strokeRect(z.x - 9, z.y - 16, 18, 26);
  }
  if (ph.spring && !ph.spring.used) {
    const s = ph.spring;
    c.fillStyle = 'rgba(120,240,170,0.35)'; c.beginPath(); c.arc(s.x, s.y, s.r + 6 + Math.sin(G.time * 5) * 3, 0, 7); c.fill();
    c.fillStyle = '#6fe0a0'; c.beginPath(); c.arc(s.x, s.y, s.r * 0.6, 0, 7); c.fill();
  }
}
/* 색감 덧칠 (환경 예고) */
function drawPhaseTint(c) {
  const ph = G.ph, a = ph.tint, b = ph.tintFrom, k = ph.tintK;
  const alA = a ? 0.16 * k : 0, alB = b ? 0.16 * (1 - k) : 0;
  if (alB > 0.005) { c.fillStyle = `rgba(${b[0]},${b[1]},${b[2]},${alB})`; c.fillRect(0, 0, VIEW.cw, VIEW.ch); }
  if (alA > 0.005) { c.fillStyle = `rgba(${a[0]},${a[1]},${a[2]},${alA})`; c.fillRect(0, 0, VIEW.cw, VIEW.ch); }
}
/* 화면 밖 목표 방향 표시 */
function drawPhasePointer(c, camX, camY) {
  const ph = G.ph, t = ph.zone || (ph.spring && !ph.spring.used ? ph.spring : null) || (ph.cmd && !ph.cmd.dead ? ph.cmd : null) || G.altar || G.chests[0];
  if (!t) return;
  const Z = VIEW.zoom, sx = (t.x - camX) * Z, sy = (t.y - camY) * Z, m = 34, top = VIEW.sat + 90;
  if (sx > m && sx < VIEW.cw - m && sy > top && sy < VIEW.ch - m) return;
  const cx = VIEW.cw / 2, cy = VIEW.ch / 2, ang = Math.atan2(sy - cy, sx - cx);
  const kx = (VIEW.cw / 2 - m) / Math.abs(Math.cos(ang) || 1e-6), ky = (Math.sin(ang) < 0 ? cy - top : VIEW.ch / 2 - m) / Math.abs(Math.sin(ang) || 1e-6);
  const R = Math.min(kx, ky), px = cx + Math.cos(ang) * R, py = cy + Math.sin(ang) * R;
  c.save(); c.translate(px, py); c.rotate(ang);
  c.fillStyle = t === G.altar ? '#d9a8ff' : G.chests.includes(t) ? '#ffd24a' : ph.zone ? '#9fc4ff' : ph.cmd ? '#e8a83c' : '#8ff0b0'; c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(14, 0); c.lineTo(-8, -10); c.lineTo(-3, 0); c.lineTo(-8, 10); c.closePath(); c.fill(); c.stroke();
  c.restore();
}
