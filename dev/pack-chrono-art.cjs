const fs = require('node:fs');
const path = require('node:path');

function packChronoArt() {
  const dir = path.resolve(__dirname, '../assets/chrono-art8');
  const ids = [
    'base-ice-ring', 'delayed-burst', 'frozen-blade', 'pendulum-orb',
    'rewind-star', 'stasis-arrow', 'time-backflow', 'time-collapse',
    'time-needle', 'time-rift',
  ];
  const images = Object.fromEntries(ids.map(id => [
    id, 'data:image/webp;base64,' + fs.readFileSync(path.join(dir, id + '.webp')).toString('base64'),
  ]));
  return 'const CHRONO_ART_DATA = ' + JSON.stringify(images, null, 2) + ';\n';
}

if (require.main === module) process.stdout.write(packChronoArt());
module.exports = { packChronoArt };
