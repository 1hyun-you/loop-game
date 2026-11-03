// 가상 시험 (본 제작 기본형, 초안 가상 시험 v2 구조 재사용)
// 가상 시계로 실제 주 반복·그리기·결과 화면·다시 시작 흐름·저장 누적을 실행
// 사용: node dev/vtest.js <판 수> [--speed 8] [--cap 600] [--render 2] [--out dev/sim_log/runs_0.2.jsonl]
// 0.2 확장: 레벨업 선택 화면 흐름(자동 선택) 통과, 선택 이력·최종 구성·무기별 피해 비중 기록
// 0.7 확장: 분기·유물·엘리트·보물 상자·전직·2차 전직·궁극기 기록
// 0.22 확장: --dmgnum(피해 숫자 설정 켬)
// 0.12 확장: --demon final|retry|mix (판 구조 지정, 마왕전 기록 demon·runType)
// 0.11 확장: 수문장전 기록(gate·gk), --rotate(판마다 수문장 4인 순환 지정)
// 0.13 확장: 대사창(talk) 자동 넘김 통과·진엔딩 화면 경유, 기록 조각·서사 상태·점수 기록, --preset release|post(저장 상태 주입), --tier n·--cond a,b (도전 옵션)
// 0.4 확장: 시작 화면·일시정지(정지 확인·계속)·결과 화면 처음 화면 경유 흐름 점검, --god(무적 완주 시간 판독), --port(동시 실행)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const PRESET = opt('preset', null), TIER = +opt('tier', 0), COND = opt('cond', ''); 
const N = +(args[0] || 10), SPEED = +opt('speed', 8), CAP = +opt('cap', 1800), REN_EVERY = +opt('render', 2), GOD = args.includes('--god'), ROT = args.includes('--rotate'), DEMON = opt('demon', null), OFF = +opt('off', 0), PORT = +opt('port', 48232);
const ROOT = path.resolve(__dirname, '..');
const OUT = path.resolve(ROOT, opt('out', 'dev/sim_log/runs.jsonl'));
fs.mkdirSync(path.dirname(OUT), { recursive: true });
// 게시 환경과 같은 문서 골격으로 감싸서 제공 (http 주소: 저장 유지)
// 0.4a부터 index.html 자체에 문서 골격 포함 → 그대로 제공, 설치 정보 파일·아이콘은 실제 파일 제공
const page = () => fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const MIME = { '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.woff2': 'font/woff2' };
const SERVER = http.createServer((q, s) => {
  const u = decodeURIComponent((q.url || '/').split('?')[0]), ext = path.extname(u), f = path.join(ROOT, u);
  if (MIME[ext] && f.startsWith(ROOT) && fs.existsSync(f)) { s.setHeader('content-type', MIME[ext]); return s.end(fs.readFileSync(f)); }
  s.setHeader('content-type', 'text/html; charset=utf-8'); s.end(page());
});

const INIT = () => {
  const realNow = performance.now.bind(performance);
  const VT = { now: 0, seq: 1, timers: new Map(), raf: null, realNow, errs: [] };
  window.__VT = VT;
  performance.now = () => VT.now;
  window.setTimeout = (fn, ms, ...a) => { const id = VT.seq++; VT.timers.set(id, { t: VT.now + Math.max(0, +ms || 0), fn, a, rep: 0 }); return id; };
  window.setInterval = (fn, ms, ...a) => { const id = VT.seq++; const r = Math.max(1, +ms || 1); VT.timers.set(id, { t: VT.now + r, fn, a, rep: r }); return id; };
  window.clearTimeout = window.clearInterval = id => VT.timers.delete(id);
  window.requestAnimationFrame = fn => { VT.raf = fn; return 1; };
  window.__onErr = e => VT.errs.push({ m: String(e && e.message).slice(0, 160), s: String(e && e.stack || '').split('\n').slice(0, 3).join(' | ').slice(0, 300) });
  VT.fire = () => {
    for (let g = 0; g < 200; g++) {
      let best = null, bid = 0;
      for (const [id, t] of VT.timers) if (t.t <= VT.now && (!best || t.t < best.t)) { best = t; bid = id; }
      if (!best) return;
      if (best.rep) best.t += best.rep; else VT.timers.delete(bid);
      try { best.fn(...best.a); } catch (e) { VT.errs.push({ m: 'timer: ' + (e && e.message) }); }
    }
  };
};

