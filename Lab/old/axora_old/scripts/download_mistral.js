import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODEL_ID = "Mistral-7B-Instruct-v0.3-q4f16_1-MLC";
const BASE_URL = `https://huggingface.co/mlc-ai/${MODEL_ID}/resolve/main/`;
const DEST_DIR = path.join(__dirname, `../public/models/${MODEL_ID}`);

if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
}

async function fetchJson(filename) {
    return new Promise((resolve, reject) => {
        const url = BASE_URL + filename;
        const get = (targetUrl) => {
            https.get(targetUrl, (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    let redirectUrl = res.headers.location;
                    if (redirectUrl.startsWith('/')) {
                        redirectUrl = `https://huggingface.co${redirectUrl}`;
                    }
                    get(redirectUrl);
                    return;
                }
                if (res.statusCode !== 200) {
                    reject(new Error(`Failed to fetch ${filename}: ${res.statusCode}`));
                    return;
                }
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(e);
                    }
                });
            }).on('error', reject);
        };
        get(url);
    });
}

async function downloadFile(filename) {
    const url = BASE_URL + filename;
    const destPath = path.join(DEST_DIR, filename);

    if (fs.existsSync(destPath)) {
        console.log(`Skipping ${filename} (already exists)`);
        return;
    }

    const file = fs.createWriteStream(destPath);

    return new Promise((resolve, reject) => {
        console.log(`Downloading ${filename}...`);
        https.get(url, (response) => {
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                let redirectUrl = response.headers.location;
                if (redirectUrl.startsWith('/')) {
                    redirectUrl = `https://huggingface.co${redirectUrl}`;
                }
                https.get(redirectUrl, (redirectResponse) => {
                    if (redirectResponse.statusCode !== 200) {
                        reject(new Error(`Status ${redirectResponse.statusCode}`));
                        return;
                    }
                    redirectResponse.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        console.log(`Saved ${filename}`);
                        resolve();
                    });
                }).on('error', reject);
                return;
            }

            if (response.statusCode !== 200) {
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
            fs.unlink(destPath, () => { });
            reject(err);
        });
    });
}

async function main() {
    console.log(`Target Model: ${MODEL_ID}`);

    // 1. Get Cache Manifest to know which shards to download
    console.log("Fetching manifest...");
    const cacheManifest = await fetchJson("ndarray-cache.json");

    // 2. Build file list
    const files = [
        "mlc-chat-config.json",
        "ndarray-cache.json",
        "tokenizer.json",
        "tokenizer_config.json",
        "tokenizer.model"
    ];

    // Add shards from manifest
    cacheManifest.records.forEach(record => {
        if (!files.includes(record.dataPath)) {
            files.push(record.dataPath);
        }
    });

    console.log(`Found ${files.length} files to download.`);

    // 3. Download Model Files
    for (const file of files) {
        try {
            await downloadFile(file);
        } catch (e) {
            console.error(`Failed to download ${file}:`, e);
        }
    }

    // 4. Download WASM
    console.log("Downloading WASM binary...");
    const wasmUrl = "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_80/Mistral-7B-Instruct-v0.3-q4f16_1-ctx4k_cs1k-webgpu.wasm";
    const wasmDest = path.join(__dirname, "../public/wasm/Mistral-7B-Instruct-v0.3-q4f16_1-ctx4k_cs1k-webgpu.wasm");

    // Create wasm dir if not exists (should exist from gemma but safety check)
    const wasmDir = path.dirname(wasmDest);
    if (!fs.existsSync(wasmDir)) fs.mkdirSync(wasmDir, { recursive: true });

    if (!fs.existsSync(wasmDest)) {
        const file = fs.createWriteStream(wasmDest);
        await new Promise((resolve, reject) => {
            https.get(wasmUrl, (res) => {
                if (res.statusCode !== 200) {
                    reject(new Error(`WASM Fetch failed: ${res.statusCode}`));
                    return;
                }
                res.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log("Saved WASM binary.");
                    resolve();
                });
            }).on('error', reject);
        });
    } else {
        console.log("WASM binary already exists.");
    }

    console.log("Mistral download completed.");
}

main();
