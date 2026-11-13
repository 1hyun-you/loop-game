/* ============================================================
   0.44 연성 재구현 (회차 51 확정, 표현·보강 단계)
   • 연성 무기 90종 개별 정의 (직업 기본 무기 10 × 짝 무기 9)
   • 변화 방식 2종: 무기 결합(기본 무기와 합쳐짐) / 직업 변화(직업 특성에 맞는 형태로 변신)
   • 짝 무기 특징은 직업 세계관으로 번역, 조합별 고유 이름·효과·수치
   • 0.43 직업 방식 덧씌우기(fuseFire43) 폐지 · 피해 = 초안 수치 × 짝 무기 성장 배율 × 연성 배율
   • 재사용 = 초안 재사용 × 짝 무기 재사용 감소 비율 · 범위 = 초안 범위 × 짝 무기 범위 배율
   • 연출은 임시 도형 (최종본 아님, 시험 확인 후 GPT 요청 대상)
   ============================================================ */
const K44 = 1.25;   // 연성 배율 (마감 단계 조정 대상)
/* 조합별 보정 배율 (0.44 첫 시험 피해 분산 기준, 단일 대상형 상향·광역형 하향, 상한 4) */
const M44 = {"warrior": {"shield": 1.22, "slam": 0.65, "arrow": 2.38, "trap": 2.5, "shuriken": 3.02, "fireball": 0.65, "icering": 0.86, "orb": 3.92, "beam": 1.31}, "rogue": {"cleave": 3.64, "shield": 3.25, "slam": 1.62, "arrow": 2.9, "trap": 3.76, "fireball": 1.85, "icering": 3.1, "orb": 4.0, "beam": 3.58}, "sovereign": {"cleave": 1.18, "slam": 1.08, "arrow": 2.48, "trap": 1.67, "shuriken": 2.78, "fireball": 1.24, "icering": 1.45, "orb": 3.6, "beam": 1.98}, "archer": {"cleave": 6.0, "shield": 2.71, "slam": 2.35, "trap": 4.71, "shuriken": 6.0, "fireball": 2.92, "icering": 2.86, "orb": 6.0, "beam": 6.0}, "engineer": {"cleave": 1.41, "shield": 1.29, "slam": 0.86, "arrow": 4.0, "shuriken": 4.0, "fireball": 1.18, "icering": 1.49, "orb": 4.0, "beam": 0.89}, "chrono": {"cleave": 1.08, "shield": 1.19, "slam": 0.79, "arrow": 1.57, "trap": 2.06, "shuriken": 3.09, "fireball": 0.79, "orb": 2.87, "beam": 1.73}, "mage": {"cleave": 1.29, "shield": 1.7, "slam": 1.1, "arrow": 4.0, "trap": 2.2, "shuriken": 2.09, "icering": 3.56, "orb": 2.65, "beam": 2.23}, "summoner": {"cleave": 1.16, "shield": 1.32, "slam": 0.86, "arrow": 3.17, "trap": 2.36, "shuriken": 2.72, "fireball": 1.65, "icering": 1.25, "orb": 2.05}, "priest": {"cleave": 2.28, "shield": 3.13, "slam": 1.14, "arrow": 4.0, "trap": 4.0, "shuriken": 4.0, "fireball": 1.86, "icering": 2.11, "beam": 2.27}, "druid": {"cleave": 0.82, "shield": 0.8, "arrow": 1.12, "trap": 1.0, "shuriken": 1.5, "fireball": 0.71, "icering": 0.71, "orb": 1.35, "beam": 1.12}};
/* [짝 무기, 이름, 효과, 수치, 방식] — 대시보드 F90과 동일 원본 */
const F44 = {
  warrior: [['shield', '방패 돌격', '방패를 들고 전방 80 돌진해 들이받아 밀침, 돌진 직후 받는 피해 -40%, 들이받을 때 투지 +8', '돌격 32 · 재사용 2.5초', '직업'], ['slam', '대지 가르기', '베기 2연타 후 3타째 대검을 땅에 내리꽂아 원형 충격파', '베기 22 · 충격파 45 · 반경 130', '결합'], ['arrow', '거신 투창', '거대한 창을 던져 직선 관통, 투지 최대 시 2자루 동시 투척', '투창 30 · 관통 4 · 재사용 1.6초', '직업'], ['trap', '투지 각인', '피격된 자리와 발밑에 투지 각인이 남고, 적이 밟으면 저장 피해를 실어 폭발 (최대 4)', '폭발 30 + 저장 피해 30% · 반경 60', '직업'], ['shuriken', '회전 도끼', '양손 도끼를 던져 적 사이 4회 튕김', '도끼 26', '직업'], ['fireball', '분노 폭발', '투지 25가 쌓일 때마다 몸에서 화염 폭발, 격노 중 1.5초마다 범위 2배 폭발', '폭발 40 · 반경 90', '직업'], ['icering', '서릿발 함성', '함성이 냉기 파동으로 퍼져 둔화, 최대 반경 둔화 적 파쇄', '함성 24 · 파쇄 35 · 재사용 2.4초', '직업'], ['orb', '전사의 혼', '투지 30당 전사 혼령 1체가 떠올라 적에게 돌진 박치기 (최대 3)', '혼령 26', '직업'], ['beam', '거신 일격선', '베기 2연타 후 3타째 대검을 내질러 전방으로 검광이 0.5초간 뻗어 관통', '베기 22 · 길이 240 · 0.1초마다 9', '결합']],
  rogue: [['cleave', '그림자 습격', '분신이 가까운 적 뒤로 순간 이동해 단검 2연 베기, 플레이어 앞쪽 분신도 동시 베기', '베기 18 × 2 · 재사용 1.4초', '직업'], ['shield', '연막탄', '연막 폭발로 주변 적 밀침, 연막 1초 동안 피격 50% 회피', '연막 22 · 밀침 260', '직업'], ['slam', '낙하 수리검', '튕김 마지막에 하늘로 솟았다 내리꽂혀 원형 충격', '수리검 12 · 충격 34 · 반경 90', '결합'], ['arrow', '관통 표창', '튕김 대신 고속 직선 표창 3발 관통, 분신도 동일 발사', '표창 14 · 관통 3', '결합'], ['trap', '마름쇠 살포', '수리검이 지나간 자리마다 마름쇠, 밟은 적 출혈 폭발 (최대 10)', '수리검 12 · 마름쇠 16', '결합'], ['fireball', '화약 주머니', '화약 주머니를 던져 폭발, 분신도 1개 투척', '폭발 24 · 반경 55', '직업'], ['icering', '그림자 결계', '발밑 그림자가 고리로 퍼져 둔화, 고리 끝 적 0.6초 속박', '결계 16', '직업'], ['orb', '추적 그림자검', '다음 튕김 대상을 자동 유도하는 수리검 2개, 튕김 6회', '수리검 12 · 튕김 6', '결합'], ['beam', '그림자 선', '튕긴 경로 전체가 0.6초간 그림자 선으로 남아 닿은 적 지속 피해', '수리검 12 · 0.1초마다 6', '결합']],
  sovereign: [['cleave', '근위 검열', '충격과 동시에 근위병이 전방 부채꼴 일제 베기', '충격 22 · 베기 20 × 근위병 수', '결합'], ['slam', '왕의 진격', '충격 후 근위병이 방패로 땅을 내려찍어 2차 원형 충격', '충격 22 · 2차 34 · 반경 120', '결합'], ['arrow', '궁수대 사격', '밀려난 적에게 근위병 뒤 궁수대가 화살 6발 일제 사격', '충격 22 · 화살 14 × 6', '직업'], ['trap', '왕실 방책', '충격 자리 좌우에 방책 2개 설치, 접근한 적을 반복해 밀쳐내며 피해 (6초 유지)', '충격 22 · 방책 22', '직업'], ['shuriken', '방패 투척', '근위병이 방패를 던져 적 사이 3회 튕김', '충격 22 · 방패 26', '결합'], ['fireball', '왕실 포격', '충격으로 밀려난 적 위치에 포격 3발 낙하 폭발', '충격 22 · 포격 28 × 3 · 반경 55', '직업'], ['icering', '얼음 성벽', '충격이 얼음 고리로 퍼져 둔화, 0.3초 뒤 더 넓은 냉기 2차 고리', '충격 22 · 냉기 16', '결합'], ['orb', '전령 매', '군기(없으면 플레이어)에서 매 2마리가 날아올라 적을 추적해 급강하', '매 20 × 2', '직업'], ['beam', '군기 광휘', '군기 깃대(없으면 플레이어)에서 전방으로 광휘가 0.6초간 뻗어 관통', '충격 22 · 0.1초마다 8', '직업']],
  archer: [['cleave', '갈래 화살', '근거리 적에게 화살 5발 부채꼴 산탄', '화살 12 × 5', '결합'], ['shield', '충격 화살', '명중 지점 충격파로 주변 적 밀침', '충격 22 · 반경 60', '결합'], ['slam', '낙하 화살', '하늘로 쏜 화살이 표식 적 위치에 떨어져 원형 충격', '화살 15 · 충격 36 · 반경 100', '결합'], ['trap', '사냥 덫', '화살과 함께 적 앞에 사냥 덫 설치, 걸린 적 1초 속박 + 표식 2중첩 (최대 6)', '화살 15 · 덫 22', '직업'], ['shuriken', '도탄 화살', '명중 후 다음 적으로 꺾여 3회 연쇄', '화살 15', '결합'], ['fireball', '화염 화살', '명중 지점 폭발', '폭발 26 · 반경 55', '결합'], ['icering', '서리 화살', '명중 지점에서 냉기 고리가 퍼져 둔화', '냉기 18 · 반경 70', '결합'], ['orb', '사냥 매', '매가 적을 추적해 급강하, 명중 시 표식 +1', '매 20', '직업'], ['beam', '충전 일격', '집중 5단계 시 충전 화살이 화면 끝까지 직선 관통, 그 외에는 일반 화살', '충전 60 · 화살 15', '결합']],
  engineer: [['cleave', '회전 칼날 덫', '밟으면 칼날이 회전하며 주변을 1.5초간 벰', '0.25초마다 12', '결합'], ['shield', '반발판', '밟으면 강한 반발로 주변 적을 날려보냄', '반발 30 · 밀침 400', '결합'], ['slam', '압착 지뢰', '밟으면 무거운 추가 떨어져 원형 충격', '충격 40 · 반경 110', '결합'], ['arrow', '석궁 포대', '설치된 석궁 포대가 6초간 근처 적에게 1초마다 화살 자동 발사', '화살 14', '직업'], ['shuriken', '톱날 덫', '밟으면 톱날이 튀어나와 적 사이 4회 튕김', '톱날 16', '결합'], ['fireball', '소이 지뢰', '폭발 후 화염 장판 2초', '폭발 28 · 장판 0.4초마다 8', '결합'], ['icering', '냉각 덫', '밟으면 냉기 고리 확산, 둔화', '냉기 22 · 반경 80', '결합'], ['orb', '추적 드론', '덫이 터지면 드론 2기가 날아가 적 추적', '드론 20 × 2', '직업'], ['beam', '레이저 울타리', '말뚝을 설치해 가까운 말뚝끼리 레이저 선으로 연결, 지나는 적 지속 피해 (8초)', '0.1초마다 6', '직업']],
  chrono: [['cleave', '멈춘 칼날', '고리 바깥에서 시간이 멈춰 있던 칼날이 부채꼴로 베기 재생', '냉기 8 · 칼날 24', '직업'], ['shield', '시간 역류', '고리 확산 시 적을 바깥으로 밀어냄', '역류 20 · 밀침 220', '직업'], ['slam', '시간 붕괴', '고리 안 적을 0.8초 정지, 1초 뒤 그 자리에서 원형 충격', '붕괴 36 · 반경 80', '직업'], ['arrow', '정지 화살', '고리 위에 멈춰 있던 화살 8발이 1초 뒤 안쪽으로 일제 사출', '화살 12 × 8', '직업'], ['trap', '시간 균열', '고리 위에 균열 3개, 밟은 적 1.5초 정지', '균열 18', '직업'], ['shuriken', '되감기 칼날', '칼날이 적 사이 튕긴 뒤 0.7초 뒤 되감기 칼날이 역방향으로 재타격', '칼날 14 × 2', '직업'], ['fireball', '지연 폭발', '고리에 닿은 적(최대 5)에 시한 표시, 1.5초 뒤 폭발', '폭발 30 · 반경 50', '직업'], ['orb', '시계추 구체', '시계추 구체 3개가 적 추적, 정지 적 피해 2배', '구체 16 × 3', '직업'], ['beam', '시간 바늘', '바늘 모양 시간선이 1초에 1바퀴 회전, 닿은 적 둔화', '0.1초마다 7', '직업']],
  mage: [['cleave', '화염 채찍', '화염구와 함께 전방 부채꼴로 불길이 휩쓸림', '화염구 12 · 채찍 30', '결합'], ['shield', '원소 보호막', '원소 보호막이 터지며 주변 적 밀침, 속성 순환', '폭발 32 · 밀침 300', '직업'], ['slam', '운석 낙하', '화염구가 공중에서 운석으로 떨어져 원형 충격 + 화염 장판', '운석 45 · 반경 110', '결합'], ['arrow', '화염 창', '화염구가 가늘고 빠른 화염 창으로 직선 관통', '창 24 · 관통 3', '결합'], ['trap', '화염 룬', '착탄 자리에 룬이 남고 밟으면 재폭발', '폭발 12 · 룬 26', '결합'], ['shuriken', '튕기는 불덩이', '불덩이가 3회 튕기며 매번 폭발', '폭발 18', '결합'], ['icering', '증기 폭발', '착탄 시 냉기로 둔화, 이미 둔화된 적이 있으면 증기 대폭발', '화염구 12 · 증기 40 · 반경 80', '결합'], ['orb', '원소 정령', '정령 3체가 적 추적해 폭발, 정령마다 속성 순환', '정령 22 × 3', '직업'], ['beam', '화염 광선', '화염 광선 0.6초 관통, 끝 지점 불길', '0.1초마다 9 · 불길 6', '결합']],
  summoner: [['cleave', '망령 낫', '망령이 영혼 낫으로 부채꼴 베기', '낫 22 × 망령 수', '직업'], ['shield', '영혼 결계', '짧은 광선 끝에 결계가 생겨 적 밀침', '광선 7 · 결계 26 · 밀침 260', '직업'], ['slam', '망령 강림', '광선 끝 지점에 망령이 내리꽂혀 원형 충격', '강림 36 · 반경 100', '직업'], ['arrow', '영혼 화살', '광선이 영혼 화살 5발로 쪼개져 사출', '화살 12 × 5', '결합'], ['trap', '원혼 무덤', '광선 지나간 자리에 무덤 3개, 밟은 적 1초 속박', '광선 7 · 무덤 20', '직업'], ['shuriken', '떠도는 영혼', '광선 끝에서 영혼이 다음 적으로 4회 튕김', '광선 7 · 영혼 16', '직업'], ['fireball', '도깨비불', '광선 끝에서 도깨비불 폭발', '폭발 28 · 반경 55', '직업'], ['icering', '냉혼 파동', '망령 주변으로 원혼 냉기 파동, 둔화', '파동 18 × 망령 수', '직업'], ['orb', '영혼 추적광', '망령마다 가장 가까운 적에게 광선', '0.1초마다 6 × 망령 수', '직업']],
  priest: [['cleave', '성검 심판', '성물이 성검으로 변해 부채꼴 심판 베기', '심판 24', '직업'], ['shield', '성역 결계', '구체 명중 시 신성 결계로 적 밀침, 체력 2 회복', '결계 22 · 회복 2', '직업'], ['slam', '심판 낙하', '구체가 하늘에서 내리꽂혀 원형 신성 충격', '충격 36 · 반경 100', '결합'], ['arrow', '빛의 화살', '성물이 빛 화살 3발 사출', '화살 14 × 3', '결합'], ['trap', '축복 표지', '명중 자리에 표지, 적이 밟으면 피해·플레이어가 밟으면 회복', '표지 20 · 회복 3', '직업'], ['shuriken', '순례 구체', '적 사이 4회 튕기며 튕길 때마다 체력 1 회복', '구체 16', '직업'], ['fireball', '정화의 불', '추적 구체가 명중 시 성화 폭발', '폭발 28 · 반경 55', '결합'], ['icering', '고요의 후광', '주변 냉기 후광, 둔화', '후광 16 · 반경 90', '직업'], ['beam', '천상 광선', '성물에서 광선 0.6초 관통', '0.1초마다 9', '직업']],
  druid: [['cleave', '곰발톱 강타', '곰이 부채꼴 할퀴기 2연타 후 3타째 내려찍기 충격파', '할퀴기 22 · 충격파 40', '직업'], ['shield', '바위 껍질', '강타 시 바위 등껍질이 솟아 주변 적을 크게 밀침, 근접일수록 피해 증가, 받는 피해 감소', '피해 34 (근접 최대 1.6배)', '직업'], ['arrow', '가시 분출', '강타 지점에서 가시 덩굴 6방향 직선 분출', '충격파 26 · 가시 14 × 6', '직업'], ['trap', '덩굴 올무', '강타 자리 둘레에 덩굴 덫 4개, 밟으면 1초 속박 후 터짐', '충격파 26 · 덫 24', '직업'], ['shuriken', '사냥 무리 도약', '충격파 직후 늑대가 적 사이를 4회 연쇄 도약하며 물어뜯음', '물기 20 (회당 -10%)', '직업'], ['fireball', '화산 강타', '균열에서 용암 덩이 3개가 솟아 주변 적에 떨어져 폭발', '용암 30 × 3 · 반경 55', '결합'], ['icering', '서리 대지', '충격파가 서리 2겹으로 확산, 둔화, 바깥 둔화 적 파쇄', '충격파 26 · 파쇄 35', '결합'], ['orb', '정령 반딧불', '강타마다 숲 정령 3개가 떠올라 적 추적', '정령 18 × 3', '직업'], ['beam', '대지 균열선', '곰 강타 방향으로 땅이 직선 0.6초간 갈라지며 관통 지속 피해', '길이 260 · 0.1초마다 8', '직업']],
};
const F44M = {}; for (const j in F44) { F44M[j] = {}; for (const r of F44[j]) F44M[j][r[0]] = { nm: r[1], ds: r[2], num: r[3], mode: r[4] }; }
const fu44 = (j, id) => F44M[j] && F44M[j][id];
const fsrc = (j, id) => 'fu_' + j + '_' + id;
/* 피해원 이름·분류 (직업 규칙 연동: 전사 근접 투지 등) */
const CAT44 = { warrior: 'melee', rogue: 'ranged', sovereign: 'melee', archer: 'ranged', engineer: 'ranged', chrono: 'magic', mage: 'magic', summoner: 'magic', priest: 'magic', druid: 'melee' };
const SRC44 = {}; for (const j in F44) for (const r of F44[j]) { SRC44[fsrc(j, r[0])] = r[1]; SRC_CAT[fsrc(j, r[0])] = CAT44[j]; }
const _srcName44 = srcName; srcName = k => SRC44[k] || _srcName44(k);
fuseName = (j, id) => (fu44(j, id) || { nm: JOB43[j].pre + ' ' + WEAPONS[id].name }).nm;

