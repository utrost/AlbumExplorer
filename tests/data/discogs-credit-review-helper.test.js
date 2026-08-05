import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDiscogsReviewQueue,
  discogsMasterOverrideSnippet,
  discogsSearchAliasSnippet,
  filterDiscogsReviewQueue,
  nextDiscogsReviewItem
} from '../../src/data/discogs-credit-review-helper.js';

const report = {
  summary: {
    unresolved: 3,
    review: 2,
    gaps: 1
  },
  items: [
    {
      kind: 'review',
      albumId: 'album-beatles-white-album-1968',
      artist: 'The Beatles',
      album: 'White Album',
      releaseYear: 1968,
      latestRank: 10,
      reason: 'ambiguous-discogs-master-search-result',
      recommendedAction: 'approve-master-override',
      sourceCandidates: [
        { id: '3892825', title: 'The Beatles - The Beatles', year: null, url: 'https://api.discogs.com/masters/3892825' },
        { id: '456999', title: 'The Beatles - The Beatles (1967)', year: '1967', url: 'https://api.discogs.com/masters/456999' }
      ]
    },
    {
      kind: 'gap',
      albumId: 'album-elvis-presley-sun-sessions-1999',
      artist: 'Elvis Presley',
      album: 'The Sun Sessions',
      releaseYear: 1999,
      latestRank: 11,
      reason: 'no-exact-discogs-master-search-result',
      recommendedAction: 'add-search-alias',
      sourceCandidates: []
    },
    {
      kind: 'review',
      albumId: 'album-biggie-ready-to-die-1994',
      artist: 'The Notorious B.I.G.',
      album: 'Ready to Die',
      releaseYear: 1994,
      latestRank: 22,
      reason: 'ambiguous-discogs-master-search-result',
      recommendedAction: 'approve-master-override',
      sourceCandidates: [
        { id: '1263614', title: 'The Notorious B.I.G.* - Ready To Die', year: '1994', url: 'https://api.discogs.com/masters/1263614' }
      ]
    }
  ]
};

test('builds a review queue with current item and progress from the generated report', () => {
  const queue = buildDiscogsReviewQueue(report, { selectedAlbumId: 'album-elvis-presley-sun-sessions-1999' });

  assert.equal(queue.total, 3);
  assert.equal(queue.reviewCount, 2);
  assert.equal(queue.gapCount, 1);
  assert.equal(queue.current.albumId, 'album-elvis-presley-sun-sessions-1999');
  assert.equal(queue.currentIndex, 1);
  assert.equal(queue.progressLabel, '2 of 3 unresolved');
});

test('filters review queue by kind, reason, and search text without mutating the report', () => {
  const filtered = filterDiscogsReviewQueue(report.items, {
    kind: 'review',
    reason: 'ambiguous-discogs-master-search-result',
    search: 'ready die'
  });

  assert.deepEqual(filtered.map((item) => item.albumId), ['album-biggie-ready-to-die-1994']);
  assert.equal(report.items.length, 3);
});

test('selects the next review item after the current item in filtered order', () => {
  const next = nextDiscogsReviewItem(report.items, 'album-beatles-white-album-1968');

  assert.equal(next.albumId, 'album-elvis-presley-sun-sessions-1999');
});

test('creates a copyable approved Discogs master override snippet', () => {
  const item = report.items[0];
  const snippet = discogsMasterOverrideSnippet(item, item.sourceCandidates[0]);

  assert.deepEqual(JSON.parse(snippet), {
    albumId: 'album-beatles-white-album-1968',
    status: 'approved',
    discogsMasterId: '3892825',
    reason: 'Selected Discogs master 3892825 for The Beatles — White Album (1968).'
  });
});

test('creates a copyable search alias snippet for no-exact-result gaps', () => {
  const snippet = discogsSearchAliasSnippet(report.items[1]);

  assert.deepEqual(JSON.parse(snippet), {
    albumId: 'album-elvis-presley-sun-sessions-1999',
    status: 'approved',
    artist: 'Elvis Presley',
    album: 'The Sun Sessions',
    releaseYear: 1999,
    reason: 'Alias Discogs credit search to reviewed artist/title for Elvis Presley — The Sun Sessions (1999).'
  });
});
