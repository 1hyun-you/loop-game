/* ============================================================
   0.57 치트 패널 개편 (회차 68)
   - 패널이 치트 버튼을 따라 이동, 화면 안쪽으로 펼침, 묶음별 제목·색 구분, 버튼 확대
   - 진행 / 성장 / 무기 / 구간 이동 / 기타 5묶음
   - 무기 고르기 창: 무기·Lv 1~5·발현·각성 지정, 상단 '연성 완료'
   - 구간 이동: 인물 선택 직전 · 인물 각성 직전 · 보스전(수문장 4인·마왕), 레벨 맞춤
   - 인물 선택·각성 바로가기는 재구성 구현 전까지 현재 전직 구조로 동작
   ============================================================ */
STATE.dev.fps = false;                       // FPS 기본 꺼짐
STATE.dev.fit = true;                        // 레벨 맞춤 기본 켬
if (STATE.dev.speed > 8) STATE.dev.speed = 8;

/* 구간 적정 레벨 (0.56 일반 30판 평균: 전직 18.9 · 2차 전직 26.0 · 수문장전 53.1 · 마왕전 42.6) */
const DEV57 = { lvJob: 19, lvAwk: 26, lvGate: 53, lvDemon: 43, bossOpen: false, restartArm: 0, win: null, sel: null, selLv: 1, selBr: null, selAw: null, prevMode: null };

(function () {
  if (typeof document === 'undefined') return;
  const st = document.createElement('style');
  st.textContent = `.dev{left:auto;bottom:auto;max-width:min(300px,calc(100vw - 16px));max-height:calc(100vh - 16px);overflow-y:auto;gap:7px;pointer-events:auto;padding:2px}
.dev .sec{display:flex;flex-direction:column;gap:5px;padding:6px 7px 7px;border-radius:10px;background:rgba(10,9,16,.72);border:1px solid var(--sc,#888);border-left-width:4px}
.dev .sec>b{font-size:11px;font-weight:normal;color:var(--sc,#ccc);letter-spacing:.04em}
.dev .r{gap:6px}
.dev button{min-height:40px;min-width:44px;padding:5px 11px;font-size:13px}
.dev button.arm{background:rgba(150,40,40,.9);border-color:#ff8a7a}
.devwin{position:fixed;inset:0;z-index:20;background:rgba(6,6,10,.82);display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:max(16px,env(safe-area-inset-top)) 10px 24px}
.devwin .box{width:100%;max-width:420px;display:flex;flex-direction:column;gap:9px}
.devwin h2{margin:0;font-size:17px;display:flex;justify-content:space-between;align-items:center}
.devwin .sec{display:flex;flex-direction:column;gap:6px;padding:8px 9px;border-radius:10px;background:rgba(20,18,30,.9);border:1px solid var(--sc,#666);border-left-width:4px}
.devwin .sec>b{font-size:12px;font-weight:normal;color:var(--sc,#ccc)}
.devwin .sec>p{margin:0;font-size:12px;color:var(--muted,#aaa)}
.devwin .r{display:flex;flex-wrap:wrap;gap:6px}
.devwin button{min-height:40px;padding:5px 11px;font-size:13px;border-radius:8px;background:rgba(14,12,20,.8);border:1px solid rgba(255,255,255,.28)}
.devwin button.on{background:rgba(45,106,60,.9);border-color:#4caf6a}
.devwin button.own{border-color:#ffd24a}
.devwin button.go{background:rgba(40,80,140,.9);border-color:#7fb0ff;min-width:100%}`;
  document.head.appendChild(st);
})();

