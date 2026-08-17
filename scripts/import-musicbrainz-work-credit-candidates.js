#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  buildMusicBrainzWorkCreditCandidates,
  mergeMusicBrainzWorkCreditCandidateLayers,
  selectMusicBrainzWorkCreditImportAlbums
} from '../src/data/musicbrainz-work-credit-candidates.js';

const DEFAULT_USER_AGENT = 'AlbumExplorer/0.1.0 (https://github.com/utrost/AlbumExplorer)';
const MUSICBRAINZ_BASE_URL = 'https://musicbrainz.org';

const [
  ,
  ,
  atlasPath = 'data/app/album-atlas.json',
  outputPath = 'data/enrichment/musicbrainz-work-credit-candidates.json',
  ...args
] = process.argv;

const limit = numericOption(args, '--limit');
const delayMs = numericOption(args, '--delay-ms') ?? 1100;
const recordingCacheDir = option(args, '--recording-cache-dir') ?? 'data/imports/musicbrainz/recordings';
const workCacheDir = option(args, '--work-cache-dir') ?? 'data/imports/musicbrainz/works';
const userAgent = option(args, '--user-agent') ?? DEFAULT_USER_AGENT;
const atlas = JSON.parse(readFileSync(atlasPath, 'utf8'));
const selectedAlbums = selectMusicBrainzWorkCreditImportAlbums({ albums: atlas.albums ?? [] });
const albums = selectedAlbums.slice(0, limit ?? Infinity);
const recordingResponsesById = new Map();
const workResponsesById = new Map();
let networkFetches = 0;

mkdirSync(dirname(outputPath), { recursive: true });
mkdirSync(recordingCacheDir, { recursive: true });
mkdirSync(workCacheDir, { recursive: true });

for (let index = 0; index < albums.length; index += 1) {
  const album = albums[index];
  for (const recordingId of album.musicBrainzRecordingIds) {
    const recording = await fetchOrReadJsonOrNull(
      join(recordingCacheDir, `${recordingId}.json`),
      musicBrainzRecordingUrl(recordingId)
    );
    if (!recording) continue;
    recordingResponsesById.set(recordingId, recording);
    for (const workId of workIdsFromRecording(recording)) {
      if (workResponsesById.has(workId)) continue;
      const work = await fetchOrReadJsonOrNull(join(workCacheDir, `${workId}.json`), musicBrainzWorkUrl(workId));
      if (work) workResponsesById.set(workId, work);
    }
  }
  console.log(`${index + 1}/${albums.length} cached ${album.artist} — ${album.album}`);
}

const generatedOutput = {
  ...buildMusicBrainzWorkCreditCandidates({ albums, recordingResponsesById, workResponsesById }),
  source: {
    system: 'musicbrainz-work-credit',
    recordingEndpoint: `${MUSICBRAINZ_BASE_URL}/ws/2/recording/{mbid}?inc=work-rels&fmt=json`,
    workEndpoint: `${MUSICBRAINZ_BASE_URL}/ws/2/work/{mbid}?inc=artist-rels&fmt=json`,
    recordingCacheDir,
    workCacheDir,
    userAgent,
    delayMs
  },
  scope: {
    atlasPath,
    selectedAlbumCount: selectedAlbums.length,
    selection: limit ? `first ${albums.length} composer-credit gaps with MusicBrainz recording refs` : 'all composer-credit gaps with MusicBrainz recording refs',
    albumCount: albums.length
  }
};
const previousOutput = existsSync(outputPath) ? JSON.parse(readFileSync(outputPath, 'utf8')) : null;
const output = mergeMusicBrainzWorkCreditCandidateLayers(previousOutput, generatedOutput);

writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`MusicBrainz work-credit scope: ${albums.length} albums`);
console.log(`MusicBrainz work-credit candidates: ${output.candidates.length}`);
console.log(`MusicBrainz work-credit credited tracks: ${output.summary.creditedTrackCount}`);
console.log(`MusicBrainz work-credit gaps: ${output.gaps.length}`);
console.log(`Network fetches: ${networkFetches}`);
console.log(`Output: ${outputPath}`);
console.log(`Raw recording cache: ${recordingCacheDir}`);
console.log(`Raw work cache: ${workCacheDir}`);

async function fetchOrReadJsonOrNull(cachePath, url) {
  if (existsSync(cachePath)) return JSON.parse(readFileSync(cachePath, 'utf8'));
  if (networkFetches > 0) await sleep(delayMs);
  const response = await fetch(url, { headers: { 'User-Agent': userAgent, Accept: 'application/json' } });
  networkFetches += 1;
  if (response.status === 404) {
    const data = { fetchedAt: null, url, status: 404, relations: [] };
    writeFileSync(cachePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    return data;
  }
  if (!response.ok) {
    console.warn(`MusicBrainz work-credit request failed for ${url}: ${response.status} ${response.statusText}`);
    return null;
  }
  const data = await response.json();
  writeFileSync(cachePath, `${JSON.stringify({ fetchedAt: null, url, ...data }, null, 2)}\n`, 'utf8');
  return data;
}

function workIdsFromRecording(recording) {
  return [...new Set((recording.relations ?? [])
    .filter((relation) => relation['target-type'] === 'work' && relation.work?.id)
    .map((relation) => relation.work.id))];
}

function musicBrainzRecordingUrl(recordingId) {
  const params = new URLSearchParams({ inc: 'work-rels', fmt: 'json' });
  return `${MUSICBRAINZ_BASE_URL}/ws/2/recording/${recordingId}?${params}`;
}

function musicBrainzWorkUrl(workId) {
  const params = new URLSearchParams({ inc: 'artist-rels', fmt: 'json' });
  return `${MUSICBRAINZ_BASE_URL}/ws/2/work/${workId}?${params}`;
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
