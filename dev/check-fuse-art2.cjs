const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');

async function check() {
  const output = process.env.FUSE_ART_OUTPUT || path.join(os.tmpdir(), 'fuse-art2-captures');
  fs.mkdirSync(output, { recursive: true });
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (/^\/fonts\/[a-zA-Z0-9_.-]+\.woff2$/.test(url.pathname)) {
      res.setHeader('Content-Type', 'font/woff2');
      return fs.createReadStream(path.join(root, url.pathname)).on('error', () => res.end()).pipe(res);
    }
    if (url.pathname !== '/') return res.writeHead(204).end();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(fs.readFileSync(path.join(root, 'index.html')));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.ART2_CHROMIUM_PATH });
    const url = process.env.FUSE_ART_URL || 'http://127.0.0.1:' + server.address().port;
    for (const width of [320, 390]) {
      const page = await browser.newPage({ viewport: { width, height: width === 320 ? 700 : 844 }, isMobile: true, hasTouch: true });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      await page.goto(url);
      await page.waitForFunction(() => typeof FUSE_ART !== 'undefined' && Object.keys(FUSE_ART.images).length === 10);
      const jobs = await page.evaluate(() => {
        if (CFG.VERSION !== '0.46-art2') throw Error(CFG.VERSION);
        window.setupFuseArtCheck = (job, fallback) => {
          newRun();
          G.pendingStart = false; G.storyOn = true;
          STATE.dev.auto = false; STATE.dev.speed = 0; STATE.dev.fps = false; SETTINGS.confirm2 = true;
          G.p.weapons = [];
          applyJob(job);
          const ids = W43.filter(id => id !== baseW().id);
          for (const id of ids.slice(0, 2)) addWeapon(id);
          const [other, weapon] = slotWs();
          other.lvl = 1;
          for (const w of [baseW(), weapon]) {
            w.lvl = 5;
            if (AWAKEN[w.id]) w.aw = AWAKEN[w.id][0].k;
          }
          for (let i = 0; i < 22; i++) {
            const a = i * 2.4, r = 50 + i % 4 * 28;
            makeEnemy(ENEMY_ORDER[i % 4], Math.cos(a) * r, Math.sin(a) * r);
          }
          G.pendingLv = 1;
          openSelect();
          if (G.sel.cards[0]?.t !== 'fuse' || G.sel.cards[0].id !== weapon.id) throw Error('Expected fusion candidate');
          window.fuseArtCheck = { job, other, weapon, fx: G.fx.length, later: G.later.length, image: FUSE_ART.images[job] };
          if (fallback) delete FUSE_ART.images[job];
        };
        return JOB_ORDER;
      });
      const confirm = async (job, fallback = false) => {
        await page.evaluate(([job, fallback]) => setupFuseArtCheck(job, fallback), [job, fallback]);
        const card = page.locator('.card[data-i="0"]');
        await card.click();
        assert.equal(await page.evaluate(() => !!fuseArtCheck.weapon.fu), false);
        await card.click();
      };
      for (const job of jobs) {
        await confirm(job);
        await page.evaluate(() => {
          const { job, other, weapon } = fuseArtCheck;
          const moment = fuseArtForSlot(weapon);
          if (STATE.mode !== 'play' || weapon.fu?.job !== job || !moment || fuseArtForSlot(other)) throw Error('Wrong weapon slot: ' + job);
          const target = document.createElement('canvas');
          target.width = VIEW.cw; target.height = VIEW.ch;
          const c = target.getContext('2d');
          const r = hudLayout().tile(1, 0);
          const worlds = [], slots = [];
          for (const t of [.18, .5, .79, 1.01]) {
            G.time = moment.time + t * FUSE_ART.duration;
            const before = JSON.stringify(G), saved = JSON.stringify(localStorage);
            c.clearRect(0, 0, target.width, target.height);
            c.save(); c.translate(VIEW.cw / 2, VIEW.ch / 2); drawFuseArtWorld(c); c.restore();
            worlds.push(target.toDataURL());
            c.clearRect(0, 0, target.width, target.height);
            drawFuseArtSlot(c, r, moment, t);
            slots.push(target.toDataURL());
            const px = c.getImageData(0, 0, target.width, target.height).data;
            for (let y = 0; y < target.height; y++) for (let x = 0; x < target.width; x++) {
              const inSlot = x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
              if (!inSlot && px[(y * target.width + x) * 4 + 3]) throw Error('Slot overflow: ' + job);
            }
            if (JSON.stringify(G) !== before || JSON.stringify(localStorage) !== saved) throw Error('Render mutated game or save state: ' + job);
          }
          c.clearRect(0, 0, target.width, target.height);
          const blank = target.toDataURL();
          for (const frames of [worlds, slots]) {
            if (new Set(frames).size !== 4 || frames[3] !== blank) throw Error('Missing animation phases or fade: ' + job);
          }
          G.time = moment.time + .49 * FUSE_ART.duration;
          render();
        });
        await page.screenshot({ path: path.join(output, width + '-' + job + '.png') });
        await confirm(job, true);
        await page.evaluate(() => {
          const { job, weapon, fx, later, image } = fuseArtCheck;
          if (weapon.fu?.job !== job || fuseArtForSlot(weapon) || (G.fx.length <= fx && G.later.length <= later)) {
            throw Error('Fallback missing: ' + job);
          }
          FUSE_ART.images[job] = image;
        });
      }
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await confirm('warrior');
      await page.evaluate(() => {
        const moment = fuseArtForSlot(fuseArtCheck.weapon);
        G.time = moment.time + .4;
        const c = document.createElement('canvas').getContext('2d');
        const blank = c.canvas.toDataURL();
        c.translate(120, 90);
        drawFuseArtWorld(c);
        if (c.canvas.toDataURL() !== blank) throw Error('World animation under reduced motion');
        c.resetTransform();
        drawFuseArtSlot(c, { x: 2, y: 2, w: 24, h: 24 }, moment, fuseArtProgress(moment));
        if (c.canvas.toDataURL() === blank) throw Error('Missing reduced-motion slot cue');
      });
      assert.deepEqual(errors.filter(e => !e.includes('Failed to decode downloaded font') && !e.includes('OTS parsing error')), []);
      console.log(width + 'px: all ten selection animations, stage differences, clipping, fallback and reduced motion passed');
      await page.close();
    }
  } finally {
    if (browser) await browser.close();
    server.close();
  }
}
check().catch(error => { console.error(error); process.exitCode = 1; });