const RUN_ONE = ({ cap, speed, renEvery, idx, god, rot, demon }) => {
  const VT = window.__VT, H = window.__H || (window.__H = { hooked: false });
  if (!H.hooked) {
    H.hooked = true;
    const st = window.step; window.step = dt => { const a = VT.realNow(); st(dt); H.stepMs += VT.realNow() - a; H.steps++; };
    const rn = window.render; window.render = () => { if (H.rc++ % H.renEvery) return; const a = VT.realNow(); rn(); H.renMs += VT.realNow() - a; H.renders++; };
  }
  Object.assign(H, { rc: 0, renEvery, stepMs: 0, steps: 0, renMs: 0, renders: 0, flow: [] });
  const wall0 = VT.realNow();
  const tick = () => { VT.now += 1000 / 60; VT.fire(); const cb = VT.raf; VT.raf = null; if (cb) cb(VT.now); else H.flow.push('raf_lost'); };
  const click = (id, tag) => { const b = document.getElementById(id); if (b) b.click(); else H.flow.push('no_btn_' + (tag || id)); };
  STATE.dev.demon = demon === 'mix' ? (idx % 2 ? 'retry' : 'final') : demon || null;   // 0.12 판 구조 지정 (새 판 생성 전)
  if (rot) STATE.dev.gk = GK_ORDER[idx % 4];
  // 결과 화면: 3판마다 '처음 화면' 경유, 나머지는 '다시 시작' (화면 흐름 점검)
  if (STATE.mode === 'result') { if (idx % 3 === 2) { click('home'); if (STATE.mode !== 'title') H.flow.push('home_not_title'); } else click('again'); }
  if (STATE.mode === 'title') click('start');
  if (STATE.mode !== 'play') H.flow.push('not_play_after_restart');
  if (STATE.dev.demon && G.runType !== STATE.dev.demon) newRun();   // 시작 화면 배경 판은 지정 전 생성 → 재생성 (0.12)
  STATE.dev.auto = true; STATE.dev.speed = speed; STATE.dev.god = !!god;
  if (rot && G.gk) G.gk = STATE.dev.gk;
  const pauseAt = 30 + Math.random() * 60; let paused = false;
  const runG = G; let frames = 0, lastGT = -1, still = 0, selFrames = 0, selN = 0, wasSel = false;
  let talkN = 0, wasTalk = false;
  while ((STATE.mode === 'play' || STATE.mode === 'select' || STATE.mode === 'talk') && G === runG && !runG.finished) {
    tick(); frames++;
    if (STATE.mode === 'select') {
      if (!wasSel) { selN++; selFrames = 0; if (!document.querySelector('.card')) H.flow.push('no_cards'); }
      wasSel = true; if (++selFrames === 60 * 20) H.flow.push('select_stuck');
      if (selFrames > 60 * 30) break;
      continue;
    }
    wasSel = false;
    if (STATE.mode === 'talk') { if (!wasTalk) talkN++; wasTalk = true; if (!document.getElementById('dlg')) H.flow.push('no_dlg'); continue; }
    wasTalk = false;
    // 일시정지 점검: 버튼 표시 → 정지 중 시간 고정 → 계속
    if (!paused && G.time > pauseAt && STATE.mode === 'play') {
      paused = true;
      if (document.getElementById('pausebtn').style.display === 'none') H.flow.push('pausebtn_hidden');
      click('pausebtn'); if (STATE.mode !== 'pause') H.flow.push('pause_fail');
      const t0 = G.time; for (let i = 0; i < 30; i++) tick(); if (G.time !== t0) H.flow.push('time_moves_in_pause');
      click('resume'); if (STATE.mode !== 'play') H.flow.push('resume_fail');
    }
    if (G.time === lastGT) { if (++still === 600) H.flow.push('time_frozen'); } else still = 0; lastGT = G.time;
    if (G.time > cap && !G.result) { H.flow.push('cap'); G.result = 'cap'; G.endT = 0; }
    if (frames > 60 * 60 * 30) { H.flow.push('frame_cap'); break; }
  }
  // 판 종료 대사·진엔딩 화면 경유 후 결과 화면 (0.13)
  let ended = false;
  for (let i = 0; i < 60 * 60 && !(STATE.mode === 'result' && document.getElementById('again')); i++) {
    tick(); const en = document.getElementById('endnext'); if (en) { ended = true; en.click(); }
  }
  for (let i = 0; i < 5; i++) tick();   // 결과 화면 표시 확인
  if (STATE.mode !== 'result') H.flow.push('no_result_screen@' + STATE.mode);
  let save = null; try { save = JSON.parse(localStorage.getItem(CFG.SAVE_KEY)); } catch (e) { }
  const R = runG.report || {};
  return {
    v: CFG.VERSION, god: !!god, result: R.result, time: R.time, level: R.level, kills: R.kills, lastHit: R.lastHit, dmg: R.dmgShare, hurt: R.hurt, maxEn: R.maxEnemies,
    levelAt: R.levelAt, selects: R.selOpen, pendingLv: R.pendingLv, lastMin: R.lastMinShare, xp: R.xp, build: R.build, picks: R.picks, wFullAt: R.wFullAt, phases: R.phases, phaseReached: R.phaseReached, phaseAt: R.phaseAt, hurt: R.hurt, traits: R.traits, mobs: R.mobs, crisis: R.crisis, start: R.start, pFullAt: R.pFullAt, rerolls: R.rerollsUsed, banish: R.banishUsed, branches: R.branches, relics: R.relics, elites: R.elites, chests: R.chests, chestPicks: R.chestPicks, job: R.job, jobAt: R.jobAt, job2: R.job2, job2At: R.job2At, ults: R.ults, altar: R.altar, passes: R.passes, maxMinions: R.maxMinions, order: R.order, gate: R.gate, gk: R.gk, gates: R.gates, runType: R.runType, demon: R.demon, events: R.events, curses: R.curses, camp: R.camp, saveRuns: save && save.runs, talks: talkN, ending: ended, frags: R.frags, story: R.story, score: R.score, mul: R.mul, opt: R.opt, newTitles: R.newTitles, trueEnd: !!R.trueEnd, ending1: !!R.ending1, errs: VT.errs.splice(0), errShown: !!window.__errShown, flow: H.flow,
    cost: { wallSec: Math.round((VT.realNow() - wall0) / 100) / 10, stepMs: H.steps ? +(H.stepMs / H.steps).toFixed(3) : 0, renMs: H.renders ? +(H.renMs / H.renders).toFixed(2) : 0 },
    diag: { enemiesArr: runG.enemies.length, gems: runG.gems.length, fx: runG.fx.length, dom: document.getElementsByTagName('*').length },
  };
};