/* ---------- 공용 부품 ---------- */
const F44S = () => G.f44 || (G.f44 = { lines: [], traps: [], nodes: [], hurtT: 0, fury: 0, rageT: 0 });
const nonBoss = e => !e.cmd && !e.boss;
function later44(t, f) { G.later.push({ t, f: () => { if (!G.result) f(); } }); }
function hitC(x, y, R, dmg, src, o = {}) {
  let n = 0;
  gridQuery(x, y, R, e => {
    let d = dmg; if (o.near) d *= 1 + o.near * (1 - Math.sqrt(dist2(e.x, e.y, x, y)) / R);
    if (o.slow) e.slowT = Math.max(e.slowT || 0, o.slow);
    if (o.frz && nonBoss(e)) e.frz = Math.max(e.frz || 0, o.frz);
    if (o.on) o.on(e);
    damageEnemy(e, d, { src, kb: o.kb || 0, fx: x, fy: y }); n++;
  });
  const rogueArt = ROGUE_RINGS[src], archerArt = ARCHER_RINGS[src];
  const summonerArt = SUMMONER_IMPACT_ART[src], priestArt = PRIEST_IMPACT_ART[src];
  const druidArt = o.druidArt || DRUID_IMPACT_ART[src];
  fx({ kind: 'ring', x, y, ...(druidArt ? { druidArt } : {}), ...(rogueArt ? { rogueArt } : {}), ...(archerArt ? { archerArt } : {}), engineerArt: ENGINEER_IMPACT_ART[src], ...(priestArt ? { priestArt } : {}), ...(summonerArt ? { summonerArt, summonerAngle: o.summonerAngle } : {}), ...(o.mageArt ? { mageArt: o.mageArt, mageKind: o.mageKind, mageAngle: o.mageAngle } : {}), ...(o.chronoArt ? { chronoArt: o.chronoArt, chronoKind: o.chronoKind } : {}), r0: R * (o.r0 || 0.3), r1: R, dur: o.dur || 0.3, color: o.col || '#fff', fill: o.fill !== false, ...(o.sovereignArt ? { sovereignArt: o.sovereignArt, sovereignAngle: o.sovereignAngle } : {}), ...(o.warArt ? { warArt: o.warArt, warAngle: o.warAngle } : {}) });
  return n;
}
function fan44(x, y, a0, arc, R, dmg, src, kb, col, rogueCut, druidReverse) {
  gridQuery(x, y, R, e => { let da = Math.atan2(e.y - y, e.x - x) - a0; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) <= arc / 2 + 0.15) damageEnemy(e, dmg, { src, kb, fx: x, fy: y }); });
  const warArt = src === 'fu_warrior_slam' ? 'slam' : src === 'fu_warrior_beam' ? 'beam' : null;
  const sovereignArt = src === 'fu_sovereign_cleave' ? 'guard-cleave' : null;
  const warSweep = warArt && (!G.afx || G.afx.length < 120);
  const rogueSweep = src === 'fu_rogue_cleave' && (!G.afx || G.afx.length < 120);
  const chronoArt = src === 'fu_chrono_cleave' ? 'frozen-blade' : null;
  const mageArt = src === 'fu_mage_cleave' ? 'flame-whip' : null;
  const summonerArt = src === 'fu_summoner_cleave' ? 'scythe' : null;
  const priestArt = src === 'fu_priest_cleave' ? 'sword' : null;
  const druidArt = src === 'fu_druid_cleave' ? 'paw' : null;
  afx({ k: 'thrust', x, y, a: a0, L: R * 0.9, wd: R * 0.35, dur: 0.18, col,
    ...(sovereignArt ? { sovereignArt } : {}), ...(warSweep ? { warArt, arc, r: R } : {}), ...(rogueSweep ? { rogueArt: 'cleave', arc, r: R, rogueCut } : {}), ...(chronoArt ? { chronoArt } : {}), ...(mageArt && G.fx.length < 220 ? { mageArt } : {}),
    ...(summonerArt && G.fx.length < 220 ? { summonerArt } : {}),
    ...(priestArt && G.fx.length < 220 ? { priestArt } : {}),
    ...(druidArt && G.fx.length < 220 ? { druidArt } : {}) });
  fx({ kind: 'ring', x, y, r0: R * 0.6, r1: R, dur: 0.16, color: col, ...(sovereignArt ? { sovereignArt, sovereignAngle: a0, sovereignArc: arc } : {}), ...(warSweep ? { warArt, warSweep: true } : {}), ...(rogueSweep ? { rogueArt: 'cleave' } : {}), ...(chronoArt ? { chronoArt, chronoKind: 'cleave', chronoAngle: a0, chronoArc: arc } : {}), ...(mageArt ? { mageArt, mageKind: 'whip', mageAngle: a0, mageArc: arc + .30 } : {}),
    ...(summonerArt ? { summonerArt, summonerAngle: a0, summonerArc: arc + .30 } : {}),
    ...(priestArt ? { priestArt, priestAngle: a0, priestArc: arc + .30 } : {}),
    ...(druidArt ? { druidArt, druidAngle: a0, druidArc: arc + .30, druidReverse } : {}) });
}
const angTo = (x, y, R = 420) => { const t = nearestEnemy(x, y, R); return t ? Math.atan2(t.y - y, t.x - x) : Math.atan2(G.p.face.y, G.p.face.x); };
function line44(o) { const L = F44S().lines; if (L.length < 40) L.push(Object.assign({ t: 0, tk: 0, wd: 10, tick: 0.1, rot: 0 }, o)); }
function trap44(o) {
  const T = F44S().traps, same = T.filter(t => t.tag === o.tag && !t.dead);
  if (o.max && same.length >= o.max) same[0].dead = true;
  T.push(Object.assign({ t: 0, arm: 0.35, r: 14, life: 20, uses: 1, cdT: 0 }, o));
}
const pr44 = o => shoot(Object.assign({ kind: 'arrow', x: G.p.x, y: G.p.y, sp: 560, r: 5, pierce: 0, life: 1 }, o));
const boltTo = (x, y, a, o) => pr44(Object.assign({ x, y, ang: a }, o));
/* 투사체 착탄 확장: shell 착탄 시 on44 호출 · 튕길 때 on44b 호출 */
const _fireBurst44 = fireBurst;
fireBurst = function (pr) { if (pr.on44) return pr.on44(pr); return _fireBurst44(pr); };
const _bounceProj44 = bounceProj;
bounceProj = function (pr, e) {
  if (pr.on44b && !pr.dead) pr.on44b(pr, e);
  if (pr.src === 'fu_priest_shuriken' && !pr.dead) priestProjectileEcho(pr, 'pilgrim');
  if (pr.src === 'fu_summoner_shuriken') summonerBounceArt(pr, Math.atan2(pr.vy, pr.vx));
  if (pr.src !== 'fu_archer_shuriken' && pr.src !== 'fu_engineer_shuriken') return _bounceProj44(pr, e);
  const angle = Math.atan2(pr.vy, pr.vx), result = _bounceProj44(pr, e);
  if (pr.src === 'fu_archer_shuriken') archerBounceArt(pr, angle);
  else engineerSawBounce(pr, angle);
  return result;
};
/* 기준점: 근위병·망령·곰·성물 */
const gdPts = () => { const J = J41(); return G.banner && J.gd.length ? J.gd.map(g => ({ x: g.x, y: g.y })) : formation(); };
const ghostPts = () => { const f = F43(); return f.wr.length ? f.wr : [G.p]; };
const bearPt = () => (G.pets || []).find(m => m.kind === 'bear') || G.p;
const combo = (w, n = 3) => (w.c44 = (w.c44 || 0) % n + 1);

