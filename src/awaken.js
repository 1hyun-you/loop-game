/* ============================================================
   전직 무기 변환 규칙형 · 무기 6레벨 각성 (0.38, 표현·보강 단계)
   — 회차 35 결정(2026-11-05): 전용 무기·효과 폐지, 직업별 변환 규칙을 같은 계열 공용 무기에 적용 (보조 효과 제외)
   — 회차 43 확정(2026-11-06): 변환 규칙 10종 · 각성 공통형 무기당 2종(18종 × 2 = 36종)
   — 구현 방식: 기존 함수 감싸기(발동·피해·피격·투사체·처치), 원본 함수 수정 최소화
   ============================================================ */
const AWAKEN_AT = 6;
const AWAKEN = {
  cleave: [{ k: 'wave', nm: '검기 사출', ds: '베기마다 검기 1발 직진 (관통, 피해 60%)' }, { k: 'exec', nm: '처형', ds: '베기에 맞은 체력 30% 이하 잡몹 즉시 처치 (정예·보스 제외)' }],
  spin: [{ k: 'burst', nm: '검무 확산', ds: '2.5초마다 칼날 위치에서 바깥으로 관통 검기 사출 (피해 80%)' }, { k: 'wall', nm: '칼날 방벽', ds: '칼날에 닿은 적 탄환 소멸' }],
  shield: [{ k: 'chain', nm: '충돌 연쇄', ds: '밀려난 적이 0.3초 뒤 주변 적과 충돌 (피해 55%)' }, { k: 'counter', nm: '반격 태세', ds: '충격 후 1초간 피격 1회 무효, 무효 시 충격 재발동' }],
  slam: [{ k: 'ripple', nm: '3겹 확산', ds: '0.2초 간격 바깥 충격파 2회 추가 (범위 130·160%, 피해 35%)' }, { k: 'grav', nm: '중력장', ds: '충격 직전 범위 1.6배 안 적을 중심으로 끌어당김, 충격 피해 +25%' }],
  lance: [{ k: 'charge', nm: '돌격 창', ds: '찌르기 방향 60 돌진·0.3초 무적, 찌르기 피해 +30%' }, { k: 'rapid', nm: '연속 찌르기', ds: '0.12초 간격 2회 추가 찌르기 (피해 40%)' }],
  flail: [{ k: 'cent', nm: '원심력', ds: '휘두를 때마다 피해 +10% (최대 5중첩), 피격 시 초기화' }, { k: 'bind', nm: '사슬 포박', ds: '맞은 적 1초 속박 + 플레이어 쪽으로 끌어옴 (보스 제외)' }],
  arrow: [{ k: 'rain', nm: '화살비', ds: '5회 발사마다 주변 적 6체에 화살 낙하 (피해 60%)' }, { k: 'snipe', nm: '저격', ds: '사거리 2배, 거리 비례 피해 최대 +80%' }],
  boomerang: [{ k: 'heavy', nm: '분쇄 도끼', ds: '도끼 크기 1.5배, 구간별 타격 수 +3' }, { k: 'orbit', nm: '궤도 도끼', ds: '던지는 대신 주위 반경 90을 2바퀴 선회' }],
  knife: [{ k: 'storm', nm: '단검 폭풍', ds: '발사 시 15% 확률 사방 8연발 추가' }, { k: 'venom', nm: '맹독', ds: '명중 시 독 누적, 8중첩 시 독 폭발 (피해 150%)' }],
  trap: [{ k: 'chain', nm: '연쇄 기폭', ds: '폭발 범위 안 다른 덫 즉시 기폭' }, { k: 'lure', nm: '미끼 덫', ds: '설치 시 반경 150 안 적을 덫 쪽으로 끌어당김 (보스 제외)' }],
  shuriken: [{ k: 'ret', nm: '귀환 수리검', ds: '튕김 종료 시 플레이어에게 되돌아오며 재타격 (피해 70%)' }, { k: 'big', nm: '대형 수리검', ds: '크기 2배, 튕김 대신 무제한 관통' }],
  bomb: [{ k: 'chain', nm: '연쇄 폭발', ds: '폭탄으로 처치한 적 자리에서 재폭발 (피해 50%)' }, { k: 'stick', nm: '부착 폭탄', ds: '투척 대신 밀집 적에 즉시 부착, 1초 뒤 폭발 (피해 130%)' }],
  fireball: [{ k: 'meteor', nm: '유성', ds: '4회 발사마다 밀집 지점에 대형 유성 (0.6초 예고, 피해 250%)' }, { k: 'shard', nm: '화염 파편', ds: '폭발 시 화염 파편 6방향 (피해 50%, 관통 1)' }],
  lightning: [{ k: 'cloud', nm: '뇌운', ds: '머리 위 뇌운이 1.2초마다 가까운 적에게 낙뢰 (피해 70%)' }, { k: 'over', nm: '과충전', ds: '같은 적 2회 명중 시 감전 폭발 (피해 180%)' }],
  icering: [{ k: 'zero', nm: '절대 영도', ds: '빙결 확률 20%, 빙결된 적이 받는 냉기 고리 피해 2배' }, { k: 'armor', nm: '서리 갑옷', ds: '고리 안 적의 접촉 피해 -25%' }],
  orb: [{ k: 'sat', nm: '위성 구체', ds: '0.8초간 주위 궤도 선회 후 사출, 피해 +20%' }, { k: 'split', nm: '분열 구체', ds: '명중 시 소형 구체 3개 분열 (피해 35%)' }],
  beam: [{ k: 'focus', nm: '집광', ds: '지속 중 피해 점증 (끝에서 2배)' }, { k: 'refract', nm: '굴절', ds: '광선 끝에서 가장 가까운 적에게 꺾인 광선 (피해 60%)' }],
  vortex: [{ k: 'merge', nm: '대회오리', ds: '여러 회오리를 하나로 합쳐 생성 (크기 1.6배, 피해 합산 +10%, 1개일 때 +30%)' }, { k: 'blade', nm: '진공 칼날', ds: '회오리가 0.6초마다 가까운 적에게 칼바람 사출 (피해 120%)' }],
};
Object.assign(SRC_CAT, { spin_aw: 'melee', cleave_aw: 'melee', shield_aw: 'melee', arrow_aw: 'ranged', knife_aw: 'ranged', shuriken_aw: 'ranged', bomb_aw: 'ranged', fireball_aw: 'magic', lightning_aw: 'magic', mbolt_aw: 'magic', beam_aw: 'magic', vortex_aw: 'magic' });
Object.assign(RANGED_SRC, { arrow_aw: 1, knife_aw: 1, shuriken_aw: 1, bomb_aw: 1 });
Object.assign(ELEM, { fireball_aw: 'fire', lightning_aw: 'bolt', mbolt_aw: 'arcane', beam_aw: 'arcane' });
const wObj = id => G.p.weapons.find(x => x.id === id);
const wAw = id => { const w = wObj(id); return w && w.aw; };
const awNm = (id, k) => { const o = k && AWAKEN[id] && AWAKEN[id].find(x => x.k === k); return o ? o.nm : ''; };
const awOk = e => !e.boss && !e.gk && !e.cmd;              // 보스·수문장·대장 제외 판정

