// 회귀의 들판 — 칼무덤: 꽂힌 칼 위로 덮인 붉은 반구 돔 (루프, Claude, 회차 105 · 0.74 반구 모양)
// 바닥 테는 옅게, 돔 윤곽(반구 위쪽 선)은 또렷하지만 반투명, 표면에 흐르는 빛
import { fit, TAU, WHITE, hex } from "../../core/index.js";
export const meta = {
  name: "Sword grave dome", desc: "A sword stuck in the ground under a wavering half-sphere of red fighting spirit: faint floor ring, a clear translucent dome outline with light running over it.",
  tags: ["game", "aura", "loop"], size: [140, 130], origin: [70, 86], duration: 1, loop: true, fps: 30, bg: "ground",
  options: { palette: ["#1a0508", "#4a0c12", "#8a1420", "#c4202a", "#ee4a30", "#ff8a4a", "#ffd09a"], radius: 52, squash: 0.62, height: 0.8, seed: 5 },
};
const STEEL = ["#2b2b33", "#5c5c6b", "#a4a4b2", "#e0e0ea"].map(hex);
export function draw(p, t, o) {
  const C = fit(o.palette, 7), RR = o.radius, sq = o.squash, ph = t * TAU;
  const r = RR * (1 + 0.015 * Math.sin(ph * 2)), ry = r * sq, H = r * o.height;
  // 바닥 테: 옅게 (반투명), 앞쪽 절반만 조금 더 진하게
  for (let i = 0; i < 160; i++) { const a = (i / 160) * TAU, x = Math.cos(a) * r, y = Math.sin(a) * ry; p.blend(x, y, C[3], y > 0 ? 0.45 : 0.22); }
  // 돔 안쪽: 아주 옅은 붉은 막 (반투명 면) + 빛
  p.shade(-r, -H - 1, r, ry, (x, y, out) => {
    const inBase = (x * x) / (r * r) + (y * y) / (ry * ry) <= 1, top = -H * Math.sqrt(Math.max(0, 1 - (x * x) / (r * r)));
    if (!(inBase || (y < 0 && y >= top))) return;
    out.c = C[2]; out.a = 0;   // 자리만 잡고 실제 칠은 아래 blend로
  });
  for (let x = -r + 1; x < r; x += 1) {
    const top = -H * Math.sqrt(1 - (x * x) / (r * r)), bot = ry * Math.sqrt(1 - (x * x) / (r * r));
    for (let y = Math.ceil(top) + 2; y < bot; y += 1) p.blend(x, y, C[2], 0.1 + 0.06 * (1 - (y - top) / (bot - top)));
  }
  // 돔 윤곽: 반구 위쪽 선 2칸, 반투명하지만 또렷, 위쪽이 밝고 양 끝으로 갈수록 짙음, 흐르는 하이라이트
  for (let i = 0; i <= 200; i++) {
    const a = Math.PI + (i / 200) * Math.PI, x = Math.cos(a) * r, y = Math.sin(a) * H, u = i / 200;
    const run = Math.cos((u - ((t * 0.9) % 1)) * TAU * 1.5) > 0.82;
    const c = run ? C[6] : Math.abs(u - 0.5) < 0.3 ? C[4] : C[3];
    p.blend(x, y, c, run ? 0.95 : 0.78); p.blend(x, y + 1, C[2], 0.6);
  }
  p.glow(0, -H * 0.55, r * 0.7, C[3], 0.1);
  // 꽂힌 칼
  p.rect(-1, -34, 3, 34, STEEL[2]); p.rect(-1, -34, 1, 34, STEEL[3]); p.rect(1, -34, 1, 34, STEEL[1]);
  p.rect(-7, -36, 15, 3, C[3]); p.rect(-7, -36, 15, 1, C[5]);
  p.rect(-1, -44, 3, 8, STEEL[0]); p.rect(-2, -46, 5, 2, C[4]);
  p.rect(-3, -1, 7, 2, C[1]);
  p.glow(0, -36, 8, C[5], 0.25 + 0.1 * Math.sin(ph * 4));
}
