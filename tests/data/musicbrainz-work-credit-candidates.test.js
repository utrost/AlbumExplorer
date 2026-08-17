import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMusicBrainzWorkCreditCandidates,
  selectMusicBrainzWorkCreditImportAlbums
} from '../../src/data/musicbrainz-work-credit-candidates.js';

test('selects albums with recording-backed tracklists but no composer credits', () => {
  const albums = [
    {
      id: 'album-alpha',
      latestRank: 2,
      artist: 'Alpha',
      album: 'With Credits',
      profile: {
        tracklist: [
          { sequence: 1, title: 'Already Credited', recordingId: 'rec-alpha', composerCredits: [{ name: 'Known' }], songwriterCredits: [], lyricistCredits: [] }
        ]
      }
    },
    {
      id: 'album-beta',
      latestRank: 1,
      artist: 'Beta',
      album: 'Needs Credits',
      profile: {
        tracklist: [
          { sequence: 1, title: 'Needs Work', recordingId: 'rec-beta', composerCredits: [], songwriterCredits: [], lyricistCredits: [] }
        ]
      }
    },
    {
      id: 'album-gamma',
      latestRank: 3,
      artist: 'Gamma',
      album: 'No Recording',
      profile: {
        tracklist: [
          { sequence: 1, title: 'Local Track', composerCredits: [], songwriterCredits: [], lyricistCredits: [] }
        ]
      }
    }
  ];

  assert.deepEqual(selectMusicBrainzWorkCreditImportAlbums({ albums }).map((album) => album.id), ['album-beta']);
});

test('builds track-level songwriter and lyricist credits from cached MusicBrainz recording and work responses', () => {
  const albums = [
    {
      id: 'album-beta',
      artist: 'Beta',
      album: 'Needs Credits',
      profile: {
        tracklist: [
          { sequence: 1, title: 'Needs Work', recordingId: 'rec-beta', composerCredits: [], songwriterCredits: [], lyricistCredits: [] },
          { sequence: 2, title: 'No Work', recordingId: 'rec-empty', composerCredits: [], songwriterCredits: [], lyricistCredits: [] }
        ]
      }
    }
  ];
  const recordingResponsesById = new Map([
    ['rec-beta', {
      relations: [
        { 'target-type': 'work', type: 'performance', work: { id: 'work-beta', title: 'Needs Work' } }
      ]
    }],
    ['rec-empty', { relations: [] }]
  ]);
  const workResponsesById = new Map([
    ['work-beta', {
      relations: [
        { type: 'writer', artist: { name: 'Writer One' }, 'target-credit': 'Writer One' },
        { type: 'composer', artist: { name: 'Composer One' }, 'target-credit': 'Composer One' },
        { type: 'lyricist', artist: { name: 'Lyricist One' }, 'target-credit': 'Lyricist One' },
        { type: 'publisher', artist: { name: 'Publisher Noise' }, 'target-credit': 'Publisher Noise' }
      ]
    }]
  ]);

  const output = buildMusicBrainzWorkCreditCandidates({ albums, recordingResponsesById, workResponsesById });

  assert.equal(output.summary.candidateCount, 1);
  assert.equal(output.summary.gapCount, 0);
  assert.deepEqual(output.candidates[0].tracks.map((track) => [track.sequence, track.title]), [[1, 'Needs Work']]);
  assert.deepEqual(output.candidates[0].tracks[0].songwriterCredits.map((credit) => credit.name), ['Writer One']);
  assert.deepEqual(output.candidates[0].tracks[0].composerCredits.map((credit) => credit.name), ['Composer One']);
  assert.deepEqual(output.candidates[0].tracks[0].lyricistCredits.map((credit) => credit.name), ['Lyricist One']);
});

test('merges rerun work-credit candidates without losing previously credited tracks', async () => {
  const { mergeMusicBrainzWorkCreditCandidateLayers } = await import('../../src/data/musicbrainz-work-credit-candidates.js');
  const previous = {
    candidates: [
      {
        albumId: 'album-beta',
        artist: 'Beta',
        album: 'Needs Credits',
        tracks: [
          { sequence: 1, recordingId: 'rec-one', title: 'One', songwriterCredits: [{ name: 'Writer One' }], composerCredits: [], lyricistCredits: [] },
          { sequence: 2, recordingId: 'rec-two', title: 'Two', composerCredits: [{ name: 'Composer Two' }], songwriterCredits: [], lyricistCredits: [] }
        ],
        source: { system: 'musicbrainz-work-credit', url: 'https://musicbrainz.org/release-group/beta' }
      }
    ],
    gaps: [{ albumId: 'album-gap', reason: 'old-gap' }]
  };
  const rerun = {
    candidates: [
      {
        albumId: 'album-beta',
        artist: 'Beta',
        album: 'Needs Credits',
        tracks: [
          { sequence: 2, recordingId: 'rec-two', title: 'Two', composerCredits: [{ name: 'Composer Two Updated' }], songwriterCredits: [], lyricistCredits: [] },
          { sequence: 3, recordingId: 'rec-three', title: 'Three', lyricistCredits: [{ name: 'Lyricist Three' }], composerCredits: [], songwriterCredits: [] }
        ],
        source: { system: 'musicbrainz-work-credit', url: 'https://musicbrainz.org/release-group/beta' }
      }
    ],
    gaps: []
  };

  const merged = mergeMusicBrainzWorkCreditCandidateLayers(previous, rerun);

  assert.deepEqual(merged.candidates[0].tracks.map((track) => [track.sequence, track.recordingId, track.composerCredits?.[0]?.name ?? track.songwriterCredits?.[0]?.name ?? track.lyricistCredits?.[0]?.name]), [
    [1, 'rec-one', 'Writer One'],
    [2, 'rec-two', 'Composer Two Updated'],
    [3, 'rec-three', 'Lyricist Three']
  ]);
  assert.deepEqual(merged.gaps, []);
});
