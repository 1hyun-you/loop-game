from pal import *
L=[
"................o...",
"..............o.oro.",
"............o.orrRro",
"...........ororRRrRr",
"..........odrRRrRRRR",
"..........odrRRRRhRR",
"..........odrrRRRRrr",
"...........odrrdrrdr",
"...........odrSdrrSS",
"............odSSSSSS",
"............osooSSSS",
"............oSSoooSS",
"............oSSSoSSS",
"............osSSoSSs",
".............osSSSSo",
"..............osSoo4",
"...............ooSSS",
"...........ooddooosS",
"..........oddrrdorRk",
"..........odrrosSSor",
"..........odrosSSSSo",
".........odrrosSkSor",
".........odrosSkSbbo",
".........odrosSSbtbS",
".........odroosbbSSS",
"........oddrobnnn122",
"........odrrorRRRo23",
".......odrrorRRRRo23",
".......odrrorRhRRo23",
".......oddrorRRRro23",
"........oddookkkko23",
"...........osSSsoo23",
"...........obnnnbo23",
"..........obnnnnbo23",
"..........obnnntbbo2",
"..........obbbbbbo.o",
"...........oooooo...",
]
def build():
    g=grid(); top=38-len(L)
    for i,row in enumerate(L):
        assert len(row)==20,(i,len(row))
        for x,ch in enumerate(row+row[::-1]): g[top+i][x]=ch
    # pauldron (viewer right) + hair asym tuft
    put(g,top+18,23,"onnnnoo")
    put(g,top+19,23,"onttnnbo")
    put(g,top+20,23,"otnnnnbo")
    put(g,top+21,24,"obbbbo")
    return g,top
if __name__=='__main__':
    g,t=build(); im=img(g); im.save('front.png'); preview([im],'pf.png'); print(t)
