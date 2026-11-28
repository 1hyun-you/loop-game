// 회귀의 들판 게임용 pixelfx 묶음 (Claude, 회차 105) — 필요한 이펙트만, 실행 중 굽기(bake)
import { createFrame, clearFrame, createFx, composite, SMOKE_RAMP, hex } from "./src/core/index.js";
import * as swordSlash from "./src/fx/melee/sword-slash.js";
import * as heavyCleave from "./src/fx/melee/heavy-cleave.js";
import * as spinSlash from "./src/fx/melee/spin-slash.js";
import * as thrust from "./src/fx/melee/thrust.js";
import * as clawSwipe from "./src/fx/melee/claw-swipe.js";
import * as spiritFlame from "./src/fx/fire/spirit-flame.js";
import * as groundPound from "./src/fx/moves/ground-pound.js";
import * as groundSlam from "./src/fx/impacts/ground-slam.js";
import * as earthSpike from "./src/fx/nature/earth-spike.js";
import * as flamePillar from "./src/fx/fire/flame-pillar.js";
import * as smallExplosion from "./src/fx/explosions/small-explosion.js";
import * as warBolt from "./src/fx/game/war-bolt.js";
import * as warBeat from "./src/fx/game/war-beat.js";
import * as warDome from "./src/fx/game/war-dome.js";
import * as warRoar from "./src/fx/game/war-roar.js";
import * as warDrain from "./src/fx/game/war-drain.js";
import * as warBlades from "./src/fx/game/war-blades.js";
import * as warSoul from "./src/fx/game/war-soul.js";
import * as warGash from "./src/fx/game/war-gash.js";
const MODS = { swordSlash, heavyCleave, spinSlash, thrust, clawSwipe, spiritFlame, groundPound, groundSlam, earthSpike, flamePillar, smallExplosion, warBolt, warBeat, warDome, warRoar, warDrain, warBlades, warSoul, warGash };
// 연기: 회보라 → 흙먼지 갈색 (자홍 금지 규칙과 거리 두기)
["#6e5a40", "#54442f", "#3e3224", "#2a2119", "#1a140f"].forEach((c, i) => (SMOKE_RAMP[i] = hex(c)));
/** 나눠 굽기: job.step(ms) 를 여러 프레임에 걸쳐 불러 화면 끊김 없이 굽기. put(i, rgba, w, h) 로 한 장씩 넘김 */
function bakeJob(name, opts = {}, cfg = {}, put) {
  const mod = MODS[name], meta = mod.meta, fps = cfg.fps || meta.fps || 30;
  const [w, h] = meta.size, [ox, oy] = meta.origin;
  const D = Math.min(cfg.maxT || meta.duration, meta.duration), n = Math.max(1, Math.round(D * fps));
  const fx = createFx(mod, { ...opts, x: 0, y: 0 }), frame = createFrame(w, h, -ox, -oy), one = new Uint8ClampedArray(w * h * 4);
  let i = 0;
  const info = { w, h, ox, oy, fps, n, loop: !!meta.loop, dur: n / fps };
  return { info, get done() { return i >= n; }, step(ms = 4) {
    const t0 = (typeof performance !== "undefined" ? performance : Date).now();
    while (i < n) {
      if (i) fx.update(1 / fps);
      clearFrame(frame); fx.draw(frame); composite(frame, one, null, opts.light ?? 1);
      put(i, one, w, h); i++;
      if ((typeof performance !== "undefined" ? performance : Date).now() - t0 > ms) break;
    }
    return i >= n;
  } };
}
globalThis.PFX = { bakeJob, MODS };
