const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const target = process.env.GAME_URL || pathToFileURL('index.html').href;
const output = process.env.DRUID_CAPTURE_DIR || 'druid-captures';
const scenes = {
  base: ['slam', .04, .14, .26],
  cleave: ['paw', .025, .075, .13],
  shield: ['shell', .045, .15, .25],
  arrow: ['thorn', .02, .11, .23],
  trap: ['snare', .07, .36, .91],
  shuriken: ['wolf', .19, .35, .59],
  fireball: ['lava', .06, .25, .5],
  icering: ['frost', .06, .18, .32],
  orb: ['spirit', .035, .14, .24],
  beam: ['rift', .055, .24, .51],
};

async function setup(page, scene) {
  await page.evaluate(scene => {
    newRun();
    G.p.weapons.length = 0;
    if (scene !== 'base') addWeapon(scene);
    applyJob('druid');
    STATE.mode = 'play'; STATE.dev.god = true; STATE.fps = 60;
    G.sel = null; G.storyOn = true; G.pendingStart = false; G.time = 10;
    SETTINGS.shake = false;
    G.fx.length = 0; G.later.length = 0;
    const p = G.p;
    p.hp = p.maxHp - 14;
    G.hz.push({ k: 'line', x: p.x - 88, y: p.y - 52, dx: 1, dy: .5, len: 172, w: 13, t: .45, warn: 1 });
    const q = bearPt();
    q.x = p.x - 40; q.y = p.y + 48;
    const wolf = G.pets.find(m => m.kind === 'wolf');
    wolf.x = p.x + 47; wolf.y = p.y - 42;
    const spots = [[60, 10], [84, -20], [109, 12], [117, -25], [78, 47], [126, 67], [-62, -9], [-5, -58], [-12, 69]];
    for (const [dx, dy] of spots) makeEnemy('slime', q.x + dx, q.y + dy).hp *= 250;
    gridBuild(G.enemies);
    if (scene === 'base') {
      const w = baseW();
      WEAPON_FIRE.slam(w, wStats(w));
    } else {
      const w = p.weapons.find(w => w.id === scene);
      applyFuse(scene);
      if (fuseFire44(w, wStats(w)) === false) throw Error('Did not fire ' + scene);
    }
    FUSE_ART.runs.delete(G);
    JC().bn = null; G.toasts.length = 0;
    window.captureTime = 0;
  }, scene);
}

async function frame(page, scene, time, art) {
  return page.evaluate(({ scene, time, art }) => {
    const dt = 1 / 240;
    while (window.captureTime < time) {
      window.captureTime += dt; G.time += dt;
      for (const enemy of G.enemies) if (enemy.flash > 0) enemy.flash -= dt;
      fuseTick44(dt);
      for (const task of G.later) {
        task.t -= dt;
        if (task.t <= 0) { task.done = true; task.f(); }
      }
      G.later = G.later.filter(task => !task.done);
      updateProjectiles(dt); updateArsenal(dt); updateMisc(dt);
    }
    const snapshot = () => JSON.stringify([G.p, G.proj, G.pets, G.f44, G.fx, G.enemies, G.stats, G.hz, { ...localStorage }],
      (key, value) => key === '_s' ? undefined : value instanceof Set ? [...value] : value);
    const before = snapshot();
    const draw = ctx.drawImage, ground = drawBossGround;
    let draws = 0, warned = false, late = false;
    drawBossGround = function (c) { warned = true; return ground(c); };
    ctx.drawImage = function (image, ...args) {
      if (image === DRUID_IMAGES[art]) { draws++; if (warned) late = true; }
      return draw.call(this, image, ...args);
    };
    try { render(); } finally { ctx.drawImage = draw; drawBossGround = ground; }
    return {
      draws, late, warned, readOnly: before === snapshot(),
      arrows: G.proj.filter(p => p.src === 'fu_druid_arrow').length,
      triggered: (G.stats.trap44 || 0) > 0,
      hit: (G.stats.dmg['fu_druid_' + scene] || 0) > 0,
    };
  }, { scene, time, art });
}

async function checkFallback(page, art) {
  return page.evaluate(art => {
    const image = DRUID_IMAGES[art];
    const read = () => {
      render();
      return ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height).data;
    };
    const before = read();
    delete DRUID_IMAGES[art];
    try {
      const after = read();
      return !druidArtReady(art) && before.some((value, i) => value !== after[i]);
    } finally { DRUID_IMAGES[art] = image; }
  }, art);
}

(async () => {
  const browser = await chromium.launch();
  try {
    fs.mkdirSync(output, { recursive: true });
    for (const width of [320, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 760 }, isMobile: true, hasTouch: true });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
      await page.goto(target);
      await page.waitForFunction(() => Object.keys(DRUID_IMAGES).length === 10, null, { polling: 50 });
      assert.deepEqual(await page.evaluate(() => [CFG.VERSION, VIEW.cw]), ['0.46-art12', width]);
      for (const [scene, [art, ...times]] of Object.entries(scenes)) {
        await setup(page, scene);
        const shots = [];
        for (const [i, time] of times.entries()) {
          const result = await frame(page, scene, time, art);
          assert.ok(result.draws, scene + ': missing sprite at ' + time);
          assert.ok(result.warned && !result.late && result.readOnly, scene + ': render order or state');
          if (scene === 'arrow' && i === 0) assert.equal(result.arrows, 6);
          if (scene === 'trap' && i === 2) assert.ok(result.triggered);
          const shot = await page.screenshot({ path: path.join(output, width + '-' + scene + '-' + (i + 1) + '.png') });
          shots.push(shot);
        }
        assert.ok(!shots[0].equals(shots[1]) && !shots[1].equals(shots[2]), scene + ': expected changing frames');
        await setup(page, scene);
        await frame(page, scene, times[1], art);
        assert.ok(await checkFallback(page, art), scene + ': missing fallback');
      }
      await setup(page, 'cleave');
      const strikes = await page.evaluate(() => {
        const w = G.p.weapons.find(w => w.id === 'cleave');
        const fire = () => FU44.druid.cleave.f({ w, src: 'fu_druid_cleave', a: 1, d: n => n, col: '#d8b080' });
        fire();
        fire();
        return G.fx.filter(f => f.druidArt).map(f => [f.druidArt, f.druidReverse ?? null]);
      });
      assert.deepEqual(strikes, [['paw', false], ['paw', true], ['slam', null]]);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await setup(page, 'icering');
      assert.ok((await frame(page, 'icering', .14, 'frost')).draws);
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log('G44-10: 10 scenes × 3 frames × 2 widths. Fallbacks, draw order and render state verified.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
