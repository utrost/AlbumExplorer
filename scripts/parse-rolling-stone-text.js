#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { basename, dirname } from 'node:path';
import { parseRollingStoneText } from '../src/data/rolling-stone-text-importer.js';

const [, , inputPath, outputPath = 'data/imports/rolling-stone-2003-text.parsed.json'] = process.argv;

if (!inputPath) {
  console.error('Usage: node scripts/parse-rolling-stone-text.js <input.txt> [output.json]');
  process.exit(2);
}

const text = readFileSync(inputPath, 'utf8');
const rows = parseRollingStoneText(text);
const result = {
  sourcePath: inputPath,
  editionId: inferEditionId(inputPath, outputPath),
  parsedAt: new Date().toISOString(),
  count: rows.length,
  rows
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');

console.log(`Parsed ${rows.length} Rolling Stone text album rows`);
if (rows.length) {
  console.log(`Edition ID: ${result.editionId}`);
  console.log(`Rank range: ${Math.min(...rows.map((row) => row.rank))}-${Math.max(...rows.map((row) => row.rank))}`);
  console.log(`First parsed row: #${rows[0].rank} ${rows[0].artist} — ${rows[0].album}`);
  console.log(`Last parsed row: #${rows.at(-1).rank} ${rows.at(-1).artist} — ${rows.at(-1).album}`);
}

function inferEditionId(...paths) {
  const joined = paths.map((path) => basename(path)).join(' ');
  const year = joined.match(/(?:19|20)\d{2}/)?.[0] ?? 'unknown';
  return `list-rolling-stone-${year}`;
}
