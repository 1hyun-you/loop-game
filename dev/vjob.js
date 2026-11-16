// 직업별 집계 (0.53): 돌파·분당 피격·분당 처치·최고 피해 무기·사망 위치, 수문장별 승패
// 사용: node dev/vjob.js <기록 파일> [기록 파일...]
const fs = require('fs');
let L = []; for (const f of process.argv.slice(2)) L = L.concat(fs.readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l)).filter(r => !r.god && !r.fatal));
const by = {}; for (const r of L) (by[r.job || '없음'] = by[r.job || '없음'] || []).push(r);
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
console.log(`전체 ${L.length}판 · 돌파 ${L.filter(r => r.result === 'clear').length} · 오류 ${L.reduce((s, r) => s + (r.errs || []).length + (r.pageErr || []).length, 0)}`);
for (const j of Object.keys(by).sort()) {
  const a = by[j], top = {}; for (const r of a) { const t = r.dmg && r.dmg[0]; if (t) top[t[0]] = (top[t[0]] || 0) + 1; }
  console.log(j.padEnd(10), `판 ${a.length} 돌파 ${a.filter(r => r.result === 'clear').length}`, `시간 ${Math.round(avg(a.map(r => r.time)))}`, `Lv ${Math.round(avg(a.map(r => r.level)))}`,
    `피격/분 ${Math.round(avg(a.map(r => Object.values(r.hurt || {}).reduce((x, y) => x + y, 0) / r.time * 60)))}`, `처치/분 ${Math.round(avg(a.map(r => r.kills / r.time * 60)))}`,
    `연성 ${avg(a.map(r => (r.fuses || []).length)).toFixed(1)}`, `최고 ${Object.entries(top).sort((x, y) => y[1] - x[1]).slice(0, 3).map(x => x.join(':')).join(' ')}`,
    `사망 ${a.filter(r => r.result !== 'clear').map(r => r.phaseAt + '(' + r.lastHit + ')').join(', ')}`);
}
const gk = {}; for (const r of L.filter(r => r.gate)) { const g = gk[r.gate[0]] = gk[r.gate[0]] || { kill: 0, dead: 0, retreat: 0, t: [] }; g[r.gate[1]] = (g[r.gate[1]] || 0) + 1; g.t.push(r.gate[2]); }
for (const k in gk) console.log('수문장', k, `처치 ${gk[k].kill} 사망 ${gk[k].dead} 퇴각 ${gk[k].retreat} 평균 ${Math.round(avg(gk[k].t))}초`);
const dm = L.filter(r => r.demon); console.log(`마왕전 ${dm.length} · 처치 ${dm.filter(r => r.demon[0] === 'kill').length} · 평균 ${Math.round(avg(dm.map(r => r.demon[1])))}초`);
