import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/**
 * Parses a .env file into key-value pairs
 */
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      env[key] = val;
    }
  }
  return env;
}

function syncFirebaseConfig() {
  const envPath = path.join(rootDir, '.env');
  const envExamplePath = path.join(rootDir, '.env.example');
  const env = fs.existsSync(envPath) ? parseEnvFile(envPath) : parseEnvFile(envExamplePath);

  const projectId = env.VITE_FIREBASE_PROJECT_ID || 'your-pokedex-project';

  // 1. Sync .firebaserc
  const firebasercPath = path.join(rootDir, '.firebaserc');
  const firebaserc = {
    projects: {
      default: projectId
    }
  };
  fs.writeFileSync(firebasercPath, JSON.stringify(firebaserc, null, 2) + '\n');
  console.log(`✔ [sync_firebase_config] Generated .firebaserc with project: "${projectId}"`);

  // 2. Generate firebase.json from firebase.template.json
  const templatePath = path.join(rootDir, 'firebase.template.json');
  const targetPath = path.join(rootDir, 'firebase.json');
  
  const sourcePath = fs.existsSync(templatePath) ? templatePath : targetPath;
  if (fs.existsSync(sourcePath)) {
    const config = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'));
    fs.writeFileSync(targetPath, JSON.stringify(config, null, 2) + '\n');
    console.log(`✔ [sync_firebase_config] Generated clean firebase.json`);
  }
}

syncFirebaseConfig();
