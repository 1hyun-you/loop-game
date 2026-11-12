const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const output = path.resolve(process.env.WARRIOR_ART_OUTPUT || 'dev/warrior-art3-captures');
const ids = ['cleave', 'shield', 'slam', 'arrow', 'trap', 'shuriken', 'fireball', 'icering', 'orb', 'beam'];

async function check() {
  fs.mkdirSync(output, { recursive: true });
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (/^\/fonts\/[a-zA-Z0-9_.-]+\.woff2$/.test(url.pathname)) {
      res.setHeader('Content-Type', 'font/woff2');
      return fs.createReadStream(path.join(root, url.pathname)).on('error', () => res.end()).pipe(res);
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(fs.readFileSync(path.join(root, 'index.html')));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.ART2_CHROMIUM_PATH });
    const url = process.env.WARRIOR_ART_URL || 'http://127.0.0.1:' + server.address().port;
    for (const width of [320, 390]) {
      const page = await browser.newPage({ viewport: { width, height: width === 320 ? 700 : 844 }, isMobile: true, hasTouch: true });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(url);
      await page.waitForFunction(() => typeof WARRIOR_ART !== 'undefined' && Object.keys(WARRIOR_ART.images).length === 10);
      await page.evaluate(() => {
        if (CFG.VERSION !== '0.46-art3') throw Error('Unexpected version: ' + CFG.VERSION);
        STATE.dev.auto = false;
        SETTINGS.shake = false;
        window.warriorScene = (id, elapsed, danger) => {
          newRun();
          STATE.dev.speed = 0;
          STATE.dev.fps = false;
          STATE.mode = 'play';
          G.pendingStart = false;
          G.storyOn = true;
          G.p.weapons.length = 0;
          applyJob('warrior');
          G.p.face = { x: .9, y: -.4 };
          G.time = 10;
          G.p.fury = 100;
          if (id !== 'cleave') {
            addWeapon(id);
            applyFuse(id);
          }
          G.fx.length = 0;
          G.later.length = 0;
          WARRIOR_ART.shield.delete(G);
          G.banner = null;
          JC().bn = null;
          G.toasts.length = 0;
          FUSE_ART.runs.delete(G);
          for (let i = 0; i < 18; i++) {
            const a = i * 2.4 + .2, r = 85 + i % 5 * 16;
            const e = makeEnemy(ENEMY_ORDER[i % 4], Math.cos(a) * r, Math.sin(a) * r);
            if (e) e.hp = e.maxHp = 8000;
          }
          const target = makeEnemy('slime', 25, -63);
          if (target) target.hp = target.maxHp = 8000;
          if (id === 'trap') {
            const e = makeEnemy('slime', 21, 1);
            if (e) e.hp = e.maxHp = 8000;
          }
          if (danger) G.hz.push({ k: 'line', x: -84, y: 25, dx: 1, dy: -.25, len: 175, w: 27, t: .45, warn: 1 });
          gridBuild(G.enemies);
          const w = G.p.weapons.find(w => w.id === id);
          if (!w) throw Error('Missing warrior weapon ' + id);
          if (id === 'slam' || id === 'beam') w.c44 = 2;
          if (id === 'cleave') WEAPON_FIRE[id](w, wStats(w));
          else fuseFire44(w, wStats(w));
          if (id === 'trap') { G.p.x = -38; G.p.y = 26; }
          for (let tick = 0; tick < elapsed; tick++) {
            const dt = 1 / 120;
            G.time += dt;
            updateMisc(dt);
            updateArsenal(dt);
            fuseTick44(dt);
            updateProjectiles(dt);
            for (const task of G.later) {
              task.t -= dt;
              if (task.t <= 0) { task.done = true; task.f(); }
            }
            G.later = G.later.filter(task => !task.done);
          }
        };
      });
      for (const id of ids) {
        await page.evaluate(id => {
          const frames = { cleave: [2, 8], shield: [2, 23], slam: [2, 13], arrow: [2, 9], trap: [10, 49], shuriken: [3, 10], fireball: [2, 12], icering: [3, 32], orb: [2, 14], beam: [3, 25] };
          const capture = { cleave: 7, shield: 7, slam: 8, arrow: 9, trap: 40, shuriken: 10, fireball: 8, icering: 12, orb: 14, beam: 12 };
          const canvas = document.createElement('canvas');
          canvas.width = 420; canvas.height = 420;
          const c = canvas.getContext('2d'), img = WARRIOR_ART.images[id];
          c.translate(210, 210);
          const frame = elapsed => {
            warriorScene(id, elapsed, true);
            const before = JSON.stringify(G), save = JSON.stringify(localStorage);
            let drawCalls = 0;
            c.clearRect(-210, -210, 420, 420);
            const drawImage = c.drawImage;
            c.drawImage = function (image, ...args) {
              if (image === img) drawCalls++;
              return drawImage.call(this, image, ...args);
            };
            drawWarriorArtWorld(c, () => true);
            c.drawImage = drawImage;
            if (!drawCalls || JSON.stringify(G) !== before || JSON.stringify(localStorage) !== save) throw Error('Missing or stateful drawing: ' + id);
            return canvas.toDataURL();
          };
          const [early, later] = frames[id];
          if (frame(early) === frame(later)) throw Error('Static attack: ' + id);
          const warnings = [];
          const bossGround = drawBossGround, warriorWorld = drawWarriorArtWorld;
          drawBossGround = (...args) => { warnings.push('warning'); return bossGround(...args); };
          drawWarriorArtWorld = (...args) => { warnings.push('warrior'); return warriorWorld(...args); };
          render();
          drawBossGround = bossGround;
          drawWarriorArtWorld = warriorWorld;
          if (warnings.join(',') !== 'warrior,warning') throw Error('Warrior art overlays enemy warning');
          if (window.__errShown) throw Error('Game render reported an error');
          warriorScene(id, capture[id], id === 'beam');
          G.toasts.length = 0;
          render();
        }, id);
        await page.screenshot({ path: path.join(output, width + '-' + id + '.png') });
        await page.evaluate(id => {
          const img = WARRIOR_ART.images[id];
          delete WARRIOR_ART.images[id];
          const canvas = document.createElement('canvas');
          canvas.width = 420; canvas.height = 420;
          const c = canvas.getContext('2d');
          c.translate(210, 210);
          const blank = canvas.toDataURL();
          if (id === 'shield') warriorScene(id, 23, false);
          const inView = () => true;
          drawWarriorArtWorld(c, inView);
          if (canvas.toDataURL() !== blank) throw Error('Missing image did not disable the new layer: ' + id);
          const legacy = () => {
            c.clearRect(-210, -210, 420, 420);
            drawJobAura(c);
            drawWeapons(c, inView);
            drawFx(c);
            return canvas.toDataURL();
          };
          const fallback = legacy();
          WARRIOR_ART.images[id] = img;
          if (fallback === legacy()) throw Error('Missing legacy fallback: ' + id);
        }, id);
      }
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.evaluate(() => {
        warriorScene('arrow', 5, false);
        if (!VFX.reduced.matches || G.proj.filter(p => p.src === 'fu_warrior_arrow').length !== 2) {
          throw Error('Reduced motion or max-fury double spear missing');
        }
        render();
        if (window.__errShown) throw Error('Reduced-motion render reported an error');
      });
      assert.deepEqual(errors, []);
      await page.close();
      console.log(width + 'px: base greatsword plus nine fusion attacks, distinct phases, fallback, warning order, reduced motion');
    }
  } finally {
    if (browser) await browser.close();
    server.close();
  }
}
check().catch(error => { console.error(error); process.exitCode = 1; });
