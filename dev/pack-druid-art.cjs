const fs = require('node:fs');
const path = require('node:path');

function packDruidArt() {
  const dir = path.resolve(__dirname, '../assets/druid-art12');
  const ids = ['frost', 'lava', 'paw', 'rift', 'shell', 'slam', 'snare', 'spirit', 'thorn', 'wolf'];
  const images = Object.fromEntries(ids.map(id => [
    id, 'data:image/webp;base64,' + fs.readFileSync(path.join(dir, id + '.webp')).toString('base64'),
  ]));
  return 'const DRUID_ART_DATA = ' + JSON.stringify(images, null, 2) + ';\n';
}

if (require.main === module) process.stdout.write(packDruidArt());
module.exports = { packDruidArt };
