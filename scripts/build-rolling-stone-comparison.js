#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { buildRollingStoneComparison, findRollingStoneDuplicateCandidates } from '../src/data/rolling-stone-comparison.js';

const [, , outputPath = 'data/rolling-stone-comparison.json', ...inputPaths] = process.argv;
const paths = inputPaths.length ? inputPaths : [
  'data/imports/rolling-stone-2003.parsed.json',
  'data/imports/rolling-stone-2012.parsed.json',
  'data/imports/rolling-stone-2020.parsed.json',
  'data/imports/rolling-stone-2024.parsed.json'
];
const aliasPath = 'data/review/rolling-stone-album-aliases.json';
const duplicateCandidatePath = 'data/review/rolling-stone-possible-duplicates.json';

const parsedImports = paths.map((path) => JSON.parse(readFileSync(path, 'utf8')));
const aliases = readAliases(aliasPath);
const comparison = buildRollingStoneComparison(parsedImports, { aliases });
const duplicateCandidates = {
  schemaVersion: '0.1.0',
  status: 'generated-review-candidates',
  generatedAt: null,
  sourceImportPaths: paths,
  aliasPath,
  count: 0,
  candidates: findRollingStoneDuplicateCandidates(parsedImports, { aliases })
};
duplicateCandidates.count = duplicateCandidates.candidates.length;

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(comparison, null, 2)}\n`, 'utf8');
mkdirSync(dirname(duplicateCandidatePath), { recursive: true });
writeFileSync(duplicateCandidatePath, `${JSON.stringify(duplicateCandidates, null, 2)}\n`, 'utf8');

console.log(`Wrote ${comparison.albumCount} Rolling Stone comparison albums`);
console.log(`Editions: ${comparison.editions.join(', ')}`);
console.log(`Output: ${outputPath}`);
console.log(`Approved aliases loaded: ${aliases.length}`);
console.log(`Aliases applied: ${comparison.aliasesAppliedCount}`);
console.log(`Possible duplicates: ${duplicateCandidates.count}`);
console.log(`Duplicate review output: ${duplicateCandidatePath}`);
for (const edition of comparison.editions) {
  const count = comparison.albums.filter((album) => album.ranks[edition] !== undefined).length;
  console.log(`${edition}: ${count} ranked albums`);
}

function readAliases(path) {
  if (!existsSync(path)) return [];
  const data = JSON.parse(readFileSync(path, 'utf8'));
  return data.aliases ?? [];
}
