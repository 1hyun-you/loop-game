/* ============================================================
   마왕전 (0.12) — 3단계 결정 안건 4·7: 고유 패턴 단일 구성 3페이즈, 전 패턴 신규 (수문장 패턴 미차용)
   진입: 4번째 문 개방 판은 수문장 처치 직후 마왕성 출현 → 같은 판에서 마왕전 (마지막 판)
         4문 개방 이후 판은 페이즈 5종 후 마왕전 직행 (재도전 판)
   1페이즈(체력 100~60%) 그림자 군주: 낫 휘두르기(예고 부채꼴)·혼령 추적탄·그림자 도약(착지 충격)
   2페이즈(60~25%) 암흑 결계: 수축하는 결계 밖 지속 피해, 회전 광선 3갈래, 낫 휘두르기
   3페이즈(25% 이하) 종언: 운석 연속 낙하(이동 경로 추적), 광선 4갈래 가속, 추적탄 증가, 패턴 간격 단축
   전환: 1.6초 무적·탄환 소거·포효 연출 / 시간 정지·빙결 면역(둔화 0.3배), 넉백 면역
   명칭 '마왕'은 가칭 (서사·명칭은 4단계)
   ============================================================ */
const DEMON = { name: '마왕', gate: '마왕성', ds: '그림자 군주', color: '#7a4ad0', r: 34, speed: 70, shape: 'hex' };
const DM_CFG = {
  hpMul: 360, retryHp: 0.65, dmgMul: 1.2,   // 0.12 1차(무적 12·일반 12): 재도전 판 처치 191~320초·퇴각 2, 일반 판 마왕전 사망 8/10 → 재도전 체력·패턴 피해 하향 / 2차: 무적 처치 평균 235초·마지막 판 19분 → 체력 420→360
  spawn: [240, 280], fail: 420, stages: [0.6, 0.25], trans: 1.6, spawnMul: 0.3,
  every: [2.6, 2.3, 1.7],                                   // 패턴 간격 (페이즈별)
  scR: 150, scArc: 2.1, scWarn: [0.85, 0.75, 0.6], scDmg: 18,  // 낫 휘두르기
  hoN: [4, 4, 6], hoSp: 115, hoTurn: 1.6, hoLife: 5, hoDmg: 9, // 혼령 추적탄
  blWarn: 0.7, blR: 95, blDmg: 18, blDist: 110,              // 그림자 도약
  arR0: 330, arR1: 230, arShrink: 25, arDmg: 7,              // 암흑 결계 (반경·수축 시간·0.5초당 피해)
  bmN: [0, 3, 4], bmLen: 340, bmW: 18, bmWarn: 1.1, bmDur: [0, 3.2, 3.6], bmRot: [0, 0.55, 0.8], bmDmg: 8,   // 회전 광선
  mtN: 7, mtGap: 0.32, mtR: 58, mtWarn: 0.9, mtDmg: 17,      // 운석 낙하
  // 0.16 처치 시간 편차 억제 (5단계 결정 안건 1-3): 페이즈별 최소 지속 시간(이전 하한 체력 고정) + 목표 초과 시 받는 피해 점증
  stMin: [60, 55, 40], stTgt: [70, 60, 45], catchUp: 0.04, catchMax: 3, finalHp: 0.75, preDmg: 0.6,
  erode: 20, seg: [0.4, 0.35, 0.25],   // 0.18: 목표 시간 초과 시 페이즈 남은 구간을 20초에 걸쳐 잠식 → 처치 시간 상한 약 235초 (최소 지속 합 155초)   // preDmg: 진엔딩 전 패턴 피해 배율 (진엔딩 경로 안정화)
};
const bossDef = (k) => k === 'demon' ? DEMON : GATEKEEPERS[k];

/* 판 구조 결정 — newRun에서 호출: normal(일반) · final(4번째 문 → 마왕전) · retry(페이즈 5종 → 마왕전) */
function runTypeOf() {
  const dv = STATE.dev.demon; if (dv === 'final' || dv === 'retry') return dv;
  const s = loadSave(), g = s.gates || [];
  if (g.length >= 4) return 'retry';
  if (g.length === 3 && G.gk && !g.includes(G.gk)) return 'final';
  return 'normal';
}

