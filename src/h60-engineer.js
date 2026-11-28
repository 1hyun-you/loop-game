/* ============================================================
   0.65 엔지니어 구현 (회차 97, 분할 구현 6차) — 기준: docs/characters/engineer.md
   • 고유 규칙: "엔지니어의 기계는 사라지지 않고 체력을 가지며, 가까운 적은 기계를 먼저 노림"
     - 정예 = 캐릭터 우선·길 막는 기계만 공격 / 수문장·마왕 = 기계 무시·광역기(예고 구역)에 기계도 피해
     - 설치: 가만히 1.5초 → 캐릭터 위쪽 설치, 계속 서 있으면 1.0초 간격, 움직이면 취소 (0.69 2.5·1.2초에서 단축)
     - 수량: 기본 포탑 5대(0.69 4 → 5, + 포탑 강화 '최대 설치' + 연성마다 +1), 연성 기계 종류별 2기(가안)
     - 철거: 기계 탭 1회 = 반투명 + 빨간 X, 2회 = 철거 / 재설치 대기 부서짐 10초·철거 5초
     - 영역: 기계마다 반경 250 원, 영역 밖 8초 → 전체 분해 (0.69 200·5초에서 완화), 영역 밖에서는 짓지 않음
   • 전용 무기 포탑 설치: 발현 A 쌍열 포탑 → 무기 각성 A 회전 기관포 / 발현 B 대구경 포탑 → 무기 각성 B 박격포
   • 궁극기: 기본 긴급 증설 / 인물 각성 A 현장 지휘관 + 총지휘 / 인물 각성 B 전기 울타리 + 결전 병기
   • 연성 7종 = 그 무기를 쓰는 기계 설치: 대검 기계병·칼날 드론·쇠뇌 포대·용광로·용접 토치·경보종·철조망 발사기
   • 필드 위 아군 개체: 사령술사 ally64(적에게 안 맞는 개체)와 달리 기계는 체력·피격·설치 규칙이 있어 별도 틀(mach65)
   • 그림: 새 장면은 임시 도형 (최종본 아님, GPT 요청 대상), 수치는 전부 가안 (대규모 밸런스 단계 조정)
   ============================================================ */
const E65C = {
  build: { first: 1.5, next: 1.0, gap: 6, hpBase: 80, hpMin: 0.3 },                 // 가만히 1.5초 → 설치, 계속 서 있으면 1.0초 간격, 가장자리 틈 6, 체력 80 × (1 + 분당 30%) (0.69: 2.5초·1.2초·60 고정 → 서 있기 어렵고 후반 접촉에 바로 부서짐)
  cap: { turret: 5, fuse: 2 },                                                       // 0.69 기본 포탑 5대 (4 → 5) (+최대 설치 강화·연성마다 +1), 연성 기계 종류별 2기 (가안)
  out: { k: 1.5 },                                                                   // 0.69 기계 출력: 전용·연성 기계 피해 +50% (대규모 밸런스, 처치/분 최하위 보완)
  cool: { broke: 10, removed: 5 },                                                   // 재설치 대기: 부서짐 10초·직접 철거 5초
  tap: { move: 10, time: 0.25, hit: 22, keep: 2 },                                   // 탭: 이동 10px 미만·0.25초 안에 뗌, 판정 지름 44px, X 표시 2초 유지
  area: { R: 250, edge: 100, out: 8 },                                               // 영역 반경 250(1.7초), 경계 100 안에서 진해짐, 영역 밖 8초 → 분해 (0.69 200·5초 → 250·8초: 피하다 영역을 벗어나 기계 전부 분해되는 일 잦음)
  cover: { R: 60, bossK: 1.3 },                                                     // bossK: 포탑의 수문장·마왕 1.3배 조준 (회차 102 사용자 승인, DESIGN 4장 우선 조준 예외)                                                                  // 0.69 엄호 사격(회차 102 사용자 결정): 캐릭터 반경 60(0.4초) 안 적을 기계가 먼저 노림
  lure: { R: 180, hitCd: 0.6 },                                                      // 기계 반경 150 안·캐릭터보다 기계가 가까운 일반 적 → 기계를 노림 (가안), 붙어서 0.6초마다 적 피해만큼 (가안)
  xp: { still: 0.6 },                                                                // 멈춤·자리 인물 경험치 보조 (가안): 서 있는 동안 흡수 범위 +60% (궁수와 같음)
  turret: { fire: 0.65, range: 240, r: 10, sp: 520 },                                // 기본 포탑: 0.65초마다·사거리 240·피해 11 (0.69 0.8초 → 0.65초)
  gat: { min: 0.3, step: 0.1, back: 3, cap: 5 },                                             // 회전 기관포: 같은 적을 계속 쏘면 한 발마다 -0.1초 (최저 0.3초), 대상이 바뀌면 3발분 느려짐 (가안)
  big: { R: 30, k: 1.2 },                                                            // 대구경 포탑: 작은 폭발 반경 30·피해 +20%
  mortar: { every: 4, R: 80, k: 2.5, fly: 0.7, look: 80 },                           // 박격포: 4번째 발사마다 가장 큰 무리에 곡사 포탄 반경 80·250%
  cmd: { R: 120, spd: 1.6, rep: 0.05, dur: 8, vol: 2 },                              // 현장 지휘관: 반경 120 기계 공속 +60%·초당 체력 5% 수리 / 총지휘 8초·일제 사격 피해 2배
  fence: { k: 1.5, stun: 0.4, once: 2 },                                             // 전기 울타리: 무기 기준 150%·멈칫 0.4초·같은 적 2초에 1번
  rush: { n: 3, life: 20, dist: 46, R: 40, k: 2 },                                   // 긴급 증설: 포탑 3대 낙하·20초 뒤 분해·착지 충격 반경 40·무기 기준 2배 (가안)
  cannon: { build: 0.8, n: 3, gap: 0.6, sp: 460, range: 420, R: 110, k: 3, kb: 260, fenceK: 2 },   // 결전 병기: 조립 0.8초 → 대형 포탄 3발 0.6초 간격·폭발 반경 110·무기 기준 3배·밀쳐냄
  bot: { roam: 80, sp: 90, cd: 1.25, range: 86, arc: 1.92, dmg: 19, kb: 180, spinN: 3, spinKb: 1.5, hpK: 2 },   // 대검 기계병
  drone: { cd: 0.9, range: 220, dmg: 14, back: 10, w: 24, sp: 650 },                  // 칼날 드론
  bow: { cd: 1.0, range: 300, w: 24, dmg: 16, sp: 600 },                             // 쇠뇌 포대 (우선 조준)
  furn: { cd: 1.2, range: 260, R: 35, dmg: 18, fly: 0.55, bodyR: 40, tick: 0.5, body: 6 },   // 용광로
  torch: { range: 140, tick: 0.25, dmg: 5, up: 0.25, max: 2, wait: 0.3 },             // 용접 토치
  alarm: { cd: 3, R: 140, stun: 0.2, late: 0.3, n: 2, wR: 90, wK: 0.6 },             // 경보종
  wire: { cd: 1.3, range: 200, near: 60, more: 2, dmg: 15, root: 0.5 },              // 철조망 발사기
};
const MACH65 = {                                                                      // 기계 종류: 이름·크기 (연성 기계 = 짝 무기 id)
  turret: { nm: '포탑', r: 10 }, cleave: { nm: '대검 기계병', r: 12 }, dagger: { nm: '칼날 드론', r: 10 }, arrow: { nm: '쇠뇌 포대', r: 11 },
  fireball: { nm: '용광로', r: 12 }, lamp: { nm: '용접 토치', r: 10 }, bell: { nm: '경보종', r: 11 }, thorn: { nm: '철조망 발사기', r: 10 },
};
const Eg = () => G.e65 || (G.e65 = { mach: [], cool: {}, bt: 0, chain: false, outT: 0, cmdT: 0, cannon: null, lobs: [], booms: [], sparks: [], links: [], fenceT: 0, mark: null, prev: null });
const isE65 = () => G.p && G.p.job === 'engineer' && HERO60.engineer.impl;
const ECOL = () => HERO60.engineer;
const ek65 = (w, S) => fk60r(w, S);                              // 짝 무기 강화·보조 효과 배율
const ec65 = (w, S) => S.cd / WEAPONS[w.id].base.cd;
/* 0.69 엄호 사격: 기계 사거리 안에 캐릭터에게 바짝 붙은 적이 있으면 그 적(캐릭터에 가장 가까운)부터 → (포탑만) 수문장·마왕이 사거리 1.3배 안이면 그쪽 → 기계에서 가장 가까운 적 */
function nearCover65(x, y, range) {                                                  // 캐릭터 반경 60 안 + 기계 사거리 안 적 중 캐릭터에 가장 가까운 적
  const p = G.p, R = E65C.cover.R; let best = null, bd = Infinity;
  gridQuery(p.x, p.y, R + 40, e => {
    if (e.dead) return; const dp = Math.hypot(e.x - p.x, e.y - p.y) - e.r; if (dp > R) return;
    if ((e.x - x) ** 2 + (e.y - y) ** 2 > (range + e.r) ** 2) return; if (dp < bd) { bd = dp; best = e; }
  });
  return best;
}
function cover65(x, y, range, bossOK) {
  const best = nearCover65(x, y, range);
  if (best) { S60().cover = (S60().cover || 0) + 1; return best; }
  if (bossOK && E65C.cover.bossK > 0) for (const e of G.enemies) if (!e.dead && (e.gk || e.boss) && (e.x - x) ** 2 + (e.y - y) ** 2 <= (range * E65C.cover.bossK + e.r) ** 2) { S60().coverBoss = (S60().coverBoss || 0) + 1; return e; }   // 수문장·마왕: 사거리 1.3배 안이면 조준 (DESIGN 4장 우선 조준 규칙, 거리 두는 수문장 대응)
  return nearestEnemy(x, y, range);
}

