const DEFAULT_MAX_DEPTH = 3;

export function findAlbumPath({ startAlbumId, endAlbumId, relationships = [], maxDepth = DEFAULT_MAX_DEPTH, allowedTypes = [] } = {}) {
  if (startAlbumId === endAlbumId) {
    return {
      found: true,
      reason: 'same-album',
      startAlbumId,
      endAlbumId,
      maxDepth,
      albumIds: [startAlbumId],
      hops: []
    };
  }

  const adjacency = buildAdjacency(relationships, allowedTypes);
  const queue = [{ albumId: startAlbumId, albumIds: [startAlbumId], hops: [] }];
  const visited = new Set([startAlbumId]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (current.hops.length >= maxDepth) continue;

    for (const edge of adjacency.get(current.albumId) ?? []) {
      if (visited.has(edge.to)) continue;
      const nextAlbumIds = [...current.albumIds, edge.to];
      const nextHops = [...current.hops, { from: current.albumId, to: edge.to, relationship: edge.relationship }];
      if (edge.to === endAlbumId) {
        return {
          found: true,
          reason: 'path-found',
          startAlbumId,
          endAlbumId,
          maxDepth,
          albumIds: nextAlbumIds,
          hops: nextHops
        };
      }
      visited.add(edge.to);
      queue.push({ albumId: edge.to, albumIds: nextAlbumIds, hops: nextHops });
    }
  }

  return {
    found: false,
    reason: 'no-path-within-depth',
    startAlbumId,
    endAlbumId,
    maxDepth,
    albumIds: [],
    hops: []
  };
}

function buildAdjacency(relationships, allowedTypes) {
  const allowedTypeSet = new Set(allowedTypes ?? []);
  const adjacency = new Map();
  for (const relationship of relationships
    .filter((item) => allowedTypeSet.size === 0 || item.types.some((type) => allowedTypeSet.has(type)))
    .sort(compareRelationships)) {
    addNeighbor(adjacency, relationship.from, relationship.to, relationship);
    addNeighbor(adjacency, relationship.to, relationship.from, relationship);
  }
  for (const [albumId, edges] of adjacency.entries()) {
    adjacency.set(albumId, edges.sort(compareEdges));
  }
  return adjacency;
}

function addNeighbor(adjacency, from, to, relationship) {
  if (!adjacency.has(from)) adjacency.set(from, []);
  adjacency.get(from).push({ to, relationship });
}

function compareEdges(left, right) {
  return String(left.to).localeCompare(String(right.to), 'en', { sensitivity: 'base' }) || compareRelationships(left.relationship, right.relationship);
}

function compareRelationships(left, right) {
  return String(left.pairKey ?? '').localeCompare(String(right.pairKey ?? ''), 'en', { sensitivity: 'base' });
}
