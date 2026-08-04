import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRollingStoneComparison, findRollingStoneDuplicateCandidates } from '../../src/data/rolling-stone-comparison.js';

const imports = [
  {
    editionId: 'list-rolling-stone-2003',
    rows: [
      { rank: 1, artist: 'The Beatles', album: 'Sgt. Pepper’s Lonely Hearts Club Band', year: 1967 },
      { rank: 2, artist: 'Marvin Gaye', album: 'What’s Going On', year: 1971 }
    ]
  },
  {
    editionId: 'list-rolling-stone-2020',
    rows: [
      { rank: 1, artist: 'Marvin Gaye', album: "What's Going On", year: 1971 },
      { rank: 24, artist: 'Beatles', album: "Sgt. Pepper's Lonely Hearts Club Band", year: 1967 }
    ]
  }
];

test('builds one comparison row per album across parsed Rolling Stone editions', () => {
  const comparison = buildRollingStoneComparison(imports);

  assert.equal(comparison.schemaVersion, '0.1.0');
  assert.deepEqual(comparison.editions, ['2003', '2020']);
  assert.equal(comparison.albums.length, 2);

  const marvin = comparison.albums.find((album) => album.id === 'album-marvin-gaye-whats-going-on-1971');
  assert.equal(marvin.artist, 'Marvin Gaye');
  assert.equal(marvin.album, "What's Going On");
  assert.deepEqual(marvin.ranks, { '2003': 2, '2020': 1 });
  assert.deepEqual(marvin.rankDeltas, { '2003To2020': -1 });
  assert.deepEqual(marvin.appearances.map((appearance) => appearance.editionYear), [2003, 2020]);
});

test('matches punctuation and leading-The artist variants into one album identity', () => {
  const comparison = buildRollingStoneComparison(imports);

  const beatlesRows = comparison.albums.filter((album) => album.album === "Sgt. Pepper's Lonely Hearts Club Band");
  assert.equal(beatlesRows.length, 1);
  assert.deepEqual(beatlesRows[0].ranks, { '2003': 1, '2020': 24 });
  assert.deepEqual(beatlesRows[0].rankDeltas, { '2003To2020': 23 });
});

test('keeps rank appearances when release year is missing from a source row', () => {
  const comparison = buildRollingStoneComparison([
    {
      editionId: 'list-rolling-stone-2003',
      rows: [{ rank: 458, artist: 'Elton John', album: 'Tumbleweed Connection', label: null, year: null }]
    }
  ]);

  assert.equal(comparison.albumCount, 1);
  assert.deepEqual(comparison.albums[0].ranks, { '2003': 458 });
  assert.equal(comparison.albums[0].releaseYear, null);
  assert.equal(comparison.albums[0].id, 'album-elton-john-tumbleweed-connection');
});

test('applies approved album aliases before comparison rows are merged', () => {
  const comparison = buildRollingStoneComparison([
    {
      editionId: 'list-rolling-stone-2020',
      rows: [{ rank: 79, artist: 'Frank Ocean', album: 'Blonde', year: 2016 }]
    },
    {
      editionId: 'list-rolling-stone-2024',
      rows: [{ rank: 79, artist: 'Frank Ocean', album: 'Blond', year: 2016 }]
    }
  ], {
    aliases: [
      {
        canonicalArtist: 'Frank Ocean',
        canonicalAlbum: 'Blond',
        releaseYear: 2016,
        variants: [
          { artist: 'Frank Ocean', album: 'Blonde', year: 2016 }
        ]
      }
    ]
  });

  assert.equal(comparison.albumCount, 1);
  assert.equal(comparison.albums[0].id, 'album-frank-ocean-blond-2016');
  assert.equal(comparison.albums[0].album, 'Blond');
  assert.deepEqual(comparison.albums[0].ranks, { '2020': 79, '2024': 79 });
  assert.equal(comparison.albums[0].aliasesApplied.length, 1);
});

test('applies aliases to variants with explicitly missing release year', () => {
  const comparison = buildRollingStoneComparison([
    {
      editionId: 'list-rolling-stone-2003',
      rows: [{ rank: 252, artist: 'Jay-Z', album: 'The Blueprint', year: null }]
    },
    {
      editionId: 'list-rolling-stone-2012',
      rows: [{ rank: 252, artist: 'Jay-Z', album: 'The Blueprint', year: 2001 }]
    }
  ], {
    aliases: [
      {
        canonicalArtist: 'Jay-Z',
        canonicalAlbum: 'The Blueprint',
        releaseYear: 2001,
        variants: [{ artist: 'Jay-Z', album: 'The Blueprint', year: null }]
      }
    ]
  });

  assert.equal(comparison.albumCount, 1);
  assert.equal(comparison.albums[0].id, 'album-jay-z-the-blueprint-2001');
  assert.deepEqual(comparison.albums[0].ranks, { '2003': 252, '2012': 252 });
});

test('finds likely duplicate identities for human review without applying them silently', () => {
  const candidates = findRollingStoneDuplicateCandidates([
    {
      editionId: 'list-rolling-stone-2020',
      rows: [
        { rank: 79, artist: 'Frank Ocean', album: 'Blonde', year: 2016 },
        { rank: 48, artist: 'Bob Marley and the Wailers', album: 'Legend', year: 1984 }
      ]
    },
    {
      editionId: 'list-rolling-stone-2024',
      rows: [
        { rank: 79, artist: 'Frank Ocean', album: 'Blond', year: 2016 },
        { rank: 48, artist: 'Bob Marley and the Wailers', album: 'Exodus', year: 1977 }
      ]
    }
  ]);

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].reason, 'same-rank-similar-title');
  assert.deepEqual(candidates[0].ranks, { '2020': 79, '2024': 79 });
  assert.deepEqual(candidates[0].identities.map((identity) => identity.album).sort(), ['Blond', 'Blonde']);
});
