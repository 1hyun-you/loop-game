/* ============================================================
   도트화 2 (0.30) — 수문장·마왕 패턴, 곁가지 사건, 페이즈 기믹 도트 + 상태 표시줄 색 맞춤
   — 예고 구역(붉은 원·띠)은 판정 범위 표시라 도형 유지, 중심·가장자리에 도트 표식 추가
   ============================================================ */
Object.assign(SPR, {
  /* 수문장 관 (기존 삼각형 3개 대체) */
  crown: { px: 2, frames: [['k....k....k', 'kyk.kyk.kyk', 'kyykyyykyyk', 'kyrYyyyYryk', 'kYYYYYYYYYk', '.kkkkkkkkk.']] },
  /* 위험 표식 '!' (예고 구역 중심) */
  warn: { px: 2, frames: [['.kkk.', 'kwrwk', 'kwrwk', 'kwrwk', '.kwk.', 'kwrwk', '.kkk.']] },
  /* 이그나 화염 장판 기포 */
  lava: { px: 2, frames: [['.kk.', 'kyok', 'kook', '.kk.'], ['....', '.kk.', 'kyok', '.kk.']] },
  /* 바르간 돌진 예고 화살표 */
  chev: { px: 2, frames: [['kk...', 'krrk.', '.krrk', 'krrk.', 'kk...']] },
  /* 마왕 결계 기둥 (경계선 위 배치) */
  dpil: { px: 2, frames: [['..kk..', '.kuwk.', 'kuwuUk', 'kuuuUk', 'kuuUUk', 'kuuUUk', 'kUuUUk', 'kKKKKk', '.kkkk.'], ['..kk..', '.kwuk.', 'kwuuUk', 'kuuuUk', 'kuuUUk', 'kuUUUk', 'kUuUUk', 'kKKKKk', '.kkkk.']] },
  /* 마왕 광선 마디 (가로 방향 반복) */
  dbeam: { px: 2, frames: [['kkkkkkkk', 'uUuUuUuU', 'wwuwwwuw', 'wwwwwwww', 'wwuwwwuw', 'uUuUuUuU', 'kkkkkkkk']] },
  /* 동굴 입구 */
  cave: { px: 2, frames: [[
    '.....kkkkkkkk.....',
    '...kkmMMMMMMmkk...',
    '..kmMMmmmmmmMMmk..',
    '.kmMmkkkkkkkkmMmk.',
    '.kMmkKKKKKKKKkmMk.',
    'kmMkKKKKKKKKKKkMmk',
    'kmMkKKKKKKKKKKkMmk',
    'kMmkKKKKKKKKKKkmMk',
    'kmmkKKKKKKKKKKkmmk',
    'kGmkKKKKKKKKKKkmGk',
    'kGGkkkkkkkkkkkkGGk',
    '.kkk..........kkk.',
  ]] },
  /* 봉인된 문 */
  sdoor: { px: 2, frames: [[
    '...kkkkkkkk...',
    '..kMMMMMMMMk..',
    '.kMmkkkkkkmMk.',
    'kMmkUUUUUUkmMk',
    'kMmkUuUUuUkmMk',
    'kMmkUUuuUUkmMk',
    'kMmkUUwwUUkmMk',
    'kMmkUUuuUUkmMk',
    'kMmkUuUUuUkmMk',
    'kMmkUUUUUUkmMk',
    'kMmkUUUUUUkmMk',
    'kMmkkkkkkkkmMk',
    'kmmmmmmmmmmmmk',
    '.kkkkkkkkkkkk.',
  ], [
    '...kkkkkkkk...',
    '..kMMMMMMMMk..',
    '.kMmkkkkkkmMk.',
    'kMmkUUUUUUkmMk',
    'kMmkUuUUuUkmMk',
    'kMmkUUuuUUkmMk',
    'kMmkUUwwUUkmMk',
    'kMmkUUwwUUkmMk',
    'kMmkUuUUuUkmMk',
    'kMmkUUUUUUkmMk',
    'kMmkUUUUUUkmMk',
    'kMmkkkkkkkkmMk',
    'kmmmmmmmmmmmmk',
    '.kkkkkkkkkkkk.',
  ]] },
  /* 잠든 거대 몹 'Z' */
  zzz: { px: 2, frames: [['kkkkk', 'kwwwk', '.kwk.', 'kwkkk', 'kwwwk', 'kkkkk']] },
  /* 봉인석 (구역 중심) */
  sealst: { px: 2, frames: [[
    '...kkk...',
    '..kMWMk..',
    '.kMWcWMk.',
    '.kMcccMk.',
    'kMMWcWMMk',
    'kMmMcMmMk',
    'kMmMMMmMk',
    'kmmMMMmmk',
    'kmmmmmmmk',
    'kKmmmmmKk',
    '.kkkkkkk.',
  ], [
    '...kkk...',
    '..kMWMk..',
    '.kMWwWMk.',
    '.kMcwcMk.',
    'kMMWcWMMk',
    'kMmMcMmMk',
    'kMmMMMmMk',
    'kmmMMMmmk',
    'kmmmmmmmk',
    'kKmmmmmKk',
    '.kkkkkkk.',
  ]] },
  /* 붕괴 지대 흔적 */
  crack: { px: 2, frames: [[
    '....k.......k...',
    '.....k.....k....',
    'kk....kNNNk.....',
    '..kNNNNKKNNk..kk',
    '....kNKKKKNkkk..',
    '...kNNKKKNNk....',
    '..k...kNNk..k...',
    '.k.....k.....k..',
  ]] },
  /* 야영지 천막·모닥불 */
  tent: { px: 2, frames: [[
    '.......kk.......',
    '......kook......',
    '.....kooOOk.....',
    '....kooOkOOk....',
    '...kooOkKkOOk...',
    '..kooOkKKKkOOk..',
    '.kooOkKKKKKkOOk.',
    'kooOOkKKKKKkOOOk',
    'kkkkkkkkkkkkkkkk',
  ]] },
  fire2: { px: 2, frames: [['..k..', '.kyk.', 'kyoyk', 'koyok', 'knnnk', '.kkk.'], ['.k...', '.kyk.', 'koyyk', 'kyook', 'knnnk', '.kkk.']] },
  /* 수레 목적지 깃발 */
  flag: { px: 2, frames: [[
    'kkkkkkk.',
    'knyyyyyk',
    'knyrryk.',
    'knyyyyyk',
    'knkkkkk.',
    'kn......',
    'kn......',
    'kn......',
    'kn......',
    'kN......',
    'kk......',
  ], [
    'kkkkkk..',
    'knyyyyk.',
    'knyrryyk',
    'knyyyyk.',
    'knkkkk..',
    'kn......',
    'kn......',
    'kn......',
    'kn......',
    'kN......',
    'kk......',
  ]] },
  /* 회복 샘 */
  well: { px: 2, frames: [[
    '...kkkkkk...',
    '.kkmmmmmmkk.',
    'kmmkccccckmk',
    'kmkcwcccwckk',
    'kmkccccccckk',
    'kmmkcccccmmk',
    '.kkmmmmmmkk.',
    '...kkkkkk...',
  ], [
    '...kkkkkk...',
    '.kkmmmmmmkk.',
    'kmmkcccwckmk',
    'kmkccccccckk',
    'kmkcwccccckk',
    'kmmkcccccmmk',
    '.kkmmmmmmkk.',
    '...kkkkkk...',
  ]] },
});
['cave', 'sdoor'].forEach(n => SPR[n].frames = SPR[n].frames.map(f => f.map(r => r.padEnd(f[0].length, '.'))));

