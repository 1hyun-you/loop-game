/* ============================================================
   서사 (0.13) — 4단계 결정 안건 1
   원인: 조력자 소원형 — 마왕 토벌에 실패하고 동료를 잃은 주인공의 "다시 한 번" 소원을 조력자가 들어주어 생긴 고리
   해제: 기록 조각 10개 전부 해금 → 다음 판 시작 대사에서 조력자가 고리를 놓음 → 그 판 마왕 처치 시 진엔딩
   엔딩: 일반 엔딩(첫 마왕 처치, 고리에 의해 마왕 부활) · 진엔딩(수용·작별형)
   기록 조각: 이정표 7개 + 곁가지 사건 3종 첫 해결 각 1개 (혼합형)
   인물명(리안·에다·토르반·하린·유르)은 가칭
   ============================================================ */
const CAST = {
  hero: { name: '리안', color: '#3a6ac0', pt: 'hero' },
  aide: { name: '에다', color: '#7a6ab8', pt: 'aide' },
  demon: { name: '마왕', color: '#5a2a8a', pt: 'demon' },
};
/* 초상화 도트 16×16 (좌우 대칭: 왼쪽 8칸만 기술, 오른쪽은 반전) → 64px 표시 */
const PORTRAITS = {
  hero: { pal: { k: '#1a1622', h: '#6b4a32', s: '#f0c8a0', e: '#2a2440', c: '#3a6ac0', a: '#b8c0d0', b: '#16203a' },
    half: ['bbbbbbbb', 'bbbbbkkk', 'bbbbkhhh', 'bbbkhhhh', 'bbbkhhhh', 'bbbkhsss', 'bbbksess', 'bbbkssss', 'bbbbksss', 'bbbbbkks', 'bbbkkccc', 'bbkcccaa', 'bkcccaaa', 'bkccaaaa', 'kcccaaaa', 'kcccaaaa'] },
  aide: { pal: { k: '#1a1622', v: '#7a6ab8', d: '#120f1c', g: '#ffe08a', w: '#e0c060', b: '#201a34' },
    half: ['bbbbbbkk', 'bbbbbkvv', 'bbbbkvvv', 'bbbkvvvv', 'bbbkvvdd', 'bbkvvddd', 'bbkvvdgd', 'bbkvvddd', 'bbkvvvdd', 'bbkvvvvd', 'bkvvvvvv', 'bkvvwvvv', 'kvvvwvvv', 'kvvvwvvv', 'kvvvvwvv', 'kvvvvwvv'] },
  demon: { pal: { k: '#0e0a14', r: '#d8d0c0', m: '#5a2a8a', y: '#ff4a4a', o: '#2a1040', p: '#b04ad0', b: '#1a0e24' },
    half: ['brbbbbbb', 'brrbbbbb', 'bbrrbkkk', 'bbrkkmmm', 'bbbkmmmm', 'bbbkmmmm', 'bbbkmymm', 'bbbkmmmm', 'bbbkmkkk', 'bbbbkmmm', 'bbkkkkoo', 'bkooopoo', 'koooopoo', 'kooooopo', 'kooooooo', 'kooooooo'] },
};
const PT_URL = {};
function buildPortraits() {
  for (const k in PORTRAITS) {
    try {
      const P = PORTRAITS[k], cvs = document.createElement('canvas'); cvs.width = cvs.height = 16;
      const c = cvs.getContext('2d');
      P.half.forEach((row, y) => { const full = (row + row.split('').reverse().join('')).padEnd(16, 'b').slice(0, 16); full.split('').forEach((ch, x) => { c.fillStyle = P.pal[ch] || P.pal.b; c.fillRect(x, y, 1, 1); }); });
      PT_URL[k] = cvs.toDataURL();
    } catch (e) { }
  }
}