function tFire65(S) { return E65C.turret.fire * (S.cd / WEAPONS.turret.base.cd); }
const ref65 = () => { const b = baseW(); if (!b) return 10; const S = wStats(b); return S.dmg / Math.max(0.05, tFire65(S)); };   // 무기 기준 = 기본 포탑 1대 초당 피해 (가안, 사령술사 등불 기준과 같은 방식)

/* ---------- 기계 종류·수량 ---------- */
function eTypes65() {
  const b = baseW(), L = []; if (!b) return L;
  L.push({ type: 'turret', w: b, fu: 0, i: -1 });
  slotWs().forEach((w, i) => { if (w.fu && w.fu.job === 'engineer' && MACH65[w.id]) L.push({ type: w.id, w, fu: 1, i }); });
  return L;
}
function eCap65(type) {
  if (type !== 'turret') return E65C.cap.fuse;
  const b = baseW(), S = b ? wStats(b) : { n: 3 };
  return E65C.cap.turret + Math.max(0, S.n - WEAPONS.turret.base.n) + fusedWs().filter(w => w.fu && w.fu.job === 'engineer').length;
}
const eCount65 = type => Eg().mach.filter(m => m.type === type && !m.tmp).length;
function eCool65(type) { const E = Eg(), L = E.cool[type] || []; E.cool[type] = L.filter(t => t > G.time); return E.cool[type].length; }
function eNext65() {                                                                  // 다음에 지을 기계: 빈 비율 낮은 종류 → 같으면 연성 기계 → 무기 칸 순서
  let best = null, bk = 9;
  for (const o of eTypes65()) {
    const cap = eCap65(o.type), n = eCount65(o.type); if (n + eCool65(o.type) >= cap) continue;
    const k = n / cap - o.fu * 0.001 + (o.fu ? o.i * 0.00001 : 0);
    if (k < bk) { bk = k; best = o; }
  }
  return best;
}
const eReal65 = () => Eg().mach.filter(m => !m.tmp);
function inArea65(x, y, pad = 0) { const R = E65C.area.R + pad; return Eg().mach.some(m => dist2(m.x, m.y, x, y) < R * R); }
function edgeD65(x, y) { let b = -1e9; for (const m of Eg().mach) b = Math.max(b, E65C.area.R - Math.sqrt(dist2(m.x, m.y, x, y))); return b; }   // 영역 경계까지 남은 거리 (안쪽 +)
/* 설치 자리: 캐릭터 위쪽 → 차면 좌우 → 아래, 빈자리 보정 (칸 없음) */
const SPOT65 = [-90, -120, -60, -150, -30, 180, 0, 150, 30, 120, 60, 90];
function spot65(type) {
  const p = G.p, r = MACH65[type].r, gap = E65C.build.gap;
  for (let ring = 0; ring < 4; ring++) for (const deg of SPOT65) {
    const a = deg * Math.PI / 180, d = p.r + r + gap + ring * (r * 2 + gap), x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
    if (Eg().mach.every(m => dist2(m.x, m.y, x, y) >= (m.r + r + gap) ** 2)) return { x, y };
  }
  return { x: p.x + rand(-40, 40), y: p.y - 40 };
}
function place65(type, w, o = {}) {
  const E = Eg(), q = o.at || spot65(type), D = MACH65[type], hp = E65C.build.hpBase * (1 + E65C.build.hpMin * G.time / 60) * (type === 'cleave' ? E65C.bot.hpK : 1);
  const m = Object.assign({ type, w, x: q.x, y: q.y, hx: q.x, hy: q.y, r: D.r, hp, mhp: hp, cd: rand(0.1, 0.3), t: 0, a: -Math.PI / 2, shotN: 0, gat: 0 }, o.tmp ? { tmp: o.tmp } : {});
  E.mach.push(m); const S6 = S60(); S6.built = (S6.built || 0) + 1; const B = S6.builtBy || (S6.builtBy = {}); B[type] = (B[type] || 0) + 1;
  fx({ kind: 'ring', x: m.x, y: m.y, r0: 4, r1: m.r + 12, dur: 0.25, color: ECOL().c1 });
  return m;
}
function breakM65(m, why) {                                                           // why: broke(부서짐) · removed(철거) · out(영역 밖 분해) · tmp(임시 기계 종료)
  if (m.dead) return; m.dead = true;
  const E = Eg(), S6 = S60();
  if (!m.tmp && (why === 'broke' || why === 'removed')) (E.cool[m.type] || (E.cool[m.type] = [])).push(G.time + E65C.cool[why]);
  S6[why + 'N'] = (S6[why + 'N'] || 0) + 1;
  E.booms.push({ x: m.x, y: m.y, R: m.r + 10, t: 0, dur: 0.35, parts: 1 });
}
function sweepDead65() { const E = Eg(); if (E.mach.some(m => m.dead)) E.mach = E.mach.filter(m => !m.dead); }

/* ---------- 설치 진행 (가만히 서 있는 동안) ---------- */
function buildTick65(dt) {
  const E = Eg(), p = G.p, nx = eNext65();
  E.next = nx;
  if (p.moving || !nx || E.mark || (eReal65().length && !inArea65(p.x, p.y))) { E.bt = 0; if (p.moving) E.chain = false; return; }   // 움직이면 취소, X 표시 중 건설 정지, 영역 밖에서는 짓지 않음
  E.bt += dt;
  const need = E.chain ? E65C.build.next : E65C.build.first;
  if (E.bt >= need) { E.bt = 0; E.chain = true; place65(nx.type, nx.w); }
}
/* 영역 밖 5초 → 전체 분해 (돌아오면 유지) */
function areaTick65(dt) {
  const E = Eg(), p = G.p;
  if (!eReal65().length || inArea65(p.x, p.y)) { E.outT = 0; return; }
  E.outT += dt;
  if (E.outT >= E65C.area.out) { for (const m of E.mach) breakM65(m, 'out'); sweepDead65(); E.outT = 0; E.bt = 0; E.chain = false; S60().outAll = (S60().outAll || 0) + 1; toast('영역 이탈 · 기계 분해', ECOL().col); }
}

