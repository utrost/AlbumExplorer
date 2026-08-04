#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { parseRollingStoneHtml } from '../src/data/rolling-stone-html-importer.js';

const [, , inputPath, outputPath = 'data/imports/rolling-stone-2003.parsed.json'] = process.argv;

if (!inputPath) {
  console.error('Usage: node scripts/parse-rolling-stone-html.js <input.html> [output.json]');
  process.exit(2);
}

const html = readFileSync(inputPath, 'utf8');
const rows = parseRollingStoneHtml(html);
const result = {
  sourcePath: inputPath,
  editionId: 'list-rolling-stone-2003',
  parsedAt: new Date().toISOString(),
  count: rows.length,
  rows
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');

console.log(`Parsed ${rows.length} Rolling Stone HTML album rows`);
if (rows.length) {
  console.log(`Rank range: ${Math.min(...rows.map((row) => row.rank))}-${Math.max(...rows.map((row) => row.rank))}`);
  console.log(`First parsed row: #${rows[0].rank} ${rows[0].artist} — ${rows[0].album}`);
  console.log(`Last parsed row: #${rows.at(-1).rank} ${rows.at(-1).artist} — ${rows.at(-1).album}`);
}