/* ---------- 전직 변환 규칙 (기존 확률 발동형 대체) ---------- */
Object.assign(JOB_WX, {
  warrior: { pre: '투지의', ds: '투지 비례 범위 확대 (최대 +30%), 명중 시 투지 +1' },
  rogue: { pre: '그림자', ds: '발동 0.25초 뒤 그림자가 같은 공격 재현 (피해 40%), 회전검·사슬 철퇴는 피해 +20%' },
  sovereign: { pre: '왕실', ds: '명중 적에 복종 표식 3초, 표식 적의 접촉 피해 -30%' },
  archer: { pre: '사냥꾼의', ds: '투사체 소멸 시 가까운 적으로 1회 재조준' },
  engineer: { pre: '개조', ds: '3회 발동마다 포탑 위치에서 같은 공격 1회' },
  chrono: { pre: '시간', ds: '시간 지연 2배 누적, 정지된 적에게 피해 +30%' },
  mage: { pre: '원소', ds: '속성이 1.5초마다 화염·냉기·번개 순환 (원소 반응 단독 유발)' },
  summoner: { pre: '영혼', ds: '망령 1체당 피해 +4% (최대 24%)' },
  priest: { pre: '신성', ds: '조준 대상 체력 높은 적 우선, 처치 시 정화 누적 +1' },
  druid: { pre: '야생', ds: '명중 시 동료 기술 재사용 -0.2초 (초당 최대 1초)' },
});
jobWeaponHit = function (e, o) {
  const p = G.p, j = p.job, src = o.src;
  if (e.dead || !wxSrc(src)) return;
  if (j === 'warrior') { p.fury = Math.min(100, p.fury + 1); G.tm.furyHold = Math.max(G.tm.furyHold || 0, 1); }
  if (j === 'sovereign') e.sub = G.time + 3;
  if (j === 'chrono' && RANGED_SRC[src] && !e.boss) { e.tw = (e.tw || 0) + 1; e.slowT = Math.max(e.slowT || 0, 1); if (e.tw >= 5 && !e.cmd) { e.tw = 0; e.frz = 1.5; } }
  if (j === 'druid' && G.pets && G.pets.length && !(G.awDruT > G.time)) { G.awDruT = G.time + 0.2; for (const m of G.pets) m.sk -= 0.2; }
};
jobWeaponKill = function (e) {
  const p = G.p; if (!wxSrc(e.ls)) return;
  if (p.job === 'priest') p.holy++;
};
const _jobDmgMul = jobDmgMul;
jobDmgMul = function (e, o) {
  let m = _jobDmgMul(e, o); const p = G.p;
  if (p.job && wxSrc(o.src)) {
    if (p.job === 'chrono' && e.frz > 0) m *= 1.3;
    if (p.job === 'summoner') m *= 1 + 0.04 * Math.min(6, G.minions.length);
  }
  return m;
};
const _onEnemyHit = onEnemyHit;
onEnemyHit = function (e, o) {
  const p = G.p, src = o.src;
  if (p.job === 'mage' && ELEM[src] && wxSrc(src) && !G.wxOff) { const old = ELEM[src]; ELEM[src] = ['fire', 'ice', 'bolt'][Math.floor(G.time / 1.5) % 3]; try { _onEnemyHit(e, o); } finally { ELEM[src] = old; } return; }
  _onEnemyHit(e, o);
};
/* 프리스트 변환: 조준 함수가 체력 높은 적 우선 */
const _nearestEnemy = nearestEnemy;
nearestEnemy = function (x, y, maxR = 600) {
  if (!G.aimHi) return _nearestEnemy(x, y, maxR);
  let best = null, bh = -1; const r2 = maxR * maxR;
  for (const e of G.enemies) { if (e.dead || dist2(x, y, e.x, e.y) > r2) continue; if (e.hp > bh) { bh = e.hp; best = e; } }
  return best;
};