/* ---------- 기계 동작 ---------- */
function mSpd65(m) { const E = Eg(), p = G.p; return (p.job2 === 'A' && (dist2(m.x, m.y, p.x, p.y) < E65C.cmd.R ** 2 || (E.cmdT > 0 && inArea65(m.x, m.y)))) ? E65C.cmd.spd : 1; }
function vol65(m) { const v = m.vol || 1; m.vol = 0; return v; }                      // 총지휘 일제 사격 1회 피해 2배
function prio65(x, y, range) {                                                        // 우선 조준: 사거리 1.3배 안 수문장·마왕 → 정예 → 최대 체력 높은 적 → 가까운 적
  let b = null, bs = -1; const R = range * 1.3;
  gridQuery(x, y, R, e => { if (e.dead || e.sleep) return; const d = Math.sqrt(dist2(x, y, e.x, e.y)), boss = e.gk || e.boss || e.cmd;
    if (!boss && d > range) return; const s = (boss ? 3e6 : 0) + (e.elite ? 2e6 : 0) + (e.mhp || e.hp) * 100 - d; if (s > bs) { bs = s; b = e; } });
  return b;
}
function bigCluster65(x, y, range, R) {                                               // 가장 큰 무리 (사거리 안 적 중 주변 R 안 적이 가장 많은 적)
  let b = null, bn = 0, k = 0;
  gridQuery(x, y, range, e => { if (e.dead || k++ > 40) return; let n = 0; gridQuery(e.x, e.y, R, () => { n++; }); if (n > bn) { bn = n; b = e; } });
  return b;
}
function turretAtk65(m, S, now) {
  const C = E65C.turret, w = m.w, br = w.br, aw = w.aw, range = C.range * S.area;
  const cv = nearCover65(m.x, m.y, range), keep = aw === 'A' && m.tg && !m.tg.dead && dist2(m.tg.x, m.tg.y, m.x, m.y) < (range + m.tg.r) ** 2 && (!cv || cv === m.tg);   // 0.69 엄호 대상이 생기면 같은 적 조준 해제   // 회전 기관포: 사거리 안에 있는 동안 같은 적을 계속 조준 (가안)
  const e = keep ? m.tg : cover65(m.x, m.y, range, true); if (!e) { m.cd = 0.25; m.gat = Math.max(0, m.gat - 1); return; }
  if (aw === 'A') { if (m.tg === e) m.gat = Math.min(E65C.gat.cap, m.gat + 1); else if (m.tg) m.gat = Math.max(0, m.gat - E65C.gat.back); }   // 회전 기관포: 같은 적을 계속 쏠수록 빨라짐
  m.tg = e; m.a = Math.atan2(e.y - m.y, e.x - m.x); m.shotN++; m.fireT = now;
  const base = tFire65(S); m.cd = aw === 'A' ? Math.max(E65C.gat.min * (S.cd / WEAPONS.turret.base.cd), base - E65C.gat.step * m.gat * (S.cd / WEAPONS.turret.base.cd)) : base;
  const v = vol65(m), dm = S.dmg * v * (br === 'B' ? E65C.big.k : 1), col = ECOL().c1, L65 = Math.max(range, Math.hypot(e.x - m.x, e.y - m.y) + 10);   // 0.69 수문장·마왕 1.3배 조준 시 탄이 닿게
  withCR60(roll60(w), () => {
    if (aw === 'B' && m.shotN % E65C.mortar.every === 0) {                            // 박격포: 4번째 발사마다 가장 큰 무리에 곡사 포탄
      const t = bigCluster65(m.x, m.y, range, E65C.mortar.look) || e;
      Eg().lobs.push({ x0: m.x, y0: m.y - 6, x: t.x, y: t.y, t: 0, fly: E65C.mortar.fly, R: E65C.mortar.R * S.area, d: S.dmg * v * E65C.mortar.k, src: 'turret', big: 1, cr: CR60 });
      S60().mortar = (S60().mortar || 0) + 1; return;
    }
    const n = br === 'A' ? 2 : 1, ox = -Math.sin(m.a) * 4, oy = Math.cos(m.a) * 4;
    for (let i = 0; i < n; i++) { const s = n > 1 ? (i ? 1 : -1) : 0;
      if (br === 'B') shoot({ kind: 'shell', x: m.x + ox * s, y: m.y - 6 + oy * s, ang: m.a, sp: C.sp, r: 5, dmg: dm, R: E65C.big.R * S.area, life: L65 / C.sp, color: col, src: 'turret', e65: 1, on44: pr => explode(pr.x, pr.y, pr.R, pr.dmg, 'turret', '#ffcf7a') });
      else shoot({ kind: 'arrow', x: m.x + ox * s, y: m.y - 6 + oy * s, ang: m.a, sp: C.sp, r: 4, dmg: dm, pierce: 0, life: L65 / C.sp, color: col, src: 'turret', e65: 1 });
    }
  });
  const S6 = S60(); S6.tShot = (S6.tShot || 0) + 1; if (aw === 'A') { S6.gatMax = Math.max(S6.gatMax || 0, m.gat); S6.gatCd = Math.min(S6.gatCd || 9, m.cd / (S.cd / WEAPONS.turret.base.cd)); }
}
/* 연성 기계 7종 */
const MACT65 = {
  cleave(m, S, now, dt) {                                                             // 대검 기계병: 자기 자리 근처를 걸으며 다가온 적을 벰, 3마리 이상 몰리면 회전 베기
    const C = E65C.bot, e = cover65(m.hx, m.hy, C.roam + C.range * S.area);
    let tx = m.hx, ty = m.hy; if (e) { tx = e.x; ty = e.y; }
    const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy) || 1, st = e ? Math.max(0, d - e.r - C.range * S.area * 0.6) : d;
    if (st > 1) { const s = Math.min(st, C.sp * dt); let nx = m.x + dx / d * s, ny = m.y + dy / d * s; const hd = Math.hypot(nx - m.hx, ny - m.hy);
      if (hd > C.roam) { nx = m.hx + (nx - m.hx) / hd * C.roam; ny = m.hy + (ny - m.hy) / hd * C.roam; } m.x = nx; m.y = ny; m.walk = (m.walk || 0) + s; }
    if (!e || m.cd > 0) return; const R = C.range * S.area; if (dist2(m.x, m.y, e.x, e.y) > (R + e.r) ** 2) return;
    m.cd = C.cd * ec65(m.w, S); m.a = Math.atan2(e.y - m.y, e.x - m.x); m.fireT = now;
    let n = 0; gridQuery(m.x, m.y, R, () => { n++; });
    const spin = n >= C.spinN, d0 = C.dmg * ek65(m.w, S) * vol65(m), kb = WEAPONS.cleave.base.kb * (spin ? C.spinKb : 1);
    withCR60(roll60(m.w), () => gridQuery(m.x, m.y, R, o => { let da = Math.atan2(o.y - m.y, o.x - m.x) - m.a; da = Math.atan2(Math.sin(da), Math.cos(da)); if (spin || Math.abs(da) <= C.arc / 2 + 0.15) damageEnemy(o, d0, { kb, fx: m.x, fy: m.y, src: 'cleave' }); }));
    m.spin = spin; Eg().booms.push({ x: m.x, y: m.y, R, t: 0, dur: 0.2, sw: 1, a: m.a, full: spin }); if (spin) S60().botSpin = (S60().botSpin || 0) + 1;
    S60().botHit = (S60().botHit || 0) + 1;
  },
  dagger(m, S, now, dt) {                                                             // 칼날 드론: 충전대에서 날아가 적을 긋고 돌아옴, 돌아오는 길의 적도 한 번 더 그음
    const C = E65C.drone;
    if (m.dr) { m.dr.t += dt; return; }
    if (m.cd > 0) return; const e = cover65(m.x, m.y, C.range * S.area); if (!e) { m.cd = 0.25; return; }
    m.cd = C.cd * ec65(m.w, S); m.fireT = now;
    const d = Math.sqrt(dist2(m.x, m.y, e.x, e.y)), go = d / C.sp, dm = ek65(m.w, S) * vol65(m), ctx = roll60(m.w);
    m.dr = { e, x: e.x, y: e.y, t: 0, go };
    G.later.push({ t: go, f: () => { if (G.result || m.dead) { m.dr = null; return; } const tx = e.dead ? m.dr.x : e.x, ty = e.dead ? m.dr.y : e.y; m.dr.x = tx; m.dr.y = ty; m.dr.back = G.time;
      if (!e.dead) { cut60(e, '#dfe6ee'); withCR60(ctx, () => damageEnemy(e, C.dmg * dm, { src: 'dagger', fx: m.x, fy: m.y })); }
      G.later.push({ t: go, f: () => { if (!m.dr) return; const hit = []; const L = Math.sqrt(dist2(m.x, m.y, tx, ty)) || 1, ux = (m.x - tx) / L, uy = (m.y - ty) / L;
        gridQuery((tx + m.x) / 2, (ty + m.y) / 2, L / 2 + C.w, o => { if (o === e) return; const rx = o.x - tx, ry = o.y - ty, al = rx * ux + ry * uy; if (al > 0 && al < L && Math.abs(rx * uy - ry * ux) < C.w / 2 + o.r) hit.push(o); });
        withCR60(ctx, () => { for (const o of hit) { cut60(o, '#dfe6ee'); damageEnemy(o, C.back * dm, { src: 'dagger' }); } });
        S60().droneBack = (S60().droneBack || 0) + hit.length; m.dr = null; } });
      S60().drone = (S60().drone || 0) + 1; } });
  },
  arrow(m, S, now) {                                                                  // 쇠뇌 포대: 굵은 쇠살이 일직선 위 적을 꿰뚫음 (우선 조준)
    const C = E65C.bow; if (m.cd > 0) return; const range = C.range * S.area, e = prio65(m.x, m.y, range); if (!e) { m.cd = 0.25; return; }
    m.cd = C.cd * ec65(m.w, S); m.a = Math.atan2(e.y - m.y, e.x - m.x); m.fireT = now;
    const dm = C.dmg * ek65(m.w, S) * vol65(m);
    withCR60(roll60(m.w), () => { for (let i = 0; i < S.n; i++) shoot({ kind: 'arrow', x: m.x, y: m.y - 6, ang: m.a + (i - (S.n - 1) / 2) * 0.1, sp: C.sp, r: C.w / 2, dmg: dm, pierce: 999, life: range * 1.3 / C.sp, color: '#c9cdd2', src: 'arrow', e65: 1, bolt65: 1 }); });
    S60().bow = (S60().bow || 0) + 1;
  },
  fireball(m, S, now, dt) {                                                           // 용광로: 쇳물 덩이를 던져 터뜨림, 달궈진 몸통에 붙은 적은 데임
    const C = E65C.furn;
    m.bt = (m.bt || 0) - dt; if (m.bt <= 0) { m.bt = C.tick; const d = C.body * ek65(m.w, S); let n = 0; gridQuery(m.x, m.y, C.bodyR, o => { damageEnemy(o, d, { src: 'fireball' }); n++; }); if (n) S60().furnBody = (S60().furnBody || 0) + n; }   // 몸통 열기 (치명타 없음)
    if (m.cd > 0) return; const e = cover65(m.x, m.y, C.range * S.area); if (!e) { m.cd = 0.25; return; }
    m.cd = C.cd * ec65(m.w, S); m.fireT = now;
    Eg().lobs.push({ x0: m.x, y0: m.y - 10, x: e.x, y: e.y, t: 0, fly: C.fly, R: C.R * S.area, d: C.dmg * ek65(m.w, S) * vol65(m), src: 'fireball', melt: 1, cr: roll60(m.w) });
    S60().furn = (S60().furn || 0) + 1;
  },
  lamp(m, S, now, dt) {                                                               // 용접 토치: 파란 용접 불꽃 줄기를 가까운 적 1마리에 계속 이어 지짐, 오래 지질수록 피해 증가
    const C = E65C.torch;
    if (m.wait > 0) { m.wait -= dt; return; }
    if (m.tg && (m.tg.dead || dist2(m.tg.x, m.tg.y, m.x, m.y) > (C.range * S.area + m.tg.r) ** 2)) { if (m.tg.dead) m.wait = C.wait; m.tg = null; m.link = 0; if (m.wait > 0) return; }
    if (!m.tg) { m.tg = cover65(m.x, m.y, C.range * S.area); m.link = 0; if (!m.tg) return; }
    m.link += dt * mSpd65(m); m.a = Math.atan2(m.tg.y - m.y, m.tg.x - m.x);
    if (m.cd > 0) return; m.cd = C.tick * ec65(m.w, S); m.fireT = now;
    const k = Math.min(C.max, 1 + C.up * Math.floor(m.link)); withCR60(roll60(m.w), () => damageEnemy(m.tg, C.dmg * ek65(m.w, S) * k * vol65(m), { src: 'lamp' }));
    const S6 = S60(); S6.torchMax = Math.max(S6.torchMax || 0, k);
  },
  bell(m, S, now) {                                                                   // 경보종: 망치가 종을 치면 배선을 타고 가까운 기계 두 대에서도 울림
    const C = E65C.alarm; if (m.cd > 0) return; const R = C.R * S.area;
    if (!nearestEnemy(m.x, m.y, R)) { m.cd = 0.25; return; }
    m.cd = C.cd * ec65(m.w, S); m.fireT = now;
    const d = FREF60.bell * ek65(m.w, S) * vol65(m), ctx = roll60(m.w), E = Eg();
    withCR60(ctx, () => gridQuery(m.x, m.y, R, e => { damageEnemy(e, d, { src: 'bell' }); if (!e.dead) stun60(e, C.stun); }));
    E.booms.push({ x: m.x, y: m.y, R, t: 0, dur: 0.35, ring: 1 });
    const os = E.mach.filter(o => o !== m && !o.dead).sort((a, b) => dist2(a.x, a.y, m.x, m.y) - dist2(b.x, b.y, m.x, m.y)).slice(0, C.n);
    for (const o of os) { E.links.push({ x: m.x, y: m.y, tx: o.x, ty: o.y, t: 0, dur: C.late, wire: 1 });
      G.later.push({ t: C.late, f: () => { if (G.result || o.dead) return; const r = C.wR * S.area; withCR60(ctx, () => gridQuery(o.x, o.y, r, e => { damageEnemy(e, d * C.wK, { src: 'bell' }); if (!e.dead) stun60(e, C.stun); })); E.booms.push({ x: o.x, y: o.y, R: r, t: 0, dur: 0.3, ring: 1 }); S60().alarmEcho = (S60().alarmEcho || 0) + 1; } }); }
    S60().alarm = (S60().alarm || 0) + 1;
  },
  thorn(m, S, now) {                                                                  // 철조망 발사기: 가시철사 다발로 적과 곁의 적 다리를 휘감아 묶음
    const C = E65C.wire; if (m.cd > 0) return; const tg = cover65(m.x, m.y, C.range * S.area); if (!tg) { m.cd = 0.25; return; }
    m.cd = C.cd * ec65(m.w, S); m.a = Math.atan2(tg.y - m.y, tg.x - m.x); m.fireT = now;
    const L = [tg].concat(nearN60(tg.x, tg.y, C.near * S.area, C.more + 1).filter(o => o !== tg).slice(0, C.more)), d = C.dmg * ek65(m.w, S) * vol65(m), F = F60();
    withCR60(roll60(m.w), () => { for (const e of L) { damageEnemy(e, d, { src: 'thorn' }); if (e.dead) continue; root60(e, C.root); if (F.vines.length < 40) F.vines.push({ x: e.x, y: e.y, R: e.r, e, t: 0, dur: C.root + 0.15, col: '#9aa0a8', s: rand(7) }); } });
    Eg().links.push({ x: m.x, y: m.y - 4, tx: tg.x, ty: tg.y, t: 0, dur: 0.18, wire: 1 });
    S60().wire = (S60().wire || 0) + L.length;
  },
};
function machTick65(dt) {
  const E = Eg(), now = G.time, p = G.p, rep = p.job2 === 'A' ? E65C.cmd.rep : 0, Sc = {};
  if (E.cmdT > 0) E.cmdT -= dt;
  for (const m of E.mach) {
    if (m.dead) continue; m.t += dt;
    if (m.tmp && m.t >= m.tmp) { breakM65(m, 'tmp'); continue; }
    if (!G.p.weapons.includes(m.w)) { breakM65(m, 'out'); continue; }
    const sp = mSpd65(m); if (rep && sp > 1 && m.hp < m.mhp) { m.hp = Math.min(m.mhp, m.hp + m.mhp * rep * dt); S60().rep = (S60().rep || 0) + m.mhp * rep * dt; }
    if (E.mark && E.mark.m === m) continue;                                           // X 표시된 기계는 멈춤
    m.cd -= dt * ultCdMul() * sp;
    const S = Sc[m.w.id] || (Sc[m.w.id] = wStats(m.w));
    if (m.type === 'turret') { if (m.cd <= 0) turretAtk65(m, S, now); }
    else MACT65[m.type](m, S, now, dt);
  }
  sweepDead65();
  for (const o of E.lobs) {                                                           // 곡사 포탄·쇳물 덩이
    o.t += dt; if (o.t < o.fly) continue; o.dead = true;
    withCR60(o.cr, () => gridQuery(o.x, o.y, o.R, e => damageEnemy(e, o.d, { src: o.src, kb: o.big ? 120 : 0, fx: o.x, fy: o.y })));
    E.booms.push({ x: o.x, y: o.y, R: o.R, t: 0, dur: 0.35, fire: o.melt ? 1 : 0, big: o.big || 0 }); if (o.big) shake(2, 0.12);
  }
  E.lobs = E.lobs.filter(o => !o.dead);
}

