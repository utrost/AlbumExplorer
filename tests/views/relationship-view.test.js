import test from 'node:test';
import assert from 'node:assert/strict';
import { renderRelationshipTypeFilter, renderRelatedAlbums, renderSourceBadges } from '../../src/views/relationship-view.js';

const provenance = {
  left: {
    masterId: 123,
    masterUrl: 'https://discogs.test/master/123?name="left"',
    releaseId: 456,
    releaseUrl: 'https://discogs.test/release/456',
    selectedBy: 'approved-master-override'
  },
  right: {
    masterId: 123,
    masterUrl: 'https://discogs.test/master/123?name="left"',
    releaseId: 789,
    releaseUrl: 'https://discogs.test/release/789',
    selectedBy: 'discogs-release-cache'
  }
};

test('renders relationship type filter with the selected option', () => {
  const html = renderRelationshipTypeFilter('shared-studio');

  assert.match(html, /data-testid="relationship-type-filter"/);
  assert.match(html, /Filter relationship views/);
  assert.match(html, /<option value="shared-studio" selected>Studios\/locations<\/option>/);
  assert.match(html, /<option value="shared-musician" >Musicians\/performers<\/option>/);
});

test('renders an explicit empty related-albums state', () => {
  const html = renderRelatedAlbums([], []);

  assert.match(html, /data-testid="related-albums"/);
  assert.match(html, /No strong relationships yet\./);
});

test('renders related album evidence with active relationship highlighting and provenance', () => {
  const html = renderRelatedAlbums([
    {
      album: { id: 'album-kind-of-blue', album: 'Kind <of> Blue', artist: 'Miles Davis' },
      relationship: {
        weight: 5.4,
        types: ['shared-producer', 'shared-studio'],
        explanations: ['Both albums credit Teo Macero as producer.'],
        typedExplanations: [
          { type: 'shared-producer', text: 'Both albums credit Teo Macero as producer.', provenance },
          { type: 'shared-studio', text: 'Both albums are connected to Columbia 30th Street Studio.', provenance }
        ]
      }
    }
  ], ['shared-studio']);

  assert.match(html, /data-testid="related-albums"/);
  assert.match(html, /data-related-album-id="album-kind-of-blue"/);
  assert.match(html, /Kind &lt;of&gt; Blue/);
  assert.match(html, /Miles Davis · weight 5.4/);
  assert.doesNotMatch(html, /Teo Macero/);
  assert.match(html, /class="matching-explanation"/);
  assert.match(html, /Columbia 30th Street Studio/);
  assert.match(html, /Discogs master 123/);
  assert.match(html, /Discogs release 789/);
  assert.match(html, /approved master override/);
});

test('deduplicates and escapes source badges', () => {
  const html = renderSourceBadges(provenance);

  assert.equal((html.match(/Discogs master 123/g) ?? []).length, 1);
  assert.match(html, /q=&quot;left&quot;|name=&quot;left&quot;/);
  assert.match(html, /Discogs release 456/);
  assert.match(html, /Discogs release 789/);
  assert.match(html, /approved master override/);
});