/* ---------- 각성 대기열 (분기 화면 재사용) ---------- */
const _checkBranch = checkBranch;
checkBranch = function (kind, id) {
  _checkBranch(kind, id);
  if (kind !== 'w' || !AWAKEN[id]) return;
  const w = wObj(id);
  if (w && w.lvl >= AWAKEN_AT && !w.aw && !w.awQ) { w.awQ = true; G.pendingBr.push({ kind: 'w', id, aw: true }); }
};
const _openBranch = openBranch;
openBranch = function () {
  const q = G.pendingBr[0];
  if (!q || !q.aw) return _openBranch();
  G.pendingBr.shift(); STATE.mode = 'select'; clearInput();
  G.sel = { kind: 'branch', q, cards: AWAKEN[q.id].map(o => ({ t: 'branch', id: q.id, k: o.k, kind: 'w', aw: true })), banish: false };
  renderSelect(); autoLater();
};
const _applyBranch = applyBranch;
applyBranch = function (c) {
  if (!c.aw) return _applyBranch(c);
  const w = wObj(c.id); w.aw = c.k; G.stats.branches.push(c.id + ':aw:' + c.k);
  const col = CFG.colors[WEAPONS[c.id].cat];
  banner('무기 각성', `${WEAPONS[c.id].name} · ${awNm(c.id, c.k)}`, col, 1.8); sfx('ult');
  fx({ kind: 'ring', x: G.p.x, y: G.p.y, r0: 10, r1: 120, dur: 0.6, color: col, follow: true });
  recalc();
};

/* ---------- 수치 보정 ---------- */
const _wStats = wStats;
wStats = function (w) {
  const S = _wStats(w), p = G.p, D = WEAPONS[w.id];
  if (p.job === 'warrior' && D.cat === 'melee' && wxOn('melee')) S.area *= 1 + 0.3 * (p.fury || 0) / 100;
  if (p.job === 'rogue' && wxOn('melee') && (w.id === 'spin' || w.id === 'flail')) S.dmg *= 1.2;
  if (w.aw === 'cent') S.dmg *= 1 + 0.1 * (w.cent || 0);
  if (w.id === 'lance' && w.aw === 'charge') S.dmg *= 1.3;
  if (w.id === 'slam' && w.aw === 'grav') S.dmg *= 1.25;
  if (w.id === 'boomerang' && w.aw === 'heavy') { S.area *= 1.5; S.pierce += 3; }
  if (w.id === 'orb' && w.aw === 'sat') S.dmg *= 1.2;
  return S;
};

