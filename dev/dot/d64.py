from PIL import Image
import os,sys
N=64; FOOT=3
SRC='/home/claude/loop-game/assets/dot-src/%s/sheet_capeA.png'
def build(hero,TH=60,mode=Image.BOX):
    src=Image.open(SRC%hero)
    pal=src.getpalette()[:3*16]; src=src.convert('RGB')
    nat=src.resize((src.width//2,src.height//2),Image.NEAREST)
    BG=nat.getpixel((0,0))
    cols=[(pal[i],pal[i+1],pal[i+2]) for i in range(0,len(pal),3)]
    cols=[c for c in cols if c!=BG]
    px=nat.load(); W,H=nat.size
    xs=[x for x in range(W) if any(px[x,y]!=BG for y in range(H))]
    segs=[];s=xs[0];p=xs[0]
    for x in xs[1:]:
        if x!=p+1: segs.append((s,p)); s=x
        p=x
    segs.append((s,p))
    ys=[y for y in range(H) if any(px[x,y]!=BG for x in xs)]
    y0,y1=min(ys),max(ys); h=y1-y0+1; sc=TH/h
    outs=[]
    for a,b in segs:
        c=nat.crop((a,y0,b+1,y1+1))
        mask=Image.new('L',c.size,0); mp=mask.load(); cp=c.load()
        for y in range(c.height):
            for x in range(c.width):
                if cp[x,y]!=BG: mp[x,y]=255
        w=max(1,round(c.width*sc))
        # fill bg with nearest object color to avoid gray bleed: use premult trick
        rgba=c.convert('RGBA'); rgba.putalpha(mask)
        small=rgba.resize((w,TH),mode)
        ms=mask.resize((w,TH),Image.BOX)
        out=Image.new('RGBA',(N,N),(0,0,0,0))
        ox=(N-w)//2; oy=N-FOOT-TH
        sp=small.load(); mm=ms.load()
        for y in range(TH):
            for x in range(w):
                if mm[x,y]>=110:
                    r,g,b_,al=sp[x,y]
                    if al>0:
                        r,g,b_=[v*255/al if al<255 else v for v in (r,g,b_)] if False else (r,g,b_)
                    best=min(cols,key=lambda q:(q[0]-r)**2*0.3+(q[1]-g)**2*0.59+(q[2]-b_)**2*0.11)
                    out.putpixel((ox+x,oy+y),best+(255,))
        outs.append(out)
    return outs
OUT=(49,24,21)
def lum(c): return 0.3*c[0]+0.59*c[1]+0.11*c[2]
def outline(im):
    p=im.load(); W,H=im.size; add=[]
    for y in range(H):
        for x in range(W):
            if p[x,y][3]==0:
                for dx,dy in((1,0),(-1,0),(0,1),(0,-1)):
                    X,Y=x+dx,y+dy
                    if 0<=X<W and 0<=Y<H and p[X,Y][3] and lum(p[X,Y])>45:
                        add.append((x,y));break
    for x,y in add: p[x,y]=OUT+(255,)
    return im
def clean(im):
    p=im.load(); W,H=im.size
    for y in range(H):
        for x in range(W):
            if p[x,y][3]:
                n=sum(1 for dx,dy in((1,0),(-1,0),(0,1),(0,-1)) if 0<=x+dx<W and 0<=y+dy<H and p[x+dx,y+dy][3])
                if n==0: p[x,y]=(0,0,0,0)
    return im
if __name__=='__main__':
    outs=[outline(clean(o)) for o in build('berserker',TH=58)]
    for n,o in zip(['down','side','up'],outs): o.save(f'b64_{n}.png')
    sheet=Image.new('RGBA',(3*(64*5+10)+10,64*5+20),(128,128,128,255))
    game=Image.new('RGBA',(3*150,150),(128,128,128,255))
    for i,o in enumerate(outs):
        sheet.alpha_composite(o.resize((320,320),Image.NEAREST),(10+i*330,10))
        game.alpha_composite(o.resize((128,128),Image.NEAREST),(10+i*150,10))
    sheet.save('p64.png'); game.save('g64.png')
