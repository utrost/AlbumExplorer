import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const buildAppDatasetScript = readFileSync('scripts/build-app-dataset.js', 'utf8');

test('exposes a MusicBrainz release import command for tracklist and duration gaps', () => {
  assert.equal(
    packageJson.scripts['import:musicbrainz-releases'],
    'node scripts/import-musicbrainz-release-candidates.js'
  );
});

test('app dataset build consumes the generated MusicBrainz release candidate layer by default', () => {
  assert.match(buildAppDatasetScript, /musicbrainz-release-candidates\.json/);
  assert.match(buildAppDatasetScript, /musicBrainzReleaseCandidates/);
});

test('exposes a Wikidata/Wikipedia story import command for story gaps', () => {
  assert.equal(
    packageJson.scripts['import:wikidata-stories'],
    'node scripts/import-wikidata-story-candidates.js'
  );
});

test('app dataset build consumes the generated Wikidata story candidate layer by default', () => {
  assert.match(buildAppDatasetScript, /wikidata-story-candidates\.json/);
  assert.match(buildAppDatasetScript, /wikidataStoryCandidates/);
});
