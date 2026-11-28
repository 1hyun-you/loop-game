// 회귀의 들판 — 피의 갈증: 적 몸(오른쪽 끝)에서 핏방울이 떨어져 나와 흔들리는 핏줄기를 타고 광전사(원점)로 빨려 들어옴 (루프, Claude, 회차 105)
import { cycle, fit, clamp, TAU, WHITE } from "../../core/index.js";
export const meta = {
  name: "Blood thirst", desc: "A wavering thread of blood runs from the victim back to the berserker; droplets tear off the victim and race down it, swelling as they arrive.",
  tags: ["game", "drain", "loop"], size: [140, 32], origin: [8, 16], duration: 0.6, loop: true, fps: 30, bg: "ground",
  options: { palette: ["#14040a", "#3a0a14", "#6a101c", "#a01824", "#d42a30", "#ff5a50", "#ff9a8a"], length: 120, seed: 9 },
};
// 줄 위 한 점: u = 0 광전사 … 1 적, 가운데가 가장 크게 흔들림 (두 끝은 고정)
const wave = (u, t, L) => Math.sin(u * 7.5 - t * TAU * 2) * 3.2 * Math.sin(u * Math.PI);
export function draw(p, t, o) {
  const C = fit(o.palette, 7), L = o.length;
  // 핏줄기: 짙은 테 + 붉은 심, 한 칸씩 이어 그림
  let px = 0, py = 0;
  for (let x = 0; x <= L; x++) {
    const u = x / L, y = wave(u, t, L);
    p.px(x, y + 1, C[1]); p.px(x, y, (x + Math.floor(t * 60)) % 9 < 2 ? C[4] : C[3]);
    if (x && Math.abs(y - py) > 1) p.px(x, (y + py) / 2, C[3]);
    px = x; py = y;
  }
  // 적 쪽 끝: 찢겨 나가는 상처 점멸
  p.glow(L, 0, 6, C[4], 0.35 + 0.15 * Math.sin(t * TAU * 3));
  // 핏방울: 적에서 출발해 빨라지며 들어옴, 도착 직전 부풀고 흰 점
  cycle(t, meta.duration, 7, o.seed, 0.42, (age, life, r) => {
    const k = age / life, u = 1 - k * k, x = u * L, y = wave(u, t, L), big = k > 0.8 ? 2 : 1;
    p.rect(x - big / 2, y - big / 2 - 0.5, big + 1, big + 1, C[2]);
    p.px(x, y - 0.5, k > 0.8 ? C[6] : C[5]);
    if (k > 0.85) p.light(x, y, C[5], 0.6);
  });
  // 광전사 쪽 끝: 빨아들이는 소용돌이 빛
  p.glow(0, 0, 7, C[5], 0.3 + 0.1 * Math.sin(t * TAU * 2));
}
