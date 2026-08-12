import test from 'node:test';
import assert from 'node:assert/strict';
import { buildListComparison } from '../../src/data/list-comparison.js';

const rows = [
  {
    id: 'album-marvin-gaye-whats-going-on-1971',
    artist: 'Marvin Gaye',
    album: "What's Going On",
    releaseYear: 1971,
    ranks: { 2020: 1, 2024: 1 },
    appearances: [
      { editionYear: 2020, rank: 1 },
      { editionYear: 2024, rank: 1 }
    ]
  },
  {
    id: 'album-joni-mitchell-blue-1971',
    artist: 'Joni Mitchell',
    album: 'Blue',
    releaseYear: 1971,
    ranks: { 2020: 3, 2024: 2 },
    appearances: [
      { editionYear: 2020, rank: 3 },
      { editionYear: 2024, rank: 2 }
    ]
  },
  {
    id: 'album-stevie-wonder-innervisions-1973',
    artist: 'Stevie Wonder',
    album: 'Innervisions',
    releaseYear: 1973,
    ranks: { 2020: 34, 2024: 44 },
    appearances: [
      { editionYear: 2020, rank: 34 },
      { editionYear: 2024, rank: 44 }
    ]
  },
  {
    id: 'album-late-entry-2024',
    artist: 'New Artist',
    album: 'New Entry',
    releaseYear: 1999,
    ranks: { 2024: 10 },
    appearances: [{ editionYear: 2024, rank: 10 }]
  },
  {
    id: 'album-removed-after-2020',
    artist: 'Former Artist',
    album: 'Former Entry',
    releaseYear: 1965,
    ranks: { 2020: 9 },
    appearances: [{ editionYear: 2020, rank: 9 }]
  }
];

test('compares two Rolling Stone editions with added removed persistent and movement groups', () => {
  const comparison = buildListComparison(rows, { fromYear: 2020, toYear: 2024 });

  assert.deepEqual(comparison.editions, { fromYear: 2020, toYear: 2024 });
  assert.deepEqual(comparison.counts, {
    fromEdition: 4,
    toEdition: 4,
    persistent: 3,
    added: 1,
    removed: 1,
    rising: 1,
    falling: 1,
    unchanged: 1
  });
  assert.deepEqual(comparison.groups.added.map((item) => item.id), ['album-late-entry-2024']);
  assert.deepEqual(comparison.groups.removed.map((item) => item.id), ['album-removed-after-2020']);
  assert.deepEqual(comparison.groups.rising.map((item) => [item.id, item.movement]), [['album-joni-mitchell-blue-1971', 1]]);
  assert.deepEqual(comparison.groups.falling.map((item) => [item.id, item.movement]), [['album-stevie-wonder-innervisions-1973', -10]]);
  assert.deepEqual(comparison.groups.unchanged.map((item) => item.id), ['album-marvin-gaye-whats-going-on-1971']);
});

test('orders edition movement by destination rank for visible list comparison tables', () => {
  const comparison = buildListComparison(rows, { fromYear: 2020, toYear: 2024 });

  assert.deepEqual(comparison.rows.map((item) => item.id), [
    'album-marvin-gaye-whats-going-on-1971',
    'album-joni-mitchell-blue-1971',
    'album-late-entry-2024',
    'album-stevie-wonder-innervisions-1973',
    'album-removed-after-2020'
  ]);
  assert.deepEqual(comparison.rows.map((item) => item.status), ['unchanged', 'rising', 'added', 'falling', 'removed']);
});
