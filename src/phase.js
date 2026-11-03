/* ============================================================
   페이즈 — 풀 12종(기본형 4·전투형 4·기믹형 4), 판마다 7~8종 무작위 투입 (유형별 2종 이상 보장)
   구성: 페이즈 → 예고 구간(색감 전환·다음 페이즈 이름 표시) → 다음 페이즈, 전부 돌파 시 판 완료
   기믹 융합 원칙: 기믹 진행 중에도 일반 몹 출현 지속 (기획서 페이즈 풀)
   0.10 추가 7종: 안개 평원·떠돌이 야영지·엘리트 사냥·포위진·수레 호위·의식 저지·붕괴 지대 (3단계 결정 안건 5)
   ============================================================ */
// 0.4 판 길이 조정: 무적 완주 기준 8~10분 맞춤 (물결 140→180, 언덕 80→90, 몰아치는 무리 120→150초, 봉인석 체류 4→5초)
// 0.10 1차 무적 4판 평균 11분 48초 → 신규 시간형 페이즈 +10~20초·엘리트 사냥 출현 간격·마법진 체력 상향
// 0.10: 판 길이 기준 15~18분(기획서 채택), 판당 7~8종 투입으로 길이 확보, 개별 페이즈 시간은 0.4 수준 유지
const PHASES = {
  horde: { name: '들판의 물결', type: '기본형', goal: 'time', dur: 180, spawnMul: 1.0, tint: null,
    hint: '버텨라' },
  calm: { name: '고요한 언덕', type: '기본형', goal: 'time', dur: 90, spawnMul: 0.45, tint: [150, 210, 140],
    hint: '회복의 샘을 찾아라' },
  fog: { name: '안개 평원', type: '기본형', goal: 'time', dur: 130, spawnMul: 0.9, bias: { bat: 5, skel: 3, slime: 2 }, tint: [175, 185, 195], fog: 150, spawnR: [210, 270],
    hint: '시야 축소 · 근접 기습 주의' },
  camp: { name: '떠돌이 야영지', type: '기본형', goal: 'time', dur: 90, spawnMul: 0.4, tint: [230, 170, 90],
    hint: '야영지에서 휴식·보상 1회 선택' },
  surge: { name: '몰아치는 무리', type: '전투형', goal: 'time', dur: 150, spawnMul: 1.8, bias: { bat: 6, slime: 6 }, tint: [200, 70, 60],
    hint: '물량 폭주' },
  warband: { name: '오우거 전열', type: '전투형', goal: 'kill', fail: 150, min: 40,   // 0.17 최소 지속 40초 (대장 조기 처치 시 잔여 전열 소탕 구간)
    spawnMul: 0.9, bias: { brute: 1.5, skel: 5, slime: 3 }, tint: [190, 130, 60],
    hint: '오우거 대장 처치' },
  hunt: { name: '엘리트 사냥', type: '전투형', goal: 'hunt', fail: 150, spawnMul: 0.7, tint: [235, 205, 90],
    hint: '정예 4체 처치 (완료 시 보물 상자)' },
  siege: { name: '포위진', type: '전투형', goal: 'time', dur: 120, spawnMul: 0.5, tint: [170, 80, 120],
    hint: '사방 포위 · 빈틈 돌파' },
  seal: { name: '봉인석', type: '기믹형', goal: 'zone', fail: 170, spawnMul: 0.45, tint: [90, 140, 230],
    hint: '봉인석 4개 해제 (빛나는 구역에 머물기, 구역 안 적 둔화)' },
  escort: { name: '수레 호위', type: '기믹형', goal: 'escort', fail: 170, spawnMul: 0.6, tint: [200, 160, 110],
    hint: '수레 곁에 머물러 목적지까지 호위' },
  ritual: { name: '의식 저지', type: '기믹형', goal: 'ritual', fail: 120, spawnMul: 0.55, tint: [150, 90, 210],
    hint: '마법진 3개 파괴 (시간 초과 시 정예 소환)' },
  collapse: { name: '붕괴 지대', type: '기믹형', goal: 'time', dur: 120, spawnMul: 0.6, tint: [140, 120, 100],
    hint: '붕괴 예고 지점 회피' },
  /* 0.11 수문장전 — 판 마지막 고정, 풀 비포함 (처치 시 판 돌파, 360초 초과 시 수문장 퇴각) */
  gate: { name: '수문장전', type: '보스', goal: 'boss', fail: 360, spawnMul: 0.35, tint: [190, 70, 70],
    hint: '사문의 수문장 처치' },
  /* 0.12 마왕전 — 4번째 문 개방 직후(마지막 판) 또는 재도전 판 페이즈 5종 후, 420초 초과 시 마왕성 소멸 */
  demon: { name: '마왕전', type: '보스', goal: 'boss', fail: 420, spawnMul: 0.3, tint: [70, 40, 110],
    hint: '마왕 처치' },
};
const PHASE_ORDER = ['horde', 'calm', 'fog', 'camp', 'surge', 'warband', 'hunt', 'siege', 'seal', 'escort', 'ritual', 'collapse'];
const PH_CFG = { gap: 6, warnAt: 3, zoneR: 70, zoneNeed: 5, zoneN: 4, zoneDist: [150, 230], springHeal: 0.5, cmdHp: 16,   // 0.17 대장 체력 7→16배 (0.15 기록 처치 5~37초)
  zoneSlow: 0.35, cmdR: 26, zonePush: 2.2, zoneKb: 420,   // 0.3a 봉인석 보완: 구역 거리 단축·둔화 강화·해제 파동
  perRun: [7, 8], perType: 2, retryN: 5, finalGap: 9,              // 재도전 판 페이즈 수 (0.12), 마왕성 출현 예고 구간(초)
  huntN: 4, huntAt: [0, 15, 35, 55],                                   // 엘리트 사냥: 처치 목표·출현 시각(초)
  siegeEvery: 13, siegeFirst: 4, siegeN: 30, siegeR: 300,              // 포위진: 원형 포위 주기·수·반경
  cartHp: 300, cartR: 16, cartDist: 1000, cartSpeed: 10, cartNear: 150, cartHurt: 0.25, cartHurtMax: 8,   // 수레 호위
  ritN: 3, ritHp: 10, ritR: 24, ritDist: [200, 320], ritEvery: 6, ritSummon: 3,                           // 의식 저지 (체력: 같은 시각 오우거 배수)
  crackEvery: 2.0, crackN: 3, crackR: 52, crackWarn: 1.3, crackDmg: 16,   // 붕괴 지대
  campDist: [160, 240], campR: 28,
};

