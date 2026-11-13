/* ============================================================
   전직 (0.6·0.7) — 전직 제단 · 6직업 고유 규칙 · 궁극기 · 2차 전직 · 직업 전용 무기
   2단계 결정(2026-11-03)
   • 1차 6직업: 근접 전사·도적 / 원거리 궁수·엔지니어 / 마법 마법사·소환사 (3단계에서 10종 확대)
   • 제단: 2번째 페이즈 돌파 후 출현, 3종 중 2종 주력 계열·1종 무작위, 보유 무기 1개 봉헌 시 재호출, 떠나면 다음 페이즈 뒤 재등장
   • 2차 전직: 1차 전직 후 1개 페이즈 돌파 시 3지선다 필수(1종 능력치형), 직업 전용 강화 무기 지급
   • 궁극기: 게이지 충전 후 손 떼고 정지 시 발동, 설정에서 자동 발동 전환
   구조 출처: 초안 0.2l 전직 제단·2차 전직 3지선다 (직업 규칙·궁극기·전용 무기는 본 제작 신규)
   ============================================================ */
const JOBS = {
  warrior: { name: '전사', cat: 'melee', ic: '전', rule: '피격 시 투지 누적, 투지 비례 공격력 증가·받는 피해 감소', ult: '대지 분쇄: 주변 충격파 + 3초 무적' },
  rogue: { name: '도적', cat: 'melee', ic: '도', rule: '쉬지 않고 이동할수록 치명타 확률 증가, 적 사이 근접 통과 시 짧은 무적', ult: '그림자 난무: 2.5초 무적, 주변 적 연속 타격' },
  archer: { name: '궁수', cat: 'ranged', ic: '궁', rule: '같은 적 원거리 명중 시 표식 누적, 5개 누적 시 표식 폭발', ult: '화살비: 3초간 주변에 화살 낙하' },
  engineer: { name: '엔지니어', cat: 'ranged', ic: '엔', rule: '10초마다 포탑 자동 설치 (최대 2), 포탑이 원거리 공격', ult: '포격 지원: 포탑 4개 즉시 설치, 8초간 발사 속도 2배' },
  mage: { name: '마법사', cat: 'magic', ic: '마', rule: '서로 다른 속성 마법을 연달아 맞히면 원소 반응 폭발', ult: '운석: 적 밀집 지점에 큰 폭발' },
  summoner: { name: '소환사', cat: 'magic', ic: '소', rule: '처치한 적 12% 확률로 망령 소환 (최대 6), 망령이 적 추적 공격', ult: '망령 군단: 망령 8체 즉시 소환' },
  /* 3단계 추가 4종 (0.9) — 초안 직업 목록 기준, 드루이드는 혼합 계열(근접+마법) */
  sovereign: { name: '군주', cat: 'melee', ic: '군', rule: '10초마다 발밑에 군기 설치, 군기 반경 안에서 피해 +25%·받는 피해 -15%', ult: '왕의 호령: 5초간 모든 적 둔화 50%, 무기 재사용 2배 속도' },
  chrono: { name: '시간술사', cat: 'ranged', ic: '시', rule: '원거리 명중 시 적 시간 지연(둔화) 누적, 5중첩 시 1.5초 정지', ult: '과거의 나: 1.5초 시간 정지, 5초 전 자신의 잔상이 지나온 길을 되감아 달리며 닿은 적 피해·둔화, 끝나면 5초 전 체력으로 되돌림(낮아진 경우)' },
  priest: { name: '프리스트', cat: 'magic', ic: '프', rule: '처치 40회마다 정화: 체력 6% 회복 + 주변 신성 폭발', ult: '성역: 6초간 성역 안 적 지속 피해, 플레이어 초당 체력 5% 회복' },
  druid: { name: '드루이드', cat: 'hybrid', cats: ['melee', 'magic'], ic: '드', rule: '야수 동료 늑대·곰 동행, 늑대 8초마다 울부짖음(주변 둔화), 곰 10초마다 강타(충격파), 피해·범위·이동 속도·재사용 보조 효과가 동료에게도 적용', ult: '대자연의 분노: 8초간 동료 피해 2배·공격 속도 1.5배, 주변 덩굴 장판' },
};
const JOB_ORDER = ['warrior', 'rogue', 'sovereign', 'archer', 'engineer', 'chrono', 'mage', 'summoner', 'priest', 'druid'];
CAT_NAME.hybrid = '혼합';
const jobCats = id => JOBS[id].cats || [JOBS[id].cat];
const jobCat = cat => !!G.p.job && jobCats(G.p.job).includes(cat);
/* 2차 전직 — 직업마다 변화형 2종 + 능력치형 1종 */
const JOB2 = {
  warrior: [{ k: 'berserk', nm: '광전사', ds: '투지 효과 1.6배, 투지 최대 시 대검 베기 범위 +30%' }, { k: 'guard', nm: '수호기사', ds: '투지 최대 도달 시 최대 체력 25% 보호막 (10초 재사용)' }],
  rogue: [{ k: 'assassin', nm: '암살자', ds: '치명타 피해 2배 → 3배' }, { k: 'dancer', nm: '그림자 무희', ds: '근접 통과 시 주변 적에게 피해' }],
  archer: [{ k: 'sniper', nm: '저격수', ds: '표식 3개로 폭발, 폭발 피해 1.5배' }, { k: 'hunter', nm: '사냥꾼', ds: '표식 폭발 시 주변으로 화살 4발' }],
  engineer: [{ k: 'artillery', nm: '포병', ds: '포탑 최대 4, 포탑 탄환 착탄 폭발' }, { k: 'mechanic', nm: '기계공', ds: '포탑 지속 시간 무제한 (최대 3), 발사 속도 1.5배' }],
  mage: [{ k: 'elemental', nm: '원소술사', ds: '원소 반응 피해 1.7배·범위 1.4배' }, { k: 'archmage', nm: '대마법사', ds: '마법 무기 재사용 -20%' }],
  summoner: [{ k: 'necro', nm: '사령술사', ds: '소환 확률 2배, 망령 최대 10' }, { k: 'lord', nm: '망령 군주', ds: '망령 피해 2배, 크기 증가' }],
  sovereign: [{ k: 'conqueror', nm: '정복왕', ds: '군기 반경 +50%, 군기 안 적 지속 피해' }, { k: 'benevolent', nm: '성군', ds: '군기 안에서 초당 체력 2% 회복' }],
  chrono: [{ k: 'accel', nm: '가속자', ds: '이동 속도 +15%, 무기 재사용 -12%' }, { k: 'rewind', nm: '역행자', ds: '정지된 적이 받는 피해 +50%' }],
  priest: [{ k: 'judge', nm: '심판관', ds: '정화 폭발 피해 2배·범위 +35%' }, { k: 'saint', nm: '성자', ds: '정화 필요 처치 24회, 회복량 12%' }],
  druid: [{ k: 'ursa', nm: '수호 곰', ds: '곰 크기 증가·피해 1.5배, 강타 범위 +40%, 강타 시 체력 1 회복' }, { k: 'pack', nm: '무리의 우두머리', ds: '늑대 +2 (총 3), 늑대가 처치할 때마다 울부짖음 1초 단축' }],
};
const JOB2_STAT = { k: 'veteran', nm: '숙련', ds: '최대 체력 +30, 모든 피해 +15%, 이동 속도 +8%' };
/* 직업 전용 강화 무기 (2차 전직 시 지급, 무기 칸 미점유) */
const EXW = {
  warrior: { name: '지진 망치', ic: '망', ds: '2.2초마다 주변 충격파', cd: 2.2, dmg: 26, R: 110 },
  rogue: { name: '독 단검', ic: '단', ds: '0.8초마다 이동 방향 단검 3연발', cd: 0.8, dmg: 10 },
  archer: { name: '관통 장궁', ic: '장', ds: '1.8초마다 무제한 관통 화살', cd: 1.8, dmg: 40 },
  engineer: { name: '지뢰', ic: '뢰', ds: '2.5초마다 발밑 지뢰 설치, 접촉 시 폭발', cd: 2.5, dmg: 34, R: 60 },
  mage: { name: '서리 고리', ic: '서', ds: '주변 냉기 장판: 둔화·지속 피해, 냉기 속성', cd: 0.5, dmg: 6, R: 90 },
  summoner: { name: '영혼 구체', ic: '혼', ds: '1.5초마다 추적 구체 2발', cd: 1.5, dmg: 16 },
  sovereign: { name: '왕검', ic: '왕', ds: '2초마다 이동 방향 넓은 참격', cd: 2.0, dmg: 34, R: 120 },
  chrono: { name: '시계추', ic: '추', ds: '1.2초마다 좌우 번갈아 반원 타격', cd: 1.2, dmg: 22, R: 95 },
  priest: { name: '성광', ic: '광', ds: '1.6초마다 체력 높은 적에게 빛 기둥', cd: 1.6, dmg: 32, R: 50 },
  druid: { name: '가시 덩굴', ic: '덩', ds: '2초마다 주변 3곳 가시 장판', cd: 2.0, dmg: 9, R: 36 },
};
const JOB_CFG = { altarAfter: 2, altarDist: [170, 240], altarR: 26, altarStay: 0.6, ultNeed: 100, ultKill: 0.08, ultSec: 0.4, ultKillCap: 3, ultElite: 5, ultHurtK: 1, ultBossHit: 0.35, ultBossCap: 1.8, ultWin: 4, ultRefK: 0.5, ultRefMax: 12, job2Min: 60, ultStop: 0.6, ultAutoN: 10, jobCatW: 1.4 };

