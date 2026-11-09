// Rebuild embedded artwork after editing the optimized files in assets/art2.
// No external dependencies. Run this before sh build.sh when an image changes.
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const names=['bat','skel','brute','gob','jelly','mush','boar','knight','wisp','bargan','igna','morden','seren','demon','icons','ground','title'];
const data=Object.fromEntries(names.map(name=>[name,'data:image/webp;base64,'+fs.readFileSync(path.join(root,'assets/art2',name+'.webp')).toString('base64')]));
fs.writeFileSync(path.join(root,'src/art-data.js'),'/* Generated optimized painted assets. Repack with node dev/pack-art2.cjs after editing assets/art2. */\nconst ART2_DATA = '+JSON.stringify(data)+';\n');
console.log('Packed '+names.length+' artwork files.');