const f2 = (hz) => Math.floor(G.time * hz) & 1;
/* 예고 구역 중심 '!' 표식 (차오를수록 커짐) */
function drawWarnMark(c, x, y, a) { c.globalAlpha = 0.55 + 0.45 * a; drawSpriteC(c, 'warn', 0, x, y, { mul: a > 0.7 ? 2 : 1 }); c.globalAlpha = 1; }
/* 이그나 장판 기포 */
function drawLavaPool(c, h, k) {
  const n = Math.max(3, Math.round(h.r / 14)); c.globalAlpha = 0.5 + 0.5 * k;
  for (let i = 0; i < n; i++) { const a = i * 2.39996 + (h.seed || (h.seed = rand(6.28))), rr = h.r * (0.25 + 0.6 * ((i * 0.618) % 1)); drawSpriteC(c, 'lava', (Math.floor(G.time * 3 + i) & 1), h.x + Math.cos(a) * rr, h.y + Math.sin(a) * rr); }
  c.globalAlpha = 1;
}
/* 돌진 예고 띠 위 화살표 */
function drawChevrons(c, h, a) {
  const ang = Math.atan2(h.dy, h.dx), ux = Math.cos(ang), uy = Math.sin(ang), step = 34, n = Math.floor(h.len * a / step);
  for (let i = 1; i <= n; i++) drawSpriteRot(c, 'chev', 0, h.x + ux * i * step, h.y + uy * i * step, ang);
}
/* 마왕 결계 기둥 */
function drawArenaPillars(c, A) {
  const n = 16, fr = f2(3);
  for (let i = 0; i < n; i++) { const a = i * Math.PI * 2 / n + G.time * 0.05; drawSprite(c, 'dpil', (fr + i) & 1, A.x + Math.cos(a) * A.R, A.y + Math.sin(a) * A.R + 8); }
}
/* 마왕 광선: 도트 마디 반복 */
function drawDemonBeam(c, h) {
  const S = getSprite('dbeam', 0), k = 1 / (VIEW.zoom * VIEW.dpr), W = S.cv.width * k, H = S.cv.height * k, sy = h.w / H;
  const off = (G.time * 160) % W;
  c.save(); c.translate(h.x, h.y); c.rotate(h.a); c.scale(1, Math.max(0.6, sy));
  for (let x = -off; x < h.len; x += W) c.drawImage(S.cv, x, -H / 2, W, H);
  c.restore();
}

