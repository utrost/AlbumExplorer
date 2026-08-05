import test from 'node:test';
import assert from 'node:assert/strict';
import {
  albumCreditCandidateFromDiscogsMaster,
  buildAlbumCreditCandidates,
  normalizeDiscogsCreditRole
} from '../../src/data/album-credit-candidates.js';

const album = {
  id: 'marvin-gaye-whats-going-on-1971',
  artist: 'Marvin Gaye',
  album: "What's Going On",
  releaseYear: 1971
};

const discogsMaster = {
  id: 80139,
  title: "Marvin Gaye - What's Going On",
  uri: 'https://www.discogs.com/master/80139',
  credits: [
    { name: 'Marvin Gaye', role: 'Producer, Written-By' },
    { name: 'Lawrence Miles', role: 'Engineer' },
    { name: 'The Funk Brothers', role: 'Performer' },
    { name: 'Unrelated Photographer', role: 'Photography' }
  ],
  extraartists: [
    { name: 'James Jamerson', role: 'Bass' },
    { name: 'Eli Fontaine', role: 'Saxophone' }
  ],
  notes: 'Recorded at Hitsville U.S.A., Detroit and Golden World Studios.'
};

test('normalizes Discogs credit roles into atlas relationship categories', () => {
  assert.equal(normalizeDiscogsCreditRole('Producer'), 'producer');
  assert.equal(normalizeDiscogsCreditRole('Co-producer'), 'producer');
  assert.equal(normalizeDiscogsCreditRole('Engineer [Recording Engineer]'), 'engineer');
  assert.equal(normalizeDiscogsCreditRole('Bass'), 'musician');
  assert.equal(normalizeDiscogsCreditRole('Written-By'), 'songwriter');
  assert.equal(normalizeDiscogsCreditRole('Photography'), null);
});

test('extracts typed reviewable credit candidates from a Discogs master cache item', () => {
  const candidate = albumCreditCandidateFromDiscogsMaster(album, discogsMaster, {
    cachePath: 'data/imports/discogs/masters/marvin-gaye-whats-going-on-1971.json'
  });

  assert.equal(candidate.albumId, album.id);
  assert.equal(candidate.status, 'candidate');
  assert.equal(candidate.source.system, 'discogs-master-cache');
  assert.equal(candidate.source.id, '80139');
  assert.deepEqual(candidate.credits, [
    { type: 'producer', name: 'Marvin Gaye', role: 'Producer', sourceRole: 'Producer, Written-By' },
    { type: 'songwriter', name: 'Marvin Gaye', role: 'Written-By', sourceRole: 'Producer, Written-By' },
    { type: 'engineer', name: 'Lawrence Miles', role: 'Engineer', sourceRole: 'Engineer' },
    { type: 'musician', name: 'The Funk Brothers', role: 'Performer', sourceRole: 'Performer' },
    { type: 'musician', name: 'James Jamerson', role: 'Bass', sourceRole: 'Bass' },
    { type: 'musician', name: 'Eli Fontaine', role: 'Saxophone', sourceRole: 'Saxophone' }
  ]);
  assert.deepEqual(candidate.studios, [
    { name: 'Hitsville U.S.A.', source: 'discogs-notes' },
    { name: 'Golden World Studios', source: 'discogs-notes' }
  ]);
});

test('does not invent credits when no source cache exists', () => {
  const result = buildAlbumCreditCandidates({
    albums: [album],
    discogsMastersByAlbumId: new Map()
  });

  assert.deepEqual(result.candidates, []);
  assert.deepEqual(result.gaps, [{
    albumId: album.id,
    artist: album.artist,
    album: album.album,
    releaseYear: album.releaseYear,
    reason: 'no-credit-source-cache'
  }]);
});

test('routes source cache with no usable credits to review instead of creating empty facts', () => {
  const result = buildAlbumCreditCandidates({
    albums: [album],
    discogsMastersByAlbumId: new Map([[album.id, { master: { id: 1, title: 'Empty', credits: [], extraartists: [] }, cachePath: 'cache.json' }]])
  });

  assert.deepEqual(result.candidates, []);
  assert.equal(result.review.length, 1);
  assert.equal(result.review[0].reason, 'source-cache-without-usable-credits');
});
