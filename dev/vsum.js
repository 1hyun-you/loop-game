// 가상 시험 기록 집계 (본 제작 0.2, 초안 vsum.js 구조 재사용)
const bonusLv = r => 3 * (r.events || []).filter(e => e[0] === 'door' && e[1] === 'ok').length + 2 * (r.camp || []).filter(c => c === 'train').length; // 0.11: 레벨 없는 추가 선택 보정
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
// 0.38 피해원 → 무기 단위 통합 (분기·각성·유물 파생 피해원 합산)
const SRC_W = { split: 'arrow', chain: 'lightning', mbolt: 'orb', mbolt_aw: 'orb', mbolt_x: 'orb', nova: 'orb', fireball_pool: 'fireball', fissure: 'slam', shatter: 'icering', icering_x: 'icering', bleed: 'knife', lance_x: 'lance', flail_q: 'flail', bomb_c: 'bomb', bomb_pool: 'bomb', vortex_x: 'vortex' };
const wOf = k => SRC_W[k] || (k.endsWith('_aw') ? k.slice(0, -3) : k);
const wShare = ok.map(r => { const m = {}; for (const [k, v] of r.dmg || []) { const w = wOf(k); m[w] = (m[w] || 0) + v; } return m; });
const wOwnShare = {}; ok.forEach((r, i) => { for (const x of (r.build && r.build.w) || []) { const id = x.split(':')[0]; (wOwnShare[id] = wOwnShare[id] || []).push(wShare[i][id] || 0); } });
const wTop = wShare.map(m => Math.max(0, ...Object.entries(m).filter(([k]) => k !== 'ult').map(([, v]) => v)));
const pickMix = cnt(ok.flatMap(r => (r.picks || []).map(p => p.split(':')[1])));
const wPick = cnt(ok.flatMap(r => (r.picks || []).filter(p => p.includes(':wnew:')).map(p => p.split(':')[2])));
const out = {
  runs: rows.length, fatal: rows.length - ok.length,
  result: cnt(ok.map(r => r.result)),
  timeSec: { avg: avg(ok.map(r => r.time)), p10: q(ok.map(r => r.time), .1), p90: q(ok.map(r => r.time), .9) },
  level: { avg: avg(ok.map(r => r.level)), max: q(ok.map(r => r.level), 1) },
  lvAt5min: avg(ok.filter(r => r.time >= 300).map(r => 1 + (r.levelAt || []).filter(t => t <= 300).length)),
  xpRate: avg(ok.filter(r => r.xp).map(r => Math.round(r.xp[0] / Math.max(1, r.xp[1]) * 100))),
  selects: { ok: ok.filter(r => r.selects + r.pendingLv === r.level - 1 + bonusLv(r) && r.picks.length === r.selects).length, mismatch: ok.filter(r => !(r.selects + r.pendingLv === r.level - 1 + bonusLv(r) && r.picks.length === r.selects)).map(r => [r.idx, r.selects, r.pendingLv, r.level, r.picks.length, bonusLv(r)]) },
  build: { weaponsAvg: avg(ok.map(r => r.build.w.length)), passivesAvg: avg(ok.map(r => r.build.p.length)), wFull: ok.filter(r => r.wFullAt != null).length, wFullAtAvg: avg(ok.filter(r => r.wFullAt != null).map(r => r.wFullAt)) },
  lastMinTop: (() => { const t = ok.map(r => r.lastMin && r.lastMin[0] ? r.lastMin[0][1] : 0); return { avg: avg(t), p50: q(t, .5), over35: t.filter(x => x > 35).length, w4plus: avg(ok.filter(r => r.build.w.length >= 4).map(r => r.lastMin[0][1])) }; })(),
  topShare: { avg: avg(topShare), p50: q(topShare, .5), over35: topShare.filter(x => x > 35).length },
  topShareW4: (() => { const t = ok.filter(r => r.build && r.build.w.length >= 4).map(r => r.dmg && r.dmg[0] ? r.dmg[0][1] : 0); return { runs: t.length, avg: avg(t), over35: t.filter(x => x > 35).length }; })(),   // 0.17 판독 대상: 무기 4개 이상 보유 판 한정
  progress: (() => { const te = ok.findIndex(r => r.trueEnd), e1 = ok.findIndex(r => r.ending1); return { ending1Run: e1 < 0 ? null : e1 + 1, trueEndRun: te < 0 ? null : te + 1, fragsByRun: ok.slice(0, 8).map(r => r.frags) }; })(),   // 0.16 진엔딩 도달 판
  wBalance: (() => { const v = Object.values(dmgAll).map(avg); return { spreadPt: v.length ? +(Math.max(...v) - Math.min(...v)).toFixed(1) : null, target: 20 }; })(),   // 대체 지표: 무기별 보유 시 평균 비중 최대·최소 차(%p)
  weaponOwnShare: Object.fromEntries(Object.entries(wOwnShare).map(([k, v]) => [k, [avg(v), v.length]]).sort((x, y) => y[1][0] - x[1][0])),   // 0.38 보유 시 무기 단위 평균 비중 [%, 보유 판]
  weaponTop: { avg: avg(wTop), over35: wTop.filter(x => x > 35).length },   // 0.38 궁극기 제외 무기 단위 최대 비중
  awaken: cnt(ok.flatMap(r => (r.branches || []).filter(b => b.includes(':aw:')))),
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
  gate: (() => { const G = {}, all = ok.filter(r => r.gate);   // 수문장전 (0.11): 수문장별 도달·처치·소요 시간·격노 시각·사망 시 남은 체력
    for (const r of all) { const [id, o, t, hp, rage] = r.gate, x = G[id] = G[id] || { n: 0, kill: 0, t: [], dead: 0, hpLeft: [], rage: [] }; x.n++; if (o === 'kill') { x.kill++; x.t.push(t); } else { x.dead++; x.hpLeft.push(hp); } if (rage != null) x.rage.push(rage); }
    for (const k in G) G[k] = { n: G[k].n, kill: G[k].kill, avgSec: avg(G[k].t), minSec: q(G[k].t, 0), maxSec: q(G[k].t, 1), dead: G[k].dead, hpLeftAvg: avg(G[k].hpLeft), rageAvg: avg(G[k].rage) };
    const gh = {}; for (const r of all) for (const k in r.hurt || {}) if (/바르간|이그나|모르덴|세렌|거울/.test(k)) gh[k] = Math.round((gh[k] || 0) + r.hurt[k]);
    return { reached: all.length, in30to150: all.filter(r => r.gate[1] === 'kill' && r.gate[2] >= 30 && r.gate[2] <= 150).length, byGk: G, bossHurt: gh, gatesMax: Math.max(0, ...ok.map(r => r.gates || 0)) }; })(),
  demon: (() => { const D = ok.filter(r => r.demon), kill = D.filter(r => r.demon[0] === 'kill');   // 마왕전 (0.12): [결과, 소요, 남은 체력%, 도달 페이즈, 2페이즈 진입, 3페이즈 진입, 판 구조]
    const hd = {}; for (const r of D) for (const k in r.hurt || {}) if (/마왕/.test(k)) hd[k] = Math.round((hd[k] || 0) + r.hurt[k]);
    return { reached: D.length, byType: cnt(D.map(r => r.demon[6])), result: cnt(D.map(r => r.demon[0])), killSec: { avg: avg(kill.map(r => r.demon[1])), min: q(kill.map(r => r.demon[1]), 0), max: q(kill.map(r => r.demon[1]), 1) }, in150to240: kill.filter(r => r.demon[1] >= 150 && r.demon[1] <= 240).length,
      stage: cnt(D.map(r => r.demon[3])), st2At: avg(D.filter(r => r.demon[4] != null).map(r => r.demon[4])), st3At: avg(D.filter(r => r.demon[5] != null).map(r => r.demon[5])), hpLeftDead: avg(D.filter(r => r.demon[0] !== 'kill').map(r => r.demon[2])), hurt: hd,
      runTime: { final: avg(ok.filter(r => r.runType === 'final').map(r => r.time)), retry: avg(ok.filter(r => r.runType === 'retry').map(r => r.time)) } }; })(),
  meat: (() => { const M = ok.filter(r => r.meat); const t5 = M.filter(r => r.time >= 300).map(r => r.meat[2].filter(t => t <= 300).length);   // 회복 고기 (0.28): [드롭 수, 먹은 수, 드롭 시각]
    return { runs: M.length, dropAvg: avg(M.map(r => r.meat[0])), eatAvg: avg(M.map(r => r.meat[1])), first5min: { avg: avg(t5), min: q(t5, 0), max: q(t5, 1), in1_5to2_5: t5.filter(x => x >= 1.5 && x <= 2.5).length, n: t5.length } }; })(),
  errors: errs, pageErr: ok.reduce((s, r) => s + (r.pageErr || []).length, 0), errShownRuns: ok.filter(r => r.errShown).length,
  flow: flows, saveBad: ok.filter(r => !r.saveOk).length,
  perf: { maxEnP90: q(ok.map(r => r.maxEn || 0), .9), stepMsAvg: avg(ok.map(r => r.cost.stepMs)), stepMsMax: q(ok.map(r => r.cost.stepMs), 1), renMsAvg: avg(ok.map(r => r.cost.renMs)), renMsMax: q(ok.map(r => r.cost.renMs), 1) },
};
console.log(JSON.stringify(out, null, 1));
