/* ============================================================
   개발 도구 — FPS 표시 · 무적 · 즉시 레벨업 · 자동 이동 · 배속
   출시본(5단계)에서 숨김 처리
   ============================================================ */
const DEV = {
  open: false, el: null, btn: null,
  init() {
    if (!CFG.DEV) return;
    this.btn = document.createElement('button'); this.btn.className = 'devbtn'; this.btn.textContent = 'DEV'; this.btn.id = 'devbtn';
    this.btn.addEventListener('click', () => this.toggle());
    document.body.appendChild(this.btn);
  },
  toggle() {
    this.open = !this.open;
    if (!this.open) { if (this.el) this.el.remove(); this.el = null; return; }
    this.el = document.createElement('div'); this.el.className = 'dev'; document.body.appendChild(this.el);
    this.draw();
  },
  draw() {
    if (!this.el) return;
    const d = STATE.dev;
    this.el.innerHTML = `<div class="g">
      <button data-k="fps" class="${d.fps ? 'on' : ''}">FPS 표시</button>
      <button data-k="god" class="${d.god ? 'on' : ''}">무적</button>
      <button data-k="lv">즉시 레벨업</button>
      <button data-k="auto" class="${d.auto ? 'on' : ''}">자동 이동</button>
      <button data-k="speed">배속 ×${d.speed}</button>
      <button data-k="restart">새 판</button>
      <button data-k="dlg">대사창 시험</button>
      <button data-k="ult">궁극기 충전</button>
      <button data-k="elite">정예 호출</button>
      <button data-k="altar">제단 호출</button>
      <button data-k="gate">수문장전 이동</button>
      <button data-k="demon">마왕전 이동</button>
      <button data-k="sv_release">고리 해제 직전</button>
      <button data-k="sv_post">진엔딩 후</button>
      <button data-k="perf">성능 측정 초기화</button>
      <button data-k="sv_restore" class="${devHasBak() ? '' : 'off'}">저장 복원</button></div>
      <pre id="devinfo"></pre>`;
    this.info();
    this.el.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.k;
      if (k === 'fps' || k === 'god' || k === 'auto') d[k] = !d[k];
      if (k === 'god' && d.god) G.p.hp = G.p.maxHp;
      if (k === 'lv') addXp(G.p.need - G.p.xp);
      if (k === 'speed') d.speed = { 1: 2, 2: 4, 4: 8, 8: 1 }[d.speed];
      if (k === 'restart') newRun();
      if (k === 'gate' && STATE.mode === 'play' && G.ph.id !== 'gate') { G.ph.i = G.ph.order.length - 2; G.ph.inGap = true; G.ph.id = null; G.ph.gapT = 1; }
      if (k === 'demon' && STATE.mode === 'play' && !isBossPhase()) { G.runType = 'retry'; G.ph.order = G.ph.order.slice(0, G.ph.i + 1).concat('demon'); G.ph.i = G.ph.order.length - 2; G.ph.inGap = true; G.ph.id = null; G.ph.gapT = 1; }
      if (k === 'sv_release' || k === 'sv_post') return devPreset(k.slice(3));
      if (k === 'sv_restore') return devRestore();
      if (k === 'perf') perfReset();
      if (k === 'ult' && G.p.job) G.p.ult = JOB_CFG.ultNeed;
      if (k === 'elite' && STATE.mode === 'play') spawnElite();
      if (k === 'altar' && !G.p.job) { const q = ringAt(120, 160); G.altar = { x: q.x, y: q.y, r: JOB_CFG.altarR, stay: 0, at: G.ph.i }; }
      if (k === 'dlg' && (STATE.mode === 'play' || STATE.mode === 'pause')) { if (STATE.mode === 'pause') resumeGame(); showDialog([{ name: '시험', text: '대사창 틀 시험 문장. 누르면 전체 표시, 다시 누르면 다음 줄.', color: '#7f74d6' }, { name: '들판의 목소리', text: '두 번째 줄. 끝나면 게임 재개.', color: '#5fbf6a' }]); }
      this.draw();
    }));
  },
  info() {
    const el = this.el && this.el.querySelector('#devinfo'); if (!el || !G) return;
    el.textContent = `버전 ${CFG.VERSION} · 시간 ${fmtTime(G.time)} · 체력 ${Math.round(G.p.hp)}/${G.p.maxHp}\n경험치 ${Math.floor(G.p.xp)}/${G.p.need} · 무기 ${G.p.weapons.map(w => WEAPONS[w.id].name + w.lvl).join(' ')}\n성능 ${(() => { const P = perfStat(); return P ? `평균 ${P.avg} FPS · 하위 1% ${P.low1} · 하위 5% ${P.low5} · 20ms 초과 ${P.slow}% · 측정 ${P.sec}초` : '측정 중'; })()}\n직업 ${G.p.job ? JOBS[G.p.job].name + (G.p.job2 ? '/' + G.p.job2 : '') + ' 궁극기 ' + Math.floor(G.p.ult) : '-'} · 유물 ${G.p.relics.length}\n보조 ${G.p.passives.map(x => PASSIVES[x.id].name + x.lvl).join(' ') || '-'} · 다시 뽑기 ${G.rerolls} · 제외 ${G.banishes}`;
  },
};

