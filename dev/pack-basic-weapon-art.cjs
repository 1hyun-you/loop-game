const fs = require('fs');
const path = require('path');

function packBasicWeaponArt() {
  const assets = path.join(__dirname, '../assets');
  const files = {
    ...Object.fromEntries(['cleave', 'shield', 'arrow', 'shuriken'].map(id => [id, 'basic-weapons-art1/' + id])),
    ...Object.fromEntries(['trap', 'fireball', 'orb', 'beam'].map(id => [id, 'basic-weapons-art2/' + id])),
    icering: 'chrono-art8/base-ice-ring',
  };
  const sources = Object.fromEntries(Object.entries(files).map(([id, file]) => [
    id, 'data:image/webp;base64,' + fs.readFileSync(path.join(assets, file + '.webp')).toString('base64'),
  ]));
  return 'const BASIC_WEAPON_ART_DATA = ' + JSON.stringify(sources) + ';\n';
}

if (require.main === module) process.stdout.write(packBasicWeaponArt());
module.exports = { packBasicWeaponArt };
