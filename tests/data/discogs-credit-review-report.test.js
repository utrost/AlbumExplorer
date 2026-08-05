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
      sourceCandidates: []
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
  const report = buildDiscogsCreditReviewReport({ comparison, creditCandidates });

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

  assert.equal(report.items[2].albumId, 'album-missing');
  assert.equal(report.items[2].kind, 'gap');
  assert.equal(report.items[2].latestRank, null);
  assert.equal(report.items[2].recommendedAction, 'add-search-alias');
});