/* ---------- 발동 감싸기: 각성 전후 처리 · 도적·엔지니어·프리스트 변환 ---------- */
const AW_BASE = {};
for (const id of Object.keys(WEAPON_FIRE)) { AW_BASE[id] = WEAPON_FIRE[id]; WEAPON_FIRE[id] = function (w, S) { return awFire(id, w, S); }; }
function densest(x, y, R) {
  const c = shuffle(enemiesInRange(x, y, R)).slice(0, 12); if (!c.length) return null;
  return c.map(e => { let n = 0; gridQuery(e.x, e.y, 70, () => { n++; }); return [n, e]; }).sort((a, b) => b[0] - a[0])[0][1];
}
function awPull(x, y, R, k) { gridQuery(x, y, R, e => { if (!awOk(e) || e.fixed) return; const dx = x - e.x, dy = y - e.y, d = Math.hypot(dx, dy) || 1; if (d > 20) { e.x += dx * k; e.y += dy * k; } }); }
function awFire(id, w, S) {
  const f = AW_BASE[id], p = G.p, cat = WEAPONS[id].cat, conv = wxOn(cat), aw = w.aw;
  // 발동 전
  if (id === 'bomb' && aw === 'stick') return stickBomb(w, S);
  if (id === 'slam' && aw === 'grav') { awPull(p.x, p.y, WEAPONS.slam.base.R * S.area * 1.6, 0.6); fx({ kind: 'ring', x: p.x, y: p.y, r0: WEAPONS.slam.base.R * S.area * 1.6, r1: 20, dur: 0.25, color: '#c8a8ff' }); }
  const la = id === 'lance' || id === 'cleave' ? aimAng(WEAPONS[id].base.range * S.area * 1.4) : 0;
  const n0 = G.proj.length, v0 = new Set(G.vortex || []);
  G.aimHi = p.job === 'priest' && conv && cat === 'magic';
  let r; try { r = f(w, S); } finally { G.aimHi = false; }
  if (r === false) return r;
  const nw = G.proj.slice(n0);
  // 발동 후 — 각성
  if (aw) awPost(id, w, S, aw, nw, la, v0);
  // 발동 후 — 변환
  if (conv && p.job === 'rogue' && cat === 'melee' && id !== 'flail' && id !== 'beam') { const S2 = Object.assign({}, S, { dmg: S.dmg * 0.4 }); G.later.push({ t: 0.25, f: () => { if (!G.result) { fx({ kind: 'pop', x: G.p.x, y: G.p.y, r: 14, color: '#203040', dur: 0.2 }); AW_BASE[id](w, S2); } } }); }
  if (conv && p.job === 'engineer' && cat === 'ranged' && G.turrets && G.turrets.length) {
    w.engC = (w.engC || 0) + 1;
    if (w.engC >= 3) { w.engC = 0; const t = pick(G.turrets), ox = p.x, oy = p.y; p.x = t.x; p.y = t.y; try { AW_BASE[id](w, S); } finally { p.x = ox; p.y = oy; } fx({ kind: 'ring', x: t.x, y: t.y, r0: 4, r1: 22, dur: 0.25, color: '#ffd890' }); }
  }
  return r;
}
function awPost(id, w, S, aw, nw, la, v0) {
  const p = G.p, col = jobTint(WEAPONS[id].cat) || CFG.colors[WEAPONS[id].cat];
  switch (id + ':' + aw) {
    case 'cleave:wave': shoot({ kind: 'arrow', x: p.x, y: p.y, ang: la, sp: 520, r: 10, dmg: S.dmg * 0.6, pierce: 99, life: 0.55, color: '#ffe8d8', src: 'cleave_aw', wind: true }); break;
    case 'shield:chain': {
      const R = WEAPONS.shield.base.R * S.area, list = enemiesInRange(p.x, p.y, R).filter(awOk).slice(0, 30), key = 'sc' + (++G.pid), dm = S.dmg * 0.55;
      G.later.push({ t: 0.3, f: () => { for (const e of list) if (!e.dead) gridQuery(e.x, e.y, e.r + 16, o => { if (o !== e && !o.ht[key]) { o.ht[key] = 1; damageEnemy(o, dm, { src: 'shield_aw' }); } }); } });
      break;
    }
    case 'shield:counter': G.awCtrT = G.time + 1; break;
    case 'slam:ripple': { const R = WEAPONS.slam.base.R * S.area, x = p.x, y = p.y, kb = WEAPONS.slam.base.kb * 0.5; G.later.push({ t: 0.2, f: () => slamWave(x, y, R * 1.3, S.dmg * 0.35, kb) }, { t: 0.4, f: () => slamWave(x, y, R * 1.6, S.dmg * 0.35, kb) }); break; }
    case 'lance:charge': { p.x += Math.cos(la) * 60; p.y += Math.sin(la) * 60; p.invT = Math.max(p.invT, 0.3); fx({ kind: 'ring', x: p.x, y: p.y, r0: 6, r1: 30, dur: 0.2, color: col }); break; }
    case 'lance:rapid': { const S2 = Object.assign({}, S, { dmg: S.dmg * 0.4 }); G.later.push({ t: 0.12, f: () => AW_BASE.lance(w, S2) }, { t: 0.24, f: () => AW_BASE.lance(w, S2) }); break; }
    case 'flail:cent': w.cent = Math.min(5, (w.cent || 0) + 1); break;
    case 'arrow:rain': w.rc = (w.rc || 0) + 1; if (w.rc % 5 === 0) { const ts = shuffle(enemiesInRange(p.x, p.y, 360)).slice(0, 6); ts.forEach((e, i) => { const x = e.x, y = e.y; fx({ kind: 'ring', x, y, r0: 28, r1: 6, dur: 0.25, color: '#d8ffc8' }); G.later.push({ t: 0.25 + i * 0.05, f: () => explode(x, y, 28, S.dmg * 0.6, 'arrow_aw', '#d8ffc8') }); }); } break;
    case 'arrow:snipe': for (const pr of nw) pr.life *= 2; break;
    case 'boomerang:orbit': nw.forEach((pr, i) => { if (pr.kind === 'boom') { pr.orb = { a: i * Math.PI * 2 / Math.max(1, nw.length), t: 0 }; pr.vx = pr.vy = 0; pr.life = 9; } }); break;
    case 'knife:storm': if (Math.random() < 0.15) { const D = WEAPONS.knife.base; for (let i = 0; i < 8; i++) shoot({ kind: 'arrow', x: p.x, y: p.y, ang: i * Math.PI / 4, sp: D.sp, r: 4, dmg: S.dmg, pierce: S.pierce, life: D.life, color: '#e6e8f8', src: 'knife' }); } break;
    case 'trap:lure': { const t = G.traps[G.traps.length - 1]; if (t) { awPull(t.x, t.y, 150, 0.5); fx({ kind: 'ring', x: t.x, y: t.y, r0: 150, r1: 14, dur: 0.35, color: '#e0c070' }); } break; }
    case 'shuriken:ret': for (const pr of nw) if (pr.kind === 'star') pr.awRet = true; break;
    case 'shuriken:big': for (const pr of nw) if (pr.kind === 'star') { pr.r *= 2; pr.bounce = false; pr.pierce = 99; pr.scat = false; } break;
    case 'fireball:meteor': w.mc = (w.mc || 0) + 1; if (w.mc % 4 === 0) { const e = densest(p.x, p.y, 400); if (e) { const x = e.x, y = e.y, R = 90 * S.area; fx({ kind: 'ring', x, y, r0: R, r1: R * 0.2, dur: 0.6, color: '#ff6a3a' }); G.later.push({ t: 0.6, f: () => { explode(x, y, R, S.dmg * 2.5, 'fireball_aw', '#ff7a3a'); shake(2.5, 0.2); } }); } } break;
    case 'icering:zero': { const R = WEAPONS.icering.base.R * S.area; gridQuery(p.x, p.y, R, e => { if (awOk(e) && !e.elite && Math.random() < (w.br === 'freeze' ? 0.14 : 0.2)) e.frz = Math.max(e.frz || 0, 1); }); break; }
    case 'icering:armor': { const R = WEAPONS.icering.base.R * S.area; gridQuery(p.x, p.y, R, e => { e.chill = G.time + 0.7; }); break; }
    case 'orb:sat': nw.forEach((pr, i) => { if (pr.kind === 'orb') { pr.sat = { a: i * Math.PI * 2 / Math.max(1, nw.length), t: 0 }; pr.home = false; pr.life += 0.8; pr.vx = pr.vy = 0; } }); break;
    case 'vortex:merge': {
      const nv = (G.vortex || []).filter(v => !v0.has(v)); if (!nv.length) break;
      const m = nv[0], sum = nv.reduce((x, v) => x + v.dmg, 0);
      m.dmg = sum * (nv.length > 1 ? 1.1 : 1.3); m.R *= 1.6; m.big = true;
      for (const v of nv.slice(1)) v.dead = true;
      fx({ kind: 'ring', x: m.x, y: m.y, r0: m.R * 0.4, r1: m.R * 1.5, dur: 0.35, color: '#c8f0ff' });
      G.vortex = G.vortex.filter(v => !v.dead); break;
    }
    case 'vortex:blade': for (const v of G.vortex || []) if (!v0.has(v)) v.blade = 0.6; break;
  }
}
/* 부착 폭탄: 밀집 적에 즉시 부착, 1초 뒤 해당 적 위치에서 폭발 (분기 효과는 기존 착탄 처리 재사용) */
function stickBomb(w, S) {
  const D = WEAPONS.bomb.base, p = G.p, cand = shuffle(enemiesInRange(p.x, p.y, 320)).slice(0, 10);
  if (!cand.length) return false;
  if (!G.bombs) G.bombs = [];
  const sc = cand.map(e => { let n = 0; gridQuery(e.x, e.y, 60, () => { n++; }); return [n, e]; }).sort((a, b) => b[0] - a[0]);
  for (let i = 0; i < S.n; i++) {
    const e = (sc[i] || sc[0])[1]; let lx = e.x, ly = e.y;
    (G.sticks || (G.sticks = [])).push({ e, t: 1 });
    G.later.push({ t: 1.0, f: () => { if (!e.dead) { lx = e.x; ly = e.y; } G.bombs.push({ x0: lx, y0: ly, x: lx, y: ly, t: 0, fly: 0, R: D.R * S.area, dmg: S.dmg * 1.3, br: w.br }); } });
    G.later.push({ t: 0.5, f: () => { if (!e.dead) { lx = e.x; ly = e.y; } } });
  }
}