/* ---------- 적: 가까운 적은 기계를 먼저 노림 (이동 뒤 보정), 기계는 길을 막음 ---------- */
const _updateEnemiesE65 = updateEnemies;
updateEnemies = function (dt) {
  const E = G && G.e65; if (!E || !E.mach.length || !isE65()) return _updateEnemiesE65.apply(this, arguments);
  const p = G.p, rec = [], LR = E65C.lure.R;
  for (const e of G.enemies) {
    if (e.dead || !noBoss60(e) || e.elite || e.fixed || e.sleep || e.thief || e.tgtCart) continue;
    let bm = null, bd = LR * LR; for (const m of E.mach) { const d = dist2(m.x, m.y, e.x, e.y); if (d < bd) { bd = d; bm = m; } }
    if (bm && bd < dist2(p.x, p.y, e.x, e.y)) rec.push([e, e.x, e.y, bm, e.kbx || 0, e.kby || 0]);
  }
  const r = _updateEnemiesE65.apply(this, arguments);
  for (const [e, x0, y0, m, kx0, ky0] of rec) {
    if (e.dead || m.dead) continue;
    const kx = kx0 * dt, ky = ky0 * dt, dx = e.x - x0 - kx, dy = e.y - y0 - ky, s = Math.hypot(dx, dy); if (s <= 0) continue;   // 밀쳐냄 이동은 그대로 두고 걸음 이동만 바꿈 (교차 검토 반영)
    e.x = x0 + kx; e.y = y0 + ky;                                                     // 캐릭터 쪽 걸음을 되돌리고 기계 쪽으로 같은 만큼
    const mx = m.x - e.x, my = m.y - e.y, md = Math.hypot(mx, my) || 1, mv = Math.min(s, Math.max(0, md - m.r - e.r));
    e.x += mx / md * mv; e.y += my / md * mv; e.m65 = m; e.m65T = G.time;
  }
  for (const m of E.mach) {                                                           // 몸통 충돌(길 막기) + 붙은 적의 공격 (일반 적 = 노린 기계, 정예 = 길 막는 기계)
    if (m.dead) continue;
    gridQuery(m.x, m.y, m.r + 2, e => {
      if (!noBoss60(e)) return;                                                       // 수문장·마왕은 기계 무시
      const dx = e.x - m.x, dy = e.y - m.y, d = Math.hypot(dx, dy) || 0.01, ov = m.r + e.r - d;
      if (ov > 0) { e.x += dx / d * ov; e.y += dy / d * ov; }
      if (G.time - (e.hm65 || -9) >= E65C.lure.hitCd && (e.elite || (e.m65 === m && G.time - e.m65T < 0.1))) { e.hm65 = G.time; hurtM65(m, e.dmg * (1 + tierK()), e); }
    });
  }
  sweepDead65();
  return r;
};
function hurtM65(m, d, e) {
  if (m.dead || G.result) return;
  m.hp -= d; m.hitT = G.time; const S6 = S60(); S6.mHurt = (S6.mHurt || 0) + d; if (e && e.elite) S6.mHurtElite = (S6.mHurtElite || 0) + d;
  if (m.hp <= 0) breakM65(m, 'broke');
}
/* 수문장·마왕 광역기(예고 구역)에 기계도 피해 */
const _updateBossFxE65 = updateBossFx;
updateBossFx = function (dt) {
  const E = G && G.e65; if (!E || !E.mach.length || !isE65() || !G.hz) return _updateBossFxE65.apply(this, arguments);
  const pend = G.hz.filter(h => !h.fired && (h.k === 'circ' || h.k === 'line' || h.k === 'sect'));
  const r = _updateBossFxE65.apply(this, arguments);
  for (const h of pend) {
    if (!h.fired) continue;
    for (const m of E.mach) {
      let hit = false;
      if (h.k === 'circ') hit = dist2(m.x, m.y, h.x, h.y) < (h.r + m.r) ** 2;
      else if (h.k === 'line') { const rx = m.x - h.x, ry = m.y - h.y, al = rx * h.dx + ry * h.dy; hit = al > -10 && al < h.len && Math.abs(rx * h.dy - ry * h.dx) < h.w / 2 + m.r; }
      else if (h.k === 'sect' && typeof dmInSect === 'function') hit = dmInSect(h, m.x, m.y, m.r);
      if (hit) { hurtM65(m, h.dmg * (h.pool ? 1.6 : 1)); S60().mHurtBoss = (S60().mHurtBoss || 0) + 1; }
    }
  }
  for (const h of G.hz) if (h.k === 'beam' && h.t > h.warn && typeof dmOnBeam === 'function') {
    h.e65 = (h.e65 || 0) - dt; if (h.e65 > 0) continue; h.e65 = 0.25;
    for (const m of E.mach) if (dmOnBeam(h, m.x, m.y, m.r)) { hurtM65(m, h.dmg); S60().mHurtBoss = (S60().mHurtBoss || 0) + 1; }
  }
  sweepDead65();
  return r;
};

