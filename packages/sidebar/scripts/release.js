#!/usr/bin/env node

import { execFileSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// In the monorepo layout, the repo root is three levels up from this script.
const rootDir = join(__dirname, '..', '..', '..');
const packageDir = join(rootDir, 'packages', 'sidebar');

// Colors for terminal output
const colors = {
	reset: '\x1b[0m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	red: '\x1b[31m',
	cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
	console.log(`${colors[color]}${message}${colors.reset}`);
}

function run(command, args = [], options = {}) {
	log(`$ ${[command, ...args].join(' ')}`, 'cyan');
	try {
		execFileSync(command, args, { stdio: 'inherit', cwd: rootDir, ...options });
	} catch (error) {
		log(`Command failed: ${[command, ...args].join(' ')}`, 'red');
		process.exit(1);
	}
}

function getVersion() {
	const pkg = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf-8'));
	return pkg.version;
}

function bumpVersion(type) {
	const pkg = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf-8'));
	const [major, minor, patch] = pkg.version.split('.').map(Number);

	switch (type) {
		case 'major':
			pkg.version = `${major + 1}.0.0`;
			break;
		case 'minor':
			pkg.version = `${major}.${minor + 1}.0`;
			break;
		case 'patch':
		default:
			pkg.version = `${major}.${minor}.${patch + 1}`;
			break;
	}

	writeFileSync(join(packageDir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
	return pkg.version;
}

// Main
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const releaseType = args.find(arg => ['major', 'minor', 'patch'].includes(arg)) || 'patch';

if (dryRun) {
	log('\n*** DRY RUN MODE - No changes will be pushed ***\n', 'yellow');
}

log(`\nStarting ${releaseType} release...\n`, 'green');

// Step 1: Check for uncommitted changes
log('Checking for uncommitted changes...', 'yellow');
try {
	const status = execFileSync('git', ['status', '--porcelain'], {
		cwd: rootDir,
		encoding: 'utf-8'
	});
	if (status.trim()) {
		log('You have uncommitted changes. Please commit or stash them first.', 'red');
		console.log(status);
		process.exit(1);
	}
} catch {
	log('Failed to check git status', 'red');
	process.exit(1);
}

// Step 2: Run checks
log('\nRunning type check...', 'yellow');
run('pnpm', ['-C', packageDir, 'check']);

// Step 3: Build the package
log('\nBuilding package...', 'yellow');
run('pnpm', ['-C', packageDir, 'package']);

// Step 4: Bump version
log(`\nBumping version (${releaseType})...`, 'yellow');
const oldVersion = getVersion();
const newVersion = bumpVersion(releaseType);
log(`Version: ${oldVersion} → ${newVersion}`, 'green');

// Step 5: Commit and tag
log('\nCommitting and tagging...', 'yellow');
run('git', ['add', 'packages/sidebar/package.json']);
run('git', ['commit', '-m', `release: v${newVersion}`]);
run('git', ['tag', `v${newVersion}`]);

// Step 6: Push
if (dryRun) {
	log('\nDry run: Skipping push to GitHub', 'yellow');
	log('Would run: git push', 'cyan');
	log('Would run: git push --tags', 'cyan');
	log(`\n✓ Dry run complete for v${newVersion}`, 'green');
	log('\nTo release for real, run without --dry-run', 'yellow');
} else {
	log('\nPushing to GitHub...', 'yellow');
	run('git', ['push']);
	run('git', ['push', '--tags']);
	log(`\n✓ Released v${newVersion}`, 'green');
}
log(`\nUsers can install with:`, 'cyan');
log(`  npm install github:zakstam/sveltekit-sidebar`, 'reset');
log(`  npm install github:zakstam/sveltekit-sidebar#v${newVersion}`, 'reset');