/* ---------- 연성 무기 90종 ---------- */
const FU44 = {
  warrior: {
    shield: { cd: 2.5, f(Z) { const p = G.p, a = angTo(p.x, p.y, 260); startWarriorShieldArt(a); for (let i = 1; i <= 4; i++) later44(i * 0.035, () => { p.x += Math.cos(a) * 20; p.y += Math.sin(a) * 20; }); later44(0.16, () => { if (hitC(p.x + Math.cos(a) * 30, p.y + Math.sin(a) * 30, 70 * Z.a, Z.d(32), Z.src, { kb: 300, col: Z.col, warArt: 'shield', warAngle: a })) p.fury = Math.min(100, (p.fury || 0) + 8); G.tm.wall = Math.max(G.tm.wall || 0, 0.8); }); } },
    slam: { cd: 0.9, f(Z) { const p = G.p; if (combo(Z.w) < 3) return fan44(p.x, p.y, angTo(p.x, p.y, 200), 1.9, 86 * Z.a, Z.d(22), Z.src, 180, Z.col); hitC(p.x, p.y, 130 * Z.a, Z.d(45), Z.src, { kb: 220, col: '#d8b080', warArt: 'slam' }); shake(3, 0.2); } },
    arrow: { cd: 1.6, f(Z) { const a = angTo(G.p.x, G.p.y, 520), n = G.p.fury >= 100 ? 2 : 1; for (let i = 0; i < n; i++) pr44({ ang: a + (i - (n - 1) / 2) * 0.16, sp: 620, r: 9, dmg: Z.d(30), pierce: 4, life: 0.9, color: Z.col, src: Z.src }); } },
    trap: { cd: 2.0, f(Z) { warMark(Z); } },
    shuriken: { cd: 1.3, f(Z) { pr44({ kind: 'star', ang: angTo(G.p.x, G.p.y), sp: 500, r: 9, dmg: Z.d(26), pierce: 4, life: 1.6, color: Z.col, src: Z.src, bounce: true }); } },
    fireball: { cd: 0.3, f(Z) { const p = G.p, S = F44S(), g = Math.max(0, (p.fury || 0) - S.fury); S.fury = p.fury || 0; S.fGain = (S.fGain || 0) + g; const rage = G.tm.rage > 0;
      if (rage) { if (G.time < S.rageT) return false; S.rageT = G.time + 1.5; } else if (S.fGain < 25) return false; S.fGain = 0;
      hitC(p.x, p.y, 90 * Z.a * (rage ? 2 : 1), Z.d(40), Z.src, { kb: 160, col: '#ff7a3a', warArt: 'fireball' }); } },
    icering: { cd: 2.4, f(Z) { const p = G.p, R = 110 * Z.a; hitC(p.x, p.y, R, Z.d(24), Z.src, { slow: 2, col: '#bfe8ff', warArt: 'icering' }); later44(0.25, () => gridQuery(p.x, p.y, R * 1.15, e => { if (e.slowT > 0 && dist2(e.x, e.y, p.x, p.y) > R * R * 0.45) { damageEnemy(e, Z.d(35), { src: Z.src }); fx({ kind: 'pop', x: e.x, y: e.y, r: 10, color: '#dff4ff', dur: 0.2, warArt: 'icering', warAngle: Math.atan2(e.y - p.y, e.x - p.x) }); } })); } },
    orb: { cd: 1.4, f(Z) { const n = Math.max(1, Math.min(3, Math.floor((G.p.fury || 0) / 30))); for (let i = 0; i < n; i++) pr44({ kind: 'orb', ang: rand(Math.PI * 2), sp: 300, r: 8, dmg: Z.d(26), life: 2.4, color: Z.col, src: Z.src, home: true }); } },
    beam: { cd: 0.9, f(Z) { const p = G.p, a = angTo(p.x, p.y, 260); if (combo(Z.w) < 3) return fan44(p.x, p.y, a, 1.9, 86 * Z.a, Z.d(22), Z.src, 180, Z.col); line44({ x: p.x, y: p.y, a, L: 240 * Z.a, wd: 14, dur: 0.5, dmg: Z.d(9), src: Z.src, col: '#ffe8c0' }); } },
  },
  rogue: {
    cleave: { cd: 1.4, f(Z) { const p = G.p, t = nearestEnemy(p.x, p.y, 300); if (!t) return false; const a = Math.atan2(t.y - p.y, t.x - p.x), bx = t.x + Math.cos(a) * 30, by = t.y + Math.sin(a) * 30;
      fx({ kind: 'pop', x: bx, y: by, r: 14, color: '#203040', dur: 0.3, rogueArt: 'cleave', rogueAngle: a + Math.PI }); for (let i = 0; i < 2; i++) later44(i * 0.12, () => { fan44(bx, by, a + Math.PI, 2.4, 70, Z.d(18), Z.src, 60, Z.col, i ? -1 : 1); fan44(p.x, p.y, a, 1.6, 70, Z.d(18) * 0.6, Z.src, 60, '#203040', i ? 1 : -1); }); } },
    shield: { cd: 2.2, f(Z) { const p = G.p; hitC(p.x, p.y, 90 * Z.a, Z.d(22), Z.src, { kb: 260, col: '#8a96a8' }); G.tm.smoke44 = 1; } },
    slam: { cd: 1.3, f(Z) { const q = pr44({ kind: 'star', ang: angTo(G.p.x, G.p.y), sp: 520, r: 6, dmg: Z.d(12), pierce: 3, life: 1.4, color: Z.col, src: Z.src, bounce: true }); startRogueSlamArt(q); later44(0.7, () => hitC(q.x, q.y, 90 * Z.a, Z.d(34), Z.src, { kb: 120, col: Z.col })); } },
    arrow: { cd: 1.0, f(Z) { const f = F43(), c = f.trail[Math.min(f.trail.length - 1, 6)] || G.p; for (const o of [G.p, c]) { const a = angTo(o.x, o.y); for (let i = -1; i <= 1; i++) boltTo(o.x, o.y, a + i * 0.1, { kind: 'star', sp: 680, r: 5, dmg: Z.d(14), pierce: 3, life: 0.8, color: o === G.p ? Z.col : '#506078', src: Z.src }); } } },
    trap: { cd: 1.1, f(Z) { const q = pr44({ kind: 'star', ang: angTo(G.p.x, G.p.y), sp: 500, r: 6, dmg: Z.d(12), pierce: 3, life: 1.2, color: Z.col, src: Z.src, bounce: true });
      for (const t of [0.2, 0.45, 0.7]) later44(t, () => { if (q.dead && t > 0.2) return; trap44({ tag: Z.src, x: q.x, y: q.y, R: 40, max: 10, kind: 'spike', col: '#8a96a8', on: T => hitC(T.x, T.y, T.R, Z.d(16), Z.src, { col: '#c03040', on: e => { e.bl = 3; e.blD = Z.d(16) * 0.25; } }) }); }); } },
    fireball: { cd: 1.3, f(Z) { const f = F43(), c = f.trail[Math.min(f.trail.length - 1, 8)] || G.p; for (const o of [G.p, c]) boltTo(o.x, o.y, angTo(o.x, o.y), { kind: 'shell', sp: 360, r: 7, dmg: Z.d(24), life: 0.9, src: Z.src, on44: pr => hitC(pr.x, pr.y, 55 * Z.a, pr.dmg, Z.src, { kb: 80, col: '#ffb060' }) }); } },
    icering: { cd: 1.8, f(Z) { const p = G.p, R = 100 * Z.a; hitC(p.x, p.y, R, Z.d(16), Z.src, { slow: 1.5, col: '#304058' }); gridQuery(p.x, p.y, R, e => { if (dist2(e.x, e.y, p.x, p.y) > R * R * 0.55 && nonBoss(e)) e.frz = Math.max(e.frz || 0, 0.6); }); } },
    orb: { cd: 1.1, f(Z) { const a = angTo(G.p.x, G.p.y); for (const d of [-0.3, 0.3]) pr44({ kind: 'star', ang: a + d, sp: 520, r: 6, dmg: Z.d(12), pierce: 6, life: 2, color: Z.col, src: Z.src, bounce: true }); } },
    beam: { cd: 1.4, f(Z) { const q = pr44({ kind: 'star', ang: angTo(G.p.x, G.p.y), sp: 500, r: 6, dmg: Z.d(12), pierce: 3, life: 1.2, color: Z.col, src: Z.src, bounce: true }), pts = [{ x: q.x, y: q.y }];
      for (let i = 1; i <= 6; i++) later44(i * 0.1, () => pts.push({ x: q.x, y: q.y }));
      later44(0.65, () => { for (let i = 0; i < pts.length - 1; i++) { const A = pts[i], B = pts[i + 1], L = Math.hypot(B.x - A.x, B.y - A.y); if (L > 4) line44({ x: A.x, y: A.y, a: Math.atan2(B.y - A.y, B.x - A.x), L, wd: 8, dur: 0.6, dmg: Z.d(6), src: Z.src, col: '#304058' }); } }); } },
  },
  sovereign: {
    cleave: { cd: 2.0, f(Z) { const p = G.p; hitC(p.x, p.y, 82 * Z.a, Z.d(22), Z.src, { kb: 300, col: '#c8d8ff', sovereignArt: 'base-shield', sovereignAngle: Math.atan2(p.face.y, p.face.x) }); for (const q of gdPts()) fan44(q.x, q.y, angTo(q.x, q.y, 200), 1.8, 80 * Z.a, Z.d(20), Z.src, 120, Z.col); } },
    slam: { cd: 2.2, f(Z) { const p = G.p; hitC(p.x, p.y, 82 * Z.a, Z.d(22), Z.src, { kb: 300, col: '#c8d8ff', sovereignArt: 'base-shield', sovereignAngle: Math.atan2(p.face.y, p.face.x) }); if (sovereignArtReady('royal-advance')) for (const q of gdPts()) fx({ kind: 'pop', x: q.x, y: q.y, r: 0, color: Z.col, dur: 0.3, sovereignArt: 'royal-advance', sovereignStage: 'raise' }); later44(0.3, () => { for (const q of gdPts()) fx({ kind: 'pop', x: q.x, y: q.y, r: 12, color: Z.col, dur: 0.25 }); hitC(p.x, p.y, 120 * Z.a, Z.d(34), Z.src, { kb: 160, col: '#d8b080', sovereignArt: 'royal-advance' }); }); } },
    arrow: { cd: 2.0, f(Z) { const p = G.p; hitC(p.x, p.y, 82 * Z.a, Z.d(22), Z.src, { kb: 300, col: '#c8d8ff', sovereignArt: 'base-shield', sovereignAngle: Math.atan2(p.face.y, p.face.x) }); later44(0.25, () => { const bx = p.x - p.face.x * 30, by = p.y - p.face.y * 30, ts = enemiesInRange(p.x, p.y, 420).sort((a, b) => dist2(a.x, a.y, p.x, p.y) - dist2(b.x, b.y, p.x, p.y)).slice(0, 6);
      for (let i = 0; i < 6; i++) { const t = ts[i % Math.max(1, ts.length)]; boltTo(bx + (i - 2.5) * 8, by, t ? Math.atan2(t.y - by, t.x - bx) : angTo(bx, by), { sp: 600, r: 5, dmg: Z.d(14), pierce: 1, life: 0.9, color: Z.col, src: Z.src }); } }); } },
    trap: { cd: 3.0, f(Z) { const p = G.p; hitC(p.x, p.y, 82 * Z.a, Z.d(22), Z.src, { kb: 300, col: '#c8d8ff', sovereignArt: 'base-shield', sovereignAngle: Math.atan2(p.face.y, p.face.x) }); const a = Math.atan2(p.face.y, p.face.x) + Math.PI / 2;
      for (const s of [-1, 1]) trap44({ tag: Z.src, x: p.x + Math.cos(a) * 50 * s, y: p.y + Math.sin(a) * 50 * s, r: 22, R: 60, life: 6, uses: 99, rearm: 0.8, max: 4, kind: 'wall', col: Z.col, sovereignAngle: a, on: T => hitC(T.x, T.y, T.R, Z.d(22), Z.src, { kb: 260, col: Z.col, sovereignArt: 'royal-barricade', sovereignAngle: T.sovereignAngle }) }); } },
    shuriken: { cd: 2.0, f(Z) { const p = G.p; hitC(p.x, p.y, 82 * Z.a, Z.d(22), Z.src, { kb: 300, col: '#c8d8ff', sovereignArt: 'base-shield', sovereignAngle: Math.atan2(p.face.y, p.face.x) }); for (const q of gdPts().slice(0, 2)) boltTo(q.x, q.y, angTo(q.x, q.y), { kind: 'star', sp: 480, r: 9, dmg: Z.d(26), pierce: 3, life: 1.4, color: Z.col, src: Z.src, bounce: true }); } },
    fireball: { cd: 2.4, f(Z) { const p = G.p; hitC(p.x, p.y, 82 * Z.a, Z.d(22), Z.src, { kb: 300, col: '#c8d8ff', sovereignArt: 'base-shield', sovereignAngle: Math.atan2(p.face.y, p.face.x) }); later44(0.45, () => { const ts = shuffle(enemiesInRange(p.x, p.y, 240)).slice(0, 3); ts.forEach((e, i) => { const x = e.x, y = e.y; fx({ kind: 'ring', x, y, r0: 40, r1: 6, dur: sovereignArtReady('royal-bombardment') ? 0.3 + i * 0.1 : 0.3, color: '#ffd890', sovereignArt: 'royal-bombardment', sovereignStage: 'fall' }); later44(0.3 + i * 0.1, () => hitC(x, y, 55 * Z.a, Z.d(28), Z.src, { kb: 100, col: '#ffb060', sovereignArt: 'royal-bombardment' })); }); }); } },
    icering: { cd: 2.2, f(Z) { const p = G.p; hitC(p.x, p.y, 100 * Z.a, Z.d(22), Z.src, { kb: 220, slow: 2, col: '#bfe8ff', sovereignArt: 'ice-wall' }); later44(0.3, () => hitC(p.x, p.y, 140 * Z.a, Z.d(16), Z.src, { slow: 2, col: '#dff4ff', fill: false, sovereignArt: 'ice-wall' })); } },
    orb: { cd: 2.0, f(Z) { const p = G.p, o = G.banner || p; hitC(p.x, p.y, 82 * Z.a, Z.d(16), Z.src, { kb: 260, col: '#c8d8ff', sovereignArt: 'base-shield', sovereignAngle: Math.atan2(p.face.y, p.face.x) }); for (let i = 0; i < 2; i++) boltTo(o.x, o.y, -Math.PI / 2 + (i - 0.5), { kind: 'orb', sp: 300, r: 7, dmg: Z.d(20), life: 2.4, color: Z.col, src: Z.src, home: true }); } },
    beam: { cd: 2.2, f(Z) { const p = G.p, o = G.banner || p; hitC(p.x, p.y, 82 * Z.a, Z.d(16), Z.src, { kb: 260, col: '#c8d8ff', sovereignArt: 'base-shield', sovereignAngle: Math.atan2(p.face.y, p.face.x) }); line44({ x: o.x, y: o.y, a: angTo(o.x, o.y, 300), L: 260 * Z.a, wd: 12, dur: 0.6, dmg: Z.d(8), src: Z.src, col: '#ffe680' }); } },
  },
  archer: {
    cleave: { cd: 1.0, f(Z) { const a = angTo(G.p.x, G.p.y, 300); for (let i = 0; i < 5; i++) pr44({ ang: a + (i - 2) * 0.22, sp: 560, r: 5, dmg: Z.d(12), life: 0.45, color: Z.col, src: Z.src }); } },
    shield: { cd: 1.1, f(Z) { pr44({ kind: 'shell', ang: angTo(G.p.x, G.p.y), sp: 520, r: 6, dmg: Z.d(22), life: 0.9, src: Z.src, on44: pr => hitC(pr.x, pr.y, 60 * Z.a, pr.dmg, Z.src, { kb: 300, near: 0.5, col: Z.col }) }); } },
    slam: { cd: 1.6, f(Z) { const p = G.p; let t = null, m = -1; gridQuery(p.x, p.y, 480, e => { if ((e.mk || 0) > m) { m = e.mk || 0; t = e; } }); if (!t) return false; const x = t.x, y = t.y;
      pr44({ ang: Math.atan2(y - p.y, x - p.x), sp: 600, dmg: Z.d(15), life: 0.8, color: Z.col, src: Z.src }); fx({ kind: 'ring', x, y, r0: 60, r1: 8, dur: 0.45, color: Z.col, archerArt: 'falling-arrow', archerAim: true, archerRadius: 100 * Z.a }); later44(0.5, () => hitC(x, y, 100 * Z.a, Z.d(36), Z.src, { kb: 150, col: Z.col })); } },
    trap: { cd: 1.3, f(Z) { const p = G.p, t = nearestEnemy(p.x, p.y, 420); if (!t) return false; const a = Math.atan2(t.y - p.y, t.x - p.x), d = Math.min(80, Math.sqrt(dist2(t.x, t.y, p.x, p.y)) * 0.5);
      pr44({ ang: a, sp: 600, dmg: Z.d(15), life: 0.8, color: Z.col, src: Z.src }); trap44({ tag: Z.src, x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, R: 50, max: 6, kind: 'jaw', col: Z.col, on: T => hitC(T.x, T.y, T.R, Z.d(22), Z.src, { frz: 1, col: Z.col, on: e => { e.mk = (e.mk || 0) + 2; } }) }); } },
    shuriken: { cd: 1.0, f(Z) { pr44({ ang: angTo(G.p.x, G.p.y), sp: 600, r: 5, dmg: Z.d(15), pierce: 3, life: 1.2, color: Z.col, src: Z.src, bounce: true }); } },
    fireball: { cd: 1.2, f(Z) { pr44({ kind: 'shell', ang: angTo(G.p.x, G.p.y), sp: 560, r: 5, dmg: Z.d(26), life: 0.9, src: Z.src, on44: pr => hitC(pr.x, pr.y, 55 * Z.a, pr.dmg, Z.src, { kb: 80, col: '#ff9a4a' }) }); } },
    icering: { cd: 1.1, f(Z) { pr44({ kind: 'shell', ang: angTo(G.p.x, G.p.y), sp: 560, r: 5, dmg: Z.d(18), life: 0.9, src: Z.src, on44: pr => hitC(pr.x, pr.y, 70 * Z.a, pr.dmg, Z.src, { slow: 2, col: '#bfe8ff' }) }); } },
    orb: { cd: 1.2, f(Z) { pr44({ kind: 'shell', ang: -Math.PI / 2, sp: 340, r: 7, dmg: Z.d(20), life: 2.2, src: Z.src, home: true, on44: pr => hitC(pr.x, pr.y, 26, pr.dmg, Z.src, { col: Z.col, on: e => { e.mk = (e.mk || 0) + 1; } }) }); } },
    beam: { cd: 1.2, f(Z) { const p = G.p, a = angTo(p.x, p.y, 600), J = J41(); if ((J.focus || 0) >= 5) { line44({ x: p.x, y: p.y, a, L: 900, wd: 10, dur: 0.15, tick: 0.2, dmg: Z.d(60), src: Z.src, col: '#fffbe0' }); shake(2, 0.15); } else pr44({ ang: a, sp: 620, dmg: Z.d(15), pierce: 1, life: 0.9, color: Z.col, src: Z.src }); } },
  },
  engineer: {
    cleave: { cd: 1.5, f(Z) { engTrap(Z, 'blade', T => { for (let i = 0; i < 6; i++) later44(i * 0.25, () => hitC(T.x, T.y, 50 * Z.a, Z.d(12), Z.src, { kb: 60, col: '#e0e0e0', fill: false })); }); } },
    shield: { cd: 1.5, f(Z) { engTrap(Z, 'pad', T => hitC(T.x, T.y, 70 * Z.a, Z.d(30), Z.src, { kb: 400, col: '#c8d8ff' })); } },
    slam: { cd: 1.6, f(Z) { engTrap(Z, 'press', T => { fx({ kind: 'ring', x: T.x, y: T.y, r0: 70, r1: 8, dur: 0.25, color: Z.col, engineerArt: 'crush-mine', engineerPress: true }); later44(0.25, () => hitC(T.x, T.y, 110 * Z.a, Z.d(40), Z.src, { kb: 150, col: '#d8b080' })); }); } },
    arrow: { cd: 2.5, f(Z) { const p = G.p; trap44({ tag: Z.src, x: p.x, y: p.y, r: 0, R: 0, life: 6, max: 3, kind: 'post', col: Z.col, every: 1, tickF: T => { const t = nearestEnemy(T.x, T.y, 260); if (t) {
      const angle = Math.atan2(t.y - T.y, t.x - T.x);
      boltTo(T.x, T.y, angle, { sp: 600, dmg: Z.d(14), life: 0.6, color: Z.col, src: Z.src });
      ENGINEER_TURRETS.set(T, { angle, time: G.time });
    } } }); } },
    shuriken: { cd: 1.5, f(Z) { engTrap(Z, 'saw', (T, e) => boltTo(T.x, T.y, e ? Math.atan2(e.y - T.y, e.x - T.x) : 0, { kind: 'star', sp: 480, r: 7, dmg: Z.d(16), pierce: 4, life: 1.4, color: Z.col, src: Z.src, bounce: true })); } },
    fireball: { cd: 1.5, f(Z) { engTrap(Z, 'mine', T => { hitC(T.x, T.y, 60 * Z.a, Z.d(28), Z.src, { kb: 100, col: '#ff9a4a' }); addPool({ x: T.x, y: T.y, r: 50 * Z.a, dur: 2, every: 0.4, dmg: Z.d(8), src: Z.src, kind: 'fire' }); }); } },
    icering: { cd: 1.5, f(Z) { engTrap(Z, 'cold', T => hitC(T.x, T.y, 80 * Z.a, Z.d(22), Z.src, { slow: 2, col: '#bfe8ff' })); } },
    orb: { cd: 1.5, f(Z) { engTrap(Z, 'drone', T => { for (let i = 0; i < 2; i++) boltTo(T.x, T.y, rand(Math.PI * 2), { kind: 'orb', sp: 300, r: 6, dmg: Z.d(20), life: 2.4, color: Z.col, src: Z.src, home: true }); }); } },
    beam: { cd: 1.8, f(Z) { const p = G.p, N = F44S().nodes; N.push({ x: p.x, y: p.y, t: 0, life: 8, src: Z.src, dmg: Z.d(6), tk: 0 }); if (N.length > 5) N.shift(); fx({ kind: 'ring', x: p.x, y: p.y, r0: 20, r1: 4, dur: 0.3, color: '#ff5050', engineerArt: 'laser-pylon' }); } },
  },
  chrono: {
    cleave: { cd: 1.4, f(Z) { const p = G.p, R = chronoRing(Z); chronoCue('frozen-blade', 'blade', 0.3, p.x, p.y, R + 40); later44(0.3, () => fan44(p.x, p.y, angTo(p.x, p.y, R + 60), 1.6, R + 40, Z.d(24), Z.src, 80, '#c8b0ff')); } },
    shield: { cd: 1.6, f(Z) { const p = G.p; hitC(p.x, p.y, 90 * Z.a, Z.d(20), Z.src, { kb: 220, slow: 1, col: '#c8b0ff', chronoArt: 'time-backflow', chronoKind: 'backflow' }); } },
    slam: { cd: 2.0, f(Z) { const p = G.p, R = chronoRing(Z), ps = []; gridQuery(p.x, p.y, R, e => { if (nonBoss(e)) e.frz = Math.max(e.frz || 0, 0.8); if (ps.length < 4) { ps.push({ x: e.x, y: e.y }); chronoCue('time-collapse', 'collapse', 1, e.x, e.y, 80 * Z.a); } });
      later44(1.0, () => { for (const q of ps) hitC(q.x, q.y, 80 * Z.a, Z.d(36), Z.src, { kb: 80, col: '#c8b0ff', chronoArt: 'time-collapse', chronoKind: 'collapse' }); }); } },
    arrow: { cd: 1.8, f(Z) { const p = G.p, R = chronoRing(Z) + 40, x = p.x, y = p.y; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, ex = x + Math.cos(a) * R, ey = y + Math.sin(a) * R; fx({ kind: 'pop', x: ex, y: ey, r: 6, color: '#c8b0ff', dur: 1, chronoArt: 'stasis-arrow', chronoKind: 'arrow', chronoAngle: a + Math.PI }); later44(1, () => boltTo(ex, ey, a + Math.PI, { sp: 520, dmg: Z.d(12), pierce: 2, life: R * 2 / 520, color: '#c8b0ff', src: Z.src })); } } },
    trap: { cd: 1.8, f(Z) { const p = G.p, R = chronoRing(Z); for (let i = 0; i < 3; i++) { const a = rand(Math.PI * 2); trap44({ tag: Z.src, x: p.x + Math.cos(a) * R, y: p.y + Math.sin(a) * R, R: 40, max: 9, kind: 'rift', col: '#c8b0ff', on: T => hitC(T.x, T.y, T.R, Z.d(18), Z.src, { frz: 1.5, col: '#c8b0ff', chronoArt: 'time-rift', chronoKind: 'rift' }) }); } } },
    shuriken: { cd: 1.3, f(Z) { const a = angTo(G.p.x, G.p.y); const q = pr44({ kind: 'star', ang: a, sp: 500, r: 6, dmg: Z.d(14), pierce: 3, life: 1.2, color: '#c8b0ff', src: Z.src, bounce: true, on44b: pr => chronoCue('rewind-star', 'echo', .20, pr.x, pr.y, 13, Math.atan2(pr.vy, pr.vx)) }); later44(0.7, () => boltTo(q.x, q.y, Math.atan2(G.p.y - q.y, G.p.x - q.x), { kind: 'star', sp: 520, r: 6, dmg: Z.d(14), pierce: 99, life: 0.8, color: '#8a70d0', src: Z.src })); } },
    fireball: { cd: 1.8, f(Z) { const p = G.p, R = chronoRing(Z), es = enemiesInRange(p.x, p.y, R).slice(0, 5); for (const e of es) { fx({ kind: 'pop', x: e.x, y: e.y, r: 9, color: '#ffb060', dur: 1.5, chronoArt: 'delayed-burst', chronoKind: 'timer', chronoTarget: e }); later44(1.5, () => hitC(e.dead ? e.x : e.x, e.y, 50 * Z.a, Z.d(30), Z.src, { kb: 80, col: '#ffb060', chronoArt: 'delayed-burst', chronoKind: 'burst' })); } } },
    orb: { cd: 1.5, f(Z) { chronoRing(Z); for (let i = 0; i < 3; i++) pr44({ kind: 'orb', ang: i * 2.1, sp: 280, r: 6, dmg: Z.d(16), life: 2.4, color: '#c8b0ff', src: Z.src, home: true }); } },
    beam: { cd: 1.6, f(Z) { const p = G.p; chronoRing(Z); line44({ x: p.x, y: p.y, a: rand(Math.PI * 2), L: 130 * Z.a, wd: 8, dur: 1.0, rot: Math.PI * 2, follow: true, slow: 1, dmg: Z.d(7), src: Z.src, col: '#c8b0ff' }); } },
  },
  mage: {
    cleave: { cd: 1.4, f(Z) { const p = G.p, a = angTo(p.x, p.y); magFb(Z, a, 12); fan44(p.x, p.y, a, 1.6, 120 * Z.a, Z.d(30), Z.src, 90, '#ff9a4a'); } },
    shield: { cd: 1.6, f(Z) { const p = G.p, c = ['#ff9a4a', '#bfe8ff', '#fff27a'][(Z.w.c44 = (Z.w.c44 || 0) + 1) % 3]; hitC(p.x, p.y, 90 * Z.a, Z.d(32), Z.src, { kb: 300, col: c, slow: c === '#bfe8ff' ? 1.5 : 0, mageArt: 'elemental-shield', mageKind: 'ward' }); } },
    slam: { cd: 1.8, f(Z) { const p = G.p, t = nearestEnemy(p.x, p.y, 420); if (!t) return false; const x = t.x, y = t.y; fx({ kind: 'ring', x, y, r0: 90, r1: 8, dur: 0.45, color: '#ff9a4a', mageArt: 'meteor-drop', mageKind: 'meteor-drop' }); later44(0.5, () => { hitC(x, y, 110 * Z.a, Z.d(45), Z.src, { kb: 160, col: '#ff7a3a', mageArt: 'meteor-drop', mageKind: 'meteor-hit' }); addPool({ x, y, r: 70 * Z.a, dur: 2, every: 0.4, dmg: Z.d(6), src: Z.src, kind: 'fire' }); shake(3, 0.2); }); } },
    arrow: { cd: 1.2, f(Z) { pr44({ ang: angTo(G.p.x, G.p.y), sp: 720, r: 7, dmg: Z.d(24), pierce: 3, life: 0.8, color: '#ff8a3a', src: Z.src }); } },
    trap: { cd: 1.4, f(Z) { magFb(Z, angTo(G.p.x, G.p.y), 12, pr => trap44({ tag: Z.src, x: pr.x, y: pr.y, R: 55 * Z.a, max: 6, kind: 'rune', col: '#ff9a4a', on: T => hitC(T.x, T.y, T.R, Z.d(26), Z.src, { kb: 80, col: '#ff7a3a', mageArt: 'fire-rune', mageKind: 'rune' }) })); } },
    shuriken: { cd: 1.3, f(Z) { pr44({ kind: 'orb', ang: angTo(G.p.x, G.p.y), sp: 420, r: 8, dmg: Z.d(18), pierce: 3, life: 1.4, color: '#ff8a3a', src: Z.src, bounce: true, on44b: pr => hitC(pr.x, pr.y, 45 * Z.a, pr.dmg, Z.src, { kb: 60, col: '#ff9a4a', mageArt: 'ricochet-fireball', mageKind: 'bounce', mageAngle: Math.atan2(pr.vy, pr.vx) }) }); } },
    icering: { cd: 1.3, f(Z) { magFb(Z, angTo(G.p.x, G.p.y), 12, pr => { let s = false; gridQuery(pr.x, pr.y, 80 * Z.a, e => { if (e.slowT > 0) s = true; }); if (s) { hitC(pr.x, pr.y, 80 * Z.a, Z.d(40), Z.src, { kb: 120, col: '#f0f0f0', mageArt: 'steam-burst', mageKind: 'steam' }); G.stats.steam44 = (G.stats.steam44 || 0) + 1; } else hitC(pr.x, pr.y, 54 * Z.a, Z.d(12), Z.src, { slow: 2, col: '#bfe8ff', mageArt: 'steam-burst', mageKind: 'chill' }); }); } },
    orb: { cd: 1.5, f(Z) { const cs = ['#ff9a4a', '#bfe8ff', '#fff27a']; for (let i = 0; i < 3; i++) pr44({ kind: 'shell', ang: i * 2.1, sp: 300, r: 7, dmg: Z.d(22), life: 2.2, src: Z.src, home: true, mageElement: cs[i], on44: pr => hitC(pr.x, pr.y, 40 * Z.a, pr.dmg, Z.src, { col: cs[i], slow: i === 1 ? 1.5 : 0, mageArt: 'elemental-spirit', mageKind: 'spirit' }) }); } },
    beam: { cd: 1.6, f(Z) { const p = G.p, a = angTo(p.x, p.y, 280), L = 250 * Z.a; line44({ x: p.x, y: p.y, a, L, wd: 10, dur: 0.6, dmg: Z.d(9), src: Z.src, col: '#ff8a3a' }); addPool({ x: p.x + Math.cos(a) * L, y: p.y + Math.sin(a) * L, r: 40, dur: 2, every: 0.4, dmg: Z.d(6), src: Z.src, kind: 'fire' }); } },
  },
  summoner: {
    cleave: { cd: 1.3, f(Z) {
      for (const g of ghostPts()) {
        const a = angTo(g.x, g.y, 200);
        summonerAim(g, a, .16);
        fan44(g.x, g.y, a, 2.2, 70 * Z.a, Z.d(22), Z.src, 80, Z.col);
      }
    } },
    shield: { cd: 1.8, f(Z) { const p = G.p, a = angTo(p.x, p.y, 200), L = 140; line44({ x: p.x, y: p.y, a, L, wd: 8, dur: 0.4, dmg: Z.d(7), src: Z.src, col: Z.col }); later44(0.3, () => hitC(p.x + Math.cos(a) * L, p.y + Math.sin(a) * L, 70 * Z.a, Z.d(26), Z.src, { kb: 260, col: Z.col, summonerAngle: a })); } },
    slam: { cd: 1.8, f(Z) { const p = G.p, t = nearestEnemy(p.x, p.y, 300); if (!t) return false; const x = t.x, y = t.y; line44({ x: p.x, y: p.y, a: Math.atan2(y - p.y, x - p.x), L: Math.sqrt(dist2(x, y, p.x, p.y)), wd: 6, dur: 0.3, dmg: Z.d(5), src: Z.src, col: Z.col }); summonerDescent(x, y, 100 * Z.a); later44(0.35, () => hitC(x, y, 100 * Z.a, Z.d(36), Z.src, { kb: 120, col: Z.col })); } },
    arrow: { cd: 1.1, f(Z) { const a = angTo(G.p.x, G.p.y); for (let i = 0; i < 5; i++) pr44({ ang: a + (i - 2) * 0.14, sp: 560, r: 5, dmg: Z.d(12), pierce: 1, life: 0.8, color: Z.col, src: Z.src }); } },
    trap: { cd: 1.8, f(Z) { const p = G.p, a = angTo(p.x, p.y, 260), L = 220 * Z.a; line44({ x: p.x, y: p.y, a, L, wd: 8, dur: 0.5, dmg: Z.d(7), src: Z.src, col: Z.col }); for (let i = 1; i <= 3; i++) trap44({ tag: Z.src, x: p.x + Math.cos(a) * L * i / 3.5, y: p.y + Math.sin(a) * L * i / 3.5, R: 40, max: 9, kind: 'grave', col: Z.col, on: T => hitC(T.x, T.y, T.R, Z.d(20), Z.src, { frz: 1, col: Z.col }) }); } },
    shuriken: { cd: 1.5, f(Z) { const p = G.p, a = angTo(p.x, p.y, 260), L = 200 * Z.a, x = p.x + Math.cos(a) * L, y = p.y + Math.sin(a) * L; line44({ x: p.x, y: p.y, a, L, wd: 8, dur: 0.5, dmg: Z.d(7), src: Z.src, col: Z.col }); later44(0.4, () => boltTo(x, y, angTo(x, y, 260), { kind: 'orb', sp: 460, r: 6, dmg: Z.d(16), pierce: 4, life: 1.6, color: Z.col, src: Z.src, bounce: true })); } },
    fireball: { cd: 1.5, f(Z) { const p = G.p, a = angTo(p.x, p.y, 260), L = 220 * Z.a; line44({ x: p.x, y: p.y, a, L, wd: 8, dur: 0.4, dmg: Z.d(6), src: Z.src, col: Z.col }); later44(0.3, () => hitC(p.x + Math.cos(a) * L, p.y + Math.sin(a) * L, 55 * Z.a, Z.d(28), Z.src, { kb: 80, col: '#7ad0ff' })); } },
    icering: { cd: 1.6, f(Z) { for (const g of ghostPts()) hitC(g.x, g.y, 70 * Z.a, Z.d(18), Z.src, { slow: 1.5, col: '#bfe8ff' }); } },
    orb: { cd: 1.5, f(Z) {
      let r = false;
      for (const g of ghostPts()) {
        const t = nearestEnemy(g.x, g.y, 240); if (!t) continue;
        r = true;
        const a = Math.atan2(t.y - g.y, t.x - g.x);
        summonerAim(g, a, .6);
        line44({ x: g.x, y: g.y, a, L: 220, wd: 7, dur: 0.6, dmg: Z.d(6), src: Z.src, col: Z.col });
      }
      return r;
    } },
  },
  priest: {
    cleave: { cd: 1.2, f(Z) { const q = relicPos(); fan44(q.x, q.y, angTo(q.x, q.y, 200), 2.0, 100 * Z.a, Z.d(24), Z.src, 100, '#fff2a8'); } },
    shield: { cd: 1.4, f(Z) { const q = relicPos(); boltTo(q.x, q.y, angTo(q.x, q.y), { kind: 'shell', sp: 340, r: 7, dmg: Z.d(22), life: 2, src: Z.src, home: true, on44: pr => { hitC(pr.x, pr.y, 60 * Z.a, pr.dmg, Z.src, { kb: 260, col: '#fff2a8' }); heal(2, '성역 결계'); } }); } },
    slam: { cd: 1.6, f(Z) { const p = G.p, t = nearestEnemy(p.x, p.y, 380); if (!t) return false; const x = t.x, y = t.y; fx({ kind: 'ring', x, y, r0: 80, r1: 8, dur: 0.4, color: '#fff2a8', priestArt: 'fall', priestDescent: true }); later44(0.4, () => hitC(x, y, 100 * Z.a, Z.d(36), Z.src, { kb: 140, col: '#fff2a8' })); } },
    arrow: { cd: 1.1, f(Z) { const q = relicPos(), a = angTo(q.x, q.y); for (let i = -1; i <= 1; i++) boltTo(q.x, q.y, a + i * 0.15, { sp: 620, r: 5, dmg: Z.d(14), pierce: 1, life: 0.9, color: '#fff2a8', src: Z.src }); } },
    trap: { cd: 1.5, f(Z) { const q = relicPos(); boltTo(q.x, q.y, angTo(q.x, q.y), { kind: 'shell', sp: 340, r: 6, dmg: Z.d(10), life: 1.6, src: Z.src, home: true, on44: pr => { hitC(pr.x, pr.y, 24, pr.dmg, Z.src, { col: '#fff2a8' }); trap44({ tag: Z.src, x: pr.x, y: pr.y, R: 45, max: 6, life: 10, kind: 'sign', col: '#fff2a8', heal: 3, on: T => hitC(T.x, T.y, T.R, Z.d(20), Z.src, { col: '#fff2a8' }) }); } }); } },
    shuriken: { cd: 1.2, f(Z) { const q = relicPos(); boltTo(q.x, q.y, angTo(q.x, q.y), { kind: 'orb', sp: 480, r: 7, dmg: Z.d(16), pierce: 4, life: 1.6, color: '#fff2a8', src: Z.src, bounce: true, on44b: () => heal(1, '순례 구체') }); } },
    fireball: { cd: 1.3, f(Z) { const q = relicPos(); boltTo(q.x, q.y, angTo(q.x, q.y), { kind: 'shell', sp: 320, r: 7, dmg: Z.d(28), life: 2, src: Z.src, home: true, on44: pr => hitC(pr.x, pr.y, 55 * Z.a, pr.dmg, Z.src, { kb: 80, col: '#ffe080' }) }); } },
    icering: { cd: 1.2, f(Z) { const p = G.p; hitC(p.x, p.y, 90 * Z.a, Z.d(16), Z.src, { slow: 1.2, col: '#e8f4ff', fill: false }); } },
    beam: { cd: 1.5, f(Z) { const q = relicPos(); line44({ x: q.x, y: q.y, a: angTo(q.x, q.y, 280), L: 260 * Z.a, wd: 10, dur: 0.6, dmg: Z.d(9), src: Z.src, col: '#fff2a8', follow: 'relic' }); } },
  },
  druid: {
    cleave: { cd: 0.9, f(Z) { const b = bearPt(), strike = combo(Z.w); if (strike < 3) return fan44(b.x, b.y, angTo(b.x, b.y, 200), 2.0, 70 * Z.a, Z.d(22), Z.src, 120, Z.col, undefined, strike === 2); hitC(b.x, b.y, 110 * Z.a, Z.d(40), Z.src, { kb: 200, col: '#d8b080' }); } },
    shield: { cd: 2.2, f(Z) { const b = bearPt(); hitC(b.x, b.y, 90 * Z.a, Z.d(34), Z.src, { kb: 380, near: 0.6, col: '#a08060' }); G.tm.wall = Math.max(G.tm.wall || 0, 1.5); } },
    arrow: { cd: 1.8, f(Z) { const b = bearPt(); hitC(b.x, b.y, 80 * Z.a, Z.d(26), Z.src, { kb: 120, col: '#d8b080' }); for (let i = 0; i < 6; i++) boltTo(b.x, b.y, i * Math.PI / 3 + rand(0.3), { sp: 520, r: 5, dmg: Z.d(14), pierce: 2, life: 0.6, color: '#7ac060', src: Z.src }); } },
    trap: { cd: 2.2, f(Z) { const b = bearPt(); hitC(b.x, b.y, 90 * Z.a, Z.d(26), Z.src, { kb: 120, col: '#d8b080' }); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + rand(0.4); trap44({ tag: Z.src, x: b.x + Math.cos(a) * 60, y: b.y + Math.sin(a) * 60, R: 45, max: 12, kind: 'vine', col: '#5aa040', on: T => { gridQuery(T.x, T.y, T.R, e => { if (nonBoss(e)) e.frz = Math.max(e.frz || 0, 1); }); fx({ kind: 'druidHold', x: T.x, y: T.y, r: T.R, dur: 1, druidArt: 'snare', druidHold: true }); later44(1, () => hitC(T.x, T.y, T.R, Z.d(24), Z.src, { col: '#5aa040', druidArt: 'snare' })); } }); } } },
    shuriken: { cd: 2.0, f(Z) { const b = bearPt(); hitC(b.x, b.y, 100 * Z.a, Z.d(26), Z.src, { kb: 100, col: '#d8b080' }); const wolves = (G.pets || []).filter(m => m.kind === 'wolf'), runner = wolves[0] || { x: b.x, y: b.y }, seen = new Set(); let cx = runner.x, cy = runner.y;
      for (let i = 0; i < 4; i++) later44(0.15 + i * 0.13, () => { let t = null, bd = 1e18; gridQuery(cx, cy, 220, e => { if (e.dead || seen.has(e)) return; const d = dist2(e.x, e.y, cx, cy); if (d < bd) { bd = d; t = e; } }); if (!t) return; seen.add(t); fx({ kind: 'zap', x: cx, y: cy, x2: t.x, y2: t.y, dur: 0.18, druidArt: 'wolf', druidSize: (G.bond?.wolf ? petStat('wolf').r : PET.wolf.r) * 2.5 }); cx = t.x; cy = t.y; if (wolves[0]) { runner.x = cx; runner.y = cy; } damageEnemy(t, Z.d(20) * Math.pow(0.9, i), { src: Z.src, kb: 60, fx: cx, fy: cy }); }); } },
    fireball: { cd: 2.2, f(Z) { const b = bearPt(); hitC(b.x, b.y, 100 * Z.a, Z.d(26), Z.src, { kb: 120, col: '#d8b080' }); const ts = shuffle(enemiesInRange(b.x, b.y, 170)).slice(0, 3); ts.forEach((e, i) => { const x = e.x, y = e.y, delay = 0.4 + i * 0.08; druidLavaFlight(b.x, b.y, x, y, delay, i); fx({ kind: 'pop', x: b.x, y: b.y, r: 8, color: '#ff5a2a', dur: 0.3, druidArt: 'lava', druidLaunch: true }); later44(delay, () => hitC(x, y, 55 * Z.a, Z.d(30), Z.src, { kb: 80, col: '#ff5a2a', druidArt: 'lava' })); }); } },
    icering: { cd: 2.0, f(Z) { const b = bearPt(), R = 100 * Z.a, x = b.x, y = b.y; hitC(x, y, R, Z.d(26), Z.src, { slow: 2, col: '#bfe8ff' }); later44(0.25, () => { hitC(x, y, R * 1.4, Z.d(12), Z.src, { slow: 2, col: '#dff4ff', fill: false }); gridQuery(x, y, R * 1.4, e => { if (e.slowT > 0 && dist2(e.x, e.y, x, y) > R * R * 0.6) damageEnemy(e, Z.d(35), { src: Z.src }); }); }); } },
    orb: { cd: 1.8, f(Z) { const b = bearPt(); hitC(b.x, b.y, 90 * Z.a, Z.d(26), Z.src, { kb: 120, col: '#d8b080' }); for (let i = 0; i < 3; i++) boltTo(b.x, b.y, i * 2.1, { kind: 'orb', sp: 280, r: 6, dmg: Z.d(18), life: 2.4, color: '#c8ff9a', src: Z.src, home: true }); } },
    beam: { cd: 1.8, f(Z) { const b = bearPt(), a = angTo(b.x, b.y, 300); hitC(b.x, b.y, 70 * Z.a, Z.d(20), Z.src, { kb: 100, col: '#d8b080' }); line44({ x: b.x, y: b.y, a, L: 260 * Z.a, wd: 12, dur: 0.6, dmg: Z.d(8), src: Z.src, col: '#a07040', crack: true }); } },
  },
};
/* 전사 · 투지 각인 */
function warMark(Z) { const p = G.p; trap44({ tag: Z.src, x: p.x, y: p.y, R: 60 * Z.a, max: 4, life: 12, kind: 'mark', col: Z.col, on: T => hitC(T.x, T.y, T.R, Z.d(30) + (J41().store || 0) * 0.3 * p.mod.dmg, Z.src, { kb: 160, col: '#ff8a5a', warArt: 'trap' }) }); }
const _hurtPlayer44 = hurtPlayer;
hurtPlayer = function (dmg, src) {
  const p = G.p, h0 = p.hp; const r = _hurtPlayer44(dmg, src);
  if (p.hp < h0 && p.job === 'warrior' && G.time >= F44S().hurtT) { const w = fusedWs().find(x => x.id === 'trap'); if (w) { F44S().hurtT = G.time + 0.6; warMark(fuseCtx(w, wStats(w), 1)); } }
  return r;
};
const _playerAvoid44 = playerAvoid;
playerAvoid = function () { if (G.tm.smoke44 > 0 && Math.random() < 0.5) { fx({ kind: 'pop', x: G.p.x, y: G.p.y, r: 14, color: '#8a96a8', dur: 0.2 }); return true; } return _playerAvoid44(); };
/* 기술자 덫 설치 */
function engTrap(Z, kind, on) { const p = G.p; trap44({ tag: Z.src, x: p.x, y: p.y, R: 0, max: 8, kind, col: Z.col, on: T => { on(T, T.who); engineerTrapTrigger(T); } }); }
/* 시간술사 기본 고리 */
function chronoRing(Z) { const p = G.p, R = 80 * Z.a; hitC(p.x, p.y, R, Z.d(8), Z.src, { slow: 1, col: '#bfe8ff', fill: false, chronoArt: 'base-ice-ring', chronoKind: 'ice' }); return R; }
/* 마법사 화염구 (착탄 콜백 선택) */
function magFb(Z, a, dm, cb) { pr44({ kind: 'shell', ang: a, sp: 320, r: 8, dmg: Z.d(dm), life: 1, src: Z.src, on44: pr => { if (cb) cb(pr); else hitC(pr.x, pr.y, 54 * Z.a, pr.dmg, Z.src, { kb: 60, col: '#ff9a4a', mageArt: 'base-fireball', mageKind: 'fireball' }); } }); }

