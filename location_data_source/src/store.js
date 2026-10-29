import { readFile } from "node:fs/promises";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveDataDir() {
  if (process.env.DATA_DIR) {
    return path.resolve(process.env.DATA_DIR);
  }
  // Try relative to current working directory
  const cwdPath = path.resolve(process.cwd(), "data/generated");
  if (fs.existsSync(cwdPath)) return cwdPath;

  // Try relative to module file location
  const modulePath = path.resolve(__dirname, "..", "data/generated");
  if (fs.existsSync(modulePath)) return modulePath;

  return cwdPath;
}

const dataDir = resolveDataDir();

const collections = {
  states: [],
  districts: [],
  subdistricts: [],
  urban_local_bodies: [],
  villages: []
};

let metadata = {};
let isLoaded = false;

async function loadJson(name, fallback) {
  try {
    const content = await readFile(path.join(dataDir, `${name}.json`), "utf8");
    return JSON.parse(content);
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

export async function loadStore(force = false) {
  if (isLoaded && !force) return;
  for (const name of Object.keys(collections)) {
    collections[name] = await loadJson(name, []);
  }
  metadata = await loadJson("metadata", {});
  isLoaded = true;
}

export function getCollection(name) {
  return collections[name] || [];
}

export function getMetadata() {
  return metadata;
}

export function isStoreLoaded() {
  return isLoaded;
}
