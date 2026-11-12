const fs = require('node:fs');
const path = require('node:path');

function packSummonerArt() {
  const dir = path.resolve(__dirname, '../assets/summoner-art10');
  const ids = [
    'arrow', 'base-beam', 'descent', 'frost', 'grave',
    'ricochet', 'scythe', 'tracking', 'ward', 'will-o-wisp',
  ];
  const images = Object.fromEntries(ids.map(id => [
    id, 'data:image/webp;base64,' + fs.readFileSync(path.join(dir, id + '.webp')).toString('base64'),
  ]));
  return 'const SUMMONER_ART_DATA = ' + JSON.stringify(images, null, 2) + ';\n';
}

if (require.main === module) process.stdout.write(packSummonerArt());
module.exports = { packSummonerArt };