(async () => {
  await new Promise(r => SERVER.listen(PORT, '127.0.0.1', r));
  const b = await chromium.launch({ args: ['--disable-gpu', '--num-raster-threads=1'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await ctx.addInitScript(INIT);
  const p = await ctx.newPage();
  const perr = []; p.on('pageerror', e => perr.push(e.message));
  await p.goto(`http://127.0.0.1:${PORT}/`);
  if (PRESET) {   // 저장 상태 주입 후 새로고침 (0.13): release=기록 조각 10개(해제 직전), post=진엔딩 이후
    await p.evaluate(({ pre, tier, cond }) => {
      const all = GK_ORDER.slice(), s = { runs: 0, clears: 10, gates: all, demonTries: 3, demonKills: 1, ending1: 1, intro: 1, metGk: all, metDemon: 1, frags: FRAGS.map(f => f.id) };
      if (pre === 'post') Object.assign(s, { trueEnd: 1, tierMax: 3, titles: ['end'] });
      localStorage.setItem(CFG.SAVE_KEY, JSON.stringify(s));
      localStorage.setItem(CFG.SAVE_KEY + '_run', JSON.stringify({ tier, conds: cond ? cond.split(',') : [] }));
    }, { pre: PRESET, tier: TIER, cond: COND });
    await p.goto(`http://127.0.0.1:${PORT}/`);
  }
  if (args.includes('--dmgnum')) {   // 피해 숫자 켬 상태 부하 점검 (0.22)
    await p.evaluate(() => { const k = CFG.SAVE_KEY + '_set', o = JSON.parse(localStorage.getItem(k) || '{}'); o.dmgNum = true; localStorage.setItem(k, JSON.stringify(o)); });
    await p.goto(`http://127.0.0.1:${PORT}/`);
  }
  let prevRuns = 0;
  for (let i = 0; i < N; i++) {
    let rec;
    try { rec = await p.evaluate(RUN_ONE, { cap: CAP, speed: SPEED, renEvery: REN_EVERY, idx: i + OFF, god: GOD, rot: ROT, demon: DEMON }); }
    catch (e) { rec = { fatal: String(e.message).slice(0, 300) }; await p.goto(`http://127.0.0.1:${PORT}/`); }
    rec.idx = i; rec.pageErr = perr.splice(0);
    if (!rec.fatal) { rec.saveOk = rec.saveRuns === prevRuns + 1; prevRuns = rec.saveRuns || prevRuns; }
    fs.appendFileSync(OUT, JSON.stringify(rec) + '\n');
    console.log(`#${i + 1}/${N} ` + (rec.fatal ? 'FATAL ' + rec.fatal : `${rec.result} ${rec.time}s f${rec.frags} sc${rec.score}${rec.trueEnd ? ' TRUE' : ''} Lv${rec.level} k${rec.kills} maxEn${rec.maxEn} err${rec.errs.length} flow[${rec.flow}] ${rec.cost.wallSec}s`));
  }
  // 새로고침 후 저장 유지 점검
  const before = await p.evaluate(() => localStorage.getItem(CFG.SAVE_KEY));
  await p.goto(`http://127.0.0.1:${PORT}/`);
  const after = await p.evaluate(() => localStorage.getItem(CFG.SAVE_KEY));
  console.log('reloadSave', before === after ? 'ok' : 'FAIL');
  await b.close(); SERVER.close(); console.log('DONE');
})();
