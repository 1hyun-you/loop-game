// 회귀의 들판 — 고동: 심장 박동처럼 몸에서 얇은 맥박 고리가 '쿵' 퍼지고 몸 중심에 심장 빛 (Claude, 회차 105 · 0.73 모양 구분)
import { fit, clamp, ease, WHITE, TAU } from "../../core/index.js";
export const meta = {
  name: "War heartbeat", desc: "One heartbeat: a hot heart-shaped flare at the body, then a thin double pulse line that races out and is gone.",
  tags: ["game", "pulse"], size: [260, 250], origin: [130, 125], duration: 0.4, loop: false, fps: 30, bg: "ground",
  options: { palette: ["#1a0508", "#4a0c12", "#8a1420", "#c4202a", "#ee4a30", "#ff8a4a", "#ffd09a"], radius: 110, squash: 1, seed: 4 },
};
const HEART = [".##.##.", "#######", "#######", ".#####.", "..###..", "...#..."];
export function draw(p, t, o) {
  const C = fit(o.palette, 7), RR = o.radius, sq = o.squash, u = clamp(t / meta.duration);
  // 심장: 처음 0.12초 부풀었다 꺼짐
  if (t < 0.14) { const k = t < 0.05 ? 1 : 1 - (t - 0.05) / 0.09; p.sprite(HEART, { "#": k > 0.6 ? C[6] : C[4] }, -3, -16); p.glow(0, -13, 16, C[5], 0.5 * k); }
  // 맥박 고리 2줄(바깥 굵음 2칸, 안쪽 1칸) — 빠르게 나가며 얇아짐, 원 둘레를 따라 맥파처럼 굵기가 출렁임
  for (const [lag, w0, col] of [[0, 2.5, C[5]], [0.06, 1.2, C[3]]]) {
    const v = clamp((t - lag) / (meta.duration - lag)); if (v <= 0 || v >= 1) continue;
    const r = RR * (0.15 + 0.85 * ease.outCubic(v)), fade = 1 - v;
    p.shade(-r - 3, -r * sq - 3, r + 3, r * sq + 3, (x, y, out) => {
      const a = Math.atan2(y / sq, x), w = w0 * (1 + 0.6 * Math.max(0, Math.sin(a * 6 + v * 20))) * (0.4 + 0.6 * fade), d = Math.hypot(x, y / sq);
      if (d > r || d < r - w) return;
      out.c = v < 0.15 && lag === 0 ? WHITE : col; out.a = fade < 0.35 && ((x + y) & 1) ? 0 : 1;
    });
    if (lag === 0) p.glowRing(0, 0, r, 5, C[4], 0.25 * fade);
  }
}
