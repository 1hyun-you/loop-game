/* ============================================================
   0.37 화면 다듬기 — 첫 화면 히어로형 도트 일러스트, 아이콘 버튼, 고정 헤더·밀기 탭,
   화면 진입 0.2초 전환, 선택 카드 순차 등장·확정 반짝임
   ============================================================ */

/* ---------- 첫 화면 도트 일러스트 (144×256 텍셀, 화면 크기에 맞춰 정수 느낌 확대) ---------- */
const HERO_W = 144, HERO_H = 256;
const HERO = { cv: null, base: null, t: 0, timer: 0, flies: [], clouds: [] };
function heroRng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function heroBase() {
  const cv = document.createElement('canvas'); cv.width = HERO_W; cv.height = HERO_H;
  const c = cv.getContext('2d'), R = heroRng(37), px = (x, y, col) => { c.fillStyle = col; c.fillRect(x | 0, y | 0, 1, 1); };
  /* 하늘: 남색 → 보라 → 노을 주황, 4×4 순서 디더 */
  const SKY = ['#15122e', '#211a44', '#33235a', '#4c2f6c', '#6e3c72', '#9a4c6c', '#c8645e', '#ec8c5a', '#f7b46a'];
  const skyH = 160;
  for (let y = 0; y < skyH; y++) {
    const f = Math.pow(y / skyH, 1.25) * (SKY.length - 1), i = Math.floor(f), k = f - i;
    for (let x = 0; x < HERO_W; x++) px(x, y, k * 16 > BAYER4[(y & 3) * 4 + (x & 3)] ? SKY[Math.min(SKY.length - 1, i + 1)] : SKY[i]);
  }
  /* 별 */
  for (let i = 0; i < 46; i++) { const x = R() * HERO_W, y = R() * 78; px(x, y, R() < 0.25 ? '#fff3b0' : '#cfc8ff'); }
  /* 달: 노을 위 큰 달 + 빛무리 */
  const mx = 100, my = 22, mr = 10;
  for (let y = -mr - 5; y <= mr + 5; y++) for (let x = -mr - 5; x <= mr + 5; x++) {
    const d = Math.hypot(x, y);
    if (d <= mr) px(mx + x, my + y, (x - 4) * (x - 4) + (y + 3) * (y + 3) < 20 || (x + 5) * (x + 5) + (y - 4) * (y - 4) < 9 ? '#e6dcc0' : d > mr - 1.2 ? '#f0e6cc' : '#fff8e0');
    else if (d <= mr + 5 && BAYER4[((y + 20) & 3) * 4 + ((x + 20) & 3)] < (mr + 5 - d) * 2.4) px(mx + x, my + y, '#5a4288');
  }
  /* 먼 산맥 2겹 */
  const ridge = (base, amp, f1, f2, ph, col, top) => {
    const H = [];
    for (let x = 0; x < HERO_W; x++) {
      const h = base - amp * (0.55 * Math.sin(x * f1 + ph) + 0.3 * Math.sin(x * f2 + ph * 2.3) + 0.15 * Math.sin(x * 0.31 + ph));
      H.push(Math.floor(h)); for (let y = Math.floor(h); y < HERO_H; y++) px(x, y, y === Math.floor(h) && top ? top : col);
    }
    return H;
  };
  ridge(132, 16, 0.045, 0.11, 1.2, '#3a2a5e', '#56407e');
  /* 마왕성: 왼쪽 먼 봉우리 위 실루엣 + 창 불빛 */
  const cx0 = 26, cy0 = 112;
  c.fillStyle = '#231a3c';
  c.fillRect(cx0, cy0 - 14, 22, 30); c.fillRect(cx0 - 4, cy0 - 22, 7, 26); c.fillRect(cx0 + 19, cy0 - 25, 7, 29); c.fillRect(cx0 + 8, cy0 - 30, 6, 20);
  for (const [x, y, h] of [[cx0 - 4, cy0 - 22, 5], [cx0 + 19, cy0 - 25, 6], [cx0 + 8, cy0 - 30, 7]]) for (let i = 0; i < h; i++) c.fillRect(x + 3 - Math.floor(i / 2), y - i, 1 + Math.floor(i / 2) * 2 - (i % 2 ? 0 : 0), 1);
  for (let i = 0; i < 4; i++) c.fillRect(cx0 + i * 6, cy0 - 16, 3, 2);
  c.fillStyle = '#ffb04a';
  for (const [x, y] of [[cx0 + 4, cy0 - 8], [cx0 + 10, cy0 - 8], [cx0 + 16, cy0 - 8], [cx0 - 2, cy0 - 16], [cx0 + 21, cy0 - 18], [cx0 + 10, cy0 - 22]]) c.fillRect(x, y, 1, 2);
  for (let y = cy0 - 40; y < cy0 + 4; y++) for (let x = cx0 - 10; x < cx0 + 34; x++) { const d = Math.hypot(x - cx0 - 11, (y - cy0 + 14) * 1.3); if (d > 18 && d < 23 && BAYER4[(y & 3) * 4 + (x & 3)] < 3) px(x, y, '#8a5ac8'); }
  for (let x = cx0 - 30; x < cx0 + 52; x++) { const t = cy0 + 4 + Math.pow(Math.abs(x - cx0 - 11) / 40, 1.5) * 34; for (let y = Math.floor(t); y < 160; y++) px(x, y, y === Math.floor(t) ? '#56407e' : '#3a2a5e'); }   // 마왕성 봉우리
  ridge(150, 10, 0.07, 0.17, 3.1, '#2a4a52', '#3e6a64');
  /* 가까운 언덕 */
  const hill = ridge(170, 8, 0.05, 0.13, 0.4, '#2f6a44', '#4b923e');
  /* 들판: 위는 어둡게, 아래로 밝게 */
  const FIELD = ['#3a7a3e', '#4b923e', '#59a545', '#62b04c'];
  for (let x = 0; x < HERO_W; x++) for (let y = Math.max(172, hill[x] + 5); y < HERO_H; y++) {
    const f = Math.min(1, (y - 172) / 60) * (FIELD.length - 1), i = Math.floor(f), k = f - i;
    px(x, y, k * 16 > BAYER4[(y & 3) * 4 + (x & 3)] ? FIELD[Math.min(FIELD.length - 1, i + 1)] : FIELD[i]);
  }
  /* 오솔길: 화면 아래 중앙에서 마왕성 쪽으로 가늘어짐 */
  for (let y = 176; y < HERO_H; y++) {
    const k = (y - 176) / (HERO_H - 176), w = 2 + k * 20, cx = 40 + (1 - (1 - k) * (1 - k)) * 72 + Math.sin(y * 0.08) * 3 * k;
    for (let x = Math.floor(cx - w / 2); x <= cx + w / 2; x++) px(x, y, (x === Math.floor(cx - w / 2) || x >= Math.floor(cx + w / 2)) ? '#a8844e' : BAYER4[(y & 3) * 4 + (x & 3)] < 3 ? '#d8b878' : '#c8a46a');
  }
  /* 풀 무더기·꽃 */
  for (let i = 0; i < 150; i++) {
    const y = 176 + Math.pow(R(), 0.8) * 80, x = R() * HERO_W, k = (y - 176) / 80, pc = 40 + (1 - (1 - k) * (1 - k)) * 72;
    if (Math.abs(x - pc) < 4 + k * 12) continue;
    if (R() < 0.18) { px(x, y, R() < 0.5 ? '#fff3b0' : '#f39ab0'); px(x, y + 1, '#3a8c40'); }
    else { const col = k > 0.5 ? '#79c65a' : '#59a545'; px(x, y, col); px(x - 1, y + 1, col); px(x + 1, y + 1, col); }
  }
  /* 주인공: 오솔길 위, 2배 크기, 발밑 그림자 */
  try {
    const g = bakeGrid(SPR.hero.frames[0], Object.assign({}, DOT_PAL, { P: playerColor(), p: shadeHex(playerColor(), 0.68) }), 1, false, 'n', null);
    const hx = Math.round(82 - g.cv.width / 2), fy = 199, hy = fy - g.cv.height + 1;
    c.fillStyle = 'rgba(20,40,20,0.45)'; c.fillRect(hx + 3, fy, g.cv.width - 6, 2);
    c.drawImage(g.cv, hx, hy);
    const sl = bakeGrid(SPR.slime.frames[0], DOT_PAL, 1, false, 'n', null);
    c.drawImage(sl.cv, 12, 196); c.drawImage(sl.cv, 30, 184); c.drawImage(sl.cv, 124, 214);
  } catch (e) { }
  return cv;
}
function heroFrame() {
  const cv = HERO.cv; if (!cv || !cv.isConnected) { clearInterval(HERO.timer); HERO.timer = 0; return; }
  const c = cv.getContext('2d'); HERO.t += 1;
  c.drawImage(HERO.base, 0, 0);
  /* 구름 띠 (천천히 흐름) */
  for (const cl of HERO.clouds) {
    const x = ((cl.x + HERO.t * cl.v) % (HERO_W + 60)) - 30;
    c.fillStyle = cl.c; c.fillRect(Math.round(x), cl.y, cl.w, 2); c.fillRect(Math.round(x) + 3, cl.y - 1, cl.w - 8, 1); c.fillRect(Math.round(x) + 6, cl.y + 2, cl.w - 10, 1);
  }
  /* 반짝이는 별 몇 개 */
  const R = heroRng(HERO.t >> 3);
  for (let i = 0; i < 5; i++) { const x = Math.floor(R() * HERO_W), y = Math.floor(R() * 70); c.fillStyle = '#ffffff'; c.fillRect(x, y, 1, 1); c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(x - 1, y, 3, 1); c.fillRect(x, y - 1, 1, 3); }
  /* 반딧불 */
  for (const f of HERO.flies) {
    const x = f.x + Math.sin(HERO.t * 0.05 + f.p) * 6, y = f.y + Math.cos(HERO.t * 0.037 + f.p) * 4, a = 0.5 + 0.5 * Math.sin(HERO.t * 0.15 + f.p);
    c.fillStyle = `rgba(255,240,140,${0.25 * a})`; c.fillRect(Math.round(x) - 1, Math.round(y), 3, 1); c.fillRect(Math.round(x), Math.round(y) - 1, 1, 3);
    c.fillStyle = `rgba(255,250,200,${a})`; c.fillRect(Math.round(x), Math.round(y), 1, 1);
  }
}
function pixelHeroMount(cv) {
  if (!HERO.base) {
    HERO.base = heroBase(); const R = heroRng(5);
    HERO.flies = Array.from({ length: 9 }, () => ({ x: R() * HERO_W, y: 165 + R() * 50, p: R() * 7 }));
    HERO.clouds = Array.from({ length: 4 }, (_, i) => ({ x: R() * 200, y: 60 + i * 17 + Math.floor(R() * 6), w: 18 + Math.floor(R() * 22), v: 0.05 + R() * 0.08, c: i < 2 ? 'rgba(120,90,160,0.55)' : 'rgba(240,150,120,0.45)' }));
  }
  cv.width = HERO_W; cv.height = HERO_H; HERO.cv = cv; heroFrame();
  if (!HERO.timer) HERO.timer = setInterval(heroFrame, 90);
}
function heroReset() { HERO.base = null; }   // 주인공 색상 변경 시 재생성

