import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEnrichedComparisonRows, filterRows, sortRows } from '../../src/data/enriched-comparison.js';

const comparison = {
  albums: [
    {
      id: 'album-marvin-gaye-whats-going-on-1971',
      artist: 'Marvin Gaye',
      album: "What's Going On",
      releaseYear: 1971,
      appearances: [
        { editionYear: 2003, rank: 6, label: 'Motown' },
        { editionYear: 2024, rank: 1, label: 'Tamla/Motown' }
      ]
    },
    {
      id: 'album-prince-and-the-revolution-purple-rain-1984',
      artist: 'Prince and the Revolution',
      album: 'Purple Rain',
      releaseYear: 1984,
      appearances: [{ editionYear: 2024, rank: 8, label: 'Warner Bros.' }]
    }
  ]
};

const candidates = {
  candidates: [
    {
      albumId: 'album-marvin-gaye-whats-going-on-1971',
      metadata: {
        releaseDate: '1971-05-21',
        labels: ['Motown', 'Tamla/Motown'],
        genres: ['soul'],
        externalRefs: [{ system: 'musicbrainz-release-group', url: 'https://musicbrainz.org/release-group/example' }]
      },
      sourceCandidates: [{ sourceType: 'musicbrainz-release-group' }]
    },
    {
      albumId: 'album-prince-and-the-revolution-purple-rain-1984',
      metadata: {
        releaseDate: null,
        labels: ['Warner Bros.'],
        genres: [],
        externalRefs: []
      },
      sourceCandidates: [{ sourceType: 'rolling-stone-import' }]
    }
  ]
};

const sourceCandidates = {
  review: [
    { albumId: 'album-sheryl-crow-sheryl-crow-1996', reason: 'ambiguous-musicbrainz-release-group-match' }
  ],
  gaps: [
    { albumId: 'album-prince-and-the-revolution-purple-rain-1984', reason: 'no-exact-musicbrainz-release-group-match' }
  ]
};

test('builds UI-ready comparison rows with ranks and metadata status', () => {
  const rows = buildEnrichedComparisonRows({ comparison, candidates, sourceCandidates });

  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0].ranks, { 2003: 6, 2024: 1 });
  assert.equal(rows[0].latestRank, 1);
  assert.equal(rows[0].editionCount, 2);
  assert.equal(rows[0].metadataStatus, 'musicbrainz');
  assert.equal(rows[0].releaseDate, '1971-05-21');
  assert.deepEqual(rows[0].genres, ['soul']);
  assert.equal(rows[0].musicBrainzUrl, 'https://musicbrainz.org/release-group/example');
  assert.equal(rows[1].metadataStatus, 'baseline');
  assert.equal(rows[1].musicBrainzMatchStatus, 'gap');
});

test('filters rows by search text, edition count, edition appearance, and metadata status', () => {
  const rows = buildEnrichedComparisonRows({ comparison, candidates, sourceCandidates });

  assert.deepEqual(filterRows(rows, { search: 'gaye' }).map((row) => row.id), ['album-marvin-gaye-whats-going-on-1971']);
  assert.deepEqual(filterRows(rows, { editionCount: '2' }).map((row) => row.id), ['album-marvin-gaye-whats-going-on-1971']);
  assert.deepEqual(filterRows(rows, { editionYear: '2003' }).map((row) => row.id), ['album-marvin-gaye-whats-going-on-1971']);
  assert.deepEqual(filterRows(rows, { metadataStatus: 'baseline' }).map((row) => row.id), ['album-prince-and-the-revolution-purple-rain-1984']);
});

test('sorts rows by latest rank and artist', () => {
  const rows = buildEnrichedComparisonRows({ comparison, candidates, sourceCandidates });

  assert.deepEqual(sortRows(rows, 'latest-rank').map((row) => row.latestRank), [1, 8]);
  assert.deepEqual(sortRows(rows, 'artist').map((row) => row.artist), ['Marvin Gaye', 'Prince and the Revolution']);
});