/* ---------- 발동 ---------- */
function fuseCtx(w, S, k = 1) {
  const j = w.fu.job, B = WEAPONS[w.id].base, m = S.dmg / B.dmg * K44 * k * ((M44[j] || {})[w.id] || 1);
  return { w, S, j, a: S.area, col: JOB_COL[j], src: fsrc(j, w.id), d: v => v * m };
}
function fuseFire44(w, S, k) {
  const j = w.fu.job, D = FU44[j] && FU44[j][w.id]; if (!D) return WEAPON_FIRE[w.id](w, S);
  const Z = fuseCtx(w, S, k), r = D.f(Z);
  if (r !== false) { const f = F43(); f.fires[j] = (f.fires[j] || 0) + 1; G.stats.fuseFires = (G.stats.fuseFires || 0) + 1; const FF = G.stats.fu44 || (G.stats.fu44 = {}); FF[Z.src] = (FF[Z.src] || 0) + 1; }
  return r;
}
const fuseCd44 = (w, S) => { const D = FU44[w.fu.job] && FU44[w.fu.job][w.id], B = WEAPONS[w.id].base; return D ? D.cd * (B.cd ? S.cd / B.cd : 1) : S.cd; };
applyFuse = function (id) {
  const p = G.p, w = slotWs().find(x => x.id === id && !x.fu); if (!w || !p.job) return;
  const j = p.job, F = fu44(j, id); w.fu = { job: j, nm: fuseName(j, id) }; w.t = 0.3; w.c44 = 0;
  (G.stats.fuses = G.stats.fuses || []).push(`${id}:${j}:${Math.round(G.time)}`);
  if (fusedWs().length === 1) F43().kills0 = G.kills;
  banner('연성 · ' + w.fu.nm, F ? (F.mode === '직업' ? '직업 변화' : '무기 결합') + ` · ${WEAPONS[id].name} + ${WEAPONS[baseW().id].name}` : '', JOB_COL[j], 2.4);
  toast(baseRetired() ? '모든 칸 연성 · 기본 무기 단독 발동 종료' : `연성 ${fusedWs().length}/${slotCount()}`, JOB_COL[j]);
  fuseMoment(j, w); sfx('ult'); shake(3, 0.3); recalc();
};
const _cardInfo44 = cardInfo;
cardInfo = function (c) {
  const r = _cardInfo44(c); if (c.t !== 'fuse') return r;
  const F = fu44(G.p.job, c.id); if (F) { r.nm = F.nm; r.ds = `${F.mode === '직업' ? '직업 변화' : '무기 결합'} · ${F.ds}\n${F.num}`; }
  return r;
};
updateWeapons = function (dt) {
  const p = G.p, J = p.job && J41(), mage = p.job === 'mage', eng = p.job === 'engineer' ? engSlots() : null, ret = baseRetired();
  let ti = 0;
  for (const w of p.weapons) {
    const S = wStats(w);
    if (w.id === 'spin') { updateSpin(w, S, dt); continue; }
    if (mage) continue;
    if (w.base && ret) continue;
    w.t -= dt * ultCdMul();
    if (w.t <= 0) {
      let r;
      if (w.fu) r = fuseFire44(w, S);
      else if (eng && eng.includes(w) && G.turrets.length) { const t = G.turrets[ti++ % G.turrets.length]; r = atPos(t.x, t.y, () => WEAPON_FIRE[w.id](w, scaleS(S, V41.eng.slotDmg))); if (r !== false) fx({ kind: 'ring', x: t.x, y: t.y, r0: 4, r1: 20, dur: 0.2, color: '#ffd890' }); }
      else r = WEAPON_FIRE[w.id](w, S);
      w.t = r === false ? 0.25 : (w.fu ? fuseCd44(w, S) : S.cd); if (r !== false) rcFire(w);
      if (r !== false && p.job === 'rogue' && !DUR41[w.id] && !w.fu) rogueEcho(w, S);
      if (r !== false && pBr('haste') === 'echo' && Math.random() < 0.12) w.t = 0.05;
    }
  }
  if (mage) mageVolley(dt, J);
  updateTraps(dt); updateArsenal(dt); fuseTick(dt); fuseTick44(dt);
  for (const L of G.later) { L.t -= dt; if (L.t <= 0) { L.done = true; L.f(); } }
  if (G.later.length) G.later = G.later.filter(L => !L.done);
};
mageVolley = function (dt, J) {
  const C = V41.mag, p = G.p;
  J.vol -= dt * ultCdMul(); if (J.vol > 0) return;
  J.vol = J.volP = (p.job2 === 'archmage' ? C.cdB : C.cd) * Math.max(C.cdMin, p.mod.cd); J.volN++;
  const ret = baseRetired(), list = p.weapons.filter(w => w.id !== 'spin' && !(w.base && ret));
  list.forEach((w, i) => G.later.push({ t: i * C.gap, f: () => {
    if (G.result || !p.weapons.includes(w)) return;
    const S = wStats(w);
    if (w.fu) { const k = Math.max(C.dmg, J.volP / fuseCd44(w, S) * C.fair); if (fuseFire44(w, S, k) !== false) rcFire(w); return; }
    const k = Math.max(C.dmg, J.volP / S.cd * C.fair), r = WEAPON_FIRE[w.id](w, scaleS(S, k)); if (r !== false) rcFire(w);
  } }));
  if (list.length) { fx({ kind: 'ring', x: p.x, y: p.y, r0: 8, r1: 70, dur: 0.3, color: '#e8b0ff', follow: true }); G.stats.volleys = (G.stats.volleys || 0) + 1; }
};
/* 성물: 회복마다 첫 연성 무기 추가 발동 (0.8초 간격) */
heal = function (v, src) {
  const r = _heal43(v, src), p = G.p, f = G.f43;
  if (p && p.job === 'priest' && f && v > 0.3 && G.time >= f.relicT && !G.result && !/성역|순례|축복/.test(src || '')) {
    const w = fusedWs()[0];
    if (w) { f.relicT = G.time + 0.8; const q = relicPos(); fx({ kind: 'pop', x: q.x, y: q.y, r: 14, color: '#fff2a8', dur: 0.3 }); fuseFire44(w, wStats(w), 0.5); G.stats.relicHeal = (G.stats.relicHeal || 0) + 1; }
  }
  return r;
};
/* 시계추 구체: 정지 적 피해 2배 */
const _damageEnemy44 = damageEnemy;
damageEnemy = function (e, dmg, o = {}) { if (o.src === 'fu_chrono_orb' && e && e.frz > 0) dmg *= 2; return _damageEnemy44(e, dmg, o); };

