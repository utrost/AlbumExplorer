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

const CREDIT_RULES = [
  { creditType: 'producer', relationshipType: 'shared-producer', weight: 3.0, explain: (name) => `Both albums credit ${name} as producer.` },
  { creditType: 'engineer', relationshipType: 'shared-engineer', weight: 2.4, explain: (name) => `Both albums credit ${name} as engineer.` },
  { creditType: 'songwriter', relationshipType: 'shared-songwriter', weight: 2.2, explain: (name) => `Both albums credit ${name} as songwriter.` },
  { creditType: 'musician', relationshipType: 'shared-musician', weight: 1.8, explain: (name) => `Both albums credit ${name} as musician/performer.` }
];

const RELATIONSHIP_TYPE_ORDER = [
  ...RULES.map((rule) => rule.type),
  ...CREDIT_RULES.map((rule) => rule.relationshipType),
  'shared-studio',
  'adjacent-release-period'
];

export function buildAlbumRelationships(rows, options = {}) {
  const minimumWeight = options.minimumWeight ?? DEFAULT_MINIMUM_WEIGHT;
  const allowedTypeSet = new Set(options.allowedTypes ?? []);
  const typeIsAllowed = (type) => allowedTypeSet.size === 0 || allowedTypeSet.has(type);
  const sortedRows = [...(rows ?? [])].sort((left, right) => compareText(left.id, right.id));
  const rowById = new Map(sortedRows.map((row) => [row.id, row]));
  const pairBuilders = new Map();

  for (const rule of RULES.filter((rule) => typeIsAllowed(rule.type))) addIndexedMetadataParts(pairBuilders, sortedRows, rule);
  addIndexedCreditParts(pairBuilders, rowById, options.creditCandidates ?? [], typeIsAllowed);
  if (typeIsAllowed('adjacent-release-period')) addAdjacentReleasePeriodParts(pairBuilders, sortedRows);

  const relationships = [...pairBuilders.values()]
    .map(finalizePairRelationship)
    .filter((relationship) => relationship.weight >= minimumWeight)
    .sort(compareRelationships);
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

function addIndexedMetadataParts(pairBuilders, rows, rule) {
  const rowsByValue = new Map();
  for (const row of rows) {
    const uniqueValues = uniqueDisplayValues(rule.values(row));
    for (const value of uniqueValues) {
      const key = normalize(value);
      if (!key) continue;
      if (!rowsByValue.has(key)) rowsByValue.set(key, { displayValue: value, rows: [] });
      rowsByValue.get(key).rows.push(row);
    }
  }

  for (const { displayValue, rows: sharedRows } of rowsByValue.values()) {
    addPairwiseValue(sharedRows, (left, right) => {
      addExplanationPart(pairBuilders, left, right, rule.type, rule.weight, rule.explain(displayValue));
    });
  }
}

function addIndexedCreditParts(pairBuilders, rowById, creditCandidates, typeIsAllowed = () => true) {
  const candidates = (creditCandidates ?? []).filter((candidate) => rowById.has(candidate.albumId));
  const candidateByAlbumId = new Map(candidates.map((candidate) => [candidate.albumId, candidate]));

  for (const rule of CREDIT_RULES.filter((rule) => typeIsAllowed(rule.relationshipType))) {
    const candidatesByName = groupCandidatesByCreditName(candidates, rule.creditType);
    for (const { displayName, candidates: sharedCandidates } of candidatesByName.values()) {
      addPairwiseValue(sharedCandidates, (leftCandidate, rightCandidate) => {
        const left = rowById.get(leftCandidate.albumId);
        const right = rowById.get(rightCandidate.albumId);
        const provenance = relationshipProvenance(leftCandidate, rightCandidate);
        addExplanationPart(
          pairBuilders,
          left,
          right,
          rule.relationshipType,
          rule.weight,
          explanationWithProvenance(rule.explain(displayName), provenance)
        );
      });
    }
  }

  if (!typeIsAllowed('shared-studio')) return candidateByAlbumId;
  const candidatesByStudio = groupCandidatesByStudioName(candidates);
  for (const { displayName, candidates: sharedCandidates } of candidatesByStudio.values()) {
    addPairwiseValue(sharedCandidates, (leftCandidate, rightCandidate) => {
      const left = rowById.get(leftCandidate.albumId);
      const right = rowById.get(rightCandidate.albumId);
      const provenance = relationshipProvenance(leftCandidate, rightCandidate);
      addExplanationPart(
        pairBuilders,
        left,
        right,
        'shared-studio',
        2.6,
        explanationWithProvenance(`Both albums are connected to the studio/location ${displayName}.`, provenance)
      );
    });
  }

  return candidateByAlbumId;
}

function addAdjacentReleasePeriodParts(pairBuilders, rows) {
  const rowsByYear = new Map();
  for (const row of rows) {
    if (!Number.isInteger(row.releaseYear)) continue;
    if (!rowsByYear.has(row.releaseYear)) rowsByYear.set(row.releaseYear, []);
    rowsByYear.get(row.releaseYear).push(row);
  }

  for (const row of rows) {
    if (!Number.isInteger(row.releaseYear)) continue;
    for (const yearDelta of [1, 2]) {
      for (const other of rowsByYear.get(row.releaseYear + yearDelta) ?? []) {
        addExplanationPart(
          pairBuilders,
          row,
          other,
          'adjacent-release-period',
          yearDelta === 1 ? 0.6 : 0.4,
          `Both albums were released within ${yearDelta} year${yearDelta === 1 ? '' : 's'} of each other.`
        );
      }
    }
  }
}

function addPairwiseValue(items, callback) {
  const sortedItems = [...items].sort((left, right) => compareText(left.id ?? left.albumId, right.id ?? right.albumId));
  for (let leftIndex = 0; leftIndex < sortedItems.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < sortedItems.length; rightIndex += 1) {
      callback(sortedItems[leftIndex], sortedItems[rightIndex]);
    }
  }
}

