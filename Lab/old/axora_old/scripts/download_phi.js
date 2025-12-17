import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CONFIGURATION PHI-3.5
const MODEL_ID = "Phi-3.5-mini-instruct-q4f16_1-MLC";
const BASE_URL = `https://huggingface.co/mlc-ai/${MODEL_ID}/resolve/main/`;
const DEST_DIR = path.join(__dirname, `../public/models/${MODEL_ID}`);
const WASM_FILENAME = "Phi-3.5-mini-instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm";

// v0_2_80 mandatory for WebLLM 0.2.80
const WASM_URL = `https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_80/${WASM_FILENAME}`;
const WASM_DEST = path.join(__dirname, `../public/wasm/${WASM_FILENAME}`);

if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
}

// Helper: Resolve Redirects & Fetch JSON
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

// Helper: Download File with Redirects
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
        const get = (targetUrl) => {
            https.get(targetUrl, (response) => {
                if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                    let redirectUrl = response.headers.location;
                    if (redirectUrl.startsWith('/')) {
                        redirectUrl = `https://huggingface.co${redirectUrl}`;
                    }
                    get(redirectUrl);
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
        };
        get(url);
    });
}

// Helper: Download WASM
async function downloadWasm() {
    console.log(`Downloading WASM binary: ${WASM_FILENAME}...`);

    // Ensure wasm dir
    const wasmDir = path.dirname(WASM_DEST);
    if (!fs.existsSync(wasmDir)) fs.mkdirSync(wasmDir, { recursive: true });

    if (fs.existsSync(WASM_DEST)) {
        console.log("WASM binary already exists.");
        return;
    }

    const file = fs.createWriteStream(WASM_DEST);
    return new Promise((resolve, reject) => {
        https.get(WASM_URL, (res) => {
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
}

async function main() {
    console.log(`Target Model: ${MODEL_ID}`);
    console.log("Phase 1: Fetching Manifest...");

    try {
        const cacheManifest = await fetchJson("ndarray-cache.json");

        const files = [
            "mlc-chat-config.json",
            "ndarray-cache.json",
            "tokenizer.json",
            "tokenizer_config.json",
            "tokenizer.model"
        ];

        // Add shards
        cacheManifest.records.forEach(record => {
            if (!files.includes(record.dataPath)) {
                files.push(record.dataPath);
            }
        });

        console.log(`Found ${files.length} files to download.`);

        // Download loop
        for (const file of files) {
            await downloadFile(file);
        }

        // Create symlink fix for WebLLM (resolve/main -> ..)
        // Note: Using fs.symlinkSync might require absolute paths or careful relative ones
        const linkDir = path.join(DEST_DIR, 'resolve', 'main');
        const linkParent = path.join(DEST_DIR, 'resolve');

        if (!fs.existsSync(linkParent)) fs.mkdirSync(linkParent, { recursive: true });

        // Check if link exists
        try {
            if (!fs.existsSync(linkDir)) {
                console.log("Creating Symlink for WebLLM compatibility...");
                // point to ../.. from inside resolve/main
                // Actually simple: just populate Resolve/Main with symlinks OR use the dir symlink trick
                // The previous trick was: resolve/main -> ..
                // Let's replicate the command: ln -s .. main inside resolve
                // But in node:
                process.chdir(linkParent);
                if (!fs.existsSync('main')) {
                    fs.symlinkSync('..', 'main');
                }
                process.chdir(__dirname); // Restore cwd
            }
        } catch (e) {
            console.warn("Symlink creation warning:", e.message);
        }

        // Download WASM
        await downloadWasm();

        console.log("\n✅ Phi-3.5 Download Completed Successfully!");

    } catch (e) {
        console.error("❌ Fatal Error:", e);
    }
}

main();