/* ---------- 도트 아이콘 버튼 (도감·설정·돌아가기) ---------- */
const UI_ICON = {
  book: ['.kkkkkkkkk..', 'kuuuuuuuuuk.', 'kuUyyyyyUuke', 'kuUyuuuyUuke', 'kuUyuyuyUuke', 'kuUyuuuyUuke', 'kuUyyyyyUuke', 'kuUUUUUUUuke', 'kuuuuuuuuuke', 'kUUUUUUUUUke', 'keeeeeeeeeek', '.kkkkkkkkkk.'],
  gear: ['....kkkk....', '.kk.kMMk.kk.', '.kMkkMMkkMk.', '..kMMMMMMk..', 'kkkMmkkmMkkk', 'kMMMk..kMMMk', 'kMMMk..kMMMk', 'kkkMmkkmMkkk', '..kMMMMMMk..', '.kMkkMMkkMk.', '.kk.kMMk.kk.', '....kkkk....'],
  back: ['............', '.....kk.....', '....keek....', '...keeek....', '..keeeekkkk.', '.keeeeeeeeek', '.keeeeeeeeek', '..keeeekkkk.', '...keeek....', '....keek....', '.....kk.....', '............'],
};
const UI_ICON_URL = {};
function uiIcon(k) { if (!UI_ICON_URL[k]) UI_ICON_URL[k] = bakeGrid(UI_ICON[k], DOT_PAL, 4, false, 'n', null).cv.toDataURL(); return UI_ICON_URL[k]; }
const icBtn = (id, k, label, cls = '') => `<button class="icb ${cls}" id="${id}" aria-label="${label}"><img src="${uiIcon(k)}" alt=""></button>`;

