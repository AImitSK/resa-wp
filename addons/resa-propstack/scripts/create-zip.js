/**
 * Create distribution ZIP for Propstack add-on
 *
 * Usage: npm run zip
 * Output: resa-propstack-{version}.zip
 */

const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

const packageJson = require('../package.json');
const version = packageJson.version;
const zipName = `resa-propstack-${version}.zip`;
const rootDir = path.resolve(__dirname, '..');

console.log(`Creating ZIP: ${zipName}`);

// Create new ZIP
const zip = new AdmZip();

// Plugin folder name in ZIP (WordPress requirement)
const pluginFolder = 'resa-propstack';

// Include files (added to plugin folder)
const filesToInclude = [
	'resa-propstack.php',
	'readme.txt',
];

filesToInclude.forEach((file) => {
	const filePath = path.join(rootDir, file);
	if (fs.existsSync(filePath)) {
		zip.addLocalFile(filePath, pluginFolder);
		console.log(`✓ Added ${pluginFolder}/${file}`);
	} else {
		console.warn(`⚠ File not found: ${file}`);
	}
});

// Include directories
const dirsToInclude = [
	{ local: 'includes', zip: `${pluginFolder}/includes` },
	{ local: 'vendor', zip: `${pluginFolder}/vendor` },
	{ local: 'languages', zip: `${pluginFolder}/languages` },
];

dirsToInclude.forEach((dir) => {
	const dirPath = path.join(rootDir, dir.local);
	if (fs.existsSync(dirPath)) {
		zip.addLocalFolder(dirPath, dir.zip);
		console.log(`✓ Added ${dir.local}/`);
	} else {
		console.log(`⚠ Directory not found: ${dir.local}/ (skipping)`);
	}
});

// Write ZIP
const zipPath = path.join(rootDir, zipName);
zip.writeZip(zipPath);

console.log(`\n✅ Created ${zipName} (${(fs.statSync(zipPath).size / 1024).toFixed(2)} KB)`);
