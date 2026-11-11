const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'dev', 'art42');
const icon = '[data-trait-icon]';
const live = process.env.TRAIT_ICONS_URL;
const report = { checks: [], pageErrors: [] };

function gameplaySnapshot() {
  const originalRandom = Math.random;
  const save = localStorage.getItem(CFG.SAVE_KEY);
  let seed = 71, calls = 0;
  Math.random = () => { calls++; seed = seed * 16807 % 2147483647; return seed / 2147483647; };
  try {
    newRun();
    STATE.mode = 'select';
    STATE.dev.auto = false;
    G.sel = { kind: 'level' };
    const traits = TRAIT_ORDER.map(id => {
      const card = { t: 'trait', id };
      const before = traitCands([]).map(candidate => candidate.id);
      const info = cardInfo(card);
      applyCard(card);
      const after = traitCands([]).map(candidate => candidate.id);
      const node = document.createElement('div');
      node.innerHTML = abilityHTML();
      node.querySelectorAll('.ic').forEach(element => element.remove());
      return { id, before, after, info, ability: node.innerHTML };
    });
    return JSON.parse(JSON.stringify({
      traits, player: G.p, stats: G.stats, rerolls: G.rerolls, banishes: G.banishes,
      calls, savePreserved: save === localStorage.getItem(CFG.SAVE_KEY)
    }));
  } finally {
    Math.random = originalRandom;
  }
}

async function checkIcons(page, expected) {
  const icons = page.locator(icon);
  assert.deepEqual(await icons.evaluateAll(images => images.map(image => image.dataset.traitIcon)), expected);
  const sizes = await icons.evaluateAll(images => Promise.all(images.map(async image => {
    await image.decode();
    if (!image.previousElementSibling.hidden || image.naturalWidth !== 48) throw Error('Invalid icon or fallback');
    return image.getBoundingClientRect().width;
  })));
  assert.ok(sizes.every(size => size >= 24 && size <= 48));
  assert.ok(await page.evaluate(() => UI.scrollWidth <= innerWidth + 1));
}

