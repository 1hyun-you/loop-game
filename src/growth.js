/* ============================================================
   성장 확장 (0.5) — 분기 2지선다 · 유물 4종 · 잡몹 엘리트 · 보물 상자
   2단계 결정(2026-11-03): 강화 3단계 도달 시 2지선다, 유물은 재료 보유 시 후보 등장,
   엘리트는 초안 사양(크기 1.5배·체력 8배·금색 테두리) + 특수 능력 1개, 페이즈당 1~2회
   분기 구성 출처: 초안 0.2l 분기 24종 중 현 무기 대응분 재구성
   ============================================================ */
const BRANCH_AT = 3;
const BRANCHES = {
  cleave: [{ k: 'wide', nm: '광역 베기', ds: '베기 각도 +45%, 사거리 +25%' }, { k: 'double', nm: '연속 베기', ds: '0.18초 뒤 반대 방향으로 한 번 더 베기 (피해 70%)' }],
  spin: [{ k: 'wide', nm: '넓은 궤도', ds: '회전 반경 +35%, 칼날 크기 +25%' }, { k: 'throw', nm: '투척 궤도', ds: '2.4초마다 칼날이 바깥으로 뻗었다 돌아옴 (피해 130%)' }],
  arrow: [{ k: 'pierce', nm: '관통 화살', ds: '관통 +3, 피해 +15%' }, { k: 'split', nm: '분열 화살', ds: '첫 명중 시 화살 3갈래 분열 (피해 50%)' }],
  boomerang: [{ k: 'multi', nm: '다중 투척', ds: '도끼 +1, 넓은 각도로 투척' }, { k: 'burst', nm: '반환 폭발', ds: '되돌아오는 순간 폭발 (피해 120%)' }],
  fireball: [{ k: 'big', nm: '대폭발', ds: '폭발 범위 +45%, 피해 +20%, 재사용 +15%' }, { k: 'pool', nm: '불길', ds: '폭발 자리에 2.5초 화염 장판 (0.4초마다 피해 25%)' }],
  lightning: [{ k: 'chain', nm: '연쇄 번개', ds: '맞은 적 주변 2체로 연쇄 (피해 60%)' }, { k: 'focus', nm: '집중 낙뢰', ds: '체력 높은 적 우선, 낙뢰 지점 범위 피해 (피해 130%)' }],
  vit: [{ k: 'regen', nm: '재생', ds: '초당 최대 체력 0.6% 회복' }, { k: 'shield', nm: '보호막', ds: '12초마다 피해 1회 무효 보호막' }],
  might: [{ k: 'crit', nm: '치명', ds: '15% 확률 피해 2배' }, { k: 'pen', nm: '분쇄', ds: '투사체 관통 +1, 대형 적·엘리트 피해 +25%' }],
  swift: [{ k: 'trail', nm: '잔상', ds: '이동 중 발밑에 잔상, 닿은 적 피해' }, { k: 'dodge', nm: '회피', ds: '피격 시 20% 확률 회피' }],
  haste: [{ k: 'echo', nm: '연속 발동', ds: '무기 발동 시 12% 확률 즉시 재발동' }, { k: 'charge', nm: '충전', ds: '8초마다 모든 무기 재사용 즉시 완료' }],
  /* 3단계 추가분 (0.8) */
  shield: [{ k: 'wall', nm: '방벽', ds: '충격 후 1.5초간 받는 피해 -40%' }, { k: 'twin', nm: '이중 충격', ds: '0.4초 뒤 범위 140% 2차 충격 (피해 50%)' }],
  slam: [{ k: 'after', nm: '여진', ds: '1초 뒤 같은 자리 재충격 (피해 60%)' }, { k: 'fissure', nm: '균열', ds: '네 방향 균열 장판 2초 (0.4초마다 피해 20%)' }],
  knife: [{ k: 'fan', nm: '부채 투척', ds: '단검 +2, 넓은 부채꼴 투척' }, { k: 'bleed', nm: '출혈', ds: '명중 시 3초 출혈 (0.5초마다 피해 25%)' }],
  trap: [{ k: 'snare', nm: '속박 덫', ds: '폭발 범위 적 1.5초 정지' }, { k: 'cluster', nm: '연쇄 덫', ds: '폭발 시 주변에 작은 덫 2개 생성 (피해 50%)' }],
  icering: [{ k: 'freeze', nm: '빙결', ds: '냉기 피해 시 6% 확률 1초 빙결' }, { k: 'shatter', nm: '파쇄', ds: '둔화된 적 처치 시 냉기 폭발 (주변 피해)' }],
  orb: [{ k: 'swarm', nm: '구체 군집', ds: '구체 +2, 피해 -20%' }, { k: 'nova', nm: '마력 폭발', ds: '명중 시 작은 폭발 (피해 60%)' }],
  area: [{ k: 'giant', nm: '거대화', ds: '범위 추가 +15%, 모든 무기 피해 +8%' }, { k: 'dense', nm: '응축', ds: '범위 증가 대신 단계당 피해 +12%' }],
  multi: [{ k: 'barrage', nm: '일제 사격', ds: '개수 추가 +1, 해당 무기 재사용 +10%' }, { k: 'velocity', nm: '고속탄', ds: '개수형 무기 피해 +20%' }],
  magnet: [{ k: 'vacuum', nm: '자석 파동', ds: '30초마다 주변 경험치 전부 흡수' }, { k: 'greed', nm: '성장 가속', ds: '경험치 획득 +15%' }],
  regen: [{ k: 'vamp', nm: '흡혈', ds: '처치 시 체력 0.4 회복' }, { k: 'second', nm: '불굴', ds: '판당 1회 치명 피해 시 체력 40%로 버팀' }],
};
const RELICS = {
  bladestorm: { name: '칼날 폭풍', ic: '폭', a: 'cleave', b: 'spin', ds: '베기 시 1.5초간 회전검 속도 2배·피해 +30%' },
  thunderarrow: { name: '뇌전 화살', ic: '뇌', a: 'arrow', b: 'lightning', ds: '화살 명중 시 20% 확률 연쇄 번개 2체 (번개 피해 50%)' },
  flameaxe: { name: '불타는 도끼', ic: '염', a: 'boomerang', b: 'fireball', ds: '도끼 궤적에 작은 화염 폭발 (화염구 피해 30%)' },
  firefield: { name: '화염 장판', ic: '장', a: 'fireball', b: 'might', ds: '화염구 착탄 지점 2초 화염 장판 (0.5초마다 피해 20%)' },
  /* 3단계 추가 4종 (0.8) */
  frostrift: { name: '서리 균열', ic: '서', a: 'slam', b: 'icering', ds: '대지 강타 충격파가 적을 1.2초 빙결' },
  firetrap: { name: '화염 덫', ic: '덫', a: 'trap', b: 'fireball', ds: '덫 폭발 자리에 2초 화염 장판' },
  bulwark: { name: '수호 방패', ic: '수', a: 'shield', b: 'vit', ds: '방패 충격마다 최대 체력 3% 회복' },
  arcknife: { name: '마력 단검', ic: '마', a: 'knife', b: 'orb', ds: '단검 명중 시 20% 확률 마력 구체 1발 (구체 피해 60%)' },
};
const RELIC_ORDER = ['bladestorm', 'thunderarrow', 'flameaxe', 'firefield', 'frostrift', 'firetrap', 'bulwark', 'arcknife'];
const ELITE = { size: 1.5, hp: 8, xp: 8, perPhase: [1, 2], chance2: 0.5, ab: ['dash', 'split', 'shield', 'haste'] };
const ELITE_AB = { dash: '돌진', split: '분열', shield: '보호막', haste: '가속' };

