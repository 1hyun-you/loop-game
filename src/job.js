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
  mage: { name: '화염술사', cat: 'magic', ic: '화', rule: '서로 다른 속성 마법을 연달아 맞히면 원소 반응 폭발', ult: '운석: 적 밀집 지점에 큰 폭발' },
  summoner: { name: '소환사', cat: 'magic', ic: '소', rule: '처치한 적 12% 확률로 망령 소환 (최대 6), 망령이 적 추적 공격', ult: '망령 군단: 망령 8체 즉시 소환' },
  /* 3단계 추가 4종 (0.9) — 초안 직업 목록 기준, 드루이드는 혼합 계열(근접+마법) */
  sovereign: { name: '군주', cat: 'melee', ic: '군', rule: '10초마다 발밑에 군기 설치, 군기 반경 안에서 피해 +25%·받는 피해 -15%', ult: '왕의 호령: 5초간 모든 적 둔화 50%, 무기 재사용 2배 속도' },
  chrono: { name: '시간술사', cat: 'ranged', ic: '시', rule: '원거리 명중 시 적 시간 지연(둔화) 누적, 5중첩 시 1.5초 정지', ult: '과거의 나: 1.5초 시간 정지, 5초 전 자신의 잔상이 지나온 길을 되감아 달리며 닿은 적 피해·둔화, 끝나면 5초 전 체력으로 되돌림(낮아진 경우)' },
  priest: { name: '프리스트', cat: 'magic', ic: '프', rule: '처치 40회마다 정화: 체력 4% 회복 + 주변 신성 폭발', ult: '성역: 6초간 성역 안 적 지속 피해, 플레이어 초당 체력 5% 회복' },
  druid: { name: '드루이드', cat: 'hybrid', cats: ['melee', 'magic'], ic: '드', rule: '야수 동료 늑대·곰 동행, 늑대 8초마다 울부짖음(주변 둔화), 곰 10초마다 강타(충격파), 피해·범위·이동 속도·재사용 보조 효과가 동료에게도 적용', ult: '대자연의 분노: 8초간 동료 피해 2배·공격 속도 1.5배, 주변 덩굴 장판' },
};
const JOB_ORDER = ['warrior', 'rogue', 'sovereign', 'archer', 'engineer', 'chrono', 'mage', 'summoner', 'priest', 'druid'];
CAT_NAME.hybrid = '혼합';
const jobCats = id => JOBS[id].cats || [JOBS[id].cat];
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
  priest: [{ k: 'judge', nm: '심판관', ds: '정화 폭발 피해 2배·범위 +35%' }, { k: 'saint', nm: '성자', ds: '정화 필요 처치 24회, 회복량 9%' }],
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
/* 후보 3종: 주력 계열 2종(혼합 직업은 두 계열 모두 보유 시 주력 후보 포함) + 다른 계열 1종 (0.9 10직업 확장) */
function jobCands() { }   // 선언 유지 (본문은 뒤 파일 대입으로 교체)

/* ---------- 제단 ---------- */
function offerWeapon(id) {
  const p = G.p; if (p.weapons.length < 2) return;
  p.weapons = p.weapons.filter(w => w.id !== id); G.stats.offers++;
  recalc();
  G.sel.cards = jobCands(G.sel.cards.map(c => c.id)); G.sel.offer = false;
  toast(`${WEAPONS[id].name} 봉헌`, '#d9a8ff'); renderSelect(); autoLater();
}
function leaveAltar() { G.altar = null; G.sel = null; hideUI(); STATE.mode = 'play'; G.stats.altarLeave++; toast('제단을 떠남 · 다음 페이즈 뒤 재등장', '#bfb6d6'); }
function applyJob() { }   // 선언 유지 (본문은 뒤 파일 대입으로 교체)
function applyJob2() { }   // 선언 유지 (본문은 뒤 파일 대입으로 교체)

/* ---------- 피해·피격 연계 ---------- */
const ELEM = { icering: 'ice', shatter: 'ice', mbolt: 'arcane', nova: 'arcane', firetrap: 'fire', fireball: 'fire', fireball_pool: 'fire', flame: 'fire', firefield: 'fire', lightning: 'bolt', chain: 'bolt', thunder: 'bolt', frost: 'ice', meteor: 'fire' };
const RANGED_SRC = { knife: 1, trap: 1, arrow: 1, split: 1, boomerang: 1, longbow: 1, turret: 1, dagger: 1, rain: 1 };
/* 피격 직전 판정: true 반환 시 피해 무효 */

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
/* 0.9 직업 보조 함수 */
function inBanner() { const b = G.banner, p = G.p, r = b ? b.r * ultBannerR() : 0; return !!(b && dist2(b.x, b.y, p.x, p.y) < r * r) || ultInBanner(); }   // 0.32 호령 반경 2배·정복왕 추가 군기
function addMinion(x, y) { G.stats.maxMinions = Math.max(G.stats.maxMinions || 0, G.minions.length + 1); G.minions.push({ id: ++G.pid, x, y, r: G.p.job2 === 'lord' ? 9 : 7, life: 20, hitT: 0 }); }

/* ---------- 궁극기 ---------- */
function ultGain(v, src = 'etc') { const p = G.p; if (tr('focus')) v *= 1.15; if (!p.job || p.ult >= JOB_CFG.ultNeed) return; const U0 = p.ult; p.ult = Math.min(JOB_CFG.ultNeed, p.ult + v); const UB = G.stats.ultBy || (G.stats.ultBy = {}); UB[src] = (UB[src] || 0) + p.ult - U0; if (p.ult >= JOB_CFG.ultNeed) { G.tm.readyAt = G.time; toast(autoUltSetting() ? '궁극기 준비 · 적이 몰리면 자동' : '궁극기 준비 · 버튼으로 발동', '#ffe08a'); } }
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
/* 망령: 서로 다른 적 분산 공격 (0.26) — 표적 유지·미점유 적 우선·망령 간 간격 유지, 적 없으면 주인 주변 선회 */

/* ---------- 직업 전용 무기 ---------- */

/* ---------- 직업 갱신 (매 틱) ---------- */
