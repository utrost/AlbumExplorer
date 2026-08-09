#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { buildAlbumProfileGaps } from '../src/data/album-profile-gaps.js';

const [
  ,
  ,
  atlasPath = 'data/app/album-atlas.json',
  reportPath = 'data/enrichment/album-profile-gaps.json',
  markdownPath = 'docs/imports/album-profile-gaps.md'
] = process.argv;

const atlas = JSON.parse(readFileSync(atlasPath, 'utf8'));
const report = buildAlbumProfileGaps({ atlas });

mkdirSync(dirname(reportPath), { recursive: true });
mkdirSync(dirname(markdownPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
writeFileSync(markdownPath, gapsMarkdown(report), 'utf8');

console.log(`Album profile gaps: ${report.summary.albumsWithAnyGap} albums with at least one gap`);
console.log(`Missing cover art: ${report.summary.missingCounts.coverArt}`);
console.log(`Missing tracklists: ${report.summary.missingCounts.tracklist}`);
console.log(`Missing total duration: ${report.summary.missingCounts.totalDuration}`);
console.log(`Missing composer credits: ${report.summary.missingCounts.composerCredits}`);
console.log(`Missing story: ${report.summary.missingCounts.story}`);
console.log(`Output: ${reportPath}`);
console.log(`Markdown: ${markdownPath}`);

function gapsMarkdown(report) {
  const topItems = report.items.slice(0, 50).map((item, index) => {
    const rank = item.latestRank == null ? 'unranked in latest edition' : `latest rank #${item.latestRank}`;
    return `${index + 1}. ${item.artist} — *${item.album}* (${item.releaseYear ?? 'unknown year'})\n   - ${rank}\n   - missing: ${item.missing.join(', ')}\n   - recommended action: ${item.recommendedAction}`;
  }).join('\n\n');

  return `# Album profile gaps\n\nStatus: generated internal enrichment report, not public app content.\n\nThis report is derived from \`data/app/album-atlas.json\` and drives the next content-first enrichment passes. It should help Hermes choose which album profiles need better cover art, stories, tracklists, durations, and composer/songwriter/lyricist credits.\n\n## Summary\n\n- Albums: ${report.summary.albumCount}\n- Albums with at least one profile gap: ${report.summary.albumsWithAnyGap}\n- Missing cover art: ${report.summary.missingCounts.coverArt}\n- Missing tracklists: ${report.summary.missingCounts.tracklist}\n- Missing total duration: ${report.summary.missingCounts.totalDuration}\n- Missing composer/songwriter/lyricist credits: ${report.summary.missingCounts.composerCredits}\n- Missing useful story/context: ${report.summary.missingCounts.story}\n\n## How to use this report\n\nUse the highest-ranked missing albums as input for the next enrichment pass:\n\n1. Prefer second-pass Discogs matching when tracklist and cover art are missing.\n2. Prefer Cover Art Archive when only cover art is missing.\n3. Prefer Wikipedia/Wikidata when story/context is missing.\n4. Prefer deeper MusicBrainz work-credit enrichment when tracklists exist but composer/songwriter/lyricist credits are absent.\n\nKeep source work internal. The public app should continue to show album content and quiet footnotes, not this gap report.\n\n## Top missing profiles by latest Rolling Stone rank\n\n${topItems || 'None.'}\n`;
}