/* 기록 조각 10개 — 해금 조건(cond)·제목·본문 */
const FRAGS = [
  { id: 'loop', cond: '첫 판 마치기', nm: '첫 회귀', tx: '다시 눈을 뜬 곳은 들판의 출발점이었다. 상처는 사라졌지만 마지막 순간의 감각은 그대로 남아 있었다. 누군가 "이번에도 기억하는구나" 하고 속삭였다.' },
  { id: 'bargan', cond: '바르간 처치', nm: '돌진의 문', tx: '토르반은 언제나 맨 앞에 섰다. 돌진해 오는 문지기를 방패 하나로 받아 내며 먼저 가라고 외쳤다. 그 뒤로 그의 목소리를 듣지 못했다.' },
  { id: 'igna', cond: '이그나 처치', nm: '불꽃의 문', tx: '하린의 화살은 불길 속에서도 빗나간 적이 없었다. 불꽃의 문을 넘던 날, 그녀는 마지막 화살을 내 손에 쥐여 주었다.' },
  { id: 'morden', cond: '모르덴 처치', nm: '망자의 문', tx: '유르는 망자들의 이름을 하나씩 불러 잠재웠다. 그 주문이 끝났을 때 그는 더 이상 일어서지 못했다.' },
  { id: 'seren', cond: '세렌 처치', nm: '거울의 문', tx: '거울 속의 나는 같은 말을 되풀이했다. 한 번만 더, 한 번만 더 하면 모두를 구할 수 있다고. 그 목소리가 내 것이라는 사실이 가장 무서웠다.' },
  { id: 'castle', cond: '마왕성 도달', nm: '왕좌로 가는 계단', tx: '넷이 함께 오르던 계단을 혼자 올랐다. 왕좌 앞에서 검을 들었지만, 그날 나는 이기지 못했다.' },
  { id: 'shadow', cond: '마왕 처치', nm: '되살아난 그림자', tx: '마왕은 분명 쓰러졌다. 그러나 들판의 시간이 되감기자 왕좌의 그림자도 다시 일어섰다. 고리는 나만이 아니라 모든 것을 되돌리고 있었다.' },
  { id: 'cave', cond: '동굴 입구 소탕', nm: '모닥불', tx: '동굴 속 모닥불 앞에서 넷은 돌아가면 무엇을 할지 이야기했다. 토르반은 대장간을, 하린은 바다를, 유르는 책방을 말했다. 나는 대답하지 못했다.' },
  { id: 'giant', cond: '잠든 거대 몹 처치', nm: '첫 수련', tx: '거대한 짐승 앞에서 검을 떨어뜨렸던 날, 토르반은 웃으며 검을 다시 쥐여 주었다. 쓰러져도 일어서는 법은 그때 배웠다.' },
  { id: 'door', cond: '봉인된 문 열기', nm: '소원', tx: '모두가 쓰러진 왕좌 앞에서 나는 빌었다. 다시 한 번만. 대답한 것은 에다였다. 그 소원을 들어주겠다고, 내가 놓아줄 수 있을 때까지.' },
];
const FRAG_N = FRAGS.length;

/* 대사 묶음 — [화자, 본문] */
const SAY = {
  intro: [['aide', '눈을 떴구나. 여기는 회귀의 들판이야.'], ['aide', '쓰러져도 너는 이곳으로 돌아와. 기억만은 가지고.'], ['hero', '마왕성으로 가야 해. 이번에는 반드시.'], ['aide', '사문의 수문장을 쓰러뜨려 네 개의 문을 열어. 길은 그 너머에 있어.']],
  release: [['aide', '기억이 전부 돌아왔구나.'], ['hero', '토르반도, 하린도, 유르도 돌아오지 않아. 아무리 되감아도.'], ['aide', '그걸 알았으니, 이제 놓아줄 수 있겠어?'], ['hero', '응. 고마웠어, 에다.'], ['aide', '고리를 놓을게. 이번에 쓰러진 마왕은 다시 일어나지 못해.']],
  ending1: [['hero', '끝났다. 이걸로.'], ['demon', '끝이라고? 이 들판에 끝은 없다.'], ['aide', '고리가 이어지는 한 그는 다시 일어나. 너도, 나도.'], ['hero', '그럼 고리를 끊으려면.'], ['aide', '잃어버린 기억을 전부 찾아. 그때 다시 이야기하자.']],
  trueEnd: [['demon', '시간이, 흐른다?'], ['hero', '모두, 미안해. 그리고 고마워.'], ['aide', '잘 가, 리안. 이제 내일로 가.'], ['hero', '응. 앞으로 갈게.']],
  demonMeet: [['demon', '또 그 눈이군. 몇 번을 되감아도 결말은 같다.'], ['hero', '이번에는 다르다.']],
  demonFree: [['demon', '시간이 되감기지 않는다? 무슨 짓을 했지.'], ['hero', '끝내러 왔다.']],
  firstDeath: [['aide', '쓰러졌구나. 괜찮아, 다시 시작하면 돼.']],
  demonAgain: [['aide', '그는 또 일어날 거야. 남은 기억을 찾아.']],
};
const GK_SAY = {
  bargan: '또 왔나. 이 문은 몇 번이든 막는다.',
  igna: '불꽃은 기억을 태운다. 너도 태워 주지.',
  morden: '망자는 돌아오지 않는다. 너만 빼고.',
  seren: '거울 속의 너는 몇 번째 너지?',
};
/* 판 시작 한 줄 — 진행 상황별 */
function startLine(s) {
  const g = (s.gates || []).length, f = (s.frags || []).length;
  if (s.trueEnd) return pick([['hero', '기억 속의 들판. 더 짙은 그림자와 겨룬다.'], ['aide', '고리는 끊겼어. 이건 네가 고른 싸움이야.']]);
  if (s.demonKills) return ['aide', `남은 기억은 ${FRAG_N - f}개. 들판 구석구석에 흩어져 있어.`];
  if (g >= 4) return pick([['aide', '왕좌는 그대로야. 너도, 그도.'], ['hero', '이번에는 계단 끝까지.']]);
  if (g > 0) return pick([['hero', `열린 문은 ${g}개. 남은 문은 ${4 - g}개.`], ['aide', '열린 문 너머에서 무언가 기다리고 있어.']]);
  return pick([['aide', '몇 번이든 돌아와. 그게 네가 바란 거니까.'], ['hero', '문을 연다. 하나씩.']]);
}

