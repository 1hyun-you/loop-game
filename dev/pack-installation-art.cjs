const fs = require('node:fs');
const path = require('node:path');

function packInstallationArt() {
  const directory = path.resolve(__dirname, '../assets/installation-art16');
  const names = ['trap', 'mine', 'turret', 'missile'];
  const images = Object.fromEntries(names.map(name => [
    name, 'data:image/webp;base64,' + fs.readFileSync(path.join(directory, name + '.webp')).toString('base64'),
  ]));
  return 'const INSTALLATION_DATA = ' + JSON.stringify(images, null, 2) + ';\n';
}

if (require.main === module) process.stdout.write(packInstallationArt());
module.exports = { packInstallationArt };
