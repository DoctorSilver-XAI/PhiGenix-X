import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODEL_ID = "gemma-2-2b-it-q4f16_1-MLC";
const BASE_URL = `https://huggingface.co/mlc-ai/${MODEL_ID}/resolve/main/`;
const DEST_DIR = path.join(__dirname, `../public/models/${MODEL_ID}`);

// Files to download (based on what we saw in the directory)
const files = [
    "mlc-chat-config.json",
    "ndarray-cache.json",
    "tokenizer.json",
    "tokenizer_config.json",
    "tokenizer.model"
];

// Add param shards
for (let i = 0; i < 41; i++) { // based on file list seeing shard_41
    files.push(`params_shard_${i}.bin`);
}
// Add shards seen in the list that might go higher?
// In the list I saw params_shard_0 to 41.
// Let's rely on the file list we have on disk to know what to fetch.
const existingFiles = fs.readdirSync(DEST_DIR).filter(f => !f.startsWith('.'));

async function downloadFile(filename) {
    const url = BASE_URL + filename;
    const destPath = path.join(DEST_DIR, filename);
    const file = fs.createWriteStream(destPath);

    return new Promise((resolve, reject) => {
        console.log(`Downloading ${filename}...`);
        https.get(url, (response) => {
            // Handle redirects (301, 302, 303, 307, 308)
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                let redirectUrl = response.headers.location;
                if (redirectUrl.startsWith('/')) {
                    redirectUrl = `https://huggingface.co${redirectUrl}`;
                }

                // console.log(`Configuring redirect to: ${redirectUrl}`); // Optional debug

                https.get(redirectUrl, (redirectResponse) => {
                    if (redirectResponse.statusCode !== 200) {
                        console.error(`Error fetching redirect ${filename}: Status ${redirectResponse.statusCode}`);
                        reject(new Error(`Status ${redirectResponse.statusCode}`));
                        return;
                    }
                    redirectResponse.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        console.log(`Saved ${filename}`);
                        resolve();
                    });
                }).on('error', (err) => {
                    fs.unlink(destPath, () => { });
                    reject(err);
                });
                return;
            }

            if (response.statusCode !== 200) {
                console.error(`Error fetching ${filename}: Status ${response.statusCode}`);
                reject(new Error(`Status ${response.statusCode}`));
                return;
            }

            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`Saved ${filename}`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(destPath, () => { }); // Delete the file async. (But we don't check the result)
            reject(err);
        });
    });
}

async function main() {
    console.log(`Starting download of ${existingFiles.length} files to ${DEST_DIR}`);

    for (const file of existingFiles) {
        if (fs.lstatSync(path.join(DEST_DIR, file)).isDirectory()) continue;
        try {
            await downloadFile(file);
        } catch (e) {
            console.error(`Failed to download ${file}:`, e);
        }
    }
    console.log("All downloads completed.");
}

main();