function addExplanationPart(pairBuilders, left, right, type, weightPerExplanation, explanation) {
  if (!left || !right || left.id === right.id) return;
  const [from, to] = compareText(left.id, right.id) <= 0 ? [left, right] : [right, left];
  const pairKey = `${from.id}::${to.id}`;
  if (!pairBuilders.has(pairKey)) {
    pairBuilders.set(pairKey, { pairKey, from: from.id, to: to.id, parts: new Map() });
  }
  const pair = pairBuilders.get(pairKey);
  if (!pair.parts.has(type)) pair.parts.set(type, { type, weightPerExplanation, explanations: [] });
  pair.parts.get(type).explanations.push(explanation);
}

function finalizePairRelationship(pair) {
  const parts = RELATIONSHIP_TYPE_ORDER
    .map((type) => pair.parts.get(type))
    .filter(Boolean)
    .map(finalizePart)
    .filter((part) => part.explanations.length > 0);

  const types = parts.map((part) => part.type);
  const typedExplanations = parts.flatMap((part) => part.explanations.map((explanation) => {
    if (typeof explanation === 'string') return { type: part.type, text: explanation };
    return { type: part.type, ...explanation };
  }));
  const explanations = typedExplanations.map((item) => item.text);
  const weight = Number(parts.reduce((sum, part) => sum + part.weight, 0).toFixed(2));
  return {
    pairKey: pair.pairKey,
    from: pair.from,
    to: pair.to,
    types,
    weight,
    explanations,
    typedExplanations
  };
}

function finalizePart(part) {
  const explanations = uniqueExplanations(part.explanations)
    .sort(compareExplanation)
    .slice(0, RELATIONSHIP_LIMIT_PER_PAIR);
  return {
    type: part.type,
    weight: part.weightPerExplanation * explanations.length,
    explanations
  };
}

function uniqueDisplayValues(values) {
  const byNormalized = new Map();
  for (const value of values ?? []) {
    const key = normalize(value);
    if (!key || byNormalized.has(key)) continue;
    byNormalized.set(key, value);
  }
  return [...byNormalized.values()].sort(compareText);
}

function uniqueExplanations(explanations) {
  const byText = new Map();
  for (const explanation of explanations ?? []) {
    const text = typeof explanation === 'string' ? explanation : explanation.text;
    if (!text || byText.has(text)) continue;
    byText.set(text, explanation);
  }
  return [...byText.values()];
}

function groupCandidatesByCreditName(candidates, creditType) {
  const byName = new Map();
  for (const candidate of candidates) {
    for (const name of uniqueDisplayValues((candidate.credits ?? []).filter((credit) => credit.type === creditType).map((credit) => credit.name))) {
      const key = normalize(name);
      if (!key) continue;
      if (!byName.has(key)) byName.set(key, { displayName: name, candidates: [] });
      byName.get(key).candidates.push(candidate);
    }
  }
  return byName;
}

function groupCandidatesByStudioName(candidates) {
  const byName = new Map();
  for (const candidate of candidates) {
    for (const name of uniqueDisplayValues((candidate.studios ?? []).map((studio) => studio.name))) {
      const key = normalize(name);
      if (!key) continue;
      if (!byName.has(key)) byName.set(key, { displayName: name, candidates: [] });
      byName.get(key).candidates.push(candidate);
    }
  }
  return byName;
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

function compareRelated(left, right) {
  return right.relationship.weight - left.relationship.weight || compareText(left.album.artist, right.album.artist) || compareText(left.album.album, right.album.album);
}

function compareRelationships(left, right) {
  return right.weight - left.weight || compareText(left.from, right.from) || compareText(left.to, right.to);
}

function compareExplanation(left, right) {
  const leftText = typeof left === 'string' ? left : left.text;
  const rightText = typeof right === 'string' ? right : right.text;
  return compareText(leftText, rightText);
}

function compareText(left, right) {
  return String(left ?? '').localeCompare(String(right ?? ''), 'en', { sensitivity: 'base' });
}

function normalize(value) {
  return String(value ?? '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').trim();
}