/* ---------- 고정 헤더 + 밀기 탭 ---------- */
/* tabs: [[키, 이름]], cur: 현재 키 → 헤더 HTML (탭 밑줄 표시기 포함) */
function pgHead(title, backId, tabs, cur, attr = 'data-tab', extra = '') {
  const i = tabs ? Math.max(0, tabs.findIndex(t => t[0] === cur)) : 0;
  return `<div class="pgh"><div class="pgt">${icBtn(backId, 'back', '돌아가기')}<h2>${title}</h2><span class="pgs"></span></div>${extra}
    ${tabs ? `<div class="ptabs" style="--n:${tabs.length};--i:${i}">${tabs.map(([k, nm]) => `<button class="${k === cur ? 'on' : ''}" ${attr}="${k}">${nm}</button>`).join('')}<i class="bar"></i></div>` : ''}</div>`;
}
/* 좌우 밀기 (0.37, 0.40부터 미사용·호환용) */
function uiSwipe() { }
/* 0.40 좌우 끌기 탭: 탭 화면을 가로로 이어 붙이고 손가락을 따라 이동, 놓으면 가까운 탭에 맞춰 정지
   구조: .layer.pager > .pgh(.ptabs) + .pgv > .pgtr > .pgp[data-pk] (탭마다 개별 세로 스크롤) */