const owns = id => hasW(id) || hasP(id);
function wBr(id) { const w = G.p.weapons.find(x => x.id === id); return w && w.br; }
function pBr(id) { const x = G.p.passives.find(q => q.id === id); return x && x.br; }
function hasRelic(id) { return G.p.relics.includes(id); }
function relicReady(id) { const R = RELICS[id]; return !hasRelic(id) && owns(R.a) && owns(R.b); }
function itemName(id) { return (WEAPONS[id] || PASSIVES[id]).name; }

/* 강화 3단계 도달 → 분기 대기열 적재 */
function checkBranch(kind, id) {
  const it = kind === 'w' ? G.p.weapons.find(x => x.id === id) : G.p.passives.find(x => x.id === id);
  if (it && it.lvl >= BRANCH_AT && !it.br && !it.brQ) { it.brQ = true; G.pendingBr.push({ kind, id }); }
}
function openBranch() {
  const q = G.pendingBr.shift(), opts = BRANCHES[q.id];
  STATE.mode = 'select'; clearInput();
  G.sel = { kind: 'branch', q, cards: opts.map(o => ({ t: 'branch', id: q.id, k: o.k, kind: q.kind })), banish: false };
  renderSelect(); autoLater();
}
function applyBranch(c) {
  const it = c.kind === 'w' ? G.p.weapons.find(x => x.id === c.id) : G.p.passives.find(x => x.id === c.id);
  it.br = c.k; G.stats.branches.push(c.id + ':' + c.k);
  if (c.id === 'boomerang' && c.k === 'multi') { /* 개수는 wStats에서 반영 */ }
  recalc();
}

