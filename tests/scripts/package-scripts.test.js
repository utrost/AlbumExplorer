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
