const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
console.log('Updating version - ' + args[0]);

const packagePath = path.join(path.dirname(__dirname), 'package.json');
const manifestPath = path.join(path.dirname(__dirname), 'app/manifest.json');

const version = args[0];
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const manifestJson = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

packageJson.version = version;
manifestJson.version = version;

try {
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    fs.writeFileSync(manifestPath, JSON.stringify(manifestJson, null, 4));
    //file written successfully
    console.log('Update successful');
} catch (err) {
    console.error(err);
}
