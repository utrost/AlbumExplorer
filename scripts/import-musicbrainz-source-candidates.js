#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  buildMusicBrainzLookupQuery,
  gapItemFromMusicBrainzMatch,
  musicBrainzSourceCandidateFromReleaseGroup,
  reviewItemFromAmbiguousMusicBrainzMatch,
  selectMusicBrainzReleaseGroupMatch
} from '../src/data/musicbrainz-source-candidates.js';

const DEFAULT_USER_AGENT = 'AlbumExplorer/0.1.0 (https://github.com/utrost/AlbumExplorer)';

const [, , comparisonPath = 'data/rolling-stone-comparison.json', outputPath = 'data/enrichment/album-metadata-source-candidates.json', ...args] = process.argv;
const limit = numericOption(args, '--limit');
const delayMs = numericOption(args, '--delay-ms') ?? 1100;
const retryCount = numericOption(args, '--retries') ?? 4;
const retryDelayMs = numericOption(args, '--retry-delay-ms') ?? 5000;
const cacheDir = option(args, '--cache-dir') ?? 'data/imports/musicbrainz/release-group-search';
const userAgent = option(args, '--user-agent') ?? DEFAULT_USER_AGENT;

const comparison = JSON.parse(readFileSync(comparisonPath, 'utf8'));
const albums = (comparison.albums ?? []).slice(0, limit ?? Infinity);
const output = {
  schemaVersion: '0.1.0',
  status: 'external-source-candidates',
  description: 'Reviewable external metadata candidates generated from MusicBrainz release-group search. Raw API responses are cached under data/imports/musicbrainz/.',
  generatedAt: null,
  source: {
    system: 'musicbrainz',
    endpoint: 'https://musicbrainz.org/ws/2/release-group/',
    queryShape: 'artist:"..." AND releasegroup:"..." AND firstreleasedate:YYYY',
    userAgent,
    delayMs
  },
  scope: {
    comparisonPath,
    selection: limit ? `first ${limit} comparison albums sorted by latest edition rank` : 'all comparison albums sorted by latest edition rank',
    albumCount: albums.length
  },
  candidates: [],
  review: [],
  gaps: []
};

mkdirSync(dirname(outputPath), { recursive: true });
mkdirSync(cacheDir, { recursive: true });

for (let index = 0; index < albums.length; index += 1) {
  const album = albums[index];
  const cachePath = join(cacheDir, `${album.id}.json`);
  const data = await fetchOrReadCachedSearch(album, cachePath, userAgent);
  const releaseGroups = data['release-groups'] ?? [];
  const selected = selectMusicBrainzReleaseGroupMatch(album, releaseGroups);
  if (selected.status === 'matched') {
    output.candidates.push(musicBrainzSourceCandidateFromReleaseGroup(album, selected.releaseGroup));
  } else if (selected.status === 'ambiguous') {
    output.review.push(reviewItemFromAmbiguousMusicBrainzMatch(album, selected.releaseGroups));
  } else {
    output.gaps.push(gapItemFromMusicBrainzMatch(album, selected.reason));
  }

  const ordinal = `${index + 1}/${albums.length}`;
  if (selected.status === 'matched') {
    console.log(`${ordinal} matched ${album.artist} — ${album.album}`);
  } else {
    console.log(`${ordinal} ${selected.status} ${album.artist} — ${album.album}`);
  }

  if (index < albums.length - 1 && !existsSync(join(cacheDir, `${albums[index + 1].id}.json`))) {
    await sleep(delayMs);
  }
}

writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`MusicBrainz scope: ${albums.length} albums`);
console.log(`MusicBrainz candidates: ${output.candidates.length}`);
console.log(`MusicBrainz review: ${output.review.length}`);
console.log(`MusicBrainz gaps: ${output.gaps.length}`);
console.log(`Output: ${outputPath}`);
console.log(`Raw cache: ${cacheDir}`);

async function fetchOrReadCachedSearch(album, cachePath, userAgent) {
  if (existsSync(cachePath)) return JSON.parse(readFileSync(cachePath, 'utf8'));
  const query = buildMusicBrainzLookupQuery(album);
  const url = `https://musicbrainz.org/ws/2/release-group/?query=${encodeURIComponent(query)}&fmt=json&limit=10`;
  const response = await fetchWithRetry(url, { headers: { 'User-Agent': userAgent, Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`MusicBrainz request failed for ${album.id}: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  const cached = { albumId: album.id, query, url, fetchedAt: null, ...data };
  writeFileSync(cachePath, `${JSON.stringify(cached, null, 2)}\n`, 'utf8');
  return cached;
}

async function fetchWithRetry(url, options) {
  let response;
  for (let attempt = 1; attempt <= retryCount + 1; attempt += 1) {
    response = await fetch(url, options);
    if (![429, 500, 502, 503, 504].includes(response.status)) return response;
    if (attempt > retryCount) return response;
    const retryAfter = Number(response.headers.get('retry-after'));
    const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : retryDelayMs * attempt;
    console.warn(`MusicBrainz ${response.status}; retrying in ${waitMs}ms (${attempt}/${retryCount})`);
    await sleep(waitMs);
  }
  return response;
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