/* ---------- 패널 위치: 버튼 기준 화면 안쪽으로 펼침 ---------- */
DEV.place = function () {
  const el = this.el, b = this.btn; if (!el || !b) return;
  const r = b.getBoundingClientRect(), W = innerWidth, H = innerHeight, gap = 8, left = r.left + r.width / 2 < W / 2;
  const side = left ? W - r.right - gap - 8 : r.left - gap - 8;   // 버튼 옆 가용 폭
  el.style.left = el.style.right = el.style.top = el.style.bottom = 'auto';
  if (side >= 200) {                                               // 옆으로 펼침 (화면 안쪽 방향)
    el.style.maxWidth = Math.min(300, side) + 'px';
    if (left) el.style.left = (r.right + gap) + 'px'; else el.style.right = (W - r.left + gap) + 'px';
    const eh = el.getBoundingClientRect().height;
    el.style.top = clamp(r.top + r.height / 2 < H / 2 ? r.top : r.bottom - eh, 8, Math.max(8, H - eh - 8)) + 'px';
  } else {                                                         // 옆 공간 부족: 위·아래 중 넓은 쪽으로 펼침
    el.style.maxWidth = Math.min(300, W - 16) + 'px';
    const ew = el.getBoundingClientRect().width;
    el.style.left = clamp(left ? r.left : r.right - ew, 8, Math.max(8, W - ew - 8)) + 'px';
    const up = r.top > H - r.bottom, room = (up ? r.top : H - r.bottom) - gap - 8;
    el.style.maxHeight = Math.max(160, room) + 'px';
    const eh = el.getBoundingClientRect().height;
    el.style.top = (up ? Math.max(8, r.top - gap - eh) : r.bottom + gap) + 'px';
  }
};
const _devInit57 = DEV.init;
DEV.init = function () {
  _devInit57.call(this); const b = this.btn; if (!b) return;
  b.addEventListener('pointermove', () => { if (this.el) this.place(); });
  addEventListener('resize', () => { if (this.el) this.place(); });
};
const _devToggle57 = DEV.toggle;
DEV.toggle = function () { _devToggle57.call(this); if (this.el) this.place(); };

/* ---------- 패널 그리기 ---------- */
DEV.draw = function () {
  if (!this.el) return;
  const d = STATE.dev, mode = d.auto ? (d.semi ? 'semi' : 'full') : 'off';
  const chip = (k, label, on, cls = '') => `<button data-k="${k}" class="${on ? 'on' : ''} ${cls}">${label}</button>`;
  const sec = (t, col, rows) => `<div class="sec" style="--sc:${col}"><b>${t}</b>${rows.map(x => `<div class="r">${x}</div>`).join('')}</div>`;
  const bossRow = DEV57.bossOpen ? GK_ORDER.map(k => chip('b_' + k, GATEKEEPERS[k].name)).join('') + chip('b_demon', '마왕') : '';
  const armed = performance.now() < DEV57.restartArm;
  this.el.innerHTML =
    sec('진행', '#7fb0ff', [[1, 2, 4, 8].map(v => chip('sp' + v, v + '배', d.speed === v)).join(''),
      chip('m_full', '완전 자동', mode === 'full') + chip('m_semi', '반자동', mode === 'semi') + chip('m_off', '수동', mode === 'off')]) +
    sec('성장', '#6fd08a', [chip('god', '무적', d.god) + chip('lv1', '레벨 +1') + chip('lv10', '레벨 +10') + chip('ult', '궁극기 충전')]) +
    sec('무기', '#ffb45a', [chip('wpick', '무기 고르기')]) +
    sec('구간 이동', '#c49aff', [chip('j_pick', '인물 선택 직전') + chip('j_awk', '인물 각성 직전'), chip('boss', '보스전', DEV57.bossOpen) + chip('fit', '레벨 맞춤 ' + (d.fit ? '켬' : '끔'), d.fit)].concat(bossRow ? [bossRow] : [])) +
    sec('기타', '#a9a9b8', [chip('elite', '정예') + chip('restart', armed ? '한 번 더' : '새 판', false, armed ? 'arm' : '') + chip('fps', 'FPS', d.fps)]);
  this.el.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { dev57Act(b.dataset.k); if (this.el) { this.draw(); this.place(); } }));
};
const dev57Play = () => G && STATE.mode === 'play' && !G.result;
function dev57Act(k) {
  const d = STATE.dev;
  if (k.startsWith('sp')) d.speed = +k.slice(2);
  else if (k === 'm_full') { d.auto = true; d.semi = false; if (STATE.mode === 'select') autoLater(); }
  else if (k === 'm_semi') { d.auto = true; d.semi = true; }
  else if (k === 'm_off') { d.auto = false; d.semi = false; }
  else if (k === 'fps' || k === 'god' || k === 'fit') { d[k] = !d[k]; if (k === 'god' && d.god && G) G.p.hp = G.p.maxHp; }
  else if (k === 'lv1') { if (G && G.p) addXp(G.p.need - G.p.xp); }
  else if (k === 'lv10') { if (G && G.p) { dev57Levels(10); toast('레벨 +10 (자동 선택)', '#6fd08a'); } }
  else if (k === 'ult') { if (G && G.p && G.p.job) G.p.ult = JOB_CFG.ultNeed; }
  else if (k === 'wpick') { if (G && G.p && (STATE.mode === 'play' || STATE.mode === 'pause')) dev57Open(); }
  else if (k === 'boss') DEV57.bossOpen = !DEV57.bossOpen;
  else if (k.startsWith('b_')) dev57Boss(k.slice(2));
  else if (k === 'j_pick') dev57JobPick();
  else if (k === 'j_awk') dev57JobAwk();
  else if (k === 'elite') { if (dev57Play()) spawnElite(); }
  else if (k === 'restart') {
    if (performance.now() < DEV57.restartArm) { DEV57.restartArm = 0; newRun(); }
    else { DEV57.restartArm = performance.now() + 2500; setTimeout(() => { if (DEV.el) { DEV.draw(); DEV.place(); } }, 2600); }
  }
}

