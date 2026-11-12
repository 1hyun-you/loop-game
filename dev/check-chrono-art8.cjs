const assert = require('node:assert/strict');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const target = process.env.GAME_URL || pathToFileURL('index.html').href;
const output = process.env.CHRONO_CAPTURE_DIR || 'chrono-captures';
const scenes = {
  base: ['base-ice-ring', .03, .16, .34],
  cleave: ['frozen-blade', .06, .34, .42],
  shield: ['time-backflow', .025, .115, .235],
  slam: ['time-collapse', .12, .84, 1.10],
  arrow: ['stasis-arrow', .14, .94, 1.12],
  trap: ['time-rift', .10, .31, .47],
  shuriken: ['rewind-star', .05, .22, .76],
  fireball: ['delayed-burst', .19, 1.3, 1.58],
  orb: ['pendulum-orb', .02, .13, .26],
  beam: ['time-needle', .075, .34, .79],
};

async function setup(page, scene) {
  await page.evaluate(scene => {
    newRun();
    G.p.weapons.length = 0;
    if (scene !== 'base') addWeapon(scene);
    applyJob('chrono');
    STATE.mode = 'play'; STATE.dev.god = true; STATE.fps = 60;
    G.sel = null; G.storyOn = true; G.pendingStart = false; G.time = 10;
    SETTINGS.shake = false;
    G.fx.length = 0; G.later.length = 0;
    const p = G.p;
    G.hz.push({ k: 'line', x: p.x - 74, y: p.y + 20, dx: 1, dy: .21, len: 160, w: 13, t: .45, warn: 1 });
    const spots = [[38, 0], [57, 29], [87, -24], [-56, 43], [-63, -43], [34, -64], [6, 74]];
    if (scene === 'shuriken') spots.push([106, 5], [95, 49], [93, 81]);
    for (const [dx, dy] of spots) makeEnemy('slime', p.x + dx, p.y + dy).hp *= 250;
    gridBuild(G.enemies);
    if (scene === 'base') {
      const w = baseW();
      WEAPON_FIRE.icering(w, wStats(w));
    } else {
      const w = p.weapons.find(w => w.id === scene);
      applyFuse(scene);
      if (!w.fu || fuseFire44(w, wStats(w)) === false) throw Error('Did not fire ' + scene);
    }
    FUSE_ART.runs.delete(G);
    JC().bn = null; G.toasts.length = 0;
    window.captureTime = 0;
    window.triggeredRift = false;
  }, scene);
}

async function frame(page, scene, time, art) {
  return page.evaluate(({ scene, time, art }) => {
    const dt = 1 / 240;
    while (window.captureTime < time) {
      window.captureTime += dt; G.time += dt;
      if (scene === 'trap' && window.captureTime > .33 && !window.triggeredRift) {
        const trap = G.f44.traps[0], enemy = G.enemies[0];
        enemy.x = trap.x; enemy.y = trap.y;
        gridBuild(G.enemies);
        window.triggeredRift = true;
      }
      fuseTick44(dt);
      for (const task of G.later) {
        task.t -= dt;
        if (task.t <= 0) { task.done = true; task.f(); }
      }
      G.later = G.later.filter(task => !task.done);
      updateProjectiles(dt);
      updateArsenal(dt);
      updateMisc(dt);
    }
    const snapshot = () => JSON.stringify([G.p, G.proj, G.f44, G.fx, G.enemies, G.stats, G.hz, { ...localStorage }],
      (key, value) => key === '_s' ? undefined : value instanceof Set ? [...value] : value);
    const before = snapshot();
    const original = ctx.drawImage, ground = drawBossGround;
    let draws = 0, warned = false, late = false;
    drawBossGround = function (c) { warned = true; return ground(c); };
    ctx.drawImage = function (image, ...args) {
      if (image === CHRONO_IMAGES[art]) { draws++; if (warned) late = true; }
      return original.call(this, image, ...args);
    };
    try { render(); } finally { ctx.drawImage = original; drawBossGround = ground; }
    return {
      draws, late, warned, readOnly: before === snapshot(),
      cueCount: G.fx.filter(f => f.chronoArt === art).length,
      projectiles: G.proj.filter(p => p.src === 'fu_chrono_' + scene).length,
      rewinding: G.proj.some(p => p.src === 'fu_chrono_shuriken' && !p.bounce),
      frozen: G.enemies.some(e => e.frz > 0),
    };
  }, { scene, time, art });
}

(async () => {
  const browser = await chromium.launch();
  try {
    fs.mkdirSync(output, { recursive: true });
    for (const width of [320, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 760 }, isMobile: true, hasTouch: true });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => { window.requestAnimationFrame = () => 0; window.triggeredRift = false; });
      await page.goto(target);
      await page.waitForFunction(() => Object.keys(CHRONO_IMAGES).length === 10, null, { polling: 50 });
      assert.equal(await page.evaluate(() => CFG.VERSION), '0.46-art8');
      assert.equal(await page.evaluate(() => VIEW.cw), width);
      for (const [scene, [art, ...times]] of Object.entries(scenes)) {
        await setup(page, scene);
        const shots = [];
        for (const [i, time] of times.entries()) {
          const result = await frame(page, scene, time, art);
          assert.ok(result.draws, scene + ': missing sprite at ' + time);
          assert.ok(result.warned && !result.late && result.readOnly, scene + ': render order or state');
          if (scene === 'arrow' && i === 0) assert.equal(result.cueCount, 8);
          if (scene === 'arrow' && i === 2) assert.ok(result.projectiles > 0);
          if (scene === 'shuriken' && i === 2) assert.ok(result.rewinding);
          if (scene === 'slam' && i === 0 || scene === 'trap' && i === 2) assert.ok(result.frozen);
          if (scene === 'orb' && i === 0) assert.equal(result.projectiles, 3);
          shots.push(await page.screenshot({ path: output + '/' + width + '-' + scene + '-' + (i + 1) + '.png' }));
        }
        assert.ok(!shots[0].equals(shots[1]) && !shots[1].equals(shots[2]), scene + ': identical captures');
      }
      for (const scene of ['base', 'cleave', 'arrow', 'trap', 'beam', 'fireball']) {
        const [art] = scenes[scene];
        await setup(page, scene);
        await frame(page, scene, scene === 'cleave' ? .34 : .16, art);
        const fallback = await page.evaluate(art => {
          const image = CHRONO_IMAGES[art];
          const read = () => {
            render();
            return ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height).data;
          };
          const original = read();
          delete CHRONO_IMAGES[art];
          try { const replacement = read(); return original.some((value, i) => value !== replacement[i]); }
          finally { CHRONO_IMAGES[art] = image; }
        }, art);
        assert.ok(fallback, scene + ': missing fallback');
      }
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await setup(page, 'beam');
      const reduced = await frame(page, 'beam', .25, 'time-needle');
      assert.ok(reduced.draws && reduced.readOnly && !reduced.late);
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log('G44-6: 60 captures at 320px and 390px. State, fallback, warning order and reduced motion verified.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
