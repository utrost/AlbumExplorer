import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMusicBrainzReleaseCandidates,
  selectMusicBrainzReleaseImportAlbums
} from '../../src/data/musicbrainz-release-candidates.js';

const albums = [
  {
    id: 'album-alpha-one-1970',
    artist: 'Alpha',
    album: 'One',
    releaseYear: 1970,
    latestRank: 2,
    profile: { tracklist: [] },
    externalRefs: [{ system: 'musicbrainz-release-group', id: 'rg-alpha', url: 'https://musicbrainz.org/release-group/rg-alpha' }]
  },
  {
    id: 'album-beta-two-1971',
    artist: 'Beta',
    album: 'Two',
    releaseYear: 1971,
    latestRank: 1,
    profile: { tracklist: [{ title: 'Already Known', durationSeconds: 123 }], totalDurationSeconds: 123 },
    externalRefs: [{ system: 'musicbrainz-release-group', id: 'rg-beta' }]
  },
  {
    id: 'album-gamma-three-1972',
    artist: 'Gamma',
    album: 'Three',
    releaseYear: 1972,
    latestRank: 3,
    profile: { tracklist: [] },
    externalRefs: []
  }
];

const releaseSearchResponse = {
  releases: [
    {
      id: 'rel-us-reissue',
      title: 'One',
      date: '1999-01-01',
      status: 'Official',
      country: 'US',
      media: [{ format: 'CD', trackCount: 2, tracks: [{ title: 'Wrong Later Track', length: 60000 }] }]
    },
    {
      id: 'rel-gb-vinyl',
      title: 'One',
      date: '1970-01-02',
      status: 'Official',
      country: 'GB',
      media: [{
        position: 1,
        format: '12" Vinyl',
        trackCount: 2,
        tracks: [
          {
            number: 'A1',
            position: 1,
            title: 'Opening Song',
            length: 195000,
            recording: { id: 'rec-opening', title: 'Opening Song', length: 195000 }
          },
          {
            number: 'A2',
            position: 2,
            title: 'Second Song',
            length: 165000,
            recording: { id: 'rec-second', title: 'Second Song', length: 165000 }
          }
        ]
      }]
    }
  ]
};

test('selects only tracklist/duration gaps with MusicBrainz release-group refs by latest rank', () => {
  const selected = selectMusicBrainzReleaseImportAlbums({ albums });

  assert.deepEqual(selected.map((album) => [album.id, album.musicBrainzReleaseGroupId]), [
    ['album-alpha-one-1970', 'rg-alpha']
  ]);
});

test('builds album content candidates from the earliest official MusicBrainz release tracklist', () => {
  const report = buildMusicBrainzReleaseCandidates({
    albums: selectMusicBrainzReleaseImportAlbums({ albums }),
    responsesByAlbumId: new Map([['album-alpha-one-1970', releaseSearchResponse]])
  });

  assert.equal(report.candidates.length, 1);
  assert.equal(report.gaps.length, 0);
  assert.equal(report.candidates[0].albumId, 'album-alpha-one-1970');
  assert.equal(report.candidates[0].source.system, 'musicbrainz-release');
  assert.equal(report.candidates[0].source.musicBrainzReleaseGroupId, 'rg-alpha');
  assert.equal(report.candidates[0].source.musicBrainzReleaseId, 'rel-gb-vinyl');
  assert.deepEqual(report.candidates[0].tracklist.map((track) => [track.position, track.title, track.durationSeconds, track.recordingId]), [
    ['A1', 'Opening Song', 195, 'rec-opening'],
    ['A2', 'Second Song', 165, 'rec-second']
  ]);
  assert.equal(report.candidates[0].totalDurationSeconds, 360);
});

test('records explicit gaps when no usable official release tracklist is available', () => {
  const report = buildMusicBrainzReleaseCandidates({
    albums: selectMusicBrainzReleaseImportAlbums({ albums }),
    responsesByAlbumId: new Map([['album-alpha-one-1970', { releases: [{ id: 'rel-empty', status: 'Official', date: '1970', media: [] }] }]])
  });

  assert.equal(report.candidates.length, 0);
  assert.deepEqual(report.gaps.map((gap) => [gap.albumId, gap.reason]), [['album-alpha-one-1970', 'no-usable-musicbrainz-release-tracklist']]);
});
