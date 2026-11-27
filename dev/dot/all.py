from pal import *
import f2
def mirror(L):
    g=grid(); top=38-len(L)
    for i,row in enumerate(L):
        assert len(row)==20,(i,len(row),row)
        for x,ch in enumerate(row+row[::-1]): g[top+i][x]=ch
    return g,top
def hairtone(g,y0,y1):
    m={'R':'r','r':'d','h':'R'}
    for y in range(y0,y1):
        for x in range(40):
            if g[y][x] in m: g[y][x]=m[g[y][x]]
# --- front
def front():
    g,t=f2.build()
    # hair recolor: rows top..top+9, keep highlights
    for y in range(t,t+9):
        for x in range(40):
            c=g[y][x]
            if c=='r': g[y][x]='d'
            elif c=='R': g[y][x]='r'
            elif c=='h': g[y][x]='R'
    # brighten some hair tips (light from upper-left)
    for (y,x) in [(t+3,14),(t+4,13),(t+4,16),(t+5,15),(t+3,18),(t+2,17)]:
        if g[y][x] in 'dr': g[y][x]='R'
    g[t+14][19]='s'; g[t+14][20]='s'
    return g
# --- back
BACK=[
"................o...",
"..............o.oro.",
"............o.orrRro",
"...........ororRRrRr",
"..........odrRRrRRRR",
"..........odrRRRRhRR",
"..........odrrRRRRrr",
"...........odrrRrrRr",
"...........odrrrrRrr",
"...........odrrRrrrr",
"............odrrrrRr",
"............odrrrrrr",
"............osdrrrdr",
".............odrdrrd",
"..............oddSSS",
"...............osSSS",
"................oSSS",
"...........ooddddddd",
"..........oddrrrrrrr",
"..........odrrrrrrrr",
"..........odrrrdrrrr",
".........odrrrrdrrrr",
".........odrrrrrdrrr",
".........odrrrrrrdrr",
"........odhrrrrrrrdr",
"........odRhrrrrrrrr",
".......odrrRhrrrrrrr",
".......odrrrRhrrrrrr",
".......odrrrrRhhrrrr",
".......oddrrrrrRRhhr",
"........ooddddddddRR",
"...........obnnnbo..",
"...........obnnnbo..",
"..........obnnnnbo..",
"..........obnnnnbbo.",
"..........obbbbbbo..",
"...........oooooo...",
]
def back():
    g,t=mirror(BACK)
    for y in range(t,t+11):
        for x in range(40):
            c=g[y][x]
            if c=='r': g[y][x]='d'
            elif c=='R': g[y][x]='r'
            elif c=='h': g[y][x]='R'
    # center V joins: bottom center pixels
    # pauldron on viewer-left in back view
    put(g,t+17,10,"oonnnno")
    put(g,t+18,9,"obnttnno")
    put(g,t+19,9,"obnnnnto")
    put(g,t+20,10,"obbbbo")
    # kilt peeks under cape
    put(g,t+30,12,"okkkkkkkkkkkkkko")
    return g
# --- side (facing right)
SIDE=[
(0,16,"o..o"),
(1,12,"o..oroorRo"),
(2,10,"ororrRRrRRo"),
(3,9,"odrrRRRRhRRRo"),
(4,8,"odrrRRRRRRRRRo"),
(5,7,"odrrrRRRRRRRRRo"),
(6,7,"odrrrrRRRRRRRSSo"),
(7,8,"oddrrrRrrrrSSSSo"),
(8,9,"oddrrrrSooSSSo"),
(9,9,"oddrrsSSSoSSSo"),
(10,10,"odrssSSSSSSSSo"),
(11,10,"odsSSSSSSSSo"),
(12,11,"osSSSSSo44o"),
(13,12,"oosSSSSSo"),
(14,13,"oosSSoo"),
(15,14,"osSSo"),
(16,11,"oodddosSSRRoo"),
(17,10,"oddrrdonnnnoSRo"),
(18,9,"oddrrdonttnnoSSo"),
(19,9,"odrrrdonnnnbSSSo"),
(20,8,"odrrrrdobbbbSSSSo"),
(21,8,"odrrrrrosSSSbbSkSo"),
(22,8,"odrrrrrosSSSbtbSSo"),
(23,8,"odrrrrrrosSSSbbSo"),
(24,8,"odrrrrrrobnnnnnbo"),
(25,7,"odrrrrrrrorRRRRRRo"),
(26,7,"odrrrrrrrorRRhRRRo"),
(27,7,"odrrrrrrrorRRRRRRo"),
(28,7,"oddrrrrrroorRRRRRo"),
(29,8,"ooddddddokkkkkko"),
(30,13,"osSSoosSSo"),
(31,13,"obnnoobnno"),
(32,13,"obnnoobnno"),
(33,12,"obnnnoobnnnoo"),
(34,12,"obnnnoobnnnnto"),
(35,12,"obbbbbobbbbbbo"),
(36,13,"ooooo.oooooo"),
]
def side():
    g=grid(); t=1
    for r,c,s in SIDE: put(g,t+r,c,s)
    hairtone(g,t,t+9)
    for (y,x) in [(t+3,12),(t+4,13),(t+3,15),(t+2,14)]:
        if g[y][x] in 'dr': g[y][x]='R'
    # sword in front: grip under hands, guard, blade
    put(g,t+23,23,"ob")
    put(g,t+24,21,"oo1221o")
    for y in range(25,33): put(g,t+y,22,"o32o")
    put(g,t+33,22,"o32o"); put(g,t+34,23,"oo"); 
    for (y,x) in [(t+3,11),(t+4,12),(t+2,13),(t+3,15)]:
        if g[y][x] in 'dr': g[y][x]='R' 
    return g
if __name__=='__main__':
    F,S,B=front(),side(),back()
    ims=[img(F),img(S),img(B)]
    for n,im in zip(['down','side','up'],ims): im.save(f'idle_{n}_1.png')
    preview(ims,'p3.png')
