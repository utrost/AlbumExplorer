#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { parseRollingStoneCsv, normalizeRollingStoneRows } from '../src/data/rolling-stone-importer.js';
import { validateCollection } from '../src/data/validator.js';

const [, , inputPath, outputPath, ...args] = process.argv;
const limitIndex = args.indexOf('--limit');
const limit = limitIndex === -1 ? null : Number(args[limitIndex + 1]);

if (!inputPath || !outputPath || (limitIndex !== -1 && (!Number.isInteger(limit) || limit < 1))) {
  console.error('Usage: node scripts/import-rolling-stone-csv.js <input.csv> <output.json> [--limit n]');
  process.exit(2);
}

const text = readFileSync(inputPath, 'utf8');
const rows = parseRollingStoneCsv(text);
const selectedRows = limit === null ? rows : rows.slice(0, limit);
const collection = normalizeRollingStoneRows(selectedRows);
const report = validateCollection(collection);

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(collection, null, 2)}\n`, 'utf8');

console.log(`Imported ${selectedRows.length} of ${rows.length} CSV rows`);
console.log(`Albums: ${collection.albums.length}`);
console.log(`Artists: ${collection.artists.length}`);
console.log(`List appearances: ${collection.listAppearances.length}`);
console.log(`Physical copies: ${collection.physicalCopies.length}`);
console.log(`Validation: ${report.errors.length} errors, ${report.warnings.length} warnings, ${report.info.length} metadata gaps`);

if (report.errors.length > 0) {
  for (const error of report.errors.slice(0, 20)) {
    console.error(`${error.code}: ${error.message}`);
  }
  process.exit(1);
}