/* ---------- 지속 개체 갱신: 광선·덫·말뚝 ---------- */
function fuseTick44(dt) {
  const S = G.f44; if (G.tm.smoke44 > 0) G.tm.smoke44 -= dt; if (!S) return;
  const p = G.p;
  for (const L of S.lines) {
    L.t += dt; L.tk -= dt; if (L.rot) L.a += L.rot * dt;
    if (L.follow === true) { L.x = p.x; L.y = p.y; } else if (L.follow === 'relic') { const q = relicPos(); L.x = q.x; L.y = q.y; }
    if (L.tk <= 0) { L.tk = L.tick; lineHit(L.x, L.y, L.a, L.L, L.wd, e => { if (L.slow) e.slowT = Math.max(e.slowT || 0, L.slow); damageEnemy(e, L.dmg, { src: L.src }); }); }
  }
  S.lines = S.lines.filter(L => L.t < L.dur);
  for (const T of S.traps) {
    T.t += dt; if (T.t > T.life) { T.dead = true; continue; }
    if (T.every) { T.tk = (T.tk || 0) - dt; if (T.tk <= 0) { T.tk = T.every; T.tickF(T); } continue; }
    if (T.heal && dist2(T.x, T.y, p.x, p.y) < 30 * 30) { heal(T.heal, '축복 표지'); T.dead = true; fx({ kind: 'pop', x: T.x, y: T.y, r: 14, color: '#fff2a8', dur: 0.3, ...(T.tag === 'fu_priest_trap' ? { priestArt: 'sign', priestBlessing: true } : {}) }); continue; }
    if (T.t < T.arm || G.time < T.cdT) continue;
    let who = null; gridQuery(T.x, T.y, T.r, e => { if (!e.dead) { who = e; return false; } });
    if (!who) continue;
    T.who = who; T.on(T); G.stats.trap44 = (G.stats.trap44 || 0) + 1;
    if (--T.uses <= 0) T.dead = true; else T.cdT = G.time + (T.rearm || 0.8);
  }
  S.traps = S.traps.filter(T => !T.dead);
  for (const n of S.nodes) n.t += dt;
  S.nodes = S.nodes.filter(n => n.t < n.life);
  for (let i = 0; i < S.nodes.length; i++) {
    const A = S.nodes[i]; A.tk -= dt; if (A.tk > 0) continue; A.tk = 0.1;
    for (let k = i + 1; k < S.nodes.length; k++) { const B = S.nodes[k], L = engineerNodeLength(A, B); if (engineerNodesConnect(L)) lineHit(A.x, A.y, Math.atan2(B.y - A.y, B.x - A.x), L, 6, e => damageEnemy(e, A.dmg, { src: A.src })); }
  }
}
/* 임시 도형 (최종본 아님) */
const _drawJobAura44 = drawJobAura;
drawJobAura = function (c) {
  _drawJobAura44(c);
  const S = G.f44; if (!S) return;
  c.save();
  for (const L of S.lines) { if ((L.src === 'fu_warrior_beam' && warriorArtReady('beam')) || (L.src === 'fu_rogue_beam' && rogueArtReady('beam')) || sovereignUsesLineArt(L) || archerUsesLineArt(L) || chronoUsesLineArt(L) || mageUsesLineArt(L) || summonerUsesLineArt(L) || priestUsesLineArt(L) || druidUsesLineArt(L)) continue; const k = 1 - L.t / L.dur; c.globalAlpha = 0.35 + 0.5 * k; c.strokeStyle = L.col; c.lineWidth = L.wd * (L.crack ? 0.8 : 1.4); c.lineCap = 'round'; if (L.crack) c.setLineDash([10, 6]); c.beginPath(); c.moveTo(L.x, L.y); c.lineTo(L.x + Math.cos(L.a) * L.L, L.y + Math.sin(L.a) * L.L); c.stroke(); c.setLineDash([]); c.globalAlpha = 0.9 * k; c.strokeStyle = '#fff'; c.lineWidth = Math.max(1, L.wd * 0.3); c.stroke(); }
  c.globalAlpha = 1;
  for (const T of S.traps) {
    if ((T.tag === 'fu_warrior_trap' && warriorArtReady('trap')) || (T.tag === 'fu_rogue_trap' && rogueArtReady('trap')) || sovereignUsesTrapArt(T) || archerUsesTrapArt(T) || engineerUsesTrapArt(T) || chronoUsesTrapArt(T) || mageUsesTrapArt(T) || summonerUsesTrapArt(T) || priestUsesTrapArt(T) || druidUsesTrapArt(T)) continue;
    const s = T.kind === 'wall' ? 12 : 8, ready = T.t >= T.arm; c.strokeStyle = T.col; c.fillStyle = ready ? T.col : '#555'; c.lineWidth = 2; c.globalAlpha = ready ? 0.85 : 0.5;
    if (T.kind === 'wall') { c.fillRect(T.x - s, T.y - 4, s * 2, 8); for (let i = -1; i <= 1; i++) c.fillRect(T.x + i * 9 - 2, T.y - 12, 4, 16); }
    else if (T.kind === 'post') { c.fillRect(T.x - 7, T.y - 7, 14, 14); c.beginPath(); c.moveTo(T.x, T.y); c.lineTo(T.x + 10, T.y - 10); c.stroke(); }
    else if (T.kind === 'mark' || T.kind === 'rune' || T.kind === 'sign' || T.kind === 'rift') { c.beginPath(); c.arc(T.x, T.y, s + 2, 0, 7); c.stroke(); c.beginPath(); c.moveTo(T.x - s, T.y); c.lineTo(T.x + s, T.y); c.moveTo(T.x, T.y - s); c.lineTo(T.x, T.y + s); c.stroke(); }
    else { c.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, r = i % 2 ? s * 0.5 : s; c[i ? 'lineTo' : 'moveTo'](T.x + Math.cos(a) * r, T.y + Math.sin(a) * r); } c.closePath(); c.fill(); }
  }
  if (S.nodes.length) { c.globalAlpha = 0.8; c.strokeStyle = '#ff5050'; c.lineWidth = 2; for (let i = 0; i < S.nodes.length; i++) { const A = S.nodes[i]; if (engineerUsesNodeArt(A)) continue; c.fillStyle = '#5a4630'; c.fillRect(A.x - 5, A.y - 5, 10, 10); for (let k = i + 1; k < S.nodes.length; k++) { const B = S.nodes[k]; if (engineerNodesConnect(engineerNodeLength(A, B))) { c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(B.x, B.y); c.stroke(); } } } }
  c.restore();
};
/* 판 시작 시 초기화 */
const _newRun44 = newRun;
newRun = function () { const r = _newRun44.apply(this, arguments); G.f44 = null; return r; };

