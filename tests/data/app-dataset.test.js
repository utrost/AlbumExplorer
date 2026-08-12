import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAppDataset } from '../../src/data/app-dataset.js';

const comparison = {
  albums: [
    {
      id: 'album-alpha-one-1970',
      artist: 'Alpha',
      album: 'One',
      releaseYear: 1970,
      appearances: [{ editionId: 'list-rolling-stone-2020', editionYear: 2020, rank: 1, label: 'Shared' }]
    },
    {
      id: 'album-beta-two-1971',
      artist: 'Beta',
      album: 'Two',
      releaseYear: 1971,
      appearances: [{ editionId: 'list-rolling-stone-2020', editionYear: 2020, rank: 2, label: 'Shared' }]
    },
    {
      id: 'album-gamma-three',
      artist: 'Gamma',
      album: 'Three',
      releaseYear: null,
      appearances: [{ editionId: 'list-rolling-stone-2024', editionYear: 2024, rank: 3, label: null }]
    }
  ]
};

const metadataCandidates = {
  candidates: [
    {
      albumId: 'album-alpha-one-1970',
      metadata: {
        releaseDate: '1970-01-01',
        labels: ['Shared'],
        genres: ['rock'],
        externalRefs: [{ system: 'musicbrainz-release-group', id: 'mb-alpha', url: 'https://musicbrainz.org/release-group/mb-alpha' }]
      },
      sourceCandidates: [{ sourceType: 'musicbrainz-release-group' }]
    },
    {
      albumId: 'album-beta-two-1971',
      metadata: {
        labels: ['Shared'],
        genres: []
      },
      sourceCandidates: [{ sourceType: 'rolling-stone-import' }]
    }
  ]
};

const sourceCandidates = {
  review: [{ albumId: 'album-gamma-three' }],
  gaps: [{ albumId: 'album-beta-two-1971' }]
};

const creditCandidates = {
  candidates: [
    {
      albumId: 'album-alpha-one-1970',
      confidence: 'source-cache',
      source: { system: 'discogs-release-cache', cachePath: 'data/imports/discogs/releases/alpha.json', url: 'https://www.discogs.com/release/alpha' },
      credits: [{ type: 'producer', name: 'Pat Producer' }],
      studios: []
    },
    {
      albumId: 'album-beta-two-1971',
      confidence: 'source-cache',
      source: { system: 'discogs-release-cache' },
      credits: [{ type: 'producer', name: 'Pat Producer' }],
      studios: []
    }
  ],
  gaps: [{ albumId: 'album-gamma-three' }],
  documentedGaps: []
};

const profileGapCreditCandidates = {
  candidates: [
    {
      albumId: 'album-gamma-three',
      confidence: 'source-cache',
      source: { system: 'discogs-release-cache', cachePath: 'data/imports/discogs/releases/gamma.json', url: 'https://www.discogs.com/release/gamma' },
      credits: [{ type: 'engineer', name: 'Eli Engineer' }],
      studios: []
    }
  ],
  gaps: [],
  documentedGaps: []
};

const sourcePayloadsByCachePath = new Map([
  ['data/imports/discogs/releases/alpha.json', {
    uri: 'https://www.discogs.com/release/alpha',
    notes: 'Original gatefold release with a short contextual note.',
    images: [
      {
        type: 'primary',
        uri: 'https://img.example/alpha-cover-large.jpg',
        uri150: 'https://img.example/alpha-cover-150.jpg',
        width: 600,
        height: 600
      }
    ],
    tracklist: [
      {
        position: 'A1',
        type_: 'track',
        title: 'Opening Song',
        duration: '3:15',
        extraartists: [
          { name: 'Casey Composer', role: 'Written-By' },
          { name: 'Pat Producer', role: 'Producer' }
        ]
      },
      {
        position: 'A2',
        type_: 'track',
        title: 'Second Song',
        duration: '2:45',
        extraartists: [
          { name: 'Lee Lyricist', role: 'Lyrics By' }
        ]
      }
    ]
  }],
  ['data/imports/discogs/releases/gamma.json', {
    uri: 'https://www.discogs.com/release/gamma',
    images: [{ type: 'primary', uri: 'https://img.example/gamma-cover.jpg' }],
    tracklist: [{ position: '1', type_: 'track', title: 'Gap Song', duration: '4:00' }]
  }]
]);

