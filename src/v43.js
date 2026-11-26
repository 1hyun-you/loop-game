/* ============================================================
   0.43 연성 재설계 (회차 48·49 확정, 표현·보강 단계)
   • 무기 10종 체제: 대응 직업 없는 8종(회전검·창·철퇴·부메랑 도끼·투척 단검·폭탄·번개·회오리) 등장 제외, 코드 보존
   • 무기 최고 Lv 5 (Lv 3 분기 · Lv 5 각성), 기존 Lv 6 강화분은 Lv 5에 합산
   • 전직 후보: 보유 무기에 대응하는 직업만 최대 3 (대응 0개면 무작위 3)
   • 전직 시 상징 무기 → 기본 무기 칸 (무기 칸 미점유, 미보유 시 Lv 1 지급) · 직업 표시 병기
   • 연성: 무기 칸 무기 Lv 5(각성 완료) + 기본 무기 Lv 5(각성 완료) → 레벨업 선택지에 연성 카드 (레벨업 1회당 최대 1장)
     선택 시 해당 칸이 직업 특화 연성 무기로 변신 · 재료 분기·각성 계승 · 직업 뼈대 규칙 10종 × 짝 무기 효과
   • 기본 무기 단독 발동: 무기 칸 전부 연성 전까지 유지
   • 직업 시련 → 2차 전직 조건 (미달 시 전직 후 3페이즈 돌파로 대체)
   • 0.42 연성 1차 구조(시련 완수 → Lv 6 무기 2종 결합) 폐지
   • 연성 연출·뼈대 외형은 임시 도형 (최종본 아님, 시험 확인 후 GPT 요청 대상)
   ============================================================ */
const W43 = ['cleave', 'shield', 'slam', 'arrow', 'shuriken', 'trap', 'fireball', 'icering', 'orb', 'beam'];
WEAPON_ORDER.splice(0, WEAPON_ORDER.length, ...WEAPON_ORDER.filter(id => W43.includes(id)));
START_POOL.splice(0, START_POOL.length, 'cleave', 'shield', 'arrow', 'shuriken', 'fireball', 'orb');
CFG.weaponMax = 5;
const AW43 = 5;
for (const id in WEAPONS) { const u = WEAPONS[id].ups; if (u.length > 4) { const a = u[3], b = u[4]; for (const k in b) a[k] = (a[k] || 0) + b[k]; u.length = 4; } }   // Lv 6 강화분 → Lv 5 합산
/* 직업 색 겹침 보정 (Lab 거리 25 미만 3쌍: 기술자·프리스트, 마법사·소환사, 궁수·드루이드) */
Object.assign(JOB_COL, { archer: '#d4f56a', engineer: '#e0a86a', mage: '#f5a8e0', summoner: '#a890ff', druid: '#6cc870' });

/* ---------- 직업 뼈대 규칙 10종 ---------- */
const JOB43 = {
  warrior: { pre: '거신', nm: '거신화', ds: '연성 무기를 2배 크기로 휘두름 · 투지 비례 추가 확대', cd: 1.1 },
  rogue: { pre: '그림자', nm: '그림자 분담', ds: '분신 2체가 플레이어 궤적을 따라가며 연성 무기와 기본 무기를 나눠 발동' },
  sovereign: { pre: '왕실', nm: '왕의 병기', ds: '근위병(없으면 전방 3열 진형)이 연성 무기를 들고 동시 공격' },
  archer: { pre: '사냥', nm: '사냥 화살', ds: '연성 무기를 화살촉에 장착, 고속 사출 후 다음 적으로 꺾여 최대 3연속 명중 · 표식 +1' },
  engineer: { pre: '포대', nm: '병기 포대', ds: '연성 무기를 탑재한 대형 포대 설치, 6발마다 미사일 3연발' },
  chrono: { pre: '메아리', nm: '시간 메아리', ds: '연성 무기 공격이 1초 뒤 같은 자리에서 반복 · 정지한 적에게 반복 피해 2배' },
  mage: { pre: '원소', nm: '원소 연성', ds: '동시 시전 때 연성 무기가 6개로 분열·공전 후 차례로 사출, 사출마다 속성 순환' },
  summoner: { pre: '망령', nm: '망령 무장', ds: '연성 무기를 든 망령 2체가 자율 비행 공격, 처치 60회마다 증원 (최대 4)' },
  priest: { pre: '성물', nm: '성물', ds: '연성 무기가 머리 위 성물로 떠서 공격, 회복할 때마다 추가 발동' },
  druid: { pre: '야수', nm: '야수 무장', ds: '곰이 연성 무기로 강타, 늑대가 연성 무기를 물고 돌진' },
};
for (const j in JOB43) if (JOB_WX[j]) Object.assign(JOB_WX[j], { pre: JOB43[j].nm, ds: JOB43[j].ds });
let fuseName;   // 선언 유지 (값은 뒤 파일 대입)
const F43 = () => G.f43 || (G.f43 = { trail: [], bat: null, wr: [], relicT: 0, kills0: 0, echoes: 0, fires: {} });
const baseW = () => G.p.weapons.find(w => w.base);
const slotWs = () => G.p.weapons.filter(w => !w.base);
const fusedWs = () => G.p.weapons.filter(w => w.fu);
const slotCount = () => slotW() - (baseW() ? 1 : 0);
const baseRetired = () => false;   // 0.50: 모든 칸 연성 후에도 기본 무기 계속 발동 (구: fusedWs().length >= slotCount())
const awDone = w => !AWAKEN[w.id] || !!w.aw;

