const assert = require('node:assert/strict');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const target = process.env.GAME_URL || pathToFileURL('index.html').href;
const scenes = {
  cleave: ['split-arrow', .023, .081, .23],
  shield: ['impact-arrow', .035, .116, .24],
  slam: ['falling-arrow', .064, .34, .56],
  trap: ['hunting-trap', .065, .22, .48],
  shuriken: ['ricochet-arrow', .036, .103, .22],
  fireball: ['fire-arrow', .035, .116, .24],
  icering: ['frost-arrow', .035, .116, .24],
  orb: ['hunting-hawk', .06, .20, .43],
  beam: ['charged-arrow', .019, .036, .104],
  normal: ['base-arrow', .025, .048, .077],
  base: ['base-arrow', .025, .048, .077],
};

(async () => {
  const browser = await chromium.launch();
  try {
    fs.mkdirSync('archer-captures', { recursive: true });
    for (const width of [320, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 760 }, isMobile: true, hasTouch: true });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
      await page.goto(target);
      await page.waitForFunction(() => Object.keys(ARCHER_IMAGES).length === 10, null, { polling: 50 });
      assert.equal(await page.evaluate(() => CFG.VERSION), '0.46-art6');
      assert.equal(await page.evaluate(() => VIEW.cw), width);
      for (const [scene, [art, ...times]] of Object.entries(scenes)) {
        await page.evaluate(scene => {
          newRun();
          G.p.weapons.length = 0;
          const id = scene === 'normal' ? 'beam' : scene;
          if (id !== 'base') addWeapon(id);
          applyJob('archer');
          STATE.mode = 'play'; G.sel = null; G.storyOn = true; STATE.dev.god = true; STATE.fps = 60;
          G.pendingStart = false; G.time = 10; SETTINGS.shake = false;
          G.p.face = { x: 1, y: 0 };
          G.fx.length = 0; G.later.length = 0; G.toasts.length = 0;
          G.hz.push({ k: 'line', x: G.p.x - 70, y: G.p.y - 29, dx: 1, dy: .24, len: 160, w: 13, t: .45, warn: 1 });
          const positions = scene === 'trap'
            ? [[46, 0], [55, 30], [-61, 48], [-57, -49], [94, 53]]
            : scene === 'orb'
              ? [[30, -45], [67, 28], [-55, 39], [-64, -56], [98, 47]]
              : [[63, 0], [84, 32], [-62, 42], [-37, -48], [50, -68], [-82, -37], [96, -55], [28, 72]];
          for (const [dx, dy] of positions) {
            const e = makeEnemy('slime', G.p.x + dx, G.p.y + dy);
            e.hp *= 250;
          }
          gridBuild(G.enemies);
          if (scene === 'beam') J41().focus = 5;
          if (scene === 'base') {
            const w = baseW();
            WEAPON_FIRE.arrow(w, wStats(w));
          } else {
            const w = G.p.weapons.find(w => w.id === id);
            applyFuse(id);
            if (!w.fu || fuseFire44(w, wStats(w)) === false) throw Error('Did not fire: ' + id);
          }
          FUSE_ART.runs.delete(G);
          JC().bn = null; G.toasts.length = 0;
          window.captureTime = 0;
        }, scene);
        const shots = [];
        let draws = 0;
        for (const [i, time] of times.entries()) {
          const frame = await page.evaluate(({ time, art }) => {
            const dt = 1 / 240;
            while (window.captureTime < time) {
              window.captureTime += dt; G.time += dt;
              fuseTick44(dt);
              for (const task of G.later) {
                task.t -= dt;
                if (task.t <= 0) { task.done = true; task.f(); }
              }
              G.later = G.later.filter(task => !task.done);
              updateProjectiles(dt);
              updateMisc(dt);
            }
            const read = () => JSON.stringify([G.proj, G.f44, G.enemies, G.hz, G.stats, G.p.hp, { ...localStorage }]);
            const original = ctx.drawImage;
            let draws = 0;
            ctx.drawImage = function (image, ...args) {
              if (image === ARCHER_IMAGES[art]) draws++;
              return original.call(this, image, ...args);
            };
            const before = read();
            try { render(); } finally { ctx.drawImage = original; }
            return { readOnly: before === read(), draws };
          }, { time, art });
          assert.ok(frame.readOnly, scene + ': render mutated game state');
          draws += frame.draws;
          shots.push(await page.screenshot({ path: 'archer-captures/' + width + '-' + scene + '-' + (i + 1) + '.png' }));
        }
        assert.ok(draws, scene + ': missing artwork');
        assert.ok(!shots[0].equals(shots[1]) && !shots[1].equals(shots[2]), scene + ': identical frames');
      }
      const fallback = await page.evaluate(() => {
        const p = G.p;
        const pr = shoot({ kind: 'arrow', src: 'arrow', x: p.x + 42, y: p.y, ang: 0, sp: 500 });
        const line = { src: 'fu_archer_beam', x: p.x, y: p.y, a: 0, L: 900, wd: 10, dur: .15, t: .03, col: '#fffbe0' };
        const trap = { tag: 'fu_archer_trap', x: p.x + 48, y: p.y, t: .4, arm: .35, kind: 'jaw', col: '#bce283' };
        F44S().lines.push(line); F44S().traps.push(trap);
        const fallbackRing = { kind: 'ring', x: p.x + 36, y: p.y + 22, t: .06, r0: 12, r1: 55, dur: .3, color: '#ff9a4a', archerArt: 'fire-arrow' };
        G.fx.push(fallbackRing);
        const keys = ['base-arrow', 'charged-arrow', 'hunting-trap', 'fire-arrow'];
        const ready = archerUsesProjectileArt(pr) && archerUsesLineArt(line) && archerUsesTrapArt(trap);
        const saved = keys.map(key => ARCHER_IMAGES[key]);
        render();
        const before = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height).data;
        keys.forEach(key => { delete ARCHER_IMAGES[key]; });
        try {
          render();
          const after = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height).data;
          return ready && !archerUsesProjectileArt(pr) && !archerUsesLineArt(line) && !archerUsesTrapArt(trap)
            && !archerArtReady(fallbackRing.archerArt) && before.some((v, i) => v !== after[i]);
        } finally { keys.forEach((key, i) => { ARCHER_IMAGES[key] = saved[i]; }); }
      });
      assert.ok(fallback, 'missing fallback');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.evaluate(() => render());
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log('G44-4: 9 fusions, uncharged and base arrows, 3 frames each at 320px and 390px. Fallback and render state checks passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
