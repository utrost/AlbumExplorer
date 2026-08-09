import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { buildAppDataset } from '../src/data/app-dataset.js';

const [
  comparisonPath = 'data/rolling-stone-comparison.json',
  metadataCandidatesPath = 'data/enrichment/album-metadata-candidates.json',
  sourceCandidatesPath = 'data/enrichment/album-metadata-source-candidates.json',
  creditCandidatesPath = 'data/enrichment/album-credit-candidates.json',
  outputPath = 'data/app/album-atlas.json'
] = process.argv.slice(2);

const [comparison, metadataCandidates, sourceCandidates, creditCandidates] = await Promise.all([
  readJson(comparisonPath),
  readJson(metadataCandidatesPath),
  readJson(sourceCandidatesPath),
  readJson(creditCandidatesPath)
]);

const sourcePayloadsByCachePath = await readSourcePayloadsByCachePath(creditCandidates);

const dataset = buildAppDataset({
  comparison,
  metadataCandidates,
  sourceCandidates,
  creditCandidates,
  sourcePayloadsByCachePath
});

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(dataset, null, 2)}\n`);

console.log(`App dataset: ${dataset.summary.albumCount} albums`);
console.log(`Relationships: ${dataset.summary.relationshipCount}`);
console.log(`MusicBrainz matched: ${dataset.summary.musicBrainzMatched}`);
console.log(`Rolling Stone baseline: ${dataset.summary.rollingStoneBaseline}`);
console.log(`Credit candidate albums: ${dataset.summary.creditCandidateAlbums}`);
console.log(`Credit unknown albums: ${dataset.summary.creditUnknownAlbums}`);
console.log(`Album profiles with tracklists: ${dataset.summary.albumProfilesWithTracklists}`);
console.log(`Album profiles with cover art: ${dataset.summary.albumProfilesWithCoverArt}`);
console.log(`Album profiles with total duration: ${dataset.summary.albumProfilesWithTotalDuration}`);
console.log(`Album profiles with composer credits: ${dataset.summary.albumProfilesWithComposerCredits}`);
console.log(`Output: ${outputPath}`);

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function readSourcePayloadsByCachePath(creditCandidates) {
  const paths = [...new Set((creditCandidates?.candidates ?? [])
    .map((candidate) => candidate.source?.cachePath)
    .filter(Boolean))];
  const entries = await Promise.all(paths.map(async (path) => {
    try {
      return [path, await readJson(path)];
    } catch {
      return null;
    }
  }));
  return new Map(entries.filter(Boolean));
}
