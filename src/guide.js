/* ============================================================
   첫 판 안내 (0.31) — 완성도 제안 승인분
   상황이 처음 생길 때 한 번씩 하단 안내 띠 표시 (진행 정지 없음), 본 항목은 저장해 다시 표시 안 함
   ============================================================ */
const GUIDE_KEY = () => CFG.SAVE_KEY + '_guide';
const GUIDE = [
  { id: 'move', tx: '화면을 누른 채 끌어 이동 · 공격은 자동', when: () => G.time > 0.6 },
  { id: 'gem', tx: '적이 남긴 보석을 모으면 레벨 업 · 카드 1장 선택', when: () => G.gems.length > 0 && G.time > 4 },
  { id: 'phase', tx: '상단 노란 막대는 페이즈 목표 · 채우면 다음 페이즈', when: () => G.p.level >= 2 },
  { id: 'chest', tx: '보물 상자를 열면 무기 강화 또는 유물', when: () => G.chests.some(c => !c.dead) },
  { id: 'altar', tx: '빛나는 제단 위에 잠시 서면 직업 선택', when: () => !!G.altar },
  { id: 'ult', tx: () => SETTINGS.autoUlt ? '궁극기 준비 완료 · 적이 몰리면 자동 발동' : '궁극기 준비 완료 · 손을 떼고 멈추면 발동', when: () => typeof ultReady === 'function' && ultReady() },
  { id: 'warn', tx: '붉은 장판과 ! 표식은 공격 예고 · 밖으로 피하기', when: () => G.hz.length > 0 },
  { id: 'hp', tx: '체력 부족 · 고기를 먹으면 회복', when: () => G.p.hp < G.p.maxHp * 0.4 },
];
const GD = { seen: null, cur: null, t: 0, dur: 4.2, gap: 0 };
function guideSeen() {
  if (!GD.seen) { try { GD.seen = new Set(JSON.parse(localStorage.getItem(GUIDE_KEY()) || '[]')); } catch (e) { GD.seen = new Set(); } }
  return GD.seen;
}
function guideMark(id) { const S = guideSeen(); S.add(id); try { localStorage.setItem(GUIDE_KEY(), JSON.stringify([...S])); } catch (e) { } }
function guideReset() { GD.seen = new Set(); GD.cur = null; try { localStorage.removeItem(GUIDE_KEY()); } catch (e) { } }
function guideUpdate(dt) {
  if (G.result) { GD.cur = null; return; }
  if (GD.cur) { GD.t += dt; if (GD.t >= GD.dur) { GD.cur = null; GD.gap = 1.2; } return; }
  if (GD.gap > 0) { GD.gap -= dt; return; }
  const S = guideSeen();
  for (const g of GUIDE) if (!S.has(g.id) && g.when()) { GD.cur = g; GD.t = 0; guideMark(g.id); (G.stats.guide || (G.stats.guide = [])).push(g.id); break; }
}
function pixelDrawGuide(c) {
  const g = GD.cur; if (!g || STATE.mode !== 'play') return; const tx = typeof g.tx === 'function' ? g.tx() : g.tx;
  const W = VIEW.cw, a = Math.min(1, GD.t * 4, (GD.dur - GD.t) * 3), y = VIEW.ch * 0.7;
  c.save(); c.globalAlpha = a; c.font = 'bold 13px system-ui, Galmuri11, sans-serif';
  const tw = Math.min(W - 32, c.measureText(tx).width + 28), h = 34, x = (W - tw) / 2;
  c.fillStyle = 'rgba(20,16,32,0.86)'; c.fillRect(x, y, tw, h);
  c.strokeStyle = '#ffe08a'; c.lineWidth = 2; c.strokeRect(x + 1, y + 1, tw - 2, h - 2);
  c.fillStyle = '#ffe08a'; c.fillRect(x + 4, y + 4, 4, 4); c.fillRect(x + tw - 8, y + 4, 4, 4); c.fillRect(x + 4, y + h - 8, 4, 4); c.fillRect(x + tw - 8, y + h - 8, 4, 4);   // 도트 모서리
  c.fillStyle = '#fff6d8'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(tx, W / 2, y + h / 2 + 1, tw - 20);
  c.restore();
}