/* ---------- 주력 계열 ---------- */
function catLevels() { const s = { melee: 0, ranged: 0, magic: 0 }; for (const w of G.p.weapons) s[WEAPONS[w.id].cat] += w.lvl; return s; }
function mainCat() { return Object.entries(catLevels()).sort((a, b) => b[1] - a[1] || Math.random() - 0.5)[0][0]; }
/* 후보 3종: 주력 계열 2종(혼합 직업은 두 계열 모두 보유 시 주력 후보 포함) + 다른 계열 1종 (0.9 10직업 확장) */
function jobCands(prev = []) {
  if (typeof window !== 'undefined' && window.__vtJob && JOBS[window.__vtJob]) return [{ t: 'job', id: window.__vtJob }];   // 가상 시험 직업 지정 (dev/vtest.js --job)
  const mc = mainCat(), lv = catLevels();
  const fit = j => JOBS[j].cats ? JOBS[j].cats.includes(mc) && Math.min(...JOBS[j].cats.map(c => lv[c])) >= 0.4 * lv[mc] : JOBS[j].cat === mc;   // 혼합: 부 계열이 주력의 40% 이상
  let main = shuffle(JOB_ORDER.filter(fit)); const fresh = main.filter(j => !prev.includes(j));
  main = fresh.concat(main.filter(j => prev.includes(j))).slice(0, 2);
  const rest = shuffle(JOB_ORDER.filter(j => !main.includes(j) && (JOBS[j].cats ? !JOBS[j].cats.includes(mc) : JOBS[j].cat !== mc)));
  const other = rest.find(j => !prev.includes(j)) || rest[0];
  return shuffle(main.concat(other)).map(id => ({ t: 'job', id }));
}

