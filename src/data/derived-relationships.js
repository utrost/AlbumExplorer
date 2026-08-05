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
  const creditCandidateByAlbumId = new Map((options.creditCandidates ?? []).map((candidate) => [candidate.albumId, candidate]));

  for (let leftIndex = 0; leftIndex < sortedRows.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < sortedRows.length; rightIndex += 1) {
      const relationship = buildPairRelationship(sortedRows[leftIndex], sortedRows[rightIndex], creditCandidateByAlbumId);
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
  return matchingRelationshipEvidence(relationship, allowedTypes).map((item) => item.text);
}

export function matchingRelationshipEvidence(relationship, allowedTypes = []) {
  const allowedTypeSet = new Set(allowedTypes ?? []);
  const typedExplanations = relationship?.typedExplanations ?? [];
  if (allowedTypeSet.size === 0 && typedExplanations.length > 0) return typedExplanations;
  const matching = typedExplanations.filter((item) => allowedTypeSet.has(item.type));
  if (matching.length > 0) return matching;
  return (relationship?.explanations ?? []).map((text) => ({ type: 'explanation', text }));
}

function buildPairRelationship(left, right, creditCandidateByAlbumId = new Map()) {
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

  const creditParts = creditRelationshipParts(creditCandidateByAlbumId.get(left.id), creditCandidateByAlbumId.get(right.id));
  parts.push(...creditParts);

  const releaseYearPart = adjacentReleasePeriodPart(left, right);
  if (releaseYearPart) parts.push(releaseYearPart);

  if (parts.length === 0) return null;
  const types = parts.map((part) => part.type);
  const typedExplanations = parts.flatMap((part) => part.explanations.map((explanation) => {
    if (typeof explanation === 'string') return { type: part.type, text: explanation };
    return { type: part.type, ...explanation };
  }));
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

function creditRelationshipParts(leftCandidate, rightCandidate) {
  if (!leftCandidate || !rightCandidate) return [];
  const provenance = relationshipProvenance(leftCandidate, rightCandidate);
  return [
    creditPart(leftCandidate, rightCandidate, 'producer', 'shared-producer', 3.0, (name) => `Both albums credit ${name} as producer.`, provenance),
    creditPart(leftCandidate, rightCandidate, 'engineer', 'shared-engineer', 2.4, (name) => `Both albums credit ${name} as engineer.`, provenance),
    creditPart(leftCandidate, rightCandidate, 'songwriter', 'shared-songwriter', 2.2, (name) => `Both albums credit ${name} as songwriter.`, provenance),
    creditPart(leftCandidate, rightCandidate, 'musician', 'shared-musician', 1.8, (name) => `Both albums credit ${name} as musician/performer.`, provenance),
    studioPart(leftCandidate, rightCandidate, provenance)
  ].filter(Boolean);
}

function creditPart(leftCandidate, rightCandidate, creditType, relationshipType, weight, explain, provenance) {
  const sharedNames = sharedDisplayValues(
    (leftCandidate.credits ?? []).filter((credit) => credit.type === creditType).map((credit) => credit.name),
    (rightCandidate.credits ?? []).filter((credit) => credit.type === creditType).map((credit) => credit.name)
  ).slice(0, RELATIONSHIP_LIMIT_PER_PAIR);
  if (sharedNames.length === 0) return null;
  return {
    type: relationshipType,
    weight: weight * sharedNames.length,
    explanations: sharedNames.map((name) => explanationWithProvenance(explain(name), provenance))
  };
}

function studioPart(leftCandidate, rightCandidate, provenance) {
  const sharedNames = sharedDisplayValues(
    (leftCandidate.studios ?? []).map((studio) => studio.name),
    (rightCandidate.studios ?? []).map((studio) => studio.name)
  ).slice(0, RELATIONSHIP_LIMIT_PER_PAIR);
  if (sharedNames.length === 0) return null;
  return {
    type: 'shared-studio',
    weight: 2.6 * sharedNames.length,
    explanations: sharedNames.map((name) => explanationWithProvenance(`Both albums are connected to the studio/location ${name}.`, provenance))
  };
}

function explanationWithProvenance(text, provenance) {
  return provenance ? { text, provenance } : text;
}

function relationshipProvenance(leftCandidate, rightCandidate) {
  const left = candidateSourceProvenance(leftCandidate);
  const right = candidateSourceProvenance(rightCandidate);
  if (!left && !right) return null;
  return {
    sourceType: left?.sourceType ?? right?.sourceType ?? 'discogs-release',
    left,
    right
  };
}

function candidateSourceProvenance(candidate) {
  const source = candidate?.source;
  if (!source) return null;
  return {
    albumId: candidate.albumId,
    masterId: source.masterId ?? null,
    releaseId: source.releaseId ?? source.id ?? null,
    selectedBy: source.selectedBy ?? source.system ?? null,
    masterUrl: source.urls?.master ?? source.masterUrl ?? (source.masterId ? `https://www.discogs.com/master/${source.masterId}` : null),
    releaseUrl: source.urls?.release ?? source.releaseUrl ?? source.url ?? (source.releaseId || source.id ? `https://www.discogs.com/release/${source.releaseId ?? source.id}` : null)
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
