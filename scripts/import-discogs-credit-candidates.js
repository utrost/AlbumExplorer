#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  albumCreditCandidateFromDiscogsMaster,
  buildAlbumCreditCandidates
} from '../src/data/album-credit-candidates.js';

const DEFAULT_USER_AGENT = 'AlbumExplorer/0.1.0 (https://github.com/utrost/AlbumExplorer)';
const DISCOGS_BASE_URL = 'https://api.discogs.com';

const [, , comparisonPath = 'data/rolling-stone-comparison.json', outputPath = 'data/enrichment/album-credit-candidates.json', ...args] = process.argv;
const limit = numericOption(args, '--limit') ?? 25;
const delayMs = numericOption(args, '--delay-ms') ?? 1100;
const retryCount = numericOption(args, '--retries') ?? 4;
const retryDelayMs = numericOption(args, '--retry-delay-ms') ?? 15000;
const cacheDir = option(args, '--cache-dir') ?? 'data/imports/discogs';
const userAgent = option(args, '--user-agent') ?? DEFAULT_USER_AGENT;

const comparison = JSON.parse(readFileSync(comparisonPath, 'utf8'));
const albums = (comparison.albums ?? []).slice(0, limit);
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
  const searchCachePath = join(searchDir, `${album.id}.json`);
  const search = await fetchOrReadJson(searchCachePath, discogsSearchUrl(album));
  const selected = selectDiscogsMasterSearchResult(album, search.results ?? []);

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
  const master = await fetchOrReadJson(masterCachePath, selected.result.master_url ?? `${DISCOGS_BASE_URL}/masters/${masterId}`);
  const releaseUrl = master.main_release_url ?? master.most_recent_release_url;
  const releaseId = String(master.main_release ?? master.most_recent_release ?? 'unknown');
  if (!releaseUrl || releaseId === 'unknown') {
    review.push(reviewItem(album, 'discogs-master-without-release-url', [selected.result]));
    console.log(`${index + 1}/${albums.length} review ${album.artist} — ${album.album}`);
    continue;
  }

  const releaseCachePath = join(releaseDir, `${releaseId}.json`);
  const release = await fetchOrReadJson(releaseCachePath, releaseUrl);
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
    delayMs
  },
  scope: {
    comparisonPath,
    selection: `first ${albums.length} comparison albums sorted by latest edition rank`,
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

async function fetchOrReadJson(cachePath, url) {
  if (existsSync(cachePath)) return JSON.parse(readFileSync(cachePath, 'utf8'));
  if (networkFetches > 0) await sleep(delayMs);
  const response = await fetchWithRetry(url, { headers: { 'User-Agent': userAgent, Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Discogs request failed for ${url}: ${response.status} ${response.statusText}`);
  const data = await response.json();
  writeFileSync(cachePath, `${JSON.stringify({ fetchedAt: null, url, ...data }, null, 2)}\n`, 'utf8');
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

function selectDiscogsMasterSearchResult(album, results) {
  const exact = (results ?? []).filter((result) => {
    if ((result.type ?? '').toLowerCase() !== 'master') return false;
    const normalizedResultTitle = normalizeTitle(result.title);
    const normalizedAlbumTitle = normalizeTitle(album.album);
    if (normalizedResultTitle !== normalizedAlbumTitle && !normalizedResultTitle.endsWith(` ${normalizedAlbumTitle}`)) return false;
    const year = Number(result.year);
    return !album.releaseYear || !Number.isInteger(year) || Math.abs(album.releaseYear - year) <= 1;
  });
  if (exact.length === 1) return { status: 'matched', result: exact[0] };
  if (exact.length > 1) return { status: 'ambiguous', reason: 'ambiguous-discogs-master-search-result', results: exact };
  return { status: 'gap', reason: 'no-exact-discogs-master-search-result' };
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

function normalizeTitle(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/['’‘`]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();
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
