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

const dataset = buildAppDataset({
  comparison,
  metadataCandidates,
  sourceCandidates,
  creditCandidates
});

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(dataset, null, 2)}\n`);

console.log(`App dataset: ${dataset.summary.albumCount} albums`);
console.log(`Relationships: ${dataset.summary.relationshipCount}`);
console.log(`MusicBrainz matched: ${dataset.summary.musicBrainzMatched}`);
console.log(`Rolling Stone baseline: ${dataset.summary.rollingStoneBaseline}`);
console.log(`Credit candidate albums: ${dataset.summary.creditCandidateAlbums}`);
console.log(`Credit unknown albums: ${dataset.summary.creditUnknownAlbums}`);
console.log(`Output: ${outputPath}`);

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}