function uiPager(L, keys, cur, onCh) {
  const V = L && L.querySelector('.pgv'), T = V && V.querySelector('.pgtr'), P = L && L.querySelector('.ptabs'), n = keys.length;
  if (!T) return { go() { } };
  let i = Math.max(0, keys.indexOf(cur));
  const drag = on => { T.classList.toggle('drag', on); if (P) P.classList.toggle('drag', on); };
  const set = j => {
    j = Math.max(0, Math.min(n - 1, j)); const ch = j !== i; i = j; drag(false);
    T.style.setProperty('--x', '0px'); T.style.setProperty('--i', i);
    if (P) { P.style.setProperty('--i', i); P.querySelectorAll('button').forEach((b, k) => b.classList.toggle('on', k === i)); }
    T.querySelectorAll('.pgp').forEach((d, k) => d.classList.toggle('on', k === i));
    if (ch) { if (typeof sfx === 'function') sfx('ui'); onCh && onCh(keys[i], i); }
  };
  let x0 = 0, y0 = 0, t0 = 0, mode = 0, dx = 0;
  V.addEventListener('touchstart', e => { if (e.touches.length !== 1) { mode = 3; return; } const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; t0 = performance.now(); mode = 0; dx = 0; }, { passive: true });
  V.addEventListener('touchmove', e => {
    if (mode >= 2) return; const t = e.touches[0]; dx = t.clientX - x0; const dy = t.clientY - y0;
    if (!mode) { if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.2) { mode = 1; drag(true); } else if (Math.abs(dy) > 8) { mode = 2; return; } else return; }
    if (e.cancelable) e.preventDefault();
    const d = (i === 0 && dx > 0) || (i === n - 1 && dx < 0) ? dx / 3 : dx;     // 양 끝 저항
    T.style.setProperty('--x', d + 'px'); if (P) P.style.setProperty('--i', i - d / (V.clientWidth || 360));
  }, { passive: false });
  V.addEventListener('touchend', e => {
    const t = e.changedTouches[0], ddx = t.clientX - x0, ddy = t.clientY - y0, W = V.clientWidth || 360, dt = Math.max(1, performance.now() - t0);
    const h = mode === 1 || (mode === 0 && Math.abs(ddx) >= 60 && Math.abs(ddx) > Math.abs(ddy) * 1.5);
    if (mode === 1) { const kill = ev => { ev.stopPropagation(); ev.preventDefault(); }; V.addEventListener('click', kill, { capture: true, once: true }); setTimeout(() => V.removeEventListener('click', kill, { capture: true }), 60); }
    mode = 3; if (!h) return;
    if (Math.abs(ddx) > W * 0.22 || (Math.abs(ddx) > 30 && Math.abs(ddx) / dt > 0.45)) set(i + (ddx < 0 ? 1 : -1)); else set(i);
  }, { passive: true });
  V.addEventListener('touchcancel', () => { if (mode === 1) set(i); mode = 3; }, { passive: true });
  if (P) P.querySelectorAll('button').forEach((b, k) => b.addEventListener('click', () => set(k)));
  return { go: k => set(keys.indexOf(k)), get cur() { return keys[i]; } };
}
/* 탭 화면 HTML: panes = [[키, 내용 HTML]] */
const pgPanes = (panes, cur, wrap) => { const i = Math.max(0, panes.findIndex(p => p[0] === cur)); return `<div class="pgv"><div class="pgtr" style="--i:${i}">${panes.map(([k, h]) => `<div class="pgp${k === cur ? ' on' : ''}" data-pk="${k}"><div class="${wrap}">${h}</div></div>`).join('')}</div></div>`; };
/* 탭 전환 후 내용 미끄러짐 (dir: 1 = 오른쪽 탭으로) */
function uiSlide(sel, dir) {
  if (!dir) return;
  const b = UI.querySelector(sel); if (b) b.classList.add(dir > 0 ? 'sl-l' : 'sl-r');
  const P = UI.querySelector('.ptabs'); if (!P) return;                       // 밑줄 표시기: 이전 탭 위치에서 이동
  const i = +P.style.getPropertyValue('--i'); P.style.setProperty('--i', i - dir); void P.offsetWidth;
  P.style.setProperty('--i', i);                                             // 강제 배치 후 값 변경 → 전환 발생 (rAF 미사용)
}