/* ---------- 제단 ---------- */
function altarCheck() {
  const ph = G.ph, p = G.p;
  if (hasCond('nojob')) return;                              // 도전 조건 전직 금지 (0.15)
  if (!p.job && ph.i + 1 >= JOB_CFG.altarAfter && ph.i + 1 < ph.order.length) {
    const q = ringAt(JOB_CFG.altarDist[0], JOB_CFG.altarDist[1]);
    G.altar = { x: q.x, y: q.y, r: JOB_CFG.altarR, stay: 0, at: ph.i };
    G.stats.altarSeen++; toast('전직 제단 출현 · 다음 페이즈 끝까지 유지', '#d9a8ff');
  }
  if (p.job && !p.job2 && ph.i >= p.jobAt + 1) G.job2Ready = true;         // 1차 전직 후 1개 페이즈 돌파
}
function updateAltar(dt) {
  const a = G.altar, p = G.p; if (!a) return;
  if (dist2(a.x, a.y, p.x, p.y) < (a.r + p.r) ** 2) { a.stay += dt; if (a.stay >= JOB_CFG.altarStay && STATE.mode === 'play') openAltar(); }
  else a.stay = 0;
}
function openAltar() {
  STATE.mode = 'select'; clearInput(); G.stats.altarOpen++;
  G.sel = { kind: 'job', cards: jobCands(), offer: false };
  renderSelect(); autoLater();
}
function offerWeapon(id) {
  const p = G.p; if (p.weapons.length < 2) return;
  p.weapons = p.weapons.filter(w => w.id !== id); G.stats.offers++;
  recalc();
  G.sel.cards = jobCands(G.sel.cards.map(c => c.id)); G.sel.offer = false;
  toast(`${WEAPONS[id].name} 봉헌`, '#d9a8ff'); renderSelect(); autoLater();
}
function leaveAltar() { G.altar = null; G.sel = null; hideUI(); STATE.mode = 'play'; G.stats.altarLeave++; toast('제단을 떠남 · 다음 페이즈 뒤 재등장', '#bfb6d6'); }
function applyJob(id) {
  const p = G.p; p.job = id; p.jobAt = G.ph.i; p.ult = 50; G.altar = null;   // 0.38 전용 무기 폐지
  G.stats.job = id; G.stats.jobAt = Math.round(G.time);
  if (id === 'druid') petsInit();
  recalc(); jobCeremony(id, false);                         // 0.26 전직 연출·무기 변환 안내
}
function openJob2() {
  G.pendingJob2 = false; G.job2Ready = false; STATE.mode = 'select'; clearInput();
  const j = G.p.job; G.sel = { kind: 'job2', cards: JOB2[j].concat(JOB2_STAT).map(o => ({ t: 'job2', id: j, k: o.k })) };
  renderSelect(); autoLater();
}
function applyJob2(k) {
  const p = G.p; p.job2 = k;   // 0.38 전용 무기 폐지
  G.stats.job2 = k; G.stats.job2At = Math.round(G.time);
  if (k === 'veteran') { p.vet = true; }
  if (k === 'pack') { addPet('wolf'); addPet('wolf'); }
  recalc(); jobCeremony(p.job, true);
}

