const fs = require('node:fs');
const path = require('node:path');

function packHeroOutfits() {
  const dir = path.resolve(__dirname, '../assets/hero-art13');
  const jobs = ['warrior', 'rogue', 'sovereign', 'archer', 'engineer',
    'chrono', 'mage', 'summoner', 'priest', 'druid'];
  const images = Object.fromEntries(jobs.map(job => [
    job, 'data:image/webp;base64,' + fs.readFileSync(path.join(dir, job + '.webp')).toString('base64'),
  ]));
  return 'const HERO_OUTFIT_DATA = ' + JSON.stringify(images, null, 2) + ';\n';
}

if (require.main === module) process.stdout.write(packHeroOutfits());
module.exports = { packHeroOutfits };
