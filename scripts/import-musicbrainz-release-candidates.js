#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { buildMusicBrainzReleaseCandidates, selectMusicBrainzReleaseImportAlbums } from '../src/data/musicbrainz-release-candidates.js';

const DEFAULT_USER_AGENT = 'AlbumExplorer/0.1.0 (https://github.com/utrost/AlbumExplorer)';
const MUSICBRAINZ_BASE_URL = 'https://musicbrainz.org';

const [
  ,
  ,
  atlasPath = 'data/app/album-atlas.json',
  outputPath = 'data/enrichment/musicbrainz-release-candidates.json',
  ...args
] = process.argv;

const limit = numericOption(args, '--limit');
const delayMs = numericOption(args, '--delay-ms') ?? 1100;
const cacheDir = option(args, '--cache-dir') ?? 'data/imports/musicbrainz/releases-by-release-group';
const userAgent = option(args, '--user-agent') ?? DEFAULT_USER_AGENT;
const atlas = JSON.parse(readFileSync(atlasPath, 'utf8'));
const selectedAlbums = selectMusicBrainzReleaseImportAlbums({ albums: atlas.albums ?? [] });
const albums = selectedAlbums.slice(0, limit ?? Infinity);
const responsesByAlbumId = new Map();
let networkFetches = 0;

mkdirSync(dirname(outputPath), { recursive: true });
mkdirSync(cacheDir, { recursive: true });

for (let index = 0; index < albums.length; index += 1) {
  const album = albums[index];
  const cachePath = join(cacheDir, `${album.musicBrainzReleaseGroupId}.json`);
  const response = await fetchOrReadJsonOrNull(cachePath, musicBrainzReleaseSearchUrl(album.musicBrainzReleaseGroupId));
  if (response) responsesByAlbumId.set(album.id, response);
  console.log(`${index + 1}/${albums.length} ${response ? 'cached' : 'gap'} ${album.artist} — ${album.album}`);
}

const output = {
  ...buildMusicBrainzReleaseCandidates({ albums, responsesByAlbumId }),
  source: {
    system: 'musicbrainz-release',
    endpoint: `${MUSICBRAINZ_BASE_URL}/ws/2/release?release-group={mbid}&inc=media+recordings&fmt=json`,
    cacheDir,
    userAgent,
    delayMs
  },
  scope: {
    atlasPath,
    selectedAlbumCount: selectedAlbums.length,
    selection: limit ? `first ${albums.length} tracklist/duration gaps with MusicBrainz release-group refs` : 'all tracklist/duration gaps with MusicBrainz release-group refs',
    albumCount: albums.length
  }
};

writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`MusicBrainz release scope: ${albums.length} albums`);
console.log(`MusicBrainz release candidates: ${output.candidates.length}`);
console.log(`MusicBrainz release gaps: ${output.gaps.length}`);
console.log(`Network fetches: ${networkFetches}`);
console.log(`Output: ${outputPath}`);
console.log(`Raw cache: ${cacheDir}`);

async function fetchOrReadJsonOrNull(cachePath, url) {
  if (existsSync(cachePath)) return JSON.parse(readFileSync(cachePath, 'utf8'));
  if (networkFetches > 0) await sleep(delayMs);
  const response = await fetch(url, { headers: { 'User-Agent': userAgent, Accept: 'application/json' } });
  networkFetches += 1;
  if (response.status === 404) {
    writeFileSync(cachePath, `${JSON.stringify({ fetchedAt: null, url, status: 404, releases: [] }, null, 2)}\n`, 'utf8');
    return { releases: [] };
  }
  if (!response.ok) {
    console.warn(`MusicBrainz release request failed for ${url}: ${response.status} ${response.statusText}`);
    return null;
  }
  const data = await response.json();
  writeFileSync(cachePath, `${JSON.stringify({ fetchedAt: null, url, ...data }, null, 2)}\n`, 'utf8');
  return data;
}

function musicBrainzReleaseSearchUrl(mbid) {
  const params = new URLSearchParams({
    'release-group': mbid,
    inc: 'media+recordings',
    fmt: 'json',
    limit: '100'
  });
  return `${MUSICBRAINZ_BASE_URL}/ws/2/release?${params}`;
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