function dmSpawn() {
  const q = ringAt(DM_CFG.spawn[0], DM_CFG.spawn[1]), e = makeEnemy('brute', q.x, q.y);
  e.hp = e.maxHp = e.hp * DM_CFG.hpMul * (G.runType === 'retry' ? DM_CFG.retryHp : DM_CFG.finalHp); e.dmg *= DM_CFG.dmgMul; e.r = DEMON.r; e.speed = DEMON.speed; e.color = DEMON.color; e.shape = DEMON.shape; e.xp = 0;
  e.cmd = true; e.boss = true; e.gk = 'demon'; e.ai = { cd: 2.0, n: 0 }; e.st = 0; e.inv = 0; e.stT0 = G.time;
  G.gkMob = e; G.eb = []; G.hz = []; G.arena = null;
  G.stats.demon = { t0: G.time, st: [null, null], type: G.runType, n: ((G.stats.demon && G.stats.demon.n) || 0) + 1 };   // n: 생성 횟수 (0.18 계측)
  toast('마왕 강림', DEMON.color); toast('그림자 군주', '#fff');
  fx({ kind: 'ring', x: e.x, y: e.y, r0: 10, r1: 200, dur: 1.0, color: DEMON.color });
  storyBoss('demon');                                       // 마왕성 도달 조각·대사 (0.13)
}

function dmUpdate(e, dt, d, dx, dy) {
  const p = G.p, ai = e.ai;
  if (G.result) return;
  if (G.tm.stop > 0) dt *= 0.3;
  if (e.frz > 0) e.frz = 0;
  // 페이즈 전환
  const nx = e.st < 2 && e.hp <= e.maxHp * DM_CFG.stages[e.st];
  if (nx) {
    (G.stats.demon.tr || (G.stats.demon.tr = [])).push([e.id, e.st, Math.round(G.time - e.stT0), Math.round(e.hp / e.maxHp * 100), G.gkMob === e ? 1 : 0]);   // 전환 추적 (0.18 조기 전환 원인 확인)
    e.st++; e.stT0 = G.time; e.inv = DM_CFG.trans; ai.cd = DM_CFG.trans + 0.6; G.eb = []; G.hz = G.hz.filter(h => h.k === 'arena');
    G.stats.demon.st[e.st - 1] = Math.round(G.time - G.stats.demon.t0);
    toast(e.st === 1 ? '암흑 결계' : '종언', '#c9a8ff'); fx({ kind: 'ring', x: e.x, y: e.y, r0: 10, r1: 280, dur: 1.0, color: '#c9a8ff' });
    if (e.st === 1) G.arena = { x: p.x, y: p.y, R: DM_CFG.arR0, t: 0, tick: 0 };
  }
  if (e.inv > 0) e.inv -= dt;
  else if (G.time - e.stT0 > DM_CFG.stTgt[e.st]) {               // 잠식 (0.18): 목표 시간 초과 시 체력 자연 감소, 페이즈 경계에서 정지
    const loss = e.maxHp * DM_CFG.seg[e.st] / DM_CFG.erode * dt, floor = e.st < 2 ? e.maxHp * DM_CFG.stages[e.st] : 0;
    e.hp = Math.max(floor, e.hp - loss); if (e.st === 2 && e.hp <= 0) { killEnemy(e); return; }
  }
  let mv = 1;
  if (ai.blink) {                                                // 그림자 도약: 예고 후 착지
    ai.blink.t -= dt; mv = 0;
    if (ai.blink.t <= 0) { e.x = ai.blink.x; e.y = ai.blink.y; ai.blink = null; fx({ kind: 'ring', x: e.x, y: e.y, r0: 10, r1: DM_CFG.blR, dur: 0.4, color: '#b080ff' }); }
  } else if (e.inv <= 0) {
    ai.cd -= dt;
    if (ai.cd <= 0) { ai.cd = DM_CFG.every[e.st]; ai.n++; mv = dmPattern(e, ai); }
  }
  // 이동: 1페이즈 중거리 압박, 2·3페이즈 원거리 유지 (결계 안 제한)
  if (mv && !ai.blink) {
    const lo = e.st ? 170 : 110, hi = e.st ? 250 : 180;
    gkKeep(e, d, 0, lo, hi);
    const s = e.strafe, mx = dx / d, my = dy / d;
    let sx = mx * s.k - my * s.dir * (1 - Math.abs(s.k)), sy = my * s.k + mx * s.dir * (1 - Math.abs(s.k)); const m = Math.hypot(sx, sy) || 1;
    const sp = e.speed * (e.st === 2 ? 1.2 : 1) * (e.slowT > 0 ? 0.75 : 1) * (G.tm.roar > 0 ? 0.6 : 1) * mv;
    e.x += sx / m * sp * dt; e.y += sy / m * sp * dt;
  }
  if (e.slowT > 0) e.slowT -= dt;
  const A = G.arena;
  if (A) {                                                        // 결계 안으로 제한
    const ax = e.x - A.x, ay = e.y - A.y, ad = Math.hypot(ax, ay);
    if (ad > A.R - e.r) { e.x = A.x + ax / ad * (A.R - e.r); e.y = A.y + ay / ad * (A.R - e.r); }
  } else if (d > Math.hypot(VIEW.w, VIEW.h) * 0.8 && !ai.blink) { const q = ringAt(VIEW.w * 0.5, VIEW.w * 0.6); e.x = q.x; e.y = q.y; }
  if (d < e.r + p.r - 3) hurtPlayer(e.dmg, '마왕');
}