/* ============================================================
   상태 표시줄 색 맞춤 (0.30) — 화면별 배경색을 theme-color에 반영, 전투 화면은 상단 옅어지는 띠
   ============================================================ */
const SBAR = { el: null, cur: '', t: 0 };
function mixHex(a, b, k) {
  const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16), m = s => Math.round(((A >> s) & 255) * (1 - k) + ((B >> s) & 255) * k);
  return '#' + ((m(16) << 16) | (m(8) << 8) | m(0)).toString(16).padStart(6, '0');
}
/* 현재 화면 상단 색 추정: 겹침 화면 종류별 덮개 농도를 지형 색에 섞음 */
function statusColor() {
  const ter = (TERRAIN[TER.cur] || TERRAIN.field).a, L = UI.firstElementChild;
  if (!L || STATE.mode === 'play') return shadeHex(ter, 0.62);                 // 전투: 띠 시작색과 동일
  const cl = L.classList, al = cl.contains('title') ? 0.55 : cl.contains('scroll') ? 0.94 : cl.contains('sel') ? 0.9 : cl.contains('dlg-wrap') ? 0 : 0.78;
  const base = cl.contains('title') ? '#0c0a12' : cl.contains('scroll') || cl.contains('sel') ? '#0e0c16' : '#0c0a12';
  return al ? mixHex(ter, base, al) : shadeHex(ter, 0.62);
}
function statusSync(now) {
  if (now - SBAR.t < 200) return; SBAR.t = now;
  if (!SBAR.el) SBAR.el = document.querySelector('meta[name="theme-color"]');
  const col = statusColor(); if (col === SBAR.cur || !SBAR.el) return;
  SBAR.cur = col; SBAR.el.setAttribute('content', col);
  document.documentElement.style.background = col;
}
/* 전투 화면 상단 띠: 표시줄 색에서 시작해 아래로 옅어짐 (투명 표시줄 불가 대응) */
function drawTopBand(c) {
  if (STATE.mode === 'title') return;
  const h = VIEW.sat + 30, col = SBAR.cur || shadeHex((TERRAIN[TER.cur] || TERRAIN.field).a, 0.62);
  const n = parseInt(col.slice(1), 16), rgb = `${n >> 16 & 255},${n >> 8 & 255},${n & 255}`;
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, `rgba(${rgb},1)`); g.addColorStop(VIEW.sat / h, `rgba(${rgb},0.9)`); g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g; c.fillRect(0, 0, VIEW.cw, h);
}
