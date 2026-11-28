/* ============================================================
   0.72 pixelfx 이펙트 엔진 (회차 105) — 기준: docs/DOT_STYLE.md '이펙트' 장
   • pixelfx(src/pfx-lib.js)의 효과를 실행 중에 나눠 구워(한 프레임에 4ms 이내) 그림 묶음으로 보관 → 월드 좌표에 그림
   • 다 구워지기 전에는 각 인물의 옛 그리기(임시 도형)를 그대로 씀 (PFX72.on(키)로 확인)
   • 반투명·빛 번짐 허용 (DOT_STYLE 1장 이펙트 예외), 연기는 흙먼지 갈색 (pfx-lib 안에서 교체)
   • 지금은 광전사 전용 키만 등록 (시범), 다른 인물은 같은 틀로 키를 추가
   ============================================================ */
const PFX72 = (() => {
  const RAGE = ['#1a0508', '#4a0c12', '#8a1420', '#c4202a', '#ee4a30', '#ff8a4a', '#ffd09a'];
  const RAGE_DARK = ['#0e0204', '#2a060a', '#5a0c14', '#8a1420', '#b8202a', '#e0482e', '#ff9a6a'];
  const SPARK = ['#ffd09a', '#ff8a4a', '#ee4a30', '#8a1420'];
  const BROWN = '#4a3a2e';
  // 키: m = pfx-lib 효과 이름, o = 옵션(색 등), T = 구울 길이(초, 원본보다 짧으면 끝을 흐리게), fps, pv = 기준점('c' = 그림 중심, [x, y] = 원점 기준 칸)
  const SPEC = {
    slash: { m: 'swordSlash', o: { palette: RAGE, sparks: SPARK }, T: 0.6, pv: [0, -20] },
    heavy: { m: 'heavyCleave', o: { palette: RAGE, stone: BROWN }, T: 1.0, pv: [0, -20] },
    spin: { m: 'spinSlash', o: { palette: RAGE, sparks: SPARK }, T: 0.7, pv: 'c' },
    thrust: { m: 'thrust', o: { palette: RAGE, sparks: SPARK }, T: 0.6, pv: [0, -20] },
    claw: { m: 'clawSwipe', o: { palette: RAGE, sparks: SPARK }, T: 0.7, pv: 'c' },
    flame: { m: 'spiritFlame', o: { palette: ['#1a0508', '#4a0c12', '#8a1420', '#c4202a', '#ee4a30', '#ff6a3a', '#ff8a4a', '#ffd09a', '#fff0d0'] }, fps: 20, pv: [0, 0] },
    quake: { m: 'groundSlam', o: { palette: RAGE, stone: BROWN }, T: 1.1, fps: 24, pv: [0, 0] },
    spike: { m: 'earthSpike', o: { palette: RAGE, glow: ['#4a0c12', '#c4202a', '#ff8a4a', '#ffd09a', '#fff0d0'] }, T: 1.0, fps: 24, pv: [0, 0] },
    pillar: { m: 'flamePillar', o: { stone: BROWN }, T: 1.1, fps: 24, pv: [0, 0] },
    boom: { m: 'smallExplosion', o: { stone: BROWN }, T: 0.9, fps: 24, pv: [0, 0] },
    bolt: { m: 'warBolt', o: {}, pv: [0, 0] },
    beat: { m: 'warBeat', o: { squash: 1 }, pv: [0, 0] },
    dome: { m: 'warDome', o: {}, fps: 20, pv: [0, 0] },
    domeOn: { m: 'warDome', o: { palette: RAGE_DARK }, fps: 20, pv: [0, 0] },
    roar: { m: 'warRoar', o: { squash: 1 }, pv: [0, 0] },
  };
  const S = {}, Q = [];
  let list = [], gRef = null;
  const ok = () => typeof PFX !== 'undefined' && typeof document !== 'undefined';
  function want(keys) { if (!ok()) return; for (const k of keys) if (SPEC[k] && !S[k]) { S[k] = { st: 'q' }; Q.push(k); } }
  function start(k) {
    const sp = SPEC[k], st = S[k], frames = [];
    let bb = [1e9, 1e9, -1, -1];
    st.job = PFX.bakeJob(sp.m, sp.o, { maxT: sp.T, fps: sp.fps }, (i, rgba, w, h) => {
      const cp = new Uint8ClampedArray(rgba); frames.push(cp);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (cp[(y * w + x) * 4 + 3] > 8) { if (x < bb[0]) bb[0] = x; if (y < bb[1]) bb[1] = y; if (x > bb[2]) bb[2] = x; if (y > bb[3]) bb[3] = y; }
    });
    st.frames = frames; st.bb = bb; st.st = 'b';
  }
  function finish(k) {
    const st = S[k], I = st.job.info, bb = st.bb, n = I.n;
    if (bb[2] < 0) { st.st = 'x'; return; }
    const cw = bb[2] - bb[0] + 1, ch = bb[3] - bb[1] + 1, cols = Math.max(1, Math.min(n, Math.floor(4096 / cw)));
    const cv = document.createElement('canvas'); cv.width = cw * cols; cv.height = ch * Math.ceil(n / cols);
    const c = cv.getContext('2d'), img = c.createImageData(I.w, I.h);
    st.frames.forEach((f, i) => { img.data.set(f); c.putImageData(img, (i % cols) * cw - bb[0], Math.floor(i / cols) * ch - bb[1], bb[0], bb[1], cw, ch); });
    const sp = SPEC[k], pv = sp.pv === 'c' ? [(bb[0] + bb[2]) / 2 - I.ox, (bb[1] + bb[3]) / 2 - I.oy] : sp.pv;
    // 그릴 때 기준: 잘라 낸 그림의 왼쪽 위가 기준점에서 얼마나 떨어졌는지 (효과 칸 단위)
    Object.assign(st, { cv, cw, ch, cols, n, fps: I.fps, loop: I.loop, dur: I.dur, trim: sp.T && !I.loop, dx: bb[0] - I.ox - pv[0], dy: bb[1] - I.oy - pv[1], st: 'ok' });
    delete st.frames; delete st.job;
  }
  function bake(ms) {
    const t0 = performance.now();
    while (Q.length && performance.now() - t0 < ms) {
      const k = Q[0], st = S[k];
      try {
        if (st.st === 'q') start(k);
        if (st.job.step(Math.max(1, ms - (performance.now() - t0)))) { finish(k); Q.shift(); }
      } catch (e) { st.st = 'x'; Q.shift(); if (typeof console !== 'undefined') console.warn('PFX72', k, e); }
    }
  }
  const on = k => !!(S[k] && S[k].st === 'ok');
  // 인스턴스: { k, x, y, rot, flip, sx, sy, t, e(따라갈 적), fol(캐릭터 따라감), a(투명도) }
  function play(k, x, y, o = {}) {
    if (!on(k)) return null;
    if (G !== gRef) { gRef = G; list = []; }
    if (list.length >= 80) list.shift();
    let rot = o.rot || 0, flip = !!o.flip;
    if (o.dir !== undefined) { rot = o.dir; if (Math.cos(o.dir) < 0) { flip = true; rot = o.dir - Math.PI; } }
    const s = o.s || 1, inst = { k, x, y, rot, flip, sx: o.sx || s, sy: o.sy || s, t: -(o.delay || 0), e: o.e || null, fol: !!o.fol, a: o.a ?? 1 };
    list.push(inst); return inst;
  }
  function tick(dt) {
    bake(4);
    if (G !== gRef) { gRef = G; list = []; return; }
    for (const p of list) { p.t += dt; if (p.e && !p.e.dead) { p.x = p.e.x; p.y = p.e.y; } if (p.fol && G.p) { p.x = G.p.x; p.y = G.p.y; } }
    list = list.filter(p => { const st = S[p.k]; return st && (st.loop ? p.t < (p.life ?? 1e9) : p.t < st.dur); });
  }
  function frame(c, k, x, y, t, o) {
    const st = S[k]; if (!st || st.st !== 'ok' || t < 0) return;
    let i = Math.floor(t * st.fps); if (st.loop) i %= st.n; else if (i >= st.n) return;
    let a = o.a ?? 1; if (st.trim) { const u = t / st.dur; if (u > 0.7) a *= Math.max(0, (1 - u) / 0.3); }
    if (a <= 0.01) return;
    const sx = o.sx, sy = o.sy;
    c.save(); c.imageSmoothingEnabled = false; c.globalAlpha = Math.min(1, a);
    c.translate(x, y); if (o.rot) c.rotate(o.rot); c.scale(o.flip ? -sx : sx, sy);
    c.drawImage(st.cv, (i % st.cols) * st.cw, Math.floor(i / st.cols) * st.ch, st.cw, st.ch, st.dx, st.dy, st.cw, st.ch);
    c.restore();
  }
  function draw(c) { if (G !== gRef) return; for (const p of list) frame(c, p.k, p.x, p.y, p.t, p); }
  return { SPEC, want, on, play, tick, draw, frame, bake, state: S, count: () => (G === gRef ? list.length : 0) };
})();

/* 옛 이펙트 숨기기: fx 객체에 hide72가 있으면 그리지 않음 (동작 판정·몸 휘두름 연출은 그대로) */
const _drawFx72 = drawFx;
drawFx = function (c) {
  const all = G && G.fx; if (!all || !all.some(f => f.hide72)) return _drawFx72(c);
  G.fx = all.filter(f => !f.hide72);
  try { _drawFx72(c); } finally { G.fx = all; }   // 그리기는 읽기 전용 (game.js fx 주석)
};
const hideLast72 = (kind, key) => { if (!PFX72.on(key)) return; const f = G.fx[G.fx.length - 1]; if (f && f.kind === kind && f.t === 0) f.hide72 = 1; };