/* ---------- 레벨 일괄 상승: 완전 자동 선택 기준으로 카드·발현·각성 자동 구성 ---------- */
function dev57Levels(n) {
  const p = G.p, prevSel = G.sel;
  for (let i = 0; i < n; i++) {
    levelUp(); G.pendingLv = Math.max(0, G.pendingLv - 1);
    G.sel = null;
    const cards = drawCards(selN());
    if (cards.length) { let bi = 0, bs = -1e9; cards.forEach((c, j) => { const s = cardScore(c); if (s > bs) { bs = s; bi = j; } }); applyCard(cards[bi]); }
    dev57Resolve();
  }
  G.sel = prevSel; p.xp = Math.min(p.xp, p.need - 1); recalc();
}
/* 대기 중 발현·각성 선택을 무작위로 처리 (완전 자동과 동일) */
function dev57Resolve() {
  while (G.pendingBr.length) {
    const q = G.pendingBr.shift(), it = q.kind === 'w' ? G.p.weapons.find(x => x.id === q.id) : G.p.passives.find(x => x.id === q.id);
    if (!it) continue;
    if (q.aw) { const o = AWAKEN[q.id]; if (o && !it.aw) it.aw = pick(o).k; }
    else { const o = BRANCHES[q.id]; if (o && !it.br) it.br = pick(o).k; }
  }
  recalc();
}
function dev57Fit(lv) { if (STATE.dev.fit && G.p.level < lv) dev57Levels(lv - G.p.level); }

