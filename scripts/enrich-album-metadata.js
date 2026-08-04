#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildAlbumMetadataEnrichment, importedCandidatesFromComparison } from '../src/data/album-metadata-enrichment.js';

const [, , comparisonPath = 'data/rolling-stone-comparison.json', outputDir = 'data/enrichment', ...args] = process.argv;
const limitOption = option(args, '--limit');
const limit = limitOption ? Number(limitOption) : null;
const sourceCandidatesPath = join(outputDir, 'album-metadata-source-candidates.json');
const overridesPath = join(outputDir, 'album-metadata-overrides.json');
const candidatesPath = join(outputDir, 'album-metadata-candidates.json');
const reviewPath = join(outputDir, 'album-metadata-review.json');

const comparison = JSON.parse(readFileSync(comparisonPath, 'utf8'));
mkdirSync(outputDir, { recursive: true });
ensureJsonFile(overridesPath, {
  schemaVersion: '0.1.0',
  status: 'manual-overrides',
  description: 'Curator-approved metadata overrides. These win over generated source candidates.',
  overrides: []
});
ensureJsonFile(sourceCandidatesPath, {
  schemaVersion: '0.1.0',
  status: 'external-source-candidates',
  description: 'Optional external metadata candidates from Discogs, MusicBrainz, Cover Art Archive, Wikidata, or other sourced imports. Keep empty until sourced data exists.',
  candidates: []
});

const overridesData = JSON.parse(readFileSync(overridesPath, 'utf8'));
const sourceCandidateData = JSON.parse(readFileSync(sourceCandidatesPath, 'utf8'));
const selectedAlbums = limit ? comparison.albums.slice(0, limit) : comparison.albums;
const importedCandidates = importedCandidatesFromComparison({ albums: selectedAlbums });
const sourceCandidates = [...importedCandidates, ...(sourceCandidateData.candidates ?? [])];
const enrichment = buildAlbumMetadataEnrichment({
  albums: selectedAlbums,
  sourceCandidates,
  overrides: overridesData.overrides ?? []
});

const candidatesOutput = {
  schemaVersion: '0.1.0',
  status: 'generated-metadata-candidates',
  generatedAt: null,
  comparisonPath,
  scope: {
    selection: limit ? `first ${limit} comparison albums sorted by latest edition rank` : 'all comparison albums sorted by latest edition rank',
    albumCount: selectedAlbums.length
  },
  sourceCandidateInputs: [
    'rolling-stone-comparison imported labels/years',
    sourceCandidatesPath
  ],
  overridePath: overridesPath,
  count: enrichment.candidates.length,
  candidates: enrichment.candidates
};

const reviewOutput = {
  schemaVersion: '0.1.0',
  status: 'generated-metadata-review',
  generatedAt: null,
  comparisonPath,
  scope: candidatesOutput.scope,
  reviewCount: enrichment.review.length,
  gapCount: enrichment.gaps.length,
  review: enrichment.review,
  gaps: enrichment.gaps
};

writeFileSync(candidatesPath, `${JSON.stringify(candidatesOutput, null, 2)}\n`, 'utf8');
writeFileSync(reviewPath, `${JSON.stringify(reviewOutput, null, 2)}\n`, 'utf8');

console.log(`Album metadata scope: ${selectedAlbums.length} albums`);
console.log(`Metadata candidates: ${candidatesOutput.count}`);
console.log(`Manual review: ${reviewOutput.reviewCount}`);
console.log(`Metadata gaps: ${reviewOutput.gapCount}`);
console.log(`Candidates output: ${candidatesPath}`);
console.log(`Review output: ${reviewPath}`);

function ensureJsonFile(path, initialValue) {
  if (existsSync(path)) return;
  writeFileSync(path, `${JSON.stringify(initialValue, null, 2)}\n`, 'utf8');
}

function option(args, name) {
  const index = args.indexOf(name);
  return index === -1 ? null : args[index + 1];
}
