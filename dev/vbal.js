// 대규모 밸런스 집계 (회차 102): 인물별 돌파율·시간·레벨·처치/분·피격/분·적 최대 수·피해 비중 상위·사망 위치·우두머리
// 사용: node dev/vbal.js <접두어> [인물 목록]   예: node dev/vbal.js dev/sim_log/runs_0.69 archer engineer
const fs = require('fs');
const pre = process.argv[2], jobs = process.argv.length > 3 ? process.argv.slice(3) : ['berserker', 'rogue', 'archer', 'engineer', 'pyromancer', 'necromancer', 'priest', 'druid'];
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0, r0 = x => Math.round(x);
let all = [];
for (const j of jobs) {
  const f = `${pre}_${j}.jsonl`; if (!fs.existsSync(f)) { console.log(j, '(기록 없음)'); continue; }
  const L = fs.readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l)).filter(r => !r.fatal);
  all = all.concat(L);
  const cl = L.filter(r => r.result === 'clear').length, rt = L.filter(r => r.result === 'retreat').length;
  const sh = {}; for (const r of L) { const tot = (r.dmg || []).reduce((s, x) => s + x[1], 0) || 1; for (const [k, v] of r.dmg || []) sh[k] = (sh[k] || 0) + v / tot * 100 / L.length; }
  const top = Object.entries(sh).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${k} ${r0(v)}`).join(' · ');
  const mx = Math.max(...L.map(r => { const t = (r.dmg || []).reduce((s, x) => s + x[1], 0) || 1; return r.dmg && r.dmg[0] ? r.dmg[0][1] / t * 100 : 0; }));
  const ch = L.flatMap(r => (r.h60 && r.h60.chief) || []), chK = ch.filter(c => c[2] >= 0 && c[2] != null);
  const gR = L.filter(r => r.runType !== 'final' && r.runType !== 'retry'), dR = L.filter(r => r.runType === 'final' || r.runType === 'retry');
  const split = ` | 수문장 판 ${gR.filter(r => r.result === 'clear').length}/${gR.length} · 마왕 판 ${dR.filter(r => r.result === 'clear').length}/${dR.length}`;
  const err = L.reduce((s, r) => s + (r.errs || []).length + (r.pageErr || []).length, 0);
  console.log(`${j.padEnd(11)} ${L.length}판 돌파 ${cl} 퇴각 ${rt} | ${r0(avg(L.map(r => r.time)))}초 Lv ${r0(avg(L.map(r => r.level)))} | 처치/분 ${r0(avg(L.map(r => r.kills / r.time * 60)))} 피격/분 ${r0(avg(L.map(r => Object.values(r.hurt || {}).reduce((x, y) => x + y, 0) / r.time * 60)))} 적최대 ${r0(avg(L.map(r => r.maxEn || 0)))} 연성 ${avg(L.map(r => (r.fuses || []).length)).toFixed(1)} | ${top} (한 판 최대 ${r0(mx)}%)` +
    split + (ch.length ? ` | 우두머리 ${chK.length}/${ch.length} 평균 ${r0(avg(chK.map(c => c[2])))}초` : '') + (err ? ` | 오류 ${err}` : '') +
    `\n${''.padEnd(12)}사망·퇴각: ${L.filter(r => r.result !== 'clear').map(r => `${r.phaseAt}@${r.time}(${r.lastHit})`).join(', ')}`);
}
const cl = all.filter(r => r.result === 'clear').length;
console.log(`전체 ${all.length}판 · 돌파 ${cl} (${r0(cl / (all.length || 1) * 100)}%) · 평균 ${r0(avg(all.map(r => r.time)))}초 · Lv ${r0(avg(all.map(r => r.level)))}`);