/* 보물 상자 — 유물 후보 우선, 없으면 유물 재료 카드, 나머지는 강화 1회 */
function chestCands() {
  const p = G.p, out = [];
  for (const id of RELIC_ORDER) if (relicReady(id)) out.push({ t: 'relic', id });
  if (out.length < 3) for (const id of RELIC_ORDER) {
    const R = RELICS[id]; if (hasRelic(id)) continue;
    for (const [m, o] of [[R.a, R.b], [R.b, R.a]]) if (owns(o) && !owns(m) && !G.banished.has(m)) {
      if (WEAPONS[m] && p.weapons.length < slotW() && catOk(WEAPONS[m].cat) && !out.some(x => x.id === m)) out.push({ t: 'wnew', id: m, mat: id });
      if (PASSIVES[m] && p.passives.length < CFG.slots.passive && !out.some(x => x.id === m)) out.push({ t: 'pnew', id: m, mat: id });
    }
  }
  const ups = shuffle(levelCands().filter(c => c.t === 'wup' || c.t === 'pup'));
  while (out.length < 3 && ups.length) out.push(ups.shift());
  while (out.length < 3) out.push(FILL_CARDS[out.length % 2]);
  return out.slice(0, 3);
}
function openChest() {
  G.pendingChest--; G.stats.chests++; sfx('chest'); jChest();
  STATE.mode = 'select'; clearInput();
  G.sel = { kind: 'chest', cards: chestCands(), banish: false };
  renderSelect(); autoLater();
}

