// 회귀의 들판 — 광란의 포효: 몸에서 터져 나가는 충격파 (Claude, 회차 105)
import { Particles, P, Rng, fit, clamp, ease, WHITE, TAU } from "../../core/index.js";
export const meta = {
  name: "War roar", desc: "A roar bursts out: a white-hot flash, a jagged shockwave ring tearing outward and a gust of dust and embers pushed with it.",
  tags: ["game", "shockwave"], size: [300, 220], origin: [150, 110], duration: 0.7, loop: false, fps: 30, bg: "ground",
  options: { palette: ["#1a0508", "#4a0c12", "#8a1420", "#c4202a", "#ee4a30", "#ff8a4a", "#ffd09a"], radius: 128, squash: 0.62, seed: 6 },
};
export function create(o) {
  const C = fit(o.palette, 7), R = new Rng(o.seed), RR = o.radius, sq = o.squash, ps = new Particles({ rng: R });
  const teeth = Array.from({ length: 28 }, () => R.range(0.6, 1.4));
  for (let i = 0; i < 46; i++) { const a = R.range(0, TAU), s = R.range(160, 320); ps.spawn(i % 3 ? P.EMBER : P.SPARK, Math.cos(a) * 10, Math.sin(a) * 10 * sq, Math.cos(a) * s, Math.sin(a) * s * sq, R.range(0.2, 0.5), C[R.next() < 0.5 ? 5 : 6]); }
  let t = 0;
  return {
    update(dt) { t += dt; ps.update(dt); },
    draw(p) {
      const u = clamp(t / 0.5), r = RR * ease.outExpo(u), fade = 1 - u;
      if (fade > 0.02) {
        const w = 6 + 10 * fade;
        p.shade(-r - 14, -r * sq - 14, r + 14, r * sq + 14, (x, y, out) => {
          const d = Math.hypot(x, y / sq), a = Math.atan2(y / sq, x), k = teeth[Math.floor(((a + Math.PI) / TAU) * teeth.length) % teeth.length];
          const rr = r + (k - 1) * 8 * fade;
          if (d > rr || d < rr - w) return;
          const v = (d - (rr - w)) / w;
          out.c = v > 0.75 ? (u < 0.2 ? WHITE : C[6]) : v > 0.45 ? C[4] : C[2];
          out.a = fade < 0.4 && ((x ^ y) & 1) ? 0 : 1;
        });
        p.glowRing(0, 0, r * 0.9, 12, C[4], 0.35 * fade);
      }
      if (t < 0.1) { p.glow(0, -10, 40 * (1 - t / 0.1) + 10, WHITE, 0.6); p.glow(0, -10, 50, C[5], 0.4); }
      ps.draw(p);
    },
  };
}
