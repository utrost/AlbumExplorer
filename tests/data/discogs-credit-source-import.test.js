import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDiscogsCreditSearchAliasMap,
  buildDiscogsCreditGapOverrideMap,
  buildDiscogsMasterOverrideMap,
  discogsCreditSearchCacheKey,
  discogsSearchAlbumFor,
  selectDiscogsMasterForAlbum
} from '../../src/data/discogs-credit-source-import.js';

const album = {
  id: 'album-beach-boys-pet-sounds-1966',
  artist: 'The Beach Boys',
  album: 'Pet Sounds',
  releaseYear: 1966
};

const results = [
  { type: 'master', master_id: 3548210, title: 'The Beach Boys - Pet Sounds', year: '1967', master_url: 'https://api.discogs.com/masters/3548210' },
  { type: 'master', master_id: 17217, title: 'The Beach Boys - Pet Sounds', year: '1966', master_url: 'https://api.discogs.com/masters/17217' }
];

test('selects an approved Discogs master override from ambiguous search results', () => {
  const overrides = buildDiscogsMasterOverrideMap({
    overrides: [
      {
        albumId: album.id,
        status: 'approved',
        discogsMasterId: '17217',
        reason: 'canonical Discogs album master'
      }
    ]
  });

  const selected = selectDiscogsMasterForAlbum(album, results, overrides);

  assert.equal(selected.status, 'matched');
  assert.equal(String(selected.result.master_id), '17217');
  assert.equal(selected.reason, 'approved-discogs-master-override');
});

test('keeps an override in review when the approved master is not present in cached search results', () => {
  const overrides = buildDiscogsMasterOverrideMap({
    overrides: [
      { albumId: album.id, status: 'approved', discogsMasterId: '999999' }
    ]
  });

  const selected = selectDiscogsMasterForAlbum(album, results, overrides);

  assert.equal(selected.status, 'ambiguous');
  assert.equal(selected.reason, 'approved-discogs-master-override-not-in-search-results');
  assert.equal(selected.results.length, 2);
});

test('ignores non-approved overrides and preserves conservative ambiguity', () => {
  const overrides = buildDiscogsMasterOverrideMap({
    overrides: [
      { albumId: album.id, status: 'rejected', discogsMasterId: '17217' }
    ]
  });

  const selected = selectDiscogsMasterForAlbum(album, results, overrides);

  assert.equal(selected.status, 'ambiguous');
  assert.equal(selected.reason, 'ambiguous-discogs-master-search-result');
});

test('does not match bonus-record titles as the album title', () => {
  const selected = selectDiscogsMasterForAlbum({ ...album, album: 'Songs in the Key of Life' }, [
    { type: 'master', master_id: 963554, title: 'Stevie Wonder - Bonus Record For "Songs In The Key Of Life"', year: '1976' }
  ]);

  assert.equal(selected.status, 'gap');
});

test('uses an approved search alias as the Discogs query source without changing the local album identity', () => {
  const aliases = buildDiscogsCreditSearchAliasMap({
    aliases: [
      {
        albumId: 'album-rolling-stones-exile-on-main-street-1972',
        status: 'approved',
        artist: 'Rolling Stones',
        album: 'Exile On Main St.',
        reason: 'Discogs canonical title spelling'
      },
      {
        albumId: album.id,
        status: 'rejected',
        artist: 'Beach Boys',
        album: 'Pet Sounds'
      }
    ]
  });

  const queryAlbum = discogsSearchAlbumFor({
    id: 'album-rolling-stones-exile-on-main-street-1972',
    artist: 'The Rolling Stones',
    album: 'Exile on Main Street',
    releaseYear: 1972
  }, aliases);
  const unaliasedAlbum = discogsSearchAlbumFor(album, aliases);

  assert.equal(queryAlbum.id, 'album-rolling-stones-exile-on-main-street-1972');
  assert.equal(queryAlbum.artist, 'Rolling Stones');
  assert.equal(queryAlbum.album, 'Exile On Main St.');
  assert.equal(queryAlbum.releaseYear, 1972);
  assert.equal(queryAlbum.sourceAlbum.artist, 'The Rolling Stones');
  assert.equal(unaliasedAlbum.artist, 'The Beach Boys');
});

test('uses the alias query in the search cache key so edited aliases do not reuse stale cache', () => {
  const original = { id: 'album-notorious-b-i-g-ready-to-die-1994', artist: 'The Notorious B.I.G.', album: 'Ready to Die', releaseYear: 1994 };
  const withThe = discogsSearchAlbumFor(original, buildDiscogsCreditSearchAliasMap({
    aliases: [{ albumId: original.id, status: 'approved', artist: 'The Notorious B.I.G.', album: 'Ready To Die' }]
  }));
  const withoutThe = discogsSearchAlbumFor(original, buildDiscogsCreditSearchAliasMap({
    aliases: [{ albumId: original.id, status: 'approved', artist: 'Notorious B.I.G.', album: 'Ready To Die' }]
  }));

  assert.notEqual(discogsCreditSearchCacheKey(withThe), discogsCreditSearchCacheKey(withoutThe));
  assert.match(discogsCreditSearchCacheKey(withoutThe), /^album-notorious-b-i-g-ready-to-die-1994--alias-/);
});

test('builds a map of approved credit gap reviews only', () => {
  const gaps = buildDiscogsCreditGapOverrideMap({
    gaps: [
      { albumId: album.id, status: 'approved', reason: 'Empty source reviewed.' },
      { albumId: 'album-unresolved', status: 'pending', reason: 'Not reviewed yet.' },
      { albumId: 'album-missing-status', reason: 'Missing approval.' }
    ]
  });

  assert.equal(gaps.size, 1);
  assert.equal(gaps.get(album.id).reason, 'Empty source reviewed.');
});
