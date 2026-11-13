const fs = require('fs');
const path = require('path');

function packSovereignArt() {
  const dir = path.join(__dirname, '../assets/sovereign-art5');
  const ids = [
    'base-shield', 'guard-cleave', 'royal-advance', 'archer-volley',
    'royal-barricade', 'shield-throw', 'royal-bombardment', 'ice-wall',
    'messenger-falcon', 'banner-radiance',
  ];
  const images = Object.fromEntries(ids.map(id => [
    id, 'data:image/webp;base64,' + fs.readFileSync(path.join(dir, id + '.webp')).toString('base64'),
  ]));
  return 'const SOVEREIGN_ART_DATA = ' + JSON.stringify(images) + ';\n';
}

if (require.main === module) process.stdout.write(packSovereignArt());
module.exports = { packSovereignArt };
