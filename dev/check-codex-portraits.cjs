const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'dev', 'art42');
const baseline = path.join(out, 'portraits-baseline.html');
const pane = '[data-pk="e"]';
const portrait = '[data-enemy-portrait]';
const widths = [280, 320, 390, 690];
const live = process.env.CODEX_PORTRAITS_URL;
const reportName = live ? 'codex-portraits-live' : 'codex-portraits';
const report = { checks: [], pageErrors: [] };

function codexFixtures() {
  const cases = [
    { s: {}, seenE: new Set() },
    { s: { metGk: [GK_ORDER[0]], gates: [GK_ORDER[1]], demonTries: 1 }, seenE: new Set(ENEMY_ORDER.slice(0, 3)) },
    { s: { metGk: GK_ORDER, metDemon: 1 }, seenE: new Set(ENEMY_ORDER) },
  ];
  return cases.map(state => {
    const node = document.createElement('div');
    node.innerHTML = cxEnemies(state);
    node.querySelectorAll('.ic').forEach(icon => icon.remove());
    return node.innerHTML;
  });
}

async function run() {
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(baseline, execFileSync('git', ['show', 'aa2c307:index.html'], { cwd: root, maxBuffer: 8 * 1024 * 1024 }));
  const browser = await chromium.launch({ executablePath: process.env.ART2_CHROMIUM_PATH });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    page.on('pageerror', error => report.pageErrors.push(error.message));
    await page.goto(live || pathToFileURL(path.join(root, 'index.html')).href);
    const old = await browser.newPage();
    await old.goto(pathToFileURL(baseline).href);
    assert.deepEqual(await page.evaluate(codexFixtures), await old.evaluate(codexFixtures));
    report.checks.push('Enemy card text, order and lock classes match art4 across empty, legacy and complete records.');
    await old.close();

    await page.locator('#codex').click();
    await page.locator('[data-tab="e"]').click();
    assert.equal(await page.locator(pane + ' .cx.lock').count(), 15);
    assert.equal(await page.locator(portrait).count(), 0);
    assert.deepEqual(await page.locator(pane + ' .cx.lock .ic').allTextContents(), Array(15).fill('?'));
    report.checks.push('Actual title-to-codex navigation shows question marks for all unseen entries.');

    const state = await page.evaluate(() => {
      const ids = [...ENEMY_ORDER, ...GK_ORDER, 'demon'];
      const save = JSON.stringify({ seenE: ENEMY_ORDER, metGk: GK_ORDER.slice(0, 2), gates: GK_ORDER.slice(2), demonTries: 1 });
      localStorage.setItem(CFG.SAVE_KEY, save);
      saveCache = null;
      const before = JSON.stringify({ game: G, state: STATE });
      const originalRandom = Math.random;
      let calls = 0;
      Math.random = () => { calls++; return originalRandom(); };
      try {
        showCodex('e', () => {});
        return {
          ids, calls, validSave: save === localStorage.getItem(CFG.SAVE_KEY),
          validState: before === JSON.stringify({ game: G, state: STATE }),
          exactAssets: ids.every(id => CODEX_PORTRAITS[id]) && Object.keys(CODEX_PORTRAITS).length === 15,
          distinctAssets: new Set(Object.values(CODEX_PORTRAITS)).size
        };
      } finally {
        Math.random = originalRandom;
      }
    });
    assert.equal(state.ids.length, 15);
    assert.equal(state.calls, 0);
    assert.ok(state.validSave && state.validState && state.exactAssets);
    assert.equal(state.distinctAssets, 15);
    report.checks.push('All 15 unique assets map to game IDs. Rendering preserves existing save, state and RNG.');

    const images = page.locator(pane + ' ' + portrait);
    assert.equal(await page.locator(portrait).count(), 15);
    await images.evaluateAll(elements => Promise.all(elements.map(image => image.decode())));
    assert.deepEqual(await images.evaluateAll(elements => elements.map(image => image.dataset.enemyPortrait)), state.ids);
    const renderedSources = await images.evaluateAll(elements => elements.map(image => image.src));
    assert.deepEqual(renderedSources, state.ids.map(id => {
      const bytes = fs.readFileSync(path.join(root, 'assets', 'codex-portraits', id + '.webp'));
      return 'data:image/webp;base64,' + bytes.toString('base64');
    }));
    report.checks.push('Embedded bytes match every optimized source file.');
    assert.equal(await page.locator(pane + ' .cx .ic').nth(10).textContent(), '정');
    for (const width of widths) {
      await page.setViewportSize({ width, height: 844 });
      assert.ok(await images.evaluateAll(elements => elements.every(image =>
        image.naturalWidth === 96 && image.naturalHeight === 96 &&
        image.getBoundingClientRect().width === 40 && image.previousElementSibling.hidden &&
        image.src.startsWith('data:image/webp;base64,') && image.alt === '')));
      assert.ok(await page.locator(pane).evaluate(element => element.scrollWidth <= element.clientWidth + 1));
      report.checks.push(`${width}px: 15 portraits decode at 40px, fallback hidden, no horizontal overflow.`);
      if (width === 390) {
        await page.screenshot({ path: path.join(out, reportName + '-mobs.png') });
        await images.last().scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(out, reportName + '-bosses.png') });
      }
    }

    await images.evaluateAll(elements => {
      for (const image of elements) image.src = 'data:image/webp,broken';
    });
    await page.waitForFunction(() => [...document.querySelectorAll('[data-enemy-portrait]')].every(image =>
      getComputedStyle(image).display === 'none' && getComputedStyle(image.previousElementSibling).display !== 'none' &&
      image.previousElementSibling.textContent === (image.closest('.cx').querySelector('.cxh b').textContent[0])));
    assert.equal(await page.locator(pane + ' .cx.lock').count(), 0);
    report.checks.push('Decode failures restore each original initial without changing unlocks.');
    assert.ok(await page.evaluate(() => {
      const id = ENEMY_ORDER[0], asset = CODEX_PORTRAITS[id];
      const options = { portrait: id, col: ENEMIES[id].color, ic: ENEMIES[id].name[0] };
      try {
        delete CODEX_PORTRAITS[id];
        return cxEnemyPortrait(options) === icBox(options.col, options.ic);
      } finally {
        CODEX_PORTRAITS[id] = asset;
      }
    }));
    report.checks.push('A missing portrait uses the original text badge.');
    assert.deepEqual(report.pageErrors, []);
  } finally {
    await browser.close();
    fs.writeFileSync(path.join(root, 'dev', reportName + '-validation.json'), JSON.stringify(report, null, 2) + '\n');
  }
}

run().then(() => console.log(JSON.stringify(report))).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