/* ---------- 피해·피격 연계 ---------- */
function jobDmgMul(e, o) {
  const p = G.p; let m = 1;
  if (G.tm.alpha > 0) m *= 1.2;                                   // 0.26a 늑대 우두머리의 함성
  if (e.slowT > 0 && bondHas('wolf', 'howl2')) m *= 1.2;          // 0.26a 긴 울음
  if (p.job === 'warrior') m *= 1 + 0.4 * (p.job2 === 'berserk' ? 1.6 : 1) * p.fury / 100;
  let cc = 0, cm = 2;
  if (pBr('might') === 'crit') cc += 0.15;
  if (p.job === 'rogue') { cc += Math.min(0.35, 0.05 + G.tm.run * 0.075); if (p.job2 === 'assassin') cm = 3; }
  if (cc && Math.random() < cc) { m *= cm; o.crit = true; }
  if (pBr('might') === 'pen' && (e.r >= 16 || e.elite || e.cmd)) m *= 1.25;
  if (p.job === 'sovereign' && inBanner()) m *= 1.25;
  if (p.job2 === 'rewind' && e.frz > 0) m *= 1.5;
  return m;
}
const ELEM = { icering: 'ice', shatter: 'ice', mbolt: 'arcane', nova: 'arcane', firetrap: 'fire', fireball: 'fire', fireball_pool: 'fire', flame: 'fire', firefield: 'fire', lightning: 'bolt', chain: 'bolt', thunder: 'bolt', frost: 'ice', meteor: 'fire' };
const RANGED_SRC = { knife: 1, trap: 1, arrow: 1, split: 1, boomerang: 1, longbow: 1, turret: 1, dagger: 1, rain: 1 };
function onEnemyHit(e, o) {
  const p = G.p, src = o.src;
  if (src === 'knife' && hasRelic('arcknife') && Math.random() < 0.2) shoot({ kind: 'orb', x: e.x, y: e.y, ang: rand(Math.PI * 2), sp: 270, r: 6, dmg: WEAPONS.orb.base.dmg * 0.6 * p.mod.dmg, pierce: 0, life: 1.6, color: '#9fb8ff', src: 'mbolt', home: true });
  if (src === 'arrow' && hasRelic('thunderarrow') && Math.random() < 0.2) chainBolt(e, 2, WEAPONS.lightning.base.dmg * 0.5 * p.mod.dmg, 'thunder');
  arsenalHit(e, o);                                         // 0.27 유물 명중 연계
  if (!p.job || e.dead) return;
  jobWeaponHit(e, o);                                       // 0.26 공용 무기 직업 변환
  if (p.job === 'archer' && RANGED_SRC[src]) {
    e.mk = (e.mk || 0) + 1; const need = p.job2 === 'sniper' ? 3 : 5;
    if (e.mk >= need) { e.mk = 0; markBurst(e); }
  }
  if (p.job === 'chrono' && RANGED_SRC[src] && !e.boss) {
    e.tw = (e.tw || 0) + 1; e.slowT = Math.max(e.slowT || 0, 1);
    if (e.tw >= 5 && !e.cmd) { e.tw = 0; e.frz = 1.5; }
  }
  if (p.job === 'mage') {
    const el = ELEM[src]; if (!el) return;
    if (e.el && e.el !== el && G.time - e.elT < 2 && !(e.rcT > G.time)) { e.rcT = G.time + 1; reaction(e); }
    e.el = el; e.elT = G.time;
  }
}
function onEnemyKill(e) {
  const p = G.p; if (!p.job) return;
  ultKillGain(e);
  if (p.job === 'priest' && ++p.holy >= (p.job2 === 'saint' ? 24 : 40)) { p.holy = 0; purify(); }
  jobWeaponKill(e); if (p.job === 'druid') petKilled(e);
  if (p.job === 'summoner' && !e.minionOf) {
    const cap = p.job2 === 'necro' ? 10 : 6, ch = p.job2 === 'necro' ? 0.24 : 0.12;
    if (G.minions.length < cap && Math.random() < ch) addMinion(e.x, e.y);
  }
}
function playerHurtMul() {
  const p = G.p; let m = 1;
  if (p.job === 'warrior') m *= 1 - 0.3 * p.fury / 100;
  if (G.tm.wall > 0) m *= 0.6;
  m *= ultHurtMul();                                              // 0.32 광전사·수호기사
  if (p.job === 'sovereign' && inBanner()) m *= 0.85;
  return m;
}
/* 피격 직전 판정: true 반환 시 피해 무효 */
function playerAvoid() {
  const p = G.p, T = G.tm;
  if (T.inv > 0) return true;
  if (p.shield) { p.shield = false; G.tm.shield = 12; fx({ kind: 'ring', x: p.x, y: p.y, r0: 10, r1: 34, dur: 0.3, color: '#8fd0ff', follow: true }); p.invT = CFG.player.invuln; return true; }
  if (pBr('swift') === 'dodge' && Math.random() < 0.2) { p.invT = 0.3; fx({ kind: 'ring', x: p.x, y: p.y, r0: 8, r1: 26, dur: 0.25, color: '#c8ffd8', follow: true }); return true; }
  return false;
}
function onPlayerHurt() {
  const p = G.p;
  if (p.job === 'warrior') {
    p.fury = Math.min(100, p.fury + 20); G.tm.furyHold = 3;
    if (p.fury >= 100 && p.job2 === 'guard' && G.tm.guard <= 0) { G.tm.guard = 10; p.shield = true; }
  }
}

