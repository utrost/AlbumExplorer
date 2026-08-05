#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { buildAlbumCreditCandidates } from '../src/data/album-credit-candidates.js';
import {
  buildDiscogsCreditSearchAliasMap,
  buildDiscogsMasterOverrideMap,
  discogsSearchAlbumFor,
  selectDiscogsMasterForAlbum
} from '../src/data/discogs-credit-source-import.js';

const DEFAULT_USER_AGENT = 'AlbumExplorer/0.1.0 (https://github.com/utrost/AlbumExplorer)';
const DISCOGS_BASE_URL = 'https://api.discogs.com';

const [, , comparisonPath = 'data/rolling-stone-comparison.json', outputPath = 'data/enrichment/album-credit-candidates.json', ...args] = process.argv;
const limit = numericOption(args, '--limit');
const delayMs = numericOption(args, '--delay-ms') ?? 1100;
const retryCount = numericOption(args, '--retries') ?? 4;
const retryDelayMs = numericOption(args, '--retry-delay-ms') ?? 15000;
const cacheDir = option(args, '--cache-dir') ?? 'data/imports/discogs';
const overridesPath = option(args, '--overrides') ?? 'data/review/discogs-credit-master-overrides.json';
const aliasesPath = option(args, '--aliases') ?? 'data/review/discogs-credit-search-aliases.json';
const userAgent = option(args, '--user-agent') ?? DEFAULT_USER_AGENT;

const comparison = JSON.parse(readFileSync(comparisonPath, 'utf8'));
const overrideData = existsSync(overridesPath) ? JSON.parse(readFileSync(overridesPath, 'utf8')) : { overrides: [] };
const aliasData = existsSync(aliasesPath) ? JSON.parse(readFileSync(aliasesPath, 'utf8')) : { aliases: [] };
const overrides = buildDiscogsMasterOverrideMap(overrideData);
const aliases = buildDiscogsCreditSearchAliasMap(aliasData);
const albums = (comparison.albums ?? []).slice(0, limit ?? Infinity);
const searchDir = join(cacheDir, 'master-search');
const masterDir = join(cacheDir, 'masters');
const releaseDir = join(cacheDir, 'releases');
mkdirSync(dirname(outputPath), { recursive: true });
mkdirSync(searchDir, { recursive: true });
mkdirSync(masterDir, { recursive: true });
mkdirSync(releaseDir, { recursive: true });

const mastersByAlbumId = new Map();
const review = [];
const gaps = [];
let networkFetches = 0;

for (let index = 0; index < albums.length; index += 1) {
  const album = albums[index];
  const queryAlbum = discogsSearchAlbumFor(album, aliases);
  const searchCachePath = join(searchDir, queryAlbum.searchAlias ? `${album.id}.alias.json` : `${album.id}.json`);
  const search = await fetchOrReadJsonOrNull(searchCachePath, discogsSearchUrl(queryAlbum));
  if (!search) {
    review.push(reviewItem(album, 'discogs-search-fetch-failed', []));
    console.log(`${index + 1}/${albums.length} review ${album.artist} — ${album.album}`);
    continue;
  }
  const selected = selectDiscogsMasterForAlbum(queryAlbum, search.results ?? [], overrides);

  if (selected.status === 'gap') {
    gaps.push(gapItem(album, selected.reason));
    console.log(`${index + 1}/${albums.length} gap ${album.artist} — ${album.album}`);
    continue;
  }
  if (selected.status === 'ambiguous') {
    review.push(reviewItem(album, selected.reason, selected.results));
    console.log(`${index + 1}/${albums.length} review ${album.artist} — ${album.album}`);
    continue;
  }

  const masterId = String(selected.result.master_id ?? selected.result.id);
  const masterCachePath = join(masterDir, `${masterId}.json`);
  const master = await fetchOrReadJsonOrNull(masterCachePath, selected.result.master_url ?? `${DISCOGS_BASE_URL}/masters/${masterId}`);
  if (!master) {
    review.push(reviewItem(album, 'discogs-master-fetch-failed', [selected.result]));
    console.log(`${index + 1}/${albums.length} review ${album.artist} — ${album.album}`);
    continue;
  }

  const releaseUrl = master.main_release_url ?? master.most_recent_release_url;
  const releaseId = String(master.main_release ?? master.most_recent_release ?? 'unknown');
  if (!releaseUrl || releaseId === 'unknown') {
    review.push(reviewItem(album, 'discogs-master-without-release-url', [selected.result]));
    console.log(`${index + 1}/${albums.length} review ${album.artist} — ${album.album}`);
    continue;
  }

  const releaseCachePath = join(releaseDir, `${releaseId}.json`);
  const release = await fetchOrReadJsonOrNull(releaseCachePath, releaseUrl);
  if (!release) {
    review.push(reviewItem(album, 'discogs-release-fetch-failed', [selected.result]));
    console.log(`${index + 1}/${albums.length} review ${album.artist} — ${album.album}`);
    continue;
  }

  mastersByAlbumId.set(album.id, { master: release, cachePath: releaseCachePath });
  console.log(`${index + 1}/${albums.length} cached ${album.artist} — ${album.album}`);
}