/* ---------- 피해 감싸기 ---------- */
const _damageEnemy = damageEnemy;
damageEnemy = function (e, dmg, o = {}) {
  if (e.dead) return;
  const src = o.src, p = G.p;
  if (src === 'arrow' && wAw('arrow') === 'snipe') dmg *= 1 + Math.min(0.8, Math.sqrt(dist2(e.x, e.y, p.x, p.y)) / 450 * 0.8);
  if (src === 'beam' && wAw('beam') === 'focus') { const w = wObj('beam'); if (w && w.bm) dmg *= 1 + Math.min(1, w.bm.t / w.bm.dur); }
  if (src === 'icering' && e.frz > 0 && wAw('icering') === 'zero') dmg *= 2;
  _damageEnemy(e, dmg, o);
  if (e.dead) return;
  if (src === 'cleave' && wAw('cleave') === 'exec' && awOk(e) && !e.elite && e.mhp && e.hp <= e.mhp * 0.3) { G.stats.dmg.cleave = (G.stats.dmg.cleave || 0) + Math.max(0, e.hp); e.hp = 0; fx({ kind: 'pop', x: e.x, y: e.y, r: e.r + 6, color: '#ff4a4a', dur: 0.25 }); killEnemy(e); return; }
  if (src === 'flail' && wAw('flail') === 'bind' && awOk(e)) { e.frz = Math.max(e.frz || 0, 1); const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1; if (d > 40) { e.x += dx / d * Math.min(40, d - 30); e.y += dy / d * Math.min(40, d - 30); } }
  if (src === 'knife' && wAw('knife') === 'venom') { e.psn = (e.psn || 0) + 1; if (e.psn >= 8) { e.psn = 0; const x = e.x, y = e.y, d = wStats(wObj('knife')).dmg * 1.5; G.later.push({ t: 0, f: () => explode(x, y, 40, d, 'knife_aw', '#9fe870') }); } }
  if (src === 'lightning' && wAw('lightning') === 'over') { e.lc = (e.lc || 0) + 1; if (e.lc >= 2) { e.lc = 0; const x = e.x, y = e.y, d = wStats(wObj('lightning')).dmg * 1.8; fx({ kind: 'bolt', x, y, dur: 0.2 }); G.later.push({ t: 0, f: () => explode(x, y, 50, d, 'lightning_aw', '#bfe4ff') }); } }
  if (src === 'mbolt' && wAw('orb') === 'split' && G.proj.length < 340) { const d = dmg * 0.35; for (let i = 0; i < 3; i++) shoot({ kind: 'orb', x: e.x, y: e.y, ang: rand(Math.PI * 2), sp: 260, r: 4, dmg: d, pierce: 0, life: 1, color: '#c8d4ff', src: 'mbolt_aw', home: true }).hits.add(e.id); }
};
const _killEnemy = killEnemy;
killEnemy = function (e) {
  _killEnemy(e);
  if ((e.ls === 'bomb' || e.ls === 'bomb_c') && wAw('bomb') === 'chain') { const x = e.x, y = e.y, d = wStats(wObj('bomb')).dmg * 0.5; G.later.push({ t: 0.12, f: () => explode(x, y, 40, d, 'bomb_aw', '#ffc070') }); }
};
const _explode = explode;
explode = function (x, y, R, dmg, src, color) {
  _explode(x, y, R, dmg, src, color);
  if (src === 'fireball' && wAw('fireball') === 'shard') { const a0 = rand(Math.PI); for (let i = 0; i < 6; i++) shoot({ kind: 'arrow', x, y, ang: a0 + i * Math.PI / 3, sp: 380, r: 5, dmg: dmg * 0.5, pierce: 1, life: 0.45, color: '#ffb060', src: 'fireball_aw' }); }
  if (src === 'trap' && wAw('trap') === 'chain') for (const t of G.traps) if (!t.dead && t.arm <= 0.4 && dist2(t.x, t.y, x, y) < R * R) { t.dead = true; G.later.push({ t: 0.08, f: () => explode(t.x, t.y, t.R, t.dmg, 'trap', '#e0c070') }); }
};

