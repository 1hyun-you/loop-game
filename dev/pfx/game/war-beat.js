// 회귀의 들판 — 고동: 심장 박동처럼 붉은 고리가 '쿵' 퍼짐 (Claude, 회차 105)
import { Rng, fit, clamp, ease, WHITE, TAU } from "../../core/index.js";
export const meta = {
  name: "War heartbeat", desc: "A heartbeat thumps out of the body: a thick red ring snaps outward, hot on its leading edge, dark behind, cracking as it fades.",
  tags: ["game", "ring", "aura"], size: [260, 200], origin: [130, 100], duration: 0.42, loop: false, fps: 30, bg: "ground",
  options: { palette: ["#1a0508", "#4a0c12", "#8a1420", "#c4202a", "#ee4a30", "#ff8a4a", "#ffd09a"], radius: 110, squash: 0.62, seed: 4 },
};
export function create(o) {
  const C = fit(o.palette, 7), R = new Rng(o.seed), RR = o.radius, sq = o.squash;
  const gaps = Array.from({ length: 7 }, () => [R.range(0, TAU), R.range(0.08, 0.22)]);
  let t = 0;
  return {
    update(dt) { t += dt; },
    draw(p) {
      const u = clamp(t / meta.duration), r = RR * (0.18 + 0.82 * ease.outExpo(u)), w = Math.max(2, 12 * (1 - u) + 2);
      const fade = 1 - ease.inQuad(u);
      if (fade <= 0.02) return;
      // squashed ring: draw in a scaled space by shading per pixel
      p.shade(-r - 2, -r * sq - 2, r + 2, r * sq + 2, (x, y, out) => {
        const d = Math.hypot(x, y / sq);
        if (d > r || d < r - w) return;
        const a = Math.atan2(y / sq, x);
        if (u > 0.35) for (const [g, gw] of gaps) { let da = Math.abs(((a - g + Math.PI * 3) % TAU) - Math.PI); if (da < gw * (u - 0.35) * 2.5) return; }
        const v = (d - (r - w)) / w;
        out.c = v > 0.8 ? (u < 0.15 ? WHITE : C[6]) : v > 0.55 ? C[5] : v > 0.3 ? C[3] : C[2];
        out.a = fade < 1 && ((x + y) & 1) && fade < 0.5 ? 0 : 1;
      });
      p.glowRing(0, 0, r * 0.82, 10, C[4], 0.3 * fade);
      if (t < 0.06) p.glow(0, 0, 22, C[6], 0.5);
    },
  };
}
