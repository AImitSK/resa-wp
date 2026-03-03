#!/usr/bin/env node

/**
 * bump-version.js — Synchronizes the version across all four locations:
 *   1. package.json         → "version": "x.y.z"
 *   2. resa.php Header      → * Version: x.y.z
 *   3. resa.php Constant    → define('RESA_VERSION', 'x.y.z')
 *   4. readme.txt           → Stable tag: x.y.z
 *
 * Usage:
 *   node scripts/bump-version.js 1.0.0          # Set explicit version
 *   node scripts/bump-version.js patch           # 0.1.0 → 0.1.1
 *   node scripts/bump-version.js minor           # 0.1.0 → 0.2.0
 *   node scripts/bump-version.js major           # 0.1.0 → 1.0.0
 *   node scripts/bump-version.js 1.0.0 --tag     # + git commit & tag
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const SEMVER_RE = /^\d+\.\d+\.\d+$/;
const BUMP_KEYWORDS = ['patch', 'minor', 'major'];

// --- Helpers ---

function readJson(filePath) {
	const raw = readFileSync(filePath, 'utf-8');
	return JSON.parse(raw);
}

function bumpSemver(current, keyword) {
	const parts = current.split('.').map(Number);
	if (parts.length !== 3 || parts.some(isNaN)) {
		throw new Error(`Ungültige aktuelle Version in package.json: "${current}"`);
	}
	const [major, minor, patch] = parts;
	switch (keyword) {
		case 'major':
			return `${major + 1}.0.0`;
		case 'minor':
			return `${major}.${minor + 1}.0`;
		case 'patch':
			return `${major}.${minor}.${patch + 1}`;
		default:
			throw new Error(`Unbekanntes Keyword: "${keyword}"`);
	}
}

function updatePackageJson(filePath, version) {
	const pkg = readJson(filePath);
	const old = pkg.version;
	pkg.version = version;
	writeFileSync(filePath, JSON.stringify(pkg, null, '\t') + '\n', 'utf-8');
	return old;
}

function updateResaPhp(filePath, version) {
	let content = readFileSync(filePath, 'utf-8');
	let changes = 0;

	// Plugin header: " * Version:           x.y.z"
	const headerRe = /^(\s*\*\s*Version:\s*).+$/m;
	if (headerRe.test(content)) {
		content = content.replace(headerRe, `$1${version}`);
		changes++;
	} else {
		throw new Error('Konnte "* Version:" Header in resa.php nicht finden.');
	}

	// Constant: define('RESA_VERSION', 'x.y.z')
	const constantRe = /(define\(\s*'RESA_VERSION',\s*').+?('\s*\))/;
	if (constantRe.test(content)) {
		content = content.replace(constantRe, `$1${version}$2`);
		changes++;
	} else {
		throw new Error("Konnte RESA_VERSION Konstante in resa.php nicht finden.");
	}

	writeFileSync(filePath, content, 'utf-8');
	return changes;
}

function updateReadmeTxt(filePath, version) {
	let content = readFileSync(filePath, 'utf-8');

	// Stable tag: x.y.z
	const stableTagRe = /^(Stable tag:\s*).+$/m;
	if (stableTagRe.test(content)) {
		content = content.replace(stableTagRe, `$1${version}`);
		writeFileSync(filePath, content, 'utf-8');
		return true;
	}
	throw new Error('Konnte "Stable tag:" in readme.txt nicht finden.');
}

// --- Main ---

const args = process.argv.slice(2);
const doTag = args.includes('--tag');
const versionArg = args.find((a) => a !== '--tag');

if (!versionArg) {
	console.error(
		'Usage: node scripts/bump-version.js <version|patch|minor|major> [--tag]'
	);
	process.exit(1);
}

const pkgPath = resolve(ROOT, 'package.json');
const phpPath = resolve(ROOT, 'resa.php');

// Determine target version
let newVersion;
if (BUMP_KEYWORDS.includes(versionArg)) {
	const currentVersion = readJson(pkgPath).version;
	newVersion = bumpSemver(currentVersion, versionArg);
} else if (SEMVER_RE.test(versionArg)) {
	newVersion = versionArg;
} else {
	console.error(
		`Ungültiges Argument: "${versionArg}". Erwartet: x.y.z oder patch|minor|major`
	);
	process.exit(1);
}

const readmePath = resolve(ROOT, 'readme.txt');

// Apply changes
const oldVersion = updatePackageJson(pkgPath, newVersion);
updateResaPhp(phpPath, newVersion);
updateReadmeTxt(readmePath, newVersion);

console.log(`Version: ${oldVersion} → ${newVersion}`);
console.log(`  ✓ package.json`);
console.log(`  ✓ resa.php (Header + Konstante)`);
console.log(`  ✓ readme.txt (Stable tag)`);

// Optional: git commit + tag
if (doTag) {
	try {
		execSync(`git add package.json resa.php readme.txt`, { cwd: ROOT, stdio: 'pipe' });
		execSync(`git commit -m "chore: bump version to ${newVersion}"`, {
			cwd: ROOT,
			stdio: 'pipe',
		});
		execSync(`git tag v${newVersion}`, { cwd: ROOT, stdio: 'pipe' });
		console.log(`  ✓ Git commit + tag v${newVersion}`);
	} catch (err) {
		console.error(`Git-Fehler: ${err.message}`);
		process.exit(1);
	}
}
