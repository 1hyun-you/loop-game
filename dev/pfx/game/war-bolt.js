// 회귀의 들판 — 투기살: 붉은 투기 한 줄기가 꿰뚫고 날아감 (Claude, 회차 105)
import { Particles, P, Rng, fit, clamp, ease, WHITE } from "../../core/index.js";
export const meta = {
  name: "War bolt", desc: "A blade of red fighting spirit shoots straight out, a hot white core and a dark ragged edge, shedding embers.",
  tags: ["game", "projectile"], size: [280, 48], origin: [16, 24], duration: 0.55, loop: false, fps: 30, bg: "ground",
  options: { palette: ["#1a0508", "#4a0c12", "#8a1420", "#c4202a", "#ee4a30", "#ff8a4a", "#ffd09a"], reach: 240, width: 14, seed: 3 },
};
export function create(o) {
  const C = fit(o.palette, 7), R = new Rng(o.seed), L = o.reach, W = o.width, fly = 0.26;
  const ps = new Particles({ rng: R });
  let t = 0, last = 0;
  return {
    update(dt) {
      t += dt;
      const head = L * ease.outQuad(clamp(t / fly));
      if (t < fly) for (let x = last; x < head; x += 6) { ps.spawn(P.EMBER, x, R.range(-W / 3, W / 3), R.range(-40, 10), R.range(-30, 30), R.range(0.15, 0.35), C[R.int ? R.int(4, 6) : 5]); }
      last = head; ps.update(dt);
    },
    draw(p) {
      const head = L * ease.outQuad(clamp(t / fly)), tailK = clamp((t - fly * 0.4) / (meta.duration - fly * 0.4)), tail = Math.max(0, head - 110) + (head) * tailK;
      if (head - tail > 2) {
        const w = W * (1 - tailK * 0.7);
        // dark ragged body → red → hot core
        p.beam(tail, 0, head, 0, w, (u) => (u < 0.2 ? C[1] : C[2]));
        p.beam(tail + (head - tail) * 0.2, 0, head - 2, 0, w * 0.62, C[3]);
        p.beam(tail + (head - tail) * 0.45, 0, head - 3, 0, w * 0.3, C[5]);
        if (tailK < 0.6) p.beam(head - 30, 0, head - 4, 0, Math.max(1, w * 0.14), WHITE);
        // arrowhead wedge
        const hw = w * 0.7;
        p.poly([[head - 8, -hw], [head + 8, 0], [head - 8, hw]], C[4]);
        p.poly([[head - 5, -hw * 0.45], [head + 5, 0], [head - 5, hw * 0.45]], C[6]);
        p.glowLine(tail, 0, head, 0, w * 0.9, C[4], 0.35 * (1 - tailK));
      }
      ps.draw(p);
    },
  };
}
