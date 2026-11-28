// 회귀의 들판 — 피의 갈증(0.74): 디멘터처럼 적의 생명력을 빨아들임 (루프, Claude, 회차 105)
// 적(오른쪽 끝, 머리 높이)에서 희붉은 혼이 얼굴 모양으로 뜯겨 나와 깔때기 모양 안개 흐름을 타고 소용돌이치며 광전사(원점)로 빨려 듦
import { cycle, fit, clamp, ease, TAU, WHITE, hex } from "../../core/index.js";
export const meta = {
  name: "Soul thirst", desc: "Life is torn out of the victim: a pale red soul-face stretches off its head and streams down a funnel of mist that narrows into the berserker, wisps spiralling in.",
  tags: ["game", "drain", "loop"], size: [150, 48], origin: [8, 24], duration: 0.8, loop: true, fps: 30, bg: "ground",
  options: { palette: ["#14040a", "#3a0a14", "#6a101c", "#a01824", "#d42a30", "#ff5a50", "#ff9a8a"], life: ["#5a2a2e", "#a86a6a", "#e6b4ac", "#fff0ea"], length: 120, seed: 9 },
};
export function draw(p, t, o) {
  const C = fit(o.palette, 7), V = fit(o.life, 4), L = o.length;
  // 깔때기: 적 쪽 반폭 9 → 광전사 쪽 1.5, 흐르는 안개 결
  for (let x = 0; x <= L; x += 1) {
    const u = x / L, w = 1.5 + 7.5 * u * u, flow = Math.sin(u * 14 + t * TAU * 2.5);
    for (let y = -Math.ceil(w); y <= Math.ceil(w); y++) {
      const e = Math.abs(y) / w; if (e > 1) continue;
      const k = (1 - e) * (0.32 + 0.16 * flow) * (0.55 + 0.45 * u);
      p.blend(x, y - 2 * u, e < 0.35 ? V[2] : V[1], k);
    }
  }
  // 소용돌이 혼 조각: 적에서 출발, 나선을 그리며 빨라져 들어옴
  cycle(t, meta.duration, 9, o.seed, 0.6, (age, life, r) => {
    const k = age / life, u = 1 - ease.inQuad(k), x = u * L, sp = r.range(0, TAU), R = (1.5 + 6 * u) * Math.sin(k * TAU * 1.5 + sp);
    const y = R - 2 * u;
    p.px(x, y, k > 0.75 ? WHITE : V[3]); p.blend(x + 1, y, V[2], 0.6); p.blend(x + 2, y, V[1], 0.35);
    if (k > 0.8) p.light(x, y, C[5], 0.5);
  });
  // 적 머리에서 뜯겨 나오는 혼 얼굴: 늘어나며 떨어져 나옴 (주기 0.8초)
  const v = (t % meta.duration) / meta.duration, fx = L - 4 - 14 * ease.inQuad(v), fy = -6 - 2 * v, st = 1 + 1.2 * v, al = 0.85 * (1 - v);
  p.disc(fx, fy, 6, V[2], al * 0.8);
  for (let i = 1; i < 6; i++) p.disc(fx + i * 2.4 * st, fy + i * 0.4, 5.4 - i * 0.8, V[1], al * 0.5);
  for (const dx of [-2, 2]) { p.blend(fx + dx, fy - 1.5, C[0], al); p.blend(fx + dx, fy - 0.5, C[0], al); }   // 눈 (세로 2칸)
  for (let j = 0; j < 3; j++) p.blend(fx, fy + 1.5 + j, C[0], al * (0.9 - j * 0.2));   // 길게 벌어진 입
  // 적 몸: 생명이 빠져 창백한 빛, 광전사 손: 스며드는 붉은 빛
  p.glow(L, -2, 9, V[3], 0.18 + 0.06 * Math.sin(t * TAU * 2));
  p.glow(0, 0, 8, C[5], 0.35 + 0.1 * Math.sin(t * TAU * 2.5));
}
