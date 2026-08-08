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
      source: { system: 'discogs-release-cache' },
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