/* ---------- 효과 함수 ---------- */
function chainBolt(from, n, dmg, src) {
  const hit = new Set([from.id]); let cur = from;
  for (let i = 0; i < n; i++) {
    let best = null, bd = 120 * 120;
    gridQuery(cur.x, cur.y, 120, e => { if (hit.has(e.id)) return; const d = dist2(e.x, e.y, cur.x, cur.y); if (d < bd) { bd = d; best = e; } });
    if (!best) break; hit.add(best.id);
    fx({ kind: 'zap', x: cur.x, y: cur.y, x2: best.x, y2: best.y, dur: 0.15 });
    damageEnemy(best, dmg, { src }); cur = best;
  }
}
function markBurst(e) {
  const p = G.p, k = p.job2 === 'sniper' ? 1.5 : 1, dmg = (25 + p.level * 2) * p.mod.dmg * k;
  fx({ kind: 'ring', x: e.x, y: e.y, r0: 6, r1: 46, dur: 0.25, color: '#b8ff9a' });
  gridQuery(e.x, e.y, 46, t => damageEnemy(t, dmg, { src: 'mark' }));
  if (p.job2 === 'hunter') for (let i = 0; i < 4; i++) shoot({ kind: 'arrow', x: e.x, y: e.y, ang: i * Math.PI / 2 + Math.PI / 4, sp: 480, r: 5, dmg: dmg * 0.5, pierce: 1, life: 0.6, color: '#b8ff9a', src: 'mark' });
}
function reaction(e) {
  const p = G.p, el = p.job2 === 'elemental', R = 52 * (el ? 1.4 : 1), dmg = (16 + p.level * 1.2) * p.mod.dmg * (el ? 1.7 : 1);
  fx({ kind: 'ring', x: e.x, y: e.y, r0: 8, r1: R, dur: 0.3, color: '#e8b0ff', fill: true });
  gridQuery(e.x, e.y, R, t => damageEnemy(t, dmg, { src: 'react' }));
}
/* 0.9 직업 보조 함수 */
function inBanner() { const b = G.banner, p = G.p, r = b ? b.r * ultBannerR() : 0; return !!(b && dist2(b.x, b.y, p.x, p.y) < r * r) || ultInBanner(); }   // 0.32 호령 반경 2배·정복왕 추가 군기
function purify() {
  const p = G.p, j = p.job2 === 'judge', R = 110 * (j ? 1.35 : 1), d = (20 + p.level * 2) * p.mod.dmg * (j ? 2 : 1) * 1.5;   // 0.35 빈도 절반 보상 피해 1.5배
  heal(p.maxHp * (p.job2 === 'saint' ? 0.12 : 0.06), '정화');   // 0.35 회복 하향(필요 처치 2배·회복량 60%)
  fx({ kind: 'ring', x: p.x, y: p.y, r0: 10, r1: R, dur: 0.4, color: '#fff2a8', fill: true });
  gridQuery(p.x, p.y, R, e => damageEnemy(e, d, { src: 'holy', kb: 160, fx: p.x, fy: p.y }));
}
function addMinion(x, y) { G.stats.maxMinions = Math.max(G.stats.maxMinions || 0, G.minions.length + 1); G.minions.push({ id: ++G.pid, x, y, r: G.p.job2 === 'lord' ? 9 : 7, life: 20, hitT: 0 }); }

