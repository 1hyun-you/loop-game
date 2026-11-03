/* ============================================================
   화면 크기 · 입력 (유동형 조이스틱: 중심은 첫 터치 위치 고정)
   ============================================================ */
const cv = document.getElementById('c');
const ctx = cv.getContext('2d', { alpha: false });
const VIEW = { w: 400, h: 800, dpr: 1, zoom: 1, sat: 0, sab: 0, cw: 400, ch: 800 };
/* 0.26a 화면 고정: 캔버스·UI를 픽셀 고정 크기로 두어 창 크기가 순간 변해도 늘어남·재생성·재배치 없음
   (가장자리·상단 끌기 때 시스템 표시줄이 잠깐 나타나며 창 높이가 흔들리던 현상 대응)
   폭 변경(회전)·높이 확대는 즉시 반영, 높이 축소는 1.2초 이상 유지될 때만 반영 */
const uiEl = document.getElementById('ui');
function resize() {
  VIEW.dpr = Math.min(CFG.dprMax, window.devicePixelRatio || 1);
  VIEW.cw = window.innerWidth; VIEW.ch = window.innerHeight;
  cv.width = Math.round(VIEW.cw * VIEW.dpr); cv.height = Math.round(VIEW.ch * VIEW.dpr);
  cv.style.width = VIEW.cw + 'px'; cv.style.height = VIEW.ch + 'px';
  if (uiEl) { uiEl.style.width = VIEW.cw + 'px'; uiEl.style.height = VIEW.ch + 'px'; }
  VIEW.zoom = clamp(VIEW.cw / CFG.viewWidth, 0.8, 1.6);
  VIEW.w = VIEW.cw / VIEW.zoom; VIEW.h = VIEW.ch / VIEW.zoom;
  VIEW.sat = document.getElementById('sa').getBoundingClientRect().height || 0;
  VIEW.sab = document.getElementById('sb').getBoundingClientRect().height || 0;
  /* 0.27 화면 고정 보강: 안전 영역 값을 확정 시점에만 고정 반영, 상단 끌기 때 시스템 표시줄이 잠깐 나타나며
     안전 영역 값이 흔들려도 UI 재배치(레이아웃 재계산) 없음 */
  const rs = document.documentElement.style;
  rs.setProperty('--sat', VIEW.sat + 'px'); rs.setProperty('--sab', VIEW.sab + 'px');
}
let rsT = 0;
window.addEventListener('resize', () => {
  clearTimeout(rsT);
  const w = window.innerWidth, h = window.innerHeight;
  if (w !== VIEW.cw || h > VIEW.ch + 1) return resize();
  if (h === VIEW.ch) return;
  rsT = setTimeout(() => { if (window.innerWidth === w && window.innerHeight === h) resize(); }, 1200);
});

const INPUT = { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0, dx: 0, dy: 0, mag: 0, keys: {} };
cv.addEventListener('pointerdown', e => {
  e.preventDefault();
  if (STATE.mode !== 'play' || INPUT.active) return;
  INPUT.active = true; INPUT.id = e.pointerId;
  INPUT.ox = INPUT.x = e.clientX; INPUT.oy = INPUT.y = e.clientY;
  if (SETTINGS.joy === 'fixed') { const f = joyFixed(); INPUT.ox = f.x; INPUT.oy = f.y; }   // 고정형: 화면 아래 중앙 기준 (0.14)
  updJoy();
  try { cv.setPointerCapture(e.pointerId); } catch (_) { }
}, { passive: false });
cv.addEventListener('pointermove', e => { if (!INPUT.active || e.pointerId !== INPUT.id) return; INPUT.x = e.clientX; INPUT.y = e.clientY; updJoy(); });
const endPtr = e => { if (e.pointerId !== INPUT.id) return; INPUT.active = false; INPUT.id = null; INPUT.dx = INPUT.dy = INPUT.mag = 0; };
cv.addEventListener('pointerup', endPtr); cv.addEventListener('pointercancel', endPtr);
function updJoy() {
  let dx = INPUT.x - INPUT.ox, dy = INPUT.y - INPUT.oy; const d = Math.hypot(dx, dy), R = CFG.joyR;
  if (d > R) { dx = dx / d * R; dy = dy / d * R; }       // 반경 밖으로 끌어도 중심 고정
  const m = Math.min(1, d / R);
  INPUT.mag = m < 0.12 ? 0 : m;
  INPUT.dx = d > 0 ? dx / Math.min(d, R) : 0; INPUT.dy = d > 0 ? dy / Math.min(d, R) : 0;
}
window.addEventListener('keydown', e => { INPUT.keys[e.key.toLowerCase()] = true; if (e.key === '`' && CFG.DEV) DEV.toggle(); if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') togglePause(); });
window.addEventListener('keyup', e => { INPUT.keys[e.key.toLowerCase()] = false; });
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('gesturestart', e => e.preventDefault());

function moveVec() {
  const k = INPUT.keys;
  const kb = k['w'] || k['a'] || k['s'] || k['d'] || k['arrowup'] || k['arrowdown'] || k['arrowleft'] || k['arrowright'];
  if (STATE.dev.auto && !INPUT.active && !kb) return autoVec();
  let x = 0, y = 0;
  if (INPUT.mag > 0) { x = INPUT.dx * INPUT.mag; y = INPUT.dy * INPUT.mag; }
  if (k['w'] || k['arrowup']) y -= 1; if (k['s'] || k['arrowdown']) y += 1; if (k['a'] || k['arrowleft']) x -= 1; if (k['d'] || k['arrowright']) x += 1;
  const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; }
  return { x, y, m: Math.min(1, m) };
}
