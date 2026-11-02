/* ============================================================
   공용 함수 · 공간 격자 (초안 재사용, 명명 유지)
   ============================================================ */
const rand = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const dist2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };
const lerp = (a, b, t) => a + (b - a) * t;
const fmtTime = s => { s = Math.max(0, Math.floor(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
function weightedPick(items) { let s = 0; for (const it of items) s += it.w; let r = Math.random() * s; for (const it of items) { r -= it.w; if (r <= 0) return it; } return items[items.length - 1]; }
function hash2(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }

const GRID = { cell: 64, map: new Map() };
function gkey(cx, cy) { return (cx + 32768) * 65536 + (cy + 32768); }
function gridBuild(list) {
  GRID.map.clear();
  for (const e of list) {
    if (e.dead) continue;
    const k = gkey(Math.floor(e.x / GRID.cell), Math.floor(e.y / GRID.cell));
    let a = GRID.map.get(k); if (!a) { a = []; GRID.map.set(k, a); } a.push(e);
  }
}
function gridQuery(x, y, r, cb) {
  const c = GRID.cell, x0 = Math.floor((x - r - 48) / c), x1 = Math.floor((x + r + 48) / c), y0 = Math.floor((y - r - 48) / c), y1 = Math.floor((y + r + 48) / c);
  for (let cx = x0; cx <= x1; cx++) for (let cy = y0; cy <= y1; cy++) {
    const a = GRID.map.get(gkey(cx, cy)); if (!a) continue;
    for (const e of a) { if (e.dead) continue; const rr = r + e.r; if (dist2(x, y, e.x, e.y) <= rr * rr) { if (cb(e) === false) return; } }
  }
}
function nearestEnemy(x, y, maxR = 600) {
  let best = null, bd = maxR * maxR;
  for (const e of G.enemies) { if (e.dead) continue; const d = dist2(x, y, e.x, e.y); if (d < bd) { bd = d; best = e; } }
  return best;
}