/* ---------- 인물 각성 B 전기 울타리: 영역 테두리를 넘어 들어오는 적 감전 ---------- */
function fenceTick65(dt) {
  const E = Eg(); if (G.p.job2 !== 'B' || !E.mach.length) return;
  const C = E65C.fence, now = G.time, d = ref65() * C.k * (E.cannon && E.cannon.t < E.cannon.end ? E65C.cannon.fenceK : 1);
  for (const e of G.enemies) {
    if (e.dead) continue; const inside = inArea65(e.x, e.y);
    if (e.in65 === false && inside && now - (e.sh65 || -9) >= C.once) {
      e.sh65 = now; damageEnemy(e, d, { src: 'fence65' }); if (!e.dead) stun60(e, C.stun);
      if (E.sparks.length < 40) E.sparks.push({ x: e.x, y: e.y, t: 0, dur: 0.3 }); const S6 = S60(); S6.fence = (S6.fence || 0) + 1;
    }
    e.in65 = inside;
  }
}

/* ---------- 궁극기 ---------- */
function ultRush65(p) {                                                               // 긴급 증설: 포탑 3대 낙하 설치 (상한 초과·20초 뒤 분해) + 모든 기계 수리
  const C = E65C.rush, E = Eg(), b = baseW(); if (!b) return 1;
  for (const m of E.mach) m.hp = m.mhp;
  for (let i = 0; i < C.n; i++) { const a = -Math.PI / 2 + (i - 1) * 1.1, x = p.x + Math.cos(a) * C.dist, y = p.y + Math.sin(a) * C.dist, at = { x, y };
    E.links.push({ x, y: y - 120, tx: x, ty: y, t: 0, dur: 0.3, drop: 1 });
    uLater(0.3, () => { if (G.result) return; place65('turret', b, { at, tmp: C.life }); gridQuery(x, y, C.R, e => damageEnemy(e, ref65() * C.k, { src: 'ult', kb: 160, fx: x, fy: y })); E.booms.push({ x, y, R: C.R, t: 0, dur: 0.3, big: 1 }); shake(2, 0.1); }); }
  S60().rush = (S60().rush || 0) + 1;
  return 1.2;
}
function ultCmd65(p) {                                                                // 총지휘: 신호탄, 8초 지휘 효과가 영역 안 모든 기계로 + 시작 순간 일제 사격 1회 피해 2배
  const E = Eg(), C = E65C.cmd; E.cmdT = C.dur; E.flare = { x: p.x, y: p.y, t: 0 };
  let n = 0; for (const m of E.mach) if (inArea65(m.x, m.y)) { m.cd = 0; m.vol = C.vol; n++; }
  S60().cmdUlt = (S60().cmdUlt || 0) + 1; S60().cmdVol = (S60().cmdVol || 0) + n;
  return C.dur;
}
function ultCannon65(p) {                                                             // 결전 병기: 영역 한가운데 거대 포 조립 → 대형 포탄 3발 직선
  const E = Eg(), C = E65C.cannon, L = eReal65(); let x = p.x, y = p.y;
  if (L.length) { x = 0; y = 0; for (const m of L) { x += m.x; y += m.y; } x /= L.length; y /= L.length; }
  E.cannon = { x, y, t: 0, shot: 0, a: -Math.PI / 2, end: C.build + C.gap * (C.n - 1) + 0.8, shells: [] };
  S60().cannon = (S60().cannon || 0) + 1;
  return E.cannon.end;
}
function cannonTick65(dt) {
  const E = Eg(), K = E.cannon; if (!K) return;
  const C = E65C.cannon; K.t += dt;
  const tg = nearestEnemy(K.x, K.y, C.range); if (tg) K.a = Math.atan2(tg.y - K.y, tg.x - K.x);
  while (K.shot < C.n && K.t >= C.build + K.shot * C.gap) { K.shot++; K.recoil = G.time; K.shells.push({ x: K.x + Math.cos(K.a) * 20, y: K.y + Math.sin(K.a) * 20, a: K.a, d: 0 }); shake(2.5, 0.12); }
  for (const s of K.shells) {
    if (s.dead) continue; const st = C.sp * dt; s.x += Math.cos(s.a) * st; s.y += Math.sin(s.a) * st; s.d += st;
    let hit = null; gridQuery(s.x, s.y, 10, e => { if (!hit && !e.dead) hit = e; });
    if (hit || s.d >= C.range) { s.dead = true; const R = C.R; gridQuery(s.x, s.y, R, e => damageEnemy(e, ref65() * C.k, { src: 'ult', kb: C.kb, fx: s.x, fy: s.y }));
      E.booms.push({ x: s.x, y: s.y, R, t: 0, dur: 0.45, big: 1 }); shake(4, 0.2); S60().cannonHit = (S60().cannonHit || 0) + 1; }
  }
  if (K.t >= K.end && K.shells.every(s => s.dead)) E.cannon = null;
}

/* ---------- 탭 철거: 1회 = 반투명 + 빨간 X, 2회 = 철거 (2초·다른 곳 탭 시 취소) ---------- */
const TAP65 = { d: null };
function tapAt65(cx, cy) {                                                            // 화면 좌표 → 기계 판정
  if (!isE65() || STATE.mode !== 'play' || !G.e65) return false;
  const E = Eg(), Z = VIEW.zoom, p = G.p, wx = cx / Z + p.x - VIEW.cameraW / 2, wy = cy / Z + p.y - VIEW.cameraH / 2, R = E65C.tap.hit / Z;
  let bm = null, bd = Infinity; for (const m of E.mach) { if (m.tmp) continue; const d = dist2(m.x, m.y, wx, wy), rr = Math.max(R, m.r); if (d < rr * rr && d < bd) { bd = d; bm = m; } }
  if (!bm) { if (E.mark) { E.mark = null; S60().unmark = (S60().unmark || 0) + 1; } return false; }
  if (E.mark && E.mark.m === bm && G.time - E.mark.t < E65C.tap.keep) { E.mark = null; breakM65(bm, 'removed'); sweepDead65(); sfx('pick'); return true; }
  E.mark = { m: bm, t: G.time }; sfx('pick'); S60().markN = (S60().markN || 0) + 1; return true;
}
if (typeof cv !== 'undefined') {
  cv.addEventListener('pointerdown', e => { TAP65.d = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() }; }, { capture: true });
  cv.addEventListener('pointerup', e => { const d = TAP65.d; TAP65.d = null; if (!d || d.id !== e.pointerId) return;
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < E65C.tap.move && performance.now() - d.t < E65C.tap.time * 1000) tapAt65(e.clientX, e.clientY); });
}
function markTick65() { const E = Eg(); if (E.mark && (E.mark.m.dead || G.time - E.mark.t >= E65C.tap.keep)) E.mark = null; }

/* ---------- 연성 7종: 기계 설치형 (무기 칸은 기계 종류만 정함, 공격은 기계가 함) ---------- */
const eFuse65 = () => 'tick';
FUSE60.engineer = {
  cleave: { nm: '대검 기계병', ds: '대검을 든 보행 로봇, 자리 근처를 걸으며 벰, 3마리 이상 몰리면 회전 베기 (체력 2배)', fire: eFuse65 },
  dagger: { nm: '칼날 드론', ds: '충전대에서 드론이 날아가 적을 긋고 돌아옴, 돌아오는 길의 적도 그음', fire: eFuse65 },
  arrow: { nm: '쇠뇌 포대', ds: '굵은 쇠살이 일직선 위 적을 모두 꿰뚫음 (우선 조준)', fire: eFuse65 },
  fireball: { nm: '용광로', ds: '쇳물 덩이를 던져 터뜨림, 달궈진 몸통에 붙은 적은 데임', fire: eFuse65 },
  lamp: { nm: '용접 토치', ds: '용접 불꽃 줄기를 1마리에 계속 이어 지짐, 오래 지질수록 피해 증가 (최대 2배)', fire: eFuse65 },
  bell: { nm: '경보종', ds: '종이 울리면 배선을 타고 가까운 기계 두 대에서도 울림 (60%)', fire: eFuse65 },
  thorn: { nm: '철조망 발사기', ds: '가시철사 다발로 적과 곁의 적 최대 3마리를 휘감아 묶음', fire: eFuse65 },
};

