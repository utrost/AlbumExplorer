import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAlbumMetadataEnrichment, importedCandidatesFromComparison } from '../../src/data/album-metadata-enrichment.js';

const albums = [
  {
    id: 'album-marvin-gaye-whats-going-on-1971',
    artist: 'Marvin Gaye',
    album: "What's Going On",
    releaseYear: 1971,
    ranks: { '2024': 1 },
    appearances: [
      { editionYear: 2003, label: 'Motown', year: 1971 },
      { editionYear: 2024, label: null, year: 1971 }
    ]
  },
  {
    id: 'album-beach-boys-pet-sounds-1966',
    artist: 'The Beach Boys',
    album: 'Pet Sounds',
    releaseYear: 1966,
    ranks: { '2024': 2 },
    appearances: []
  },
  {
    id: 'album-mystery-record-2000',
    artist: 'Mystery Artist',
    album: 'Mystery Record',
    releaseYear: 2000,
    ranks: { '2024': 99 },
    appearances: []
  }
];

test('exact source match produces a metadata candidate without requiring manual review', () => {
  const result = buildAlbumMetadataEnrichment({
    albums: [albums[0]],
    sourceCandidates: [
      {
        sourceId: 'source-discogs-master-66631',
        sourceType: 'discogs',
        artist: 'Marvin Gaye',
        album: "What's Going On",
        releaseYear: 1971,
        labels: ['Tamla'],
        genres: ['Funk / Soul'],
        styles: ['Soul'],
        externalRefs: [{ system: 'discogs-master', id: '66631', url: 'https://www.discogs.com/master/66631' }]
      }
    ],
    overrides: []
  });

  assert.equal(result.candidates.length, 1);
  assert.equal(result.review.length, 0);
  assert.equal(result.gaps.length, 0);
  assert.equal(result.candidates[0].albumId, 'album-marvin-gaye-whats-going-on-1971');
  assert.equal(result.candidates[0].status, 'matched');
  assert.deepEqual(result.candidates[0].metadata.labels, ['Tamla']);
  assert.equal(result.candidates[0].sourceCandidates[0].sourceId, 'source-discogs-master-66631');
});

test('ambiguous exact matches go to review instead of being auto-accepted', () => {
  const result = buildAlbumMetadataEnrichment({
    albums: [albums[1]],
    sourceCandidates: [
      { sourceId: 'source-a', sourceType: 'musicbrainz', artist: 'The Beach Boys', album: 'Pet Sounds', releaseYear: 1966, labels: ['Capitol'] },
      { sourceId: 'source-b', sourceType: 'discogs', artist: 'The Beach Boys', album: 'Pet Sounds', releaseYear: 1966, labels: ['Capitol Records'] }
    ],
    overrides: []
  });

  assert.equal(result.candidates.length, 0);
  assert.equal(result.review.length, 1);
  assert.equal(result.review[0].reason, 'ambiguous-source-candidates');
  assert.equal(result.review[0].sourceCandidates.length, 2);
});

test('manual override wins over source candidates', () => {
  const result = buildAlbumMetadataEnrichment({
    albums: [albums[1]],
    sourceCandidates: [
      { sourceId: 'source-wrong', sourceType: 'discogs', artist: 'The Beach Boys', album: 'Pet Sounds', releaseYear: 1966, labels: ['Wrong Label'] }
    ],
    overrides: [
      {
        albumId: 'album-beach-boys-pet-sounds-1966',
        status: 'reviewed',
        reason: 'Curator-approved canonical metadata.',
        metadata: {
          canonicalArtist: 'The Beach Boys',
          canonicalTitle: 'Pet Sounds',
          releaseYear: 1966,
          labels: ['Capitol'],
          genres: ['Rock']
        }
      }
    ]
  });

  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].status, 'reviewed');
  assert.deepEqual(result.candidates[0].metadata.labels, ['Capitol']);
  assert.equal(result.candidates[0].sourceCandidates.length, 0);
});

test('albums with no source candidate are recorded as gaps, not invented metadata', () => {
  const result = buildAlbumMetadataEnrichment({ albums: [albums[2]], sourceCandidates: [], overrides: [] });

  assert.equal(result.candidates.length, 0);
  assert.equal(result.review.length, 0);
  assert.deepEqual(result.gaps, [
    {
      albumId: 'album-mystery-record-2000',
      artist: 'Mystery Artist',
      album: 'Mystery Record',
      releaseYear: 2000,
      reason: 'no-source-candidate'
    }
  ]);
});

test('existing imported comparison data can produce low-confidence source candidates', () => {
  const candidates = importedCandidatesFromComparison({ albums: [albums[0]] });

  assert.deepEqual(candidates, [
    {
      sourceId: 'source-rolling-stone-imported-metadata',
      sourceType: 'rolling-stone-import',
      artist: 'Marvin Gaye',
      album: "What's Going On",
      releaseYear: 1971,
      labels: ['Motown'],
      genres: [],
      styles: [],
      externalRefs: [],
      confidence: 'imported'
    }
  ]);
});

test('a unique external source candidate supersedes the low-confidence Rolling Stone baseline', () => {
  const result = buildAlbumMetadataEnrichment({
    albums: [albums[0]],
    sourceCandidates: [
      ...importedCandidatesFromComparison({ albums: [albums[0]] }),
      {
        sourceId: 'source-musicbrainz-release-group-example',
        sourceType: 'musicbrainz-release-group',
        artist: 'Marvin Gaye',
        album: "What's Going On",
        releaseYear: 1971,
        releaseDate: '1971-05-21',
        labels: [],
        genres: ['soul'],
        externalRefs: [{ system: 'musicbrainz-release-group', id: 'example', url: 'https://musicbrainz.org/release-group/example' }],
        confidence: 'matched'
      }
    ],
    overrides: []
  });

  assert.equal(result.candidates.length, 1);
  assert.equal(result.review.length, 0);
  assert.equal(result.candidates[0].sourceCandidates[0].sourceType, 'musicbrainz-release-group');
  assert.equal(result.candidates[0].metadata.releaseDate, '1971-05-21');
  assert.deepEqual(result.candidates[0].metadata.genres, ['soul']);
});
