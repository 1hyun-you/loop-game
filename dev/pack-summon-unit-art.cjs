const fs = require('node:fs');
const path = require('node:path');

function packSummonUnitArt() {
  const dir = path.resolve(__dirname, '../assets/summon-art14');
  const units = ['guard', 'clone', 'hawk', 'walker', 'wraith'];
  const images = Object.fromEntries(units.map(unit => [
    unit, 'data:image/webp;base64,' + fs.readFileSync(path.join(dir, unit + '.webp')).toString('base64'),
  ]));
  return 'const SUMMON_UNIT_DATA = ' + JSON.stringify(images, null, 2) + ';\n';
}

if (require.main === module) process.stdout.write(packSummonUnitArt());
module.exports = { packSummonUnitArt };
