/* ===== 0.42 ===== 화면 간결화(전직 제단·도감 직업 카드 핵심 한 줄) + 연성 */
const JOB_SHORT = {
  warrior: '받은 피해를 저장해 폭발로 반격', rogue: '모든 무기 2회 발동 · 무기 칸 3개', sovereign: '선택지 4장 · 군기 안에서 강화',
  archer: '멈추면 집중 누적 · 표식 우선 조준', engineer: '무기를 포탑으로 설치해 발사', chrono: '주변 적·탄환 감속 · 중첩 시 정지',
  mage: '4초마다 모든 무기 동시 시전', summoner: '망령이 내 무기로 대신 싸움', priest: '초과 회복이 신성 폭발로 전환',
  druid: '늑대·곰 동료와 함께 성장',
};
const ultName = id => (JOBS[id].ult || '').split(':')[0];

/* ============================================================
   0.42 연성 — 직업 시련 완수 시 Lv 6 무기 2종을 1종으로 합침 (판당 최대 2회)
   무기 2분류: 몸체형(플레이어 중심 발동)·지점형(지정 지점 발동)
   결합 3종: 몸체+지점 변신형 · 지점+지점 중첩형 · 몸체+몸체 융합형
   주체 무기(자체 재사용 시간으로 발동)가 부품 무기를 연달아 발동, 부품은 슬롯을 차지하지 않음
   직업 반영: 직업마다 연성 발동에 붙는 고유 동작 · 상징 무기: 직업별 시너지 동작
   유물 16종 폐지(연성으로 대체) · 보물 상자는 레벨업 상자로 변경
   ============================================================ */
const FZ_POINT = ['trap', 'bomb', 'fireball', 'lightning', 'icering', 'vortex'];
const fzKind = id => FZ_POINT.includes(id) ? '지점' : '몸체';
const FZ_TYPES = { '몸체+지점': ['변신형', 'trans', '몸체 무기가 발동할 때마다 지점 무기가 연달아 터짐'], '지점+지점': ['중첩형', 'stack', '두 지점 무기가 같은 곳에서 겹쳐 터짐 · 범위 +30%'], '몸체+몸체': ['융합형', 'merge', '두 무기가 동시에 발동 · 관통 +2 · 범위 +20%'] };
const FZ_SYMBOL = { warrior: 'cleave', rogue: 'shuriken', sovereign: 'shield', archer: 'arrow', engineer: 'trap', chrono: 'icering', mage: 'fireball', summoner: 'beam', priest: 'orb', druid: 'slam' };
const FZ_TRIAL = {
  warrior: { nm: '맞서는 자의 시련', ds: '받은 피해 누적이 최대 체력의 80%', k: 'hurt', n: 0.8 },
  rogue: { nm: '쉬지 않는 자의 시련', ds: '이동 거리 6000 달성', k: 'dist', n: 6000 },
  sovereign: { nm: '군림하는 자의 시련', ds: '적 120체 처치', k: 'kills', n: 120 },
  archer: { nm: '숨죽이는 자의 시련', ds: '정지 상태 누적 30초', k: 'still', n: 30 },
  engineer: { nm: '설계자의 시련', ds: '정예 2체 처치', k: 'elite', n: 2 },
  chrono: { nm: '기다리는 자의 시련', ds: '전직 후 90초 생존', k: 'time', n: 90 },
  mage: { nm: '폭발의 시련', ds: '궁극기 2회 사용', k: 'ult', n: 2 },
  summoner: { nm: '군단의 시련', ds: '적 150체 처치', k: 'kills', n: 150 },
  priest: { nm: '수호자의 시련', ds: '체력 90% 이상 상태 45초 유지', k: 'hi', n: 45 },
  druid: { nm: '숲의 시련', ds: '이동 거리 4500 달성', k: 'dist', n: 4500 },
};
const FZ_JOB = {
  warrior: '발동 시 주변 충격파', rogue: '그림자가 한 번 더 발동 (60%)', sovereign: '피해 +20% · 범위 +15%', archer: '가까운 적 3체에 표식 +2',
  engineer: '포탑 위치에서도 부품 무기 발동', chrono: '1초 뒤 같은 연성 재현 (60%)', mage: '발동 지점에 원소 폭발', summoner: '망령 위치에서도 부품 무기 발동',
  priest: '신성 고리 · 체력 소량 회복', druid: '동료 위치에서도 부품 무기 발동',
};
const fusedN = () => G && G.p ? G.p.weapons.filter(w => w.fz).length : 0;
const F42 = () => G.f42 || (G.f42 = { base: null, hurt: 0, dist: 0, still: 0, time: 0, hi: 0, done: 0, used: 0, cool: 0, px: 0, py: 0, hp: 0 });
function fzProg() {
  const f = F42(), T = FZ_TRIAL[G.p.job]; if (!T || !f.base) return 0;
  return { hurt: f.hurt / Math.max(1, G.p.maxHp), dist: f.dist, kills: G.kills - f.base.kills, still: f.still, elite: (G.stats.eliteKills || 0) - f.base.elite, time: f.time, ult: (G.stats.ults || 0) - f.base.ult, hi: f.hi }[T.k];
}
const fzTarget = () => FZ_TRIAL[G.p.job].n * (F42().done === 0 ? 1 : 2);
const fzEligible = () => G.p.weapons.filter(w => w.lvl >= CFG.weaponMax && !w.fx && !w.fz);
function fzPick(c) {
  const s = G.sel;
  if (!s.first) { s.first = c.id; s.cards = fzEligible().filter(w => w.id !== c.id).map(w => ({ t: 'fz', id: w.id })); renderSelect(); autoLater(); return; }
  fzApply(s.first, c.id); closeSel();
}
function fzApply(ia, ib) {
  const p = G.p; let A = p.weapons.find(w => w.id === ia), B = p.weapons.find(w => w.id === ib); if (!A || !B) return;
  if (A.id === 'spin' && B.id !== 'spin') [A, B] = [B, A];            // 회전검은 상시 회전형이라 부품 역할
  const T = FZ_TYPES[[fzKind(A.id), fzKind(B.id)].sort().join('+')];
  A.fx = { f: B.id, type: T[1], nm: T[0] }; B.fz = true; A.t = 0.2;
  F42().used++; (G.stats.fuses = G.stats.fuses || []).push(A.id + '+' + B.id + ':' + T[1]);
  toast(`연성 · ${T[0]}`, JOB_COL[p.job]); banner('연성 · ' + T[0], `${WEAPONS[A.id].name} + ${WEAPONS[B.id].name}`, JOB_COL[p.job], 2.4);
  fx({ kind: 'ring', x: p.x, y: p.y, r0: 10, r1: 160, dur: 0.7, color: JOB_COL[p.job], fill: true }); shake(3, 0.3); recalc();
}