const toLines = arr => arr.map(([who, text]) => CAST[who] ? { name: CAST[who].name, color: CAST[who].color, pt: CAST[who].pt, text } : who);
function storyRead() { const s = loadSave(); s.frags = s.frags || []; return s; }
function storyWrite(s) { try { localStorage.setItem(CFG.SAVE_KEY, JSON.stringify(s)); } catch (e) { } }

/* 판 시작 (step 첫 틱에서 호출) — 대사 표시 시 true */
function storyRunStart() {
  const s = storyRead(); let lines;
  G.story = { freed: !!s.released && !s.trueEnd, newFrags: [] };
  if (!s.intro) { s.intro = 1; storyWrite(s); lines = SAY.intro; }
  else if (s.frags.length >= FRAG_N && !s.released && !s.trueEnd) { s.released = 1; storyWrite(s); G.story.freed = true; lines = SAY.release; }
  else lines = [startLine(s)];
  showDialog(toLines(lines));
  return true;
}
/* 기록 조각 해금 — 즉시 저장 */
function fragUnlock(id) {
  if (!G || !G.story) return;
  const s = storyRead(); if (s.frags.includes(id)) return;
  s.frags.push(id); storyWrite(s); G.story.newFrags.push(id);
  const F = FRAGS.find(f => f.id === id);
  toast(`기록 조각 · ${F.nm} (${s.frags.length}/${FRAG_N})`, '#e8d8ff');
}
/* 보스 등장 대사 — 수문장은 첫 대면만, 마왕은 첫 대면·해제 판 */
function storyBoss(k) {
  vibe(80);
  const s = storyRead();
  if (k === 'demon') {
    fragUnlock('castle');
    if (G.story && G.story.freed) return showDialog(toLines(SAY.demonFree));
    if (!s.demonTries && !s.metDemon) { const t = storyRead(); t.metDemon = 1; storyWrite(t); return showDialog(toLines(SAY.demonMeet)); }   // 0.16: 조각 해금 직후 재읽기 (이전 사본 저장 시 '왕좌로 가는 계단' 조각 유실 결함)
    return;
  }
  s.metGk = s.metGk || [];
  if (s.metGk.includes(k)) return;
  s.metGk.push(k); storyWrite(s);
  const D = GATEKEEPERS[k];
  showDialog([{ name: D.name, color: D.color, text: GK_SAY[k] }]);
}
/* 판 종료 대사 (finishRun에서 저장 전에 호출) — 저장 항목 갱신 후 표시 함수 반환 (next: 결과 화면) */
function storyRunEnd(s, next) {
  const R = G.report, dm = R.demon, killed = dm && dm[0] === 'kill';
  const say = (arr, after) => () => showDialog(toLines(arr), after || next);
  if (killed && G.story && G.story.freed) { s.trueEnd = 1; s.released = 0; R.trueEnd = true; return say(SAY.trueEnd, () => showEnding(next)); }
  if (killed && !s.ending1) { s.ending1 = 1; R.ending1 = true; return say(SAY.ending1); }
  if (killed && !s.trueEnd) return say(SAY.demonAgain);
  if (R.result === 'dead' && (s.runs || 0) <= 1) return say(SAY.firstDeath);
  if (R.gate && R.gate[1] === 'kill' && !dm) return say([['hero', `${GATEKEEPERS[R.gate[0]].gate}이 열렸다. 남은 문은 ${Math.max(0, 4 - (s.gates || []).length)}개.`]]);
  return next;
}
/* 진엔딩 화면 */
function showEnding(next) {
  STATE.mode = 'result';
  UI.innerHTML = `<div class="layer ending"><h2>회귀의 들판</h2>
    <p class="sub">고리가 끊긴 들판에 처음으로 다음 날 아침이 왔다.</p>
    <p class="best">진엔딩 · 칭호 '고리를 끊은 자'</p>
    <p class="hint">고난도 단계·도전 조건이 열렸습니다.</p>
    <div class="menu"><button class="pri" id="endnext">결과 보기</button></div></div>`;
  on('endnext', next);
}
