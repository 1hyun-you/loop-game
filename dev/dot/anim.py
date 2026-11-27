from pal import *
import all as A, copy, os
from PIL import Image
OUT='/home/claude/loop-game/assets/dot/berserker'; os.makedirs(OUT,exist_ok=True)
def rows_shift(g,y0,y1,dy,x0=0,x1=40):
    n=copy.deepcopy(g)
    for y in range(y0,y1+1):
        for x in range(x0,x1): n[y][x]='.'
    for y in range(y0,y1+1):
        ny=y+dy
        if 0<=ny<40:
            for x in range(x0,x1):
                if g[y][x]!='.': n[ny][x]=g[y][x]
    return n
def bob(g,legtop):  # upper body up 1, waist row kept
    n=rows_shift(g,0,legtop-1,-1)
    for x in range(40):
        if n[legtop-1][x]=='.': n[legtop-1][x]=g[legtop-1][x]
    return n
def idle2(g,legtop):  # breathe: upper body down 1
    n=rows_shift(g,0,legtop-1,1)
    return n
def lift(g,legtop,x0,x1):
    n=copy.deepcopy(g)
    for y in range(legtop,40):
        for x in range(x0,x1): n[y][x]='.'
    for y in range(legtop+1,40):
        for x in range(x0,x1):
            if g[y][x]!='.': n[y-1][x]=g[y][x]
    for x in range(x0,x1):  # keep knee top
        if n[legtop][x]=='.' and g[legtop][x]!='.': n[legtop][x]=g[legtop][x]
    return n
def hshift(g,y0,x0,x1,dx):
    n=copy.deepcopy(g)
    for y in range(y0,40):
        for x in range(x0,x1): 
            if g[y][x]!='.' and n[y][x]==g[y][x]: n[y][x]='.'
    for y in range(y0,40):
        for x in range(x0,x1):
            if g[y][x]!='.' and 0<=x+dx<40: n[y][x+dx]=g[y][x]
    return n
F,S,B=A.front(),A.side(),A.back()
sets={}
# front/back: legs start row 32 (front: kilt ends 30, knees 31)
for name,g,lt in [('down',F,32),('up',B,32)]:
    sets[name]={'idle':[g,idle2(g,lt-1)],
                'walk':[lift(g,lt,0,20),bob(g,lt-1),lift(g,lt,20,40),bob(g,lt-1)]}
# side: legs from row 31, back leg cols 13-18, front leg 18-23
s1=hshift(hshift(S,31,13,18,-1),31,18,24,1)
s3=hshift(hshift(S,31,13,18,1),31,18,24,-1)
sets['side']={'idle':[S,idle2(S,30)],'walk':[s1,bob(S,30),s3,bob(S,30)]}
frames=[]
for d,acts in sets.items():
    for act,fr in acts.items():
        for i,g in enumerate(fr):
            img(g).save(f'{OUT}/berserker_{act}_{d}_{i+1}.png')
# preview sheet
rows=[]
order=['down','side','up']
sheet=Image.new('RGBA',(6*(40*6+8)+8,3*(40*6+8)+8),(128,128,128,255))
for r,d in enumerate(order):
    fr=sets[d]['idle']+sets[d]['walk']
    for c,g in enumerate(fr):
        sheet.alpha_composite(img(g).resize((240,240),Image.NEAREST),(8+c*248,8+r*248))
sheet.save(f'{OUT}/berserker_sheet_preview.png')
# gif: walk loop, 3 directions side by side
gifs=[]
for k in range(4):
    for rep in range(2):
        fr=Image.new('RGBA',(3*248+8,256),(128,128,128,255))
        for c,d in enumerate(order):
            fr.alpha_composite(img(sets[d]['walk'][k]).resize((240,240),Image.NEAREST),(8+c*248,8))
        gifs.append(fr.convert('RGB'))
gifs[0].save('walk.gif',save_all=True,append_images=gifs[1:],duration=90,loop=0)
print(os.listdir(OUT))