/* ---------- 인물 연결점 ---------- */
Object.assign(HERO60.engineer, {
  impl: true,
  br: [{ k: 'A', nm: '쌍열 포탑', ds: '포신 2개, 2발 동시 발사' }, { k: 'B', nm: '대구경 포탑', ds: '포탄이 작은 폭발 (반경 30), 피해 +20%' }],
  wak: { A: { nm: '회전 기관포', ds: '같은 적을 계속 쏘면 발사 간격 0.8 → 최저 0.3초' }, B: { nm: '박격포', ds: '4번째 발사마다 가장 큰 무리에 곡사 포탄 (반경 80·250%)' } },
  stat(w) { return { dmg: E65C.out.k }; },
  fire: () => 'tick',                                                                 // 전용 무기 칸은 기본 포탑 종류만 정함, 공격은 설치된 포탑이 함
  onPick() { G.e65 = null; Eg(); SRC_NM.turret = '포탑'; SRC_NM.fence65 = '전기 울타리'; },
  ultFn(k) { return k === 'A' ? ultCmd65 : k === 'B' ? ultCannon65 : ultRush65; },
  tick(dt) {
    const E = Eg();
    markTick65(); buildTick65(dt); machTick65(dt); areaTick65(dt); fenceTick65(dt); cannonTick65(dt);
    if (E.flare) { E.flare.t += dt; if (E.flare.t > 1.2) E.flare = null; }
    for (const k of ['booms', 'links', 'sparks']) { const L = E[k]; for (const o of L) o.t += dt; E[k] = L.filter(o => o.t < o.dur); }
    const S6 = S60(); S6.mMax = Math.max(S6.mMax || 0, eReal65().length);
    if (!G.p.moving) S6.stillT = (S6.stillT || 0) + dt; else S6.moveT = (S6.moveT || 0) + dt;
  },
  status() { const E = Eg(); if (E.cannon) return '결전 병기'; if (E.cmdT > 0) return '총지휘 ' + Math.ceil(E.cmdT);
    return '기계 ' + eReal65().length + (E.outT > 0 ? ' · 분해 ' + Math.ceil(E65C.area.out - E.outT) : ''); },
  dials() { const E = Eg(), need = E.chain ? E65C.build.next : E65C.build.first; return [{ ic: '설', col: ECOL().c1, k: Math.max(0, Math.min(1, E.bt / need)) }]; },
  draw: drawE65,
});
/* 멈춤·자리 인물 경험치 보조 (가안): 서 있는 동안 흡수 범위 +60% */
const _pickRE65 = pickR;
pickR = function () { const r = _pickRE65.apply(this, arguments); return isE65() && !G.p.moving ? r * (1 + E65C.xp.still) : r; };

/* ---------- 무기 칸 아이콘 아래 채움 막대 (재설치 대기 = 회색) ---------- */
const _drawSlotsE65 = drawSlots;
drawSlots = function (c) {
  const r = _drawSlotsE65.apply(this, arguments);
  try {
    if (G.result || !isE65() || !G.e65) return r;
    const L = hudLayout(), bar = (R, type) => { const cap = eCap65(type), n = eCount65(type), cl = eCool65(type), x = R.x + 3, y = R.y + R.h - 4, w = R.w - 6;
      c.save(); c.globalAlpha = 0.85; c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(x, y, w, 2.5);
      c.fillStyle = ECOL().c1; c.fillRect(x, y, w * n / cap, 2.5); if (cl) { c.fillStyle = '#8a8f96'; c.fillRect(x + w * n / cap, y, w * Math.min(cl, cap - n) / cap, 2.5); } c.restore(); };
    const b = baseW(); if (b) bar({ x: L.x + 6, y: L.y + 10, w: 32, h: 32 }, 'turret');
    slotWs().forEach((w, i) => { if (w.fu && w.fu.job === 'engineer' && MACH65[w.id]) bar(L.tile(i, 0), w.id); });
  } catch (e) { }
  return r;
};

/* ---------- 자동 플레이: 엔지니어 전용 '영역 안에서 서서 짓기' (시험·실기기 자동 플레이 공용) ----------
   ① 공격 예고 → 공용 회피 ② 적이 곧 닿음 → 영역 안쪽으로 물러섬 ③ 영역 밖(기계가 있을 때) → 가장 가까운 기계 쪽으로 복귀
   ④ 목표 지점 → 공용 (영역 밖이어도 목표 우선) ⑤ 지을 기계가 있고 여유 있음 → 서서 짓기 ⑥ 보석(영역 안) → 공용 ⑦ 다가가기는 더 지을 기계가 없고 사거리 안에 적이 없을 때만 */
const AUTO65 = { tcGo: 0.3, tcGoLow: 0.5, tcBuild: 0.45, lowHp: 0.4, minStand: 0.4 };
const _autoVecE65 = autoVec;
function eAuto65() { return AUTO.e65 && AUTO.e65.run === G ? AUTO.e65 : (AUTO.e65 = { run: G, mode: 'stand', at: G.time, why: '', fd: null }); }
function eFlee65(s) {
  const p = G.p, has = eReal65().length; let best = AUTO_DIRS[0], bs = -1e9;
  for (const dv of AUTO_DIRS) {
    let n = 0; gridQuery(p.x + dv.x * 90, p.y + dv.y * 90, 110, e => { if (!e.dead && !e.fixed && !e.sleep) n++; });
    let sc = -autoDanger(p.x + dv.x * 35, p.y + dv.y * 35) - 0.7 * autoDanger(p.x + dv.x * 80, p.y + dv.y * 80) - 0.6 * n;
    if (has && !inArea65(p.x + dv.x * 60, p.y + dv.y * 60)) sc -= 3;                  // 영역 밖으로 나가는 쪽 감점
    if (s.fd) sc += 1.5 * (dv.x * s.fd.x + dv.y * s.fd.y);
    if (sc > bs) { bs = sc; best = dv; }
  }
  s.fd = best; AUTO.dir = { x: best.x, y: best.y };
  return { x: best.x, y: best.y, m: 1 };
}
autoVec = function () {
  if (!isE65() || !G.e65) return _autoVecE65.apply(this, arguments);
  const E = Eg(), s = eAuto65(), p = G.p, S6 = S60();
  if (G.time < (s.next || 0) && s.out) return s.out;
  s.next = G.time + rand(0.06, 0.12);
  const inHz = hazT50(p.x, p.y) < Infinity, tg = autoTarget(), tc = tcMin63(p.x, p.y), here = autoDanger(p.x, p.y), has = eReal65().length, el = G.time - s.at;
  const go = (p.hp < p.maxHp * AUTO65.lowHp ? AUTO65.tcGoLow : AUTO65.tcGo) * (STATE.dev.god ? 0.6 : 1);
  let want = null;
  if (inHz) want = 'hz';
  else if (tc < go) want = 'flee';
  else if (has && !inArea65(p.x, p.y) && !(tg && tg.k === 'goal')) want = 'home';            // 목표 지점이 영역 밖이면 목표 우선 (5초 뒤 분해 → 목표 지점에서 다시 지음)
  else if (tg && tg.k === 'goal') want = 'goal';
  else if (shotT63() < 0.5) want = 'dodge';
  else if (E.next && tc > AUTO65.tcBuild && !E.mark) want = null;                     // 지을 기계가 있고 여유 → 서서 짓기
  else if (tg && (tg.k === 'boss' || tg.k === 'gk')) want = here > 1.5 ? 'flee' : null;
  else if (tg && tg.k === 'gem' && here < 0.8 && (!has || inArea65(tg.x, tg.y, -10))) want = 'gem';
  else if (!E.next && tg && !nearestEnemy(p.x, p.y, E65C.turret.range)) want = 'close';     // 더 지을 기계가 없고 포탑 사거리 안에 적이 없을 때만 다가감
  if (want && s.mode === 'stand' && el < AUTO65.minStand && (want === 'gem' || want === 'close')) want = null;
  if (want) {
    if (s.mode !== 'move' || s.why !== want) { if (want === 'flee') s.fd = null; s.mode = 'move'; s.why = want; s.at = G.time; const W = S6.eWhy || (S6.eWhy = {}); W[want] = (W[want] || 0) + 1; }
    if (want === 'flee' || want === 'dodge') return (s.out = eFlee65(s));
    if (want === 'home') { let bm = null, bd = Infinity; for (const m of eReal65()) { const d = dist2(m.x, m.y, p.x, p.y); if (d < bd) { bd = d; bm = m; } }
      const dx = bm.x - p.x, dy = bm.y - p.y, d = Math.hypot(dx, dy) || 1; return (s.out = AUTO.out = { x: dx / d, y: dy / d, m: 1 }); }
    return (s.out = _autoVecE65.apply(this, arguments));
  }
  if (s.mode !== 'stand') { s.mode = 'stand'; s.why = ''; s.at = G.time; }
  if (ultReady() && !autoUltSetting() && (here > 2 || G.time - G.tm.readyAt > 6)) { S50().ultStop++; ultPress58('ai'); }
  return (s.out = AUTO.out = { x: 0, y: 0, m: 0 });
};

