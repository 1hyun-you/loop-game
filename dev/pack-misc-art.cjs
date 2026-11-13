const fs = require('node:fs');
const path = require('node:path');

function packMiscArt() {
  const directory = path.join(__dirname, '../assets/misc-art17');
  const files = ['frail.svg', 'heavy.svg', 'horde.svg', 'blight.svg', 'wolf.webp', 'bear.webp', 'charge.svg', 'altar.svg'];
  const urls = Object.fromEntries(files.map(file => {
    const [name, ext] = file.split('.');
    const mime = ext === 'svg' ? 'image/svg+xml' : 'image/webp';
    const data = fs.readFileSync(path.join(directory, file)).toString('base64');
    return [name, 'data:' + mime + ';base64,' + data];
  }));
  return 'const MISC_ART_DATA = ' + JSON.stringify(urls, null, 2) + ';\n';
}

if (require.main === module) process.stdout.write(packMiscArt());
module.exports = { packMiscArt };
