/* ============================================================
   0.60 인물 구조 뼈대 (회차 91, 대규모 재구성 분할 구현 1차)
   기준: docs/DESIGN.md (목표 기획) · docs/characters/<인물>.md
   • 옛 직업 10종·무기 10종·연성 90종 → 인물 8명 + 짝 무기 8종 + 연성 56종 틀로 교체
     (옛 규칙 함수는 이 파일 끝에서 새 함수로 덮어써 실행되지 않음, 옛 코드 파일 삭제는 정리 묶음에서)
   • 짝 무기 8종 기본형 = 8인물 전용 무기의 기본형 (발현·인물 규칙 없음)
   • 인물 선택: 1페이즈 끝 기억 잔영 3명 → 누르면 정보 → 확정, 고른 인물의 무기는 전용 칸으로
   • 인물 각성: 인물 선택 후 돌발 사건 클리어 시 A·B 택1, 순간 궁극기 가득
   • 궁극기: 인물마다 기본 + 각성 A·B 교체 구조, 아직 구현 전 인물은 임시 공통 충격파
   • 연성: 짝 무기 Lv 5 → 연성 카드 (구현된 연성만 등장)
   • 구현 전 인물(impl: false) = '제작 중' 임시 상태 (전용 무기 기본형, 고유 규칙 없음, 임시 궁극기, 옛 직업 그림)
   • 그림: 새 무기 장면은 임시 도형 (최종본 아님, GPT 요청 대상)
   ============================================================ */

/* ---------- 인물 8명 ---------- */
const H60_ORDER = ['berserker', 'rogue', 'archer', 'engineer', 'pyromancer', 'necromancer', 'priest', 'druid'];
// col = UI·효과 표시색 (주색, 너무 어두운 주색은 가독 보정: 도적 = 포인트 청록, 사령술사 = 주색 밝게), c1~c3 = DESIGN 10장 3색
const HERO60 = {
  berserker: { name: '광전사', sub: '분노로 날뛰는 근접 전사', ic: '광', wpn: 'cleave', slots: 5, art: 'warrior', col: '#D23A2E', c1: '#D23A2E', c2: '#5A1414', c3: '#FFB38A',
    rule: '싸우고 맞을수록 투지가 차고, 가득 차면 8초 격노', ult: ['대지 분쇄', '제자리 도약 뒤 착지 충격, 살아남은 적 기절'],
    aw: { A: { nm: '광란', ult: '광란의 포효', ds: '격노가 게이지형으로 바뀌고 더 거세짐' }, B: { nm: '광폭', ult: '분출 강타', ds: '투지가 빨리 차고 짧고 강한 폭주' } } },
  rogue: { name: '도적', sub: '빠른 암살자', ic: '도', wpn: 'dagger', slots: 3, art: 'rogue', col: '#2FC4B2', c1: '#1B1F2E', c2: '#3A4250', c3: '#2FC4B2',
    rule: '무기 칸 3개, 치명타가 나면 그림자가 나타나 거든다', ult: ['그림자 잠행', '2초 동안 맞지 않고 빨라짐, 스친 적을 끝에 확정 치명타'],
    aw: { A: { nm: '각성 A', ult: '그림자 분신', ds: '그림자 연격이 최대 3번까지 이어짐' }, B: { nm: '각성 B', ult: '일섬', ds: '그림자가 그은 자리에 늦게 터지는 상처' } } },
  archer: { name: '궁수', sub: '멈춰 서서 겨누는 사냥꾼', ic: '궁', wpn: 'arrow', slots: 5, art: 'archer', col: '#9BD94A', c1: '#9BD94A', c2: '#7A5530', c3: '#F2F7E6',
    rule: '멈춰 있을 때만 쏘고, 서 있을수록 빨라짐', ult: ['사냥 개시', '하늘로 쏜 화살이 쏟아지고, 5초 동안 이동 중에도 사격'],
    aw: { A: { nm: '매의 눈', ult: '매의 시선', ds: '서 있는 시간에 따라 정지 공속이 더 오름' }, B: { nm: '치고 빠지기', ult: '화살 폭풍', ds: '움직이다 멈춘 직후 첫 발이 부채꼴 3발' } } },
  engineer: { name: '엔지니어', sub: '공장형 포탑 디펜스', ic: '엔', wpn: 'turret', slots: 5, art: 'engineer', col: '#B8652F', c1: '#B8652F', c2: '#5E6670', c3: '#4FA8FF',
    rule: '기계는 사라지지 않고 체력을 가지며, 가까운 적은 기계를 먼저 노림', ult: ['긴급 증설', '포탑 3대 낙하 설치, 모든 기계 수리'],
    aw: { A: { nm: '현장 지휘관', ult: '총지휘', ds: '엔지니어 곁 기계의 공격 속도 증가·수리' }, B: { nm: '전기 울타리', ult: '결전 병기', ds: '영역 테두리를 넘어오는 적 감전' } } },
  pyromancer: { name: '화염술사', sub: '불의 마법사', ic: '화', wpn: 'fireball', slots: 5, art: 'mage', col: '#FF8A1F', c1: '#FF8A1F', c2: '#FFD23F', c3: '#FFF4D6',
    rule: '화염구·연성 무기에 맞은 적이 불붙음', ult: ['화염 해방', '몸 중심 큰 폭발, 범위 안 적 전부 불붙음'],
    aw: { A: { nm: '불 거두기', ult: '불사조', ds: '불붙은 적이 죽으면 불꽃이 돌아와 다음 화염구에 실림' }, B: { nm: '불티', ult: '거대 불덩이', ds: '불붙은 적을 또 맞히면 불티가 튀어 불을 옮김' } } },
  necromancer: { name: '사령술사', sub: '영혼을 거두어 부리는 사람', ic: '사', wpn: 'lamp', slots: 5, art: 'summoner', col: '#9B6FD0', c1: '#5B2A86', c2: '#1F1430', c3: '#9FE3FF',
    rule: '처치 시 영혼이 떨어지고, 주워 모으면 망령이 나와 싸움', ult: ['거대 망령', '큰 망령이 12초 동안 곁에서 낫을 휘두름'],
    aw: { A: { nm: '각성 A', ult: '영혼 방출', ds: '작은 망령 3마리가 무리 지어 싸움' }, B: { nm: '각성 B', ult: '귀속', ds: '강한 망령이 오래 남아 싸움' } } },
  priest: { name: '프리스트', sub: '기도로 빛을 모아 지키고 벌하는 사람', ic: '프', wpn: 'bell', slots: 5, art: 'priest', col: '#E8C35A', c1: '#E8C35A', c2: '#FFF8E7', c3: '#A8D8FF',
    rule: '기도가 3단계 차면 전용·연성 무기 일제 강화 발동 + 보호막', ult: ['하늘의 대종', '거대한 빛의 종이 떨어져 6초 동안 울림'],
    aw: { A: { nm: '넘치는 기도', ult: '여신 강림', ds: '서서 기도하면 더 크게 터짐' }, B: { nm: '맡기는 기도', ult: '심판', ds: '서서 기도하는 동안 다가온 적에게 빛 번개' } } },
  druid: { name: '드루이드', sub: '자연의 수호자, 야수 변신', ic: '드', wpn: 'thorn', slots: 5, art: 'druid', col: '#3E8A45', c1: '#2E6B34', c2: '#6B4A2B', c3: '#E6D86A',
    rule: '1.5초 멈추면 늑대 ↔ 곰 변신 (늑대 = 빠름, 곰 = 단단·넓음)', ult: ['수호목', '거대한 고목이 솟아 가지로 내려침'],
    aw: { A: { nm: '깊어지는 야성', ult: '만월', ds: '같은 형태를 오래 유지할수록 짐승이 커지고 강해짐' }, B: { nm: '자연의 응답', ult: '숲의 부름', ds: '변신하는 순간 주변 땅에서 가시 덩굴 일제 분출' } } },
};
for (const id of H60_ORDER) HERO60[id].impl = false;   // 인물 구현 회차마다 true (고유 규칙·발현·각성·궁극기·연성 채움)
const H60 = id => HERO60[id || (G && G.p && G.p.job)] || null;
const heroImpl60 = id => { const H = H60(id); return !!(H && H.impl); };

