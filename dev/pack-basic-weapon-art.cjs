const fs = require('fs');
const path = require('path');

function packBasicWeaponArt() {
  const dir = path.join(__dirname, '../assets/basic-weapons-art1');
  const ids = ['cleave', 'shield', 'arrow', 'shuriken'];
  const sources = Object.fromEntries(ids.map(id => [
    id, 'data:image/webp;base64,' + fs.readFileSync(path.join(dir, id + '.webp')).toString('base64'),
  ]));
  return 'const BASIC_WEAPON_ART_DATA = ' + JSON.stringify(sources) + ';\n';
}

if (require.main === module) process.stdout.write(packBasicWeaponArt());
module.exports = { packBasicWeaponArt };
