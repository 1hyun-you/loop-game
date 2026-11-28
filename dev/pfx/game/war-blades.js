// 회귀의 들판 — 칼무덤 확 커짐: 돔 둘레에서 붉은 칼날이 바깥으로 솟았다가 꺼짐 (Claude, 회차 105 · 0.73 모양 구분)
import { Rng, fit, clamp, ease, WHITE, TAU, hex } from "../../core/index.js";
export const meta = {
  name: "Grave blades", desc: "Around the grave dome a ring of red-edged blades stab up out of the ground, glint, and sink back.",
  tags: ["game", "spikes"], size: [280, 220], origin: [140, 120], duration: 0.5, loop: false, fps: 30, bg: "ground",
  options: { palette: ["#1a0508", "#4a0c12", "#8a1420", "#c4202a", "#ee4a30", "#ff8a4a", "#ffd09a"], radius: 110, squash: 0.62, count: 16, seed: 7 },
};
const STEEL = ["#2b2b33", "#5c5c6b", "#a4a4b2", "#e0e0ea"].map(hex);
export function draw(p, t, o) {
  const C = fit(o.palette, 7), R = new Rng(o.seed), RR = o.radius, sq = o.squash, n = o.count;
  const bl = Array.from({ length: n }, (_, i) => ({ a: (i / n) * TAU + R.range(-0.12, 0.12), h: R.range(22, 34), d: R.range(0, 0.08) }));
  bl.sort((a, b) => Math.sin(a.a) - Math.sin(b.a));   // 뒤쪽(위) 칼날부터 그려 앞쪽이 덮음
  for (const b of bl) {
    const v = clamp((t - b.d) / 0.42); if (v <= 0 || v >= 1) continue;
    const up = v < 0.25 ? ease.outBack(v / 0.25) : 1 - ease.inQuad((v - 0.25) / 0.75);
    const x = Math.cos(b.a) * RR, y = Math.sin(b.a) * RR * sq, h = b.h * clamp(up, 0, 1.15);
    if (h < 1) continue;
    // 칼날: 바깥쪽으로 기운 삼각형, 왼쪽 밝은 면 · 오른쪽 그늘 · 붉은 날
    const lean = Math.cos(b.a) * 4;
    p.poly([[x - 3.5, y], [x + lean, y - h], [x + 0.5, y]], STEEL[2]);
    p.poly([[x + 0.5, y], [x + lean, y - h], [x + 3.5, y]], STEEL[1]);
    p.line(x + 2.5, y, x + lean, y - h, C[4]);
    if (v < 0.3) p.px(x + lean, y - h, WHITE);
    p.rect(x - 3, y, 7, 1, C[1]);
    p.glow(x + lean * 0.5, y - h * 0.5, 6, C[4], 0.25 * (1 - v));
  }
}