/* ---------- 짝 무기 8종 (일반 무기 = 8인물 전용 무기의 기본형, DESIGN 4장) ---------- */
const PW60 = ['cleave', 'dagger', 'arrow', 'turret', 'fireball', 'lamp', 'bell', 'thorn'];
Object.assign(WEAPONS, {
  cleave: { name: '대검', cat: 'melee', ic: '검', desc: '가장 가까운 적 쪽 부채꼴 베기, 밀쳐냄', col: '#ffe0d0',
    base: { dmg: 19, cd: 1.25, range: 86, arc: 1.92, kb: 180 },
    ups: [{ dmg: 0.3 }, { area: 0.15 }, { cd: 0.15 }, { dmg: 0.5, area: 0.1 }] },
  dagger: { name: '단검', cat: 'melee', ic: '단', desc: '가장 가까운 적을 긋기, 적 몸에 상처 선', col: '#e6e8f8', noMotion: true,
    base: { dmg: 14, cd: 0.9, range: 220, n: 1 },
    ups: [{ dmg: 0.3 }, { cd: 0.15 }, { n: 1 }, { dmg: 0.4 }] },
  arrow: { name: '장궁', cat: 'ranged', ic: '궁', desc: '가장 가까운 적에게 화살 1발', col: '#e8f6d0',
    base: { dmg: 16, cd: 1.0, range: 300, n: 1, sp: 540 },
    ups: [{ dmg: 0.3 }, { cd: 0.15 }, { n: 1 }, { dmg: 0.4 }] },
  turret: { name: '포탑 설치', cat: 'ranged', ic: '포', desc: '곁에 포탑 설치, 포탑이 가까운 적 사격 (10초 뒤 사라짐)', col: '#ffd890',
    base: { dmg: 8, cd: 4, n: 3, life: 10, fire: 0.8, range: 240 },
    ups: [{ dmg: 0.3 }, { n: 1 }, { cd: 0.15 }, { dmg: 0.4 }] },
  fireball: { name: '화염구', cat: 'magic', ic: '화', desc: '가장 가까운 적에게 불덩이, 작은 폭발', col: '#ff9a4a',
    base: { dmg: 18, cd: 1.2, range: 260, R: 35, sp: 300 },
    ups: [{ dmg: 0.3 }, { area: 0.2 }, { cd: 0.15 }, { dmg: 0.3, area: 0.1 }] },
  lamp: { name: '영혼 등불', cat: 'magic', ic: '등', desc: '가까운 적과 줄기로 이어져 계속 빨아들임', col: '#b9a4ff', noMotion: true,
    base: { dmg: 5, cd: 0.25, range: 140, n: 1 },
    ups: [{ dmg: 0.3 }, { area: 0.15 }, { n: 1 }, { dmg: 0.4 }] },
  bell: { name: '축복의 종', cat: 'magic', ic: '종', desc: '몸 주위로 음파 고리, 맞은 적 멈칫', col: '#f3e6b0',
    base: { dmg: 12, cd: 3, R: 140, stun: 0.2 },
    ups: [{ dmg: 0.3 }, { area: 0.15 }, { cd: 0.15 }, { dmg: 0.4 }] },
  thorn: { name: '가시 덩굴', cat: 'magic', ic: '덩', desc: '가장 가까운 적 발밑에서 솟아 휘감아 묶음', col: '#9fd47a',
    base: { dmg: 15, cd: 1.3, range: 200, R: 35, n: 1, root: 0.5 },
    ups: [{ dmg: 0.3 }, { area: 0.2 }, { cd: 0.15 }, { n: 1 }] },
});
WEAPON_ORDER.splice(0, WEAPON_ORDER.length, ...PW60);
START_POOL.splice(0, START_POOL.length, ...PW60);
for (const id of PW60) { delete BRANCHES[id]; delete AWAKEN[id]; }   // 일반 무기는 발현·각성 없음 (전용 무기 발현은 인물 구현 때 인물 쪽에 둠)
Object.assign(W_UNIT, { dagger: '긋기', arrow: '화살', turret: '최대 설치', lamp: '줄기', thorn: '덩굴' });
CFG.weaponMax = 5;

/* ---------- 옛 표 → 인물 표 (화면·결과·도감 공용 함수가 읽는 표) ---------- */
JOB_ORDER.splice(0, JOB_ORDER.length, ...H60_ORDER);
for (const id of H60_ORDER) {
  const H = HERO60[id], W = WEAPONS[H.wpn];
  JOBS[id] = { name: H.name, cat: W.cat, ic: H.ic, rule: H.rule, ult: H.ult[0] + ': ' + H.ult[1] };
  JOB_COL[id] = H.col;
  JOB2[id] = ['A', 'B'].map(k => ({ k, nm: H.aw[k].nm, ds: H.aw[k].ds + ' · 궁극기: ' + H.aw[k].ult }));
  ULT_TXT[id] = H.ult.slice();
  JOB_SHORT[id] = H.rule;
  JOB_WX[id] = { pre: '', tag: H.sub, ds: '' };
  FZ_SYMBOL[id] = H.wpn;
  if (UI_JOB_CREST[H.art]) { UI_JOB_CREST[id] = UI_JOB_CREST[H.art]; if (UI_PATH['crest_' + H.art]) UI_PATH['crest_' + id] = UI_PATH['crest_' + H.art]; }
}
// 인물 그림: 아직 새 그림이 없어 옛 직업 그림을 임시로 씀 (광전사 = 전사, 화염술사 = 마법사, 사령술사 = 소환사)
const _getSprite60 = getSprite;
getSprite = function (name, frame, opt) { if (name === 'hero' && opt && HERO60[opt.job]) opt = Object.assign({}, opt, { job: HERO60[opt.job].art }); return _getSprite60(name, frame, opt); };
jobTint = () => null;                                        // 짝 무기는 인물 색으로 물들이지 않음 (전용·연성 무기만 인물 색)

/* ---------- 연성 56종 이름표 (DESIGN 4장) · fire 함수는 인물 구현 때 채움 ---------- */
const FUSE60_NM = {
  berserker: { dagger: '칼자국', arrow: '투기살', turret: '칼무덤', fireball: '분화', lamp: '피의 갈증', bell: '고동', thorn: '투기 가시' },
  rogue: { cleave: '흑풍', arrow: '그림자 표창', turret: '대역 통나무', fireball: '기폭찰 쿠나이', lamp: '그림자 도둑', bell: '숨죽인 파문', thorn: '올가미' },
  archer: { cleave: '초승달촉 화살', dagger: '사냥칼 던지기', turret: '매 횃대', fireball: '불화살', lamp: '미늘 줄화살', bell: '우는살', thorn: '가시줄 화살' },
  engineer: { cleave: '대검 기계병', dagger: '칼날 드론', arrow: '쇠뇌 포대', fireball: '용광로', lamp: '용접 토치', bell: '경보종', thorn: '철조망 발사기' },
  pyromancer: { cleave: '불꽃 대검', dagger: 'X자 불칼금', arrow: '불씨살', turret: '불꽃 정령', lamp: '화염 등불', bell: '뜨거운 숨', thorn: '불넝쿨' },
  necromancer: { cleave: '넋 먹는 칼날', dagger: '넋 가르기', arrow: '꿰뚫는 혼살', turret: '묘비', fireball: '도깨비불', bell: '조종', thorn: '망자의 손' },
  priest: { cleave: '성검', dagger: '십자 긋기', arrow: '갈라지는 빛살', turret: '금빛 촛대', fireball: '성화', lamp: '정화의 등불', thorn: '결박진' },
  druid: { cleave: '앞발 휩쓸기', dagger: '칼잎', arrow: '매 강하', turret: '식충 꽃', fireball: '포자 버섯', lamp: '생명 뿌리', bell: '초롱꽃' },
};
const FUSE60 = {};                                           // FUSE60[인물][짝 무기] = { nm, ds, fire(w, S), cd(w, S)? } — 구현된 연성만 등록
function fuseDef60(j, id) { return FUSE60[j] && FUSE60[j][id] || null; }
function fuseCands60() {
  const p = G.p; if (!p.job || !baseW()) return [];
  return slotWs().filter(w => !w.fu && w.lvl >= CFG.weaponMax && fuseDef60(p.job, w.id));
}
fuseName = (j, id) => (FUSE60_NM[j] && FUSE60_NM[j][id]) || WEAPONS[id].name;

/* ---------- 상태 ---------- */
const F60 = () => G.f60 || (G.f60 = { cuts: [], vines: [], tw: [], links: [], ghosts: null });
const S60 = () => G.stats.h60 || (G.stats.h60 = { hero: null, heroAt: null, cands: null, aw: null, awAt: null, awBy: null, evClear: 0, mob: [0, 0], fuse: 0, tmpUlt: 0 });
const TOUGH60 = { skel: 1, brute: 1, jelly: 1, boar: 1, knight: 1 };   // 단단한 적 (해골 병사급 이상, 2~4번 맞아야 처치)
const _makeEnemy60 = makeEnemy;
makeEnemy = function (type, x, y) { const e = _makeEnemy60(type, x, y); if (G && G.stats && !G.result) S60().mob[TOUGH60[type] ? 1 : 0]++; return e; };

/* ---------- 전환기 임시 보정 (대규모 밸런스 단계에서 제거·재조정) ----------
   옛 직업 규칙·분기·각성·연성 90종이 빠지고 인물·연성이 아직 비어 있는 동안 판 돌파가 가능하도록 일괄 보정
   (짝 무기 기본형은 대부분 단일 대상이라 무리 처리량이 0.58의 약 60% → 무기 피해·출현량·경험치 3가지로 메움) */
const TEMP60 = { dmg: 1.2, spawn: 0.7, xp: 1.25 };
const _phaseSpawnMul60 = phaseSpawnMul;
phaseSpawnMul = function () { return _phaseSpawnMul60.apply(this, arguments) * TEMP60.spawn; };
const _addXp60 = addXp;
addXp = function (v) { return _addXp60(v * TEMP60.xp); };

