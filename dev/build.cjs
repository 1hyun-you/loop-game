// Cross-platform equivalent of build.sh. Keep its explicit source order authoritative.
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..');
const sh=fs.readFileSync(path.join(root,'build.sh'),'utf8');
const { packEngineerArt } = require('./pack-engineer-art.cjs');
const files=[...sh.matchAll(/src\/[\w-]+\.(?:html|js)/g)].map(x=>x[0]);
fs.writeFileSync(path.join(root,'index.html'),files.map(file => {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  return file === 'src/engineer-art.js' ? packEngineerArt() + source : source;
}).join('')+'\n</script>\n');
console.log('Built '+files.length+' sources.');
