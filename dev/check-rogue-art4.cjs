const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const target = process.env.GAME_URL || 'file://' + require('node:path').resolve('index.html');
const frames = {
  cleave: [0.028, 0.085, 0.174], shield: [0.045, 0.16, 0.55], slam: [0.49, 0.62, 0.79],
  arrow: [0.025, 0.09, 0.15], trap: [0.22, 0.37, 0.67], fireball: [0.04, 0.12, 0.23],
  icering: [0.04, 0.13, 0.24], orb: [0.035, 0.135, 0.25], beam: [0.45, 0.7, 0.99],
};
(async () => {
  const browser = await chromium.launch();
  try {
    fs.mkdirSync('rogue-captures', { recursive: true });
    for (const width of [320, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 760 }, isMobile: true, hasTouch: true, reducedMotion: 'no-preference' });
      const errors = [];
      await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(target);
      await page.waitForFunction(() => Object.keys(ROGUE_ART_IMAGES).length === 10, null, { polling: 40 });
      assert.equal(await page.evaluate(() => CFG.VERSION), '0.46-art4');
      for (const [id, stages] of Object.entries(frames)) {
        const before = await page.evaluate(id => {
          newRun(); STATE.mode = 'play'; G.sel = null; G.storyOn = true; STATE.dev.god = true;
          G.pendingStart = false; G.time = 10;
          G.p.weapons.length = 0; addWeapon(id); applyJob('rogue'); G.p.face = { x: 1, y: 0 };
          STATE.mode = 'play'; G.sel = null; SETTINGS.shake = false;
          G.fx.length = 0; G.later.length = 0; G.toasts.length = 0;
          G.hz.push({ k: 'line', x: G.p.x - 84, y: G.p.y - 86, dx: 1, dy: .12, len: 170, w: 20, t: .45, warn: 1 });
          for (const [dx, dy] of [[63, 0], [84, 32], [-62, 42], [-37, -48], [50, -68], [-82, -37], [96, -55], [28, 72]]) {
            const e = makeEnemy('slime', G.p.x + dx, G.p.y + dy);
            e.hp *= 200;
          }
          gridBuild(G.enemies);
          F43().trail.push({ x: G.p.x - 25, y: G.p.y + 27 });
          const w = G.p.weapons.find(w => w.id === id);
          applyFuse(id);
          fuseFire44(w, wStats(w));
          FUSE_ART.runs.delete(G); JC().bn = null; G.toasts.length = 0;
          window.captureTime = 0;
          return !!w.fu;
        }, id);
        assert.ok(before, id);
        const shots = [];
        for (let i = 0; i < stages.length; i++) {
          const frame = await page.evaluate(({ t, id }) => {
            const dt = 1 / 240;
            while (window.captureTime < t) {
              window.captureTime += dt;
              G.time += dt;
              updateArsenal(dt);
              fuseTick44(dt);
              for (const task of G.later) {
                task.t -= dt;
                if (task.t <= 0) { task.done = true; task.f(); }
              }
              G.later = G.later.filter(task => !task.done);
              updateProjectiles(dt);
              updateMisc(dt);
            }
            const read = () => JSON.stringify([G.proj.map(p => [p.x,p.y,p.life,p.dmg,p.pierce]), G.tm, G.stats, G.p.hp, { ...localStorage }]);
            const original = ctx.drawImage;
            let art = 0;
            ctx.drawImage = function (img, ...args) {
              if (img === ROGUE_ART_IMAGES[id]) art++;
              return original.call(this, img, ...args);
            };
            const before = read();
            try { render(); } finally { ctx.drawImage = original; }
            return { unchanged: before === read(), art };
          }, { t: stages[i], id });
          assert.ok(frame.unchanged, id + ' renderer changed game state');
          if (frame.art) shots.art = true;
          const shot = await page.screenshot({ path: 'rogue-captures/' + width + '-' + id + '-' + (i + 1) + '.png' });
          shots.push(shot);
        }
        assert.ok(shots.art, id + ' artwork never drawn');
        assert.ok(!shots[0].equals(shots[1]) && !shots[1].equals(shots[2]), id + ' static frames');
      }
      const fallback = await page.evaluate(() => {
        const id = 'beam', asset = ROGUE_ART_IMAGES[id];
        delete ROGUE_ART_IMAGES[id]; render();
        const hidden = rogueArtReady(id) === false;
        ROGUE_ART_IMAGES[id] = asset;
        return hidden && rogueArtReady(id);
      });
      assert.ok(fallback);
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log('G44-2: 9 combinations × 3 frames × 2 widths; fallback and read-only rendering passed.');
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
