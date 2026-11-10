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
const FZ_SYM_TX = { warrior: '베기마다 주변 충격', rogue: '반대 방향 수리검 추가', sovereign: '충격마다 체력 회복', archer: '명중 대상 표식 가속', engineer: '포탑 위치에도 덫 설치', chrono: '파동에 닿은 적 잠시 정지', mage: '폭발마다 원소 연쇄', summoner: '망령 위치에서 광선 발사', priest: '구체마다 체력 회복', druid: '동료 위치에서도 강타' };
const fusedN = () => G && G.p ? G.p.weapons.filter(w => w.fz).length : 0;
const F42 = () => G.f42 || (G.f42 = { base: null, hurt: 0, dist: 0, still: 0, time: 0, hi: 0, done: 0, used: 0, cool: 0, px: 0, py: 0, hp: 0 });
function fzProg() {
  const f = F42(), T = FZ_TRIAL[G.p.job]; if (!T || !f.base) return 0;
  return { hurt: f.hurt / Math.max(1, G.p.maxHp), dist: f.dist, kills: G.kills - f.base.kills, still: f.still, elite: (G.stats.eliteKills || 0) - f.base.elite, time: f.time, ult: (G.stats.ults || 0) - f.base.ult, hi: f.hi }[T.k];
}
const fzTarget = () => FZ_TRIAL[G.p.job].n * (F42().done === 0 ? 1 : 2);
const fzEligible = () => G.p.weapons.filter(w => w.lvl >= CFG.weaponMax && !w.fx && !w.fz);
function v42Update(dt) {
  const p = G.p; if (!p.job || !FZ_TRIAL[p.job]) return;
  const f = F42();
  if (!f.base) { f.base = { kills: G.kills, elite: G.stats.eliteKills || 0, ult: G.stats.ults || 0 }; f.px = p.x; f.py = p.y; f.hp = p.hp; }
  const mv = Math.hypot(p.x - f.px, p.y - f.py); f.px = p.x; f.py = p.y;
  f.dist += mv; f.time += dt; if (mv < 0.3) f.still += dt; if (p.hp > p.maxHp * 0.9) f.hi += dt;
  if (p.hp < f.hp) f.hurt += f.hp - p.hp; f.hp = p.hp;
  if (f.done < 2 && fzProg() >= fzTarget()) { f.done++; toast('시련 완수 · 연성 기회', JOB_COL[p.job]); banner(FZ_TRIAL[p.job].nm, `연성 기회 ${f.done}/2 · Lv 6 무기 2종을 합침`, JOB_COL[p.job], 2.2); }
  if (f.done > f.used && STATE.mode === 'play' && !G.sel && !G.result && G.time >= f.cool && !G.pendingLv && !G.pendingChest && !(G.pendingBr && G.pendingBr.length) && fzEligible().length >= 2) fzOpen();
}
function fzOpen() {
  STATE.mode = 'select'; clearInput();
  G.sel = { kind: 'fuse', first: null, cards: fzEligible().map(w => ({ t: 'fz', id: w.id })), banish: false };
  renderSelect(); autoLater();
}
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
function fuseCd(w, S) { const F = G.p.weapons.find(x => x.id === w.fx.f && x.fz), c2 = F && F.id !== 'spin' ? wStats(F).cd : S.cd; return (S.cd + c2) / 2 * 0.9; }
function fuseFire(w, S) {
  const p = G.p, F = G.p.weapons.find(x => x.id === w.fx.f && x.fz); if (!F) return;
  const SF = wStats(F), j = p.job, jd = j === 'sovereign' ? 1.2 : 1, ja = j === 'sovereign' ? 1.15 : 1, type = w.fx.type;
  const fire = (dm, ex) => {
    if (G.result) return;
    if (F.id === 'spin') { G.tm.storm = 1.5; return; }
    const S2 = Object.assign({}, SF, { dmg: SF.dmg * dm * jd, area: SF.area * ja }); if (ex) ex(S2);
    WEAPON_FIRE[F.id](F, S2);
  };
  if (type === 'trans') { fire(1); G.later.push({ t: 0.25, f: () => fire(0.7) }); }
  else if (type === 'stack') { const st = s => { s.area *= 1.3; }; fire(1, st); G.later.push({ t: 0.5, f: () => fire(0.8, st) }); }
  else fire(1, s => { s.pierce += 2; s.area *= 1.2; });
  const col = JOB_COL[j] || '#fff'; fx({ kind: 'ring', x: p.x, y: p.y, r0: 8, r1: 56, dur: 0.3, color: col });
  const nr = n => enemiesInRange(p.x, p.y, 320).slice(0, n);
  if (j === 'warrior') explode(p.x, p.y, 90, S.dmg * 0.5, 'fuse_w', col);
  else if (j === 'rogue') G.later.push({ t: 0.22, f: () => fire(0.6) });
  else if (j === 'archer') for (const e of nr(3)) e.mk = (e.mk || 0) + 2;
  else if (j === 'engineer') for (const t of G.turrets.slice(0, 2)) atPos(t.x, t.y, () => fire(0.8));
  else if (j === 'chrono') G.later.push({ t: 1.0, f: () => fire(0.6) });
  else if (j === 'mage') { const e = nearestEnemy(p.x, p.y, 420); if (e) explode(e.x, e.y, 60, S.dmg * 0.6, 'fuse_m', col); }
  else if (j === 'summoner') for (const m of G.minions.slice(0, 2)) atPos(m.x, m.y, () => fire(0.7));
  else if (j === 'priest') { explode(p.x, p.y, 100, S.dmg * 0.4, 'fuse_p', col); heal(p.maxHp * 0.004, '연성'); }
  else if (j === 'druid') for (const m of G.pets.slice(0, 2)) atPos(m.x, m.y, () => fire(0.7));
}
function symbolFire(w, S) {
  const p = G.p, j = p.job, col = JOB_COL[j];
  if (j === 'warrior') explode(p.x, p.y, 70, S.dmg * 0.35, 'sym_w', col);
  else if (j === 'rogue') { const D = WEAPONS.shuriken.base; shoot({ kind: 'star', x: p.x, y: p.y, ang: aimAng() + Math.PI, sp: D.sp, r: 6, dmg: S.dmg * 0.6, pierce: S.pierce, life: D.life, color: '#e8ecff', src: 'shuriken', bounce: true }); }
  else if (j === 'sovereign') heal(p.maxHp * 0.004, '상징');
  else if (j === 'archer') for (const e of enemiesInRange(p.x, p.y, 300).slice(0, 2)) e.mk = (e.mk || 0) + 1;
  else if (j === 'engineer') { const t = G.turrets[0]; if (t) atPos(t.x, t.y, () => WEAPON_FIRE.trap(w, S)); }
  else if (j === 'chrono') gridQuery(p.x, p.y, 130, e => { if (!e.gk) e.frz = Math.max(e.frz || 0, 0.5); });
  else if (j === 'mage') { const e = nearestEnemy(p.x, p.y, 420); if (e) explode(e.x, e.y, 50, S.dmg * 0.5, 'sym_m', col); }
  else if (j === 'summoner') for (const m of G.minions.slice(0, 2)) { const e = nearestEnemy(m.x, m.y, 300); if (e) lineHit(m.x, m.y, Math.atan2(e.y - m.y, e.x - m.x), 220, 12, t => damageEnemy(t, S.dmg * 0.35, { src: 'beam' })); }
  else if (j === 'priest') heal(p.maxHp * 0.003, '상징');
  else if (j === 'druid') for (const m of G.pets.slice(0, 2)) explode(m.x, m.y, 70, S.dmg * 0.4, 'sym_d', col);
}
