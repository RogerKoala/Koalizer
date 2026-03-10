/**
 * sync-version.js
 * Reads the version from package.json and syncs it with:
 *  - src-tauri/tauri.conf.json
 *  - src-tauri/Cargo.toml
 *
 * Usage: node scripts/sync-version.js
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// 1. Read version from package.json
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf-8"));
const version = pkg.version;
console.log(`Version detected in package.json: ${version}`);

// 2. Update tauri.conf.json
const tauriConfPath = join(root, "src-tauri", "tauri.conf.json");
const tauriConf = JSON.parse(readFileSync(tauriConfPath, "utf-8"));
const oldTauriVersion = tauriConf.version;
tauriConf.version = version;
writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, " ") + "\n");
console.log(`tauri.conf.json: ${oldTauriVersion} → ${version}`);

// 3. Update Cargo.toml
const cargoPath = join(root, "src-tauri", "Cargo.toml");
let cargoContent = readFileSync(cargoPath, "utf-8");
const cargoMatch = cargoContent.match(/^version\s*=\s*"(.+?)"/m);
const oldCargoVersion = cargoMatch ? cargoMatch[1] : "unknown";
cargoContent = cargoContent.replace(
 /^version\s*=\s*".*?"/m,
 `version = "${version}"`,
);
writeFileSync(cargoPath, cargoContent);
console.log(`Cargo.toml:      ${oldCargoVersion} → ${version}`);

console.log("\nSynchronization completed!");