/* ---------- 피격 감싸기: 복종 표식·서리 갑옷·반격 태세·원심력 초기화 ---------- */
const _hurtPlayer = hurtPlayer;
hurtPlayer = function (dmg, src, e) {
  const p = G.p;
  if (p.invT > 0 || STATE.dev.god || G.result) return;
  if (e) { if (e.sub > G.time) dmg *= 0.7; if (e.chill > G.time) dmg *= 0.75; }
  if (G.awCtrT > G.time && wAw('shield') === 'counter') {
    G.awCtrT = 0; p.invT = 0.4; const w = wObj('shield'), S = wStats(w);
    AW_BASE.shield(w, S); fx({ kind: 'ring', x: p.x, y: p.y, r0: 10, r1: 70, dur: 0.3, color: '#ffffff', follow: true }); toast('반격', '#c8d8ff'); return;
  }
  const h0 = p.hp; _hurtPlayer(dmg, src);
  if (p.hp < h0) for (const w of p.weapons) if (w.cent) w.cent = 0;
};

/* ---------- 투사체 감싸기: 궤도 도끼·위성 구체·귀환 수리검·궁수 재조준 ---------- */
const _updateProjectiles = updateProjectiles;
updateProjectiles = function (dt) {
  const p = G.p, watch = [];
  for (const pr of G.proj) {
    if (pr.dead) continue;
    if (pr.orb) {                                            // 궤도 도끼: 1.6초 2바퀴
      const o = pr.orb; o.t += dt; if (o.t >= 1.6) { pr.dead = true; continue; }
      const a = o.a + o.t * Math.PI * 4 / 1.6, half = o.t >= 0.8;
      pr.x = p.x + Math.cos(a) * 90; pr.y = p.y + Math.sin(a) * 90; pr.vx = pr.vy = 0; pr.t = 0.2;
      if (half && !o.h2) { o.h2 = true; pr.id = ++G.pid; pr.ho = 0; }   // 둘째 바퀴 적별 재타격 허용
    }
    if (pr.sat) {                                            // 위성 구체: 0.8초 선회 후 사출
      const s = pr.sat; s.t += dt;
      if (s.t < 0.8) { const a = s.a + s.t * 7; pr.x = p.x + Math.cos(a) * 46; pr.y = p.y + Math.sin(a) * 46; pr.vx = pr.vy = 0; }
      else { delete pr.sat; pr.home = true; const t = _nearestEnemy(pr.x, pr.y, 320), a = t ? Math.atan2(t.y - pr.y, t.x - pr.x) : rand(Math.PI * 2); pr.vx = Math.cos(a) * 320; pr.vy = Math.sin(a) * 320; }
    }
    if (pr.awRet && !pr.back) watch.push(pr);
    else if (p.job === 'archer' && !pr.rt && pr.kind !== 'boom' && pr.kind !== 'shell' && wxSrc(pr.src)) watch.push(pr);
  }
  _updateProjectiles(dt);
  for (const pr of watch) {
    if (!pr.dead || G.proj.length > 380) continue;
    if (pr.awRet && !pr.rtDone) {
      pr.rtDone = true; const d = Math.sqrt(dist2(pr.x, pr.y, p.x, p.y)) || 1, a = Math.atan2(p.y - pr.y, p.x - pr.x);
      shoot({ kind: 'star', x: pr.x, y: pr.y, ang: a, sp: 520, r: pr.r, dmg: pr.dmg * 0.7, pierce: 99, life: Math.min(1.2, d / 520), color: '#e8ecff', src: 'shuriken_aw', back: true });
    } else if (!pr.awRet) {
      let best = null, bd = 260 * 260;
      gridQuery(pr.x, pr.y, 260, t => { if (t.dead || pr.hits.has(t.id)) return; const d = dist2(t.x, t.y, pr.x, pr.y); if (d < bd) { bd = d; best = t; } });
      if (!best) continue;
      const s2 = shoot({ kind: pr.kind, x: pr.x, y: pr.y, ang: Math.atan2(best.y - pr.y, best.x - pr.x), sp: Math.max(380, Math.hypot(pr.vx, pr.vy)), r: pr.r, dmg: pr.dmg, pierce: 0, life: 0.6, color: pr.color, src: pr.src, rt: true });
      for (const id of pr.hits) s2.hits.add(id);
    }
  }
};

