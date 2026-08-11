import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

test('static shell loads the AlbumExplorer app module', () => {
  const html = readFileSync('index.html', 'utf8');

  assert.match(html, /<main id="app"/);
  assert.match(html, /<script type="module" src="\.\/src\/app\.js"><\/script>/);
});

test('static app exposes explorer-first controls, app dataset, and relationship views', () => {
  const app = readFileSync('src/app.js', 'utf8');
  const albumProfileView = readFileSync('src/views/album-profile-view.js', 'utf8');
  const relationshipView = readFileSync('src/views/relationship-view.js', 'utf8');

  assert.match(app, /data\/app\/album-atlas\.json/);
  assert.match(app, /album-profile-view\.js/);
  assert.match(app, /relationship-view\.js/);
  assert.doesNotMatch(app, /discogs-credit-review-report\.json/);
  assert.doesNotMatch(app, /discogs-credit-review-helper\.js/);
  assert.doesNotMatch(app, /data-testid="discogs-review-helper"/);
  assert.match(app, /album stories, tracklists, cover art/);
  assert.match(albumProfileView, /data-testid="album-profile"/);
  assert.match(albumProfileView, /data-testid="album-cover-art"/);
  assert.match(albumProfileView, /data-testid="tracklist"/);
  assert.match(albumProfileView, /Composers/);
  assert.match(albumProfileView, /Footnotes/);
  assert.match(app, /derived-relationships\.js/);
  assert.match(app, /shared-producer/);
  assert.match(app, /shared-engineer/);
  assert.match(app, /shared-studio/);
  assert.match(app, /shared-songwriter/);
  assert.match(app, /shared-musician/);
  assert.match(app, /focused-graph-view\.js/);
  assert.match(app, /path-finder\.js/);
  assert.match(relationshipView, /matchingRelationshipEvidence/);
  assert.match(relationshipView, /matching-explanation/);
  assert.match(relationshipView, /class="source-badges"/);
  assert.match(relationshipView, /Discogs master/);
  assert.match(relationshipView, /Discogs release/);
  assert.match(app, /data-testid="comparison-search"/);
  assert.match(app, /MIN_SEARCH_CHARACTERS/);
  assert.match(app, /Search starts at 3 characters/);
  assert.match(app, /data-testid="edition-filter"/);
  assert.doesNotMatch(app, /data-testid="metadata-filter"/);
  assert.doesNotMatch(app, />Source status</);
  assert.match(relationshipView, /data-testid="related-albums"/);
  assert.match(app, /data-testid="focused-graph"/);
  assert.match(app, /data-testid="path-finder"/);
  assert.match(app, /data-testid="path-destination"/);
  assert.match(relationshipView, /data-testid="relationship-type-filter"/);
  assert.match(app, /Relationship types/);
  assert.match(relationshipView, /shared-label/);
  assert.match(app, /Focused graph/);
  assert.match(app, /Path finder/);
  assert.match(app, /Related albums/);
});

test('GitHub Pages workflow publishes the complete static artifact', () => {
  assert.equal(existsSync('.github/workflows/pages.yml'), true);
  const workflow = readFileSync('.github/workflows/pages.yml', 'utf8');

  assert.match(workflow, /npm test/);
  assert.match(workflow, /actions\/upload-pages-artifact/);
  assert.match(workflow, /actions\/deploy-pages/);
  assert.match(workflow, /cp -R index\.html src data docs README\.md/);
});
