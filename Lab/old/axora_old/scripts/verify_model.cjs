/**
 * Script de vérification et réparation des fichiers Mistral
 * Vérifie l'intégrité de tous les shards en comparant avec le manifeste
 */

const fs = require('fs');
const path = require('path');

const MODEL_DIR = path.join(__dirname, '../public/models/Mistral-7B-Instruct-v0.3-q4f16_1-MLC');
const MANIFEST_PATH = path.join(MODEL_DIR, 'ndarray-cache.json');

async function verifyAndRepair() {
    console.log('=== Vérification d\'intégrité des fichiers Mistral ===\n');

    // 1. Charger le manifeste
    if (!fs.existsSync(MANIFEST_PATH)) {
        console.error('❌ Manifeste ndarray-cache.json non trouvé!');
        return;
    }

    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    console.log(`📋 Manifeste chargé: ${manifest.records.length} entrées\n`);

    // 2. Extraire les tailles attendues pour chaque shard
    const expectedSizes = {};
    for (const record of manifest.records) {
        if (record.dataPath && record.nbytes) {
            expectedSizes[record.dataPath] = record.nbytes;
        }
    }

    console.log(`📦 ${Object.keys(expectedSizes).length} fichiers à vérifier\n`);

    // 3. Vérifier chaque fichier
    const corrupted = [];
    const missing = [];
    let okCount = 0;

    for (const [filename, expectedSize] of Object.entries(expectedSizes)) {
        const filePath = path.join(MODEL_DIR, filename);

        if (!fs.existsSync(filePath)) {
            missing.push(filename);
            console.log(`⚠️  ${filename}: MANQUANT`);
            continue;
        }

        const stats = fs.statSync(filePath);
        const actualSize = stats.size;

        if (actualSize !== expectedSize) {
            corrupted.push({ filename, expected: expectedSize, actual: actualSize });
            console.log(`❌ ${filename}: TRONQUÉ (${actualSize} vs ${expectedSize} attendu)`);
        } else {
            okCount++;
            // console.log(`✅ ${filename}: OK`);
        }
    }

    console.log(`\n=== Résumé ===`);
    console.log(`✅ Fichiers OK: ${okCount}`);
    console.log(`❌ Fichiers corrompus: ${corrupted.length}`);
    console.log(`⚠️  Fichiers manquants: ${missing.length}`);

    // 4. Supprimer les fichiers corrompus
    if (corrupted.length > 0) {
        console.log(`\n🗑️  Suppression des ${corrupted.length} fichiers corrompus...`);
        for (const { filename } of corrupted) {
            const filePath = path.join(MODEL_DIR, filename);
            fs.unlinkSync(filePath);
            console.log(`   Supprimé: ${filename}`);
        }
    }

    const totalToDownload = corrupted.length + missing.length;
    if (totalToDownload > 0) {
        console.log(`\n📥 ${totalToDownload} fichier(s) à re-télécharger.`);
        console.log(`   Lancez: node scripts/download_mistral.js`);
    } else {
        console.log(`\n🎉 Tous les fichiers sont intègres!`);
    }
}

verifyAndRepair().catch(console.error);
