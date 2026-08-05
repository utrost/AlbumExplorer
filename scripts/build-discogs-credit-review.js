#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { buildDiscogsCreditReviewReport } from '../src/data/discogs-credit-review-report.js';

const [
  ,
  ,
  comparisonPath = 'data/rolling-stone-comparison.json',
  creditCandidatesPath = 'data/enrichment/album-credit-candidates.json',
  reportPath = 'data/review/discogs-credit-review-report.json',
  markdownPath = 'docs/imports/discogs-credit-review.md'
] = process.argv;

const comparison = JSON.parse(readFileSync(comparisonPath, 'utf8'));
const creditCandidates = JSON.parse(readFileSync(creditCandidatesPath, 'utf8'));
const report = buildDiscogsCreditReviewReport({ comparison, creditCandidates });

mkdirSync(dirname(reportPath), { recursive: true });
mkdirSync(dirname(markdownPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
writeFileSync(markdownPath, reviewMarkdown(report), 'utf8');

console.log(`Discogs credit review report: ${report.summary.unresolved} unresolved`);
console.log(`Review items: ${report.summary.review}`);
console.log(`Gap items: ${report.summary.gaps}`);
console.log(`Output: ${reportPath}`);
console.log(`Markdown: ${markdownPath}`);

function reviewMarkdown(report) {
  const topItems = report.items.slice(0, 50).map((item, index) => {
    const rank = item.latestRank == null ? 'unranked in latest edition' : `latest rank #${item.latestRank}`;
    const candidates = item.sourceCandidates?.length
      ? item.sourceCandidates.slice(0, 5).map((candidate) => `    - ${candidate.id}: ${candidate.title ?? 'untitled'}${candidate.year ? ` (${candidate.year})` : ''}${candidate.url ? ` — ${candidate.url}` : ''}`).join('\n')
      : '    - none';
    return `${index + 1}. ${item.artist} — *${item.album}* (${item.releaseYear ?? 'unknown year'})\n   - ${rank}\n   - kind: ${item.kind}\n   - reason: ${item.reason}\n   - recommended action: ${item.recommendedAction}\n   - source candidates:\n${candidates}`;
  }).join('\n\n');

  const reviewReasons = Object.entries(report.summary.reviewReasons)
    .map(([reason, count]) => `- ${reason}: ${count}`)
    .join('\n');
  const gapReasons = Object.entries(report.summary.gapReasons)
    .map(([reason, count]) => `- ${reason}: ${count}`)
    .join('\n');

  return `# Discogs credit review report\n\nStatus: generated review queue, not canonical data.\n\n## Summary\n\n- Comparison albums: ${report.summary.comparisonAlbums}\n- Credit/studio candidates: ${report.summary.candidates}\n- Review items: ${report.summary.review}\n- Gaps: ${report.summary.gaps}\n- Total unresolved: ${report.summary.unresolved}\n\n## Review reasons\n\n${reviewReasons || '- none'}\n\n## Gap reasons\n\n${gapReasons || '- none'}\n\n## How to resolve\n\n- For \`approve-master-override\`, add an approved row to \`data/review/discogs-credit-master-overrides.json\`.\n- For \`add-search-alias\`, add an approved row to \`data/review/discogs-credit-search-aliases.json\`.\n- For stale Discogs IDs or empty credit caches, inspect the candidate source and either approve an alternate master, reject it, or leave the album as a documented gap.\n- Re-run \`npm run import:discogs-credits\`, then \`npm run build:discogs-credit-review\`.\n\n## Top unresolved items by latest Rolling Stone rank\n\n${topItems || 'None.'}\n`;
}