/* 판당 투입 페이즈 구성 — 유형별 perType종 이상 보장 후 나머지 무작위 */
function pickPhaseOrder(retry) {
  const n = retry ? PH_CFG.retryN : Math.random() < 0.5 ? PH_CFG.perRun[0] : PH_CFG.perRun[1], by = {}, out = [];
  for (const id of PHASE_ORDER) (by[PHASES[id].type] = by[PHASES[id].type] || []).push(id);
  for (const t in by) out.push(...shuffle(by[t].slice()).slice(0, retry ? 1 : PH_CFG.perType));
  const rest = shuffle(PHASE_ORDER.filter(id => !out.includes(id)));
  while (out.length < n && rest.length) out.push(rest.pop());
  return shuffle(out);
}
function phaseInit() {
  G.ph = { order: pickPhaseOrder(G.runType === 'retry'), i: -1, id: null, t: 0, gapT: 2.5, inGap: true, tint: null, tintFrom: null, tintK: 1,
    zone: null, spring: null, cmd: null, cart: null, rits: null, cracks: [], camp: null, hunt: 0, log: [] };
  G.ph.order.push(G.runType === 'retry' ? 'demon' : 'gate');   // 수문장전 마지막 고정 (0.11), 재도전 판은 마왕전 (0.12)
  eventInit();
}
function curPhase() { return G.ph.id ? PHASES[G.ph.id] : null; }
function phaseSpawnMul() { return (G.ph.inGap ? 0.6 : curPhase().spawnMul) * eventSpawnMul() * (hasCurse('horde') ? 1.15 : 1); }
function phaseBias() { const P = curPhase(); return !G.ph.inGap && P && P.bias || null; }

