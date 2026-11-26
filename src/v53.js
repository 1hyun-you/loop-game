/* ============================================================
   0.53 전면 점검 패치 1차 — 단순화 · 직업형 기본 무기 · 직업 격차 보정 (회차 59)
   • 직업형 기본 무기 5종: 전직 순간 기본 무기 칸의 상징 무기가 직업형으로 변형 (공용 무기 10종은 그대로)
     - 군주 방패 밀치기(전방 넓은 밀어내기) · 기술자 지뢰(적 쪽으로 던져 설치, 폭발 후 감속)
     - 시간술사 시간 지연장(범위 1.3배, 감속 반경과 통합) · 소환사 영혼 사슬(묶인 적 감속·망령 피해 증가)
     - 프리스트 심판의 빛(체력 높은 적 위로 빛 기둥)
     - 분기·각성은 원래 무기 것을 계승 (심판의 빛은 위성 → 잔광, 분열 → 주변 소형 빛으로 번역)
   • 단순화: 직업 시련 폐지(2차 전직 = 전직 후 1페이즈 돌파) · 2차 전직 '숙련' 삭제(2택)
     · 캐릭터가 임의로 이동하는 효과 폐지(전사 방패 돌격 → 방패 강타, 암살자 순간 이동 → 그림자 기습)
   • 직업 격차: 마법사 기본 무기 개별 발동 복원 · 기술자 포탑 주변 감속 구역
     · 군주 군기 경험치 배율 삭제 · 프리스트 정화/성역 회복 하향 · 시간술사 감속 반경을 지연장 범위로 통합
   • 표시는 임시 도형 (최종본 아님, 시험 확인 후 GPT 요청 대상)
   • 시험 집계: G.stats.v53 { push, mine, judge, chain, shadow, slowE }
   ============================================================ */
const V53 = { pushR: 1.45, pushArc: 2.3, mineR: 1.2, mineSlow: 1.2, mineReach: 110, chrArea: 1.3, chrR0: 94, chainSlow: 0.8, chainMark: 2, chainK: 1.25, priR: 46, priK: 0.55, engR: 78, engSlow: 0.72, shadowD: 30, shadowLv: 3 };
const S53 = () => G.stats.v53 || (G.stats.v53 = { push: 0, mine: 0, judge: 0, chain: 0, shadow: 0, slowE: 0 });

/* ---------- 직업형 기본 무기 ---------- */
const FORM53 = {
  sovereign: { id: 'shield', nm: '방패 밀치기', ds: '전방 넓은 범위의 적을 방패로 크게 밀어냄' },
  engineer: { id: 'trap', nm: '지뢰', ds: '가까운 적 쪽으로 지뢰를 던져 설치, 폭발에 휘말린 적은 잠시 느려짐' },
  chrono: { id: 'icering', nm: '시간 지연장', ds: '주변에 시간 지연장을 펼쳐 범위 안 적과 적 탄환을 늦추고 지속 피해' },
  summoner: { id: 'beam', nm: '영혼 사슬', ds: '적을 꿰는 영혼 사슬, 묶인 적은 느려지고 망령에게 받는 피해 +25%' },
  priest: { id: 'orb', nm: '심판의 빛', ds: '체력이 가장 높은 적 위로 빛 기둥이 떨어져 주변 신성 피해' },
};
const form53 = w => { const p = G && G.p, F = p && p.job && FORM53[p.job]; return w && w.base && F && F.id === w.id ? F : null; };
const _wName53 = wName;
wName = function (id) { const w = G && G.p && G.p.weapons.find(x => x.id === id), F = form53(w); return F ? F.nm : _wName53(id); };