/* 패턴 선택 — 반환값: 패턴 직후 이동 배율 */
function dmPattern(e, ai) {
  const p = G.p, st = e.st, k = ai.n;
  if (st === 0) {
    const r = k % 3;
    if (r === 1) { dmScythe(e); return 0.3; }
    if (r === 2) { dmHoming(e); return 0.6; }
    dmBlink(e); return 0;
  }
  if (st === 1) {
    const r = k % 3;
    if (r === 1) { dmBeams(e); return 0.2; }
    if (r === 2) { dmScythe(e); dmHoming(e, 2); return 0.4; }
    dmBlink(e); return 0;
  }
  const r = k % 3;
  if (r === 1) { dmBeams(e); dmHoming(e); return 0.2; }
  if (r === 2) { dmMeteors(e); return 0.5; }
  dmBlink(e); G.later.push({ t: DM_CFG.blWarn + 0.15, f: () => { if (!e.dead && !G.result) dmScythe(e); } }); return 0;
}
function dmScythe(e) {
  const p = G.p, a = Math.atan2(p.y - e.y, p.x - e.x);
  G.hz.push({ k: 'sect', x: e.x, y: e.y, a, arc: DM_CFG.scArc, r: DM_CFG.scR, warn: DM_CFG.scWarn[e.st], t: 0, dmg: gkDmg(DM_CFG.scDmg), src: '마왕 낫', follow: e });
}
function dmHoming(e, n) {
  const p = G.p, N = n || DM_CFG.hoN[e.st], base = Math.atan2(p.y - e.y, p.x - e.x);
  for (let i = 0; i < N; i++) {
    const a = base + Math.PI + (i / Math.max(1, N - 1) - 0.5) * 2.4;     // 등 뒤로 퍼진 뒤 선회해 추적
    if (G.eb.length < 260) G.eb.push({ x: e.x, y: e.y, vx: Math.cos(a) * DM_CFG.hoSp, vy: Math.sin(a) * DM_CFG.hoSp, r: 8, dmg: gkDmg(DM_CFG.hoDmg), src: '마왕 혼령', life: DM_CFG.hoLife, col: '#c9a8ff', home: DM_CFG.hoTurn });
  }
}
function dmBlink(e) {
  const p = G.p, a = Math.atan2(p.y - e.y, p.x - e.x) + rand(-0.6, 0.6);
  let x = p.x + Math.cos(a) * DM_CFG.blDist, y = p.y + Math.sin(a) * DM_CFG.blDist;   // 플레이어 너머로 도약
  const A = G.arena; if (A) { const ax = x - A.x, ay = y - A.y, ad = Math.hypot(ax, ay); if (ad > A.R - e.r) { x = A.x + ax / ad * (A.R - e.r); y = A.y + ay / ad * (A.R - e.r); } }
  e.ai.blink = { x, y, t: DM_CFG.blWarn };
  gkCircle(x, y, DM_CFG.blR, DM_CFG.blWarn, gkDmg(DM_CFG.blDmg), '마왕 도약');
}
function dmBeams(e) {
  const n = DM_CFG.bmN[e.st], a0 = rand(6.28), dir = Math.random() < 0.5 ? 1 : -1;
  for (let i = 0; i < n; i++) G.hz.push({ k: 'beam', x: e.x, y: e.y, a: a0 + i * 6.283 / n, rot: DM_CFG.bmRot[e.st] * dir, len: DM_CFG.bmLen, w: DM_CFG.bmW, warn: DM_CFG.bmWarn, dur: DM_CFG.bmDur[e.st], t: 0, dmg: gkDmg(DM_CFG.bmDmg), src: '마왕 광선', follow: e, tick: 0 });
}
function dmMeteors(e) {
  for (let i = 0; i < DM_CFG.mtN; i++) G.later.push({ t: i * DM_CFG.mtGap, f: () => {
    if (e.dead || G.result) return; const p = G.p, lead = 0.5;              // 이동 방향 앞쪽 예측 낙하
    const v = p.moving ? CFG.player.speed * p.mod.speed * lead : 0;
    gkCircle(p.x + p.face.x * v + rand(-25, 25), p.y + p.face.y * v + rand(-25, 25), DM_CFG.mtR, DM_CFG.mtWarn, gkDmg(DM_CFG.mtDmg), '마왕 운석');
  } });
}

