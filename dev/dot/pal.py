from PIL import Image
P={'o':(49,24,21),'d':(90,20,20),'r':(143,37,31),'R':(210,58,46),'h':(242,84,52),
'b':(80,48,33),'n':(132,80,51),'t':(177,112,69),'s':(170,102,76),'S':(236,154,97),'k':(255,179,138),
'1':(81,72,74),'2':(135,124,126),'3':(194,181,175),'4':(241,221,193)}
def grid():
    return [['.']*40 for _ in range(40)]
def put(g,r,c,s):
    for i,ch in enumerate(s):
        if ch!=' ' and 0<=c+i<40: g[r][c+i]=ch
def img(g):
    im=Image.new('RGBA',(40,40),(0,0,0,0))
    for y in range(40):
        for x in range(40):
            ch=g[y][x]
            if ch!='.': im.putpixel((x,y),P[ch]+(255,))
    return im
def preview(ims,f,sc=8):
    W=len(ims)*(40*sc+12)+12
    P2=Image.new('RGBA',(W,40*sc+24),(128,128,128,255))
    for i,im in enumerate(ims):
        P2.alpha_composite(im.resize((40*sc,40*sc),Image.NEAREST),(12+i*(40*sc+12),12))
    P2.save(f)
