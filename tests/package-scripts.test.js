import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

test('package exposes album profile gap report builder', () => {
  assert.equal(packageJson.scripts['build:album-profile-gaps'], 'node scripts/build-album-profile-gaps.js');
});

test('package exposes Discogs second-pass profile-gap importer', () => {
  assert.match(packageJson.scripts['import:discogs-profile-gaps'], /--profile-gaps data\/enrichment\/album-profile-gaps\.json/);
  assert.match(packageJson.scripts['import:discogs-profile-gaps'], /--missing coverArt,tracklist/);
});

test('app dataset builder includes the focused profile-gap candidate layer', () => {
  const script = readFileSync('scripts/build-app-dataset.js', 'utf8');

  assert.match(script, /album-credit-profile-gap-candidates\.json/);
  assert.match(script, /additionalCreditCandidateLayers/);
});

test('package exposes Cover Art Archive focused importer and app dataset builder consumes it', () => {
  assert.match(packageJson.scripts['import:cover-art-archive'], /scripts\/import-cover-art-archive-candidates\.js/);
  const script = readFileSync('scripts/build-app-dataset.js', 'utf8');

  assert.match(script, /cover-art-archive-candidates\.json/);
  assert.match(script, /coverArtCandidates/);
});
