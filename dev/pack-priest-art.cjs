const fs = require('node:fs');
const path = require('node:path');

function packPriestArt() {
  const dir = path.resolve(__dirname, '../assets/priest-art11');
  const ids = ['arrow', 'beam', 'fall', 'fire', 'halo', 'orb', 'pilgrim', 'sign', 'sword', 'ward'];
  const images = Object.fromEntries(ids.map(id => [
    id, 'data:image/webp;base64,' + fs.readFileSync(path.join(dir, id + '.webp')).toString('base64'),
  ]));
  return 'const PRIEST_ART_DATA = ' + JSON.stringify(images, null, 2) + ';\n';
}

if (require.main === module) process.stdout.write(packPriestArt());
module.exports = { packPriestArt };
