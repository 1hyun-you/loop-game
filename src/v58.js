/* ============================================================
   0.58 패치 (회차 74, 2026-11-23)
   - 궁극기 발동 버튼: 게이지 가득 시 조이스틱 옆(가동 범위 바로 바깥)에 버튼 생성, 기본 왼쪽, 설정 좌/우
     · 손 떼고 정지 발동 폐지 (JOB_CFG.ultStop 무한대), 자동 궁극기 설정은 유지
     · 버튼 기준점: 조이스틱 사용 중 = 현재 중심 / 손 뗀 뒤 = 마지막 중심 / 첫 터치 전·고정형 = 고정 위치
     · 화면 가장자리에 걸리면 반대쪽으로 자동 이동
     · 다른 손가락으로 조이스틱을 잡은 채 누를 수 있음(다중 터치), PC는 Q·Space
   - 명칭 교체: 곁가지 사건 → 돌발 사건, 마법사 → 화염술사 (표기만, 내부 id 유지)
   ============================================================ */
JOB_CFG.ultStop = Infinity;
if (!('ultSide' in SETTINGS)) SETTINGS.ultSide = 'L';
const ULT58 = { r: 30, gap: 14, hit: 12, ax: null, ay: null, shownAt: -1, presses: 0, aiPresses: 0 };

const _updateUlt58 = updateUlt;
updateUlt = function (dt) { const r = _updateUlt58(dt); G.tm.stopT = 0; return r; };   // 정지 누적·정지 표시 제거

function ult58Visible() { return STATE.mode === 'play' && G.p && !G.result && ultReady(); }
function ult58Anchor() {
  if (INPUT.active) return { x: INPUT.ox, y: INPUT.oy };
  if (SETTINGS.joy !== 'fixed' && ULT58.ax != null) return { x: ULT58.ax, y: ULT58.ay };
  return joyFixed();
}
function ult58Pos() {
  const a = ult58Anchor(), d = CFG.joyR + ULT58.gap + ULT58.r, m = ULT58.r + 8, side = SETTINGS.ultSide === 'R' ? 1 : -1;
  let x = a.x + side * d;
  if (x < m || x > VIEW.cw - m) x = a.x - side * d;                 // 가장자리에 걸리면 반대쪽
  x = clamp(x, m, VIEW.cw - m);
  const y = clamp(a.y, VIEW.sat + m + 70, VIEW.ch - VIEW.sab - m);
  return { x, y };
}
function ultPress58(src) {
  if (!ult58Visible()) return false;
  if (src === 'ai') ULT58.aiPresses++; else ULT58.presses++;
  useUlt(); return true;
}

/* 입력: 캔버스 자체 캡처 단계에서 먼저 판정 → 버튼 적중 시 조이스틱 시작 차단 */
cv.addEventListener('pointerdown', e => {
  if (!ult58Visible()) return;
  const b = ult58Pos(), R = ULT58.r + ULT58.hit;
  if ((e.clientX - b.x) ** 2 + (e.clientY - b.y) ** 2 > R * R) return;
  e.preventDefault(); e.stopImmediatePropagation();
  ultPress58('touch');
}, { capture: true, passive: false });
window.addEventListener('keydown', e => { const k = e.key.toLowerCase(); if ((k === 'q' || k === ' ') && !e.repeat) { if (ultPress58('key')) e.preventDefault(); } });

/* 그리기: 조이스틱 위에 겹쳐 표시 */
const _drawJoy58 = drawJoy;
drawJoy = function (c) {
  _drawJoy58(c);
  if (INPUT.active) { ULT58.ax = INPUT.ox; ULT58.ay = INPUT.oy; }
  if (!ult58Visible()) { ULT58.shownAt = -1; return; }
  if (ULT58.shownAt < 0) ULT58.shownAt = G.time;
  const b = ult58Pos(), t = G.time - ULT58.shownAt, s = t < 0.22 ? 0.4 + 0.6 * easeOut58(t / 0.22) : 1;
  const col = (typeof JOB_COL !== 'undefined' && JOB_COL[G.p.job]) || '#ffe08a', r = ULT58.r * s;
  const pulse = (G.time * 1.6) % 1;
  c.save();
  c.globalAlpha = 0.55 * (1 - pulse); c.strokeStyle = col; c.lineWidth = 3;      // 퍼지는 고리 (준비 알림)
  c.beginPath(); c.arc(b.x, b.y, r + 4 + pulse * 14, 0, 7); c.stroke();
  c.globalAlpha = 1; c.fillStyle = 'rgba(14,12,20,0.78)'; c.strokeStyle = col; c.lineWidth = 3;
  c.beginPath(); c.arc(b.x, b.y, r, 0, 7); c.fill(); c.stroke();
  c.globalAlpha = 0.28; c.fillStyle = col; c.beginPath(); c.arc(b.x, b.y, r - 5, 0, 7); c.fill();
  c.globalAlpha = 1; c.fillStyle = col; c.font = `bold ${Math.round(17 * s)}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('궁', b.x, b.y + 1);
  c.restore();
};
function easeOut58(k) { k = clamp(k, 0, 1); return 1 - (1 - k) * (1 - k); }