/* 군주 · 방패 밀치기 */
function push53(a, R, dmg, kb) {
  const p = G.p, ox = p.x - Math.cos(a) * 34, oy = p.y - Math.sin(a) * 34;   // 밀어내는 기준점을 등 뒤에 두어 앞쪽으로 밀림
  gridQuery(p.x, p.y, R, e => { let da = Math.atan2(e.y - p.y, e.x - p.x) - a; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) <= V53.pushArc / 2 + 0.15) damageEnemy(e, dmg, { src: 'shield', kb, fx: ox, fy: oy }); });
  fx({ kind: 'arc', a, arc: V53.pushArc, r: R, dur: 0.2, color: '#ffe9a8', push53: true });
  S53().push++;
}
const _shield53 = AW_BASE.shield;
AW_BASE.shield = function (w, S) {
  if (!form53(w)) return _shield53(w, S);
  const D = WEAPONS.shield.base, R = D.R * S.area * V53.pushR, a = aimAng(R * 1.3);
  push53(a, R, S.dmg, D.kb);
  if (w.br === 'wall') G.tm.wall = 1.5;
  if (w.br === 'twin') G.later.push({ t: 0.4, f: () => { if (!G.result) push53(a, R * 1.3, S.dmg * 0.9, D.kb * 0.6); } });
};

/* 기술자 · 지뢰 */
const _trap53 = AW_BASE.trap;
AW_BASE.trap = function (w, S) {
  if (!form53(w)) return _trap53(w, S);
  const D = WEAPONS.trap.base, p = G.p, max = D.max + (S.n - 1) * 2, t = nearestEnemy(p.x, p.y, 260);
  const a0 = t ? Math.atan2(t.y - p.y, t.x - p.x) : Math.atan2(p.face.y, p.face.x), d0 = t ? clamp(Math.hypot(t.x - p.x, t.y - p.y) * 0.6, 30, V53.mineReach) : 40;
  for (let i = 0; i < S.n; i++) {
    if (G.traps.length >= max) G.traps.shift();
    const a = a0 + (i - (S.n - 1) / 2) * 0.55;
    G.traps.push({ x: p.x + Math.cos(a) * d0, y: p.y + Math.sin(a) * d0, r: 14, arm: 0.35, engineerBase: true, mine53: true, dmg: S.dmg, R: D.R * S.area * V53.mineR, snare: w.br === 'snare', cluster: w.br === 'cluster' });
    S53().mine++;
  }
};
function mineBlast53(t) { gridQuery(t.x, t.y, t.R, e => { if (!e.boss && !e.cmd) e.slowT = Math.max(e.slowT || 0, V53.mineSlow); }); }

/* 시간술사 · 시간 지연장 (감속 반경 = 지연장 범위) */
const _ice53 = AW_BASE.icering;
AW_BASE.icering = function (w, S) {
  if (!form53(w)) return _ice53(w, S);
  const r = _ice53(w, Object.assign({}, S, { area: S.area * V53.chrArea }));
  V41.chr.R = Math.max(V53.chrR0, w.R || 0);
  return r;
};

/* 소환사 · 영혼 사슬 */
const _beam53 = AW_BASE.beam;
AW_BASE.beam = function (w, S) {
  const r = _beam53(w, S);
  if (r !== false && w.bm && form53(w)) { w.bm.chain53 = true; S53().chain++; }
  return r;
};
function drawChain53(c, p, b, a, fade) {
  const L = b.L * Math.min(1, 0.15 + b.t * 14), n = Math.max(3, Math.floor(L / 14));
  c.save(); c.translate(p.x, p.y); c.rotate(a); c.lineWidth = 2.4; c.strokeStyle = '#b8a0ff'; c.globalAlpha = 0.9 * fade;
  for (let i = 0; i < n; i++) { const x = 12 + i * 14, y = Math.sin(G.time * 18 + i * 0.9) * 2.4 * (i / n); c.beginPath(); c.ellipse(x, y, i % 2 ? 7.5 : 4.5, i % 2 ? 3 : 5, 0, 0, Math.PI * 2); c.stroke(); }
  c.globalAlpha = fade; c.fillStyle = '#ece2ff'; c.beginPath(); c.moveTo(12 + n * 14 + 9, 0); c.lineTo(12 + n * 14 - 3, -6); c.lineTo(12 + n * 14 - 3, 6); c.closePath(); c.fill();
  c.restore();
}

