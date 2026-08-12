#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { buildCoverArtArchiveCandidates, selectCoverArtArchiveImportAlbums } from '../src/data/cover-art-archive-candidates.js';

const DEFAULT_USER_AGENT = 'AlbumExplorer/0.1.0 (https://github.com/utrost/AlbumExplorer)';
const COVER_ART_ARCHIVE_BASE_URL = 'https://coverartarchive.org';

const [
  ,
  ,
  atlasPath = 'data/app/album-atlas.json',
  outputPath = 'data/enrichment/cover-art-archive-candidates.json',
  ...args
] = process.argv;

const limit = numericOption(args, '--limit');
const delayMs = numericOption(args, '--delay-ms') ?? 1100;
const cacheDir = option(args, '--cache-dir') ?? 'data/imports/cover-art-archive/release-groups';
const userAgent = option(args, '--user-agent') ?? DEFAULT_USER_AGENT;
const atlas = JSON.parse(readFileSync(atlasPath, 'utf8'));
const selectedAlbums = selectCoverArtArchiveImportAlbums({ albums: atlas.albums ?? [] });
const albums = selectedAlbums.slice(0, limit ?? Infinity);
const responsesByAlbumId = new Map();
let networkFetches = 0;

mkdirSync(dirname(outputPath), { recursive: true });
mkdirSync(cacheDir, { recursive: true });

for (let index = 0; index < albums.length; index += 1) {
  const album = albums[index];
  const cachePath = join(cacheDir, `${album.musicBrainzReleaseGroupId}.json`);
  const response = await fetchOrReadJsonOrNull(cachePath, coverArtArchiveUrl(album.musicBrainzReleaseGroupId));
  if (response) responsesByAlbumId.set(album.id, response);
  console.log(`${index + 1}/${albums.length} ${response ? 'cached' : 'gap'} ${album.artist} — ${album.album}`);
}

const output = {
  ...buildCoverArtArchiveCandidates({ albums, responsesByAlbumId }),
  source: {
    system: 'cover-art-archive',
    endpoint: `${COVER_ART_ARCHIVE_BASE_URL}/release-group/{mbid}`,
    cacheDir,
    userAgent,
    delayMs
  },
  scope: {
    atlasPath,
    selectedAlbumCount: selectedAlbums.length,
    selection: limit ? `first ${albums.length} cover-art gaps with MusicBrainz release-group refs` : 'all cover-art gaps with MusicBrainz release-group refs',
    albumCount: albums.length
  }
};

writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`Cover Art Archive scope: ${albums.length} albums`);
console.log(`Cover Art Archive candidates: ${output.candidates.length}`);
console.log(`Cover Art Archive gaps: ${output.gaps.length}`);
console.log(`Network fetches: ${networkFetches}`);
console.log(`Output: ${outputPath}`);
console.log(`Raw cache: ${cacheDir}`);

async function fetchOrReadJsonOrNull(cachePath, url) {
  if (existsSync(cachePath)) return JSON.parse(readFileSync(cachePath, 'utf8'));
  if (networkFetches > 0) await sleep(delayMs);
  const response = await fetch(url, { headers: { 'User-Agent': userAgent, Accept: 'application/json' } });
  networkFetches += 1;
  if (response.status === 404) {
    writeFileSync(cachePath, `${JSON.stringify({ fetchedAt: null, url, status: 404, images: [] }, null, 2)}\n`, 'utf8');
    return { images: [] };
  }
  if (!response.ok) {
    console.warn(`Cover Art Archive request failed for ${url}: ${response.status} ${response.statusText}`);
    return null;
  }
  const data = await response.json();
  writeFileSync(cachePath, `${JSON.stringify({ fetchedAt: null, url, ...data }, null, 2)}\n`, 'utf8');
  return data;
}

function coverArtArchiveUrl(mbid) {
  return `${COVER_ART_ARCHIVE_BASE_URL}/release-group/${encodeURIComponent(mbid)}`;
}

function numericOption(args, name) {
  const value = option(args, name);
  if (value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function option(args, name) {
  const index = args.indexOf(name);
  if (index < 0) return null;
  return args[index + 1] ?? null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