/* ---------- 도감 연성 탭: 직업별 연성 무기 9종 ---------- */
cxFuse = function () {
  const jobs = JOB_ORDER.map(id => { const W = WEAPONS[FZ_SYMBOL[id]], T = FZ_TRIAL[id];
    const rows = F44[id].map(r => `<div><b>${esc(r[1])}</b><span>${esc(WEAPONS[r[0]].name)} · ${r[4] === '직업' ? '직업 변화' : '무기 결합'} · ${esc(r[2])} · ${esc(r[3])}</span></div>`).join('');
    return cxCard({ job: id, col: JOB_COL[id], ic: JOBS[id].ic, nm: JOBS[id].name + ' · 연성 9종', tag: '기본 무기 ' + W.name, lines: [`<details class="acc"><summary>연성 무기 9종</summary><div class="cxg">${rows}</div></details>`, cxChips([['2차 전직 시련', esc(T.nm)]])] }); }).join('');
  return '<p class="hint">전직 시 상징 무기가 기본 무기 칸으로 이동 · 무기 칸 무기와 기본 무기가 모두 Lv 5(각성 완료)면 레벨업에 연성 카드 등장 · 선택한 칸이 직업 고유 연성 무기로 변신 (무기 결합 또는 직업 변화) · 모든 칸 연성 시 기본 무기 단독 발동 종료</p>' + jobs;
};
