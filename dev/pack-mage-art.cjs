const fs = require('node:fs');
const path = require('node:path');

function packMageArt() {
  const dir = path.resolve(__dirname, '../assets/mage-art9');
  const ids = [
    'base-fireball', 'elemental-shield', 'elemental-spirit', 'fire-rune',
    'flame-beam', 'flame-spear', 'flame-whip', 'meteor-drop', 'ricochet-fireball', 'steam-burst',
  ];
  const images = Object.fromEntries(ids.map(id => [
    id, 'data:image/webp;base64,' + fs.readFileSync(path.join(dir, id + '.webp')).toString('base64'),
  ]));
  return 'const MAGE_ART_DATA = ' + JSON.stringify(images, null, 2) + ';\n';
}

if (require.main === module) process.stdout.write(packMageArt());
module.exports = { packMageArt };
