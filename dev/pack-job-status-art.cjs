const fs = require('node:fs');
const path = require('node:path');

function packJobStatusArt() {
  const dir = path.resolve(__dirname, '../assets/job-status-art15');
  const names = ['plate', 'flame', 'focus', 'mark', 'dial', 'hand', 'crests'];
  const images = Object.fromEntries(names.map(name => [
    name, 'data:image/webp;base64,' + fs.readFileSync(path.join(dir, name + '.webp')).toString('base64'),
  ]));
  return 'const JOB_STATUS_DATA = ' + JSON.stringify(images, null, 2) + ';\n';
}

if (require.main === module) process.stdout.write(packJobStatusArt());
module.exports = { packJobStatusArt };
