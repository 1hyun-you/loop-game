/* ============================================================
   0.45 연성 도달·상단 화면 정리 (회차 51, 표현·보강 단계)
   • 기본 무기 강화 카드 등장 가중 ×3, 자동 플레이 기본 무기 강화 최우선
   • 상단 화면: 1단 패널(직업 이름·기본 무기 / 시간·페이즈 n/N / 처치·체력) + 무기 5칸 + 보조 효과 5칸
   • 무기 칸 테두리: 일반 무기 없음, 연성 무기만 직업 색 이중 테두리, 기본 무기는 직업 색 테두리
   • 일시정지 버튼: 상단 패널과 같은 높이·모서리·색으로 정렬
   • 보스전: 보조 효과 줄이 부드럽게 접히고 그 자리에 보스 체력 (무기 칸 유지)
   • 치트 버튼(구 DEV): 끌어서 자유 이동, 위치 기억
   • 배치·테두리는 임시 표현 (최종 외형 GPT 요청 대상)
   ============================================================ */
const BASE_CARD_W = 3;
const _levelCands45 = levelCands;
levelCands = function () { const r = _levelCands45.apply(this, arguments), b = G.p && baseW && baseW(); if (b) for (const c of r) if (c.t === 'wup' && c.id === b.id) c.w *= BASE_CARD_W; return r; };
const _cardScore45 = cardScore;
cardScore = function (c) { const b = G.p && baseW(); if (b && c.t === 'wup' && c.id === b.id) return 7 + rand(0, 0.5); return _cardScore45(c); };
const _cardInfo45 = cardInfo;
cardInfo = function (c) { const r = _cardInfo45(c), b = G.p && baseW(); if (b && c.t === 'wup' && c.id === b.id) r.tag = '기본 무기 · ' + r.tag; return r; };

