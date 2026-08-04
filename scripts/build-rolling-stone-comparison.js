#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { buildRollingStoneComparison } from '../src/data/rolling-stone-comparison.js';

const [, , outputPath = 'data/rolling-stone-comparison.json', ...inputPaths] = process.argv;
const paths = inputPaths.length ? inputPaths : [
  'data/imports/rolling-stone-2003.parsed.json',
  'data/imports/rolling-stone-2012.parsed.json',
  'data/imports/rolling-stone-2020.parsed.json',
  'data/imports/rolling-stone-2024.parsed.json'
];

const parsedImports = paths.map((path) => JSON.parse(readFileSync(path, 'utf8')));
const comparison = buildRollingStoneComparison(parsedImports);

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(comparison, null, 2)}\n`, 'utf8');

console.log(`Wrote ${comparison.albumCount} Rolling Stone comparison albums`);
console.log(`Editions: ${comparison.editions.join(', ')}`);
console.log(`Output: ${outputPath}`);
for (const edition of comparison.editions) {
  const count = comparison.albums.filter((album) => album.ranks[edition] !== undefined).length;
  console.log(`${edition}: ${count} ranked albums`);
}
