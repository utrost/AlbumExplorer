import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRollingStoneComparison } from '../../src/data/rolling-stone-comparison.js';

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