function phaseStart() {
  const ph = G.ph; ph.i++; ph.id = ph.order[ph.i]; ph.t = 0; ph.inGap = false;
  const P = PHASES[ph.id];
  scheduleElites();
  toast(`${ph.i + 1}/${ph.order.length} · ${P.name}`, '#ffe08a'); toast(P.hint, '#fff');
  if (ph.id === 'gate') gkSpawn();
  if (ph.id === 'demon') dmSpawn();
  if (ph.id === 'calm') { const q = ringAt(180, 260); ph.spring = { x: q.x, y: q.y, r: 22, used: false }; }
  if (ph.id === 'seal') { ph.zone = newZone(0); }
  if (ph.id === 'warband') {
    const q = ringPos(20), e = makeEnemy('brute', q.x, q.y);
    e.hp = e.maxHp = e.hp * PH_CFG.cmdHp; e.r = PH_CFG.cmdR; e.dmg *= 1.3; e.speed *= 1.35; e.color = '#e8a83c'; e.xp = 30; e.cmd = true;
    ph.cmd = e;
  }
  if (ph.id === 'hunt') { ph.hunt = 0; ph.huntQ = PH_CFG.huntAt.slice(); }
  if (ph.id === 'siege') ph.siegeT = PH_CFG.siegeFirst;
  if (ph.id === 'collapse') { ph.cracks = []; ph.crackT = 1.5; }
  if (ph.id === 'camp') { const q = ringAt(PH_CFG.campDist[0], PH_CFG.campDist[1]); ph.camp = { x: q.x, y: q.y, r: PH_CFG.campR, used: false }; }
  if (ph.id === 'escort') {
    const a = rand(Math.PI * 2), sx = G.p.x + Math.cos(a + 1.6) * 60, sy = G.p.y + Math.sin(a + 1.6) * 60;
    ph.cart = { x: sx, y: sy, tx: sx + Math.cos(a) * PH_CFG.cartDist, ty: sy + Math.sin(a) * PH_CFG.cartDist, hp: PH_CFG.cartHp, maxHp: PH_CFG.cartHp, r: PH_CFG.cartR, d0: PH_CFG.cartDist, hit: 0 };
  }
  if (ph.id === 'ritual') {
    ph.rits = []; const a0 = rand(Math.PI * 2);
    for (let i = 0; i < PH_CFG.ritN; i++) {
      const a = a0 + i * Math.PI * 2 / PH_CFG.ritN + rand(-0.4, 0.4), R = rand(PH_CFG.ritDist[0], PH_CFG.ritDist[1]);
      const e = makeEnemy('brute', G.p.x + Math.cos(a) * R, G.p.y + Math.sin(a) * R);
      e.hp = e.maxHp = e.hp * PH_CFG.ritHp; e.r = PH_CFG.ritR; e.speed = 0; e.dmg = 0; e.xp = 12; e.color = '#8a5ad0'; e.shape = 'rune';
      e.cmd = true; e.fixed = true; e.rit = true; e.sumT = rand(1, PH_CFG.ritEvery);
      ph.rits.push(e);
    }
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
  phaseCleanup(outcome);
  if (ph.id === 'gate' && outcome === 'ok' && G.runType === 'final') {   // 4번째 문 개방 → 마왕성 출현, 같은 판에서 마왕전 (0.12)
    ph.order.push('demon'); G.eb = []; G.hz = [];
    toast(`${GATEKEEPERS[G.gk].name} 처치 · 네 문 개방`, '#ffe08a'); toast('마왕성 출현', '#c9a8ff');
    fx({ kind: 'ring', x: G.p.x, y: G.p.y, r0: 10, r1: 320, dur: 1.4, color: '#c9a8ff' });
    ph.inGap = true; ph.gapT = PH_CFG.finalGap; ph.id = null; return;
  }
  if (ph.i >= ph.order.length - 1) {                       // 마지막 페이즈(수문장전) 종료 → 판 완료
    if (ph.id === 'gate' && outcome !== 'ok') {              // 시간 초과: 수문장 퇴각, 판 미돌파 (0.11)
      G.result = 'retreat'; G.endT = 1.6; toast(GATEKEEPERS[G.gk].name + ' 퇴각 · 문 닫힘', '#ff9a7a');
      if (G.gkMob) for (const e of G.enemies) if (e.gk) e.dead = true;
      G.eb = []; G.hz = []; return;
    }
    if (ph.id === 'demon' && outcome !== 'ok') {             // 시간 초과: 마왕성 소멸, 판 미돌파 (0.12)
      G.result = 'retreat'; G.endT = 1.6; toast('마왕성 소멸 · 회귀', '#c9a8ff');
      for (const e of G.enemies) if (e.gk) e.dead = true;
      G.eb = []; G.hz = []; G.arena = null; return;
    }
    if (ph.id === 'demon') { G.result = 'clear'; G.endT = 2.2; toast('마왕 처치', '#ffe08a'); fx({ kind: 'ring', x: G.p.x, y: G.p.y, r0: 10, r1: 320, dur: 1.4, color: '#ffe08a' }); return; }
    G.result = 'clear'; G.endT = 1.6; toast(ph.id === 'gate' ? `${GATEKEEPERS[G.gk].name} 처치 · ${GATEKEEPERS[G.gk].gate} 개방` : '들판 돌파', '#ffe08a');
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
  if (!eventPaused()) ph.t += dt;          // 곁가지 사건 진행 중 페이즈 타이머 정지 (3단계 결정 안건 6)
  const P = PHASES[ph.id];
  updatePhaseGimmick(P, dt);
  if (G.result) return;
  if (P.goal === 'hunt' && ph.hunt >= PH_CFG.huntN) return phaseEnd('ok');
  if (P.goal === 'escort' && ph.cart) { if (ph.cart.hp <= 0) return phaseEnd('fail'); if (ph.cart.done) return phaseEnd('ok'); }
  if (P.goal === 'ritual' && ph.rits && ph.rits.every(e => e.dead)) return phaseEnd('ok');
  if (P.goal === 'time' && ph.t >= P.dur) return phaseEnd('ok');
  if (P.fail && ph.t >= P.fail) return phaseEnd('timeout');
  if (ph.spring && !ph.spring.used && dist2(p.x, p.y, ph.spring.x, ph.spring.y) < (ph.spring.r + p.r) ** 2) {
    ph.spring.used = true; heal(p.maxHp * PH_CFG.springHeal); toast('회복의 샘', '#8ff0b0');
    fx({ kind: 'ring', x: ph.spring.x, y: ph.spring.y, r0: 8, r1: 60, dur: 0.5, color: '#8ff0b0' });
  }
  if (P.goal === 'kill' && ph.cmd && ph.cmd.dead && ph.t >= (P.min || 0)) return phaseEnd('ok');
  if (P.goal === 'boss' && G.gkMob && G.gkMob.dead) return phaseEnd('ok');
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

/* ============================================================
   0.10 추가 페이즈 기믹 갱신
   ============================================================ */
function updatePhaseGimmick(P, dt) {
  const ph = G.ph, p = G.p, paused = eventPaused(), min = G.time / 60;
  // 엘리트 사냥: 정해진 시각에 정예 출현 (개별 보상 없음, 완료 시 상자 1개)
  if (ph.id === 'hunt' && ph.huntQ && ph.huntQ.length && ph.t >= ph.huntQ[0]) { ph.huntQ.shift(); const e = spawnElite(); e.noChest = true; e.hunt = true; }
  // 포위진: 주기적 원형 포위
  if (ph.id === 'siege' && !paused) {
    ph.siegeT -= dt;
    if (ph.siegeT <= 0) {
      ph.siegeT = PH_CFG.siegeEvery;
      const n = Math.max(0, Math.min(PH_CFG.siegeN, CFG.spawn.max - aliveCount())), a0 = rand(Math.PI * 2);
      for (let i = 0; i < n; i++) { const a = a0 + i * Math.PI * 2 / n; makeEnemy(min > 3 && i % 3 === 0 ? 'skel' : 'slime', p.x + Math.cos(a) * PH_CFG.siegeR, p.y + Math.sin(a) * PH_CFG.siegeR); }
      toast('포위 압축', '#e0a0c0');
    }
  }
  // 붕괴 지대: 예고 원 → 붕괴 (플레이어 피해)
  if (ph.id === 'collapse') {
    if (!paused) { ph.crackT -= dt; if (ph.crackT <= 0) { ph.crackT = PH_CFG.crackEvery; spawnCracks(); } }
    for (const k of ph.cracks) {
      k.t += dt;
      if (k.t >= PH_CFG.crackWarn && !k.done) {
        k.done = true; fx({ kind: 'ring', x: k.x, y: k.y, r0: k.r * 0.4, r1: k.r * 1.1, dur: 0.35, color: '#c09060' });
        if (dist2(p.x, p.y, k.x, k.y) < (k.r + p.r * 0.5) ** 2) hurtPlayer(PH_CFG.crackDmg * (1 + CFG.scale.dmgPerMin * min), '붕괴 지대');
      }
    }
    ph.cracks = ph.cracks.filter(k => k.t < PH_CFG.crackWarn + 0.35);
  }
  // 떠돌이 야영지: 접촉 시 보상 1회 선택
  if (ph.camp && !ph.camp.used && dist2(p.x, p.y, ph.camp.x, ph.camp.y) < (ph.camp.r + p.r) ** 2) { ph.camp.used = true; G.pendingCamp = true; }
  // 수레 호위: 플레이어 근접 시에만 전진, 접촉 적에게 손상
  const c = ph.cart;
  if (c && !c.done) {
    const near = dist2(p.x, p.y, c.x, c.y) < PH_CFG.cartNear ** 2;
    c.moving = near && !paused;
    if (c.moving) { const dx = c.tx - c.x, dy = c.ty - c.y, d = Math.hypot(dx, dy); if (d < 8) { c.done = true; } else { c.x += dx / d * PH_CFG.cartSpeed * dt; c.y += dy / d * PH_CFG.cartSpeed * dt; } }
    let n = 0, hurt = 0;
    gridQuery(c.x, c.y, c.r + 18, e => { if (e.fixed || e.sleep || n >= PH_CFG.cartHurtMax) return; if (dist2(e.x, e.y, c.x, c.y) < (e.r + c.r) ** 2) { n++; hurt += e.dmg; } });
    if (hurt) { c.hp -= hurt * PH_CFG.cartHurt * dt; c.hit = 0.15; }
    c.hit -= dt;
  }
  // 의식 저지: 남은 마법진마다 주기 소환
  if (ph.rits && !paused) for (const e of ph.rits) {
    if (e.dead) continue; e.sumT -= dt;
    if (e.sumT <= 0) { e.sumT = PH_CFG.ritEvery; for (let i = 0; i < PH_CFG.ritSummon; i++) { if (aliveCount() >= CFG.spawn.max) break; const a = rand(Math.PI * 2); makeEnemy(min > 1.5 ? 'skel' : 'slime', e.x + Math.cos(a) * 34, e.y + Math.sin(a) * 34); } }
  }
}
function spawnCracks() {
  const p = G.p, mv = p.moving ? p.face : { x: 0, y: 0 };
  for (let i = 0; i < PH_CFG.crackN; i++) {
    const q = i === 0 ? { x: p.x + mv.x * 70 + rand(-20, 20), y: p.y + mv.y * 70 + rand(-20, 20) } : ringAt(60, 220);
    G.ph.cracks.push({ x: q.x, y: q.y, r: PH_CFG.crackR * rand(0.85, 1.15), t: 0 });
  }
}
/* 엘리트 사냥 처치 집계 (growth.js eliteKilled에서 호출) */
function phaseEliteKilled(e) { if (e.hunt && G.ph.id === 'hunt') G.ph.hunt++; }
/* 페이즈 종료 정리·보상 */
function phaseCleanup(outcome) {
  const ph = G.ph, id = ph.id, p = G.p;
  if (outcome === 'ok' && (id === 'hunt' || id === 'escort' || id === 'ritual')) {
    const at = id === 'escort' && ph.cart ? ph.cart : ringAt(40, 70);
    G.chests.push({ x: at.x, y: at.y, r: 14 }); toast('완수 보상 · 보물 상자', '#ffd24a');
  }
  if (id === 'ritual' && ph.rits) {
    const left = ph.rits.filter(e => !e.dead);
    for (const e of left) { e.dead = true; fx({ kind: 'ring', x: e.x, y: e.y, r0: 10, r1: 70, dur: 0.5, color: '#b080ff' }); }
    if (left.length) { spawnElite(); toast('의식 완성 · 정예 소환', '#c8a0ff'); }
  }
  if (id === 'hunt') for (const e of G.enemies) if (e.hunt && !e.dead) e.hunt = false;
  if (id === 'escort' && outcome !== 'ok') toast('수레 파손', '#ff9a7a');
  ph.cart = null; ph.rits = null; ph.cracks = []; ph.camp = null; ph.huntQ = null;
}

/* 진행도(0~1) — 상단 표시용 */
function phaseProgress() {
  const ph = G.ph, P = curPhase(); if (!P) return 0;
  if (P.goal === 'time') return ph.t / P.dur;
  if (P.goal === 'boss') return G.gkMob ? 1 - Math.max(0, G.gkMob.hp) / G.gkMob.maxHp : 0;
  if (P.goal === 'kill') return ph.cmd ? 1 - Math.max(0, ph.cmd.hp) / ph.cmd.maxHp : 1;
  if (P.goal === 'zone') return ph.zone ? (ph.zone.i + ph.zone.prog / PH_CFG.zoneNeed) / PH_CFG.zoneN : 1;
  if (P.goal === 'hunt') return ph.hunt / PH_CFG.huntN;
  if (P.goal === 'escort') return ph.cart ? 1 - Math.hypot(ph.cart.tx - ph.cart.x, ph.cart.ty - ph.cart.y) / ph.cart.d0 : 1;
  if (P.goal === 'ritual') return ph.rits ? ph.rits.filter(e => e.dead).length / PH_CFG.ritN : 1;
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
  for (const k of ph.cracks) {
    const a = Math.min(1, k.t / PH_CFG.crackWarn);
    if (!k.done) { c.fillStyle = `rgba(200,80,50,${0.12 + 0.25 * a})`; c.beginPath(); c.arc(k.x, k.y, k.r * a, 0, 7); c.fill(); c.strokeStyle = 'rgba(255,140,90,0.85)'; c.lineWidth = 2; c.beginPath(); c.arc(k.x, k.y, k.r, 0, 7); c.stroke(); }
    else { c.fillStyle = 'rgba(40,28,20,0.6)'; c.beginPath(); c.arc(k.x, k.y, k.r, 0, 7); c.fill(); }
  }
  if (ph.rits) for (const e of ph.rits) {
    if (e.dead) continue;
    c.strokeStyle = 'rgba(190,140,255,0.7)'; c.lineWidth = 2; c.beginPath(); c.arc(e.x, e.y, e.r + 14 + Math.sin(G.time * 3) * 3, 0, 7); c.stroke();
    c.save(); c.translate(e.x, e.y); c.rotate(G.time); c.beginPath(); for (let i = 0; i < 5; i++) { const a = i * Math.PI * 4 / 5; c.lineTo(Math.cos(a) * (e.r + 10), Math.sin(a) * (e.r + 10)); } c.closePath(); c.stroke(); c.restore();
  }
  if (ph.camp && !ph.camp.used) {
    const m = ph.camp; c.fillStyle = 'rgba(255,190,90,0.18)'; c.beginPath(); c.arc(m.x, m.y, m.r + 10, 0, 7); c.fill();
    c.fillStyle = '#8a5a30'; c.beginPath(); c.moveTo(m.x - 18, m.y + 10); c.lineTo(m.x, m.y - 16); c.lineTo(m.x + 18, m.y + 10); c.closePath(); c.fill();
    c.fillStyle = '#ffb040'; c.beginPath(); c.arc(m.x + 16, m.y + 14, 4 + Math.sin(G.time * 9), 0, 7); c.fill();
  }
  if (ph.cart) {
    const k = ph.cart;
    c.strokeStyle = 'rgba(255,230,150,0.35)'; c.lineWidth = 2; c.setLineDash([8, 8]); c.beginPath(); c.moveTo(k.x, k.y); c.lineTo(k.tx, k.ty); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#e8d070'; c.fillRect(k.tx - 1.5, k.ty - 28, 3, 28); c.fillRect(k.tx + 1.5, k.ty - 28, 14, 9);
    c.strokeStyle = 'rgba(255,230,150,0.3)'; c.beginPath(); c.arc(k.x, k.y, PH_CFG.cartNear, 0, 7); c.stroke();
    c.fillStyle = k.hit > 0 ? '#fff' : '#9a6a3a'; c.fillRect(k.x - 16, k.y - 11, 32, 20); c.fillStyle = '#3a2410'; c.beginPath(); c.arc(k.x - 10, k.y + 10, 5, 0, 7); c.arc(k.x + 10, k.y + 10, 5, 0, 7); c.fill();
    c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(k.x - 18, k.y - 20, 36, 4); c.fillStyle = '#8ff0b0'; c.fillRect(k.x - 18, k.y - 20, 36 * Math.max(0, k.hp / k.maxHp), 4);
  }
  if (ph.spring && !ph.spring.used) {
    const s = ph.spring;
    c.fillStyle = 'rgba(120,240,170,0.35)'; c.beginPath(); c.arc(s.x, s.y, s.r + 6 + Math.sin(G.time * 5) * 3, 0, 7); c.fill();
    c.fillStyle = '#6fe0a0'; c.beginPath(); c.arc(s.x, s.y, s.r * 0.6, 0, 7); c.fill();
  }
}
/* 안개 평원 시야 축소 (화면 좌표, 플레이어 중심) */
function drawPhaseFog(c) {
  const P = curPhase(); if (!P || !P.fog || G.ph.inGap) return;
  const k = Math.min(1, G.ph.t / 2), Z = VIEW.zoom, cx = VIEW.cw / 2, cy = VIEW.ch / 2, r0 = P.fog * Z, r1 = P.fog * Z * 1.7;
  const g = c.createRadialGradient(cx, cy, r0, cx, cy, r1);
  g.addColorStop(0, 'rgba(200,205,215,0)'); g.addColorStop(1, `rgba(190,196,206,${0.92 * k})`);
  c.fillStyle = g; c.fillRect(0, 0, VIEW.cw, VIEW.ch);
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
  const ph = G.ph, rit = ph.rits && ph.rits.filter(e => !e.dead).sort((a, b) => dist2(a.x, a.y, G.p.x, G.p.y) - dist2(b.x, b.y, G.p.x, G.p.y))[0];
  const t = ph.zone || (ph.spring && !ph.spring.used ? ph.spring : null) || (ph.cmd && !ph.cmd.dead ? ph.cmd : null) || (G.gkMob && !G.gkMob.dead && isBossPhase() ? G.gkMob : null) || ph.cart || rit || (ph.camp && !ph.camp.used ? ph.camp : null) || eventPointer() || G.altar || G.chests[0];
  if (!t) return;
  const Z = VIEW.zoom, sx = (t.x - camX) * Z, sy = (t.y - camY) * Z, m = 34, top = VIEW.sat + 90;
  if (sx > m && sx < VIEW.cw - m && sy > top && sy < VIEW.ch - m) return;
  const cx = VIEW.cw / 2, cy = VIEW.ch / 2, ang = Math.atan2(sy - cy, sx - cx);
  const kx = (VIEW.cw / 2 - m) / Math.abs(Math.cos(ang) || 1e-6), ky = (Math.sin(ang) < 0 ? cy - top : VIEW.ch / 2 - m) / Math.abs(Math.sin(ang) || 1e-6);
  const R = Math.min(kx, ky), px = cx + Math.cos(ang) * R, py = cy + Math.sin(ang) * R;
  c.save(); c.translate(px, py); c.rotate(ang);
  c.fillStyle = t === G.altar ? '#d9a8ff' : G.chests.includes(t) ? '#ffd24a' : t === ph.zone ? '#9fc4ff' : t === ph.cmd ? '#e8a83c' : t === G.gkMob ? '#ff6a4a' : t === ph.cart ? '#e8d070' : t === rit ? '#b080ff' : t === ph.camp ? '#ffb040' : t.ev ? '#7fe0ff' : '#8ff0b0'; c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(14, 0); c.lineTo(-8, -10); c.lineTo(-3, 0); c.lineTo(-8, 10); c.closePath(); c.fill(); c.stroke();
  c.restore();
}
