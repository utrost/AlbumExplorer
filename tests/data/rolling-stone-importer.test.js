import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRollingStoneCsv, normalizeRollingStoneRows } from '../../src/data/rolling-stone-importer.js';
import { validateCollection } from '../../src/data/validator.js';
import { buildIndexes } from '../../src/data/indexes.js';

const csv = `Owned,Position 2012,Year,Position 2020,Artist Sorted,Artist,Album,Image,Discogs Master Release
1,6,1971,1,"Gaye, Marvin",Marvin Gaye,What's Going On,#REF!,https://www.discogs.com/de/Marvin-Gaye-Whats-Going-On/master/66631
cd only,429,1975,,"Eno, Brian",Brian Eno,Another Green World,#REF!,https://www.discogs.com/de/Eno-Another-Green-World/master/6659
,126,73,140,"Wailers, The",The Wailers,Catch A Fire,#REF!,https://www.discogs.com/de/The-Wailers-Catch-A-Fire/master/65824
`;

test('parses Rolling Stone CSV rows with quoted commas', () => {
  const rows = parseRollingStoneCsv(csv);
  assert.equal(rows.length, 3);
  assert.equal(rows[0].Artist, 'Marvin Gaye');
  assert.equal(rows[0]['Artist Sorted'], 'Gaye, Marvin');
});

test('normalizes CSV into imported collection data with sources and list editions', () => {
  const collection = normalizeRollingStoneRows(parseRollingStoneCsv(csv));

  assert.equal(collection.schemaVersion, '0.1.0');
  assert.equal(collection.sources[0].id, 'source-rolling-stone-top-500-csv');
  assert.deepEqual(collection.listEditions.map((edition) => edition.id), [
    'list-rolling-stone-2012',
    'list-rolling-stone-2020'
  ]);
  assert.equal(collection.albums.length, 3);
  assert.equal(collection.artists.length, 3);
  assert.equal(collection.listAppearances.length, 5);

  const marvin = collection.albums.find((album) => album.title === "What's Going On");
  assert.equal(marvin.id, 'album-marvin-gaye-whats-going-on');
  assert.equal(marvin.ownershipState, 'owned');
  assert.equal(marvin.externalRefs[0].system, 'discogs-master');
  assert.equal(marvin.externalRefs[0].id, '66631');

  const eno = collection.albums.find((album) => album.title === 'Another Green World');
  assert.equal(eno.ownershipState, 'owned');
  assert.equal(eno.tags.includes('cd-only'), true);
  assert.equal(collection.physicalCopies.find((copy) => copy.albumId === eno.id).format, 'CD');
});

test('merges artists that slug to the same stable ID', () => {
  const rows = parseRollingStoneCsv(`Owned,Position 2012,Year,Position 2020,Artist Sorted,Artist,Album,Image,Discogs Master Release
1,300,1962,300,"Wolf, Howlin'",Howlin' Wolf,Album One,#REF!,
1,301,1963,301,"Wolf, Howlin’",Howlin’ Wolf,Album Two,#REF!,
`);
  const collection = normalizeRollingStoneRows(rows);

  assert.equal(collection.artists.filter((artist) => artist.id === 'artist-howlin-wolf').length, 1);
  assert.equal(collection.albums.every((album) => album.primaryArtistId === 'artist-howlin-wolf'), true);
});

test('validator treats sparse imported metadata as warnings instead of fatal errors', () => {
  const collection = normalizeRollingStoneRows(parseRollingStoneCsv(csv));
  const report = validateCollection(collection);

  assert.equal(report.errors.length, 0);
  assert.ok(report.warnings.some((warning) => warning.code === 'suspicious-release-year'));
  assert.ok(report.info.some((info) => info.code === 'missing-contributors'));
});

test('validator rejects broken references and duplicate list ranks', () => {
  const collection = normalizeRollingStoneRows(parseRollingStoneRowsForDuplicateRank());
  collection.listAppearances.push({
    albumId: 'album-does-not-exist',
    editionId: 'list-rolling-stone-2020',
    rank: 1,
    sourceConfidence: 'imported',
    sourceIds: ['source-rolling-stone-top-500-csv']
  });

  const report = validateCollection(collection);

  assert.ok(report.errors.some((error) => error.code === 'duplicate-list-rank'));
  assert.ok(report.errors.some((error) => error.code === 'missing-album-reference'));
});

test('builds lookup indexes from valid collection data', () => {
  const collection = normalizeRollingStoneRows(parseRollingStoneCsv(csv));
  const indexes = buildIndexes(collection);
  const marvin = indexes.albumsById.get('album-marvin-gaye-whats-going-on');

  assert.equal(marvin.title, "What's Going On");
  assert.equal(indexes.listAppearancesByAlbumId.get(marvin.id).length, 2);
  assert.equal(indexes.physicalCopiesByAlbumId.get('album-brian-eno-another-green-world').length, 1);
});

function parseRollingStoneRowsForDuplicateRank() {
  return parseRollingStoneCsv(`Owned,Position 2012,Year,Position 2020,Artist Sorted,Artist,Album,Image,Discogs Master Release
1,6,1971,1,"Gaye, Marvin",Marvin Gaye,What's Going On,#REF!,https://www.discogs.com/de/Marvin-Gaye-Whats-Going-On/master/66631
1,2,1966,1,"Beach Boys, The",The Beach Boys,Pet Sounds,#REF!,https://www.discogs.com/de/The-Beach-Boys-Pet-Sounds/master/17217
`);
}
