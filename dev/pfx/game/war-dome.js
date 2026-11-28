// 회귀의 들판 — 칼무덤: 꽂힌 칼 + 불안정하게 흔들리는 붉은 돔 (루프, Claude, 회차 105)
import { fit, TAU, WHITE, hex } from "../../core/index.js";
export const meta = {
  name: "Sword grave dome", desc: "A sword stuck in the ground holds up a wavering red dome of fighting spirit; its rim flickers and runs.",
  tags: ["game", "aura", "loop"], size: [140, 120], origin: [70, 78], duration: 1, loop: true, fps: 30, bg: "ground",
  options: { palette: ["#1a0508", "#4a0c12", "#8a1420", "#c4202a", "#ee4a30", "#ff8a4a", "#ffd09a"], radius: 52, squash: 0.62, seed: 5 },
};
const STEEL = ["#2b2b33", "#5c5c6b", "#a4a4b2", "#e0e0ea"].map(hex);
export function draw(p, t, o) {
  const C = fit(o.palette, 7), RR = o.radius, sq = o.squash, ph = t * TAU;
  const r = RR + Math.sin(ph * 2) * 2;
  // dome body: translucent, darker toward the rim's bottom, bright rim with a running highlight
  p.shade(-r - 1, -r * sq - 1, r + 1, r * sq + 1, (x, y, out) => {
    const wob = 1 + 0.02 * Math.sin(Math.atan2(y, x) * 5 + ph * 3);
    const d = Math.hypot(x, y / sq) / (r * wob);
    if (d > 1) return;
    const a = Math.atan2(y / sq, x);
    if (d > 0.9) { out.c = Math.cos(a - ph * 2) > 0.7 ? C[6] : y < 0 ? C[4] : C[3]; out.a = 1; return; }
    if (d > 0.84) { out.c = C[2]; out.a = 1; return; }   // 안쪽 짙은 테 (반투명 면은 바둑판 점무늬가 되어 쓰지 않음)
    return;
  });
  p.glowRing(0, 0, r * 0.95, 6, C[4], 0.2);
  p.glow(0, -4, r * 0.8, C[3], 0.12);   // 돔 안을 채우는 붉은 빛 (빛 층이라 점무늬 없음)
  // the sword, point in the ground
  p.rect(-1, -34, 3, 34, STEEL[2]); p.rect(-1, -34, 1, 34, STEEL[3]); p.rect(1, -34, 1, 34, STEEL[1]);
  p.rect(-7, -36, 15, 3, C[3]); p.rect(-7, -36, 15, 1, C[5]);
  p.rect(-1, -44, 3, 8, STEEL[0]); p.rect(-2, -46, 5, 2, C[4]);
  p.rect(-3, -1, 7, 2, C[1]);
  p.glow(0, -36, 8, C[5], 0.25 + 0.1 * Math.sin(ph * 4));
}
