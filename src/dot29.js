/* ============================================================
   도트화 1 (0.29) — 적 탄환 출처별 고유 도트 + 공통 위험 표시
   공통 위험 표시: 붉은 번짐(맥동) + 붉은 외곽선(#ff2a55) + 진행 방향 잔상 2개
   출처별 도트: 이그나 화염탄(불꽃 혜성)·모르덴 뼈 화살·세렌 빛살/거울 파편(결정)·고블린 화살(조잡한 나무 화살)·마왕 혼령(보라 망령)
   ============================================================ */
Object.assign(SPR, {
  eb_fire: { px: 2, frames: [[
    '.....kkk..',
    '..okkyyyk.',
    '.ooyywwyyk',
    'ooyywwwwyk',
    '.ooyywwyyk',
    '..okkyyyk.',
    '.....kkk..',
  ], [
    '.....kkk..',
    '.o.kkyyyk.',
    'ooyyywwyyk',
    '.oyywwwwyk',
    'ooyyywwyyk',
    '.o.kkyyyk.',
    '.....kkk..',
  ]] },
  eb_bone: { px: 2, frames: [[
    '.kk......k..',
    'kEekkkkkkMk.',
    '.keeeeeeeWMk',
    'kEekkkkkkMk.',
    '.kk......k..',
  ]] },
  eb_shard: { px: 2, frames: [[
    '...kkk...',
    '.kkcwwkk.',
    'kbccwwwwk',
    '.kkcwwkk.',
    '...kkk...',
  ], [
    '...kkk...',
    '.kkwcckk.',
    'kbcwwccwk',
    '.kkwcckk.',
    '...kkk...',
  ]] },
  eb_arrow: { px: 2, frames: [[
    'kvk.....kk.',
    'GvGnnnnnngk',
    'kvk.....kk.',
  ]] },
  eb_spirit: { px: 2, frames: [[
    '....kkkkk.',
    '..kkuuuuuk',
    'kUUuuwkuwk',
    '.kUuuuuuuk',
    '..kkUuuuuk',
    '....kkkkk.',
  ], [
    '....kkkkk.',
    '.kkkuuuuuk',
    '.UUuuwkuwk',
    'kUuuuuuuuk',
    '..kUUuuuuk',
    '....kkkkk.',
  ]] },
});
/* 출처 → 도트 이름 (탄환마다 1회 판별 후 저장) */
function ebSprite(b) {
  if (b._s !== undefined) return b._s;
  const s = b.src || '';
  return (b._s = /화염|불꽃/.test(s) ? 'eb_fire' : /뼈/.test(s) ? 'eb_bone' : /세렌|거울/.test(s) ? 'eb_shard' : /궁수|고블린/.test(s) ? 'eb_arrow' : /혼령/.test(s) ? 'eb_spirit' : null);
}
/* 공통 위험 번짐: 반경별 사전 그림 */
const EB_HALO = {};
function ebHalo(r) {
  if (EB_HALO[r]) return EB_HALO[r];
  const S = 3, R = r + 8, cv2 = document.createElement('canvas'); cv2.width = cv2.height = Math.ceil(R * 2 * S);
  const g = cv2.getContext('2d'); g.scale(S, S);
  const gr = g.createRadialGradient(R, R, r * 0.4, R, R, R); gr.addColorStop(0, 'rgba(255,30,70,0.6)'); gr.addColorStop(0.55, 'rgba(255,30,70,0.25)'); gr.addColorStop(1, 'rgba(255,30,70,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(R, R, R, 0, 7); g.fill();
  return (EB_HALO[r] = { cv: cv2, R });
}
/* 0.29 적 탄환 그리기 (boss.js drawEnemyShots에서 호출, 도트 없는 출처는 0.26a 발광 구슬 유지) */
function drawEnemyShotsDot(c, inView) {
  const t = G.time, pulse = 0.85 + 0.15 * Math.sin(t * 14);
  for (const b of G.eb) {
    if (!inView(b.x, b.y, b.r + 20)) continue;
    const nm = ebSprite(b), r = Math.round(b.r), sp = Math.hypot(b.vx, b.vy) || 1, ux = b.vx / sp, uy = b.vy / sp, ang = Math.atan2(uy, ux);
    if (!nm) { drawEnemyShotOrb(c, b, t); continue; }
    const H = ebHalo(r), fr = SPR[nm].frames.length > 1 ? (Math.floor(t * 10 + b.x * 0.01) & 1) : 0, hs = H.R * 2 * pulse;
    c.globalAlpha = 0.9; c.drawImage(H.cv, b.x - hs / 2, b.y - hs / 2, hs, hs);                             // 공통 위험 번짐
    const ga = nm === 'eb_spirit' ? 0 : ang, fl = nm === 'eb_spirit' && ux < 0;
    c.globalAlpha = 0.25; drawSpriteRot(c, nm, fr, b.x - ux * r * 2.4, b.y - uy * r * 2.4, ga, { mode: 'danger', flip: fl });   // 잔상 2개
    c.globalAlpha = 0.45; drawSpriteRot(c, nm, fr, b.x - ux * r * 1.2, b.y - uy * r * 1.2, ga, { mode: 'danger', flip: fl });
    c.globalAlpha = 1; if (nm === 'eb_spirit') drawSpriteC(c, nm, fr, b.x, b.y, { mode: 'danger', flip: ux < 0 }); else drawSpriteRot(c, nm, fr, b.x, b.y, ang, { mode: 'danger' });   // 망령은 기울지 않고 좌우만 반전
  }
  c.globalAlpha = 1;
}