/* ---------- 구간 이동 ---------- */
function dev57JobPick() {
  if (!dev57Play()) return;
  if (G.p.job) { toast('이미 인물 선택 완료 · 새 판에서 사용', '#c49aff'); return; }
  dev57Fit(DEV57.lvJob);
  const q = ringAt(120, 160); G.altar = { x: q.x, y: q.y, r: JOB_CFG.altarR, stay: 0, at: G.ph.i };
  toast('인물 선택 직전 · 제단 출현', '#c49aff');
}
function dev57JobAwk() {
  if (!dev57Play()) return;
  if (G.p.job2) { toast('이미 인물 각성 완료', '#c49aff'); return; }
  if (!G.p.job) { const c = jobCands()[0]; applyJob(c.id); }
  dev57Fit(DEV57.lvAwk);
  G.job2Ready = false; G.pendingJob2 = true;
}
function dev57Boss(k) {
  if (!dev57Play()) return;
  if (isBossPhase()) { toast('보스전 진행 중', '#c49aff'); return; }
  const ph = G.ph;
  if (k === 'demon') {
    dev57Fit(DEV57.lvDemon);
    G.runType = 'retry'; ph.order = ph.order.slice(0, ph.i + 1).concat('demon');
  } else {
    dev57Fit(DEV57.lvGate);
    G.gk = k;
    const gi = ph.order.indexOf('gate'); ph.order = ph.order.slice(0, ph.i + 1).concat('gate', gi >= 0 ? ph.order.slice(gi + 1) : []);
  }
  ph.i = ph.order.indexOf(k === 'demon' ? 'demon' : 'gate') - 1; ph.inGap = true; ph.id = null; ph.gapT = 1;
  DEV57.bossOpen = false;
  toast((k === 'demon' ? '마왕' : GATEKEEPERS[k].name) + '전으로 이동', '#c49aff');
}