/* ---------- 궁극기 ---------- */
function ultGain(v, src = 'etc') { const p = G.p; if (tr('focus')) v *= 1.15; if (!p.job || p.ult >= JOB_CFG.ultNeed) return; const U0 = p.ult; p.ult = Math.min(JOB_CFG.ultNeed, p.ult + v); const UB = G.stats.ultBy || (G.stats.ultBy = {}); UB[src] = (UB[src] || 0) + p.ult - U0; if (p.ult >= JOB_CFG.ultNeed) { G.tm.readyAt = G.time; toast('궁극기 준비 · 손 떼고 정지', '#ffe08a'); } }
/* 0.26a 궁극기 충전 혼합 보강: 처치 충전은 초당 상한, 엘리트·수문장·마왕 타격 충전(초당 상한), 시전 중 처치분은 환급(1회 상한) */
function ultBucket() { const B = G.ultB || (G.ultB = { s: -1, k: 0, b: 0, ref: 0 }); const s = Math.floor(G.time); if (s !== B.s) { B.s = s; B.k = 0; B.b = 0; } return B; }
function ultKillGain(e) {
  const C = JOB_CFG, B = ultBucket(), p = G.p;
  if (G.tm.ultWin > 0) { if (B.ref < C.ultRefMax) { const v = Math.min(C.ultRefK, C.ultRefMax - B.ref); B.ref += v; p.ultRef = Math.min(C.ultNeed, (p.ultRef || 0) + v); } return; }
  if (e && e.elite && !e.clone) { ultGain(C.ultElite, 'elite'); return; }   // 0.35 정예 처치 별도 충전 (상한 미적용)
  const v = Math.min(C.ultKill, C.ultKillCap - B.k); if (v <= 0) return; B.k += v; ultGain(v, 'kill');   // 0.35 처치당 고정 충전, 초당 안전 상한 3%
}
/* 0.35 피격 충전: 잃은 체력 비율 1:1, 궁극기 시전 중 미충전 */
function ultHurtGain(dmg) { const p = G.p; if (!p.job || G.tm.ultWin > 0 || dmg <= 0) return; ultGain(dmg / p.maxHp * 100 * JOB_CFG.ultHurtK, 'hurt'); }
function ultHitGain(e) {
  if (!G.p.job || !(e.elite || e.gk || e.boss)) return;
  const C = JOB_CFG, B = ultBucket(), v = Math.min(C.ultBossHit, C.ultBossCap - B.b); if (v <= 0) return; B.b += v; ultGain(v, 'boss');
}
function ultReady() { return G.p.job && G.p.ult >= JOB_CFG.ultNeed; }
/* useUlt: 0.32 재설계로 src/ult.js 이관 */
function autoUltSetting() { return SETTINGS.autoUlt || (STATE.dev.auto && G.ai && G.ai.autoUlt); }
function ultBlast(x, y, r, d, kb, col) { fx({ kind: 'ring', x, y, r0: 10, r1: r, dur: 0.5, color: col, fill: true }); gridQuery(x, y, r, e => damageEnemy(e, d, { src: 'ult', kb, fx: x, fy: y })); }
function ultSlashes(n, d) {
  const p = G.p, list = []; gridQuery(p.x, p.y, 260, e => { if (!e.dead) list.push(e); });
  list.sort((a, b) => dist2(a.x, a.y, p.x, p.y) - dist2(b.x, b.y, p.x, p.y));
  for (const e of list.slice(0, n)) { fx({ kind: 'slash', x: e.x, y: e.y, a: Math.atan2(e.y - p.y, e.x - p.x), dur: 0.3, color: '#d0b0ff' }); damageEnemy(e, d, { src: 'ult', kb: 120, fx: p.x, fy: p.y }); }
}
function updateUlt(dt) {
  const p = G.p; if (!p.job) return;
  if (G.ultLater && G.ultLater.length) G.ultLater = G.ultLater.filter(u => { if (G.time < u.t) return true; ultBlast(u.x, u.y, u.r, u.d, u.kb, u.col); return false; });
  if (p.ultRef > 0 && !(G.tm.ultWin > 0)) { const v = p.ultRef; p.ultRef = 0; ultGain(v, 'refund'); }   // 시전 종료 후 환급
  ultGain(JOB_CFG.ultSec * dt, 'time');
  if (!ultReady()) { G.tm.stopT = 0; return; }
  if (autoUltSetting()) { let n = 0; gridQuery(p.x, p.y, 200, () => { n++; }); if (n >= JOB_CFG.ultAutoN || G.time - G.tm.readyAt > 12) useUlt(); return; }
  // 정지 입력: 조이스틱에서 손을 뗀 채(이동 입력 없음) 일정 시간 정지 시 발동
  if (!p.moving && !INPUT.active) { G.tm.stopT += dt; if (G.tm.stopT >= JOB_CFG.ultStop) useUlt(); }
  else G.tm.stopT = 0;
}

/* ---------- 포탑·망령 ---------- */
function addTurret(x, y, temp) {
  const p = G.p, cap = p.job2 === 'artillery' ? 4 : p.job2 === 'mechanic' ? 3 : 2;
  if (!temp) while (G.turrets.filter(t => !t.temp).length >= cap) { const i = G.turrets.findIndex(t => !t.temp); G.turrets.splice(i, 1); }
  G.turrets.push({ x, y, t: 0.3, life: temp ? 10 : (p.job2 === 'mechanic' ? 1e9 : 20), temp });
}
function turretDmg() { const p = G.p; let d = 10 * p.mod.dmg; for (const w of p.weapons) if (WEAPONS[w.id].cat === 'ranged') d = Math.max(d, wStats(w).dmg * 0.6); return d; }
function updateTurrets(dt) {
  const p = G.p;
  if (p.job === 'engineer') { G.tm.turret -= dt; if (G.tm.turret <= 0) { G.tm.turret = 10; addTurret(p.x, p.y); } }
  const rate = (p.job2 === 'mechanic' ? 1.5 : 1) * (G.tm.overdrive > 0 ? 2 : 1);
  for (const t of G.turrets) {
    t.life -= dt; t.t -= dt * rate;
    if (t.t <= 0) {
      t.t = 0.8; const e = nearestEnemy(t.x, t.y, 360);
      if (e) {
        const a = Math.atan2(e.y - t.y, e.x - t.x);
        t.a = a;
        const projectile = shoot({ kind: p.job2 === 'artillery' ? 'shell' : 'arrow', x: t.x, y: t.y, ang: a, sp: 520, r: 4, dmg: turretDmg(), pierce: 0, life: 0.8, R: 30, color: '#ffd890', src: 'turret' });
        if (G.proj[G.proj.length - 1] === projectile) markInstallationShot(t, a);
      }
    }
  }
  G.turrets = G.turrets.filter(t => t.life > 0);
}
/* 망령: 서로 다른 적 분산 공격 (0.26) — 표적 유지·미점유 적 우선·망령 간 간격 유지, 적 없으면 주인 주변 선회 */
function updateMinions(dt) {
  const p = G.p, k = p.job2 === 'lord' ? 2 : 1, dmg = 8 * k * p.mod.dmg, claim = new Map();
  for (const m of G.minions) if (m.tg && !m.tg.dead) claim.set(m.tg.id, (claim.get(m.tg.id) || 0) + 1);
  G.minions.forEach((m, i) => {
    m.life -= dt; m.hitT -= dt; m.rt = (m.rt || 0) - dt;
    if (m.tg && (m.tg.dead || dist2(m.tg.x, m.tg.y, p.x, p.y) > 360 * 360)) { claim.set(m.tg.id, (claim.get(m.tg.id) || 1) - 1); m.tg = null; }
    if (!m.tg || m.rt <= 0) {
      m.rt = 1.2; let best = null, bs = 1e18;
      gridQuery(p.x, p.y, 320, e => { const s = dist2(e.x, e.y, m.x, m.y) * (1 + 3 * (claim.get(e.id) || 0) - (e === m.tg ? 0.5 : 0)); if (s < bs) { bs = s; best = e; } });
      if (best !== m.tg) { if (m.tg) claim.set(m.tg.id, (claim.get(m.tg.id) || 1) - 1); m.tg = best; if (best) claim.set(best.id, (claim.get(best.id) || 0) + 1); }
    }
    const e = m.tg, a = i * 2.39996 + G.time * 0.8;
    const tx = e ? e.x : p.x + Math.cos(a) * 44, ty = e ? e.y : p.y + Math.sin(a) * 44, dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy) || 1;
    if (d > 4) { m.vx = dx; m.x += dx / d * 170 * dt; m.y += dy / d * 170 * dt; }
    for (let j = 0; j < G.minions.length; j++) { if (j === i) continue; const o = G.minions[j], ox = m.x - o.x, oy = m.y - o.y, od = Math.hypot(ox, oy); if (od > 0 && od < 13) { m.x += ox / od * (13 - od) * 0.5; m.y += oy / od * (13 - od) * 0.5; } }
    if (e && m.hitT <= 0 && d < e.r + m.r + 2) { m.hitT = 0.5; damageEnemy(e, dmg, { src: 'minion' }); }
  });
  G.minions = G.minions.filter(m => m.life > 0);
}

