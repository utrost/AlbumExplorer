const OWNERSHIP_STATES = new Set(['owned', 'wanted', 'missing', 'ordered', 'sold', 'not-collecting', 'unknown']);
const CONFIDENCE_VALUES = new Set(['verified', 'imported', 'inferred', 'curator-note', 'unknown', 'conflicting']);
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateCollection(collection) {
  const report = { errors: [], warnings: [], info: [] };
  const ids = new Map();

  for (const [groupName, records] of entityGroups(collection)) {
    for (const record of records) {
      if (!record.id) {
        add(report.errors, 'missing-id', `${groupName} record is missing id`, { groupName, record });
        continue;
      }
      if (!ID_PATTERN.test(record.id)) {
        add(report.errors, 'invalid-id', `${record.id} does not match the ID format`, { id: record.id });
      }
      if (ids.has(record.id)) {
        add(report.errors, 'duplicate-id', `${record.id} is used more than once`, { id: record.id, firstGroup: ids.get(record.id), groupName });
      } else {
        ids.set(record.id, groupName);
      }
      if (record.confidence && !CONFIDENCE_VALUES.has(record.confidence)) {
        add(report.warnings, 'unsupported-confidence', `${record.id} uses unsupported confidence ${record.confidence}`, { id: record.id, confidence: record.confidence });
      }
    }
  }

  const artistIds = new Set((collection.artists ?? []).map((artist) => artist.id));
  const albumIds = new Set((collection.albums ?? []).map((album) => album.id));
  const editionIds = new Set((collection.listEditions ?? []).map((edition) => edition.id));
  const sourceIds = new Set((collection.sources ?? []).map((source) => source.id));

  for (const album of collection.albums ?? []) {
    if (!album.title) add(report.errors, 'missing-album-title', `${album.id} is missing title`, { albumId: album.id });
    if (!album.primaryArtistId) {
      add(report.errors, 'missing-primary-artist', `${album.id} is missing primaryArtistId`, { albumId: album.id });
    } else if (!artistIds.has(album.primaryArtistId)) {
      add(report.errors, 'missing-artist-reference', `${album.id} references missing artist ${album.primaryArtistId}`, { albumId: album.id, artistId: album.primaryArtistId });
    }
    if (!OWNERSHIP_STATES.has(album.ownershipState)) {
      add(report.errors, 'invalid-ownership-state', `${album.id} uses invalid ownership state ${album.ownershipState}`, { albumId: album.id, ownershipState: album.ownershipState });
    }
    if (album.releaseYear !== null && album.releaseYear !== undefined && (!Number.isInteger(album.releaseYear) || album.releaseYear < 1900 || album.releaseYear > new Date().getFullYear() + 1)) {
      add(report.warnings, 'suspicious-release-year', `${album.id} has suspicious release year ${album.releaseYear}`, { albumId: album.id, releaseYear: album.releaseYear });
    }
    if (!album.contributorIds || album.contributorIds.length === 0) {
      add(report.info, 'missing-contributors', `${album.id} has no contributor metadata yet`, { albumId: album.id });
    }
    if (!album.studioIds || album.studioIds.length === 0) {
      add(report.info, 'missing-studios', `${album.id} has no studio metadata yet`, { albumId: album.id });
    }
    if (!album.cover) {
      add(report.info, 'missing-cover', `${album.id} has no usable cover path yet`, { albumId: album.id });
    }
    validateSourceIds(report, album, sourceIds);
  }

  const ranksByEdition = new Map();
  for (const appearance of collection.listAppearances ?? []) {
    if (!albumIds.has(appearance.albumId)) {
      add(report.errors, 'missing-album-reference', `list appearance references missing album ${appearance.albumId}`, { albumId: appearance.albumId });
    }
    if (!editionIds.has(appearance.editionId)) {
      add(report.errors, 'missing-edition-reference', `list appearance references missing edition ${appearance.editionId}`, { editionId: appearance.editionId });
    }
    if (!Number.isInteger(appearance.rank) || appearance.rank < 1) {
      add(report.errors, 'invalid-list-rank', `list appearance has invalid rank ${appearance.rank}`, { appearance });
    }
    const key = `${appearance.editionId}:${appearance.rank}`;
    if (ranksByEdition.has(key)) {
      add(report.errors, 'duplicate-list-rank', `${appearance.editionId} contains duplicate rank ${appearance.rank}`, { editionId: appearance.editionId, rank: appearance.rank });
    } else {
      ranksByEdition.set(key, appearance);
    }
    validateSourceIds(report, appearance, sourceIds);
  }

  for (const copy of collection.physicalCopies ?? []) {
    if (!albumIds.has(copy.albumId)) {
      add(report.errors, 'missing-album-reference', `${copy.id} references missing album ${copy.albumId}`, { copyId: copy.id, albumId: copy.albumId });
    }
    if (!OWNERSHIP_STATES.has(copy.ownershipState)) {
      add(report.errors, 'invalid-ownership-state', `${copy.id} uses invalid ownership state ${copy.ownershipState}`, { copyId: copy.id, ownershipState: copy.ownershipState });
    }
    validateSourceIds(report, copy, sourceIds);
  }

  for (const relationship of collection.relationships ?? []) {
    if (!ids.has(relationship.sourceEntityId)) {
      add(report.errors, 'missing-relationship-source', `${relationship.id} references missing source ${relationship.sourceEntityId}`, { relationshipId: relationship.id });
    }
    if (!ids.has(relationship.targetEntityId)) {
      add(report.errors, 'missing-relationship-target', `${relationship.id} references missing target ${relationship.targetEntityId}`, { relationshipId: relationship.id });
    }
  }

  return report;
}

function entityGroups(collection) {
  return [
    ['albums', collection.albums ?? []],
    ['artists', collection.artists ?? []],
    ['people', collection.people ?? []],
    ['studios', collection.studios ?? []],
    ['labels', collection.labels ?? []],
    ['genres', collection.genres ?? []],
    ['locations', collection.locations ?? []],
    ['listEditions', collection.listEditions ?? []],
    ['physicalCopies', collection.physicalCopies ?? []],
    ['relationships', collection.relationships ?? []],
    ['sources', collection.sources ?? []]
  ];
}

function validateSourceIds(report, record, sourceIds) {
  for (const sourceId of record.sourceIds ?? []) {
    if (!sourceIds.has(sourceId)) {
      add(report.warnings, 'missing-source-reference', `${record.id ?? record.albumId} references missing source ${sourceId}`, { sourceId });
    }
  }
}

function add(list, code, message, details = {}) {
  list.push({ code, message, ...details });
}