/* ---------- 무기 수치 (보조 효과 반영, 옛 직업·분기 보정 제거) ---------- */
function wStats(w) {
  const D = WEAPONS[w.id], p = G.p, M = p.mod;
  if (!D) return { dmg: 0, area: 1, cd: 1, n: 1, pierce: 0, rot: 0 };
  const B = D.base, s = { dmg: 0, area: 0, cd: 0, n: 0, pierce: 0 };
  for (let i = 0; i < w.lvl - 1 && i < D.ups.length; i++) for (const k in D.ups[i]) s[k] = (s[k] || 0) + D.ups[i][k];
  let dm = 1, cm = 1;
  const aL = passLv('area'), mL = passLv('multi');
  if (aL) { if (pBr('area') === 'dense') dm *= 1 + 0.12 * aL; else s.area += 0.08 * aL + (pBr('area') === 'giant' ? 0.15 : 0); }
  if (pBr('area') === 'giant') dm *= 1.08;
  if (mL && B.n && w.id !== 'turret') { s.n += multiN(mL) + (pBr('multi') === 'barrage' ? 1 : 0); dm *= 1 + 0.03 * mL + (pBr('multi') === 'velocity' ? 0.2 : 0); if (pBr('multi') === 'barrage') cm *= 1.2; }
  if (pBr('might') === 'pen' && w.id === 'arrow') s.pierce += 1;
  const H = heroStat60(w); dm *= H.dmg; cm *= H.cd;
  return { dmg: B.dmg * (1 + s.dmg) * M.dmg * dm * TEMP60.dmg, area: (1 + s.area) * H.area, cd: (B.cd || 0) * (1 - s.cd) * M.cd * cm, n: (B.n || 1) + s.n, pierce: (B.pierce || 0) + s.pierce, rot: 0 };
}
/* 인물 규칙의 무기 수치 보정 (전용·연성 무기만, 인물 구현 때 HERO60[id].stat(w) 등록) */
function heroStat60(w) { const H = H60(); return H && H.impl && H.stat && (w.base || w.fu) ? Object.assign({ dmg: 1, cd: 1, area: 1 }, H.stat(w)) : { dmg: 1, cd: 1, area: 1 }; }
const wCol60 = w => (w.base || w.fu) && H60() ? H60().col : WEAPONS[w.id].col;
const noBoss60 = e => !(e.gk || e.boss || e.cmd);
function nearN60(x, y, r, n) {
  const L = []; gridQuery(x, y, r, e => { L.push([dist2(x, y, e.x, e.y), e]); });
  L.sort((a, b) => a[0] - b[0]); return L.slice(0, n).map(a => a[1]);
}
function stun60(e, t) { if (!noBoss60(e)) return; const k = e.elite ? 0.5 : 1; e.stg51 = Math.max(e.stg51 || 0, G.time + t * k); e.rec51 = 0.12; }
function root60(e, t) { if (!noBoss60(e)) return; e.frz = Math.max(e.frz || 0, t * (e.elite ? 0.5 : 1)); }

/* ---------- 짝 무기 기본형 발동 (false = 대상 없음, 0.25초 뒤 재시도) ---------- */
const PAIR60 = {
  cleave(w, S) {
    const D = WEAPONS.cleave.base, p = G.p, range = D.range * S.area, arc = D.arc;
    const tg = nearestEnemy(p.x, p.y, range * 1.4); if (!tg) return false;
    sweep60(Math.atan2(tg.y - p.y, tg.x - p.x), arc, range, S.dmg, D.kb, wCol60(w), 'cleave');
  },
  dagger(w, S) {
    const D = WEAPONS.dagger.base, p = G.p, ts = nearN60(p.x, p.y, D.range * S.area, S.n); if (!ts.length) return false;
    const col = wCol60(w);
    for (const e of ts) { cut60(e, col); damageEnemy(e, S.dmg, { src: 'dagger', fx: p.x, fy: p.y }); }
  },
  arrow(w, S) {
    const D = WEAPONS.arrow.base, p = G.p, range = D.range * S.area, tg = nearestEnemy(p.x, p.y, range); if (!tg) return false;
    const a0 = Math.atan2(tg.y - p.y, tg.x - p.x);
    for (let i = 0; i < S.n; i++) shoot({ kind: 'arrow', x: p.x, y: p.y, ang: a0 + (i - (S.n - 1) / 2) * 0.12, sp: D.sp, r: 6, dmg: S.dmg, pierce: S.pierce, life: range / D.sp, color: wCol60(w), src: 'arrow' });
  },
  turret(w, S) {
    const D = WEAPONS.turret.base, p = G.p, F = F60(), mine = F.tw.filter(t => t.w === w);
    if (mine.length >= S.n) return false;
    if (!nearestEnemy(p.x, p.y, 420)) return false;
    let q = null; for (let k = 0; k < 6 && !q; k++) { const a = rand(Math.PI * 2), x = p.x + Math.cos(a) * 34, y = p.y + Math.sin(a) * 34; if (!F.tw.some(t => dist2(t.x, t.y, x, y) < 22 * 22)) q = { x, y }; }
    q = q || { x: p.x + rand(-30, 30), y: p.y + rand(-30, 30) };
    F.tw.push({ w, x: q.x, y: q.y, t: 0, life: D.life, cd: 0.3, a: -Math.PI / 2, col: wCol60(w) });
    fx({ kind: 'ring', x: q.x, y: q.y, r0: 4, r1: 18, dur: 0.25, color: wCol60(w) });
  },
  fireball(w, S) {
    const D = WEAPONS.fireball.base, p = G.p, range = D.range * S.area, tg = nearestEnemy(p.x, p.y, range); if (!tg) return false;
    const col = wCol60(w), a0 = Math.atan2(tg.y - p.y, tg.x - p.x);
    for (let i = 0; i < S.n; i++) shoot({ kind: 'fire', x: p.x, y: p.y, ang: a0 + (i - (S.n - 1) / 2) * 0.25, sp: D.sp, r: 8, dmg: S.dmg, R: D.R * S.area, life: range / D.sp, color: col, src: 'fireball', on44: pr => explode(pr.x, pr.y, pr.R, pr.dmg, 'fireball', col) });
  },
  lamp(w, S) {
    const D = WEAPONS.lamp.base, p = G.p, ts = nearN60(p.x, p.y, D.range * S.area, S.n);
    const prev = w.lk || []; w.lk = ts; w.lkT = G.time;
    if (!ts.length) return false;
    for (const e of ts) damageEnemy(e, S.dmg, { src: 'lamp' });
    if (!prev.length) return 'start';                         // 줄기가 새로 이어질 때만 발동 반응
    return 'tick';
  },
  bell(w, S) {
    const D = WEAPONS.bell.base, p = G.p, R = D.R * S.area;
    if (!nearestEnemy(p.x, p.y, R)) return false;
    gridQuery(p.x, p.y, R, e => { damageEnemy(e, S.dmg, { src: 'bell' }); if (!e.dead) stun60(e, D.stun); });
    if (typeof killSouls === 'function') killSouls(p.x, p.y, R);
    const col = wCol60(w);
    fx({ kind: 'ring', x: p.x, y: p.y, r0: 14, r1: R, dur: 0.32, color: col, follow: true });
    fx({ kind: 'ring', x: p.x, y: p.y, r0: 8, r1: R * 0.72, dur: 0.24, color: col, follow: true });
  },
  thorn(w, S) {
    const D = WEAPONS.thorn.base, p = G.p, ts = nearN60(p.x, p.y, D.range * S.area, S.n); if (!ts.length) return false;
    const col = wCol60(w), R = D.R * S.area, F = F60();
    for (const t of ts) {
      const x = t.x, y = t.y;
      gridQuery(x, y, R, e => { damageEnemy(e, S.dmg, { src: 'thorn' }); if (!e.dead) root60(e, D.root); });
      if (F.vines.length < 40) F.vines.push({ x, y, R, e: t, t: 0, dur: Math.max(0.55, D.root + 0.15), col, s: rand(7) });
    }
  },
};
function sweep60(a0, arc, range, dmg, kb, col, src) {
  const p = G.p;
  gridQuery(p.x, p.y, range, e => { let da = Math.atan2(e.y - p.y, e.x - p.x) - a0; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) <= arc / 2 + 0.15) damageEnemy(e, dmg, { kb, fx: p.x, fy: p.y, src }); });
  if (G.eb && G.eb.length && typeof killSouls === 'function') for (const b of G.eb) {   // 마왕 혼령 추적탄 격추 (0.39 근접 공통)
    if (b.life <= 0 || b.src !== '마왕 혼령') continue; const dx = b.x - p.x, dy = b.y - p.y; if (dx * dx + dy * dy > (range + b.r) ** 2) continue;
    let da = Math.atan2(dy, dx) - a0; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) <= arc / 2 + 0.15) killSouls(b.x, b.y, 1);
  }
  fx({ kind: 'arc', a: a0, arc, r: range, dur: 0.16, color: col, basicArt: 'cleave', artX: p.x, artY: p.y });
}
function cut60(e, col) { const F = F60(); if (F.cuts.length < 60) F.cuts.push({ e, x: e.x, y: e.y, a: rand(-0.9, 0.9) + (Math.random() < 0.5 ? 0 : Math.PI / 2), r: e.r + 6, t: 0, dur: 0.3, col }); }

