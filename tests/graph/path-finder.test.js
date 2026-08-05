import test from 'node:test';
import assert from 'node:assert/strict';
import { findAlbumPath } from '../../src/graph/path-finder.js';

const relationships = [
  {
    pairKey: 'album-a::album-b',
    from: 'album-a',
    to: 'album-b',
    types: ['shared-label'],
    weight: 4,
    explanations: ['A and B share a label.']
  },
  {
    pairKey: 'album-b::album-c',
    from: 'album-b',
    to: 'album-c',
    types: ['shared-genre'],
    weight: 3,
    explanations: ['B and C share a genre.']
  },
  {
    pairKey: 'album-a::album-d',
    from: 'album-a',
    to: 'album-d',
    types: ['same-list-edition'],
    weight: 2,
    explanations: ['A and D appear in the same list.']
  },
  {
    pairKey: 'album-d::album-c',
    from: 'album-d',
    to: 'album-c',
    types: ['same-list-edition'],
    weight: 5,
    explanations: ['D and C appear in the same list.']
  }
];

test('finds a direct one-hop path with explanations', () => {
  const result = findAlbumPath({ startAlbumId: 'album-a', endAlbumId: 'album-b', relationships });

  assert.equal(result.found, true);
  assert.equal(result.reason, 'path-found');
  assert.deepEqual(result.albumIds, ['album-a', 'album-b']);
  assert.equal(result.hops.length, 1);
  assert.deepEqual(result.hops[0], {
    from: 'album-a',
    to: 'album-b',
    relationship: relationships[0]
  });
});

test('finds the deterministic shortest path before higher-weight longer alternatives', () => {
  const result = findAlbumPath({ startAlbumId: 'album-a', endAlbumId: 'album-c', relationships, maxDepth: 3 });

  assert.equal(result.found, true);
  assert.deepEqual(result.albumIds, ['album-a', 'album-b', 'album-c']);
  assert.deepEqual(result.hops.map((hop) => hop.relationship.pairKey), ['album-a::album-b', 'album-b::album-c']);
});

test('respects maximum depth and returns a clear no-path result', () => {
  const result = findAlbumPath({ startAlbumId: 'album-a', endAlbumId: 'album-c', relationships, maxDepth: 1 });

  assert.deepEqual(result, {
    found: false,
    reason: 'no-path-within-depth',
    startAlbumId: 'album-a',
    endAlbumId: 'album-c',
    maxDepth: 1,
    albumIds: [],
    hops: []
  });
});

test('filters by allowed relationship types', () => {
  const result = findAlbumPath({
    startAlbumId: 'album-a',
    endAlbumId: 'album-c',
    relationships,
    maxDepth: 3,
    allowedTypes: ['same-list-edition']
  });

  assert.equal(result.found, true);
  assert.deepEqual(result.albumIds, ['album-a', 'album-d', 'album-c']);
  assert.deepEqual(result.hops.map((hop) => hop.relationship.types), [['same-list-edition'], ['same-list-edition']]);
});

test('handles identical start and end albums', () => {
  const result = findAlbumPath({ startAlbumId: 'album-a', endAlbumId: 'album-a', relationships });

  assert.deepEqual(result, {
    found: true,
    reason: 'same-album',
    startAlbumId: 'album-a',
    endAlbumId: 'album-a',
    maxDepth: 3,
    albumIds: ['album-a'],
    hops: []
  });
});
