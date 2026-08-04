#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { enrichCollectionWithDiscogsMasters } from '../src/data/discogs-enrichment.js';
import { validateCollection } from '../src/data/validator.js';

const [, , inputPath = 'data/collection.json', outputPath = 'data/collection.discogs.json', ...args] = process.argv;
const cacheDir = option(args, '--cache-dir') ?? 'data/imports/discogs/masters';
const downloadCovers = args.includes('--download-covers');
const coverDir = option(args, '--cover-dir') ?? 'covers/discogs';
const token = process.env.DISCOGS_TOKEN || process.env.DISCOGS_USER_TOKEN;

const collection = JSON.parse(readFileSync(inputPath, 'utf8'));
const masterIds = discogsMasterIds(collection);
const mastersById = new Map();

mkdirSync(cacheDir, { recursive: true });
if (downloadCovers) mkdirSync(coverDir, { recursive: true });

for (const id of masterIds) {
  const cachePath = join(cacheDir, `${id}.json`);
  let master;
  if (existsSync(cachePath)) {
    master = JSON.parse(readFileSync(cachePath, 'utf8'));
  } else {
    master = await fetchMaster(id, token);
    writeFileSync(cachePath, `${JSON.stringify(master, null, 2)}\n`, 'utf8');
  }
  mastersById.set(String(id), master);

  if (downloadCovers && master.images?.length) {
    await downloadCover(id, master.images[0], coverDir);
  }
}

const enriched = enrichCollectionWithDiscogsMasters(collection, mastersById);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(enriched, null, 2)}\n`, 'utf8');

const report = validateCollection(enriched);
console.log(`Discogs masters: ${mastersById.size}`);
console.log(`Albums: ${enriched.albums.length}`);
console.log(`Genres/styles: ${enriched.genres.length}`);
console.log(`Validation: ${report.errors.length} errors, ${report.warnings.length} warnings, ${report.info.length} metadata gaps`);

if (report.errors.length > 0) process.exit(1);

function discogsMasterIds(collection) {
  return [...new Set((collection.albums ?? []).flatMap((album) =>
    (album.externalRefs ?? [])
      .filter((ref) => ref.system === 'discogs-master' && ref.id)
      .map((ref) => String(ref.id))
  ))];
}

async function fetchMaster(id, token) {
  const headers = {
    'User-Agent': 'AlbumExplorerPrototype/0.1 +https://github.com/utrost/AlbumExplorer'
  };
  if (token) headers.Authorization = `Discogs token=${token}`;

  const response = await fetch(`https://api.discogs.com/masters/${id}`, { headers });
  if (!response.ok) {
    throw new Error(`Discogs master ${id} failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function downloadCover(id, image, coverDir) {
  const url = image.uri ?? image.uri150;
  if (!url) return;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'AlbumExplorerPrototype/0.1 +https://github.com/utrost/AlbumExplorer' }
  });
  if (!response.ok) {
    console.warn(`Cover ${id} failed: ${response.status} ${response.statusText}`);
    return;
  }
  const contentType = response.headers.get('content-type') ?? '';
  const ext = contentType.includes('png') ? 'png' : 'jpg';
  const bytes = new Uint8Array(await response.arrayBuffer());
  writeFileSync(join(coverDir, `${id}.${ext}`), bytes);
}

function option(args, name) {
  const index = args.indexOf(name);
  return index === -1 ? null : args[index + 1];
}
