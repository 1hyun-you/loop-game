const fs = require('node:fs');
const path = require('node:path');

function packEngineerArt() {
  const dir = path.resolve(__dirname, '../assets/engineer-art7');
  const ids = [
    'base-trap', 'cooling-trap', 'crossbow-turret', 'crush-mine',
    'incendiary-mine', 'laser-pylon', 'repulsion-plate', 'ricochet-saw',
    'rotary-blades', 'tracking-drone',
  ];
  const images = Object.fromEntries(ids.map(id => [
    id, 'data:image/webp;base64,' + fs.readFileSync(path.join(dir, id + '.webp')).toString('base64'),
  ]));
  return 'const ENGINEER_ART_DATA = ' + JSON.stringify(images, null, 2) + ';\n';
}

if (require.main === module) process.stdout.write(packEngineerArt());
module.exports = { packEngineerArt };
