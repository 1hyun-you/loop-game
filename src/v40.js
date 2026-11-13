/* ===== 0.40 화면·소형 =====
   — 얼음 고리: 지속 고리 → 주기적 냉기 파동, 최대 확장 지점 적 파쇄 (bal39 냉기 4회 누적 폐지)
   — 공격 범위 보조 효과: 미적용 무기의 기존 판정만 확대 (화살·투척 단검·마력 구체·수리검 탄 크기, 번개 탐색 사거리)
     신규 능력 부여 없음 · 소환사 망령·기술자 포탑은 추후 재논의 */
const V40 = { ice: { cd: 1.2, reach: 1.3, steps: 5, dur: 0.5, hit: 2.6, slow: 1.4, frz: 0.12, shR: 30, shMul: 1.5, outer: 0.7 } };

WEAPONS.icering.base.cd = V40.ice.cd;
BAL.chill.need = 1e9;                                   // 0.39 냉기 누적 파쇄 폐지 (파동 파쇄로 대체)
WEAPONS.icering.desc = '주기적으로 퍼지는 냉기 파동, 둔화·피해, 최대 확장 지점 적 파쇄';

AW_BASE.icering = function (w, S) {                   // 각성 감싸기(awaken.js) 안쪽 기본 동작 교체
  const C = V40.ice, Rm = WEAPONS.icering.base.R * C.reach * S.area, frz = w.br === 'freeze', hit = new Set(), dmg = S.dmg * C.hit;
  w.R = Rm;
  fx({ kind: 'ring', x: G.p.x, y: G.p.y, r0: 8, r1: Rm, dur: C.dur, element:'ice', color: '#bfe8ff', follow: true, trk48: true });   // 0.48 파동 플레이어 추종
  for (let k = 1; k <= C.steps; k++) {
    G.later.push({
      t: C.dur * k / C.steps, f: () => {
        const p = G.p, r1 = Rm * k / C.steps, last = k === C.steps, sh = [];
        gridQuery(p.x, p.y, r1, e => {
          if (hit.has(e) || e.dead) return; hit.add(e);
          e.slowT = Math.max(e.slowT || 0, C.slow);
          if (frz && !e.cmd && !e.boss && Math.random() < C.frz) e.frz = 1;
          damageEnemy(e, dmg, { src: 'icering' });
          if (!e.dead && (last || Math.hypot(e.x - p.x, e.y - p.y) >= Rm * C.outer)) sh.push(e);
        });
        if (last) {                                                            // 최대 확장: 외곽 적 파쇄
          for (const e of sh.slice(0, 14)) {
            const x = e.x, y = e.y, d = S.dmg * C.shMul;
            fx({ kind: 'ring', x, y, r0: 4, r1: C.shR, dur: 0.2, art:'shatter', color: '#e6f6ff', fill: true });
            gridQuery(x, y, C.shR, t => damageEnemy(t, d, { src: 'icering_x' }));
          }
        }
      }
    });
  }
};

/* 공격 범위: 투사체 무기 탄 크기(판정) 확대 */
for (const id of ['arrow', 'knife', 'orb', 'shuriken']) {
  const f = WEAPON_FIRE[id]; if (!f) continue;
  WEAPON_FIRE[id] = function (w, S) {
    const n0 = G.proj.length, r = f.call(this, w, S);
    if (S.area > 1) for (let i = n0; i < G.proj.length; i++) G.proj[i].r *= S.area;
    return r;
  };
}
/* 공격 범위: 번개 낙뢰 탐색 사거리 확대 */
{
  const f = WEAPON_FIRE.lightning;
  WEAPON_FIRE.lightning = function (w, S) {
    const B = WEAPONS.lightning.base, r0 = B.range; B.range = r0 * S.area;
    try { return f.call(this, w, S); } finally { B.range = r0; }
  };
}
