const SCHEMA_VERSION = '0.1.0';

const CREDIT_ROLE_PATTERNS = [
  { type: 'producer', pattern: /\b(?:co-)?producer\b/i },
  { type: 'engineer', pattern: /\bengineer\b/i },
  { type: 'songwriter', pattern: /\b(?:written-by|writer|songwriter|composed by|composition)\b/i },
  { type: 'musician', pattern: /\b(?:performer|vocals?|voice|guitar|bass|drums?|piano|keyboards?|saxophone|trumpet|violin|cello|organ|synthesizer|percussion|harmonica|flute|choir|strings?|horns?)\b/i }
];

const IGNORED_ROLE_PATTERNS = [
  /photograph/i,
  /artwork/i,
  /design/i,
  /layout/i,
  /liner notes/i,
  /management/i,
  /booking/i
];

export function buildAlbumCreditCandidates({ albums = [], discogsMastersByAlbumId = new Map() }) {
  const result = {
    schemaVersion: SCHEMA_VERSION,
    status: 'generated-credit-candidates',
    generatedAt: null,
    description: 'Reviewable album credit candidates extracted from cached external source responses. Canonical collection data is not modified.',
    candidates: [],
    review: [],
    gaps: []
  };

  for (const album of albums) {
    const source = discogsMastersByAlbumId.get(album.id);
    if (!source?.master) {
      result.gaps.push(gapItem(album, 'no-credit-source-cache'));
      continue;
    }

    const candidate = albumCreditCandidateFromDiscogsMaster(album, source.master, { cachePath: source.cachePath });
    if (candidate.credits.length === 0 && candidate.studios.length === 0) {
      result.review.push({
        albumId: album.id,
        artist: album.artist,
        album: album.album,
        releaseYear: album.releaseYear ?? null,
        reason: 'source-cache-without-usable-credits',
        source: candidate.source
      });
      continue;
    }
    result.candidates.push(candidate);
  }

  return result;
}

export function albumCreditCandidateFromDiscogsMaster(album, master, options = {}) {
  const sourceId = String(master.id ?? options.cachePath ?? album.id);
  const credits = uniqueCredits([
    ...creditsFromDiscogsPeople(master.credits ?? []),
    ...creditsFromDiscogsPeople(master.extraartists ?? [])
  ]);
  const studios = uniqueBy([
    ...studiosFromDiscogsCompanies(master.companies ?? []),
    ...studiosFromDiscogsNotes(master.notes ?? '')
  ], (studio) => normalize(studio.name));

  return {
    albumId: album.id,
    artist: album.artist,
    album: album.album,
    releaseYear: album.releaseYear ?? null,
    status: 'candidate',
    confidence: 'source-cache',
    source: {
      system: options.sourceSystem ?? 'discogs-master-cache',
      id: sourceId,
      title: master.title ?? null,
      url: master.uri ?? null,
      cachePath: options.cachePath ?? null
    },
    credits,
    studios
  };
}

export function normalizeDiscogsCreditRole(role) {
  const cleanRole = cleanRoleText(role);
  if (!cleanRole || IGNORED_ROLE_PATTERNS.some((pattern) => pattern.test(cleanRole))) return null;
  return CREDIT_ROLE_PATTERNS.find(({ pattern }) => pattern.test(cleanRole))?.type ?? null;
}

function creditsFromDiscogsPeople(people) {
  const credits = [];
  for (const person of people ?? []) {
    const name = cleanName(person.name);
    if (!name) continue;
    for (const role of splitRoles(person.role)) {
      const type = normalizeDiscogsCreditRole(role);
      if (!type) continue;
      credits.push({
        type,
        name,
        role: cleanRoleText(role),
        sourceRole: cleanRoleText(person.role)
      });
    }
  }
  return credits;
}

function splitRoles(role) {
  return String(role ?? '')
    .split(/[,;]/)
    .map(cleanRoleText)
    .filter(Boolean);
}

function studiosFromDiscogsCompanies(companies) {
  return (companies ?? [])
    .filter((company) => /\b(?:recorded at|mixed at|mastered at|lacquer cut at)\b/i.test(company.entity_type_name ?? ''))
    .map((company) => ({
      name: String(company.name ?? '').trim(),
      source: `discogs-company:${company.entity_type_name}`
    }))
    .filter((studio) => studio.name);
}

function studiosFromDiscogsNotes(notes) {
  const text = String(notes ?? '').replace(/\s+/g, ' ');
  const studios = [];
  const recordedAt = /Recorded at (.+)$/i.exec(text)?.[1]
    ?.replace(/\s+(?:Mixed|Mastered|Lacquer Cut) At:.+$/i, '')
    ?.replace(/\.$/, '') ?? '';
  for (const part of recordedAt.split(/\s+(?:and|&)\s+|,/i)) {
    const name = part.trim().replace(/^(?:the\s+)/i, '').replace(/\s+in\s+.+$/i, '').replace(/\s*\(.+\)$/g, '').trim();
    if (/\b(?:studio|studios|sound|recorders?|hitsville)\b/i.test(name)) {
      studios.push({ name, source: 'discogs-notes' });
    }
  }
  return uniqueBy(studios, (studio) => normalize(studio.name));
}

function gapItem(album, reason) {
  return {
    albumId: album.id,
    artist: album.artist,
    album: album.album,
    releaseYear: album.releaseYear ?? null,
    reason
  };
}

function uniqueCredits(credits) {
  return uniqueBy(credits, (credit) => [credit.type, normalize(credit.name), normalize(credit.role)].join('::'));
}

function uniqueBy(values, keyFn) {
  const seen = new Set();
  const output = [];
  for (const value of values) {
    const key = keyFn(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(value);
  }
  return output;
}

function cleanName(value) {
  return String(value ?? '')
    .replace(/\s*\(\d+\)\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanRoleText(value) {
  return String(value ?? '')
    .replace(/\[[^\]]+\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();
}
