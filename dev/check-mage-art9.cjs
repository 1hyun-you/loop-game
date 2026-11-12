const assert = require('node:assert/strict');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const target = process.env.GAME_URL || pathToFileURL('index.html').href;
const output = process.env.MAGE_CAPTURE_DIR || 'mage-captures';
const scenes = {
  base: ['base-fireball', .028, .064, .095],
  cleave: ['flame-whip', .018, .07, .137],
  shield: ['elemental-shield', .02, .11, .24],
  slam: ['meteor-drop', .08, .42, .58],
  arrow: ['flame-spear', .023, .075, .123],
  trap: ['fire-rune', .12, .29, .56],
  shuriken: ['ricochet-fireball', .035, .12, .26],
  icering: ['steam-burst', .102, .17, .29],
  steam: ['steam-burst', .102, .17, .29],
  orb: ['elemental-spirit', .027, .105, .235],
  beam: ['flame-beam', .025, .23, .54],
};

async function setup(page, scene) {
  await page.evaluate(scene => {
    newRun();
    G.p.weapons.length = 0;
    const weapon = scene === 'steam' ? 'icering' : scene;
    if (weapon !== 'base') addWeapon(weapon);
    applyJob('mage');
    STATE.mode = 'play'; STATE.dev.god = true; STATE.fps = 60;
    G.sel = null; G.storyOn = true; G.pendingStart = false; G.time = 10;
    SETTINGS.shake = false;
    G.fx.length = 0; G.later.length = 0;
    const p = G.p;
    G.hz.push({ k: 'line', x: p.x - 74, y: p.y + 20, dx: 1, dy: .21, len: 160, w: 13, t: .45, warn: 1 });
    const spots = [[38, 0], [57, 29], [87, -24], [-56, 43], [-63, -43], [34, -64], [6, 74]];
    if (scene === 'shuriken') spots.push([106, 5], [95, 49], [93, 81]);
    for (const [dx, dy] of spots) makeEnemy('slime', p.x + dx, p.y + dy).hp *= 250;
    if (scene === 'steam') G.enemies[0].slowT = 1;
    gridBuild(G.enemies);
    if (scene === 'base') {
      const w = baseW();
      WEAPON_FIRE.fireball(w, wStats(w));
    } else {
      const w = p.weapons.find(w => w.id === weapon);
      applyFuse(weapon);
      if (!w.fu || fuseFire44(w, wStats(w)) === false) throw Error('Did not fire ' + scene);
    }
    FUSE_ART.runs.delete(G);
    JC().bn = null; G.toasts.length = 0;
    window.captureTime = 0;
    window.triggeredRune = false;
  }, scene);
}

async function frame(page, scene, time, art) {
  return page.evaluate(({ scene, time, art }) => {
    const dt = 1 / 240;
    while (window.captureTime < time) {
      window.captureTime += dt; G.time += dt;
      if (scene === 'trap' && window.captureTime > .42 && !window.triggeredRune) {
        const trap = G.f44?.traps[0];
        if (trap) {
          const enemy = G.enemies[0];
          enemy.x = trap.x; enemy.y = trap.y;
          gridBuild(G.enemies);
          window.triggeredRune = true;
        }
      }
      for (const enemy of G.enemies) if (enemy.flash > 0) enemy.flash -= dt;
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
    const snapshot = () => JSON.stringify([G.p, G.proj, G.f44, G.fx, G.pools, G.enemies, G.stats, G.hz, { ...localStorage }],
      (key, value) => key === '_s' ? undefined : value instanceof Set ? [...value] : value);
    const before = snapshot();
    const original = ctx.drawImage, ground = drawBossGround;
    let draws = 0, warned = false, late = false;
    drawBossGround = function (c) { warned = true; return ground(c); };
    ctx.drawImage = function (image, ...args) {
      if (image === MAGE_IMAGES[art]) { draws++; if (warned) late = true; }
      return original.call(this, image, ...args);
    };
    try { render(); } finally { ctx.drawImage = original; drawBossGround = ground; }
    return {
      draws, late, warned, readOnly: before === snapshot(),
      kinds: G.fx.filter(f => f.mageArt === art).map(f => f.mageKind),
      projectiles: G.proj.filter(p => p.src === 'fu_mage_' + scene).length,
      runeTriggered: (G.stats.trap44 || 0) > 0,
      steam: (G.stats.steam44 || 0) > 0,
    };
  }, { scene, time, art });
}

async function assertFallback(page, scene, art, time) {
  await setup(page, scene);
  await frame(page, scene, time, art);
  const fallback = await page.evaluate(({ scene, art }) => {
    const image = MAGE_IMAGES[art];
    const projectile = G.proj.find(p => mageProjectileArt(p) === art);
    const line = G.f44?.lines[0], trap = G.f44?.traps[0];
    const read = () => {
      render();
      return ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height).data;
    };
    const before = read();
    delete MAGE_IMAGES[art];
    try {
      const after = read();
      const legacy = scene === 'beam' ? line && !mageUsesLineArt(line) :
        scene === 'trap' ? trap && !mageUsesTrapArt(trap) :
        projectile ? !mageUsesProjectileArt(projectile) : !mageArtReady(art);
      return legacy && before.some((value, i) => value !== after[i]);
    } finally { MAGE_IMAGES[art] = image; }
  }, { scene, art });
  assert.ok(fallback, scene + ': missing fallback');
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
      await page.waitForFunction(() => Object.keys(MAGE_IMAGES).length === 10, null, { polling: 50 });
      assert.equal(await page.evaluate(() => CFG.VERSION), '0.46-art9');
      assert.equal(await page.evaluate(() => VIEW.cw), width);
      for (const [scene, [art, ...times]] of Object.entries(scenes)) {
        await setup(page, scene);
        const shots = [];
        for (const [i, time] of times.entries()) {
          const result = await frame(page, scene, time, art);
          assert.ok(result.draws, scene + ': missing sprite at ' + time);
          assert.ok(result.warned && !result.late && result.readOnly, scene + ': render order or state');
          if (scene === 'orb' && i === 0) assert.equal(result.projectiles, 3);
          if (scene === 'shuriken' && i === 2) assert.equal(result.kinds.filter(kind => kind === 'bounce').length, 3);
          if (scene === 'trap' && i === 2) assert.ok(result.runeTriggered);
          if (scene === 'slam' && i === 2) assert.ok(result.kinds.includes('meteor-hit'));
          if (scene === 'icering') assert.ok(result.kinds.includes('chill') && !result.steam);
          if (scene === 'steam') assert.ok(result.kinds.includes('steam') && result.steam);
          shots.push(await page.screenshot({ path: output + '/' + width + '-' + scene + '-' + (i + 1) + '.png' }));
        }
        assert.ok(!shots[0].equals(shots[1]) && !shots[1].equals(shots[2]), scene + ': identical captures');
      }
      for (const scene of ['base', 'cleave', 'shield', 'slam', 'arrow', 'trap', 'shuriken', 'icering', 'orb', 'beam']) {
        const [art, time] = scenes[scene];
        await assertFallback(page, scene, art, time);
      }
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await setup(page, 'beam');
      const reduced = await frame(page, 'beam', .25, 'flame-beam');
      assert.ok(reduced.draws && reduced.readOnly && !reduced.late);
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log('G44-7: 66 captures at 320px and 390px. State, fallback, warning order and reduced motion verified.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
