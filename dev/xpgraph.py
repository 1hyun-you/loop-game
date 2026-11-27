# 경험치 곡선 그래프 2종 (회차 102): 레벨별 필요 경험치 · 시간별 평균 도달 레벨(인물별)
# 사용: python3 dev/xpgraph.py <기록 접두어> <출력 png>   예: python3 dev/xpgraph.py dev/sim_log/runs_0.69 docs/img/xp_0.69.png
import json, sys, math, os
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib import font_manager as fm
for f in ['/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc', '/usr/share/fonts/opentype/noto/NotoSansCJK-Medium.ttc']:
    if os.path.exists(f): fm.fontManager.addfont(f); plt.rcParams['font.family'] = fm.FontProperties(fname=f).get_name(); break
pre, out = sys.argv[1], sys.argv[2]
JOBS = [('berserker', '광전사'), ('rogue', '도적'), ('archer', '궁수'), ('engineer', '엔지니어'), ('pyromancer', '화염술사'), ('necromancer', '사령술사'), ('priest', '프리스트'), ('druid', '드루이드')]
need = lambda l, b, li, pw, pm: math.floor(b + li * l + l ** pw * pm)
fig, ax = plt.subplots(1, 2, figsize=(11, 4.2), dpi=110)
L = list(range(1, 81))
ax[0].plot(L, [need(l, 5, 5, 1.75, 0.9) / 1.25 for l in L], color='#999', lw=2, label='0.68 (필요 5·5·0.9 ÷ 전환기 1.25배)')
ax[0].plot(L, [need(l, 4, 4, 1.75, 0.72) for l in L], color='#d23a2e', lw=1.2, ls='--', label='0.69 정식 곡선 (4·4·0.72)')
ax[0].set_title('레벨별 필요 경험치 (실질값)'); ax[0].set_xlabel('레벨'); ax[0].set_ylabel('경험치'); ax[0].legend(fontsize=8); ax[0].grid(alpha=.3)
for j, nm in JOBS:
    f = f'{pre}_{j}.jsonl'
    if not os.path.exists(f): continue
    R = [json.loads(x) for x in open(f, encoding='utf-8') if x.strip()]
    T = list(range(0, 1201, 30)); ys = []
    for t in T:
        v = [sum(1 for a in r.get('levelAt') or [] if a <= t) + 1 for r in R if r.get('time', 0) >= t]
        ys.append(sum(v) / len(v) if len(v) >= max(2, len(R) // 4) else None)
    ax[1].plot([t / 60 for t in T], ys, lw=1.4, label=nm)
ax[1].set_title('시간별 평균 도달 레벨 (살아 있는 판 기준)'); ax[1].set_xlabel('분'); ax[1].set_ylabel('레벨'); ax[1].legend(fontsize=8, ncol=2); ax[1].grid(alpha=.3)
fig.tight_layout(); os.makedirs(os.path.dirname(out) or '.', exist_ok=True); fig.savefig(out); print(out)
