import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMusicBrainzLookupQuery,
  musicBrainzSourceCandidateFromReleaseGroup,
  selectMusicBrainzReleaseGroupMatch
} from '../../src/data/musicbrainz-source-candidates.js';

const album = {
  id: 'album-marvin-gaye-whats-going-on-1971',
  artist: 'Marvin Gaye',
  album: "What's Going On",
  releaseYear: 1971
};

const matchingReleaseGroup = {
  id: 'd5cc67b8-1cc4-364f-939e-df39ef12b35a',
  score: 100,
  title: "What's Going On",
  'first-release-date': '1971-05-21',
  'primary-type': 'Album',
  'secondary-types': [],
  tags: [{ name: 'soul', count: 5 }, { name: 'funk', count: 2 }],
  'artist-credit': [
    {
      name: 'Marvin Gaye',
      artist: {
        id: 'afdb7919-059d-43c1-b668-ba1d265e7e42',
        name: 'Marvin Gaye',
        'sort-name': 'Gaye, Marvin'
      }
    }
  ],
  releases: [
    { id: 'release-a', title: "What's Going On", status: 'Official' }
  ]
};

test('builds a constrained release-group lookup query from artist, title, and year', () => {
  assert.equal(
    buildMusicBrainzLookupQuery(album),
    'artist:"Marvin Gaye" AND releasegroup:"What\'s Going On" AND firstreleasedate:1971'
  );
});

test('maps an exact MusicBrainz album release-group to a source candidate', () => {
  const candidate = musicBrainzSourceCandidateFromReleaseGroup(album, matchingReleaseGroup);

  assert.equal(candidate.sourceId, 'source-musicbrainz-release-group-d5cc67b8-1cc4-364f-939e-df39ef12b35a');
  assert.equal(candidate.sourceType, 'musicbrainz-release-group');
  assert.equal(candidate.artist, 'Marvin Gaye');
  assert.equal(candidate.album, "What's Going On");
  assert.equal(candidate.releaseYear, 1971);
  assert.equal(candidate.releaseDate, '1971-05-21');
  assert.deepEqual(candidate.genres, ['soul', 'funk']);
  assert.deepEqual(candidate.externalRefs, [
    {
      system: 'musicbrainz-release-group',
      id: 'd5cc67b8-1cc4-364f-939e-df39ef12b35a',
      url: 'https://musicbrainz.org/release-group/d5cc67b8-1cc4-364f-939e-df39ef12b35a'
    },
    {
      system: 'musicbrainz-artist',
      id: 'afdb7919-059d-43c1-b668-ba1d265e7e42',
      url: 'https://musicbrainz.org/artist/afdb7919-059d-43c1-b668-ba1d265e7e42'
    }
  ]);
});

test('selects one exact album match and rejects same-title singles or compilations', () => {
  const single = {
    ...matchingReleaseGroup,
    id: 'single-id',
    'primary-type': 'Single',
    'first-release-date': '1983-02'
  };
  const compilation = {
    ...matchingReleaseGroup,
    id: 'compilation-id',
    'primary-type': 'Album',
    'secondary-types': ['Compilation'],
    'first-release-date': '2004'
  };

  const selected = selectMusicBrainzReleaseGroupMatch(album, [single, compilation, matchingReleaseGroup]);

  assert.equal(selected.status, 'matched');
  assert.equal(selected.releaseGroup.id, matchingReleaseGroup.id);
});

test('sends multiple exact album release-groups to review instead of inventing a winner', () => {
  const selected = selectMusicBrainzReleaseGroupMatch(album, [
    matchingReleaseGroup,
    { ...matchingReleaseGroup, id: 'alternate-album-id' }
  ]);

  assert.equal(selected.status, 'ambiguous');
  assert.equal(selected.releaseGroups.length, 2);
});

test('records a gap when MusicBrainz has no exact album release-group match', () => {
  const selected = selectMusicBrainzReleaseGroupMatch(album, [
    { ...matchingReleaseGroup, title: 'Different Album' }
  ]);

  assert.deepEqual(selected, { status: 'gap', reason: 'no-exact-musicbrainz-release-group-match' });
});
