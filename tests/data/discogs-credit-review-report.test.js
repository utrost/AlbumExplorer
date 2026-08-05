import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDiscogsCreditReviewReport } from '../../src/data/discogs-credit-review-report.js';

const comparison = {
  albums: [
    {
      id: 'album-a',
      artist: 'Artist A',
      album: 'Album A',
      releaseYear: 1971,
      ranks: { '2024': 2, '2020': 3 }
    },
    {
      id: 'album-b',
      artist: 'Artist B',
      album: 'Album B',
      releaseYear: 1969,
      ranks: { '2024': 1 }
    },
    {
      id: 'album-c',
      artist: 'Artist C',
      album: 'Album C',
      releaseYear: 1980,
      ranks: { '2012': 100 }
    }
  ]
};

const creditCandidates = {
  generatedAt: null,
  candidates: [{ albumId: 'album-c', credits: [{ type: 'producer', name: 'Known Producer' }] }],
  review: [
    {
      albumId: 'album-a',
      artist: 'Artist A',
      album: 'Album A',
      releaseYear: 1971,
      reason: 'source-cache-without-usable-credits',
      sourceCandidates: [],
      source: {
        system: 'discogs-master-cache',
        id: '9001',
        title: 'Album A',
        url: 'https://www.discogs.com/release/9001-Artist-A-Album-A',
        cachePath: 'data/imports/discogs/releases/9001.json'
      }
    },
    {
      albumId: 'album-b',
      artist: 'Artist B',
      album: 'Album B',
      releaseYear: 1969,
      reason: 'ambiguous-discogs-master-search-result',
      sourceCandidates: [
        { id: '111', title: 'Artist B - Album B', year: '1969', url: 'https://api.discogs.com/masters/111' }
      ]
    }
  ],
  gaps: [
    {
      albumId: 'album-missing',
      artist: 'Artist Missing',
      album: 'Missing Album',
      releaseYear: 1970,
      reason: 'no-exact-discogs-master-search-result'
    }
  ]
};

test('builds a rank-sorted Discogs credit review report grouped by unresolved reason', () => {
  const report = buildDiscogsCreditReviewReport({
    comparison,
    creditCandidates,
    sourcePayloadsByCachePath: new Map([
      ['data/imports/discogs/releases/9001.json', {
        id: 9001,
        master_id: 1234,
        master_url: 'https://api.discogs.com/masters/1234',
        uri: 'https://www.discogs.com/release/9001-Artist-A-Album-A',
        title: 'Album A',
        extraartists: [],
        companies: [{ name: 'Ignore Artwork', entity_type_name: 'Designed At' }],
        tracklist: [
          { title: 'Song One', extraartists: [{ name: 'Producer Person', role: 'Producer' }] },
          { title: 'Song Two', extraartists: [] }
        ]
      }]
    ])
  });

  assert.equal(report.summary.comparisonAlbums, 3);
  assert.equal(report.summary.candidates, 1);
  assert.equal(report.summary.review, 2);
  assert.equal(report.summary.gaps, 1);
  assert.deepEqual(report.summary.reviewReasons, {
    'ambiguous-discogs-master-search-result': 1,
    'source-cache-without-usable-credits': 1
  });
  assert.deepEqual(report.summary.gapReasons, {
    'no-exact-discogs-master-search-result': 1
  });

  assert.equal(report.items[0].albumId, 'album-b');
  assert.equal(report.items[0].latestRank, 1);
  assert.equal(report.items[0].kind, 'review');
  assert.equal(report.items[0].recommendedAction, 'approve-master-override');
  assert.equal(report.items[0].sourceCandidates[0].id, '111');

  assert.equal(report.items[1].albumId, 'album-a');
  assert.equal(report.items[1].recommendedAction, 'inspect-release-or-mark-gap');
  assert.deepEqual(report.items[1].sourceDiagnostics, {
    sourceSystem: 'discogs-master-cache',
    sourceId: '9001',
    sourceTitle: 'Album A',
    sourceUrl: 'https://www.discogs.com/release/9001-Artist-A-Album-A',
    cachePath: 'data/imports/discogs/releases/9001.json',
    cacheAvailable: true,
    masterId: '1234',
    releaseId: '9001',
    payloadKind: 'release',
    topLevelCreditCount: 0,
    companyCount: 1,
    usableCompanyCount: 0,
    trackCount: 2,
    trackExtraArtistCount: 1,
    suggestedAction: 'import-track-level-credits-or-choose-alternate-source'
  });

  assert.equal(report.items[2].albumId, 'album-missing');
  assert.equal(report.items[2].kind, 'gap');
  assert.equal(report.items[2].latestRank, null);
  assert.equal(report.items[2].recommendedAction, 'add-search-alias');
});