/* ---------- 그리기 (임시 도형, 최종본 아님) ---------- */
function mBody65(c, m, H, alpha) {                                                    // 기계 몸체: 종류별 단순 도형 + 무기 각성 공통 장갑판·노란 경고 줄무늬
  const x = m.x, y = m.y, r = m.r, b = m.w && m.w.base, aw = b && m.w.aw, rec = m.fireT && G.time - m.fireT < 0.08 ? 2 : 0, tau = Math.PI * 2;
  c.globalAlpha = alpha; c.lineWidth = 1.5; c.strokeStyle = '#2a2e33';
  c.fillStyle = '#5E6670'; c.beginPath(); c.ellipse(x, y + r * 0.55, r * 1.05, r * 0.45, 0, 0, tau); c.fill();   // 받침
  if (m.type === 'turret') {
    c.fillStyle = aw ? '#6d757e' : H.c1; c.beginPath(); c.arc(x, y - 2, r * 0.75, 0, tau); c.fill(); c.stroke();
    c.strokeStyle = '#3a3f45'; c.lineWidth = m.w.br === 'B' ? 5 : 3.5; c.lineCap = 'round';
    const L = r + 4 - rec, n = m.w.br === 'A' ? 2 : 1;
    for (let i = 0; i < n; i++) { const o = n > 1 ? (i ? 2.5 : -2.5) : 0, ox = -Math.sin(m.a) * o, oy = Math.cos(m.a) * o;
      c.beginPath(); c.moveTo(x + ox, y - 2 + oy); c.lineTo(x + ox + Math.cos(m.a) * L, y - 2 + oy + Math.sin(m.a) * L); c.stroke(); }
    if (aw === 'A') { c.globalAlpha = alpha * 0.6; c.strokeStyle = '#c8ccd0'; c.lineWidth = 1; c.beginPath(); c.arc(x + Math.cos(m.a) * (L - 2), y - 2 + Math.sin(m.a) * (L - 2), 2.5, G.time * 30, G.time * 30 + 4); c.stroke(); c.globalAlpha = alpha; }
  } else if (m.type === 'cleave') {                                                   // 대검 기계병: 두 다리 + 몸통 + 대검
    const st = Math.sin((m.walk || 0) * 0.25) * 3; c.strokeStyle = '#3a3f45'; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 4, y); c.lineTo(x - 5 + st, y + 9); c.moveTo(x + 4, y); c.lineTo(x + 5 - st, y + 9); c.stroke();
    c.fillStyle = H.c1; c.fillRect(x - 7, y - 12, 14, 12); c.strokeRect(x - 7, y - 12, 14, 12); c.fillStyle = H.c3; c.fillRect(x - 3, y - 9, 6, 2);
    const sa = m.spin && G.time - m.fireT < 0.25 ? m.a + (G.time - m.fireT) * 25 : m.a; c.strokeStyle = '#d8dde2'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + 6, y - 6); c.lineTo(x + 6 + Math.cos(sa) * 20, y - 6 + Math.sin(sa) * 20); c.stroke();
  } else if (m.type === 'dagger') {                                                   // 칼날 드론 충전대
    c.fillStyle = '#4a5058'; c.fillRect(x - 8, y - 4, 16, 7); c.strokeRect(x - 8, y - 4, 16, 7); c.fillStyle = H.c3; c.fillRect(x - 6, y - 2, 12 * Math.min(1, 1 - Math.max(0, m.cd) / 0.9), 2);
    if (!m.dr) { c.fillStyle = '#c8cdd2'; c.beginPath(); c.ellipse(x, y - 9, 6, 2.5, 0, 0, tau); c.fill(); }
  } else if (m.type === 'arrow') {                                                    // 쇠뇌 포대: 받침 위 큰 쇠뇌 + 태엽
    c.fillStyle = '#6b5236'; c.fillRect(x - 3, y - 6, 6, 10); c.save(); c.translate(x, y - 6); c.rotate(m.a);
    c.strokeStyle = '#3a3f45'; c.lineWidth = 3; c.beginPath(); c.moveTo(-6, 0); c.lineTo(12 - rec, 0); c.stroke(); c.strokeStyle = '#c9cdd2'; c.lineWidth = 2; c.beginPath(); c.arc(2, 0, 10, -1.3, 1.3); c.stroke(); c.restore();
  } else if (m.type === 'fireball') {                                                 // 용광로: 달궈진 몸통 + 화구 + 아지랑이
    c.fillStyle = '#4a3a34'; c.fillRect(x - 9, y - 14, 18, 16); c.strokeRect(x - 9, y - 14, 18, 16);
    c.fillStyle = '#ff7a2a'; c.globalAlpha = alpha * (0.7 + Math.sin(G.time * 8) * 0.2); c.fillRect(x - 5, y - 9, 10, 6);
    c.globalAlpha = alpha * 0.2; c.fillStyle = '#ff9a4a'; c.beginPath(); c.arc(x, y - 4, E65C.furn.bodyR, 0, tau); c.fill();
  } else if (m.type === 'lamp') {                                                     // 용접 토치: 집게 팔 + 파란 불꽃
    c.fillStyle = '#5a6068'; c.fillRect(x - 6, y - 8, 12, 10); c.strokeRect(x - 6, y - 8, 12, 10); c.strokeStyle = '#3a3f45'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x, y - 8); c.lineTo(x + Math.cos(m.a) * 10, y - 8 + Math.sin(m.a) * 10); c.stroke();
    if (m.tg && !m.tg.dead) { const hx = x + Math.cos(m.a) * 10, hy = y - 8 + Math.sin(m.a) * 10, k = Math.min(1, (m.link || 0) / 4);
      c.globalAlpha = alpha * 0.9; c.strokeStyle = '#7fc8ff'; c.lineWidth = 2 + k * 2; c.beginPath(); c.moveTo(hx, hy); for (let i = 1; i <= 6; i++) { const u = i / 6; c.lineTo(hx + (m.tg.x - hx) * u + rand(-2, 2), hy + (m.tg.y - hy) * u + rand(-2, 2)); } c.stroke();
      c.globalAlpha = alpha * (0.4 + k * 0.4); c.fillStyle = k > 0.6 ? '#ffb070' : '#bfe6ff'; c.beginPath(); c.arc(m.tg.x, m.tg.y, m.tg.r * 0.6, 0, tau); c.fill(); }
  } else if (m.type === 'bell') {                                                     // 경보종: 종탑 + 종 + 망치
    c.strokeStyle = '#3a3f45'; c.lineWidth = 2; c.strokeRect(x - 8, y - 16, 16, 16); const sw = m.fireT && G.time - m.fireT < 0.3 ? Math.sin((G.time - m.fireT) * 40) * 0.3 : 0;
    c.save(); c.translate(x, y - 14); c.rotate(sw); c.fillStyle = '#c9a24a'; c.beginPath(); c.moveTo(-5, 10); c.quadraticCurveTo(-5, 0, 0, 0); c.quadraticCurveTo(5, 0, 5, 10); c.closePath(); c.fill(); c.restore();
  } else if (m.type === 'thorn') {                                                    // 철조망 발사기: 통 + 감긴 가시철사
    c.fillStyle = '#5a6068'; c.beginPath(); c.arc(x, y - 4, 7, 0, tau); c.fill(); c.stroke(); c.strokeStyle = '#9aa0a8'; c.lineWidth = 1; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(x, y - 4, 3 + i * 1.5, i, i + 4.5); c.stroke(); }
    c.strokeStyle = '#3a3f45'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y - 4); c.lineTo(x + Math.cos(m.a) * 11, y - 4 + Math.sin(m.a) * 11); c.stroke();
  }
  if (aw) { c.globalAlpha = alpha; c.fillStyle = '#ffd23f'; for (let i = 0; i < 3; i++) c.fillRect(x - r + i * r * 0.7, y + r * 0.35, r * 0.35, 2); }   // 무기 각성 공통: 노란 경고 줄무늬
}
function drawE65(c) {
  const E = G.e65; if (!E) return;
  const p = G.p, H = HERO60.engineer, tau = Math.PI * 2, now = G.time, AR = E65C.area.R, real = eReal65();
  c.lineCap = 'round';
  if (E.mach.length) {                                                                // 영역: 합쳐진 옅은 바닥색 + 테두리 (경계 100 안에서 진해짐)
    const ed = edgeD65(p.x, p.y), near = ed > 0 && ed < E65C.area.edge ? 1 - ed / E65C.area.edge : 0;
    c.globalAlpha = 0.07 + near * 0.06; c.fillStyle = H.c1; c.beginPath(); for (const m of E.mach) { c.moveTo(m.x + AR, m.y); c.arc(m.x, m.y, AR, 0, tau); } c.fill('nonzero');
    c.globalAlpha = 0.28 + near * 0.35; c.strokeStyle = p.job2 === 'B' ? '#9fd0ff' : H.c1; c.lineWidth = p.job2 === 'B' ? 2 : 1.5;
    if (p.job2 === 'B') c.setLineDash([6, 5]);
    c.beginPath(); for (const m of E.mach) for (let i = 0; i < 48; i++) { const a0 = i / 48 * tau, a1 = (i + 1) / 48 * tau, xm = m.x + Math.cos((a0 + a1) / 2) * AR, ym = m.y + Math.sin((a0 + a1) / 2) * AR;
      if (E.mach.some(o => o !== m && dist2(o.x, o.y, xm, ym) < (AR - 1) ** 2)) continue; c.moveTo(m.x + Math.cos(a0) * AR, m.y + Math.sin(a0) * AR); c.arc(m.x, m.y, AR, a0, a1); }
    c.stroke(); c.setLineDash([]);
  }
  const out = E.outT > 0, blink = out && Math.floor(now * 6) % 2;
  for (const m of E.mach) {
    let al = m.tmp ? 0.75 : 1; if (E.mark && E.mark.m === m) al = 0.45; if (blink) al *= 0.5;
    if (m.tmp && m.tmp - m.t < 2 && Math.floor(now * 8) % 2) al *= 0.5;
    mBody65(c, m, H, al);
    if (m.tmp) { c.globalAlpha = 0.7; c.strokeStyle = '#ffd23f'; c.lineWidth = 1; c.setLineDash([2, 3]); c.beginPath(); c.arc(m.x, m.y, m.r + 4, 0, tau); c.stroke(); c.setLineDash([]); }   // 임시 기계 표시
    if (m.hp < m.mhp) { c.globalAlpha = 0.9; c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(m.x - 10, m.y - m.r - 9, 20, 3); c.fillStyle = m.hp / m.mhp > 0.4 ? '#8fd46a' : '#ff6a5a'; c.fillRect(m.x - 10, m.y - m.r - 9, 20 * Math.max(0, m.hp / m.mhp), 3); }
    if (m.hitT && now - m.hitT < 0.1) { c.globalAlpha = 0.5; c.fillStyle = '#fff'; c.beginPath(); c.arc(m.x, m.y - 2, m.r, 0, tau); c.fill(); }
    if (p.job2 === 'A' && (dist2(m.x, m.y, p.x, p.y) < E65C.cmd.R ** 2 || E.cmdT > 0)) { c.globalAlpha = 0.5 + 0.5 * (Math.floor(now * (E.cmdT > 0 ? 6 : 2)) % 2); c.fillStyle = E.cmdT > 0 ? '#ff5a3a' : '#ffd23f'; c.beginPath(); c.arc(m.x + m.r * 0.6, m.y - m.r - 2, 1.8, 0, tau); c.fill(); }   // 지휘 경고등
    if (m.type === 'dagger' && m.dr) { const o = m.dr, go = o.go || 0.1, k = o.back ? 1 - Math.min(1, (now - o.back) / go) : Math.min(1, (o.t || 0) / go), tx = o.back ? o.x : (o.e.dead ? o.x : o.e.x), ty = o.back ? o.y : (o.e.dead ? o.y : o.e.y);
      const dx = m.x + (tx - m.x) * k, dy = m.y - 9 + (ty - m.y + 9) * k; c.globalAlpha = 0.95; c.fillStyle = '#c8cdd2'; c.beginPath(); c.ellipse(dx, dy, 6, 2.5, 0, 0, tau); c.fill(); c.strokeStyle = '#eef2f6'; c.lineWidth = 1; c.beginPath(); c.moveTo(dx - 7, dy); c.lineTo(dx + 7, dy); c.stroke(); }
  }
  if (E.mark) { const m = E.mark.m; c.globalAlpha = 0.95; c.strokeStyle = '#ff3a3a'; c.lineWidth = 3; c.beginPath(); c.moveTo(m.x - 7, m.y - 9); c.lineTo(m.x + 7, m.y + 5); c.moveTo(m.x + 7, m.y - 9); c.lineTo(m.x - 7, m.y + 5); c.stroke(); }
  if (out) { const k = E.outT / E65C.area.out; c.globalAlpha = 0.9; c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(p.x - 18, p.y - 34, 36, 4); c.fillStyle = '#ff6a3a'; c.fillRect(p.x - 18, p.y - 34, 36 * k, 4); }   // 무너짐 게이지
  const nx = E.next;                                                                  // 설치 미리보기 + 진행 바 + '용광로 0/1'
  if (nx && !E.mark && !(real.length && !inArea65(p.x, p.y))) {
    const q = spot65(nx.type), need = E.chain ? E65C.build.next : E65C.build.first, k = Math.min(1, E.bt / need), fake = { type: nx.type, w: nx.w, x: q.x, y: q.y, r: MACH65[nx.type].r, a: -Math.PI / 2 };
    c.save(); c.translate(0, (1 - k) * 6 * (k > 0 ? 1 : 0)); mBody65(c, fake, H, 0.22 + k * 0.4); c.restore();
    if (!p.moving) { c.globalAlpha = 0.9; c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(q.x - 14, q.y - 22, 28, 3); c.fillStyle = H.c3; c.fillRect(q.x - 14, q.y - 22, 28 * k, 3);
      c.fillStyle = '#f2ecdc'; c.font = '700 7px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'bottom'; c.fillText(`${MACH65[nx.type].nm} ${eCount65(nx.type)}/${eCap65(nx.type)}`, q.x, q.y - 24);
      if (k > 0) { c.globalAlpha = 0.6 * k; c.strokeStyle = H.c1; c.lineWidth = 1; for (let i = 0; i < 3; i++) { const a = now * 4 + i * 2.1; c.beginPath(); c.moveTo(q.x + Math.cos(a) * 14 * (1 - k), q.y + Math.sin(a) * 8 * (1 - k)); c.lineTo(q.x, q.y); c.stroke(); } } }   // 부품이 맞물리며 솟아오름
  }
  for (const o of E.lobs) { const k = Math.min(1, o.t / o.fly), x = o.x0 + (o.x - o.x0) * k, y = o.y0 + (o.y - o.y0) * k - Math.sin(k * Math.PI) * (o.big ? 70 : 40);   // 곡사 포탄·쇳물 덩이 (포물선)
    c.globalAlpha = 0.25; c.fillStyle = '#000'; c.beginPath(); c.ellipse(o.x, o.y, o.R * 0.3 * k + 2, o.R * 0.12 * k + 1, 0, 0, tau); c.fill();
    c.globalAlpha = 1; c.fillStyle = o.melt ? '#ff8a2a' : '#3a3f45'; c.beginPath(); c.arc(x, y, o.big ? 6 : 4.5, 0, tau); c.fill(); if (o.melt) { c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(x - 1, y - 1, 2, 0, tau); c.fill(); } }
  for (const o of E.links) { const k = o.t / o.dur;
    if (o.wire) { c.globalAlpha = 0.8 * (1 - k); c.strokeStyle = '#ffd23f'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(o.x, o.y); c.lineTo(o.x + (o.tx - o.x) * Math.min(1, k * 1.4), o.y + (o.ty - o.y) * Math.min(1, k * 1.4)); c.stroke(); continue; }
    if (o.drop) { c.globalAlpha = 0.9; c.fillStyle = '#5E6670'; c.beginPath(); c.arc(o.x, o.y + (o.ty - o.y) * k, 9, 0, tau); c.fill(); c.globalAlpha = 0.3; c.fillStyle = '#000'; c.beginPath(); c.ellipse(o.tx, o.ty, 6 + k * 6, 3 + k * 2, 0, 0, tau); c.fill(); } }
  for (const o of E.booms) { const k = o.t / o.dur;
    if (o.ring) { c.globalAlpha = 0.6 * (1 - k); c.strokeStyle = '#e8c35a'; c.lineWidth = 3; c.beginPath(); c.arc(o.x, o.y, o.R * (0.25 + 0.75 * k), 0, tau); c.stroke(); continue; }
    if (o.sw) { c.globalAlpha = 0.6 * (1 - k); c.strokeStyle = '#e6eaee'; c.lineWidth = 3; c.beginPath(); if (o.full) c.arc(o.x, o.y, o.R, 0, tau); else c.arc(o.x, o.y, o.R, o.a - 0.96, o.a + 0.96); c.stroke(); continue; }
    if (o.parts) { c.globalAlpha = 1 - k; c.fillStyle = '#8a8f96'; for (let i = 0; i < 5; i++) { const a = i * 1.26, d = o.R * k; c.fillRect(o.x + Math.cos(a) * d - 1.5, o.y + Math.sin(a) * d - 1.5, 3, 3); } continue; }
    c.globalAlpha = 0.65 * (1 - k); c.fillStyle = o.fire ? '#ff8a2a' : o.big ? '#ffcf7a' : H.c1; c.beginPath(); c.arc(o.x, o.y, o.R * (0.3 + 0.7 * Math.min(1, k * 2.5)), 0, tau); c.fill();
    if (o.big) { c.globalAlpha = 0.3 * (1 - k); c.fillStyle = '#8a8580'; c.beginPath(); c.arc(o.x, o.y - 6, o.R * 0.6 * (0.5 + k), 0, tau); c.fill(); }   // 포연
  }
  for (const o of E.sparks) { const k = o.t / o.dur; c.globalAlpha = 1 - k; c.strokeStyle = '#bfe6ff'; c.lineWidth = 1.5; c.beginPath(); for (let i = 0; i < 4; i++) { const a = i * 1.57 + o.x; c.moveTo(o.x, o.y); c.lineTo(o.x + Math.cos(a) * 9 * (0.5 + k), o.y + Math.sin(a) * 9 * (0.5 + k)); } c.stroke(); }   // 감전 불꽃
  if (E.flare) { const k = E.flare.t / 1.2; c.globalAlpha = 1 - k; c.fillStyle = '#ff5a3a'; c.beginPath(); c.arc(E.flare.x, E.flare.y - 20 - k * 90, 4, 0, tau); c.fill(); c.globalAlpha = 0.3 * (1 - k); c.beginPath(); c.arc(E.flare.x, E.flare.y - 20 - k * 90, 14, 0, tau); c.fill(); }   // 신호탄
  if (E.cannon) { const K = E.cannon, bk = Math.min(1, K.t / E65C.cannon.build), rc = K.recoil && now - K.recoil < 0.15 ? 6 : 0;   // 결전 병기: 조립되는 거대 포 + 반동
    c.globalAlpha = 0.4 + 0.6 * bk; c.fillStyle = '#4a5058'; c.beginPath(); c.arc(K.x, K.y, 18 * bk, 0, tau); c.fill(); c.strokeStyle = '#2a2e33'; c.lineWidth = 2; c.stroke();
    c.strokeStyle = '#3a3f45'; c.lineWidth = 10 * bk; c.beginPath(); c.moveTo(K.x, K.y); c.lineTo(K.x + Math.cos(K.a) * (30 - rc) * bk, K.y + Math.sin(K.a) * (30 - rc) * bk); c.stroke();
    c.fillStyle = '#ffd23f'; for (let i = 0; i < 4; i++) c.fillRect(K.x - 14 + i * 8, K.y + 12, 4, 2);
    for (const s of K.shells) if (!s.dead) { c.globalAlpha = 1; c.fillStyle = '#2a2e33'; c.beginPath(); c.arc(s.x, s.y, 7, 0, tau); c.fill(); c.globalAlpha = 0.35; c.fillStyle = '#8a8580'; c.beginPath(); c.arc(s.x - Math.cos(s.a) * 12, s.y - Math.sin(s.a) * 12, 6, 0, tau); c.fill(); } }
  c.globalAlpha = 1;
}