/* ---------- 기본 무기 칸: 슬롯 계산 (meta.js slotW가 fusedN()=fz 개수를 더하므로 기본 무기에 fz 표시) ---------- */
function makeBase(w) { w.base = true; w.fz = 'base'; return w; }

/* ---------- 레벨 단계: Lv 3 분기 · Lv 5 각성 ---------- */
function checkBranch(kind, id) {
  const it = kind === 'w' ? wObj(id) : G.p.passives.find(x => x.id === id); if (!it) return;
  if (it.lvl >= BRANCH_AT && !it.br && !it.brQ && BRANCHES[id]) { it.brQ = true; G.pendingBr.push({ kind, id }); }
  if (kind === 'w' && AWAKEN[id] && it.lvl >= AW43 && !it.aw && !it.awQ) { it.awQ = true; G.pendingBr.push({ kind: 'w', id, aw: true }); }
}
SEL_HEAD.branch = s => s.q.aw ? ['무기 각성', `${itemName(s.q.id)} ${AW43}레벨 · 각성 1종 선택`] : ['분기 선택', `${itemName(s.q.id)} 강화 ${BRANCH_AT}단계 · 플레이 방식 선택`];

/* ---------- 전직 후보: 보유 무기 대응 직업 ---------- */
const SYM_JOB = Object.fromEntries(Object.entries(FZ_SYMBOL).map(([j, w]) => [w, j]));

/* ---------- 전직: 상징 무기 → 기본 무기 칸 ---------- */

/* ---------- 연성 카드 ---------- */
const _isFill43 = isFill;
isFill = c => c.t === 'fuse' || _isFill43(c);
const _cardInfo43 = cardInfo;
cardInfo = function (c) {
  if (c.t !== 'fuse') return _cardInfo43(c);
  const j = G.p.job, d = WEAPONS[c.id], b = baseW();
  return { id: c.id, k: 'k-fuse', col: JOB_COL[j], ic: d.ic, nm: fuseName(j, c.id), tag: `연성 · ${d.name} + ${WEAPONS[b.id].name}`, ds: `${JOB43[j].nm} · ${JOB43[j].ds}\n분기·각성 계승`, job: j };
};
const _cardScore43 = cardScore;
cardScore = c => c.t === 'fuse' ? 7.5 + rand(0, 1) : _cardScore43(c);
const _applyCard43 = applyCard;
applyCard = function (c) { if (c.t !== 'fuse') return _applyCard43(c); if (G.sel && G.sel.kind === 'chest') (G.stats.chestPicks = G.stats.chestPicks || []).push('fuse:' + c.id); else G.stats.picks.push(G.p.level - G.pendingLv + ':fuse:' + c.id); applyFuse(c.id); };
const _choiceType43 = choiceType;
choiceType = (c, f) => f.k === 'k-fuse' ? '연성' : _choiceType43(c, f);
function applyFuse() { }   // 선언 유지 (본문은 뒤 파일 대입으로 교체)
/* 직업별 연성 순간 연출. 아트 로딩 실패 시 기존 연출 사용. */

/* ---------- 연성 무기 발동: 직업 뼈대 × 짝 무기 ---------- */
const fireAs = (w, S, k, x, y, ex) => { const S2 = Object.assign({}, S, { dmg: S.dmg * k }); if (ex) ex(S2); return x == null ? WEAPON_FIRE[w.id](w, S2) : atPos(x, y, () => WEAPON_FIRE[w.id](w, S2)); };
function formation() { const p = G.p, fx0 = p.face.x || 1, fy0 = p.face.y || 0; return [[50, 0], [30, 36], [30, -36]].map(([a, b]) => ({ x: p.x + fx0 * a - fy0 * b, y: p.y + fy0 * a + fx0 * b })); }
function relicPos() { const p = G.p; return { x: p.x, y: p.y - 46 + Math.sin(G.time * 3) * 4 }; }

