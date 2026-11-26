/* ============================================================
   0.55 전면 점검 패치 3차 — 화면 완성도 (회차 61)
   • 마왕: 초당 체력 감소 상한 완화 (강한 구성 처치 시간 하한 약 155초 → 약 125초, 0.31 확정 사항 변경·사용자 승인)
   • 상단 화면: 화면 폭 대응·크기 설정 (v45.js hudLayout·drawHUD 직접 수정)
   • 일시정지: 정보 한 묶음 + 보유 능력 아이콘 + 버튼 3단 (main.js pauseGame 직접 수정)
   • 내 능력: 전체 화면(무기·보조·직업 탭), 한 줄 설명 + 현재 수치 칩, 상세는 접힘
   • 선택 카드: 강화 카드에 바뀌는 수치(현재 → 다음) 표기, 다음 레벨이 분기·각성이면 표기
   • 직업 설명 간결화 (0.53·0.54 변경분 반영), 전직 카드·도감의 옛 연성 문구 정리
   • 심판의 빛 각성 이름·설명을 실제 동작에 맞춤
   ============================================================ */

/* ---------- 마왕 초당 체력 감소 상한 ---------- */
DM_CFG.rate = 0.0077;                                       // (1 - burst 0.04) / 0.0077 ≈ 125초

/* ---------- 직업 설명 (짧게, 현재 동작 기준) ---------- */
const RULE55 = {
  warrior: '받은 피해의 절반을 모았다가 다음 근접 공격 때 폭발로 되돌림 · 투지가 가득 차면 8초 격노',
  rogue: '무기 칸 3개 · 모든 무기가 그림자로 한 번 더 발동 (60%) · 계속 움직이면 치명타 증가',
  sovereign: '레벨업 선택지 4장 · 군기 안에서 피해 +25%·받는 피해 -15% · 근위병 2기가 군기 수호',
  archer: '멈춰 있으면 집중이 쌓여 치명타·피해 증가 (최대 5) · 움직이면 서서히 감소 · 표식 적 우선 조준',
  engineer: '무기 2개를 포탑에 실어 포탑 자리에서 발사 · 포탑 주변 적 감속',
  chrono: '시간 지연장 안의 적과 적 탄환 감속 · 범위 안에서 5번 맞히면 1.5초 정지',
  mage: '3.2초마다 무기 동시 시전 · 시전 순간 주변 적 밀쳐냄 · 다른 속성을 연달아 맞히면 원소 반응',
  summoner: '처치한 적이 망령이 되어 내 무기로 싸움 · 직접 공격 피해 -30%',
  priest: '체력이 가득할 때 넘친 회복이 신성 폭발로 전환 · 처치 40회마다 정화',
  druid: '늑대·곰 동료와 함께 싸움 · 레벨업 선택지 1장은 항상 동료 강화',
};
for (const j in RULE55) if (JOBS[j]) JOBS[j].rule = RULE55[j];
JOB_SHORT.mage = '3.2초마다 무기 동시 시전';
JOB_SHORT.chrono = '주변 적·탄환 감속 · 5번 맞히면 정지';

/* ---------- 심판의 빛(프리스트 기본 무기) 각성: 실제 동작 기준 이름·설명 ---------- */
const AW55 = { priest: { orb: { sat: { nm: '잔광', ds: '피해 +20%, 같은 자리에 빛이 2회 더 내리침 (피해 40%)' }, split: { nm: '빛 갈래', ds: '주변에 작은 빛 기둥 3개 추가 (피해 35%)' } } } };
function awTx55(id, k) {
  const o = AWAKEN[id] && AWAKEN[id].find(x => x.k === k); if (!o) return null;
  const p = G && G.p, w = p && p.weapons.find(x => x.id === id), A = w && form53(w) && AW55[p.job] && AW55[p.job][id] && AW55[p.job][id][k];
  return A ? Object.assign({}, o, A) : o;
}

