/* ============================================================
   0.46 동료 지휘 로직 (회차 52, 표현·보강 단계)
   • 대상: 소환사 망령·망령 무장(연성), 드루이드 야수 동료 — 공통 지휘 모듈 squad46
   • 거리: 대기 고리 반경 110~160, 동료 3체째부터 1체당 +6 (최대 +30), 활동 범위 210 + 동일 가산 (상한 240)
   • 평소: 고리를 동료 수만큼 구역 분할 → 각자 구역 방향 적 우선, 적 1체당 1명 배정 (분산)
   • 정예·수문장·보스: 동료 수 절반(올림)만 집중 투입, 보스 단독 구간은 전원 투입
   • 근접 위협(플레이어 반경 80 안 적) 최우선 처리
   • 같은 적을 여럿이 칠 때 적 둘레에 공격 자리를 각도로 나눠 배정 (겹침 방지), 동료 간 최소 간격 22
   • 표적 재판단 0.6초, 공격 중 표적은 처치·이탈 전까지 유지
   • 드루이드: 곰 정예·보스 담당, 늑대 잡몹 분산 담당
   • 활동 범위 밖 이탈 시 표적 해제 후 고리로 복귀 (속도 1.6배)
   • 망령 무기 발동은 망령 위치(고리·공격 자리) = 활동 범위 안에서만 발동
   ============================================================ */
const SQ46 = { rIn: 110, rOut: 160, per: 6, extraMax: 30, act: 210, actMax: 240, near: 80, re: 0.6, gap: 22 };
function sqGeom46(n) { const ex = Math.min(SQ46.extraMax, SQ46.per * Math.max(0, n - 2)); return { rIn: SQ46.rIn + ex, rOut: SQ46.rOut + ex, act: Math.min(SQ46.actMax, SQ46.act + ex) }; }
/* 지휘: units에 tg(표적)·gx/gy(목표 위치)·ret(복귀 중) 지정 */
/* 목표 위치: 표적 둘레 공격 자리(각도 분할) / 대기 고리 구역 */
/* 이동: 목표 위치로 이동 + 동료 간격 유지 */
function moveUnit46(u, sp, dt, list) {
  const dx = u.gx - u.x, dy = u.gy - u.y, d = Math.hypot(dx, dy) || 1;
  if (u.gx != null && d > 2) { const v = Math.min(d, sp * (u.ret ? 1.6 : 1) * dt); u.x += dx / d * v; u.y += dy / d * v; if (!u.tg) u.vx = dx; }
  for (const o of (list || sqPeers46(u))) { if (o === u) continue; const ox = u.x - o.x, oy = u.y - o.y, od = Math.hypot(ox, oy); if (od > 0 && od < SQ46.gap) { u.x += ox / od * (SQ46.gap - od) * 0.5; u.y += oy / od * (SQ46.gap - od) * 0.5; } }
}
const sqPeers46 = u => G.p && G.p.job === 'druid' ? (G.pets || []) : sumUnits46();
const sumUnits46 = () => G.minions.concat((G.f43 && G.p && G.p.job === 'summoner' && fusedWs().length) ? G.f43.wr : []);

/* ---------- 망령: 지휘 모듈 적용 ---------- */
/* 망령 무장(연성): 원래 이동 대신 지휘 위치로 이동 */
const _fuseTick46 = fuseTick;
fuseTick = function (dt) {
  const f = G.f43, keep = f && f.wr ? f.wr.map(m => [m.x, m.y]) : [];
  _fuseTick46(dt);
  if (!f || !f.wr || !f.wr.length || G.p.job !== 'summoner') return;
  const U = sumUnits46();
  f.wr.forEach((m, i) => { if (keep[i]) { m.x = keep[i][0]; m.y = keep[i][1]; } if (!m.r) m.r = 8; if (m.gx == null) { m.gx = m.x; m.gy = m.y; } moveUnit46(m, 210, dt, U); });
};

/* 망령 무기 발동: 복귀 중(활동 범위 밖) 망령은 발동 보류 → 발동은 항상 활동 범위 안 */

/* ---------- 드루이드 야수 동료: 지휘 모듈 적용 (원래 표적·이동 부분만 교체) ---------- */

/* ---------- 점검용 집계: 활동 범위 이탈·겹침 ---------- */