async function run() {
  fs.mkdirSync(out, { recursive: true });
  const baseline = path.join(out, 'trait-baseline.html');
  fs.writeFileSync(baseline, execFileSync('git', ['show', '2118d47:index.html'], { cwd: root, maxBuffer: 8 * 1024 * 1024 }));
  const browser = await chromium.launch({ executablePath: process.env.ART2_CHROMIUM_PATH });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    page.on('pageerror', error => report.pageErrors.push(error.message));
    const url = live || pathToFileURL(path.join(root, 'index.html')).href;
    const old = await browser.newPage();
    await old.goto(pathToFileURL(baseline).href);
    await page.goto(url);
    const current = await page.evaluate(gameplaySnapshot);
    assert.equal(current.savePreserved, true);
    assert.deepEqual(current, await old.evaluate(gameplaySnapshot));
    await old.close();
    report.checks.push('All 20 traits match art5 for candidate eligibility and order, effects, ability text, state, save and RNG.');

    await page.reload();
    const ids = await page.evaluate(() => [...TRAIT_ORDER]);
    assert.equal(await page.evaluate(() => CFG.VERSION), '0.42-art6');
    assert.equal(ids.length, 20);
    assert.equal(await page.evaluate(() => new Set(TRAIT_ORDER.map(id => uiIcon('trait_'+id))).size), 20);
    assert.deepEqual(await page.evaluate(() => Object.keys(UI_TRAIT_ART)), ids);
    report.checks.push('Exactly 20 unique embedded icons follow existing trait IDs and order.');

    for (const width of [320, 390, 690]) {
      await page.setViewportSize({ width, height: width === 690 ? 829 : 844 });
      await page.reload();
      await page.locator('#codex').click();
      await page.locator('[data-tab="p"]').click();
      await checkIcons(page, ids);
      const codex = await page.locator(icon).evaluateAll(images => images.map(image => {
        const card = image.closest('.cx');
        return [card.querySelector('b').textContent, card.querySelector('p').textContent];
      }));
      assert.deepEqual(codex, current.traits.map(trait => [trait.info.nm, trait.info.ds]));

      await page.evaluate(ids => {
        newRun();
        G.pendingStart = false;
        STATE.dev.auto = false;
        STATE.mode = 'select';
        G.p.tr = Object.fromEntries(TRAIT_ORDER.map(id => [id, 1]));
        G.sel = { kind: 'level', cards: ids.map(id => ({ t: 'trait', id })) };
        renderSelect();
      }, ids.slice(0, 3));
      await checkIcons(page, ids.slice(0, 3));
      if (width === 390) await page.screenshot({ path: path.join(out, 'trait-choice-390.png'), animations: 'disabled' });
      await page.locator('#abtn').click();
      await checkIcons(page, ids);
      if (width === 390) await page.screenshot({ path: path.join(out, 'trait-ability-390.png'), animations: 'disabled' });

      await page.evaluate(() => { STATE.mode = 'play'; pauseGame(); });
      await page.locator('#pabil').click();
      await checkIcons(page, ids);
      report.checks.push('Codex, level-up cards, selection abilities and paused abilities load with no horizontal overflow at '+width+'px.');
    }

    await page.locator(icon).evaluateAll(images => images.forEach(image => { image.src = 'data:image/svg+xml,broken'; }));
    await page.waitForFunction(selector => [...document.querySelectorAll(selector)].every(image =>
      image.hidden && !image.previousElementSibling.hidden &&
      getComputedStyle(image.previousElementSibling).display !== 'none'), icon);
    assert.deepEqual(await page.locator(icon).evaluateAll(images => images.map(image => image.previousElementSibling.textContent)),
      await page.evaluate(() => TRAIT_ORDER.map(id => TRAITS[id].ic)));
    report.checks.push('A failed decode restores each original Korean glyph.');

    await page.evaluate(() => {
      G.p.tr = {};
      G.pendingLv = 0;
      SETTINGS.confirm2 = true;
      STATE.mode = 'select';
      G.sel = { kind: 'level', cards: [{ t: 'trait', id: 'luck' }] };
      renderSelect();
    });
    const rerolls = await page.evaluate(() => G.rerolls);
    await page.locator('.card').click();
    assert.equal(await page.evaluate(() => !!G.p.tr.luck), false);
    await page.locator('.card').click();
    assert.deepEqual(await page.evaluate(() => [G.p.tr.luck, G.rerolls]), [1, rerolls + 1]);
    report.checks.push('Actual two-click selection still grants the existing Luck effect.');

    await page.setViewportSize({ width: 640, height: 380 });
    await page.evaluate(() => {
      const sheet = document.createElement('div');
      sheet.id = 'trait-sheet';
      sheet.style = 'position:fixed;inset:0;background:#26313e;color:#f3e5c6;z-index:9999;padding:12px;display:grid;grid-template-columns:repeat(5,1fr);text-align:center;font:13px system-ui';
      sheet.innerHTML = TRAIT_ORDER.map(id => {
        const src = uiIcon('trait_'+id);
        return `<div><img width="48" height="48" src="${src}"><img width="24" height="24" src="${src}"><br>${esc(TRAITS[id].nm)}</div>`;
      }).join('');
      document.body.append(sheet);
    });
    await page.locator('#trait-sheet img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
    await page.screenshot({ path: path.join(out, 'trait-sheet.png') });
    assert.deepEqual(report.pageErrors, []);
    report.checks.push('48px and 24px comparison sheet captured with zero page errors.');
  } finally {
    await browser.close();
    fs.writeFileSync(path.join(root, 'dev', live ? 'trait-icons-live-validation.json' : 'trait-icons-validation.json'),
      JSON.stringify(report, null, 2)+'\n');
  }
  console.log(JSON.stringify(report));
}

run().catch(error => { console.error(error); process.exitCode = 1; });
