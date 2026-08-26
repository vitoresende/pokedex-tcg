/**
 * Script de Upload de Imagens para o Firebase Storage
 * 
 * Uso:
 * 1. Obtenha a chave de conta de serviço no Console Firebase (Configurações do Projeto -> Contas de Serviço -> Gerar Nova Chave Privada)
 * 2. Salve como 'serviceAccountKey.json' na raiz do projeto (este arquivo já está no .gitignore)
 * 3. Configure a variável STORAGE_BUCKET ou informe via argumento:
 *    node scripts/upload_to_firebase.js [seu-bucket.appspot.com]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const CARDS_DIR = path.join(ROOT_DIR, 'public', 'cards');
const CARDS_JSON_PATH = path.join(ROOT_DIR, 'src', 'data', 'cards.json');
const SERVICE_ACCOUNT_PATH = path.join(ROOT_DIR, 'serviceAccountKey.json');

async function main() {
  console.log('====================================================');
  console.log('   POKÉDEX TCG - SCRIPT DE UPLOAD FIREBASE STORAGE   ');
  console.log('====================================================\n');

  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.warn('⚠️  Aviso: Arquivo "serviceAccountKey.json" não encontrado na raiz!');
    console.log('\nPara executar o upload em produção:');
    console.log('1. Acesse https://console.firebase.google.com/');
    console.log('2. Vá em Configurações do Projeto > Contas de Serviço');
    console.log('3. Clique em "Gerar nova chave privada" e salve como "serviceAccountKey.json"');
    console.log('4. Rode: node scripts/upload_to_firebase.js <seu-storage-bucket.appspot.com>\n');
    console.log('💡 DICA: As imagens já estão baixadas e prontas na pasta local public/cards/');
    console.log('A aplicação consome as imagens locais e CDN automaticamente sem bloqueio!\n');
    return;
  }

  try {
    const admin = await import('firebase-admin');
    const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
    
    const bucketName = process.argv[2] || process.env.VITE_FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`;

    if (!admin.getApps().length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: bucketName
      });
    }

    const bucket = admin.storage().bucket();
    const files = fs.readdirSync(CARDS_DIR).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));

    console.log(`🚀 Iniciando upload de ${files.length} imagens para o bucket "${bucketName}"...\n`);

    let uploaded = 0;
    for (const file of files) {
      const filePath = path.join(CARDS_DIR, file);
      const destination = `cards/${file}`;

      await bucket.upload(filePath, {
        destination,
        metadata: {
          cacheControl: 'public, max-age=31536000',
          contentType: 'image/png'
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