const cachedAlbums = albums.filter((album) => mastersByAlbumId.has(album.id));
const generated = buildAlbumCreditCandidates({ albums: cachedAlbums, discogsMastersByAlbumId: mastersByAlbumId });
const output = {
  ...generated,
  generatedAt: null,
  source: {
    system: 'discogs',
    searchEndpoint: `${DISCOGS_BASE_URL}/database/search`,
    cacheDir,
    userAgent,
    delayMs,
    overridesPath,
    aliasesPath,
    approvedOverrides: overrides.size,
    approvedAliases: aliases.size
  },
  scope: {
    comparisonPath,
    selection: limit ? `first ${albums.length} comparison albums sorted by latest edition rank` : 'all comparison albums sorted by latest edition rank',
    albumCount: albums.length
  },
  candidates: generated.candidates.map((candidate) => ({
    ...candidate,
    source: { ...candidate.source, system: 'discogs-release-cache' }
  })),
  review: [...review, ...generated.review],
  gaps: [...gaps, ...generated.gaps].filter((gap, index, all) => all.findIndex((item) => item.albumId === gap.albumId) === index)
};

writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`Discogs credit scope: ${albums.length} albums`);
console.log(`Discogs credit candidates: ${output.candidates.length}`);
console.log(`Discogs credit review: ${output.review.length}`);
console.log(`Discogs credit gaps: ${output.gaps.length}`);
console.log(`Network fetches: ${networkFetches}`);
console.log(`Output: ${outputPath}`);
console.log(`Raw cache: ${cacheDir}`);

async function fetchOrReadJsonOrNull(cachePath, url) {
  if (existsSync(cachePath)) return JSON.parse(readFileSync(cachePath, 'utf8'));
  if (networkFetches > 0) await sleep(delayMs);
  const response = await fetchWithRetry(url, { headers: { 'User-Agent': userAgent, Accept: 'application/json' } });
  if (!response.ok) {
    console.warn(`Discogs request failed for ${url}: ${response.status} ${response.statusText}`);
    return null;
  }
  const data = await response.json();
  writeFileSync(cachePath, `${JSON.stringify({ fetchedAt: null, url, ...data }, null, 2)}\n`, 'utf8');
  return data;
}

async function fetchOrReadJson(cachePath, url) {
  const data = await fetchOrReadJsonOrNull(cachePath, url);
  if (!data) throw new Error(`Discogs request failed for ${url}`);
  return data;
}

async function fetchWithRetry(url, options) {
  let response;
  for (let attempt = 1; attempt <= retryCount + 1; attempt += 1) {
    response = await fetch(url, options);
    networkFetches += 1;
    if (![429, 500, 502, 503, 504].includes(response.status)) return response;
    if (attempt > retryCount) return response;
    const retryAfter = Number(response.headers.get('retry-after'));
    const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : retryDelayMs * attempt;
    console.warn(`Discogs ${response.status}; retrying in ${waitMs}ms (${attempt}/${retryCount})`);
    await sleep(waitMs);
  }
  return response;
}

function discogsSearchUrl(album) {
  const params = new URLSearchParams({
    type: 'master',
    artist: album.artist,
    release_title: album.album,
    per_page: '5'
  });
  return `${DISCOGS_BASE_URL}/database/search?${params.toString()}`;
}

function gapItem(album, reason) {
  return { albumId: album.id, artist: album.artist, album: album.album, releaseYear: album.releaseYear ?? null, reason };
}

function reviewItem(album, reason, results) {
  return {
    albumId: album.id,
    artist: album.artist,
    album: album.album,
    releaseYear: album.releaseYear ?? null,
    reason,
    sourceCandidates: (results ?? []).slice(0, 5).map((result) => ({
      sourceType: 'discogs-master-search',
      id: String(result.master_id ?? result.id ?? ''),
      title: result.title ?? null,
      year: result.year ?? null,
      url: result.master_url ?? result.resource_url ?? null
    }))
  };
}

function option(args, name) {
  const index = args.indexOf(name);
  return index === -1 ? null : args[index + 1];
}

function numericOption(args, name) {
  const value = option(args, name);
  return value == null ? null : Number(value);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
