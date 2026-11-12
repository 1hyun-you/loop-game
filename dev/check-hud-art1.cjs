const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = process.env.HUD_ART_OUTPUT || path.join(root, 'dev/hud-art1-captures');

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const server = http.createServer((req, res) => {
    const name = new URL(req.url, 'http://localhost').pathname;
    if (name !== '/' && !name.startsWith('/fonts/')) { res.writeHead(204).end(); return; }
    const file = name === '/' ? 'index.html' : '.' + name;
    res.setHeader('Content-Type', name === '/' ? 'text/html' : 'font/woff2');
    fs.createReadStream(path.join(root, file)).on('error', () => res.end()).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.ART2_CHROMIUM_PATH });
    const url = process.env.HUD_ART_URL || 'http://127.0.0.1:' + server.address().port;
    for (const width of [320, 390]) {
      const page = await browser.newPage({ viewport: { width, height: width === 320 ? 700 : 844 }, isMobile: true, hasTouch: true });
      const errors = [];
      page.on('pageerror', err => errors.push(err.message));
      await page.goto(url);
      await page.waitForFunction(() => typeof CFG !== 'undefined' && !!hudPlates45['boss-plate'] && !!hudPlates45['hud-plate'] &&
        UI_ART.loaded === Object.keys(UI_PATH).length && !!document.documentElement.style.getPropertyValue('--hud-pause-art'));
      await page.evaluate(async () => {
        await document.fonts.load('700 13px Galmuri11');
        if (CFG.VERSION !== '0.46-art1') throw Error(CFG.VERSION);
        newRun();
        G.pendingStart = false; G.storyOn = true;
        G.p.job = 'druid'; G.p.level = 38; G.p.weapons = [];
        for (const id of ['orb','cleave','lightning','icering','fireball']) addWeapon(id);
        G.p.weapons[0].base = true;
        slotWs().slice(0, 2).forEach(w => { w.fu = { job: 'druid', nm: w.id }; });
        G.p.passives = ['vit','magnet','haste','might','regen'].map(id => ({ id, lvl: 3 }));
        recalc(); G.p.hp = 87; G.kills = 12345; G.time = 725;
        G.ph.id = 'surge'; G.ph.i = 3; G.ph.t = 75;
        STATE.dev.fps = false; STATE.dev.speed = 0; STATE.dev.auto = false;
        STATE.mode = 'play'; hideUI(); syncPauseBtn();
      });
      const hud = await page.evaluate(() => {
        const c = document.createElement('canvas').getContext('2d'), calls = [], panels = [];
        const L = hudLayout(), originalText = c.fillText.bind(c), originalImage = c.drawImage.bind(c);
        c.fillText = (text, x, y, max) => {
          const m = c.measureText(text), scale = max ? Math.min(1, max / m.width) : 1;
          calls.push({ text, x1: x - m.actualBoundingBoxLeft * scale, x2: x + m.actualBoundingBoxRight * scale,
            y1: y - m.actualBoundingBoxAscent, y2: y + m.actualBoundingBoxDescent });
          if (max) originalText(text, x, y, max); else originalText(text, x, y);
        };
        c.drawImage = (im, ...args) => { if (im === hudPlates45['hud-plate']) panels.push(args); originalImage(im, ...args); };
        const overlaps = [];
        for (const job of Object.keys(JOBS)) {
          G.p.job = job;
          for (const id of Object.keys(PHASES)) {
            G.ph.id = id;
            const start = JSON.stringify(G);
            calls.length = 0; drawHUD(c);
            if (JSON.stringify(G) !== start) throw Error('HUD mutated game state');
            const top = calls.filter(t => t.y2 < L.y + L.top && t.text.length > 1);
            for (const [i, a] of top.entries()) {
              if (a.x1 < L.x || a.x2 > L.pause.x || a.text.includes('…')) overlaps.push([job,id,a.text,'bounds']);
              for (const b of top.slice(i + 1)) {
                if (a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2) overlaps.push([job,id,a.text,b.text]);
              }
            }
          }
        }
        G.p.job = 'druid'; G.ph.id = 'surge';
        const pause = PBTN.getBoundingClientRect();
        return { overlaps, panel: panels[0], pause: [pause.x, pause.y, pause.width, pause.height], expected: [L.pause.x,L.pause.y,L.pause.w,L.pause.h] };
      });
      await page.screenshot({ path: path.join(output, 'hud-' + width + '.png') });
      await page.locator('#pausebtn').click();
      assert.equal(await page.evaluate(() => STATE.mode), 'pause');
      await page.evaluate(() => {
        resumeGame();
        slotWs().forEach(w => { w.fu = { job: G.p.job, nm: w.id }; });
        if (!baseRetired()) throw Error('retired base fixture failed');
        G.ph.id = 'demon'; G.gkMob = { gk:'demon', hp:640, maxHp:1000, st:1, dead:false };
      });
      await page.waitForFunction(() => H45.k === 1);
      await page.screenshot({ path: path.join(output, 'boss-' + width + '.png') });
      await page.evaluate(() => {
        G.gkMob = null; G.ph.id = 'surge';
        STATE.mode = 'select';
        G.sel = { kind:'level', cards:[{t:'fuse', id:'cleave'}, {t:'wup', id:'orb'}, {t:'wup', id:'fireball'}] };
        renderSelect();
      });
      await page.locator('.k-fuse img[data-job-crest]').evaluate(img => img.decode());
      const card = await page.locator('.k-fuse').evaluate(e => {
        const r = e.getBoundingClientRect(), crest = e.querySelector('.fuse-corner').getBoundingClientRect();
        const text = e.querySelector('.choice-copy-head'), range = document.createRange();
        range.selectNodeContents(text);
        return {
          border: getComputedStyle(e).borderTopStyle, width: getComputedStyle(e).borderTopWidth,
          pulse: getComputedStyle(e,'::after').animationName,
          fits: r.left >= 0 && r.right <= innerWidth && [...range.getClientRects()].every(box => box.right <= crest.left || box.top >= crest.bottom)
        };
      });
      await page.screenshot({ path: path.join(output, 'card-' + width + '.png') });
      assert.deepEqual(card, { border:'solid', width:'2px', pulse:'choiceFuseGlow', fits:true });
      await page.emulateMedia({ reducedMotion:'reduce' });
      assert.equal(await page.locator('.k-fuse').evaluate(e => getComputedStyle(e,'::after').animationName), 'none');
      await page.locator('.k-fuse img[data-job-crest]').evaluate(img => { img.src = 'data:image/svg+xml,broken'; });
      await page.locator('.fuse-corner .job-crest span').waitFor({ state: 'visible' });
      const fallback = await page.evaluate(() => {
        const c = document.createElement('canvas').getContext('2d');
        const main = hudPlates45['hud-plate']; delete hudPlates45['hud-plate'];
        hudPlate45(c,'hud-plate',2,2,90,44,'#223344','#665544',8);
        hudPlates45['hud-plate'] = main;
        return c.getImageData(30,20,1,1).data[3] > 0;
      });
      assert.equal(fallback, true);
      assert.deepEqual(hud.pause, hud.expected);
      assert.deepEqual(errors, []);
      assert.equal(await page.evaluate(() => !!window.__errShown), false);
      console.log(JSON.stringify({ width, hud, card, errors }));
      assert.deepEqual(hud.overlaps, []);
      await page.close();
    }
  } finally {
    await browser?.close();
    server.close();
  }
})().catch(err => { console.error(err); process.exitCode = 1; });
