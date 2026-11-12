const assert = require('node:assert/strict');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const target = process.env.GAME_URL || pathToFileURL('index.html').href;
const scenes = {
  cleave: ['rotary-blades', .08, .48, 1.62],
  shield: ['repulsion-plate', .08, .39, .57],
  slam: ['crush-mine', .08, .46, .67],
  arrow: ['crossbow-turret', .04, .11, 1.05],
  shuriken: ['ricochet-saw', .08, .42, .53],
  fireball: ['incendiary-mine', .08, .45, 1.20],
  icering: ['cooling-trap', .08, .42, .55],
  orb: ['tracking-drone', .08, .43, .54],
  beam: ['laser-pylon', .06, .30, 7.89],
  base: ['base-trap', .08, .36, .51],
};

async function setupScene(page, scene) {
  await page.evaluate(scene => {
    newRun();
    G.p.weapons.length = 0;
    if (scene !== 'base') addWeapon(scene);
    applyJob('engineer');
    STATE.mode = 'play'; STATE.dev.god = true; STATE.fps = 60;
    G.sel = null; G.storyOn = true; G.pendingStart = false; G.time = 10;
    SETTINGS.shake = false;
    G.fx.length = 0; G.later.length = 0;
    G.hz.push({ k: 'line', x: G.p.x - 76, y: G.p.y + 19, dx: 1, dy: .24, len: 170, w: 13, t: .45, warn: 1 });
    const positions = [[scene === 'arrow' ? 62 : 17, 0], [53, 17], [78, 42], [88, -20], [-68, 36], [-62, -40], [37, -62]];
    for (const [dx, dy] of positions) {
      const e = makeEnemy('slime', G.p.x + dx, G.p.y + dy);
      e.hp *= 250;
    }
    gridBuild(G.enemies);
    if (scene === 'base') {
      const w = baseW();
      WEAPON_FIRE.trap(w, wStats(w));
      if (!G.traps.some(t => t.engineerBase)) throw Error('Missing base trap');
    } else {
      const w = G.p.weapons.find(w => w.id === scene);
      applyFuse(scene);
      if (!w.fu || fuseFire44(w, wStats(w)) === false) throw Error('Did not fire: ' + scene);
      if (scene === 'beam') {
        G.p.x += 88; G.p.y += 15;
        fuseFire44(w, wStats(w));
        G.p.x -= 88; G.p.y -= 15;
      }
    }
    FUSE_ART.runs.delete(G);
    JC().bn = null; G.toasts.length = 0;
    window.captureTime = 0;
  }, scene);
}

async function captureFrame(page, time, art) {
  return page.evaluate(({ time, art }) => {
    const dt = 1 / 240;
    while (window.captureTime < time) {
      window.captureTime += dt; G.time += dt;
      updateTraps(dt);
      fuseTick44(dt);
      for (const task of G.later) {
        task.t -= dt;
        if (task.t <= 0) { task.done = true; task.f(); }
      }
      G.later = G.later.filter(task => !task.done);
      updateProjectiles(dt);
      updatePools(dt);
      updateMisc(dt);
    }
    const read = () => JSON.stringify([G.p, G.proj, G.f44, G.traps, G.pools, G.enemies, G.hz, G.stats, { ...localStorage }]);
    const original = ctx.drawImage;
    const before = read();
    let draws = 0;
    ctx.drawImage = function (image, ...args) {
      if (image === ENGINEER_IMAGES[art]) draws++;
      return original.call(this, image, ...args);
    };
    try { render(); } finally { ctx.drawImage = original; }
    return { draws, readOnly: before === read() };
  }, { time, art });
}

(async () => {
  const browser = await chromium.launch();
  try {
    fs.mkdirSync('engineer-captures', { recursive: true });
    for (const width of [320, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 760 }, isMobile: true, hasTouch: true });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
      await page.goto(target);
      await page.waitForFunction(() => Object.keys(ENGINEER_IMAGES).length === 10, null, { polling: 50 });
      assert.equal(await page.evaluate(() => CFG.VERSION), '0.46-art7');
      assert.equal(await page.evaluate(() => VIEW.cw), width);
      for (const [scene, [art, ...times]] of Object.entries(scenes)) {
        await setupScene(page, scene);
        const shots = [];
        for (const [i, time] of times.entries()) {
          const frame = await captureFrame(page, time, art);
          assert.ok(frame.readOnly, scene + ': render mutated game state');
          if (scene === 'fireball' && i === 2) {
            assert.ok(await page.evaluate(() => G.pools.some(pool => pool.src === 'fu_engineer_fireball')));
          } else assert.ok(frame.draws, scene + ': missing artwork at ' + time);
          shots.push(await page.screenshot({ path: 'engineer-captures/' + width + '-' + scene + '-' + (i + 1) + '.png' }));
        }
        assert.ok(!shots[0].equals(shots[1]) && !shots[1].equals(shots[2]), scene + ': identical frames');
      }
      for (const scene of ['base', 'shuriken', 'beam', 'fireball']) {
        const [art] = scenes[scene];
        await setupScene(page, scene);
        await captureFrame(page, scene === 'shuriken' || scene === 'fireball' ? .46 : .16, art);
        const compare = await page.evaluate(art => {
          const image = ENGINEER_IMAGES[art];
          const capture = () => {
            render();
            return ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height).data;
          };
          const before = capture();
          delete ENGINEER_IMAGES[art];
          try {
            const after = capture();
            return before.some((value, i) => value !== after[i]);
          } finally { ENGINEER_IMAGES[art] = image; }
        }, art);
        assert.ok(compare, scene + ': missing fallback difference');
      }
      const links = await page.evaluate(() => [4, 4.01, 239.99, 240].map(engineerNodesConnect));
      assert.deepEqual(links, [false, true, true, false]);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const reduced = await captureFrame(page, .52, 'incendiary-mine');
      assert.ok(reduced.readOnly && reduced.draws);
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log('G44-5: 10 scenes, 3 frames each at 320px and 390px. Fallback, reduced motion, fence boundaries, and render state checks passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
