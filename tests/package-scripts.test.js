import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

test('package exposes album profile gap report builder', () => {
  assert.equal(packageJson.scripts['build:album-profile-gaps'], 'node scripts/build-album-profile-gaps.js');
});
