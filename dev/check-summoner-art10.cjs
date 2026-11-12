const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const target = process.env.GAME_URL || pathToFileURL('index.html').href;
const output = process.env.SUMMONER_CAPTURE_DIR || 'summoner-captures';
const scenes = {
  base: ['base-beam', .024, .21, .52],
  cleave: ['scythe', .014, .075, .13],
  shield: ['ward', .23, .345, .51],
  slam: ['descent', .065, .29, .46],
  arrow: ['arrow', .029, .102, .2],
  trap: ['grave', .17, .38, .57],
  shuriken: ['ricochet', .417, .49, .56],
  fireball: ['will-o-wisp', .14, .36, .53],
  icering: ['frost', .029, .12, .23],
  orb: ['tracking', .034, .25, .53],
};

async function setup(page, scene) {
  await page.evaluate(scene => {
    newRun();
    G.p.weapons.length = 0;
    if (scene !== 'base') addWeapon(scene);
    applyJob('summoner');
    STATE.mode = 'play'; STATE.dev.god = true; STATE.fps = 60;
    G.sel = null; G.storyOn = true; G.pendingStart = false; G.time = 10;
    SETTINGS.shake = false;
    G.fx.length = 0; G.later.length = 0;
    const p = G.p;
    G.hz.push({ k: 'line', x: p.x - 94, y: p.y + 85, dx: 1, dy: .21, len: 180, w: 13, t: .45, warn: 1 });
    const spots = [[0, 65], [-70, 120], [77, 142], [-91, 169], [83, 188], [0, 228], [33, 245], [12, 277], [-27, 253], [-59, 220], [64, 265]];
    for (const [dx, dy] of spots) makeEnemy('slime', p.x + dx, p.y + dy).hp *= 250;
    gridBuild(G.enemies);
    if (scene === 'base') {
      const w = baseW();
      assertFire(WEAPON_FIRE.beam(w, wStats(w)));
    } else {
      const w = p.weapons.find(w => w.id === scene);
      applyFuse(scene);
      fuseTick(1 / 60);
      const positions = [[-65, 93], [66, 110], [-29, 155], [57, 203]];
      F43().wr.forEach((m, i) => {
        const [dx, dy] = positions[i];
        m.x = p.x + dx; m.y = p.y + dy;
      });
      assertFire(fuseFire44(w, wStats(w)));
      if (scene === 'trap') {
        G.enemies[0].x += 42;
        gridBuild(G.enemies);
      }
    }
    function assertFire(result) {
      if (result === false) throw Error('Did not fire ' + scene);
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
      if (scene === 'trap' && window.captureTime > .43 && !G.stats.trap44) {
        const trap = G.f44.traps[1];
        const enemy = G.enemies[0];
        enemy.x = trap.x; enemy.y = trap.y;
        gridBuild(G.enemies);
      }
      for (const enemy of G.enemies) if (enemy.flash > 0) enemy.flash -= dt;
      fuseTick44(dt);
      for (const task of G.later) {
        task.t -= dt;
        if (task.t <= 0) { task.done = true; task.f(); }
      }
      G.later = G.later.filter(task => !task.done);
      updateProjectiles(dt); updateArsenal(dt); updateMisc(dt);
    }
    const snapshot = () => JSON.stringify([G.p, G.proj, G.f43, G.f44, G.fx, G.enemies, G.stats, G.hz, { ...localStorage }],
      (key, value) => key === '_s' ? undefined : value instanceof Set ? [...value] : value);
    const before = snapshot();
    const draw = ctx.drawImage, ground = drawBossGround;
    let draws = 0, warned = false, late = false;
    drawBossGround = function (c) { warned = true; return ground(c); };
    ctx.drawImage = function (image, ...args) {
      if (image === SUMMONER_IMAGES[art]) { draws++; if (warned) late = true; }
      return draw.call(this, image, ...args);
    };
    try { render(); } finally { ctx.drawImage = draw; drawBossGround = ground; }
    return {
      draws, late, warned, readOnly: before === snapshot(),
      ghosts: G.f43?.wr.length || 0,
      lines: G.f44?.lines.length || 0,
      traps: G.f44?.traps.length || 0,
      arrows: G.proj.filter(p => p.src === 'fu_summoner_arrow').length,
      bounces: G.proj.reduce((sum, p) => sum + (summonerBounces.get(p)?.length || 0), 0),
      impacts: G.fx.filter(f => f.summonerArt === art).length,
      triggered: (G.stats.trap44 || 0) > 0,
    };
  }, { scene, time, art });
}

async function checkFallback(page, scene, art) {
  return page.evaluate(({ scene, art }) => {
    const image = SUMMONER_IMAGES[art];
    const read = () => {
      render();
      return ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height).data;
    };
    const before = read();
    delete SUMMONER_IMAGES[art];
    try {
      const after = read();
      const legacy = scene === 'base' ? !summonerUsesBaseArt(baseW()) :
        scene === 'trap' ? G.f44.traps.every(trap => !summonerUsesTrapArt(trap)) :
        G.proj.every(pr => !summonerUsesProjectileArt(pr)) && !summonerArtReady(art);
      return legacy && before.some((value, i) => value !== after[i]);
    } finally { SUMMONER_IMAGES[art] = image; }
  }, { scene, art });
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
      await page.waitForFunction(() => Object.keys(SUMMONER_IMAGES).length === 10 && FIELD_ART.ready.ghost, null, { polling: 50 });
      assert.deepEqual(await page.evaluate(() => [CFG.VERSION, VIEW.cw]), ['0.46-art10', width]);
      for (const [scene, [art, ...times]] of Object.entries(scenes)) {
        await setup(page, scene);
        const shots = [];
        for (const [i, time] of times.entries()) {
          const result = await frame(page, scene, time, art);
          assert.ok(result.draws, scene + ': missing sprite at ' + time);
          assert.ok(result.warned && !result.late && result.readOnly, scene + ': render order or state');
          if (scene === 'arrow' && i === 0) assert.equal(result.arrows, 5);
          if (scene === 'trap' && i === 1) assert.equal(result.traps, 3);
          if (scene === 'trap' && i === 2) assert.ok(result.triggered);
          if (scene === 'orb' && i === 0) assert.equal(result.lines, result.ghosts);
          if (scene === 'cleave' || scene === 'icering') assert.equal(result.impacts, result.ghosts);
          if (scene === 'shuriken' && i === 2) assert.ok(result.bounces >= 2);
          const shot = await page.screenshot({ path: path.join(output, width + '-' + scene + '-' + (i + 1) + '.png') });
          shots.push(shot);
        }
        assert.ok(!shots[0].equals(shots[1]) && !shots[1].equals(shots[2]), scene + ': expected changing frames');
        await setup(page, scene);
        await frame(page, scene, times[1], art);
        assert.ok(await checkFallback(page, scene, art), scene + ': missing fallback');
      }
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await setup(page, 'base');
      assert.ok((await frame(page, 'base', .21, 'base-beam')).draws);
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log('G44-8: 10 scenes × 3 frames × 2 widths. Fallbacks, draw order and render state verified.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
