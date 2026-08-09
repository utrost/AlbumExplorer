import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAlbumProfileGaps } from '../../src/data/album-profile-gaps.js';

const atlas = {
  albums: [
    {
      id: 'album-complete',
      artist: 'Complete Artist',
      album: 'Complete Album',
      releaseYear: 1971,
      latestRank: 3,
      ranks: { '2024': 3 },
      profile: {
        coverArt: { url: 'https://img.example/complete.jpg' },
        story: 'A useful story.',
        tracklist: [
          {
            title: 'Complete Song',
            durationSeconds: 180,
            composerCredits: [{ name: 'Writer One' }],
            songwriterCredits: [],
            lyricistCredits: []
          }
        ],
        totalDurationSeconds: 180
      }
    },
    {
      id: 'album-no-profile',
      artist: 'Missing Artist',
      album: 'Missing Album',
      releaseYear: 1969,
      latestRank: 1,
      ranks: { '2024': 1 }
    },
    {
      id: 'album-partial',
      artist: 'Partial Artist',
      album: 'Partial Album',
      releaseYear: 1980,
      latestRank: 2,
      ranks: { '2024': 2 },
      profile: {
        coverArt: null,
        story: 'Story/context pending.',
        tracklist: [
          {
            title: 'Partial Song',
            durationSeconds: null,
            composerCredits: [],
            songwriterCredits: [],
            lyricistCredits: []
          }
        ],
        totalDurationSeconds: null
      }
    }
  ]
};

test('builds a rank-sorted album profile gap report grouped by missing content field', () => {
  const report = buildAlbumProfileGaps({ atlas });

  assert.equal(report.status, 'generated-album-profile-gaps');
  assert.equal(report.summary.albumCount, 3);
  assert.deepEqual(report.summary.missingCounts, {
    coverArt: 2,
    tracklist: 1,
    totalDuration: 2,
    composerCredits: 2,
    story: 2
  });

  assert.deepEqual(report.groups.coverArt.items.map((item) => item.albumId), ['album-no-profile', 'album-partial']);
  assert.deepEqual(report.groups.tracklist.items.map((item) => item.albumId), ['album-no-profile']);
  assert.deepEqual(report.groups.totalDuration.items.map((item) => item.albumId), ['album-no-profile', 'album-partial']);
  assert.deepEqual(report.groups.composerCredits.items.map((item) => item.albumId), ['album-no-profile', 'album-partial']);
  assert.deepEqual(report.groups.story.items.map((item) => item.albumId), ['album-no-profile', 'album-partial']);

  assert.equal(report.items[0].albumId, 'album-no-profile');
  assert.equal(report.items[0].latestRank, 1);
  assert.deepEqual(report.items[0].missing, ['coverArt', 'tracklist', 'totalDuration', 'composerCredits', 'story']);
  assert.equal(report.items[0].recommendedAction, 'fetch-album-content-sources');

  assert.equal(report.items[1].albumId, 'album-partial');
  assert.deepEqual(report.items[1].missing, ['coverArt', 'totalDuration', 'composerCredits', 'story']);
  assert.equal(report.items[1].recommendedAction, 'enrich-existing-tracklist-and-story');
});