/* 엘리트 */
function scheduleElites() {
  const ph = G.ph, P = curPhase(), span = P.dur || P.fail || 120;
  if (P.goal === 'hunt' || P.goal === 'boss') { ph.elites = []; return; }   // 수문장전 제외 (0.11)                    // 엘리트 사냥은 전용 출현 일정 사용 (0.10)
  const n = Math.random() < ELITE.chance2 ? 2 : 1;
  ph.elites = [];
  for (let i = 0; i < n; i++) ph.elites.push(span * (0.18 + i * 0.4 + rand(0, 0.15)));
}
function spawnElite() {
  const types = ENEMY_ORDER.filter(k => ENEMIES[k].from <= G.time / 60 + 1.5 && k !== 'brute');
  const q = ringPos(20), e = makeEnemy(pick(types.length ? types : ['slime']), q.x, q.y);
  e.elite = pick(ELITE.ab); e.r *= ELITE.size; e.hp = e.maxHp = e.hp * ELITE.hp; e.xp = ELITE.xp; e.dmg *= 1.25;
  if (e.elite === 'haste') e.speed *= 1.7;
  if (e.elite === 'shield') e.sh = e.shMax = e.maxHp * 0.4;
  if (e.elite === 'dash') e.dashT = 2;
  G.stats.elites++;
  toast(`정예 ${ENEMIES[e.type].name} · ${ELITE_AB[e.elite]}`, '#ffd24a');
  return e;
}
function updateEliteSpawn(dt) {
  const ph = G.ph; if (!ph.elites || ph.inGap) return;
  if (ph.elites.length && ph.t >= ph.elites[0]) { ph.elites.shift(); spawnElite(); }
}
/* 엘리트 능력 갱신 (이동 전 호출) — 반환값: 이동 속도 배율 */
function eliteMove(e, dt) {
  if (e.elite !== 'dash') return 1;
  e.dashT -= dt;
  if (e.dashT <= 0) { e.dashT = 3.5; e.tele = 0.6; }
  if (e.tele > 0) { e.tele -= dt; if (e.tele <= 0) e.dashing = 0.5; return 0.1; }
  if (e.dashing > 0) { e.dashing -= dt; return 4; }
  return 1;
}
function eliteKilled(e) {
  G.stats.eliteKills++;
  if (!e.noChest) G.chests.push({ x: e.x, y: e.y, r: 14 });
  phaseEliteKilled(e);
  if (e.elite === 'split') for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; makeEnemy(e.type, e.x + Math.cos(a) * 20, e.y + Math.sin(a) * 20); }
  if (G.p.job) ultGain(8);
}
function updateChests() {
  const p = G.p;
  for (const c of G.chests) if (!c.dead && dist2(c.x, c.y, p.x, p.y) < (c.r + p.r + 4) ** 2) { c.dead = true; G.pendingChest++; fx({ kind: 'ring', x: c.x, y: c.y, r0: 6, r1: 50, dur: 0.4, color: '#ffd24a' }); }
  G.chests = G.chests.filter(c => !c.dead);
}

/* 장판·잔상 등 지면 효과 (화염 장판·불길·잔상) */
function addPool(o) { if (G.pools.length < 60) G.pools.push(Object.assign({ t: 0, tick: 0 }, o)); }
function updatePools(dt) {
  for (const z of G.pools) {
    z.t += dt; z.tick -= dt;
    if (z.tick <= 0) { z.tick = z.every; gridQuery(z.x, z.y, z.r, e => { if (z.slow) e.slowT = Math.max(e.slowT || 0, 0.5); if (!e.cmd || !z.noCmd) damageEnemy(e, z.dmg, { src: z.src, el: z.el }); }); }
  }
  G.pools = G.pools.filter(z => z.t < z.dur);
}

/* 보조 효과 분기 갱신 */
function updatePassiveBranches(dt) {
  const p = G.p, T = G.tm;
  if (passLv('regen')) heal(PASSIVES.regen.per * passLv('regen') * dt);
  if (T.wall > 0) T.wall -= dt;
  if (pBr('magnet') === 'vacuum') { T.vac = (T.vac == null ? 30 : T.vac) - dt; if (T.vac <= 0) { T.vac = 30; for (const g of G.gems) if (dist2(g.x, g.y, p.x, p.y) < 700 * 700) g.mag = true; fx({ kind: 'ring', x: p.x, y: p.y, r0: 10, r1: 160, dur: 0.4, color: '#7fe0ff', follow: true }); } }
  if (pBr('vit') === 'regen') heal(p.maxHp * 0.006 * dt);
  if (pBr('vit') === 'shield' && !p.shield) { T.shield -= dt; if (T.shield <= 0) { p.shield = true; T.shield = 12; } }
  if (pBr('swift') === 'trail' && p.moving) { T.trail -= dt; if (T.trail <= 0) { T.trail = 0.3; addPool({ x: p.x, y: p.y, r: 18, dur: 1.2, every: 0.35, dmg: (8 + passLv('swift') * 2) * p.mod.dmg, src: 'trail', kind: 'trail' }); } }
  if (pBr('haste') === 'charge') { T.charge -= dt; if (T.charge <= 0) { T.charge = 8; for (const w of p.weapons) if (w.id !== 'spin') w.t = Math.min(w.t, 0.05); fx({ kind: 'ring', x: p.x, y: p.y, r0: 8, r1: 40, dur: 0.3, color: '#d6b45a', follow: true }); } }
}

/* 유물 효과 갱신 */
function updateRelics(dt) {
  if (G.tm.storm > 0) G.tm.storm -= dt;
}
