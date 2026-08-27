/**
 * Script de Upload de Imagens para o Firebase Storage
 * 
 * Uso:
 * 1. Obtenha a chave de conta de serviço no Console Firebase (Configurações do Projeto -> Contas de Serviço -> Gerar Nova Chave Privada)
 * 2. Salve como 'serviceAccountKey.json' na raiz do projeto (este arquivo já está no .gitignore)
 * 3. Execute:
 *    node scripts/upload_to_firebase.js [seu-bucket.appspot.com] [pasta-imagens]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const DEFAULT_CARDS_DIR = path.join(ROOT_DIR, 'downloads', 'cards');
const SERVICE_ACCOUNT_PATH = path.join(ROOT_DIR, 'serviceAccountKey.json');

async function main() {
  console.log('====================================================');
  console.log('   POKÉDEX TCG - UPLOAD PARA FIREBASE STORAGE       ');
  console.log('====================================================\n');

  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.warn('⚠️  Aviso: Arquivo "serviceAccountKey.json" não encontrado na raiz!');
    console.log('\nPara executar o upload:');
    console.log('1. Acesse https://console.firebase.google.com/');
    console.log('2. Vá em Configurações do Projeto > Contas de Serviço');
    console.log('3. Clique em "Gerar nova chave privada" e salve como "serviceAccountKey.json" na raiz');
    console.log('4. Rode: node scripts/upload_to_firebase.js <seu-storage-bucket.appspot.com> [pasta-imagens]\n');
    return;
  }

  try {
    const admin = await import('firebase-admin');
    const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
    
    const bucketName = process.argv[2] || process.env.VITE_FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`;
    const cardsDir = process.argv[3] || (fs.existsSync(DEFAULT_CARDS_DIR) ? DEFAULT_CARDS_DIR : path.join(ROOT_DIR, 'public', 'cards'));

    if (!fs.existsSync(cardsDir)) {
      console.error(`❌ Pasta de imagens "${cardsDir}" não encontrada! Rode primeiro: npm run download:cards`);
      return;
    }

    if (!admin.getApps().length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: bucketName
      });
    }

    const bucket = admin.storage().bucket();
    const files = fs.readdirSync(cardsDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.webp'));

    console.log(`🚀 Iniciando upload de ${files.length} imagens de "${cardsDir}" para o bucket "${bucketName}"...\n`);

    let uploaded = 0;
    for (const file of files) {
      const filePath = path.join(cardsDir, file);
      const destination = `cards/${file}`;

      await bucket.upload(filePath, {
        destination,
        metadata: {
          cacheControl: 'public, max-age=31536000',
          contentType: file.endsWith('.png') ? 'image/png' : 'image/jpeg'
        }
      });

      uploaded++;
      process.stdout.write(`\r✅ Uploaded ${uploaded}/${files.length} (${file})`);
    }

    console.log('\n\n✨ Upload concluído com sucesso!');
    console.log(`Total de ${uploaded} imagens no Firebase Storage.`);
  } catch (error) {
    console.error('\n❌ Erro durante o upload:', error);
  }
}

main();