/* 포탑·장면 갱신 */
function tick60(dt) {
  const F = G.f60; if (!F) return;
  for (const t of F.tw) {
    t.t += dt; if (t.t >= t.life || !G.p.weapons.includes(t.w)) { t.dead = true; continue; }
    t.cd -= dt * ultCdMul(); if (t.cd > 0) continue;
    const w = t.w, S = wStats(w), D = WEAPONS.turret.base, e = nearestEnemy(t.x, t.y, D.range * S.area);
    if (!e) { t.cd = 0.25; continue; }
    t.a = Math.atan2(e.y - t.y, e.x - t.x); t.cd = D.fire * (S.cd / D.cd);
    shoot({ kind: 'arrow', x: t.x, y: t.y - 6, ang: t.a, sp: 520, r: 4, dmg: S.dmg, pierce: 0, life: D.range * S.area / 520, color: t.col, src: 'turret' });
  }
  F.tw = F.tw.filter(t => !t.dead);
  for (const k of ['cuts', 'vines']) { for (const o of F[k]) o.t += dt; F[k] = F[k].filter(o => o.t < o.dur); }
}

/* ---------- 무기 발동 갱신 (옛 연성·직업 발동 경로 대체) ---------- */
function updateWeapons(dt) {
  const p = G.p;
  for (const w of p.weapons) {
    const S = wStats(w);
    w.t -= dt * ultCdMul();
    if (w.t > 0) continue;
    let r;
    const fd = w.fu && fuseDef60(w.fu.job, w.id);
    const hf = !fd && w.base && heroImpl60() && H60().fire;        // 전용 무기: 인물 구현 후 인물 쪽 발동(발현·무기 각성 포함)
    if (fd) r = fd.fire(w, S); else if (hf) r = hf(w, S); else r = (PAIR60[w.id] || (() => false))(w, S);
    w.t = r === false ? 0.25 : typeof r === 'number' ? r : (fd && fd.cd ? fd.cd(w, S) : S.cd);   // 숫자 = 다음 발동까지 시간 직접 지정
    if (r === false) continue;
    if (r !== 'tick') rcFire60(w);
    if (pBr('haste') === 'echo' && w.id !== 'lamp' && Math.random() < 0.12) w.t = 0.05;   // 보조 효과 분기 '연속 발동'
  }
  tick60(dt);
  for (const L of G.later) { L.t -= dt; if (L.t <= 0) { L.done = true; L.f(); } }
  if (G.later.length) G.later = G.later.filter(L => !L.done);
}
function rcFire60(w) {
  if (!WEAPONS[w.id].noMotion || typeof motionState !== 'function') return rcFire(w);
  const m = motionState(), a = m.attack; rcFire(w); m.attack = a;   // 단검·영혼 등불: 캐릭터 몸 동작 없음
}

/* ---------- 인물 규칙 연결점 (구현 전 인물은 전부 기본값) ---------- */
const hook60 = (k, ...a) => { const H = H60(); return H && H.impl && H[k] ? H[k](...a) : undefined; };
function jobDmgMul(e, o) {
  let m = 1, cc = 0, cm = 2;
  if (pBr('might') === 'crit') cc += 0.15;                    // 보조 효과 분기 '치명'
  if (cc && Math.random() < cc) { m *= cm; o.crit = true; }
  if (pBr('might') === 'pen' && (e.r >= 16 || e.elite || e.cmd)) m *= 1.25;
  const h = hook60('dmgMul', e, o); if (h) m *= h;
  return m;
}
function onEnemyHit(e, o) { if (!G.p.job || e.dead) return; hook60('onHit', e, o); }
function onEnemyKill(e) { if (!G.p.job) return; ultKillGain(e); hook60('onKill', e); }
function playerHurtMul() { let m = ultHurtMul(); const h = hook60('hurtMul'); if (h) m *= h; return m; }
function onPlayerHurt() { hook60('onHurt'); }
function playerAvoid() {
  const p = G.p, T = G.tm;
  if (T.inv > 0) return true;
  if (p.shield) { p.shield = false; fx({ kind: 'ring', x: p.x, y: p.y, r0: 10, r1: 34, dur: 0.3, color: '#8fd0ff', follow: true }); p.invT = CFG.player.invuln; return true; }
  if (pBr('swift') === 'dodge' && Math.random() < 0.2) { p.invT = 0.3; fx({ kind: 'ring', x: p.x, y: p.y, r0: 8, r1: 26, dur: 0.25, color: '#c8ffd8', follow: true }); return true; }
  return !!hook60('avoid');
}
heal = function (v, src = '기타') {                          // 옛 사제 초과 회복·성물 추가 발동 제거 (game.js 원형)
  const p = G.p; if (hasCond('noheal')) return; if (hasCurse('blight')) v *= 0.6;
  const b = p.hp; p.hp = Math.min(p.maxHp, p.hp + v);
  const H = G.stats.healBy || (G.stats.healBy = {}); H[src] = (H[src] || 0) + (p.hp - b) / p.maxHp; if (p.hp > b) vfxHeal();
};
function updateJob(dt) {
  const T = G.tm;
  for (const k of ['inv', 'ultWin']) if (T[k] > 0) T[k] -= dt;
  hook60('tick', dt);
  updateUlt(dt); updateUltFx(dt);
}
function updateAltar() { }
function v42Update() { }                                 // 옛 직업 시련 폐지

/* 인물 상태 글자·주기 표시 (상단 화면): 인물 구현 때 HERO60[id].status()·dials() 등록 */
function heroStatus60(sep) { const t = hook60('status'); return t ? sep + t : ''; }
function heroDials60() { return hook60('dials') || []; }

/* ---------- 무기 칸: 기본 5칸 + 전용 칸, 도적 = 전용 포함 3칸 (구현 후 적용) ---------- */
function heroSlotN() { const H = H60(); return H && H.impl ? H.slots - 1 : CFG.slots.weapon; }

/* ---------- 인물 선택: 기억 잔영형 ---------- */
function heroCands60() {
  if (typeof window !== 'undefined' && window.__vtJob && HERO60[window.__vtJob]) {   // 가상 시험 인물 지정 (--job·--jobs): 1순위로 놓고 나머지 무작위
    const rest = shuffle(H60_ORDER.filter(j => j !== window.__vtJob)).slice(0, 2);
    return [window.__vtJob].concat(rest);
  }
  const own = {}; for (const w of G.p.weapons) for (const j of H60_ORDER) if (HERO60[j].wpn === w.id) own[j] = Math.max(own[j] || 0, w.lvl);
  const byLv = shuffle(Object.keys(own)).sort((a, b) => own[b] - own[a]).slice(0, 3);
  const rest = shuffle(H60_ORDER.filter(j => !byLv.includes(j)));
  return byLv.concat(rest).slice(0, 3);
}
jobCands = () => heroCands60().map(id => ({ t: 'job', id }));
function altarCheck() {
  const ph = G.ph, p = G.p;
  if (hasCond('nojob') || p.job || G.h60asked) return;       // 도전 조건 '전직 금지' = 인물 없이 진행
  if (ph.i + 1 >= 1 && ph.i + 1 < ph.order.length) { G.h60asked = true; G.h60q = 'hero'; G.pendingJob2 = true; }
}
function openJob2() {
  G.pendingJob2 = false; G.job2Ready = false;
  const q = G.h60q; G.h60q = null;
  if (q === 'hero' && !G.p.job) return openHero60();
  if (q === 'aw' && G.p.job && !G.p.job2) return openAw60();
}
function openHero60() {
  const p = G.p, ids = heroCands60(), offs = [[-96, -58], [0, -108], [96, -58]];
  STATE.mode = 'select'; clearInput(); G.stats.altarOpen++;
  F60().ghosts = ids.map((id, i) => ({ id, x: p.x + offs[i][0], y: p.y + offs[i][1] }));
  S60().cands = ids.slice();
  G.sel = { kind: 'hero', cards: ids.map(id => ({ t: 'job', id })), pick: -1 };
  sfx('preview'); fx({ kind: 'ring', x: p.x, y: p.y, r0: 20, r1: 160, dur: 0.8, color: '#e8e0ff', follow: true });
  renderSelect(); autoLater();
}
function applyHero60(id) {
  const p = G.p, H = HERO60[id]; if (!H || p.job) return;
  const own = p.weapons.find(w => w.id === H.wpn && !w.fu);
  if (own) p.weapons = p.weapons.filter(w => w !== own);
  p.job = id; p.jobAt = G.ph.i; G.altar = null;
  G.stats.job = id; G.stats.jobAt = Math.round(G.time);
  const b = makeBase(own || { id: H.wpn, lvl: 1, t: 0.3 }); p.weapons.push(b);
  G.stats.base = H.wpn + ':' + b.lvl;
  const S = S60(); S.hero = id; S.heroAt = Math.round(G.time);
  F60().ghosts = null;
  p.ult = JOB_CFG.ultNeed; G.tm.readyAt = G.time;          // 인물 선택 순간 궁극기 가득
  recalc(); hook60('onPick');
  banner(`${H.name} · ${H.sub}`, '동료의 기억이 망토를 이어받음', H.col, 2.2);
  toast(H.impl ? H.rule : `${H.name} · 제작 중 (고유 규칙 준비 중)`, H.col);
  toast(own ? `${WEAPONS[H.wpn].name} Lv ${b.lvl} → 전용 칸` : `전용 무기 ${WEAPONS[H.wpn].name} 획득`, H.col);
  heroBurst60(H.col); if (typeof cine47 === 'function') cine47('job', H.col);
  checkBranch('w', b.id);                                   // 0.61 이미 Lv 3 이상인 무기를 전용 칸으로 가져온 경우 발현 대기
  evRetry60(null);                                          // 0.61 인물 선택 직후 페이즈 돌발 사건 1번 보장
}
applyJob = applyHero60;
function heroBurst60(col) {
  const p = G.p; sfx('ult'); shake(4, 0.3); rcBig(col, 0.4);
  fx({ kind: 'ring', x: p.x, y: p.y, r0: 10, r1: 150, dur: 0.7, color: col, fill: true, follow: true });
  fx({ kind: 'ring', x: p.x, y: p.y, r0: 40, r1: 220, dur: 0.9, color: '#f4eeff', follow: true });
  sparkBurst(p.x, p.y, 120, col);
}

