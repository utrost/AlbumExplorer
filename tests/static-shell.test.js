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
  assert.match(app, /album-credit-candidates\.json/);
  assert.match(app, /discogs-credit-review-report\.json/);
  assert.match(app, /discogs-credit-review-helper\.js/);
  assert.match(app, /data-testid="discogs-review-helper"/);
  assert.match(app, /data-testid="discogs-review-snippet"/);
  assert.match(app, /data-testid="discogs-source-diagnostics"/);
  assert.match(app, /Source diagnostics/);
  assert.match(app, /Track-level credits/);
  assert.match(app, /Cache path/);
  assert.match(app, /approve-master-override/);
  assert.match(app, /add-search-alias/);
  assert.match(app, /Copy JSON snippet/);
  assert.match(app, /derived-relationships\.js/);
  assert.match(app, /shared-producer/);
  assert.match(app, /shared-engineer/);
  assert.match(app, /shared-studio/);
  assert.match(app, /shared-songwriter/);
  assert.match(app, /shared-musician/);
  assert.match(app, /focused-graph-view\.js/);
  assert.match(app, /path-finder\.js/);
  assert.match(app, /matchingRelationshipEvidence/);
  assert.match(app, /class="matching-explanation"/);
  assert.match(app, /class="source-badges"/);
  assert.match(app, /Discogs master/);
  assert.match(app, /Discogs release/);
  assert.match(app, /data-testid="comparison-search"/);
  assert.match(app, /MIN_SEARCH_CHARACTERS/);
  assert.match(app, /Search starts at 3 characters/);
  assert.match(app, /data-testid="edition-filter"/);
  assert.match(app, /data-testid="metadata-filter"/);
  assert.match(app, /data-testid="related-albums"/);
  assert.match(app, /data-testid="focused-graph"/);
  assert.match(app, /data-testid="path-finder"/);
  assert.match(app, /data-testid="path-destination"/);
  assert.match(app, /data-testid="relationship-type-filter"/);
  assert.match(app, /Relationship types/);
  assert.match(app, /shared-label/);
  assert.match(app, /Focused graph/);
  assert.match(app, /Path finder/);
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