/* ---------- 무기 고르기 창 ---------- */
function dev57Open() {
  if (DEV57.win) return;
  DEV57.prevMode = STATE.mode; STATE.mode = 'devwin';
  DEV57.win = document.createElement('div'); DEV57.win.className = 'devwin'; document.body.appendChild(DEV57.win);
  dev57Draw();
}
function dev57Close() {
  if (!DEV57.win) return;
  DEV57.win.remove(); DEV57.win = null; DEV57.sel = null;
  if (STATE.mode === 'devwin') STATE.mode = DEV57.prevMode === 'pause' ? 'pause' : 'play';
  if (DEV.el) DEV.draw();
}
function dev57Draw() {
  const W = DEV57.win; if (!W) return;
  const p = G.p, b = typeof baseW === 'function' ? baseW() : null, wn = id => WEAPONS[id] ? WEAPONS[id].name : id;
  const btn = (k, label, cls = '') => `<button data-k="${k}" class="${cls}">${label}</button>`;
  const sec = (t, col, body) => `<div class="sec" style="--sc:${col}"><b>${t}</b>${body}</div>`;
  let fuse;
  if (!p.job) fuse = `<p>인물이 없어 연성 불가 · 인물 먼저 선택</p><div class="r">${JOB_ORDER.map(j => btn('job_' + j, JOBS[j].name)).join('')}</div>`;
  else {
    const cand = WEAPON_ORDER.filter(id => !b || id !== b.id).filter(id => !p.weapons.some(w => w.id === id && w.fu));
    fuse = `<p>${esc(JOBS[p.job].name)} · 짝 무기 선택 → 즉시 연성 무기 획득 (전용 무기·짝 무기 Lv 5·각성 자동)</p><div class="r">${cand.map(id => btn('fu_' + id, wn(id), p.weapons.some(w => w.id === id) ? 'own' : '')).join('')}</div>`;
  }
  const own = id => p.weapons.find(w => w.id === id);
  const list = `<div class="r">${WEAPON_ORDER.map(id => { const w = own(id); return btn('w_' + id, wn(id) + (w ? ' ' + (w.fu ? '연성' : 'Lv ' + w.lvl) : ''), (DEV57.sel === id ? 'on ' : '') + (w ? 'own' : '')); }).join('')}</div>`;
  let det = '';
  const s = DEV57.sel;
  if (s) {
    const lvR = `<div class="r">${[1, 2, 3, 4, 5].map(v => btn('lv_' + v, 'Lv ' + v, DEV57.selLv === v ? 'on' : '')).join('')}</div>`;
    const brR = BRANCHES[s] ? `<p>발현 (Lv ${BRANCH_AT})</p><div class="r">${BRANCHES[s].map(o => btn('br_' + o.k, o.nm, DEV57.selBr === o.k ? 'on' : '')).join('')}</div>` : '';
    const awR = AWAKEN[s] ? `<p>각성 (Lv ${AW43})</p><div class="r">${AWAKEN[s].map(o => btn('aw_' + o.k, o.nm, DEV57.selAw === o.k ? 'on' : '')).join('')}</div>` : '';
    det = sec(wn(s), '#7fb0ff', lvR + brR + awR + btn('apply', '적용', 'go'));
  }
  W.innerHTML = `<div class="box"><h2>무기 고르기 ${btn('close', '닫기')}</h2>${sec('연성 완료', '#ff8ad0', fuse)}${sec('무기 선택', '#ffb45a', list)}${det}</div>`;
  W.querySelectorAll('button').forEach(e => e.addEventListener('click', () => dev57WinAct(e.dataset.k)));
}
function dev57WinAct(k) {
  const p = G.p;
  if (k === 'close') return dev57Close();
  if (k.startsWith('job_')) { applyJob(k.slice(4)); recalc(); }
  else if (k.startsWith('fu_')) { if (dev57Fuse(k.slice(3))) return dev57Close(); }
  else if (k.startsWith('w_')) {
    const id = k.slice(2), w = p.weapons.find(x => x.id === id && !x.fu);
    DEV57.sel = id; DEV57.selLv = w ? Math.min(w.lvl, AW43) : 1; DEV57.selBr = w && w.br || null; DEV57.selAw = w && w.aw || null;
  }
  else if (k.startsWith('lv_')) DEV57.selLv = +k.slice(3);
  else if (k.startsWith('br_')) DEV57.selBr = k.slice(3);
  else if (k.startsWith('aw_')) DEV57.selAw = k.slice(3);
  else if (k === 'apply') { if (dev57SetW(DEV57.sel, DEV57.selLv, DEV57.selBr, DEV57.selAw)) return dev57Close(); }
  dev57Draw();
}
/* 무기 지정: 미보유면 획득(칸 여유 필요), 레벨·발현·각성 설정 */
function dev57SetW(id, lvl, br, aw) {
  const p = G.p; if (!id) return false;
  let w = p.weapons.find(x => x.id === id);
  if (w && w.fu) { toast('연성 무기는 변경 불가', '#ff8a7a'); return false; }
  if (!w) {
    if (slotWs().length >= slotCount()) { toast('무기 칸 가득 참', '#ff8a7a'); return false; }
    addWeapon(id); w = p.weapons[p.weapons.length - 1];
  }
  dev57Form(w, lvl, br, aw);
  toast(`${WEAPONS[id].name} Lv ${w.lvl}`, '#ffb45a');
  return true;
}
function dev57Form(w, lvl, br, aw) {
  const id = w.id; w.lvl = lvl;
  G.pendingBr = G.pendingBr.filter(q => q.id !== id);
  if (BRANCHES[id] && lvl >= BRANCH_AT) { w.br = br || w.br || BRANCHES[id][0].k; w.brQ = true; } else { delete w.br; delete w.brQ; }
  if (AWAKEN[id] && lvl >= AW43) { w.aw = aw || w.aw || AWAKEN[id][0].k; w.awQ = true; } else { delete w.aw; delete w.awQ; }
  recalc();
}
/* 연성 완료: 전용 무기·짝 무기를 Lv 5·각성으로 맞춘 뒤 즉시 연성 */
function dev57Fuse(id) {
  const p = G.p; if (!p.job) return false;
  const b = baseW(); if (!b) { toast('전용 무기 없음', '#ff8a7a'); return false; }
  let w = slotWs().find(x => x.id === id);
  if (w && w.fu) return false;
  if (!w) {
    if (slotWs().length >= slotCount()) { toast('무기 칸 가득 참 · 짝 무기 칸 필요', '#ff8a7a'); return false; }
    addWeapon(id); w = p.weapons[p.weapons.length - 1];
  }
  if (b.lvl < AW43 || !awDone(b)) dev57Form(b, AW43, b.br, b.aw);
  dev57Form(w, AW43, w.br, w.aw);
  applyFuse(id);
  return !!w.fu;
}