/* ---------- 인물 각성: 인물 선택 후 돌발 사건 클리어 → A·B 택1 ---------- */
const _eventEnd60 = eventEnd;
eventEnd = function (outcome) {
  const c = G.ev && G.ev.cur, r = _eventEnd60(outcome), p = G.p;
  if (c && (outcome === 'ok' || outcome === 'refuse')) {
    S60().evClear++;
    if (p.job && !p.job2 && !G.h60awAsked) { G.h60awAsked = true; G.h60q = 'aw'; G.pendingJob2 = true; S60().awBy = c.type; }
  }
  return r;
};
function openAw60() {
  const j = G.p.job; STATE.mode = 'select'; clearInput();
  G.sel = { kind: 'haw', cards: ['A', 'B'].map(k => ({ t: 'haw', id: j, k })) };
  renderSelect(); autoLater();
}
function applyAw60(k) {
  const p = G.p, H = H60(); if (!H || p.job2 || !H.aw[k]) return;
  p.job2 = k; G.stats.job2 = k; G.stats.job2At = Math.round(G.time);
  const S = S60(); S.aw = k; S.awAt = Math.round(G.time);
  p.ult = JOB_CFG.ultNeed; G.tm.readyAt = G.time;          // 각성 순간 궁극기 가득
  recalc(); hook60('onAwaken', k);
  const A = H.aw[k];
  banner(`인물 각성 · ${A.nm}`, `${H.name} · 궁극기 ${A.ult}`, H.col, 2.2);
  if (!H.impl) toast('각성 효과 제작 중 (궁극기 이름만 교체)', H.col);
  heroBurst60(H.col); if (typeof cine47 === 'function') cine47('job2', H.col);
}
applyJob2 = applyAw60;

/* ---------- 궁극기: 인물별 기본 + 각성 A·B 교체 (구현 전 = 임시 공통 충격파) ---------- */
function ultName60(j) { const H = HERO60[j], k = G.p.job2; return H ? (k && H.aw[k] ? H.aw[k].ult : H.ult[0]) : '궁극기'; }
function useUlt() {
  const p = G.p, j = p.job, H = HERO60[j]; if (!H) return;
  const U = UU(), D = (90 + p.level * 7) * p.mod.dmg;
  p.ult = 0; p.ultRef = 0; G.ultB && (G.ultB.ref = 0); G.stats.ults++; (G.ultAt || (G.ultAt = [])).push(Math.round(G.time)); G.tm.stopT = 0; sfx('ult');
  rcSlow(0.05, UC.stop); rcBig(H.col, 0.42); shake(5, 0.35);
  banner(ultName60(j), p.job2 ? H.aw[p.job2].nm : null, H.col, 1.1);
  U.sum0 = G.stats.dmg.ult || 0; U.on = true; U.hpAt = p.hp;
  const fn = H.impl && H.ultFn && H.ultFn(p.job2 || 'base');
  const dur = (fn || ultTemp60)(p, D, U) || 1;
  U.end = G.time + dur; G.tm.ultWin = Math.max(JOB_CFG.ultWin, dur);
  if (typeof vib48 === 'function') vib48('ult');
}
function ultTemp60(p, D) {                                   // 임시 공통 충격파 (최종본 아님)
  const col = H60().col; S60().tmpUlt++;
  p.invT = Math.max(p.invT, 0.8);
  fx({ kind: 'ring', x: p.x, y: p.y, r0: 46, r1: 8, dur: 0.3, color: col, follow: true });
  uLater(0.3, () => { const R = VIEW.w * 0.45, x = G.p.x, y = G.p.y; shake(8, 0.4); uBlast(x, y, R, D * 2, 420, col); fx({ kind: 'ring', x, y, r0: R * 0.6, r1: R * 1.05, dur: 0.6, color: col }); });
  return 1.2;
}

/* ---------- 연성: 짝 무기 Lv 5 → 연성 카드 (레벨업 1회당 최대 1장, 구현된 연성만) ---------- */
function applyFuse60(id) {
  const p = G.p, w = slotWs().find(x => x.id === id && !x.fu), j = p.job, d = fuseDef60(j, id);
  if (!w || !j) return;
  if (!d) { toast('이 연성은 아직 제작 전', '#ff8a7a'); return; }
  const H = HERO60[j]; w.fu = { job: j, nm: d.nm || fuseName(j, id) }; w.t = 0.3;
  (G.stats.fuses = G.stats.fuses || []).push(`${id}:${j}:${Math.round(G.time)}`); S60().fuse++;
  banner('연성 · ' + w.fu.nm, `${WEAPONS[id].name} + ${WEAPONS[H.wpn].name}`, H.col, 2.4);
  heroBurst60(H.col); if (typeof cine47 === 'function') cine47('fuse', H.col, w);
  recalc();
}
applyFuse = applyFuse60;
function levelCands60() {
  const p = G.p, out = [], ban = G.banished, nW = p.weapons.length, K = CFG.select, b = baseW();
  for (const w of p.weapons) if (!w.fu && w.lvl < CFG.weaponMax && !ban.has(w.id)) out.push({ t: 'wup', id: w.id, w: K.wupW * (nW >= 3 ? K.wupW3 : 1) * (w === b ? BASE_CARD_W : 1) });
  if (nW < slotW()) {
    const nw = WEAPON_ORDER.filter(id => !hasW(id) && !ban.has(id) && catOk(WEAPONS[id].cat)), nk = Math.min(1, K.wnewPool / Math.max(1, nw.length));
    for (const id of nw) out.push({ t: 'wnew', id, w: (nW >= 3 ? K.wnewW3 : K.wnewW) * nk });
  }
  for (const ps of p.passives) if (ps.lvl < CFG.passiveMax && !ban.has(ps.id)) out.push({ t: 'pup', id: ps.id, w: K.pupW });
  if (p.passives.length < CFG.slots.passive) for (const id of PASSIVE_ORDER) if (!hasP(id) && !ban.has(id)) out.push({ t: 'pnew', id, w: K.pnewW });
  return out;
}
levelCands = levelCands60;
function drawCards(n, exclude = []) {
  const same = (a, b) => a.t === b.t && a.id === b.id;
  const pool = levelCands().filter(c => !exclude.some(x => same(x, c))), res = [];
  while (res.length < n && pool.length) { const c = weightedPick(pool); res.push(c); pool.splice(pool.indexOf(c), 1); }
  for (const t of traitCands(exclude.concat(res))) if (res.length < n) res.push(t);
  for (const f of FILL_CARDS) if (res.length < n && !res.some(x => same(x, f)) && !exclude.some(x => same(x, f))) res.push(f);
  const b = baseW(); if (b && res.some(x => x.t === 'wup' && x.id === b.id)) S60().bOff = (S60().bOff || 0) + 1;
  const c = fuseCands60()[0];
  if (c && n === selN() && !exclude.some(x => x.t === 'fuse60') && res.length) { res.splice(res.length - 1, 1); res.unshift({ t: 'fuse60', id: c.id }); }
  return res;
}
const _isFill60 = isFill;
isFill = c => c.t === 'fuse60' || _isFill60(c);
const _cardInfo60 = cardInfo;
cardInfo = function (c) {
  const p = G.p;
  if (c.t === 'job') { const H = HERO60[c.id], W = WEAPONS[H.wpn]; return { k: 'k-job', col: H.col, ic: H.ic, nm: H.name, tag: H.sub + (H.impl ? '' : ' · 제작 중'), ds: `${H.rule}\n궁극기 · ${H.ult[0]}\n전용 무기 · ${W.name}` }; }
  if (c.t === 'haw') { const H = HERO60[c.id], A = H.aw[c.k]; return { k: 'k-job', col: H.col, ic: A.nm.slice(0, 1), nm: A.nm, tag: `${H.name} 인물 각성 ${c.k}` + (H.impl ? '' : ' · 제작 중'), ds: `${A.ds}\n궁극기 · ${A.ult}` }; }
  if (c.t === 'fuse60') { const j = p.job, H = HERO60[j], d = fuseDef60(j, c.id) || {}; return { id: c.id, k: 'k-fuse', col: H.col, ic: WEAPONS[c.id].ic, nm: d.nm || fuseName(j, c.id), tag: `연성 · ${WEAPONS[c.id].name} + ${WEAPONS[H.wpn].name}`, ds: d.ds || '', job: j }; }
  const r = _cardInfo60(c), b = baseW();
  if (r && b && c.t === 'wup' && c.id === b.id) r.tag = r.tag.replace('기본 무기 · ', '전용 무기 · ').replace(/^(?!전용)/, '전용 무기 · ');
  return r;
};
const _cardScore60 = cardScore;
cardScore = c => c.t === 'fuse60' ? 7.5 + rand(0, 1) : _cardScore60(c);
const _applyCard60 = applyCard;
applyCard = function (c) {
  const b = baseW(); if (b && c.t === 'wup' && c.id === b.id) S60().bPick = (S60().bPick || 0) + 1;
  if (c.t !== 'fuse60') return _applyCard60(c);
  if (G.sel && G.sel.kind === 'chest') (G.stats.chestPicks = G.stats.chestPicks || []).push('fuse:' + c.id); else G.stats.picks.push(G.p.level - G.pendingLv + ':fuse:' + c.id);
  applyFuse60(c.id);
};
const _choiceType60 = choiceType;
choiceType = (c, f) => c.t === 'fuse60' ? '연성' : _choiceType60(c, f);
SEL_HEAD.hero = () => ['기억 잔영', '함께 싸울 동료 선택 · 판 끝까지 함께함'];
SEL_HEAD.haw = () => ['인물 각성', `${H60() ? H60().name : ''} · 하나를 선택`];
SEL_HEAD.job2 = SEL_HEAD.haw;

