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

const coverArtCandidates = {
  candidates: [
    {
      albumId: 'album-gamma-three',
      coverArt: {
        url: 'https://coverartarchive.org/gamma-front.jpg',
        thumbnailUrl: 'https://coverartarchive.org/gamma-small.jpg',
        width: 1000,
        height: 1000
      },
      source: { system: 'cover-art-archive', release: 'https://musicbrainz.org/release/gamma' }
    }
  ],
  gaps: []
};

const musicBrainzReleaseCandidates = {
  candidates: [
    {
      albumId: 'album-beta-two-1971',
      tracklist: [
        {
          position: '1',
          disc: 1,
          side: null,
          sequence: 1,
          title: 'MusicBrainz Song',
          durationSeconds: 123,
          recordingId: 'recording-beta-song',
          composerCredits: [],
          songwriterCredits: [],
          lyricistCredits: [],
          performerCredits: []
        }
      ],
      totalDurationSeconds: 123,
      source: { system: 'musicbrainz-release', url: 'https://musicbrainz.org/release/beta-release' }
    }
  ],
  gaps: []
};

const wikidataStoryCandidates = {
  candidates: [
    {
      albumId: 'album-beta-two-1971',
      profile: {
        description: '1971 studio album by Beta',
        story: 'Two is a landmark album with a compact sourced story.'
      },
      source: {
        system: 'wikidata-wikipedia',
        wikidataUrl: 'https://www.wikidata.org/wiki/Q456',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/Two_(Beta_album)'
      }
    }
  ],
  gaps: []
};

const sourcePayloadsByCachePath = new Map([
  ['data/imports/discogs/releases/alpha.json', {
    uri: 'https://www.discogs.com/release/alpha',
    notes: 'A concise album context note.',
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
  assert.equal(alpha.profile.story, 'A concise album context note.');
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

test('does not promote short pressing or label-variant notes into album story copy', () => {
  const dataset = buildAppDataset({
    comparison,
    metadataCandidates,
    sourceCandidates,
    creditCandidates,
    sourcePayloadsByCachePath: new Map([
      ['data/imports/discogs/releases/alpha.json', {
        notes: 'Label variant: layout and font. deep groove pressing Original copies include inner sleeve promoting Motown releases.',
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
    coverArtCandidates,
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
  assert.equal(gamma.profile.coverArt.url, 'https://coverartarchive.org/gamma-front.jpg');
  assert.deepEqual(gamma.profile.tracklist.map((track) => track.title), ['Gap Song']);
  assert.deepEqual(gamma.profile.footnotes.map((footnote) => footnote.label), ['Album content source', 'Cover art source']);
});


test('uses MusicBrainz release candidates to fill tracklist and duration gaps without replacing Discogs content', () => {
  const dataset = buildAppDataset({
    comparison,
    metadataCandidates,
    sourceCandidates,
    creditCandidates,
    musicBrainzReleaseCandidates,
    sourcePayloadsByCachePath
  });

  assert.equal(dataset.summary.albumProfilesWithTracklists, 2);
  assert.equal(dataset.summary.albumProfilesWithTotalDuration, 2);

  const alpha = dataset.albums.find((album) => album.id === 'album-alpha-one-1970');
  assert.deepEqual(alpha.profile.tracklist.map((track) => track.title), ['Opening Song', 'Second Song']);
  assert.equal(alpha.profile.footnotes[0].label, 'Album content source');

  const beta = dataset.albums.find((album) => album.id === 'album-beta-two-1971');
  assert.deepEqual(beta.profile.tracklist.map((track) => [track.title, track.durationSeconds, track.recordingId]), [
    ['MusicBrainz Song', 123, 'recording-beta-song']
  ]);
  assert.equal(beta.profile.totalDurationSeconds, 123);
  assert.deepEqual(beta.profile.footnotes.map((footnote) => footnote.label), ['MusicBrainz release source']);
});

test('uses MusicBrainz work-credit candidates to fill missing composers without replacing source-cache track credits', () => {
  const musicBrainzWorkCreditCandidates = {
    candidates: [
      {
        albumId: 'album-alpha-one-1970',
        tracks: [
          {
            sequence: 1,
            title: 'Opening Song',
            composerCredits: [{ name: 'Wrong Replacement', creditedAs: 'Wrong Replacement', role: 'composer' }],
            songwriterCredits: [],
            lyricistCredits: []
          }
        ],
        source: { system: 'musicbrainz-work-credit', url: 'https://musicbrainz.org/release/alpha-release' }
      },
      {
        albumId: 'album-beta-two-1971',
        tracks: [
          {
            sequence: 1,
            recordingId: 'recording-beta-song',
            title: 'MusicBrainz Song',
            composerCredits: [],
            songwriterCredits: [
              { name: 'Writer One', creditedAs: 'Writer One', role: 'writer' },
              { name: 'Writer Two', creditedAs: 'Writer Two', role: 'writer' }
            ],
            lyricistCredits: []
          }
        ],
        source: { system: 'musicbrainz-work-credit', url: 'https://musicbrainz.org/release/beta-release' }
      }
    ]
  };

  const dataset = buildAppDataset({
    comparison,
    metadataCandidates,
    sourceCandidates,
    creditCandidates,
    musicBrainzReleaseCandidates,
    musicBrainzWorkCreditCandidates,
    sourcePayloadsByCachePath
  });

  assert.equal(dataset.summary.albumProfilesWithComposerCredits, 2);

  const alpha = dataset.albums.find((album) => album.id === 'album-alpha-one-1970');
  assert.deepEqual(alpha.profile.tracklist[0].composerCredits.map((credit) => credit.name), ['Casey Composer']);

  const beta = dataset.albums.find((album) => album.id === 'album-beta-two-1971');
  assert.deepEqual(beta.profile.tracklist[0].songwriterCredits.map((credit) => credit.name), ['Writer One', 'Writer Two']);
  assert.deepEqual(beta.profile.footnotes.map((footnote) => footnote.label), ['MusicBrainz release source', 'MusicBrainz work credit source']);
});

test('uses Wikidata/Wikipedia story candidates without replacing source-cache Discogs stories', () => {
  const dataset = buildAppDataset({
    comparison,
    metadataCandidates,
    sourceCandidates,
    creditCandidates,
    wikidataStoryCandidates,
    sourcePayloadsByCachePath
  });

  const alpha = dataset.albums.find((album) => album.id === 'album-alpha-one-1970');
  assert.equal(alpha.profile.description, 'Alpha — One (1970).');
  assert.equal(alpha.profile.story, 'A concise album context note.');
  assert.deepEqual(alpha.profile.footnotes.map((footnote) => footnote.label), ['Album content source']);

  const beta = dataset.albums.find((album) => album.id === 'album-beta-two-1971');
  assert.equal(beta.profile.description, '1971 studio album by Beta');
  assert.equal(beta.profile.story, 'Two is a landmark album with a compact sourced story.');
  assert.deepEqual(beta.profile.footnotes.map((footnote) => footnote.label), ['Album story source']);
});
