import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const packageJsonPath = path.join(rootDir, 'package.json');
const publicVersionPath = path.join(rootDir, 'public', 'version.json');
const srcVersionPath = path.join(rootDir, 'src', 'version.json');
const firebasercPath = path.join(rootDir, '.firebaserc');

// Get mode from CLI args: 'patch' | 'minor' | 'major' | 'auto' | 'show'
const arg = (process.argv[2] || 'auto').toLowerCase().replace(/^--?/, '');

function parseSemver(versionStr) {
  const parts = String(versionStr || '1.0.0').split('.').map((p) => parseInt(p, 10) || 0);
  while (parts.length < 3) parts.push(0);
  return {
    major: parts[0],
    minor: parts[1],
    patch: parts[2],
  };
}

function compareSemver(a, b) {
  const sa = parseSemver(a);
  const sb = parseSemver(b);
  if (sa.major !== sb.major) return sa.major - sb.major;
  if (sa.minor !== sb.minor) return sa.minor - sb.minor;
  return sa.patch - sb.patch;
}

async function fetchRemoteVersion() {
  try {
    let projectId = process.env.VITE_FIREBASE_PROJECT_ID || '';
    if (!projectId && fs.existsSync(firebasercPath)) {
      const rc = JSON.parse(fs.readFileSync(firebasercPath, 'utf-8'));
      projectId = rc?.projects?.default || '';
    }
    if (!projectId || projectId === 'your-pokedex-project') return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://${projectId}.web.app/version.json?_t=${Date.now()}`, {
      signal: controller.signal,
      headers: { 'Cache-Control': 'no-cache' },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function bumpVersion() {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  let currentVersion = pkg.version || '1.0.0';

  let prevBuildNumber = 0;
  if (fs.existsSync(publicVersionPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(publicVersionPath, 'utf-8'));
      prevBuildNumber = Number(existing.buildNumber) || 0;
      if (existing.version && compareSemver(existing.version, currentVersion) > 0) {
        currentVersion = existing.version;
      }
    } catch {
      prevBuildNumber = 0;
    }
  }

  // Consult live deployed version on Firebase Hosting so stateless CI (Cloud Build)
  // always increments from the currently deployed production version
  const remoteData = await fetchRemoteVersion();
  if (remoteData) {
    if (remoteData.version && compareSemver(remoteData.version, currentVersion) > 0) {
      currentVersion = remoteData.version;
    }
    if (Number(remoteData.buildNumber) > prevBuildNumber) {
      prevBuildNumber = Number(remoteData.buildNumber);
    }
  }

  const semver = parseSemver(currentVersion);

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