/* ---------- 선택 화면: 기억 잔영 ---------- */
const _renderSelect0_60 = renderSelect0;
renderSelect0 = function () {
  const s = G.sel; if (!s || s.kind !== 'hero') return _renderSelect0_60();
  const p = G.p, Z = VIEW.zoom, cx = p.x - VIEW.cameraW / 2, cy = p.y - VIEW.cameraH / 2, gs = F60().ghosts || [];
  const H = s.pick >= 0 ? HERO60[s.cards[s.pick].id] : null, W = H && WEAPONS[H.wpn], own = H && p.weapons.find(w => w.id === H.wpn);
  const ghosts = gs.map((g, i) => { const G0 = HERO60[g.id], x = (g.x - cx) * Z, y = (g.y - 13 - cy) * Z;
    return `<div class="h60g${s.pick === i ? ' on' : ''}" role="button" tabindex="0" data-g="${i}" style="left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;--hc:${G0.col}" aria-label="${esc(G0.name)}"><span class="ring"></span><span class="nm">${esc(G0.name)}</span></div>`; }).join('');
  const info = H ? `<div class="h60i" style="--hc:${H.col}"><div class="h"><b>${esc(H.name)}</b><span>${esc(H.sub)}</span>${H.impl ? '' : '<em>제작 중</em>'}</div>
      <p><i>규칙</i>${esc(H.rule)}</p><p><i>궁극기</i>${esc(H.ult[0])} · ${esc(H.ult[1])}</p>
      <p><i>전용 무기</i>${esc(W.name)} · ${own ? `보유 Lv ${own.lvl} → 전용 칸으로 이동` : 'Lv 1 지급'}</p>
      <button id="h60ok" class="pri">이 동료와 함께</button></div>`
    : '<div class="h60i hint"><p>잔영을 누르면 정보 확인</p></div>';
  UI.innerHTML = `<div class="layer sel h60"><div class="h60t">${choiceHeading('hero')}<h2>기억 잔영</h2><p class="sub" role="status" aria-live="polite">함께 싸울 동료 선택 · 판 끝까지 함께함</p></div>${ghosts}${info}</div>`;
  UI.querySelectorAll('.h60g').forEach(b => b.addEventListener('click', () => { const i = +b.dataset.g; if (s.pick === i) return; sfx('pick'); s.pick = i; vibe(12); renderSelect0(); }));
  on('h60ok', () => { if (s.pick < 0) return; sfx('pick'); pickCard(s.pick); });
};
const _pickCard60 = pickCard;
pickCard = function (i) {
  const s = G.sel; if (!s) return;
  if (s.kind === 'hero') { const c = s.cards[i]; if (!c) return; applyHero60(c.id); return closeSel(); }
  if (s.kind === 'haw') { const c = s.cards[i]; if (!c) return; applyAw60(c.k); return closeSel(); }
  return _pickCard60(i);
};
const _autoSelect60 = autoSelect;
autoSelect = function () {
  const s = G && G.sel;
  if (!STATE.dev.auto || STATE.dev.semi || STATE.mode !== 'select' || !s || (s.kind !== 'hero' && s.kind !== 'haw')) return _autoSelect60();
  if (s.kind === 'haw') return pickCard(Math.floor(Math.random() * s.cards.length));
  const vt = typeof window !== 'undefined' && window.__vtJob;
  let i = s.cards.findIndex(c => c.id === vt); if (i < 0) i = Math.random() < 0.6 ? 0 : Math.floor(Math.random() * s.cards.length);
  if (s.pick !== i) { s.pick = i; renderSelect0(); setTimeout(() => { if (G && G.sel === s) pickCard(i); }, rand(400, 700) / Math.sqrt(STATE.dev.speed)); return; }
  pickCard(i);
};

