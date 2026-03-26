#!/usr/bin/env node

/**
 * create-zip.js — Creates a distributable ZIP file for the RESA WordPress plugin.
 *
 * Output: resa-{version}.zip with `resa/` as root folder.
 *
 * Usage: node scripts/create-zip.js
 * (Typically called via `npm run plugin:zip`)
 */

import { createWriteStream, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import archiver from 'archiver';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// Read version from package.json
const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'));
const version = pkg.version;
const zipName = `resa-${version}.zip`;
const outputPath = resolve(ROOT, zipName);

// Files and directories to include (relative to ROOT)
const INCLUDE_FILES = ['resa.php', 'readme.txt'];

const INCLUDE_DIRS = [
	'includes/',
	'modules/',
	'dist/',
	'freemius/',
	'vendor/',
	'languages/',
	'assets/',
];

// Patterns to exclude within included directories
const EXCLUDE_PATTERNS = [
	'**/node_modules/**',
	'**/.git/**',
	'**/.DS_Store',
	'**/Thumbs.db',
	'**/*.map',
];

// mPDF fonts to keep (all others will be excluded to reduce ZIP size)
// DejaVu is our default font, covers Latin/German characters
const MPDF_FONTS_TO_KEEP = [
	'DejaVuSans',
	'DejaVuSansCondensed',
	'DejaVuSansMono',
	'DejaVuSerif',
	'DejaVuSerifCondensed',
	'DejaVuinfo.txt',
];

async function createZip() {
	console.log(`Erstelle ${zipName} ...`);

	const output = createWriteStream(outputPath);
	const archive = archiver('zip', { zlib: { level: 9 } });

	const result = new Promise((ok, fail) => {
		output.on('close', () => {
			const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
			console.log(`\n✓ ${zipName} erstellt (${sizeMB} MB)`);
			ok();
		});
		archive.on('error', fail);
		archive.on('warning', (err) => {
			if (err.code === 'ENOENT') {
				console.warn(`  Warnung: ${err.message}`);
			} else {
				fail(err);
			}
		});
	});

	archive.pipe(output);

	// Add individual files
	for (const file of INCLUDE_FILES) {
		const filePath = resolve(ROOT, file);
		try {
			archive.file(filePath, { name: `resa/${file}` });
			console.log(`  + ${file}`);
		} catch {
			console.warn(`  ⚠ ${file} nicht gefunden, übersprungen`);
		}
	}

	// Add directories
	for (const dir of INCLUDE_DIRS) {
		const dirPath = resolve(ROOT, dir);
		try {
			archive.directory(dirPath, `resa/${dir}`, (entry) => {
				// Check exclusion patterns
				for (const pattern of EXCLUDE_PATTERNS) {
					const simple = pattern.replace(/\*\*\//g, '');
					if (entry.name.includes(simple.replace(/\*/g, ''))) {
						return false;
					}
				}

				// Filter mPDF fonts - keep only DejaVu fonts to reduce size (~88MB -> ~8MB)
				if (entry.name.includes('mpdf/mpdf/ttfonts/')) {
					const fontFile = entry.name.split('/').pop();
					const isKeptFont = MPDF_FONTS_TO_KEEP.some((f) => fontFile.startsWith(f));
					if (!isKeptFont) {
						return false;
					}
				}

				return entry;
			});
			console.log(`  + ${dir}`);
		} catch {
			console.warn(`  ⚠ ${dir} nicht gefunden, übersprungen`);
		}
	}

	await archive.finalize();
	await result;
}

createZip().catch((err) => {
	console.error(`Fehler beim Erstellen der ZIP-Datei: ${err.message}`);
	process.exit(1);
});
