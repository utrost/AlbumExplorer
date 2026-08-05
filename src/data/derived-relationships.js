const DEFAULT_MINIMUM_WEIGHT = 1.1;
const RELATIONSHIP_LIMIT_PER_PAIR = 3;

const RULES = [
  {
    type: 'shared-label',
    weight: 2.0,
    values: (row) => row.labels ?? [],
    explain: (value) => `Both albums are connected through the label ${value}.`
  },
  {
    type: 'shared-genre',
    weight: 1.0,
    values: (row) => row.genres ?? [],
    explain: (value) => `Both albums share the genre/tag ${value}.`
  },
  {
    type: 'same-list-edition',
    weight: 1.5,
    values: (row) => (row.appearances ?? []).map((appearance) => String(appearance.editionYear)),
    explain: (value) => `Both albums appear in the ${value} Rolling Stone 500.`
  }
];

export function buildAlbumRelationships(rows, options = {}) {
  const minimumWeight = options.minimumWeight ?? DEFAULT_MINIMUM_WEIGHT;
  const relationships = [];
  const sortedRows = [...(rows ?? [])].sort((left, right) => compareText(left.id, right.id));

  for (let leftIndex = 0; leftIndex < sortedRows.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < sortedRows.length; rightIndex += 1) {
      const relationship = buildPairRelationship(sortedRows[leftIndex], sortedRows[rightIndex]);
      if (relationship && relationship.weight >= minimumWeight) relationships.push(relationship);
    }
  }

  relationships.sort(compareRelationships);
  return relationships;
}

export function getRelatedAlbums(albumId, rows, relationships, options = {}) {
  const limit = options.limit ?? 8;
  const allowedTypeSet = new Set(options.allowedTypes ?? []);
  const rowById = new Map((rows ?? []).map((row) => [row.id, row]));

  return (relationships ?? [])
    .filter((relationship) => relationship.from === albumId || relationship.to === albumId)
    .filter((relationship) => allowedTypeSet.size === 0 || relationship.types.some((type) => allowedTypeSet.has(type)))
    .map((relationship) => {
      const reverse = relationship.to === albumId;
      const relatedId = reverse ? relationship.from : relationship.to;
      return {
        album: rowById.get(relatedId),
        relationship: {
          ...relationship,
          direction: reverse ? 'reverse' : 'forward'
        }
      };
    })
    .filter((item) => item.album)
    .sort((left, right) => compareRelated(left, right))
    .slice(0, limit);
}

export function matchingRelationshipExplanations(relationship, allowedTypes = []) {
  const allowedTypeSet = new Set(allowedTypes ?? []);
  if (allowedTypeSet.size === 0) return relationship?.explanations ?? [];
  const typedExplanations = relationship?.typedExplanations ?? [];
  const matching = typedExplanations
    .filter((item) => allowedTypeSet.has(item.type))
    .map((item) => item.text);
  return matching.length > 0 ? matching : relationship?.explanations ?? [];
}

function buildPairRelationship(left, right) {
  const parts = [];
  for (const rule of RULES) {
    const sharedValues = sharedDisplayValues(rule.values(left), rule.values(right));
    if (sharedValues.length === 0) continue;
    const selectedValues = sharedValues.slice(0, RELATIONSHIP_LIMIT_PER_PAIR);
    parts.push({
      type: rule.type,
      weight: rule.weight * selectedValues.length,
      explanations: selectedValues.map(rule.explain)
    });
  }

  const releaseYearPart = adjacentReleasePeriodPart(left, right);
  if (releaseYearPart) parts.push(releaseYearPart);

  if (parts.length === 0) return null;
  const types = parts.map((part) => part.type);
  const typedExplanations = parts.flatMap((part) => part.explanations.map((text) => ({ type: part.type, text })));
  const explanations = typedExplanations.map((item) => item.text);
  const weight = Number(parts.reduce((sum, part) => sum + part.weight, 0).toFixed(2));
  return {
    pairKey: `${left.id}::${right.id}`,
    from: left.id,
    to: right.id,
    types,
    weight,
    explanations,
    typedExplanations
  };
}

function adjacentReleasePeriodPart(left, right) {
  if (!Number.isInteger(left.releaseYear) || !Number.isInteger(right.releaseYear)) return null;
  const yearDelta = Math.abs(left.releaseYear - right.releaseYear);
  if (yearDelta === 0 || yearDelta > 2) return null;
  return {
    type: 'adjacent-release-period',
    weight: yearDelta === 1 ? 0.6 : 0.4,
    explanations: [`Both albums were released within ${yearDelta} year${yearDelta === 1 ? '' : 's'} of each other.`]
  };
}

function sharedDisplayValues(leftValues, rightValues) {
  const rightByNormalized = new Map((rightValues ?? []).map((value) => [normalize(value), value]).filter(([key]) => key));
  const seen = new Set();
  const shared = [];
  for (const leftValue of leftValues ?? []) {
    const key = normalize(leftValue);
    if (!key || seen.has(key) || !rightByNormalized.has(key)) continue;
    seen.add(key);
    shared.push(leftValue);
  }
  return shared.sort(compareText);
}

function compareRelated(left, right) {
  return right.relationship.weight - left.relationship.weight || compareText(left.album.artist, right.album.artist) || compareText(left.album.album, right.album.album);
}

function compareRelationships(left, right) {
  return right.weight - left.weight || compareText(left.from, right.from) || compareText(left.to, right.to);
}

function compareText(left, right) {
  return String(left ?? '').localeCompare(String(right ?? ''), 'en', { sensitivity: 'base' });
}

function normalize(value) {
  return String(value ?? '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').trim();
}