/* 결계·광선·부채꼴·추적탄 갱신 — updateBossFx에서 호출 */
function dmFx(dt) {
  const p = G.p, A = G.arena;
  if (A) {
    A.t += dt; A.R = DM_CFG.arR0 - (DM_CFG.arR0 - DM_CFG.arR1) * Math.min(1, A.t / DM_CFG.arShrink);
    A.tick -= dt;
    if (A.tick <= 0) { A.tick = 0.5; if (!G.result && dist2(p.x, p.y, A.x, A.y) > (A.R - p.r * 0.5) ** 2) hurtPlayer(gkDmg(DM_CFG.arDmg), '마왕 결계'); }
  }
  for (const b of G.eb) if (b.home) {
    const want = Math.atan2(p.y - b.y, p.x - b.x), cur = Math.atan2(b.vy, b.vx), sp = Math.hypot(b.vx, b.vy);
    let da = want - cur; while (da > Math.PI) da -= 6.283; while (da < -Math.PI) da += 6.283;
    const na = cur + Math.max(-b.home * dt, Math.min(b.home * dt, da)); b.vx = Math.cos(na) * sp; b.vy = Math.sin(na) * sp;
  }
  for (const h of G.hz) {
    if (h.k === 'sect') {
      if (h.follow && !h.fired) { h.x = h.follow.x; h.y = h.follow.y; }
      if (h.t >= h.warn && !h.fired) {
        h.fired = true; fx({ kind: 'ring', x: h.x, y: h.y, r0: h.r * 0.5, r1: h.r, dur: 0.3, color: '#b080ff' });
        if (!G.result && dmInSect(h, p.x, p.y, p.r * 0.5)) hurtPlayer(h.dmg, h.src);
      }
    } else if (h.k === 'beam') {
      if (h.follow && !h.follow.dead) { h.x = h.follow.x; h.y = h.follow.y; }
      if (h.t > h.warn) {
        h.a += h.rot * dt; h.tick -= dt;
        if (h.tick <= 0 && !G.result && dmOnBeam(h, p.x, p.y, p.r * 0.5)) { h.tick = 0.25; hurtPlayer(h.dmg, h.src); }
      }
    }
  }
}
function dmInSect(h, x, y, pad) {
  const dx = x - h.x, dy = y - h.y, d = Math.hypot(dx, dy); if (d > h.r + pad) return false;
  let da = Math.atan2(dy, dx) - h.a; while (da > Math.PI) da -= 6.283; while (da < -Math.PI) da += 6.283;
  return Math.abs(da) <= h.arc / 2 || d < 30;
}
function dmOnBeam(h, x, y, pad) {
  const ux = Math.cos(h.a), uy = Math.sin(h.a), rx = x - h.x, ry = y - h.y, al = rx * ux + ry * uy;
  return al > 0 && al < h.len && Math.abs(rx * uy - ry * ux) < h.w / 2 + pad;
}
function dmHzAlive(h) { return h.k === 'sect' ? h.t < h.warn + 0.3 : h.t < h.warn + h.dur; }

