import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const packageJsonPath = path.join(rootDir, 'package.json');
const publicVersionPath = path.join(rootDir, 'public', 'version.json');
const srcVersionPath = path.join(rootDir, 'src', 'version.json');

// Get mode from CLI args: 'patch' | 'minor' | 'major' | 'auto' | 'show'
const arg = (process.argv[2] || 'auto').toLowerCase().replace(/^--?/, '');

function parseSemver(versionStr) {
  const parts = versionStr.split('.').map((p) => parseInt(p, 10) || 0);
  while (parts.length < 3) parts.push(0);
  return {
    major: parts[0],
    minor: parts[1],
    patch: parts[2],
  };
}

function bumpVersion() {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const currentVersion = pkg.version || '1.0.0';
  const semver = parseSemver(currentVersion);

  let prevBuildNumber = 0;
  if (fs.existsSync(publicVersionPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(publicVersionPath, 'utf-8'));
      prevBuildNumber = Number(existing.buildNumber) || 0;
    } catch {
      prevBuildNumber = 0;
    }
  }

  let nextVersion = currentVersion;
  const nextBuildNumber = prevBuildNumber + 1;

  if (arg === 'major') {
    nextVersion = `${semver.major + 1}.0.0`;
  } else if (arg === 'minor') {
    nextVersion = `${semver.major}.${semver.minor + 1}.0`;
  } else if (arg === 'patch' || arg === 'auto') {
    nextVersion = `${semver.major}.${semver.minor}.${semver.patch + 1}`;
  } else if (arg === 'show') {
    console.log(`Current version: ${currentVersion} (Build #${prevBuildNumber})`);
    return;
  } else if (/^\d+\.\d+\.\d+/.test(arg)) {
    // Explicit version passed: e.g. node bump_version.js 2.1.0
    nextVersion = arg;
  }

  // Update package.json
  pkg.version = nextVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');

  // Metadata object
  const buildTime = new Date().toISOString();
  const versionData = {
    version: nextVersion,
    buildNumber: nextBuildNumber,
    buildTime,
    env: process.env.NODE_ENV || 'production',
  };

  // Write to public/version.json and src/version.json
  if (!fs.existsSync(path.dirname(publicVersionPath))) {
    fs.mkdirSync(path.dirname(publicVersionPath), { recursive: true });
  }
  if (!fs.existsSync(path.dirname(srcVersionPath))) {
    fs.mkdirSync(path.dirname(srcVersionPath), { recursive: true });
  }

  fs.writeFileSync(publicVersionPath, JSON.stringify(versionData, null, 2) + '\n', 'utf-8');
  fs.writeFileSync(srcVersionPath, JSON.stringify(versionData, null, 2) + '\n', 'utf-8');

  console.log(`✔ [bump_version] Version updated: ${currentVersion} ➔ ${nextVersion} (Build #${nextBuildNumber} @ ${buildTime})`);
}

bumpVersion();
