import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWikidataStoryCandidates,
  mergeWikidataStoryCandidateLayers,
  selectWikidataStoryFallbackEntity,
  selectWikidataStoryFallbackImportAlbums,
  selectWikidataStoryImportAlbums
} from '../../src/data/wikidata-story-candidates.js';

test('selects story gaps that already have MusicBrainz release-group references by latest rank', () => {
  const albums = [
    {
      id: 'album-low-rank',
      artist: 'Low',
      album: 'Rank',
      latestRank: 200,
      profile: { story: null },
      externalRefs: [{ system: 'musicbrainz-release-group', id: 'mb-low', url: 'https://musicbrainz.org/release-group/mb-low' }]
    },
    {
      id: 'album-has-story',
      artist: 'Has',
      album: 'Story',
      latestRank: 1,
      profile: { story: 'Already good.' },
      externalRefs: [{ system: 'musicbrainz-release-group', id: 'mb-story' }]
    },
    {
      id: 'album-high-rank',
      artist: 'High',
      album: 'Rank',
      latestRank: 5,
      profile: { story: 'Story/context pending.' },
      externalRefs: [{ system: 'musicbrainz-release-group', id: 'mb-high' }]
    },
    {
      id: 'album-no-mb',
      artist: 'No',
      album: 'MB',
      latestRank: 2,
      profile: { story: null },
      externalRefs: []
    }
  ];

  assert.deepEqual(
    selectWikidataStoryImportAlbums({ albums }).map((album) => [album.id, album.musicBrainzReleaseGroupId]),
    [
      ['album-high-rank', 'mb-high'],
      ['album-low-rank', 'mb-low']
    ]
  );
});

test('builds concise story candidates from cached Wikidata and Wikipedia summaries', () => {
  const albums = [
    {
      id: 'album-alpha-one-1970',
      artist: 'Alpha',
      album: 'One',
      releaseYear: 1970,
      musicBrainzReleaseGroupId: 'mb-alpha',
      musicBrainzReleaseGroupUrl: 'https://musicbrainz.org/release-group/mb-alpha'
    },
    {
      id: 'album-beta-two-1971',
      artist: 'Beta',
      album: 'Two',
      releaseYear: 1971,
      musicBrainzReleaseGroupId: 'mb-beta'
    }
  ];
  const responsesByAlbumId = new Map([
    ['album-alpha-one-1970', {
      wikidata: {
        entityId: 'Q123',
        label: 'One',
        description: '1970 studio album by Alpha',
        wikipediaTitle: 'One_(Alpha_album)',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/One_(Alpha_album)'
      },
      wikipediaSummary: {
        extract: 'One is the debut studio album by Alpha. It became a landmark in imaginary rock and influenced later albums. This third sentence should not be copied.'
      }
    }],
    ['album-beta-two-1971', {
      wikidata: { entityId: 'Q456', label: 'Two' },
      wikipediaSummary: { extract: 'Two may refer to several unrelated topics.' }
    }]
  ]);

  const output = buildWikidataStoryCandidates({ albums, responsesByAlbumId });

  assert.equal(output.status, 'generated-wikidata-story-candidates');
  assert.equal(output.summary.candidateCount, 1);
  assert.equal(output.summary.gapCount, 1);
  assert.equal(output.candidates[0].albumId, 'album-alpha-one-1970');
  assert.equal(output.candidates[0].profile.description, '1970 studio album by Alpha');
  assert.equal(output.candidates[0].profile.story, 'One is the debut studio album by Alpha. It became a landmark in imaginary rock and influenced later albums.');
  assert.equal(output.candidates[0].source.wikidataUrl, 'https://www.wikidata.org/wiki/Q123');
  assert.equal(output.candidates[0].source.wikipediaUrl, 'https://en.wikipedia.org/wiki/One_(Alpha_album)');
  assert.deepEqual(output.gaps.map((gap) => [gap.albumId, gap.reason]), [['album-beta-two-1971', 'weak-or-disambiguation-summary']]);
});

test('merges rerun story layers without losing previous candidates when a smaller scope is imported', () => {
  const previous = {
    candidates: [
      { albumId: 'album-alpha-one-1970', profile: { story: 'Existing sourced story.' } },
      { albumId: 'album-beta-two-1971', profile: { story: 'Candidate replaced by better rerun.' } }
    ],
    gaps: [{ albumId: 'album-gamma-three', reason: 'wikidata-response-missing' }]
  };
  const rerun = {
    candidates: [{ albumId: 'album-beta-two-1971', profile: { story: 'Fresh sourced story.' } }],
    gaps: [{ albumId: 'album-delta-four', reason: 'weak-or-disambiguation-summary' }]
  };

  const merged = mergeWikidataStoryCandidateLayers(previous, rerun);

  assert.deepEqual(merged.candidates.map((candidate) => [candidate.albumId, candidate.profile.story]), [
    ['album-alpha-one-1970', 'Existing sourced story.'],
    ['album-beta-two-1971', 'Fresh sourced story.']
  ]);
  assert.deepEqual(merged.gaps.map((gap) => [gap.albumId, gap.reason]), [
    ['album-gamma-three', 'wikidata-response-missing'],
    ['album-delta-four', 'weak-or-disambiguation-summary']
  ]);
  assert.equal(merged.summary.candidateCount, 2);
  assert.equal(merged.summary.gapCount, 2);
});

test('selects fallback story gaps not already covered by generated candidates', () => {
  const albums = [
    { id: 'album-covered', artist: 'Covered', album: 'Story', latestRank: 1, profile: { story: null }, externalRefs: [] },
    { id: 'album-high', artist: 'High', album: 'Gap', latestRank: 3, profile: { story: null }, externalRefs: [] },
    { id: 'album-low', artist: 'Low', album: 'Gap', latestRank: 20, profile: { story: 'Story/context pending.' }, externalRefs: [] },
    { id: 'album-done', artist: 'Done', album: 'Story', latestRank: 2, profile: { story: 'Already sourced.' }, externalRefs: [] }
  ];

  const selected = selectWikidataStoryFallbackImportAlbums({
    albums,
    existingLayer: { candidates: [{ albumId: 'album-covered' }] }
  });

  assert.deepEqual(selected.map((album) => album.id), ['album-high', 'album-low']);
});

test('accepts one exact album-ish fallback entity and rejects ambiguous exact entities', () => {
  const album = { artist: 'The Clash', album: 'London Calling', releaseYear: 1979 };
  const accepted = selectWikidataStoryFallbackEntity(album, [
    { entityId: 'Q1', label: 'London Calling', description: '1979 studio album by the Clash', wikipediaTitle: 'London_Calling', wikipediaUrl: 'https://en.wikipedia.org/wiki/London_Calling' },
    { entityId: 'Q2', label: 'London Calling Tour', description: 'concert tour', wikipediaTitle: 'London_Calling_Tour' }
  ]);

  assert.equal(accepted.entityId, 'Q1');

  const ambiguous = selectWikidataStoryFallbackEntity(album, [
    { entityId: 'Q1', label: 'London Calling', description: '1979 studio album by the Clash', wikipediaTitle: 'London_Calling' },
    { entityId: 'Q3', label: 'London Calling', description: '1979 soundtrack album', wikipediaTitle: 'London_Calling_Soundtrack' }
  ]);

  assert.equal(ambiguous, null);
});