/* 받는 피해 보정 (damageEnemy에서 호출, 0.16): 최소 지속 시간 전에는 해당 페이즈 하한 체력 아래로 내려가지 않음, 목표 시간 초과 시 피해 점증 */
function dmAdjust(e, dmg) {
  if (e.stT0 == null) e.stT0 = G.time;
  const el = G.time - e.stT0, floor = e.st < 2 ? e.maxHp * DM_CFG.stages[e.st] : 0;
  if (el > DM_CFG.stTgt[e.st]) dmg *= Math.min(DM_CFG.catchMax, 1 + (el - DM_CFG.stTgt[e.st]) * DM_CFG.catchUp);
  if (el < DM_CFG.stMin[e.st]) dmg = Math.min(dmg, Math.max(0, e.hp - floor - 1));
  else if (e.st < 2) dmg = Math.min(dmg, Math.max(0, e.hp - floor));   // 한 번의 피해로 다음 페이즈를 건너뛰지 않도록 페이즈 경계에서 정지
  return dmg;
}
function dmKilled(e) {
  fragUnlock('shadow');                                     // 기록 조각 (0.13)
  const s = G.stats.demon; s.killed = true; s.dur = Math.round(G.time - s.t0);
  G.eb = []; G.hz = []; G.arena = null;
  fx({ kind: 'ring', x: e.x, y: e.y, r0: 10, r1: 320, dur: 1.6, color: DEMON.color });
}

/* 그리기: 부채꼴·광선 예고(지면), 결계(화면 외곽 암전) */
function drawDemonGround(c) {
  const A = G.arena;
  if (A) {
    c.strokeStyle = 'rgba(30,8,50,0.62)'; c.lineWidth = 900; c.beginPath(); c.arc(A.x, A.y, A.R + 450, 0, 7); c.stroke();
    c.strokeStyle = 'rgba(190,140,255,0.85)'; c.lineWidth = 3; c.beginPath(); c.arc(A.x, A.y, A.R, 0, 7); c.stroke();
  }
  for (const h of G.hz) {
    const a = Math.min(1, h.t / h.warn);
    if (h.k === 'sect' && !h.fired) {
      c.fillStyle = `rgba(150,70,230,${0.12 + 0.25 * a})`; c.beginPath(); c.moveTo(h.x, h.y); c.arc(h.x, h.y, h.r, h.a - h.arc / 2, h.a + h.arc / 2); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(200,150,255,0.9)'; c.lineWidth = 2; c.stroke();
    } else if (h.k === 'beam') {
      c.save(); c.translate(h.x, h.y); c.rotate(h.a);
      if (h.t <= h.warn) { c.fillStyle = `rgba(190,120,255,${0.15 + 0.2 * a})`; c.fillRect(0, -2, h.len, 4); }
      else { c.fillStyle = 'rgba(170,90,255,0.75)'; c.fillRect(0, -h.w / 2, h.len, h.w); c.fillStyle = 'rgba(255,240,255,0.9)'; c.fillRect(0, -3, h.len, 6); }
      c.restore();
    }
  }
}

/* 시험 기록용 요약 */
function dmReport() {
  const s = G.stats.demon; if (!s) return null;
  const e = G.gkMob;
  return [s.killed ? 'kill' : G.result, s.dur || Math.round(G.time - s.t0), e && e.gk === 'demon' ? Math.round(Math.max(0, e.hp) / e.maxHp * 100) : 0, e && e.gk === 'demon' ? e.st + 1 : 0, s.st[0], s.st[1], s.type, s.n, s.tr || []];
}
function dmSave(s) {
  const d = G.stats.demon; if (!d) return;
  s.demonTries = (s.demonTries || 0) + 1; if (d.killed) s.demonKills = (s.demonKills || 0) + 1;
}