/* ---------- 직업 전용 무기 ---------- */
function updateExw(dt) {
  const p = G.p, x = p.exw; if (!x) return;
  const D = EXW[x.id], dm = D.dmg * p.mod.dmg;
  x.t -= dt / p.mod.cd; if (x.t > 0) return; x.t = D.cd;
  if (x.id === 'warrior') { fx({ kind: 'ring', x: p.x, y: p.y, r0: 10, r1: D.R, dur: 0.3, color: '#d8a070', fill: true }); gridQuery(p.x, p.y, D.R, e => damageEnemy(e, dm, { src: 'quake', kb: 160, fx: p.x, fy: p.y })); }
  if (x.id === 'rogue') { const a0 = Math.atan2(p.face.y, p.face.x); for (let i = 0; i < 3; i++) shoot({ kind: 'arrow', x: p.x, y: p.y, ang: a0 + (i - 1) * 0.18, sp: 560, r: 4, dmg: dm, pierce: 1, life: 0.7, color: '#b0f0a0', src: 'dagger' }); }
  if (x.id === 'archer') shoot({ kind: 'arrow', x: p.x, y: p.y, ang: aimAng(), sp: 700, r: 7, dmg: dm, pierce: 99, life: 1.0, color: '#fff6a0', src: 'longbow' });
  if (x.id === 'engineer') { if (G.mines.length < 8) G.mines.push({ x: p.x, y: p.y, r: 10, arm: 0.5 }); }
  if (x.id === 'mage') { gridQuery(p.x, p.y, D.R, e => { e.slowT = 0.6; damageEnemy(e, dm, { src: 'frost' }); }); }
  if (x.id === 'sovereign') { const a0 = Math.atan2(p.face.y, p.face.x); slash(a0, 2.2, D.R, dm, 200); }
  if (x.id === 'chrono') { x.side = -(x.side || 1); const a0 = Math.atan2(p.face.y, p.face.x) + x.side * Math.PI / 2; gridQuery(p.x, p.y, D.R, e => { let da = Math.atan2(e.y - p.y, e.x - p.x) - a0; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) <= Math.PI / 2) damageEnemy(e, dm, { src: 'pendulum', kb: 120, fx: p.x, fy: p.y }); }); fx({ kind: 'arc', a: a0, arc: Math.PI, r: D.R, dur: 0.16, color: '#d8d0ff' }); }
  if (x.id === 'priest') { const ts = enemiesInRange(p.x, p.y, 380).sort((a, b) => b.hp - a.hp); const e = ts[0]; if (e) { fx({ kind: 'bolt', x: e.x, y: e.y, dur: 0.2 }); gridQuery(e.x, e.y, D.R, t => damageEnemy(t, dm, { src: 'radiance' })); fx({ kind: 'ring', x: e.x, y: e.y, r0: 6, r1: D.R, dur: 0.25, color: '#fff2a8' }); } else x.t = 0.3; }
  if (x.id === 'druid') for (let i = 0; i < 3; i++) { const q = ringAt(40, 160); addPool({ x: q.x, y: q.y, r: D.R, dur: 2.5, every: 0.4, dmg: dm, src: 'thorn', kind: 'vine', slow: true }); }
  if (x.id === 'summoner') for (let i = 0; i < 2; i++) shoot({ kind: 'orb', x: p.x, y: p.y, ang: rand(Math.PI * 2), sp: 260, r: 6, dmg: dm, pierce: 0, life: 2.2, color: '#c8a8ff', src: 'orb', home: true });
}
function updateMines(dt) {
  const D = EXW.engineer, dm = D.dmg * G.p.mod.dmg;
  for (const m of G.mines) {
    m.arm -= dt; if (m.arm > 0) continue;
    let hit = false; gridQuery(m.x, m.y, m.r, () => { hit = true; return false; });
    if (hit) { m.dead = true; explode(m.x, m.y, D.R, dm, 'mine', '#ffcf70'); }
  }
  G.mines = G.mines.filter(m => !m.dead);
}

