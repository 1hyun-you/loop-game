// Cross-platform equivalent of build.sh. Keep its explicit source order authoritative.
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..');
const sh=fs.readFileSync(path.join(root,'build.sh'),'utf8');
const { packEngineerArt } = require('./pack-engineer-art.cjs');
const { packChronoArt } = require('./pack-chrono-art.cjs');
const { packMageArt } = require('./pack-mage-art.cjs');
const { packSummonerArt } = require('./pack-summoner-art.cjs');
const { packPriestArt } = require('./pack-priest-art.cjs');
const { packDruidArt } = require('./pack-druid-art.cjs');
const { packHeroOutfits } = require('./pack-hero-outfits.cjs');
const { packSummonUnitArt } = require('./pack-summon-unit-art.cjs');
const files=[...sh.matchAll(/src\/[\w-]+\.(?:html|js)/g)].map(x=>x[0]);
fs.writeFileSync(path.join(root,'index.html'),files.map(file => {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  if (file === 'src/art-theme.js') return packHeroOutfits() + source;
  if (file === 'src/engineer-art.js') return packEngineerArt() + source;
  if (file === 'src/chrono-art.js') return packChronoArt() + source;
  if (file === 'src/mage-art.js') return packMageArt() + source;
  if (file === 'src/summoner-art.js') return packSummonerArt() + source;
  if (file === 'src/priest-art.js') return packPriestArt() + source;
  if (file === 'src/druid-art.js') return packDruidArt() + source;
  if (file === 'src/summon-unit-art.js') return packSummonUnitArt() + source;
  return source;
}).join('')+'\n</script>\n');
console.log('Built '+files.length+' sources.');
