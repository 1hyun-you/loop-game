// 가상 시험 기록 집계 (본 제작 0.2, 초안 vsum.js 구조 재사용)
// 사용: node dev/vsum.js [파일] [--last N]
const fs = require('fs'), path = require('path');
const a = process.argv.slice(2);
const f = path.resolve(__dirname, '..', a[0] && !a[0].startsWith('--') ? a[0] : 'dev/sim_log/runs.jsonl');
const li = a.indexOf('--last');
let rows = fs.readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
if (li >= 0) rows = rows.slice(-+a[li + 1]);
const ok = rows.filter(r => !r.fatal);
const avg = arr => arr.length ? +(arr.reduce((s, x) => s + x, 0) / arr.length).toFixed(1) : null;
const q = (arr, p) => { if (!arr.length) return null; const s = arr.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; };
const cnt = arr => arr.reduce((m, v) => (m[v] = (m[v] || 0) + 1, m), {});
const errs = {}; for (const r of ok) for (const e of r.errs || []) errs[e.m] = (errs[e.m] || 0) + 1;
const flows = {}; for (const r of ok) for (const x of r.flow || []) flows[x] = (flows[x] || 0) + 1;
// 피해 쏠림: 판별 최대 단일 피해원 비중
const topShare = ok.map(r => (r.dmg && r.dmg[0]) ? r.dmg[0][1] : 0);
const dmgAll = {}; for (const r of ok) for (const [k, v] of r.dmg || []) (dmgAll[k] = dmgAll[k] || []).push(v);
const pickMix = cnt(ok.flatMap(r => (r.picks || []).map(p => p.split(':')[1])));
const wPick = cnt(ok.flatMap(r => (r.picks || []).filter(p => p.includes(':wnew:')).map(p => p.split(':')[2])));
const out = {
  runs: rows.length, fatal: rows.length - ok.length,
  result: cnt(ok.map(r => r.result)),
  timeSec: { avg: avg(ok.map(r => r.time)), p10: q(ok.map(r => r.time), .1), p90: q(ok.map(r => r.time), .9) },
  level: { avg: avg(ok.map(r => r.level)), max: q(ok.map(r => r.level), 1) },
  lvAt5min: avg(ok.filter(r => r.time >= 300).map(r => 1 + (r.levelAt || []).filter(t => t <= 300).length)),
  xpRate: avg(ok.filter(r => r.xp).map(r => Math.round(r.xp[0] / Math.max(1, r.xp[1]) * 100))),
  selects: { ok: ok.filter(r => r.selects + r.pendingLv === r.level - 1 && r.picks.length === r.selects).length, mismatch: ok.filter(r => !(r.selects + r.pendingLv === r.level - 1 && r.picks.length === r.selects)).map(r => [r.idx, r.selects, r.pendingLv, r.level, r.picks.length]) },
  build: { weaponsAvg: avg(ok.map(r => r.build.w.length)), passivesAvg: avg(ok.map(r => r.build.p.length)), wFull: ok.filter(r => r.wFullAt != null).length, wFullAtAvg: avg(ok.filter(r => r.wFullAt != null).map(r => r.wFullAt)) },
  lastMinTop: (() => { const t = ok.map(r => r.lastMin && r.lastMin[0] ? r.lastMin[0][1] : 0); return { avg: avg(t), p50: q(t, .5), over35: t.filter(x => x > 35).length, w4plus: avg(ok.filter(r => r.build.w.length >= 4).map(r => r.lastMin[0][1])) }; })(),
  topShare: { avg: avg(topShare), p50: q(topShare, .5), over35: topShare.filter(x => x > 35).length },
  wBalance: (() => { const v = Object.values(dmgAll).map(avg); return { spreadPt: v.length ? +(Math.max(...v) - Math.min(...v)).toFixed(1) : null, target: 20 }; })(),   // 대체 지표: 무기별 보유 시 평균 비중 최대·최소 차(%p)
  dmgShareAvg: Object.fromEntries(Object.entries(dmgAll).map(([k, v]) => [k, avg(v)]).sort((x, y) => y[1] - x[1])),
  pickMix, newWeaponPicks: wPick, rerollsAvg: avg(ok.map(r => r.rerolls || 0)), banishAvg: avg(ok.map(r => r.banish || 0)),
  lastHit: cnt(ok.map(r => r.lastHit)),
  phase: (() => { const P = {}; for (const r of ok) for (const [id, t, o] of r.phases || []) { const x = P[id] = P[id] || { n: 0, t: [], timeout: 0 }; x.n++; x.t.push(t); if (o === 'timeout') x.timeout++; }
    for (const k in P) P[k] = { n: P[k].n, avgSec: avg(P[k].t), timeout: P[k].timeout };
    return { clearRuns: ok.filter(r => r.result === 'clear').length, reachedAvg: avg(ok.map(r => r.phaseReached || 0)), in8to10: ok.filter(r => r.time >= 480 && r.time <= 600).length, byPhase: P }; })(),
  core: (() => { const J = ok.filter(r => r.job), J2 = ok.filter(r => r.job2);   // 2단계 핵심 시스템 (0.7)
    return { jobRuns: J.length, jobs: cnt(J.map(r => r.job)), jobAtAvg: avg(J.map(r => r.jobAt)), job2Runs: J2.length, job2: cnt(J2.map(r => r.job2)), job2AtAvg: avg(J2.map(r => r.job2At)),
      ultsAvgJob: avg(J.map(r => r.ults || 0)), altar: ok.reduce((m, r) => (r.altar || [0, 0, 0, 0]).map((v, i) => m[i] + v), [0, 0, 0, 0]),
      branchesAvg: avg(ok.map(r => (r.branches || []).length)), branchPick: cnt(ok.flatMap(r => r.branches || [])), relicRuns: ok.filter(r => (r.relics || []).length).length, relics: cnt(ok.flatMap(r => r.relics || [])),
      elitesAvg: avg(ok.map(r => (r.elites || [0])[0])), eliteKillAvg: avg(ok.map(r => (r.elites || [0, 0])[1])), chestsAvg: avg(ok.map(r => r.chests || 0)), chestPick: cnt(ok.flatMap(r => (r.chestPicks || []).map(x => x.split(':')[0]))),
      maxMinions: q(ok.map(r => r.maxMinions || 0), 1) }; })(),
  content: (() => { const ev = ok.flatMap(r => r.events || []), E = {};   // 3단계 페이즈 확장·곁가지 사건 (0.10)
    for (const [t, o, s] of ev) { const x = E[t] = E[t] || { n: 0 }; x.n++; x[o] = (x[o] || 0) + 1; }
    return { phasesPerRun: avg(ok.map(r => (r.order || []).length)), eventsPerRun: avg(ok.map(r => (r.events || []).length)), events: E, curses: cnt(ok.flatMap(r => r.curses || [])), camp: cnt(ok.flatMap(r => r.camp || [])),
      in15to18: ok.filter(r => r.time >= 900 && r.time <= 1080).length }; })(),
  errors: errs, pageErr: ok.reduce((s, r) => s + (r.pageErr || []).length, 0), errShownRuns: ok.filter(r => r.errShown).length,
  flow: flows, saveBad: ok.filter(r => !r.saveOk).length,
  perf: { maxEnP90: q(ok.map(r => r.maxEn || 0), .9), stepMsAvg: avg(ok.map(r => r.cost.stepMs)), stepMsMax: q(ok.map(r => r.cost.stepMs), 1), renMsAvg: avg(ok.map(r => r.cost.renMs)), renMsMax: q(ok.map(r => r.cost.renMs), 1) },
};
console.log(JSON.stringify(out, null, 1));
