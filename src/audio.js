/* ============================================================
   사운드 (0.21, 표현·보강 단계) — 브라우저 합성 효과음 · 코드 생성 칩튠 5곡
   — 외부 파일 없음, 설정 효과음·배경음 음량 즉시 반영
   — 곡: 시작 화면(title)·들판(field)·수문장전(gate)·마왕전(demon)·진엔딩(ending)
   — 들판 곡은 페이즈 유형별 변주(전투형 빠르게·톱니파, 기믹형 삼각파), 예고 구간 진입 시 예고음
   ============================================================ */
const AU = { ctx: null, master: null, sfxG: null, bgmG: null, noise: null, last: {}, song: null, var: '', step: 0, nextT: 0, timer: 0, duck: 1, prevGap: null };
function auInit() {
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume().catch(() => { }); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  try {
    const c = AU.ctx = new AC();
    AU.master = c.createGain(); AU.master.gain.value = 0.9; AU.master.connect(c.destination);
    AU.sfxG = c.createGain(); AU.sfxG.connect(AU.master);
    AU.bgmG = c.createGain(); AU.bgmG.connect(AU.master);
    const n = c.createBuffer(1, c.sampleRate * 0.6, c.sampleRate), d = n.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    AU.noise = n; auVol();
    AU.timer = setInterval(auSched, 60);
  } catch (e) { AU.ctx = null; }
}
['pointerdown', 'touchstart', 'keydown', 'click'].forEach(ev => window.addEventListener(ev, auInit, { passive: true }));
function auVol() {
  if (!AU.ctx) return;
  const t = AU.ctx.currentTime;
  AU.sfxG.gain.setTargetAtTime(0.5 * (SETTINGS.sfx / 100) ** 1.5, t, 0.03);
  AU.bgmG.gain.setTargetAtTime(0.32 * (SETTINGS.bgm / 100) ** 1.5 * AU.duck, t, 0.15);
}
const NOTE_I = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
function nf(s) { const m = /^([A-G]#?)(-?\d)$/.exec(s); return m ? 440 * 2 ** ((NOTE_I[m[1]] + (+m[2] + 1) * 12 - 69) / 12) : 0; }
/* 음 하나: 파형·주파수·시작·길이·음량·주파수 끝값 */
function tone(dest, wave, f, t, dur, vol, f2) {
  const c = AU.ctx, o = c.createOscillator(), g = c.createGain();
  o.type = wave; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.02);
}
function noiseHit(dest, t, dur, vol, hp) {
  const c = AU.ctx, s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
  s.buffer = AU.noise; f.type = 'highpass'; f.frequency.value = hp || 800;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(dest); s.start(t, Math.random() * 0.3); s.stop(t + dur + 0.02);
}
/* ---------- 효과음 ---------- */
const SFX = {
  hit: { gap: 0.045, f: (d, t) => { noiseHit(d, t, 0.05, 0.22, 2200); tone(d, 'square', 520, t, 0.04, 0.08, 260); } },
  kill: { gap: 0.05, f: (d, t) => { tone(d, 'square', 300, t, 0.09, 0.12, 90); noiseHit(d, t, 0.07, 0.12, 600); } },
  gem: { gap: 0.06, f: (d, t) => { const b = 1200 + (AU.gemN = ((AU.gemN || 0) + 1) % 8) * 60; tone(d, 'square', b, t, 0.05, 0.06); } },
  hurt: { gap: 0.15, f: (d, t) => { tone(d, 'sawtooth', 220, t, 0.18, 0.22, 70); noiseHit(d, t, 0.12, 0.18, 300); } },
  level: { gap: 0.2, f: (d, t) => { ['C5', 'E5', 'G5', 'C6'].forEach((n, i) => tone(d, 'square', nf(n), t + i * 0.06, 0.12, 0.13)); } },
  chest: { gap: 0.3, f: (d, t) => { ['G5', 'B5', 'D6', 'G6', 'B6'].forEach((n, i) => tone(d, 'triangle', nf(n), t + i * 0.05, 0.2, 0.18)); } },
  pick: { gap: 0.05, f: (d, t) => { tone(d, 'square', 880, t, 0.05, 0.08); tone(d, 'square', 1320, t + 0.045, 0.06, 0.08); } },
  ult: { gap: 0.3, f: (d, t) => { tone(d, 'sawtooth', 160, t, 0.45, 0.2, 900); noiseHit(d, t, 0.4, 0.15, 400); } },
  boss: { gap: 1, f: (d, t) => { tone(d, 'sawtooth', 110, t, 0.9, 0.24, 55); tone(d, 'square', 82, t + 0.2, 0.9, 0.16, 41); noiseHit(d, t, 0.8, 0.12, 120); } },
  bossdie: { gap: 1, f: (d, t) => { for (let i = 0; i < 6; i++) noiseHit(d, t + i * 0.11, 0.2, 0.22, 200 + i * 150); ['E5', 'G5', 'C6', 'E6'].forEach((n, i) => tone(d, 'square', nf(n), t + 0.7 + i * 0.1, 0.25, 0.14)); } },
  preview: { gap: 1, f: (d, t) => { ['A4', 'D5', 'A5'].forEach((n, i) => tone(d, 'triangle', nf(n), t + i * 0.12, 0.3, 0.16)); } },
  start: { gap: 1, f: (d, t) => { tone(d, 'square', nf('G4'), t, 0.1, 0.12); tone(d, 'square', nf('C5'), t + 0.1, 0.25, 0.14); } },
  dead: { gap: 1, f: (d, t) => { ['E4', 'D#4', 'D4', 'C#4'].forEach((n, i) => tone(d, 'square', nf(n), t + i * 0.22, 0.3, 0.14)); } },
  clear: { gap: 1, f: (d, t) => { ['C5', 'E5', 'G5', 'C6', 'G5', 'C6'].forEach((n, i) => tone(d, 'square', nf(n), t + i * 0.1, i > 4 ? 0.5 : 0.12, 0.13)); } },
  ui: { gap: 0.05, f: (d, t) => tone(d, 'square', 660, t, 0.04, 0.07) },
};
function sfx(k) {
  if (!AU.ctx || !SETTINGS.sfx || AU.ctx.state !== 'running') return;
  const S = SFX[k], now = AU.ctx.currentTime; if (!S) return;
  if (now - (AU.last[k] || -9) < S.gap) return; AU.last[k] = now;
  try { S.f(AU.sfxG, now + 0.005); } catch (e) { }
}
/* ---------- 배경음 (8분음표 단위 문자열 악보, '-' 지속 · '.' 쉼표) ---------- */
const SONGS = {
  title: { bpm: 96, tr: [
    { w: 'triangle', v: 0.16, n: 'A4 C5 E5 C5 A4 C5 E5 C5 F4 A4 C5 A4 F4 A4 C5 A4 G4 C5 E5 C5 G4 C5 E5 C5 G#4 B4 E5 B4 G#4 B4 E5 B4 A4 C5 E5 C5 A4 C5 E5 C5 F4 A4 C5 A4 F4 A4 C5 A4 G4 C5 E5 C5 G4 C5 E5 C5 G#4 B4 E5 B4 G#4 B4 E5 B4' },
    { w: 'square', v: 0.07, n: '. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . E5 - - D5 C5 - B4 - A4 - - - C5 - - - G4 - C5 - E5 - G5 - E5 - - - - - . .' },
    { w: 'triangle', v: 0.2, n: 'A2 - - - - - - - F2 - - - - - - - C3 - - - - - - - E2 - - - - - - -' },
  ] },
  field: { bpm: 132, tr: [
    { w: 'square', v: 0.075, n: 'E5 . G5 . C6 - G5 E5 D5 . G5 . B5 - A5 G5 C5 . E5 . A5 - G5 E5 F5 - A5 - G5 - E5 D5 E5 . G5 . C6 - D6 E6 D6 - B5 - G5 - A5 B5 C6 - A5 F5 G5 - E5 C5 D5 - - - G4 . . .' },
    { w: 'triangle', v: 0.22, n: 'C3 . C3 G2 C3 . G2 . G2 . G2 D3 G2 . D3 . A2 . A2 E3 A2 . E3 . F2 . F2 C3 F2 . C3 . C3 . C3 G2 C3 . G2 . G2 . G2 D3 G2 . D3 . F2 . F2 C3 F2 . C3 . G2 . G2 D3 G2 . B2 .' },
    { d: 'k . h . s . h h' },
  ] },
  gate: { bpm: 150, tr: [
    { w: 'square', v: 0.075, n: 'B4 - E5 - G5 - F#5 E5 D5 - - B4 C5 - D5 - E5 - G5 - B5 - A5 G5 F#5 - D5 - E5 - - - G5 - F#5 - E5 - D5 - C5 - D5 - E5 - B4 - E5 - G5 - B5 - C6 B5 A5 - F#5 - E5 - - -' },
    { w: 'triangle', v: 0.24, n: 'E2 E2 E3 E2 E2 E2 D3 E2 C2 C2 C3 C2 D2 D2 D3 D2 E2 E2 E3 E2 E2 E2 D3 E2 D2 D2 D3 D2 B1 B1 B2 B1 E2 E2 E3 E2 E2 E2 D3 E2 C2 C2 C3 C2 D2 D2 D3 D2 E2 E2 E3 E2 E2 E2 D3 E2 B1 B1 B2 B1 B1 B1 D#2 B1' },
    { d: 'k h s h k k s h' },
  ] },
  demon: { bpm: 160, tr: [
    { w: 'sawtooth', v: 0.05, n: 'D5 - A4 - D5 - F5 - E5 - C#5 - A4 - - - D5 - F5 - A5 - G5 F5 E5 - - - C#5 - - - F5 - E5 - D5 - C5 - A#4 - C5 - D5 - A4 - D5 - F5 - A5 - D6 - C#6 - A5 - E5 - - -' },
    { w: 'triangle', v: 0.25, n: 'D2 D2 D3 D2 D2 D2 D3 D2 A1 A1 A2 A1 A1 A1 C#2 A1 D2 D2 D3 D2 D2 D2 D3 D2 A1 A1 A2 A1 C#2 C#2 E2 C#2 A#1 A#1 A#2 A#1 A#1 A#1 A#2 A#1 G1 G1 G2 G1 A1 A1 A2 A1 D2 D2 D3 D2 A#1 A#1 A#2 A#1 A1 A1 A2 A1 C#2 E2 A2 C#3' },
    { d: 'k h s k k h s h' },
  ] },
  ending: { bpm: 84, tr: [
    { w: 'triangle', v: 0.17, n: 'A4 - C5 - F5 - - - E5 - D5 - C5 - - - A#4 - D5 - F5 - - - E5 - - - - - . . A4 - C5 - F5 - A5 - G5 - F5 - E5 - C5 - D5 - A#4 - C5 - E5 - F5 - - - - - - -' },
    { w: 'square', v: 0.04, n: 'F4 A4 C5 A4 F4 A4 C5 A4 C4 E4 G4 E4 C4 E4 G4 E4 A#3 D4 F4 D4 A#3 D4 F4 D4 C4 E4 G4 E4 C4 E4 G4 E4' },
    { w: 'triangle', v: 0.2, n: 'F2 - - - - - - - C2 - - - - - - - A#1 - - - - - - - C2 - - - - - - -' },
  ] },
};
for (const S of Object.values(SONGS)) for (const t of S.tr) { if (t.n) t.seq = t.n.split(' '); if (t.d) t.seq = t.d.split(' '); }
function auSched() {
  if (!AU.ctx || AU.ctx.state !== 'running') return;
  const want = auWantSong(), c = AU.ctx;
  if (want.id !== AU.song || want.v !== AU.var) {
    const fresh = want.id !== AU.song; AU.song = want.id; AU.var = want.v;
    if (fresh) { AU.step = 0; AU.nextT = c.currentTime + 0.1; }
  }
  const duck = STATE.mode === 'pause' ? 0.35 : 1; if (duck !== AU.duck) { AU.duck = duck; auVol(); }
  const S = SONGS[AU.song]; if (!S || !SETTINGS.bgm) { AU.nextT = c.currentTime + 0.1; return; }
  const bpm = S.bpm * (AU.var === 'battle' ? 1.12 : 1), dt = 30 / bpm;
  if (AU.nextT < c.currentTime - 0.5) AU.nextT = c.currentTime + 0.05;   // 백그라운드 복귀 시 밀린 음 생략
  while (AU.nextT < c.currentTime + 0.25) {
    for (const t of S.tr) {
      const L = t.seq.length, tok = t.seq[AU.step % L];
      if (t.d) {
        const T = AU.nextT;
        if (tok === 'k') tone(AU.bgmG, 'sine', 150, T, 0.12, 0.5, 45);
        else if (tok === 's') noiseHit(AU.bgmG, T, 0.1, 0.32, 1200);
        else if (tok === 'h') noiseHit(AU.bgmG, T, 0.03, 0.12, 6000);
        continue;
      }
      if (tok === '-' || tok === '.') continue;
      let len = 1; while (t.seq[(AU.step + len) % L] === '-' && len < 8) len++;
      let w = t.w; if (t === S.tr[0] && AU.song === 'field') w = AU.var === 'battle' ? 'sawtooth' : AU.var === 'gimmick' ? 'triangle' : w;
      tone(AU.bgmG, w, nf(tok), AU.nextT, len * dt * 0.92, t.v * (w === 'triangle' && t.w !== 'triangle' ? 2 : 1));
    }
    AU.step++; AU.nextT += dt;
  }
}
function auWantSong() {
  if (UI && UI.querySelector && UI.querySelector('.ending')) return { id: 'ending', v: '' };
  if (STATE.mode === 'title' || STATE.mode === 'result' || !G || !G.ph) return { id: 'title', v: '' };
  const ph = G.ph;
  if (!ph.inGap && ph.id === 'demon') return { id: 'demon', v: '' };
  if (!ph.inGap && ph.id === 'gate') return { id: 'gate', v: '' };
  const P = curPhase(), ty = !ph.inGap && P ? P.type : '';
  return { id: 'field', v: ty === '전투형' ? 'battle' : ty === '기믹형' ? 'gimmick' : '' };
}
/* 판 진행 중 상태 변화 감지 (매 프레임): 예고 구간 진입 예고음 · 페이즈 시작음 */
function auWatch() {
  if (!AU.ctx || !G || !G.ph || STATE.mode !== 'play') return;
  const ph = G.ph, k = ph.i + ':' + ph.inGap;
  if (k !== AU.prevGap) { if (AU.prevGap !== null) sfx(ph.inGap ? (ph.order[ph.i + 1] ? 'preview' : '') : 'start'); AU.prevGap = k; }
}
