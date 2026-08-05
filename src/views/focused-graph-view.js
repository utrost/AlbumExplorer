const CENTER = { x: 50, y: 50 };
const RADIUS = 34;

export function buildFocusedGraph({ selectedAlbumId, rows = [], relationships = [], limit = 10, allowedTypes = [] } = {}) {
  const rowById = new Map(rows.map((row) => [row.id, row]));
  const selectedAlbum = rowById.get(selectedAlbumId);
  if (!selectedAlbum) return { selectedAlbumId, nodes: [], edges: [] };

  const allowedTypeSet = new Set(allowedTypes ?? []);
  const relatedEdges = relationships
    .filter((relationship) => relationship.from === selectedAlbumId || relationship.to === selectedAlbumId)
    .filter((relationship) => allowedTypeSet.size === 0 || relationship.types.some((type) => allowedTypeSet.has(type)))
    .map((relationship) => normalizeFocusedEdge(selectedAlbumId, relationship))
    .filter((edge) => rowById.has(edge.to))
    .sort(compareFocusedEdges)
    .slice(0, limit);

  const nodes = [
    buildNode(selectedAlbum, 'selected', CENTER.x, CENTER.y),
    ...relatedEdges.map((edge, index) => {
      const position = radialPosition(index, relatedEdges.length);
      return buildNode(rowById.get(edge.to), 'related', position.x, position.y);
    })
  ];

  return {
    selectedAlbumId,
    nodes,
    edges: relatedEdges
  };
}

function normalizeFocusedEdge(selectedAlbumId, relationship) {
  const relatedId = relationship.from === selectedAlbumId ? relationship.to : relationship.from;
  return {
    id: relationship.pairKey,
    from: selectedAlbumId,
    to: relatedId,
    weight: relationship.weight,
    types: relationship.types,
    explanations: relationship.explanations,
    typedExplanations: relationship.typedExplanations ?? []
  };
}

function buildNode(row, kind, x, y) {
  return {
    id: row.id,
    kind,
    label: row.album,
    artist: row.artist,
    latestRank: row.latestRank ?? null,
    x,
    y
  };
}

function radialPosition(index, count) {
  if (count === 1) return { x: CENTER.x + RADIUS, y: CENTER.y };
  const angle = (Math.PI * 2 * index) / count;
  return {
    x: Math.round((CENTER.x + Math.cos(angle) * RADIUS) * 100) / 100,
    y: Math.round((CENTER.y + Math.sin(angle) * RADIUS) * 100) / 100
  };
}

function compareFocusedEdges(left, right) {
  return right.weight - left.weight || String(left.to).localeCompare(String(right.to), 'en', { sensitivity: 'base' });
}