/* 진행 상태 바로가기 (0.15a) — 시험 도구 --preset 동일 내용 주입, 최초 적용 시 실제 저장 데이터 백업 */
const DEV_BAK = () => CFG.SAVE_KEY + '_devbak';
function devHasBak() { try { return !!localStorage.getItem(DEV_BAK()); } catch (e) { return false; } }
function devPreset(pre) {
  try {
    if (!devHasBak()) localStorage.setItem(DEV_BAK(), JSON.stringify({ main: localStorage.getItem(CFG.SAVE_KEY), run: localStorage.getItem(CFG.SAVE_KEY + '_run') }));
    const all = GK_ORDER.slice(), s = { runs: 0, clears: 10, gates: all, demonTries: 3, demonKills: 1, ending1: 1, intro: 1, metGk: all, metDemon: 1, frags: FRAGS.map(f => f.id) };
    if (pre === 'post') Object.assign(s, { trueEnd: 1, tierMax: 3, titles: ['end'] });
    localStorage.setItem(CFG.SAVE_KEY, JSON.stringify(s));
    localStorage.setItem(CFG.SAVE_KEY + '_run', JSON.stringify({ tier: 0, conds: [] }));
  } catch (e) { }
  location.reload();
}
function devRestore() {
  try {
    const b = JSON.parse(localStorage.getItem(DEV_BAK()) || 'null'); if (!b) return;
    const put = (k, v) => v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v);
    put(CFG.SAVE_KEY, b.main); put(CFG.SAVE_KEY + '_run', b.run); localStorage.removeItem(DEV_BAK());
  } catch (e) { }
  location.reload();
}

