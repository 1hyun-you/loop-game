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
      <button data-k="altar">제단 호출</button></div>
      <pre id="devinfo"></pre>`;
    this.info();
    this.el.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.k;
      if (k === 'fps' || k === 'god' || k === 'auto') d[k] = !d[k];
      if (k === 'god' && d.god) G.p.hp = G.p.maxHp;
      if (k === 'lv') addXp(G.p.need - G.p.xp);
      if (k === 'speed') d.speed = { 1: 2, 2: 4, 4: 8, 8: 1 }[d.speed];
      if (k === 'restart') newRun();
      if (k === 'ult' && G.p.job) G.p.ult = JOB_CFG.ultNeed;
      if (k === 'elite' && STATE.mode === 'play') spawnElite();
      if (k === 'altar' && !G.p.job) { const q = ringAt(120, 160); G.altar = { x: q.x, y: q.y, r: JOB_CFG.altarR, stay: 0, at: G.ph.i }; }
      if (k === 'dlg' && (STATE.mode === 'play' || STATE.mode === 'pause')) { if (STATE.mode === 'pause') resumeGame(); showDialog([{ name: '시험', text: '대사창 틀 시험 문장. 누르면 전체 표시, 다시 누르면 다음 줄.', color: '#7f74d6' }, { name: '들판의 목소리', text: '두 번째 줄. 끝나면 게임 재개.', color: '#5fbf6a' }]); }
      this.draw();
    }));
  },
  info() {
    const el = this.el && this.el.querySelector('#devinfo'); if (!el || !G) return;
    el.textContent = `버전 ${CFG.VERSION} · 시간 ${fmtTime(G.time)} · 체력 ${Math.round(G.p.hp)}/${G.p.maxHp}\n경험치 ${Math.floor(G.p.xp)}/${G.p.need} · 무기 ${G.p.weapons.map(w => WEAPONS[w.id].name + w.lvl).join(' ')}\n직업 ${G.p.job ? JOBS[G.p.job].name + (G.p.job2 ? '/' + G.p.job2 : '') + ' 궁극기 ' + Math.floor(G.p.ult) : '-'} · 유물 ${G.p.relics.length}\n보조 ${G.p.passives.map(x => PASSIVES[x.id].name + x.lvl).join(' ') || '-'} · 다시 뽑기 ${G.rerolls} · 제외 ${G.banishes}`;
  },
};

/* 자동 이동 — 시험용 (켜면 레벨업 카드도 자동 선택) (초안 자동 로직 v2 축약: 16방향 위험도 + 경험치 무리 추적 + 적 무리 접근) */
const AUTO = { dir: { x: 0, y: -1 }, next: 0, out: null, run: null };
const AUTO_DIRS = Array.from({ length: 16 }, (_, i) => ({ x: Math.cos(i * Math.PI / 8), y: Math.sin(i * Math.PI / 8) }));
function autoDanger(qx, qy) {
  const p = G.p; let d = 0;
  for (const k of G.ph.cracks) if (!k.done) { const dd = Math.sqrt(dist2(k.x, k.y, qx, qy)) - k.r - p.r; if (dd < 10) d += 30 + 30 * k.t / PH_CFG.crackWarn; }   // 붕괴 예고 회피 (0.10)
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
  const ev = G.ev && G.ev.cur, ai = aiProfile();
  if (ev && ev.state === 'idle' && ai.evGo && p.hp > p.maxHp * 0.55) return ev.type === 'giant' ? { x: ev.mob.x, y: ev.mob.y, k: 'boss' } : { x: ev.x, y: ev.y, k: 'goal' };   // 곁가지 사건 진입
  if (ev && ev.type === 'giant' && ev.state === 'active' && p.hp > p.maxHp * 0.4) return { x: ev.mob.x, y: ev.mob.y, k: 'boss' };
  if (ph.rits && p.hp > p.maxHp * 0.35) { const r = ph.rits.filter(e => !e.dead).sort((a, b) => dist2(a.x, a.y, p.x, p.y) - dist2(b.x, b.y, p.x, p.y))[0]; if (r) return { x: r.x, y: r.y, k: 'boss' }; }   // 마법진 파괴
  if (G.altar && p.hp > p.maxHp * 0.4 && !aiProfile().skipAltar) return { x: G.altar.x, y: G.altar.y, k: 'goal' };     // 전직 제단 (0.6)
  if (ph.spring && !ph.spring.used && p.hp < p.maxHp * 0.85) return { x: ph.spring.x, y: ph.spring.y, k: 'goal' };
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
function autoVec() {
  if (AUTO.run !== G) { AUTO.run = G; AUTO.next = 0; AUTO.out = null; }
  if (G.time < AUTO.next && AUTO.out) return AUTO.out;
  AUTO.next = G.time + rand(0.1, 0.2);          // 사람 반응 지연 재현
  const p = G.p, tg = autoTarget();
  let tx = 0, ty = 0, td = 0, pull = 1;
  if (tg) { tx = tg.x - p.x; ty = tg.y - p.y; td = Math.hypot(tx, ty) || 1; tx /= td; ty /= td; }
  if (tg && tg.k === 'fight') pull = td > 130 ? 1 : td > 90 ? 0.2 : -0.4;
  if (tg && tg.k === 'boss') pull = td > 60 ? 1 : 0;                       // 대장은 근접 사거리까지 접근
  const here = autoDanger(p.x, p.y);
  if (ultReady() && !autoUltSetting() && (here > 3 || G.time - G.tm.readyAt > 8)) return (AUTO.out = { x: 0, y: 0, m: 0 });   // 궁극기: 손 떼고 정지 (0.6)
  let best = AUTO_DIRS[0], bs = -1e9;
  for (const dv of AUTO_DIRS) {
    const dg = autoDanger(p.x + dv.x * 30, p.y + dv.y * 30) + 0.6 * autoDanger(p.x + dv.x * 70, p.y + dv.y * 70);
    const s = -dg * (STATE.dev.god ? 0.15 : 1) + (tg ? (dv.x * tx + dv.y * ty) * (tg.k === 'goal' || tg.k === 'boss' ? 26 : 6) * pull : 0) + (dv.x * AUTO.dir.x + dv.y * AUTO.dir.y) * 1.2;
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
