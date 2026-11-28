// 회귀의 들판 — 칼자국(0.74): 대검 한 번에 찢긴 듯한 굵은 사선 칼자국 1줄이 벌어지고 피가 튐 (발톱 3줄과 구분, Claude, 회차 105)
import { Particles, P, Rng, fit, clamp, ease, WHITE } from "../../core/index.js";
export const meta = {
  name: "War gash", desc: "One heavy diagonal gash rips open across the target, white-hot at first, then a dark red wound that spits blood and closes.",
  tags: ["game", "slash", "hit"], size: [72, 72], origin: [36, 36], duration: 0.6, loop: false, fps: 30, bg: "ground",
  options: { palette: ["#1a0508", "#4a0c12", "#8a1420", "#c4202a", "#ee4a30", "#ff8a4a", "#ffd09a"], length: 22, seed: 8 },
};
export function create(o) {
  const C = fit(o.palette, 7), R = new Rng(o.seed), Ln = o.length, ps = new Particles({ rng: R });
  // 사선(왼쪽 위 → 오른쪽 아래), 살짝 휜 칼자국
  const pt = (u) => [(-1 + 2 * u) * Ln, (-1 + 2 * u) * Ln * 0.55 + Math.sin(u * Math.PI) * 3];
  for (let i = 0; i < 14; i++) { const [x, y] = pt(R.range(0.2, 0.8)); ps.spawn(i % 3 ? P.SPARK : P.EMBER, x, y, R.range(-60, 60), R.range(-90, -20), R.range(0.15, 0.4), C[R.next() < 0.5 ? 3 : 4]); }
  let t = 0;
  return {
    update(dt) { t += dt; ps.update(dt); },
    draw(p) {
      const open = ease.outExpo(clamp(t / 0.08)), close = clamp((t - 0.22) / 0.3), w = 3.2 * (1 - close * 0.8);
      if (close >= 1) { ps.draw(p); return; }
      const head = open, n = 60;
      for (let i = 0; i <= n * head; i++) {
        const u = i / n, [x, y] = pt(u), ww = w * Math.sin(Math.PI * u) + 0.6, nx = -0.48, ny = 0.88;
        for (let s = -ww; s <= ww; s += 0.5) {
          const e = Math.abs(s) / ww, c = t < 0.06 ? (e < 0.5 ? WHITE : C[6]) : e < 0.35 ? C[1] : e < 0.7 ? C[3] : C[4];
          p.dot(x + nx * s, y + ny * s, c, 1 - close * (e > 0.6 ? 1 : 0.6));
        }
      }
      if (t < 0.1) p.glowLine(pt(0)[0], pt(0)[1], pt(head)[0], pt(head)[1], 6, C[5], 0.5 * (1 - t / 0.1));
      ps.draw(p);
    },
  };
}