/* ---------- 상단 배치 ---------- */
const H45 = { k: 0, last: 0 };
hudLayout = function (width = VIEW.cw, sat = VIEW.sat) {
  const w = Math.min(600, width - 16), x = (width - w) / 2, y = sat + 6, S = clamp(Math.floor((width - 280) / 28) + 22, 22, 30), gap = 3, pw = 44, contentW = w - pw - 4, top = 51;
  const tile = (i, row, right = false, n = 1) => ({ x: right ? x + contentW - n * S - (n - 1) * gap + i * (S + gap) : x + 2 + i * (S + gap), y: y + top + row * (S + gap), w: S, h: S });
  const boss = H45.k, h = top + S + (S + gap) * (1 - boss) + (boss ? 34 * boss : 0);
  return { x, y, w, h, S, gap, contentW, tile, top, pause: { x: x + w - pw, y: y + 3, w: pw, h: 44 }, kills: { x: x + contentW - 76, y: y + 4, w: 76, h: 18 } };
};
function bossOn45() { return !!(G.gkMob && !G.gkMob.dead && G.ph && isBossPhase()); }
drawSlots = function (c) {
  const L = hudLayout(), p = G.p, T = G.tm, col = p.job ? JOB_COL[p.job] : '#c3a86d', K = 1 - H45.k; c.save(); c.imageSmoothingEnabled = true;
  slotWs().forEach((it, i) => {
    const r = L.tile(i, 0); uiTile(c, r, iconCanvas(it.id, 2), it.fu ? col : 'rgba(0,0,0,0)', it.lvl);
    if (it.fu) { c.strokeStyle = col; c.lineWidth = 1.5; uiRound(c, r.x - 2, r.y - 2, r.w + 4, r.h + 4, 6); c.stroke(); uiRound(c, r.x + 2, r.y + 2, r.w - 4, r.h - 4, 3); c.stroke(); }
  });
  const specials = [[p.exw1, EXW1], [p.exw, EXW]].filter(([s]) => s);
  specials.forEach(([st, table], i) => { const X = table[st.id], r = L.tile(i, 0, true, specials.length); uiTile(c, r, uiAbilityArt(st.id, table === EXW1), '#c3a86d', undefined, X.cd > 0.6 ? 1 - Math.max(0, st.t) / X.cd : undefined); uiText(c, table === EXW1 ? 'Ⅰ' : 'Ⅱ', r.x + 3, r.y + 5, 7, '#fff0bb', 'left', 10, 700); });
  if (K > 0.02) {
    c.globalAlpha = K; c.translate(0, -(1 - K) * 10);
    const pcd = { magnet: ['vacuum', () => 1 - (T.vac == null ? 30 : T.vac) / 30], vit: ['shield', () => p.shield ? 1 : 1 - T.shield / 12], haste: ['charge', () => 1 - T.charge / 8] };
    for (let i = 0; i < CFG.slots.passive; i++) { const it = p.passives[i], q = it && pcd[it.id]; if (!it) continue; uiTile(c, L.tile(i, 1), iconCanvas(it.id, 2), 'rgba(0,0,0,0)', it.lvl, q && it.br === q[0] ? q[1]() : undefined); }
    const ds = jobDials(); ds.forEach((d, i) => { const key = d.ic === '궁' ? 'spark' : d.ic === '기' ? 'crest' : d.ic === '탑' ? 'gear' : 'crest'; uiTile(c, L.tile(i, 1, true, ds.length), UI_ART.images[key], d.col, undefined, d.k); });
  }
  c.restore();
};
drawBossBar = function (c) {
  const e = G.gkMob; if (!e || e.dead || !G.ph || !isBossPhase() || H45.k < 0.02) return;
  const L = hudLayout(), D = bossDef(e.gk), y = L.y + L.top + L.S + L.gap + (1 - H45.k) * 8, bw = L.contentW - 4;
  c.save(); c.globalAlpha = H45.k;
  uiPanel(c, L.x, y, L.contentW + 2, 30, 'rgba(31,25,36,.78)', '#946d6988', 6);
  const name = e.gk === 'demon' ? `${D.name} · ${['그림자 군주', '암흑 결계', '종언'][e.st]} ${e.st + 1}/3` : `${D.name} · ${D.gate}`;
  uiText(c, name, L.x + 8, y + 9, 11, '#eed6c4', 'left', bw - 50, 600);
  uiText(c, Math.max(0, Math.round(e.hp / e.maxHp * 100)) + '%', L.x + L.contentW - 4, y + 9, 11, '#eed6c4', 'right', 44, 600);
  uiBar(c, L.x + 6, y + 19, bw - 2, 6, e.hp / e.maxHp, e.rage || e.st === 2 ? '#d68c72' : '#ba8188');
  if (e.gk === 'demon') { c.fillStyle = '#f4debe'; for (const k of DM_CFG.stages) c.fillRect(L.x + 6 + (bw - 2) * k, y + 19, 1, 6); }
  c.restore();
};
drawHUD = function (c) {
  const now = performance.now(), dt = Math.min(0.1, (now - (H45.last || now)) / 1000); H45.last = now;
  H45.k += ((bossOn45() ? 1 : 0) - H45.k) * Math.min(1, dt * 7); if (Math.abs(H45.k - (bossOn45() ? 1 : 0)) < 0.01) H45.k = bossOn45() ? 1 : 0;
  const L = hudLayout(), p = G.p, ph = G.ph, P = curPhase(), b = p.job && baseW(), col = p.job ? JOB_COL[p.job] : '#f0dfb4'; c.save(); c.imageSmoothingEnabled = true;
  uiPanel(c, L.x, L.y + 3, L.contentW + 2, 44, 'rgba(22,31,43,.60)', '#6b6c6044', 8);
  uiBar(c, L.x + 6, L.y + 5, L.contentW - 10, 2, clamp(G.rc ? G.rc.xpShow : p.xp / Math.max(1, p.need), 0, 1), '#91bfcb', 'rgba(0,0,0,0)');
  /* 왼쪽: 기본 무기 + 직업 이름 · Lv */
  let tx = L.x + 8;
  if (b) {
    const r = { x: L.x + 6, y: L.y + 10, w: 32, h: 32 }; uiTile(c, r, iconCanvas(b.id, 2), col, b.lvl);
    if (baseRetired()) { c.globalAlpha = 0.55; c.fillStyle = '#0e1725'; uiRound(c, r.x, r.y, r.w, r.h, 5); c.fill(); c.globalAlpha = 1; }
    tx = r.x + r.w + 6;
  }
  const status = p.job === 'druid' ? (G.tm.wrath > 0 ? ' · 분노' : ' · 동료 ' + G.pets.length) : p.job === 'priest' ? ' · 정화 ' + p.holy : '';
  uiText(c, p.job ? (p.job2 && JOBS[p.job2] ? JOBS[p.job2].name : JOBS[p.job].name) : 'Lv ' + p.level, tx, L.y + 19, 13, col, 'left', 92, 700);
  uiText(c, p.job ? 'Lv ' + p.level + status : '전직 전', tx, L.y + 35, 11, '#d9cbb3', 'left', 92, 500);
  /* 가운데: 시간 + 페이즈 이름 n/N */
  const cx = L.x + L.contentW * 0.52;
  uiText(c, fmtTime(G.time), cx, L.y + 17, 15, '#f0e9d9', 'center', 70, 650);
  const pn = P ? curPhaseName() : G.result === 'clear' ? '돌파' : '이동 중', cnt = P ? `${ph.i + 1}/${ph.order.length}` : '';
  c.font = `600 11px ${UI_ART.font}`; const nw = Math.min(110, c.measureText(pn).width), cw2 = cnt ? c.measureText(cnt).width + 10 : 0, pwid = nw + cw2 + 14, px = cx - pwid / 2, py = L.y + 28;
  uiPanel(c, px, py, pwid, 15, ph.ambush ? 'rgba(90,40,30,.7)' : 'rgba(40,46,40,.7)', ph.ambush ? '#e6a58d66' : '#cdb57c55', 7);
  uiText(c, pn, px + 7, py + 8, 11, ph.ambush ? '#f0b8a0' : '#efdcaa', 'left', 110, 600);
  if (cnt) { uiPanel(c, px + pwid - cw2 - 3, py + 2, cw2, 11, 'rgba(205,181,124,.85)', 'rgba(0,0,0,0)', 5); uiText(c, cnt, px + pwid - cw2 / 2 - 3, py + 8, 9, '#1c1a14', 'center', cw2, 700); }
  if (P) uiBar(c, px + 4, py + 16, pwid - 8, 2, phaseProgress(), ph.accT > 0 ? '#f1e6bc' : '#cdb57c', 'rgba(0,0,0,.35)');
  /* 오른쪽: 처치 + 체력 */
  const kills = G.kills >= 10000 ? (G.kills / 10000).toFixed(1) + '만' : G.kills, rx = L.x + L.contentW - 4;
  uiText(c, '처치 ' + kills, rx, L.y + 17, 12, '#d9cbb3', 'right', 80, 600);
  const hp = clamp(p.hp / p.maxHp, 0, 1); uiBar(c, rx - 56, L.y + 33, 56, 5, hp, hp > 0.3 ? '#9fc19d' : '#d58c86');
  uiText(c, Math.ceil(p.hp), rx - 60, L.y + 35, 11, '#d7e1d8', 'right', 34);
  drawSlots(c); drawBossBar(c);
  const below = L.y + L.h + 4;
  if (STATE.dev.fps && STATE.mode !== 'result') uiText(c, Math.round(STATE.fps) + ' FPS · 적 ' + aliveCount(), L.x + L.w - 2, below + 10, 10, '#d1d8d9', 'right', L.w - 8);
  let ty = Math.max(VIEW.ch * 0.3, below + 30); for (const t of G.toasts) { c.globalAlpha = Math.min(1, (t.dur - t.t) * 3); uiText(c, t.text, VIEW.cw / 2, ty, 14, t.color, 'center', VIEW.cw - 30, 600); ty += 24; } c.globalAlpha = 1;
  drawGuide(c); c.restore();
};
/* 일시정지 버튼: 상단 패널과 같은 표현 */
(function () {
  if (typeof document === 'undefined') return;
  const st = document.createElement('style');
  st.textContent = `.pausebtn{border-radius:8px!important;border:1px solid #6b6c6066!important;background:rgba(22,31,43,.60)!important;box-shadow:none!important}
.devbtn{touch-action:none;user-select:none;cursor:grab}.devbtn.drag{cursor:grabbing;opacity:.85}`;
  document.head.appendChild(st);
})();
/* ---------- 치트 버튼: 끌어서 이동 ---------- */
const _devInit45 = DEV.init;
DEV.init = function () {
  _devInit45.call(this); const b = this.btn; if (!b) return;
  b.textContent = '치트'; b.setAttribute('aria-label', '치트 메뉴');
  const KEY = CFG.SAVE_KEY + '_cheatpos', put = (x, y) => { const W = innerWidth, H = innerHeight, r = b.getBoundingClientRect(); x = clamp(x, 4, W - r.width - 4); y = clamp(y, 4, H - r.height - 4); b.style.left = x + 'px'; b.style.top = y + 'px'; b.style.bottom = 'auto'; b.style.right = 'auto'; return [x, y]; };
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) requestAnimationFrame(() => put(s[0], s[1])); } catch (e) {}
  let d = null, moved = false;
  b.addEventListener('pointerdown', e => { const r = b.getBoundingClientRect(); d = { ox: e.clientX - r.left, oy: e.clientY - r.top, sx: e.clientX, sy: e.clientY }; moved = false; try { b.setPointerCapture(e.pointerId); } catch (x) {} });
  b.addEventListener('pointermove', e => { if (!d) return; if (!moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 6) return; moved = true; b.classList.add('drag'); put(e.clientX - d.ox, e.clientY - d.oy); });
  const end = () => { if (!d) return; d = null; b.classList.remove('drag'); if (moved) { const r = b.getBoundingClientRect(); try { localStorage.setItem(KEY, JSON.stringify([r.left, r.top])); } catch (e) {} } };
  b.addEventListener('pointerup', end); b.addEventListener('pointercancel', end);
  b.addEventListener('click', e => { if (moved) { e.stopImmediatePropagation(); e.preventDefault(); moved = false; } }, true);
};