/* ---------- 무기 발동 갱신 (v41 기반 + 연성·기본 무기) ---------- */
/* 뼈대 보조 개체 갱신: 도적 궤적 · 소환사 망령 무장 · 기술자 포대 */
function fuseTick(dt) {
  const p = G.p, f = G.f43; if (!f || !p.job) return;
  f.trail.unshift({ x: p.x, y: p.y }); if (f.trail.length > 16) f.trail.length = 16;
  if (f.bat && f.bat.k > 0) f.bat.k -= dt;
  if (p.job === 'summoner' && fusedWs().length) {
    const n = Math.min(4, 2 + Math.floor((G.kills - f.kills0) / 60));
    while (f.wr.length < n) { f.wr.push({ x: p.x, y: p.y, a: f.wr.length * 1.6 }); if (f.wr.length > 2) toast('망령 무장 증원', JOB_COL.summoner); }
    f.wr.forEach((m, i) => { m.a += dt * 1.7; const e = nearestEnemy(p.x, p.y, 260), tx = e ? e.x + Math.cos(m.a + i) * 40 : p.x + Math.cos(m.a + i * 1.57) * 70, ty = e ? e.y + Math.sin(m.a + i) * 40 : p.y + Math.sin(m.a + i * 1.57) * 70; m.x += (tx - m.x) * Math.min(1, dt * 3); m.y += (ty - m.y) * Math.min(1, dt * 3); });
  }
}
/* 시간 메아리: 정지한 적에게 반복 피해 2배 */
const _damageEnemy43 = damageEnemy;
damageEnemy = function (e, dmg, o = {}) { if (G.echo43 && e && e.frz > 0) dmg *= 2; return _damageEnemy43(e, dmg, o); };
/* 성물: 회복마다 추가 발동 */
const _heal43 = heal;
heal = function (v, src) {
  const r = _heal43(v, src), p = G.p, f = G.f43;
  if (p && p.job === 'priest' && f && v > 0.3 && G.time >= f.relicT && !G.result) {
    const w = fusedWs()[0];
    if (w) { f.relicT = G.time + 0.8; const q = relicPos(); fx({ kind: 'pop', x: q.x, y: q.y, r: 14, color: '#fff2a8', dur: 0.3 }); fireAs(w, wStats(w), 0.5, q.x, q.y); G.stats.relicHeal = (G.stats.relicHeal || 0) + 1; }
  }
  return r;
};
/* 임시 도형 그리기 (최종본 아님): 분신 · 포대 · 망령 무장 · 성물 */
const _drawJobAura43 = drawJobAura;
drawJobAura = function (c) {
  _drawJobAura43(c);
  const p = G.p, f = G.f43; if (!f || !p.job || !fusedWs().length) return;
  const col = JOB_COL[p.job]; c.save();
  if (p.job === 'rogue') { c.globalAlpha = 0.35; c.fillStyle = '#203040'; for (const k of [5, 12]) { const q = f.trail[Math.min(f.trail.length - 1, k)]; if (q) { c.beginPath(); c.arc(q.x, q.y, p.r * 0.9, 0, 7); c.fill(); } } }
  if (p.job === 'engineer' && f.bat) { const b = f.bat, s = 13 + (b.k > 0 ? 2 : 0); c.fillStyle = '#5a4630'; c.strokeStyle = col; c.lineWidth = 3; c.fillRect(b.x - s, b.y - s, s * 2, s * 2); c.strokeRect(b.x - s, b.y - s, s * 2, s * 2); c.fillStyle = col; c.fillRect(b.x - 3, b.y - s - 8, 6, 10); }
  if (p.job === 'summoner' && !summonerUsesArmedGhost()) for (const m of f.wr) { c.globalAlpha = 0.6; c.fillStyle = col; c.beginPath(); c.moveTo(m.x, m.y - 10); c.lineTo(m.x + 8, m.y + 8); c.lineTo(m.x - 8, m.y + 8); c.closePath(); c.fill(); c.globalAlpha = 1; c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.moveTo(m.x, m.y); c.lineTo(m.x + 11, m.y - 6); c.stroke(); }
  if (p.job === 'priest' && !priestArtReady('orb')) { const q = relicPos(); c.fillStyle = col; c.strokeStyle = '#8a7020'; c.lineWidth = 2; c.beginPath(); c.moveTo(q.x, q.y - 9); c.lineTo(q.x + 7, q.y); c.lineTo(q.x, q.y + 9); c.lineTo(q.x - 7, q.y); c.closePath(); c.fill(); c.stroke(); }
  if (p.job === 'sovereign' && !(G.banner && J41().gd.length)) { c.globalAlpha = 0.3; c.fillStyle = col; for (const q of formation()) c.fillRect(q.x - 4, q.y - 4, 8, 8); }
  c.restore();
};
/* 무기 이름: 연성 무기는 연성 이름 */
const _wName43 = wName;
wName = function (id) { const w = G && G.p && G.p.weapons.find(x => x.id === id); return w && w.fu ? w.fu.nm : _wName43(id); };

/* ---------- 직업 시련 → 2차 전직 조건 ---------- */

/* ---------- 도감 연성 탭 ---------- */
