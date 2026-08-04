import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('static shell loads the AlbumExplorer app module', () => {
  const html = readFileSync('index.html', 'utf8');

  assert.match(html, /<main id="app"/);
  assert.match(html, /<script type="module" src="\.\/src\/app\.js"><\/script>/);
});
