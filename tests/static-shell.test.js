import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

test('static shell loads the AlbumExplorer app module', () => {
  const html = readFileSync('index.html', 'utf8');

  assert.match(html, /<main id="app"/);
  assert.match(html, /<script type="module" src="\.\/src\/app\.js"><\/script>/);
});

test('static app exposes comparison browser controls, metadata markers, and related albums', () => {
  const app = readFileSync('src/app.js', 'utf8');

  assert.match(app, /rolling-stone-comparison\.json/);
  assert.match(app, /album-metadata-candidates\.json/);
  assert.match(app, /album-metadata-source-candidates\.json/);
  assert.match(app, /derived-relationships\.js/);
  assert.match(app, /data-testid="comparison-search"/);
  assert.match(app, /data-testid="edition-filter"/);
  assert.match(app, /data-testid="metadata-filter"/);
  assert.match(app, /data-testid="related-albums"/);
  assert.match(app, /Related albums/);
  assert.match(app, /MusicBrainz/);
});

test('GitHub Pages workflow publishes the complete static artifact', () => {
  assert.equal(existsSync('.github/workflows/pages.yml'), true);
  const workflow = readFileSync('.github/workflows/pages.yml', 'utf8');

  assert.match(workflow, /npm test/);
  assert.match(workflow, /actions\/upload-pages-artifact/);
  assert.match(workflow, /actions\/deploy-pages/);
  assert.match(workflow, /cp -R index\.html src data docs README\.md/);
});