/* 프리스트 · 심판의 빛 */
function judge53(x, y, R, dmg, w, sub) {
  if (G.result) return;
  fx({ kind: 'zap', x, y: y - 170, x2: x, y2: y, dur: 0.22 });
  fx({ kind: 'ring', x, y, r0: R * 0.25, r1: R, dur: 0.26, color: '#fff2a8', fill: true });
  gridQuery(x, y, R, e => damageEnemy(e, dmg, { src: 'mbolt' }));
  S53().judge++;
  if (sub) return;
  if (w.aw === 'sat') for (let i = 1; i <= 2; i++) G.later.push({ t: 0.4 * i, f: () => judge53(x, y, R, dmg * 0.4, w, true) });               // 위성 → 잔광 2회
  if (w.aw === 'split') for (let i = 0; i < 3; i++) { const a = i * 2.1 + rand(0.5); G.later.push({ t: 0.12 + i * 0.06, f: () => judge53(x + Math.cos(a) * R * 1.3, y + Math.sin(a) * R * 1.3, R * 0.6, dmg * 0.35, w, true) }); }   // 분열 → 주변 소형 빛
}
const _orb53 = AW_BASE.orb;
AW_BASE.orb = function (w, S) {
  if (!form53(w)) return _orb53(w, S);
  const p = G.p, ts = enemiesInRange(p.x, p.y, 380).sort((a, b) => b.hp - a.hp); if (!ts.length) return false;
  const R = V53.priR * S.area * (w.br === 'nova' ? 1.35 : 1);
  for (let i = 0; i < S.n; i++) { const e = ts[i % ts.length], x = e.x, y = e.y; G.later.push({ t: i * 0.08, f: () => judge53(x, y, R, S.dmg * V53.priK, w) }); }
};

/* 피해 연계: 영혼 사슬 묶임 · 망령 피해 증가 */
const _damageEnemy53 = damageEnemy;
damageEnemy = function (e, dmg, o) {
  const p = G.p;
  if (p.job === 'summoner' && o) {
    if (o.src === 'beam') { const b = baseW(); if (b && b.id === 'beam') { e.slowT = Math.max(e.slowT || 0, V53.chainSlow); e.soul53 = G.time + V53.chainMark; } }
    else if (o.src === 'minion' && e.soul53 > G.time) dmg *= V53.chainK;
  }
  return _damageEnemy53(e, dmg, o);
};

/* 전직: 기본 무기 변형 안내 · 시련 폐지 · 감속 반경 초기화 */
const _cardInfo53 = cardInfo;
cardInfo = function (c) {
  const r = _cardInfo53(c);
  if (c.t === 'job' && FORM53[c.id]) { const F = FORM53[c.id], t = `\n기본 무기 · ${WEAPONS[F.id].name} → ${F.nm}`; r.ds += t; if (r.full) r.full += t + ' (' + F.ds + ')'; }
  return r;
};

/* ---------- 2차 전직: 숙련 삭제 (2택) ---------- */

