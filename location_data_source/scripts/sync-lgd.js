import { createReadStream } from "node:fs";
import { access, chmod, mkdir, open, readdir, rename, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse";
import sevenZip from "7zip-bin";
import { isUsableRecord, normalizeRecord } from "../src/normalize.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const downloadDir = path.join(root, "data", "downloads");
const outputDir = path.join(root, "data", "generated");
const repository = "ramSeraph/opendata";
const releaseTags = ["lgd-latest", "lgd-latest-extra1"];

const defaultComponents = ["states", "districts", "subdistricts", "urban_local_bodies"];
if (String(process.env.INCLUDE_VILLAGES).toLowerCase() === "true") {
  defaultComponents.push("villages");
}

const components = (process.env.LGD_COMPONENTS || defaultComponents.join(","))
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

function githubHeaders() {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "lgd-json-api/1.0"
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function getJson(url) {
  const response = await fetch(url, { headers: githubHeaders() });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }
  return response.json();
}

async function listReleaseAssets(tag) {
  const release = await getJson(
    `https://api.github.com/repos/${repository}/releases/tags/${encodeURIComponent(tag)}`
  );

  const assets = [];
  for (let page = 1; ; page += 1) {
    const batch = await getJson(
      `https://api.github.com/repos/${repository}/releases/${release.id}/assets?per_page=100&page=${page}`
    );
    assets.push(...batch);
    if (batch.length < 100) break;
  }
  return assets;
}

function dateFromAssetName(name) {
  const match = name.match(/\.(\d{2})([A-Za-z]{3})(\d{4})\.csv\.7z$/);
  if (!match) return null;
  const [, day, monthText, year] = match;
  const month = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
    .indexOf(monthText.toLowerCase());
  if (month === -1) return null;
  return new Date(Date.UTC(Number(year), month, Number(day)));
}

function selectLatestAsset(assets, component) {
  const prefix = `${component}.`;
  return assets
    .map((asset) => ({ asset, date: dateFromAssetName(asset.name) }))
    .filter(({ asset, date }) => asset.name.startsWith(prefix) && date)
    .sort((a, b) => b.date - a.date)[0] || null;
}

async function download(url, destination) {
  const response = await fetch(url, {
    headers: { ...githubHeaders(), Accept: "application/octet-stream" },
    redirect: "follow"
  });
  if (!response.ok) throw new Error(`Download failed (${response.status}): ${url}`);

  const temporary = `${destination}.partial`;
  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(temporary, bytes);
  await rename(temporary, destination);
}

async function extract7z(archive, destination) {
  await mkdir(destination, { recursive: true });
  if (process.platform !== "win32") {
    await chmod(sevenZip.path7za, 0o755);
  }
  await new Promise((resolve, reject) => {
    const child = spawn(sevenZip.path7za, ["x", "-y", `-o${destination}`, archive], {
      stdio: "inherit"
    });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`7-Zip exited with code ${code}`));
    });
  });
}

async function findCsv(directory) {
  const names = await readdir(directory, { recursive: true });
  const relative = names.find((name) => String(name).toLowerCase().endsWith(".csv"));
  if (!relative) throw new Error(`No CSV found in ${directory}`);
  return path.join(directory, relative);
}

async function parseCsv(component, csvPath) {
  const handle = await open(csvPath, "r");
  const headerBuffer = Buffer.alloc(8192);
  const { bytesRead } = await handle.read(headerBuffer, 0, headerBuffer.length, 0);
  await handle.close();
  const firstLine = headerBuffer.subarray(0, bytesRead).toString("utf8").split(/\r?\n/, 1)[0];
  const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length
    ? ";"
    : ",";

  const records = [];
  const parser = createReadStream(csvPath).pipe(
    parse({
      columns: true,
      delimiter,
      bom: true,
      relax_column_count: true,
      relax_quotes: true,
      skip_empty_lines: true,
      trim: true
    })
  );

  for await (const row of parser) {
    const record = normalizeRecord(component, row);
    if (isUsableRecord(record)) records.push(record);
  }

  records.sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
  return records;
}

async function main() {
  await mkdir(downloadDir, { recursive: true });
  await mkdir(outputDir, { recursive: true });

  console.log("Reading current LGD archive listings...");
  const assetGroups = await Promise.all(releaseTags.map(listReleaseAssets));
  const allAssets = assetGroups.flat();
  const metadata = {
    source: "Local Government Directory-derived public archives",
    archiveRepository: `https://github.com/${repository}/releases`,
    syncedAt: new Date().toISOString(),
    components: {}
  };

  for (const component of components) {
    const selected = selectLatestAsset(allAssets, component);
    if (!selected) {
      console.warn(`Skipping ${component}: matching archive asset not found.`);
      continue;
    }

    const archivePath = path.join(downloadDir, selected.asset.name);
    const extractDir = path.join(downloadDir, `${component}-extracted`);
    try {
      await access(archivePath);
      console.log(`Using cached ${selected.asset.name}`);
    } catch {
      console.log(`Downloading ${selected.asset.name}...`);
      await download(selected.asset.browser_download_url, archivePath);
    }

    await rm(extractDir, { recursive: true, force: true });
    await extract7z(archivePath, extractDir);
    const csvPath = await findCsv(extractDir);
    const records = await parseCsv(component, csvPath);

    const outputPath = path.join(outputDir, `${component}.json`);
    await writeFile(outputPath, JSON.stringify(records));
    metadata.components[component] = {
      records: records.length,
      archive: selected.asset.name,
      archiveDate: selected.date.toISOString().slice(0, 10)
    };
    console.log(`Wrote ${records.length.toLocaleString()} ${component} records.`);
  }

  await writeFile(path.join(outputDir, "metadata.json"), JSON.stringify(metadata, null, 2));
  console.log("LGD JSON sync complete.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