/* ---------- 회전검 칼날 방벽 · 뇌운 · 굴절 · 진공 칼날 ---------- */
const _updateSpin = updateSpin;
updateSpin = function (w, S, dt) {
  _updateSpin(w, S, dt);
  const p = G.p;
  if (w.aw === 'burst') { w.bt = (w.bt == null ? 2.5 : w.bt) - dt; if (w.bt <= 0) { w.bt = 2.5; for (let i = 0; i < w.n; i++) { const a = w.a + i * Math.PI * 2 / w.n; shoot({ kind: 'arrow', x: p.x + Math.cos(a) * w.R, y: p.y + Math.sin(a) * w.R, ang: a, sp: 460, r: 9, dmg: S.dmg * 0.8, pierce: 99, life: 0.5, color: '#ffe8d8', src: 'spin_aw', wind: true }); } } }
  if (w.aw !== 'wall' || !G.eb || !G.eb.length) return;
  for (let i = 0; i < w.n; i++) {
    const a = w.a + i * Math.PI * 2 / w.n, bx = p.x + Math.cos(a) * w.R, by = p.y + Math.sin(a) * w.R;
    for (const b of G.eb) if (b.life > 0 && dist2(b.x, b.y, bx, by) < (w.bs + (b.r || 6)) ** 2) { b.life = 0; fx({ kind: 'pop', x: b.x, y: b.y, r: 6, color: '#ffffff', dur: 0.15 }); }
  }
};
const _updateArsenal = updateArsenal;
updateArsenal = function (dt) {
  _updateArsenal(dt);
  const p = G.p;
  const wl = wObj('lightning');
  if (wl && wl.aw === 'cloud') {
    G.awCloud = (G.awCloud == null ? 1.2 : G.awCloud) - dt;
    if (G.awCloud <= 0) { G.awCloud = 1.2; const t = _nearestEnemy(p.x, p.y - 40, 240); if (t) { fx({ kind: 'bolt', x: t.x, y: t.y, dur: 0.18 }); damageEnemy(t, wStats(wl).dmg * 0.7, { src: 'lightning_aw' }); } }
  }
  const wb = wObj('beam');
  if (wb && wb.aw === 'refract' && wb.bm) {
    const b = wb.bm; b.rf = (b.rf || 0) - dt;
    if (b.rf <= 0) {
      b.rf = WEAPONS.beam.base.tick; const ex = p.x + Math.cos(b.a) * b.L, ey = p.y + Math.sin(b.a) * b.L, t = _nearestEnemy(ex, ey, 220);
      if (t) { const a2 = Math.atan2(t.y - ey, t.x - ex), L2 = Math.sqrt(dist2(t.x, t.y, ex, ey)) + 40; lineHit(ex, ey, a2, L2, b.wd * 0.8, e => damageEnemy(e, b.S.dmg * 0.6, { src: 'beam_aw' })); afx({ k: 'thrust', x: ex, y: ey, a: a2, L: L2, wd: b.wd * 0.8, dur: 0.15, col: jobTint('magic') || '#fff4c0' }); }
    }
  }
  if (G.vortex) for (const v of G.vortex) if (v.blade != null) {
    v.blade -= dt;
    if (v.blade <= 0) { v.blade = 0.6; const t = _nearestEnemy(v.x, v.y, 260); if (t) shoot({ kind: 'arrow', x: v.x, y: v.y, ang: Math.atan2(t.y - v.y, t.x - v.x), sp: 480, r: 6, dmg: v.dmg * 1.2, pierce: 2, life: 0.6, color: '#d8fff0', src: 'vortex_aw', wind: true }); }
  }
  if (G.sticks && G.sticks.length) { for (const s of G.sticks) s.t -= dt; G.sticks = G.sticks.filter(s => s.t > 0 && !s.e.dead); }
};
/* 그리기: 뇌운 · 부착 폭탄 표시 (주인공 문양 단계에서 함께 그림) */
const _drawJobAura = drawJobAura;
drawJobAura = function (c) {
  _drawJobAura(c);
  const p = G.p;
  const wl = wObj('lightning');
  if (wl && wl.aw === 'cloud') {
    const x = p.x, y = p.y - 40 + Math.sin(G.time * 2) * 2;
    c.globalAlpha = 0.85; c.fillStyle = '#6a7090';
    for (const [dx, dy, r] of [[-9, 0, 7], [0, -4, 9], [9, 0, 7], [0, 3, 7]]) { c.beginPath(); c.arc(x + dx, y + dy, r, 0, 7); c.fill(); }
    if (G.awCloud < 0.15) { c.fillStyle = '#e8f4ff'; c.fillRect(x - 1, y + 6, 2, 8); }
    c.globalAlpha = 1;
  }
  if (G.sticks) for (const s of G.sticks) { const e = s.e; c.fillStyle = (Math.floor(s.t * 10) % 2) ? '#ffb860' : '#ff5a3a'; c.fillRect(e.x - 3, e.y - e.r - 7, 6, 6); }
};
