// 회귀의 들판 — 광란의 포효: 고리 없이 바깥으로 밀려 나가는 바람 줄기와 흙먼지 (Claude, 회차 105 · 0.73 모양 구분)
import { Particles, P, Rng, fit, clamp, ease, WHITE, TAU } from "../../core/index.js";
export const meta = {
  name: "War roar", desc: "A roar shoves the world back: a white-hot shout at the mouth, then streaks of red wind and a wall of dust and grit blown straight outward.",
  tags: ["game", "shockwave", "wind"], size: [320, 300], origin: [160, 150], duration: 0.8, loop: false, fps: 30, bg: "ground",
  options: { palette: ["#1a0508", "#4a0c12", "#8a1420", "#c4202a", "#ee4a30", "#ff8a4a", "#ffd09a"], dust: ["#1c1610", "#33281c", "#4f3f2c", "#6e5a40", "#927a58", "#b89f78", "#dcc8a2"], radius: 128, squash: 1, seed: 6 },
};
export function create(o) {
  const C = fit(o.palette, 7), D = fit(o.dust, 7), R = new Rng(o.seed), RR = o.radius, sq = o.squash, ps = new Particles({ rng: R });
  const streaks = Array.from({ length: 22 }, (_, i) => ({ a: (i / 22) * TAU + R.range(-0.1, 0.1), len: R.range(0.25, 0.45), w: R.range(1, 2.2), d: R.range(0, 0.08), s: R.range(0.85, 1.1) }));
  for (let i = 0; i < 60; i++) { const a = R.range(0, TAU), s = R.range(120, 260) * (RR / 128); ps.spawn(i % 4 ? P.DUST : P.GRIT, Math.cos(a) * RR * 0.25, Math.sin(a) * RR * 0.25 * sq, Math.cos(a) * s, Math.sin(a) * s * sq, R.range(0.35, 0.7), D[R.next() < 0.5 ? 3 : 4], R.range(1, 2.5)); }
  let t = 0;
  return {
    update(dt) { t += dt; ps.update(dt); },
    drawBack(p) { ps.draw(p, "back"); },
    draw(p) {
      for (const s of streaks) {
        const v = clamp((t - s.d) / 0.55); if (v <= 0 || v >= 1) continue;
        const head = RR * s.s * ease.outCubic(v), tail = Math.max(RR * 0.12, head - RR * s.len * (1 - v * 0.5)), ca = Math.cos(s.a), sa = Math.sin(s.a) * sq;
        p.line(ca * tail, sa * tail, ca * head, sa * head, (u) => (u > 0.8 ? (v < 0.2 ? WHITE : C[6]) : u > 0.4 ? C[4] : C[2]), v < 0.6 ? 1 : (1 - v) / 0.4);
        if (s.w > 1.6) p.line(ca * tail + sa * 0.8, sa * tail - ca * 0.8, ca * head + sa * 0.8, sa * head - ca * 0.8, C[3], 0.7 * (1 - v));
      }
      if (t < 0.1) { const k = 1 - t / 0.1; p.glow(0, -10, 14 * k + 6, WHITE, 0.5 * k); p.glow(0, -10, 20, C[5], 0.25 * k); }   // 입가 섬광만 작게 (크게 하면 넓은 흰 원판이 됨)
      ps.draw(p, "front");
    },
  };
}