/* 자동 이동 — 시험용 (켜면 레벨업 카드도 자동 선택) (초안 자동 로직 v2 축약: 16방향 위험도 + 경험치 무리 추적 + 적 무리 접근) */
const AUTO = { dir: { x: 0, y: -1 }, next: 0, out: null, run: null };
const AUTO_DIRS = Array.from({ length: 16 }, (_, i) => ({ x: Math.cos(i * Math.PI / 8), y: Math.sin(i * Math.PI / 8) }));
function autoDanger(qx, qy) {
  const p = G.p; let d = 0;
  for (const k of G.ph.cracks) if (!k.done) { const dd = Math.sqrt(dist2(k.x, k.y, qx, qy)) - k.r - p.r; if (dd < 10) d += 30 + 30 * k.t / PH_CFG.crackWarn; }   // 붕괴 예고 회피 (0.10)
  const A = G.arena; if (A) { const o = Math.sqrt(dist2(A.x, A.y, qx, qy)) - (A.R - p.r - 25); if (o > 0) d += 40 + o; }   // 마왕 결계 밖 회피 (0.12)
  if (G.hz) for (const h of G.hz) {                                                       // 수문장 예고 구역·장판 회피 (0.11)
    if (h.k === 'sect') { if (!h.fired && dmInSect(h, qx, qy, p.r + 12)) d += 30 + 30 * h.t / h.warn; continue; }   // 마왕 낫·광선 (0.12)
    if (h.k === 'beam') { if (h.t > h.warn - 0.5 && dmOnBeam(h, qx, qy, p.r + 14)) d += 45; continue; }
    if (h.k === 'circ') { if (h.fired && !h.pool) continue; const dd = Math.sqrt(dist2(h.x, h.y, qx, qy)) - h.r - p.r * 0.5; if (dd < 12) d += h.fired ? 25 : 30 + 30 * h.t / h.warn; }
    else if (h.t <= h.warn + 0.6) { const rx = qx - h.x, ry = qy - h.y, al = rx * h.dx + ry * h.dy; if (al > -20 && al < h.len + 20 && Math.abs(rx * h.dy - ry * h.dx) < h.w / 2 + p.r + 10) d += 45; }
  }
  if (G.eb) for (const b of G.eb) {                                                       // 적 탄환 진행 경로 회피 (0.11)
    const rx = qx - b.x, ry = qy - b.y; if (Math.abs(rx) > 120 || Math.abs(ry) > 120) continue;
    const sp = Math.hypot(b.vx, b.vy) || 1, ux = b.vx / sp, uy = b.vy / sp, al = rx * ux + ry * uy; if (al < -10 || al > 130) continue;
    if (Math.abs(rx * uy - ry * ux) < b.r + p.r + 8) d += 22 * (1 - al / 150);
  }
  gridQuery(qx, qy, 90, e => { if (e.fixed || e.sleep) return; const dd = Math.sqrt(dist2(e.x, e.y, qx, qy)) - e.r - p.r; d += dd < 6 ? 50 : 140 / (dd + 8); });
  return d;
}
function autoTarget() {
  const p = G.p, ph = G.ph; let best = null, bs = 0;
  if (ph.zone && p.hp > p.maxHp * 0.6) return { x: ph.zone.x, y: ph.zone.y, k: 'goal' };              // 봉인석 구역 우선 (0.3)
  for (const c of G.chests) if (dist2(c.x, c.y, p.x, p.y) < 500 * 500) return { x: c.x, y: c.y, k: 'goal' };   // 보물 상자 (0.5)
  if (ph.camp && !ph.camp.used) return { x: ph.camp.x, y: ph.camp.y, k: 'goal' };                                 // 야영지 (0.10)
  if (ph.cart && !ph.cart.done && dist2(ph.cart.x, ph.cart.y, p.x, p.y) > 90 * 90) {                                       // 수레 곁 유지
    const c = ph.cart, dx = c.tx - c.x, dy = c.ty - c.y, d = Math.hypot(dx, dy) || 1; return { x: c.x + dx / d * 40, y: c.y + dy / d * 40, k: 'goal' }; }
  if (G.cr && G.cr.type === 'thief' && !G.cr.mob.dead && p.hp > p.maxHp * 0.4) return { x: G.cr.mob.x, y: G.cr.mob.y, k: 'boss' };   // 보물 몹 추격 (0.24)
  const ev = G.ev && G.ev.cur, ai = aiProfile();
  if (ev && ev.state === 'idle' && ai.evGo && p.hp > p.maxHp * 0.55) return ev.type === 'giant' ? { x: ev.mob.x, y: ev.mob.y, k: 'boss' } : { x: ev.x, y: ev.y, k: 'goal' };   // 곁가지 사건 진입
  if (ev && ev.type === 'giant' && ev.state === 'active' && p.hp > p.maxHp * 0.4) return { x: ev.mob.x, y: ev.mob.y, k: 'boss' };
  if (ph.rits && p.hp > p.maxHp * 0.35) { const r = ph.rits.filter(e => !e.dead).sort((a, b) => dist2(a.x, a.y, p.x, p.y) - dist2(b.x, b.y, p.x, p.y))[0]; if (r) return { x: r.x, y: r.y, k: 'boss' }; }   // 마법진 파괴
  if (G.altar && p.hp > p.maxHp * 0.4 && !aiProfile().skipAltar) return { x: G.altar.x, y: G.altar.y, k: 'goal' };     // 전직 제단 (0.6)
  if (ph.spring && !ph.spring.used && p.hp < p.maxHp * 0.85) return { x: ph.spring.x, y: ph.spring.y, k: 'goal' };
  const gb = G.gkMob; if (gb && !gb.dead && isBossPhase() && p.hp > p.maxHp * 0.3) { const t = autoGkTarget(gb); return { x: t.x, y: t.y, k: 'gk' }; }   // 수문장 교전 (0.11)
  if (ph.cmd && !ph.cmd.dead && p.hp > p.maxHp * 0.4) return { x: ph.cmd.x, y: ph.cmd.y, k: 'boss' };            // 대장 교전 유도
  for (const g of G.gems) {
    if (g.mag) continue; const d = Math.sqrt(dist2(g.x, g.y, p.x, p.y)); if (d > 420) continue;
    let crowd = 0; gridQuery(g.x, g.y, 40, () => { crowd++; if (crowd > 6) return false; });
    const s = (g.v * 18 * (p.hp < p.maxHp * 0.5 ? 0.5 : 1)) / (d + 50) / (1 + crowd * 0.5);
    if (s > bs) { bs = s; best = { x: g.x, y: g.y, k: 'gem' }; }
  }
  if (best) return best;
  let cx = 0, cy = 0, n = 0; gridQuery(p.x, p.y, 380, e => { cx += e.x; cy += e.y; n++; });
  if (n) return { x: cx / n, y: cy / n, k: 'fight' };
  return null;
}
/* 세렌 본체 탐색: 분열 후 1.2~2.6초 반응 지연, 80% 확률로 본체 식별 (미식별 시 가까운 분신 공격) */
function autoGkTarget(e) {
  if (e.gk !== 'seren') return e;
  const s = e.ai.splitAt || 0, p = G.p;
  if (AUTO.split !== s) { AUTO.split = s; AUTO.seeAt = s + rand(1.2, 2.6); AUTO.see = Math.random() < 0.8; }
  if (G.time >= AUTO.seeAt && AUTO.see) return e;
  return [e].concat(G.enemies.filter(o => o.clone && !o.dead)).sort((a, b) => dist2(a.x, a.y, p.x, p.y) - dist2(b.x, b.y, p.x, p.y))[0];
}
function autoVec() {
  if (AUTO.run !== G) { AUTO.run = G; AUTO.next = 0; AUTO.out = null; }
  if (G.time < AUTO.next && AUTO.out) return AUTO.out;
  AUTO.next = G.time + rand(0.1, 0.2);          // 사람 반응 지연 재현
  const p = G.p, tg = autoTarget();
  let tx = 0, ty = 0, td = 0, pull = 1;
  if (tg) { tx = tg.x - p.x; ty = tg.y - p.y; td = Math.hypot(tx, ty) || 1; tx /= td; ty /= td; }
  if (tg && tg.k === 'fight') pull = td > 130 ? 1 : td > 90 ? 0.2 : -0.4;
  if (tg && tg.k === 'boss') pull = td > 60 ? 1 : 0;                       // 대장은 근접 사거리까지 접근
  if (tg && tg.k === 'gk') { const mel = p.weapons.filter(w => WEAPONS[w.id].cat === 'melee').length >= 2, lo = mel ? 55 : 110, hi = mel ? 95 : 170; pull = td > hi ? 1 : td < lo ? -0.6 : 0.1; }   // 수문장: 근접형은 붙고 원거리형은 거리 유지
  const here = autoDanger(p.x, p.y);
  if (ultReady() && !autoUltSetting() && (here > 3 || G.time - G.tm.readyAt > 8)) return (AUTO.out = { x: 0, y: 0, m: 0 });   // 궁극기: 손 떼고 정지 (0.6)
  let best = AUTO_DIRS[0], bs = -1e9;
  for (const dv of AUTO_DIRS) {
    const dg = autoDanger(p.x + dv.x * 30, p.y + dv.y * 30) + 0.6 * autoDanger(p.x + dv.x * 70, p.y + dv.y * 70);
    const s = -dg * (STATE.dev.god ? 0.15 : 1) + (tg ? (dv.x * tx + dv.y * ty) * (tg.k === 'goal' || tg.k === 'boss' || tg.k === 'gk' ? 26 : 6) * pull : 0) + (dv.x * AUTO.dir.x + dv.y * AUTO.dir.y) * 1.2;
    if (s > bs) { bs = s; best = dv; }
  }
  const ev2 = G.ev && G.ev.cur, stopR = G.ph.zone ? G.ph.zone.r - 20 : ev2 && ev2.state === 'idle' && tg && tg.x === ev2.x ? 12 : 20;
  if (tg && tg.k === 'goal' && td < stopR) return (AUTO.out = { x: 0, y: 0, m: 0 });
  if (here < 1.5 && -here >= bs && !(tg && (tg.k === 'gem' || tg.k === 'goal'))) return (AUTO.out = { x: 0, y: 0, m: 0 });
  const k = here > 6 ? 1 : 0.55;
  let x = AUTO.dir.x * (1 - k) + best.x * k, y = AUTO.dir.y * (1 - k) + best.y * k; const m = Math.hypot(x, y) || 1;
  AUTO.dir = { x: x / m, y: y / m };
  return (AUTO.out = { x: x / m, y: y / m, m: 1 });
}
