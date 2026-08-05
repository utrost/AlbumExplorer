import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDiscogsMasterOverrideMap,
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