/* ---------- 선택 카드: 바뀌는 수치 표기 ---------- */
const num55 = v => v >= 10 ? String(Math.round(v)) : String(Math.round(v * 10) / 10);
const sec55 = v => String(Math.round(v * 100) / 100);
const formK55 = w => form53(w) && G.p.job === 'priest' ? V53.priK : 1;
const unit55 = w => form53(w) && G.p.job === 'priest' ? '빛 기둥' : W_UNIT[w.id] || '개수';
function upNum55(w) {
  const D = WEAPONS[w.id], u = D.ups[w.lvl - 1]; if (!u) return '';
  const A = wStats(w), B = wStats(Object.assign({}, w, { lvl: w.lvl + 1 })), k = formK55(w), a = [];
  if (u.dmg) a.push(`피해 ${num55(A.dmg * k)} → ${num55(B.dmg * k)}`);
  if (u.cd && A.cd) a.push(`재사용 ${sec55(A.cd)} → ${sec55(B.cd)}초`);
  if (u.n) a.push(`${unit55(w)} ${A.n} → ${B.n}`);
  if (u.pierce) a.push(`${w.id === 'boomerang' ? '타격 수' : '관통'} ${A.pierce} → ${B.pierce}`);
  if (u.area) a.push(`범위 +${Math.round(u.area * 100)}%`);
  if (u.rot) a.push(`회전 속도 +${Math.round(u.rot * 100)}%`);
  return a.join(' · ');
}
function rangeTx55(a, b) {
  const re = /([+-]?\d+(?:\.\d+)?%?)/, A = a.split(re), B = b.split(re);
  if (A.length !== B.length) return b;
  return A.map((t, i) => i % 2 && t !== B[i] ? `${t} → ${B[i]}` : t).join('');
}
const _cardInfo55 = cardInfo;
cardInfo = function (c) {
  const r = _cardInfo55(c), p = G.p;
  try {
    if (c.t === 'wup') {
      const w = p.weapons.find(x => x.id === c.id), t = w && upNum55(w);
      if (t) r.ds = t;
      if (w && !w.fu) { if (w.lvl + 1 === BRANCH_AT && BRANCHES[c.id] && !w.br) r.tag += ' · 분기 선택'; else if (w.lvl + 1 === AW43 && AWAKEN[c.id] && !w.aw) r.tag += ' · 각성'; }
    } else if (c.t === 'wnew') {
      const S = wStats({ id: c.id, lvl: 1 }), B = WEAPONS[c.id].base;
      r.ds += `\n피해 ${num55(S.dmg)}` + (B.cd ? ` · 재사용 ${sec55(S.cd)}초` : '');
    } else if (c.t === 'pup') {
      const d = PASSIVES[c.id], L = passLv(c.id);
      r.ds = rangeTx55(d.desc(L), d.desc(L + 1));
      if (L + 1 === PBR_AT && BRANCHES[c.id] && !pBr(c.id)) r.tag += ' · 통달';   // 0.62 보조 효과 통달 Lv 5
    } else if (c.t === 'branch' && c.aw) {
      const o = awTx55(c.id, c.k); if (o) { r.nm = o.nm; r.ds = o.ds; r.tag = wName(c.id) + ' 각성'; }
    } else if (c.t === 'job') {
      const U = ULT_TXT[c.id], F = FORM53[c.id], B = WEAPONS[FZ_SYMBOL[c.id]].name;
      r.ds = JOB_SHORT[c.id] + '\n궁극기 · ' + U[0] + '\n기본 무기 · ' + (F ? `${B} → ${F.nm}` : B);
      r.full = JOBS[c.id].rule + '\n궁극기 · ' + U[0] + ': ' + U[1] + '\n기본 무기 · ' + (F ? `${F.nm}: ${F.ds}` : B);
    }
  } catch (e) { }
  return r;
};

SEL_HEAD.branch = s => { const nm = WEAPONS[s.q.id] ? wName(s.q.id) : itemName(s.q.id); return s.q.aw ? ['무기 각성', `${nm} Lv ${AW43} · 각성 1종 선택`] : ['분기 선택', `${nm} 강화 ${BRANCH_AT}단계 · 플레이 방식 선택`]; };

