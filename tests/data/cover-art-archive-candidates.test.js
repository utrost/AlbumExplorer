import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCoverArtArchiveCandidates, selectCoverArtArchiveImportAlbums } from '../../src/data/cover-art-archive-candidates.js';

const albums = [
  {
    id: 'album-alpha-one-1970',
    artist: 'Alpha',
    album: 'One',
    latestRank: 2,
    profile: { coverArt: null },
    externalRefs: [{ system: 'musicbrainz-release-group', id: 'rg-alpha', url: 'https://musicbrainz.org/release-group/rg-alpha' }]
  },
  {
    id: 'album-beta-two-1971',
    artist: 'Beta',
    album: 'Two',
    latestRank: 1,
    profile: { coverArt: { url: 'https://img.example/existing.jpg' } },
    externalRefs: [{ system: 'musicbrainz-release-group', id: 'rg-beta' }]
  },
  {
    id: 'album-gamma-three-1972',
    artist: 'Gamma',
    album: 'Three',
    latestRank: 3,
    profile: { coverArt: null },
    externalRefs: []
  }
];

test('selects only cover-art gaps with MusicBrainz release-group refs by latest rank', () => {
  const selected = selectCoverArtArchiveImportAlbums({ albums });

  assert.deepEqual(selected.map((album) => [album.id, album.musicBrainzReleaseGroupId]), [
    ['album-alpha-one-1970', 'rg-alpha']
  ]);
});

test('builds cover art candidates from front Cover Art Archive images', () => {
  const report = buildCoverArtArchiveCandidates({
    albums: selectCoverArtArchiveImportAlbums({ albums }),
    responsesByAlbumId: new Map([
      ['album-alpha-one-1970', {
        release: 'https://musicbrainz.org/release/rel-alpha',
        images: [
          { front: false, image: 'https://img.example/back.jpg', thumbnails: { small: 'https://img.example/back-small.jpg' }, width: 600, height: 600 },
          { front: true, image: 'https://img.example/front.jpg', thumbnails: { small: 'https://img.example/front-small.jpg', large: 'https://img.example/front-large.jpg' }, width: 1200, height: 1200 }
        ]
      }]
    ])
  });

  assert.equal(report.candidates.length, 1);
  assert.equal(report.gaps.length, 0);
  assert.deepEqual(report.candidates[0].coverArt, {
    url: 'https://img.example/front.jpg',
    thumbnailUrl: 'https://img.example/front-small.jpg',
    width: 1200,
    height: 1200
  });
  assert.equal(report.candidates[0].source.system, 'cover-art-archive');
  assert.equal(report.candidates[0].source.musicBrainzReleaseGroupId, 'rg-alpha');
});

test('records explicit gaps when no front image is available', () => {
  const report = buildCoverArtArchiveCandidates({
    albums: selectCoverArtArchiveImportAlbums({ albums }),
    responsesByAlbumId: new Map([['album-alpha-one-1970', { images: [{ front: false, image: 'https://img.example/back.jpg' }] }]])
  });

  assert.equal(report.candidates.length, 0);
  assert.deepEqual(report.gaps.map((gap) => [gap.albumId, gap.reason]), [['album-alpha-one-1970', 'no-front-cover-image']]);
});