/* ---------- 직업 갱신 (매 틱) ---------- */
function updateJob(dt) {
  const p = G.p, T = G.tm;
  if (G.job2Ready && !p.job2 && G.time - G.stats.jobAt >= JOB_CFG.job2Min) { G.job2Ready = false; G.pendingJob2 = true; }   // 최소 60초 경과 후
  for (const k of ['inv', 'dance', 'rain', 'overdrive', 'guard', 'passCd', 'roar', 'stop', 'sanct', 'wrath', 'ultWin', 'alpha']) if (T[k] > 0) T[k] -= dt;
  if (p.job === 'sovereign') {
    T.banner = (T.banner == null ? 0 : T.banner) - dt;
    if (T.banner <= 0) { T.banner = 10; G.banner = { x: p.x, y: p.y, r: 110 * (p.job2 === 'conqueror' ? 1.5 : 1) }; fx({ kind: 'ring', x: p.x, y: p.y, r0: 10, r1: G.banner.r, dur: 0.4, color: '#ffd24a' }); }
    const b = G.banner;
    if (b && p.job2 === 'conqueror') { T.bt = (T.bt || 0) - dt; if (T.bt <= 0) { T.bt = 0.5; const d = (6 + p.level * 0.6) * p.mod.dmg; gridQuery(b.x, b.y, b.r, e => damageEnemy(e, d, { src: 'banner' })); } }
    if (p.job2 === 'benevolent' && inBanner()) heal(p.maxHp * 0.02 * dt, '성군 군기');
    benevolentHeal(dt);
  }
  if (p.job === 'druid') {
    updatePets(dt);
    if (T.wrath > 0) { T.vine = (T.vine || 0) - dt; if (T.vine <= 0) { T.vine = 1; const q = ringAt(30, 140); addPool({ x: q.x, y: q.y, r: 50, dur: 2.5, every: 0.4, dmg: (10 + p.level) * p.mod.dmg, src: 'ult', kind: 'vine', slow: true }); } }
  }
  recordTrail(dt); updateRewind(dt);
  if (G.sanct && T.sanct > 0) {
    const S = G.sanct; T.st = (T.st || 0) - dt;
    if (T.st <= 0) { T.st = 0.4; const d = (14 + p.level * 1.2) * p.mod.dmg; gridQuery(S.x, S.y, S.r, e => damageEnemy(e, d, { src: 'ult' })); }
    if (dist2(S.x, S.y, p.x, p.y) < S.r * S.r) heal(p.maxHp * 0.05 * dt, '성역');
  } else if (G.sanct) G.sanct = null;
  if (p.job === 'warrior') { if (T.furyHold > 0) T.furyHold -= dt; else p.fury = Math.max(0, p.fury - 4 * dt); }
  if (p.job === 'rogue') {
    T.run = p.moving ? Math.min(4, T.run + dt) : Math.max(0, T.run - dt * 3);
    if (p.moving && T.passCd <= 0) {
      let n = 0; gridQuery(p.x, p.y, p.r + 10, () => { n++; });
      if (n >= 2) { T.passCd = 1.5; p.invT = Math.max(p.invT, 0.25); G.stats.passes++;
        if (p.job2 === 'dancer') { const d = (14 + p.level) * p.mod.dmg; gridQuery(p.x, p.y, 60, e => damageEnemy(e, d, { src: 'dance' })); fx({ kind: 'ring', x: p.x, y: p.y, r0: 6, r1: 60, dur: 0.25, color: '#b0f0a0', follow: true }); } }
    }
    if (T.dance > 0) { T.danceT = (T.danceT || 0) - dt; if (T.danceT <= 0) { T.danceT = 0.15; const ts = shuffle(enemiesInRange(p.x, p.y, 160)).slice(0, 4), d = (30 + p.level * 2) * p.mod.dmg; for (const e of ts) { fx({ kind: 'pop', x: e.x, y: e.y, r: 8, color: '#202030', dur: 0.15 }); damageEnemy(e, d, { src: 'ult' }); } } }
  }
  if (T.rain > 0) { T.rainT = (T.rainT || 0) - dt; if (T.rainT <= 0) { T.rainT = 0.1; const q = ringAt(0, 200), d = (24 + p.level * 1.5) * p.mod.dmg; fx({ kind: 'ring', x: q.x, y: q.y, r0: 4, r1: 40, dur: 0.2, color: '#d8ffc8' }); gridQuery(q.x, q.y, 40, e => damageEnemy(e, d, { src: 'ult' })); } }
  updateTurrets(dt); updateMinions(dt); updateMines(dt); updateExw(dt); updateExw1(dt); updateUlt(dt); updateUltFx(dt);
}