test('builds a clean app-facing dataset with explicit quality states', () => {
  const dataset = buildAppDataset({ comparison, metadataCandidates, sourceCandidates, creditCandidates });

  assert.equal(dataset.status, 'app-exploration-dataset');
  assert.equal(dataset.summary.albumCount, 3);
  assert.equal(dataset.summary.musicBrainzMatched, 1);
  assert.equal(dataset.summary.rollingStoneBaseline, 1);
  assert.equal(dataset.summary.creditCandidateAlbums, 2);
  assert.equal(dataset.summary.creditUnknownAlbums, 1);
  assert.equal(dataset.dataQuality.principle.includes('exploration dataset'), true);

  const alpha = dataset.albums.find((album) => album.id === 'album-alpha-one-1970');
  assert.equal(alpha.dataQuality.metadata.status, 'source-confirmed');
  assert.equal(alpha.dataQuality.credits.status, 'source-candidate');

  const beta = dataset.albums.find((album) => album.id === 'album-beta-two-1971');
  assert.equal(beta.dataQuality.metadata.status, 'baseline');

  const gamma = dataset.albums.find((album) => album.id === 'album-gamma-three');
  assert.equal(gamma.dataQuality.metadata.status, 'unknown');
  assert.equal(gamma.dataQuality.credits.status, 'unknown');
  assert.deepEqual(dataset.dataQuality.missingReleaseYear.map((album) => album.albumId), ['album-gamma-three']);
});

test('materializes explorer relationships without requiring review data', () => {
  const dataset = buildAppDataset({ comparison, metadataCandidates, sourceCandidates, creditCandidates });

  const relationship = dataset.relationships.find((item) => item.from === 'album-alpha-one-1970' && item.to === 'album-beta-two-1971');
  assert.ok(relationship);
  assert.equal(relationship.types.includes('shared-label'), true);
  assert.equal(relationship.types.includes('shared-producer'), true);
  assert.equal(dataset.dataQuality.relationships.types['shared-producer'], 1);
});

test('builds content-first album profiles with source details as footnotes', () => {
  const dataset = buildAppDataset({ comparison, metadataCandidates, sourceCandidates, creditCandidates, sourcePayloadsByCachePath });

  assert.equal(dataset.summary.albumProfilesWithTracklists, 1);
  assert.equal(dataset.summary.albumProfilesWithCoverArt, 1);
  assert.equal(dataset.summary.albumProfilesWithTotalDuration, 1);
  assert.equal(dataset.summary.albumProfilesWithComposerCredits, 1);

  const alpha = dataset.albums.find((album) => album.id === 'album-alpha-one-1970');
  assert.equal(alpha.profile.description, 'Alpha — One (1970).');
  assert.equal(alpha.profile.story, 'Original gatefold release with a short contextual note.');
  assert.equal(alpha.profile.coverArt.url, 'https://img.example/alpha-cover-large.jpg');
  assert.equal(alpha.profile.totalDurationSeconds, 360);
  assert.deepEqual(alpha.profile.tracklist.map((track) => [track.position, track.title, track.durationSeconds]), [
    ['A1', 'Opening Song', 195],
    ['A2', 'Second Song', 165]
  ]);
  assert.deepEqual(alpha.profile.tracklist[0].composerCredits.map((credit) => credit.name), ['Casey Composer']);
  assert.deepEqual(alpha.profile.tracklist[1].lyricistCredits.map((credit) => credit.name), ['Lee Lyricist']);
  assert.equal(alpha.profile.footnotes[0].label, 'Album content source');
  assert.equal(alpha.profile.footnotes[0].url, 'https://www.discogs.com/release/alpha');
});

test('does not promote long technical release notes into album story copy', () => {
  const dataset = buildAppDataset({
    comparison,
    metadataCandidates,
    sourceCandidates,
    creditCandidates,
    sourcePayloadsByCachePath: new Map([
      ['data/imports/discogs/releases/alpha.json', {
        notes: "This is the original UK release on pink rim Island labels in matt gatefold cover containing lyrics. Cat.# on cover, labels and runouts. This release has on the back of the cover bottom right edge printer text and another similar release has different matrix markings.",
        tracklist: []
      }]
    ])
  });

  const alpha = dataset.albums.find((album) => album.id === 'album-alpha-one-1970');
  assert.equal(alpha.profile.story, null);
});

test('merges focused profile-gap credit candidates without overwriting the primary credit layer', () => {
  const dataset = buildAppDataset({
    comparison,
    metadataCandidates,
    sourceCandidates,
    creditCandidates,
    additionalCreditCandidateLayers: [profileGapCreditCandidates],
    sourcePayloadsByCachePath
  });

  assert.equal(dataset.summary.creditCandidateAlbums, 3);
  assert.equal(dataset.summary.creditUnknownAlbums, 0);
  assert.equal(dataset.summary.albumProfilesWithTracklists, 2);
  assert.equal(dataset.summary.albumProfilesWithCoverArt, 2);
  assert.equal(dataset.summary.albumProfilesWithTotalDuration, 2);
  assert.equal(dataset.dataQuality.relationships.types['shared-producer'], 1);

  const gamma = dataset.albums.find((album) => album.id === 'album-gamma-three');
  assert.equal(gamma.dataQuality.credits.status, 'source-candidate');
  assert.equal(gamma.profile.coverArt.url, 'https://img.example/gamma-cover.jpg');
  assert.deepEqual(gamma.profile.tracklist.map((track) => track.title), ['Gap Song']);
});