/* ---------- 그리기 (임시 도형, 최종본 아님) ---------- */
const _drawWeapons60 = drawWeapons;
drawWeapons = function (c, inView) {
  const r = _drawWeapons60(c, inView), F = G.f60, p = G.p; if (!F) return r;
  c.save();
  for (const t of F.tw) {                                  // 포탑: 받침 + 포신, 사라지기 2초 전 깜빡임
    if (t.life - t.t < 2 && Math.floor(t.t * 8) % 2) c.globalAlpha = 0.45; else c.globalAlpha = Math.min(1, t.t * 5);
    c.fillStyle = '#4a4036'; c.strokeStyle = t.col; c.lineWidth = 2;
    c.beginPath(); c.arc(t.x, t.y, 9, 0, 7); c.fill(); c.stroke();
    c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(t.x, t.y - 2); c.lineTo(t.x + Math.cos(t.a) * 12, t.y - 2 + Math.sin(t.a) * 12); c.stroke();
  }
  c.globalAlpha = 1;
  for (const w of p.weapons) if (w.id === 'lamp' && !w.fu && w.lk && w.lk.length && G.time - w.lkT < 0.35) {   // 연성된 등불은 인물 쪽에서 그림   // 영혼 줄기: 적 → 등불로 흐르는 물결선
    const col = wCol60(w), hx = p.x + 10, hy = p.y - 12;
    c.fillStyle = col; c.globalAlpha = 0.9; c.beginPath(); c.arc(hx, hy, 4 + Math.sin(G.time * 9), 0, 7); c.fill();
    c.strokeStyle = col; c.lineWidth = 2.2; c.lineCap = 'round';
    for (const e of w.lk) { if (e.dead) continue; c.globalAlpha = 0.75; c.beginPath(); const dx = hx - e.x, dy = hy - e.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
      for (let k = 0; k <= 10; k++) { const u = k / 10, wv = Math.sin(u * 9 + G.time * 14) * 5 * Math.sin(u * Math.PI), x = e.x + dx * u + nx * wv, y = e.y + dy * u + ny * wv; k ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke(); }
  }
  for (const o of F.vines) {                                // 가시 덩굴: 발밑에서 가시가 솟고 몸 아래를 감는 고리
    const k = o.t / o.dur, up = Math.min(1, o.t / 0.12), x = o.e && !o.e.dead ? o.e.x : o.x, y = o.e && !o.e.dead ? o.e.y : o.y, er = o.e ? o.e.r : 10;
    c.globalAlpha = k > 0.75 ? (1 - k) / 0.25 : 1; c.strokeStyle = o.col; c.fillStyle = o.col; c.lineWidth = 2.5;
    for (let i = 0; i < 5; i++) { const a = o.s + i * 1.256, bx = x + Math.cos(a) * er * 0.9, by = y + er * 0.55 + Math.sin(a) * er * 0.35, h = (10 + (i % 2) * 6) * up;
      c.beginPath(); c.moveTo(bx - 3, by); c.lineTo(bx, by - h); c.lineTo(bx + 3, by); c.closePath(); c.fill(); }
    c.beginPath(); c.ellipse(x, y + er * 0.45, er + 4, (er + 4) * 0.4, 0, 0, Math.PI * 2 * Math.min(1, o.t / 0.2)); c.stroke();
  }
  for (const o of F.cuts) {                                 // 단검: 적 몸에 상처 선
    const k = o.t / o.dur, x = o.e && !o.e.dead ? o.e.x : o.x, y = o.e && !o.e.dead ? o.e.y : o.y, L = o.r * Math.min(1, o.t / 0.06);
    c.globalAlpha = 1 - k; c.strokeStyle = o.col; c.lineWidth = 3 * (1 - k * 0.5); c.lineCap = 'round';
    c.beginPath(); c.moveTo(x - Math.cos(o.a) * L, y - Math.sin(o.a) * L); c.lineTo(x + Math.cos(o.a) * L, y + Math.sin(o.a) * L); c.stroke();
  }
  c.restore();
  return r;
};
const _drawGrowthGround60 = drawGrowthGround;
drawGrowthGround = function (c, inView) {
  const r = _drawGrowthGround60(c, inView), F = G.f60;
  if (F && F.ghosts && G.sel && G.sel.kind === 'hero') {   // 기억 잔영: 반투명 동료 모습 + 발밑 빛
    c.save();
    F.ghosts.forEach((g, i) => {
      const H = HERO60[g.id], on = G.sel.pick === i, bob = Math.sin(performance.now() / 420 + i * 2) * 2;
      c.globalAlpha = on ? 0.5 : 0.28; c.fillStyle = H.col; c.beginPath(); c.ellipse(g.x, g.y + 2, 22, 8, 0, 0, 7); c.fill();
      c.globalAlpha = on ? 1 : 0.78; drawSprite(c, 'hero', 0, g.x, g.y + bob, { job: g.id });
      c.globalAlpha = on ? 1 : 0.6; c.fillStyle = '#1a1626'; c.strokeStyle = H.col; c.lineWidth = 1.5;
      c.beginPath(); c.arc(g.x + 16, g.y - 26 + bob, 7, 0, 7); c.fill(); c.stroke();
      c.fillStyle = H.col; c.font = '700 8px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(WEAPONS[H.wpn].ic, g.x + 16, g.y - 26 + bob);
    });
    c.restore();
  }
  return r;
};

/* 새 짝 무기 아이콘 그림이 없을 때: 무기 글자 아이콘 (임시, 최종본 아님) */
const _iconCanvas60 = iconCanvas, IC60 = new Map();
iconCanvas = function (id, t) {
  const r = _iconCanvas60(id, t); if (r || !WEAPONS[id] || !PW60.includes(id)) return r;
  const k = id + '|' + t; let cv = IC60.get(k);
  if (!cv) { cv = document.createElement('canvas'); cv.width = cv.height = 14 * t; const c = cv.getContext('2d'); c.fillStyle = WEAPONS[id].col; c.font = `700 ${Math.round(9 * t)}px ${UI_ART.font}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(WEAPONS[id].ic, cv.width / 2, cv.height / 2 + 0.5 * t); IC60.set(k, cv); }
  return cv;
};

/* ---------- 내 능력·도감 ---------- */
function abilW55() {
  const p = G.p, ws = p.weapons.slice().sort((a, b) => (b.base ? 1 : 0) - (a.base ? 1 : 0));
  if (!ws.length) return '<p class="hint">보유 무기 없음</p>';
  return ws.map(w => {
    const d = WEAPONS[w.id], col = w.fu || w.base ? JOB_COL[p.job] : CFG.colors[d.cat], fd = w.fu && fuseDef60(w.fu.job, w.id);
    return cxCard({ id: w.id, col, ic: d.ic, nm: wName(w.id), tag: (w.base ? '전용 무기 · ' : w.fu ? '연성 · ' : '') + 'Lv ' + w.lvl,
      lines: [esc(fd ? fd.ds || '' : d.desc), wChips55(w, null, null), !w.fu && w.lvl < CFG.weaponMax ? '' : !w.base && !w.fu && p.job && FUSE60_NM[p.job] && FUSE60_NM[p.job][w.id] ? `<i>연성</i> ${esc(FUSE60_NM[p.job][w.id])}${fuseDef60(p.job, w.id) ? '' : ' (제작 중)'}` : ''] });
  }).join('');
}
function abilJ55() {
  const p = G.p;
  if (!p.job) return '<p class="hint">인물 선택 전 · 첫 페이즈가 끝나면 동료의 기억 중 하나를 선택</p>';
  const H = HERO60[p.job], A = p.job2 && H.aw[p.job2], b = baseW(), n = fusedWs().length;
  const det = [['고유 규칙', H.rule + (H.impl ? '' : ' (제작 중)')], ['궁극기 · ' + ultName60(p.job), A ? A.ds : H.ult[1]], A ? ['인물 각성 · ' + A.nm, A.ds] : ['인물 각성', '돌발 사건을 클리어하면 2종 중 선택'], ['연성', '짝 무기 Lv 5에 레벨업 선택지로 연성 카드 등장']];
  return cxCard({ job: p.job, col: H.col, ic: H.ic, nm: H.name + (A ? ' · ' + A.nm : ''), tag: H.sub + (H.impl ? '' : ' · 제작 중'),
    lines: [`<b>${esc(H.rule)}</b>`, cxChips([['궁극기', esc(ultName60(p.job))], b ? ['전용 무기', esc(wName(b.id))] : null, ['연성', String(n)]]), cxDet55('상세', det)] });
}
ABIL_TABS[2] = ['j', '인물'];
function cxJob(id, seen) {
  const H = HERO60[id], W = WEAPONS[H.wpn], F = FUSE60_NM[id];
  return cxCard({ dim: !seen, job: id, col: H.col, ic: H.ic, nm: H.name, tag: H.sub + (H.impl ? '' : ' · 제작 중'), lines: [`<b>${esc(H.rule)}</b>`, cxChips([['궁극기', esc(H.ult[0])], ['전용 무기', esc(W.name)]]),
    `<details class="acc"><summary>상세</summary><div class="cxg"><div><b>궁극기 ${esc(H.ult[0])}</b><span>${esc(H.ult[1])}</span></div>${['A', 'B'].map(k => `<div><b>인물 각성 ${k} · ${esc(H.aw[k].nm)}</b><span>${esc(H.aw[k].ds)} · 궁극기 ${esc(H.aw[k].ult)}</span></div>`).join('')}<div><b>연성 7종</b><span>${esc(Object.keys(F).map(k => F[k]).join(' · '))}</span></div></div></details>`] });
}
const _cxWeapon60 = cxWeapon;
cxWeapon = function (id, seen) {                           // 짝 무기 카드: 인물별 연성 이름 (펼침)
  const h = _cxWeapon60(id, seen); if (!PW60.includes(id)) return h;
  const own = H60_ORDER.find(j => HERO60[j].wpn === id), rows = H60_ORDER.filter(j => FUSE60_NM[j][id]).map(j => `<div><b>${esc(FUSE60_NM[j][id])}</b><span>${esc(HERO60[j].name)} · ${esc(WEAPONS[HERO60[j].wpn].name)} + ${esc(WEAPONS[id].name)}${fuseDef60(j, id) ? '' : ' · 제작 중'}</span></div>`).join('');
  const add = `<p><i>전용 무기</i> ${esc(HERO60[own].name)}</p><details class="acc"><summary>인물별 연성 7종</summary><div class="cxg">${rows}</div></details>`;
  return h.replace(/<\/div>$/, add + '</div>');
};
function cxFuse() {
  const rows = H60_ORDER.map(j => { const H = HERO60[j], F = FUSE60_NM[j];
    return cxCard({ job: j, col: H.col, ic: H.ic, nm: H.name, tag: '연성 7종 · 전용 무기 ' + WEAPONS[H.wpn].name, lines: [`<details class="acc"><summary>연성 7종</summary><div class="cxg">${PW60.filter(id => F[id]).map(id => `<div><b>${esc(F[id])}</b><span>${esc(WEAPONS[id].name)} + ${esc(WEAPONS[H.wpn].name)}${fuseDef60(j, id) ? '' : ' · 제작 중'}</span></div>`).join('')}</div></details>`] }); }).join('');
  return '<p class="hint">인물 선택 후 무기 칸의 짝 무기가 Lv 5가 되면 레벨업에 연성 카드 등장 · 그 칸이 인물 고유 연성 무기로 변신</p>' + rows;
}

/* ---------- 0.61 전용 무기 발현(Lv 3, A·B 택1) → 무기 각성(Lv 5, 고른 발현에 묶여 자동) ----------
   인물 구현 때 HERO60[id].br = [{ k: 'A', nm, ds }, { k: 'B', nm, ds }], HERO60[id].wak = { A: { nm, ds }, B: { nm, ds } } 등록
   짝 무기(일반 무기)는 발현·각성 없음 → 전용 칸(w.base)일 때만 대기열에 올림 */
const _checkBranch60 = checkBranch;
checkBranch = function (kind, id) {
  if (kind !== 'w' || !PW60.includes(id)) return _checkBranch60(kind, id);
  const it = wObj(id), H = H60(); if (!it || !it.base || !H || !H.impl || !H.br) return;
  if (it.lvl >= BRANCH_AT && !it.br && !it.brQ) { BRANCHES[id] = H.br; it.brQ = true; G.pendingBr.push({ kind, id }); }
  if (it.lvl >= AW43 && it.br && !it.aw && H.wak && H.wak[it.br]) applyWak60(it);
};
function applyWak60(w) {                                   // 무기 각성: 선택 없이 고른 발현의 다음 단계로
  const H = H60(), A = H.wak[w.br]; w.aw = w.br; G.stats.branches.push(w.id + ':aw:' + w.aw);
  banner('무기 각성 · ' + A.nm, `${WEAPONS[w.id].name} · ${A.ds}`, H.col, 1.8); sfx('ult');
  fx({ kind: 'ring', x: G.p.x, y: G.p.y, r0: 10, r1: 120, dur: 0.6, color: H.col, follow: true });
  if (typeof cine47 === 'function') cine47('awaken', H.col, w);
  hook60('onWak', w); recalc();
}
const _applyBranch60 = applyBranch;
applyBranch = function (c) {
  const w = c.kind === 'w' && !c.aw && wObj(c.id), H = H60();
  if (!w || !w.base || !H || !H.br) return _applyBranch60(c);
  w.br = c.k; G.stats.branches.push(c.id + ':' + c.k);
  const o = H.br.find(x => x.k === c.k);
  banner('발현 · ' + o.nm, `${WEAPONS[c.id].name} · ${o.ds}`, H.col, 1.6);
  hook60('onBranch', w); recalc();
  checkBranch('w', c.id);                                  // 발현 고르기 전에 이미 Lv 5면 바로 무기 각성
};
const _cardInfoBr60 = cardInfo;
cardInfo = function (c) {
  const r = _cardInfoBr60(c), w = c.t === 'branch' && !c.aw && wObj(c.id), H = H60();
  if (r && w && w.base && H && H.br) { r.col = H.col; r.tag = '전용 무기 발현 · ' + WEAPONS[c.id].name; const A = H.wak && H.wak[c.k]; if (A) r.ds += `\nLv 5 무기 각성 · ${A.nm}`; }
  return r;
};
const _selHeadBr60 = SEL_HEAD.branch;
SEL_HEAD.branch = s => { const w = s.q && !s.q.aw && wObj(s.q.id); return w && w.base && H60() && H60().br ? ['발현', `${WEAPONS[s.q.id].name} Lv ${BRANCH_AT} · 전용 무기 발현 1종 선택`] : _selHeadBr60(s); };
/* 이동 속도·그리기 연결점: HERO60[id].spdMul()·draw(c)·drawBody(c, fn) */
const _ultSpdMul60 = ultSpdMul;
ultSpdMul = function () { const h = hook60('spdMul'); return _ultSpdMul60() * (h || 1); };
const _drawWeaponsH60 = drawWeapons;
drawWeapons = function (c, inView) { const r = _drawWeaponsH60(c, inView); if (G.p.job) { c.save(); hook60('draw', c); c.restore(); } return r; };
const _drawPlayerH60 = drawPlayer;
drawPlayer = function (c) { const H = H60(); if (H && H.impl && H.drawBody) return H.drawBody(c, () => _drawPlayerH60.apply(this, arguments)); return _drawPlayerH60.apply(this, arguments); };

/* ---------- 0.61 인물 각성 기회 보장 (회차 92 결정) ----------
   인물 선택 직후 페이즈에 돌발 사건 1번 보장, 각성 전 돌발 사건을 놓치면(실패·무시) 다음 일반 페이즈에 다른 종류가 다시 나옴 */
function evRetry60(avoid) {
  const E = G.ev, ph = G.ph, p = G.p; if (!E || !p.job || p.job2) return;
  const k = ph.i + 1; if (k >= ph.order.length - 1) return;   // 마지막(수문장) 페이즈 제외
  if (E.plan.some(q => q.i === k)) return;
  const types = Object.keys(EVENTS).filter(t => t !== avoid), type = types[Math.floor(Math.random() * types.length)];
  E.plan.push({ i: k, type, at: rand(EV_CFG.at[0], EV_CFG.at[1]), retry60: 1 }); E.plan.sort((a, b) => a.i - b.i);
  const S = S60(); S.evAdd = (S.evAdd || 0) + 1;
}
const _eventEndR60 = eventEnd;
eventEnd = function (outcome) {
  const c = G.ev && G.ev.cur, r = _eventEndR60(outcome);
  if (c && outcome !== 'ok' && outcome !== 'refuse') evRetry60(c.type);
  return r;
};

/* ---------- 저장 변환: 옛 직업 도감 기록 → 인물 (전사 → 광전사, 마법사 → 화염술사, 소환사 → 사령술사), 시간술사·군주·옛 무기 기록은 보관만 ---------- */
(function () {
  try {
    const s = JSON.parse(localStorage.getItem(CFG.SAVE_KEY) || 'null'); if (!s || s.h60) return;
    const M = { warrior: 'berserker', mage: 'pyromancer', summoner: 'necromancer' };
    if (Array.isArray(s.seenJ)) { s.seenJ0 = s.seenJ.slice(); s.seenJ = Array.from(new Set(s.seenJ.map(j => M[j] || j).filter(j => HERO60[j]))); }
    if (Array.isArray(s.seenW)) { s.seenW0 = s.seenW.slice(); s.seenW = s.seenW.filter(id => PW60.includes(id)); }
    s.h60 = 1; localStorage.setItem(CFG.SAVE_KEY, JSON.stringify(s));
  } catch (e) { }
})();
const _metaSave60 = metaSave;
metaSave = function (s) { if (s) s.h60 = 1; return _metaSave60.apply(this, arguments); };   // 새 저장도 변환 완료 표시 (다시 열 때 중복 변환 없음)

/* ---------- 치트 패널: 인물·각성 바로가기 ---------- */
function dev57JobPick() {
  if (!dev57Play()) return;
  if (G.p.job) { toast('이미 인물 선택 완료 · 새 판에서 사용', '#c49aff'); return; }
  dev57Fit(DEV57.lvJob); G.h60asked = true; G.h60q = 'hero'; G.pendingJob2 = true;
  toast('인물 선택 · 기억 잔영', '#c49aff');
}
function dev57JobAwk() {
  if (!dev57Play()) return;
  if (G.p.job2) { toast('이미 인물 각성 완료', '#c49aff'); return; }
  if (!G.p.job) applyHero60(heroCands60()[0]);
  dev57Fit(DEV57.lvAwk); G.h60awAsked = true; G.h60q = 'aw'; G.pendingJob2 = true;
}

/* ---------- 화면 모양 ---------- */
(function () {
  if (typeof document === 'undefined') return;
  const st = document.createElement('style');
  st.textContent = `#ui>.layer.sel.h60{background:linear-gradient(180deg,rgba(14,18,30,.55),rgba(14,18,30,0) 26%,rgba(14,18,30,0) 58%,rgba(14,18,30,.78));justify-content:space-between;padding:calc(env(safe-area-inset-top) + 14px) 12px calc(env(safe-area-inset-bottom) + 14px);box-sizing:border-box}
.h60t{box-sizing:border-box;width:100%;max-width:380px;display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;padding:10px 12px;border-radius:12px;background:rgba(19,22,35,.94);border:1px solid var(--line)}
.h60t h2{margin:0}
.h60g{position:absolute;width:64px;height:80px;margin:-28px 0 0 -32px;cursor:pointer;-webkit-tap-highlight-color:transparent;display:flex;flex-direction:column;align-items:center;justify-content:flex-end}
.h60g .ring{position:absolute;left:4px;top:0;width:56px;height:56px;border-radius:50%;border:2px dashed var(--hc);opacity:.55;box-sizing:border-box}
.h60g.on .ring{border-style:solid;opacity:1;box-shadow:0 0 14px var(--hc)}
.h60g .nm{font-size:12px;font-weight:700;color:#fff;background:rgba(14,18,30,.78);border:1px solid var(--hc);border-radius:8px;padding:1px 6px;white-space:nowrap}
.h60i{box-sizing:border-box;width:100%;max-width:380px;display:flex;flex-direction:column;gap:6px;padding:12px 14px;border:1px solid var(--hc,var(--line));border-radius:12px;background:rgba(19,22,35,.94)}
.h60i.hint{align-items:center;color:var(--muted)}
.h60i .h{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 8px}
.h60i .h b{font-size:17px;color:var(--hc)}
.h60i .h span{font-size:13px;color:var(--muted)}
.h60i .h em{font-style:normal;font-size:11px;padding:1px 6px;border-radius:6px;border:1px solid #8a86a0;color:#cfc9e6}
.h60i p{margin:0;font-size:13px;line-height:1.45}
.h60i p i{font-style:normal;color:var(--muted);margin-right:6px}
.h60i button{min-height:44px;margin-top:4px}`;
  document.head.appendChild(st);
})();
