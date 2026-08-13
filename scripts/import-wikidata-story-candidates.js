#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { buildWikidataStoryCandidates, mergeWikidataStoryCandidateLayers, selectWikidataStoryImportAlbums } from '../src/data/wikidata-story-candidates.js';

const DEFAULT_USER_AGENT = 'AlbumExplorer/0.1.0 (https://github.com/utrost/AlbumExplorer)';
const WIKIDATA_SPARQL_URL = 'https://query.wikidata.org/sparql';
const WIKIPEDIA_SUMMARY_URL = 'https://en.wikipedia.org/api/rest_v1/page/summary/';

const [
  ,
  ,
  atlasPath = 'data/app/album-atlas.json',
  outputPath = 'data/enrichment/wikidata-story-candidates.json',
  ...args
] = process.argv;

const limit = numericOption(args, '--limit');
const delayMs = numericOption(args, '--delay-ms') ?? 1100;
const cacheDir = option(args, '--cache-dir') ?? 'data/imports/wikidata/story-by-release-group';
const userAgent = option(args, '--user-agent') ?? DEFAULT_USER_AGENT;
const atlas = JSON.parse(readFileSync(atlasPath, 'utf8'));
const selectedAlbums = selectWikidataStoryImportAlbums({ albums: atlas.albums ?? [] });
const albums = selectedAlbums.slice(0, limit ?? Infinity);
const responsesByAlbumId = new Map();
let networkFetches = 0;

mkdirSync(dirname(outputPath), { recursive: true });
mkdirSync(cacheDir, { recursive: true });

for (let index = 0; index < albums.length; index += 1) {
  const album = albums[index];
  const cachePath = join(cacheDir, `${album.musicBrainzReleaseGroupId}.json`);
  const response = await fetchOrReadStoryJson(cachePath, album);
  if (response) responsesByAlbumId.set(album.id, response);
  console.log(`${index + 1}/${albums.length} ${response?.wikipediaSummary?.extract ? 'cached' : 'gap'} ${album.artist} — ${album.album}`);
}

const batchOutput = {
  ...buildWikidataStoryCandidates({ albums, responsesByAlbumId }),
  source: {
    system: 'wikidata-wikipedia',
    wikidataEndpoint: WIKIDATA_SPARQL_URL,
    wikipediaEndpoint: `${WIKIPEDIA_SUMMARY_URL}{title}`,
    cacheDir,
    userAgent,
    delayMs
  },
  scope: {
    atlasPath,
    selectedAlbumCount: selectedAlbums.length,
    selection: limit ? `first ${albums.length} story gaps with MusicBrainz release-group refs` : 'all story gaps with MusicBrainz release-group refs',
    albumCount: albums.length
  }
};
const existingOutput = existsSync(outputPath) ? JSON.parse(readFileSync(outputPath, 'utf8')) : null;
const output = existingOutput ? mergeWikidataStoryCandidateLayers(existingOutput, batchOutput) : batchOutput;
output.source = batchOutput.source;
output.scope = {
  ...batchOutput.scope,
  previousCandidateCount: existingOutput?.summary?.candidateCount ?? 0,
  previousGapCount: existingOutput?.summary?.gapCount ?? 0,
  mergedCandidateCount: output.summary.candidateCount,
  mergedGapCount: output.summary.gapCount
};

writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`Wikidata/Wikipedia story scope: ${albums.length} albums`);
console.log(`Story candidates: ${output.candidates.length} (batch ${batchOutput.candidates.length})`);
console.log(`Story gaps: ${output.gaps.length} (batch ${batchOutput.gaps.length})`);
console.log(`Network fetches: ${networkFetches}`);
console.log(`Output: ${outputPath}`);
console.log(`Raw cache: ${cacheDir}`);

async function fetchOrReadStoryJson(cachePath, album) {
  if (existsSync(cachePath)) return JSON.parse(readFileSync(cachePath, 'utf8'));
  if (networkFetches > 0) await sleep(delayMs);
  const wikidata = await fetchWikidataForMusicBrainzReleaseGroup(album.musicBrainzReleaseGroupId);
  if (wikidata?.transientError) return null;
  if (!wikidata?.entityId) {
    const gap = { fetchedAt: null, albumId: album.id, musicBrainzReleaseGroupId: album.musicBrainzReleaseGroupId, wikidata: null, wikipediaSummary: null };
    writeFileSync(cachePath, `${JSON.stringify(gap, null, 2)}\n`, 'utf8');
    return gap;
  }
  let wikipediaSummary = null;
  if (wikidata.wikipediaTitle) {
    if (networkFetches > 0) await sleep(delayMs);
    wikipediaSummary = await fetchWikipediaSummary(wikidata.wikipediaTitle);
  }
  const payload = {
    fetchedAt: null,
    albumId: album.id,
    musicBrainzReleaseGroupId: album.musicBrainzReleaseGroupId,
    wikidata,
    wikipediaSummary
  };
  writeFileSync(cachePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return payload;
}

async function fetchWikidataForMusicBrainzReleaseGroup(mbid) {
  const query = `
SELECT ?item ?itemLabel ?itemDescription ?article WHERE {
  ?item wdt:P436 "${mbid}".
  OPTIONAL { ?article schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/>. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 1`;
  const url = `${WIKIDATA_SPARQL_URL}?query=${encodeURIComponent(query)}&format=json`;
  const response = await fetch(url, { headers: { 'User-Agent': userAgent, Accept: 'application/sparql-results+json' } });
  networkFetches += 1;
  if (!response.ok) {
    console.warn(`Wikidata request failed for ${mbid}: ${response.status} ${response.statusText}`);
    return { transientError: true, status: response.status };
  }
  const data = await response.json();
  const binding = data.results?.bindings?.[0];
  if (!binding) return null;
  const entityId = binding.item?.value?.split('/').pop() ?? null;
  const wikipediaUrl = binding.article?.value ?? null;
  return {
    entityId,
    label: binding.itemLabel?.value ?? null,
    description: binding.itemDescription?.value ?? null,
    wikipediaTitle: wikipediaUrl ? decodeURIComponent(wikipediaUrl.split('/wiki/').pop()) : null,
    wikipediaUrl
  };
}

async function fetchWikipediaSummary(title) {
  const url = `${WIKIPEDIA_SUMMARY_URL}${encodeURIComponent(title)}`;
  const response = await fetch(url, { headers: { 'User-Agent': userAgent, Accept: 'application/json' } });
  networkFetches += 1;
  if (response.status === 404) return null;
  if (!response.ok) {
    console.warn(`Wikipedia summary request failed for ${title}: ${response.status} ${response.statusText}`);
    return null;
  }
  const data = await response.json();
  return {
    title: data.title ?? title,
    description: data.description ?? null,
    extract: data.extract ?? null,
    contentUrls: data.content_urls ?? null
  };
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