/* ---------- 화면 진입 전환·선택 카드 순차 등장 ---------- */
const UIX = { sig: '', n: 0 };
function uiEnterCheck() {
  const L = document.querySelector('#ui>.layer'); if (!L) { UIX.sig = ''; return; }
  const sel = STATE.mode === 'select' && G && G.sel; if (sel && !sel._uid) sel._uid = ++UIX.n;
  const h = L.querySelector('h1,h2'), sig = L.className.replace(/\s*enter\b/, '') + '|' + (h ? h.textContent : '') + '|' + (sel ? sel._uid : '');
  if (sig === UIX.sig) return;
  UIX.sig = sig; L.classList.add('enter');
  L.querySelectorAll('.cards>.card').forEach((c, i) => c.style.setProperty('--i', i));
}
new MutationObserver(uiEnterCheck).observe(document.getElementById('ui'), { childList: true });

/* 확정 반짝임: 누른 요소 위치에 작은 별빛 */
function uiSpark(el, col = '#ffe08a') {
  if (!el || !el.getBoundingClientRect) return;
  const q = el.getBoundingClientRect(), d = document.createElement('div');
  d.className = 'spark'; d.style.left = (q.left + q.width / 2) + 'px'; d.style.top = (q.top + q.height / 2) + 'px'; d.style.setProperty('--c', col);
  d.innerHTML = '<i></i><i></i><i></i><i></i><i></i><i></i>';
  document.body.appendChild(d); setTimeout(() => d.remove(), 520);
}
