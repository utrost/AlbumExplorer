export function buildIndexes(collection) {
  return {
    albumsById: mapById(collection.albums ?? []),
    artistsById: mapById(collection.artists ?? []),
    peopleById: mapById(collection.people ?? []),
    studiosById: mapById(collection.studios ?? []),
    labelsById: mapById(collection.labels ?? []),
    genresById: mapById(collection.genres ?? []),
    listEditionsById: mapById(collection.listEditions ?? []),
    listAppearancesByAlbumId: groupBy(collection.listAppearances ?? [], 'albumId'),
    listAppearancesByEditionId: groupBy(collection.listAppearances ?? [], 'editionId'),
    physicalCopiesByAlbumId: groupBy(collection.physicalCopies ?? [], 'albumId'),
    relationshipsBySourceEntityId: groupBy(collection.relationships ?? [], 'sourceEntityId'),
    relationshipsByTargetEntityId: groupBy(collection.relationships ?? [], 'targetEntityId')
  };
}

function mapById(records) {
  return new Map(records.map((record) => [record.id, record]));
}

function groupBy(records, key) {
  const groups = new Map();
  for (const record of records) {
    const value = record[key];
    if (!groups.has(value)) groups.set(value, []);
    groups.get(value).push(record);
  }
  return groups;
}