/* ---------- 내 능력: 전체 화면 ---------- */
const ABIL_TABS = [['w', '무기'], ['p', '보조'], ['j', '직업']];
function wChips55(w, br, ak) {
  const a = [];
  if (!w.fu) {
    const S = wStats(w), B = WEAPONS[w.id].base;
    a.push(['피해', num55(S.dmg * formK55(w))]);
    if (B.cd) a.push(['재사용', sec55(S.cd) + '초']);
    if (B.n || S.n > 1) a.push([unit55(w), S.n]);
    if (S.pierce) a.push([w.id === 'boomerang' ? '타격 수' : '관통', S.pierce]);
    if (S.area > 1.001) a.push(['범위', '+' + Math.round((S.area - 1) * 100) + '%']);
  }
  if (br) a.push(['분기', esc(br.nm)]);
  if (ak) a.push(['각성', esc(ak.nm)]);
  return a.length ? cxChips(a) : '';
}
const cxDet55 = (head, rows) => rows.length ? `<details class="acc"><summary>${esc(head)}</summary><div class="cxg${rows.length === 1 ? ' one' : ''}">${rows.map(([b, t]) => `<div><b>${esc(b)}</b><span>${esc(t)}</span></div>`).join('')}</div></details>` : '';
function abilP55() {
  const p = G.p; let h = '';
  h += p.passives.length ? p.passives.map(x => { const d = PASSIVES[x.id], br = x.br && BRANCHES[x.id] && BRANCHES[x.id].find(o => o.k === x.br);
    return cxCard({ id: x.id, col: CFG.colors.passive, ic: d.ic, nm: d.name, tag: 'Lv ' + x.lvl, lines: [esc(d.desc(x.lvl)), br ? cxChips([['통달', esc(br.nm)]]) : '', br ? cxDet55('상세', [['통달 · ' + br.nm, br.ds]]) : ''] }); }).join('') : '<p class="hint">보유 보조 효과 없음</p>';
  const tk = Object.keys(p.tr || {});
  if (tk.length) h += '<h3>숙련 특성</h3>' + tk.map(k => cxCard({ trait: k, col: '#c8b0ff', ic: TRAITS[k].ic, nm: TRAITS[k].nm, lines: [esc(TRAITS[k].ds)] })).join('');
  if (p.curses && p.curses.length) h += '<h3>저주</h3>' + p.curses.map(k => cxCard({ col: '#8a6aa0', ic: '저', nm: CURSES[k].name, lines: [esc(CURSES[k].ds)] })).join('');
  return h;
}
function showAbil(back, tab) {
  const K = ABIL_TABS.map(t => t[0]); tab = K.includes(tab) ? tab : 'w';
  const body = { w: abilW55, p: abilP55, j: abilJ55 };
  UI.innerHTML = `<div class="layer pg pager abpg">${pgHead('내 능력', 'ab_back', ABIL_TABS, tab, 'data-atab')}${pgPanes(K.map(k => [k, body[k]()]), tab, 'cxl')}</div>`;
  uiPager(UI.querySelector('.layer'), K, tab, () => { });
  on('ab_back', back);
}
function toggleAbil() {
  const s = G.sel; if (!s) return;
  const b = document.getElementById('ab_back'); if (b) { b.click(); return; }
  showAbil(() => { if (G && G.sel) { STATE.mode = 'select'; renderSelect(); } });
}

/* ---------- 도감 정리: 직업 카드·연성 탭의 옛 문구(직업별 연성 규칙·시련) 제거 ---------- */

/* ---------- 화면 모양 ---------- */
(function () {
  if (typeof document === 'undefined') return;
  const st = document.createElement('style');
  st.textContent = `#ui>.layer.pz{gap:14px;justify-content:center}
.pz-info{display:flex;flex-direction:column;align-items:center;gap:5px}
.pz-info .l1{font-size:16px;font-weight:700}
.pz-info .l2{display:flex;flex-wrap:wrap;justify-content:center;gap:2px 14px;font-size:13px;color:var(--muted);font-variant-numeric:tabular-nums}
.pz-build{box-sizing:border-box;width:100%;max-width:360px;display:flex;flex-direction:column;gap:9px;padding:11px 12px;border:1px solid var(--line);border-radius:12px;background:var(--panel);cursor:pointer;transition:filter .2s,transform .2s}
.pz-build:active{transform:scale(.98);filter:brightness(1.15)}
.pz-build .r{display:flex;align-items:center;flex-wrap:wrap;gap:7px}
.pz-build .r>i{font-style:normal;flex:0 0 30px;font-size:12px;color:var(--muted)}
.pz-t{position:relative;display:inline-flex}
.pz-t .ic{width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800;color:#14121c;box-sizing:border-box}
.pz-t .ic.px img{width:30px;height:30px}
.pz-t em{position:absolute;right:-4px;bottom:-4px;min-width:15px;height:15px;padding:0 2px;box-sizing:border-box;border-radius:5px;background:#1a2230;border:1px solid #6a7480;color:#f0e9d9;font-style:normal;font-size:10px;font-weight:700;line-height:13px;text-align:center}
.pz-menu{width:100%;max-width:360px;display:flex;flex-direction:column;gap:9px}
.pz-menu .r3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.pz-menu .r2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.pz-menu button{width:100%;min-height:46px;padding:10px 4px;white-space:nowrap}
.pz-menu .r2 button{min-height:40px;font-size:13px;color:var(--muted)}
.pz-menu .r2 button.warn{color:#ffd9c9}
.cxg.one{grid-template-columns:1fr}
.abpg .cx p i{margin-right:2px}
@media(max-height:600px){#ui>.layer.pz{gap:9px}.pz-menu{gap:7px}.pz-menu button{min-height:42px}}`;
  document.head.appendChild(st);
})();