/* ---------- 캐릭터 임의 이동 폐지 ---------- */
/* 암살자: 순간 이동 → 그림자 기습 (플레이어는 제자리) */
function rogueTp() {
  const J = J41(), p = G.p, C = V41.rog; if (G.time < J.tpT) return;
  const t = nearestEnemy(p.x, p.y, C.tpR); if (!t) return;
  J.tpT = G.time + C.tp;
  fx({ kind: 'zap', x: p.x, y: p.y, x2: t.x, y2: t.y, dur: 0.14 }); fx({ kind: 'pop', x: t.x, y: t.y, r: 16, color: '#203040', dur: 0.25 });
  damageEnemy(t, (V53.shadowD + p.level * V53.shadowLv) * p.mod.dmg, { src: 'shadow53' });
  G.stats.tps = (G.stats.tps || 0) + 1; S53().shadow++;
}
SRC44.shadow53 = '그림자 기습'; SRC_CAT.shadow53 = 'ranged';
{ const o = JOB2.rogue.find(x => x.k === 'assassin'); if (o) o.ds = '치명타 피해 3배, 처치 시 그림자가 가까운 적을 기습(2초 재사용)'; }
/* 전사 연성 방패 돌격 → 방패 강타 (제자리에서 전방 들이받기) */
FU44.warrior.shield.f = function (Z) {
  const p = G.p, a = angTo(p.x, p.y, 260); startWarriorShieldArt(a);
  later44(0.1, () => { if (hitC(p.x + Math.cos(a) * 46, p.y + Math.sin(a) * 46, 78 * Z.a, Z.d(32), Z.src, { kb: 320, col: Z.col, warArt: 'shield', warAngle: a })) p.fury = Math.min(100, (p.fury || 0) + 8); G.tm.wall = Math.max(G.tm.wall || 0, 0.8); });
};
function reword53(j, id, f) {
  const row = F44[j].find(r => r[0] === id), M = F44M[j][id]; if (!row || !M) return;
  for (const i of [1, 2, 3]) row[i] = f(row[i]);
  M.nm = row[1]; M.ds = row[2]; M.num = row[3]; SRC44[fsrc(j, id)] = row[1];
}
reword53('warrior', 'shield', s => s.replace('방패 돌격', '방패 강타').replace('방패를 들고 전방 80 돌진해 들이받아 밀침, 돌진 직후', '방패를 앞으로 내질러 전방 적을 들이받아 밀침, 직후').replace('돌격 32', '강타 32'));
/* 직업형 기본 무기에 맞춘 연성 문구 (동작은 0.44 유지) */
for (const r of F44.summoner.slice()) reword53('summoner', r[0], s => s.replace(/광선/g, '사슬'));
for (const r of F44.priest.slice()) reword53('priest', r[0], s => s.replace(/구체/g, '빛'));

/* ---------- 직업 격차 보정 ---------- */
/* 기술자: 포탑 주변 감속 구역 */
const _chronoSlow53 = chronoSlow;
chronoSlow = function (e) {
  let k = _chronoSlow53(e);
  if (G.p.job === 'engineer' && !e.gk && !e.boss && G.turrets.length) for (const t of G.turrets) if (dist2(e.x, e.y, t.x, t.y) < V53.engR * V53.engR) { k *= V53.engSlow; S53().slowE++; break; }
  return k;
};
const _drawJobAura53 = drawJobAura;
drawJobAura = function (c) {
  if (G.p.job === 'engineer') for (const t of G.turrets) {                       // 감속 구역: 테두리 선 없이 가장자리만 옅게
    const g = c.createRadialGradient(t.x, t.y, V53.engR * 0.55, t.x, t.y, V53.engR);
    g.addColorStop(0, 'rgba(224,168,106,0)'); g.addColorStop(0.85, 'rgba(224,168,106,0.13)'); g.addColorStop(1, 'rgba(224,168,106,0)');
    c.fillStyle = g; c.beginPath(); c.arc(t.x, t.y, V53.engR, 0, Math.PI * 2); c.fill();
  }
  return _drawJobAura53.apply(this, arguments);
};
/* 군주: 군기 안 경험치 배율 삭제 (선택지 4장·피해·피해 감소는 유지) */
V41.sov.xp = 1;
/* 설명 문구 */
JOBS.sovereign.rule = JOBS.sovereign.rule.replace('군기 안 경험치 1.3배·피해 +25%', '군기 안 피해 +25%');
JOBS.mage.rule = JOBS.mage.rule.replace('무기 개별 발동 폐지, ', '기본 무기만 평소대로 발동, 나머지 무기는 ');
JOBS.engineer.rule += ', 포탑 주변 적 감속';
JOBS.chrono.rule = JOBS.chrono.rule.replace('주변 반경 안', '시간 지연장 안');
