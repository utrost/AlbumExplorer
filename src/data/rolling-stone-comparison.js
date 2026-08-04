const SCHEMA_VERSION = '0.1.0';

export function buildRollingStoneComparison(parsedImports, options = {}) {
  const normalizedImports = normalizeParsedImports(parsedImports);
  const aliasIndex = buildAliasIndex(options.aliases ?? []);
  const albumsByKey = new Map();

  for (const parsedImport of normalizedImports) {
    for (const row of parsedImport.rows) {
      const listedArtist = clean(row.artist);
      const listedAlbum = clean(row.album);
      const listedYear = normalizeYear(row.year);
      if (!listedArtist || !listedAlbum) continue;

      const originalIdentity = identityFor({ artist: listedArtist, album: listedAlbum, year: listedYear });
      const alias = aliasIndex.get(originalIdentity.key);
      const artist = alias?.canonicalArtist ?? listedArtist;
      const album = alias?.canonicalAlbum ?? listedAlbum;
      const year = alias ? normalizeYear(alias.releaseYear) : listedYear;
      const identity = identityFor({ artist, album, year });

      if (!albumsByKey.has(identity.key)) {
        albumsByKey.set(identity.key, {
          id: `album-${identity.key}`,
          artist,
          album,
          releaseYear: year,
          ranks: {},
          rankDeltas: {},
          aliasesApplied: [],
          appearances: []
        });
      }

      const comparisonAlbum = albumsByKey.get(identity.key);
      comparisonAlbum.artist = artist;
      comparisonAlbum.album = album;
      comparisonAlbum.releaseYear = year;
      comparisonAlbum.ranks[String(parsedImport.editionYear)] = row.rank;
      if (alias) addAliasApplied(comparisonAlbum, alias, { listedArtist, listedAlbum, listedYear });
      comparisonAlbum.appearances.push({
        editionId: parsedImport.editionId,
        editionYear: parsedImport.editionYear,
        rank: row.rank,
        listedArtist,
        listedAlbum,
        artist,
        album,
        label: clean(row.label) || null,
        year: listedYear,
        canonicalYear: year,
        aliasApplied: alias?.id ?? null
      });
    }
  }

  const editionYears = normalizedImports.map((parsedImport) => parsedImport.editionYear);
  const albums = [...albumsByKey.values()].map((album) => ({
    ...album,
    appearances: album.appearances.sort((a, b) => a.editionYear - b.editionYear),
    rankDeltas: rankDeltas(album.ranks, editionYears)
  })).sort((a, b) => sortByLatestRank(a, b, editionYears));

  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: null,
    editions: editionYears.map(String),
    editionIds: normalizedImports.map((parsedImport) => parsedImport.editionId),
    albumCount: albums.length,
    aliasesAppliedCount: albums.reduce((sum, album) => sum + album.aliasesApplied.length, 0),
    albums
  };
}

export function findRollingStoneDuplicateCandidates(parsedImports, options = {}) {
  const normalizedImports = normalizeParsedImports(parsedImports);
  const aliasIndex = buildAliasIndex(options.aliases ?? []);
  const candidatesByKey = new Map();

  for (let leftIndex = 0; leftIndex < normalizedImports.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < normalizedImports.length; rightIndex += 1) {
      const leftImport = normalizedImports[leftIndex];
      const rightImport = normalizedImports[rightIndex];
      for (const leftRow of leftImport.rows) {
        for (const rightRow of rightImport.rows) {
          if (leftRow.rank !== rightRow.rank) continue;
          const left = rowIdentity(leftImport, leftRow);
          const right = rowIdentity(rightImport, rightRow);
          if (!left || !right) continue;
          if (left.key === right.key) continue;
          if (aliasIndex.has(left.key) || aliasIndex.has(right.key)) continue;
          if (!isLikelySameAlbum(left, right)) continue;

          const key = [left.key, right.key].sort().join('::');
          if (!candidatesByKey.has(key)) {
            candidatesByKey.set(key, {
              reason: 'same-rank-similar-title',
              status: 'needs-review',
              score: similarityScore(left, right),
              ranks: {},
              identities: [identitySummary(left), identitySummary(right)]
            });
          }
          const candidate = candidatesByKey.get(key);
          candidate.ranks[String(left.editionYear)] = left.rank;
          candidate.ranks[String(right.editionYear)] = right.rank;
        }
      }
    }
  }

  return [...candidatesByKey.values()].sort((a, b) => b.score - a.score || firstRank(a) - firstRank(b));
}

function normalizeParsedImports(parsedImports) {
  return parsedImports
    .map((parsedImport) => ({
      editionId: parsedImport.editionId,
      editionYear: editionYearFromId(parsedImport.editionId),
      rows: parsedImport.rows ?? []
    }))
    .filter((parsedImport) => parsedImport.editionYear !== null)
    .sort((a, b) => a.editionYear - b.editionYear);
}

function buildAliasIndex(aliases) {
  const index = new Map();
  for (const alias of aliases) {
    const canonicalArtist = clean(alias.canonicalArtist);
    const canonicalAlbum = clean(alias.canonicalAlbum);
    const releaseYear = normalizeYear(alias.releaseYear);
    if (!canonicalArtist || !canonicalAlbum) continue;
    const id = alias.id ?? `alias-${identityFor({ artist: canonicalArtist, album: canonicalAlbum, year: releaseYear }).key}`;
    const canonical = { ...alias, id, canonicalArtist, canonicalAlbum, releaseYear };
    for (const variant of alias.variants ?? []) {
      const artist = clean(variant.artist);
      const album = clean(variant.album);
      const year = normalizeYear(variant.year ?? variant.releaseYear ?? releaseYear);
      if (!artist || !album) continue;
      index.set(identityFor({ artist, album, year }).key, canonical);
    }
  }
  return index;
}

function rowIdentity(parsedImport, row) {
  const artist = clean(row.artist);
  const album = clean(row.album);
  const year = normalizeYear(row.year);
  if (!artist || !album) return null;
  const identity = identityFor({ artist, album, year });
  return { ...identity, artist, album, year, rank: row.rank, editionId: parsedImport.editionId, editionYear: parsedImport.editionYear };
}

function identityFor({ artist, album, year }) {
  const key = albumIdentityKey({ artist, album, year });
  return { key, normalizedArtist: normalizeForReview(normalizeArtistForIdentity(artist)), normalizedAlbum: normalizeForReview(album) };
}

function isLikelySameAlbum(left, right) {
  if (left.year && right.year && left.year !== right.year) return false;
  if (left.normalizedArtist !== right.normalizedArtist) return false;
  if (left.normalizedAlbum === right.normalizedAlbum) return true;
  return levenshteinDistance(left.normalizedAlbum, right.normalizedAlbum) <= 2;
}

function similarityScore(left, right) {
  const albumDistance = levenshteinDistance(left.normalizedAlbum, right.normalizedAlbum);
  return Math.max(0, 1 - albumDistance / Math.max(left.normalizedAlbum.length, right.normalizedAlbum.length, 1));
}

function identitySummary(identity) {
  return {
    key: identity.key,
    artist: identity.artist,
    album: identity.album,
    year: identity.year,
    appearances: [
      { editionId: identity.editionId, editionYear: identity.editionYear, rank: identity.rank }
    ]
  };
}

function addAliasApplied(album, alias, variant) {
  const key = `${alias.id}:${variant.listedArtist}:${variant.listedAlbum}:${variant.listedYear ?? ''}`;
  if (album.aliasesApplied.some((applied) => applied.key === key)) return;
  album.aliasesApplied.push({
    key,
    aliasId: alias.id,
    listedArtist: variant.listedArtist,
    listedAlbum: variant.listedAlbum,
    listedYear: variant.listedYear,
    canonicalArtist: alias.canonicalArtist,
    canonicalAlbum: alias.canonicalAlbum,
    canonicalYear: alias.releaseYear
  });
}

function rankDeltas(ranks, editionYears) {
  const deltas = {};
  for (let index = 1; index < editionYears.length; index += 1) {
    const previousYear = editionYears[index - 1];
    const currentYear = editionYears[index];
    const previousRank = ranks[String(previousYear)];
    const currentRank = ranks[String(currentYear)];
    if (previousRank === undefined || currentRank === undefined) continue;
    deltas[`${previousYear}To${currentYear}`] = currentRank - previousRank;
  }
  return deltas;
}

function sortByLatestRank(a, b, editionYears) {
  const latestYear = String(editionYears.at(-1));
  const aLatest = a.ranks[latestYear] ?? Number.POSITIVE_INFINITY;
  const bLatest = b.ranks[latestYear] ?? Number.POSITIVE_INFINITY;
  if (aLatest !== bLatest) return aLatest - bLatest;

  const aBest = Math.min(...Object.values(a.ranks));
  const bBest = Math.min(...Object.values(b.ranks));
  if (aBest !== bBest) return aBest - bBest;

  return a.album.localeCompare(b.album);
}

function firstRank(candidate) {
  return Math.min(...Object.values(candidate.ranks));
}

function albumIdentityKey({ artist, album, year }) {
  const parts = [slugify(normalizeArtistForIdentity(artist)), slugify(album)];
  if (year) parts.push(String(year));
  return parts.join('-');
}

function normalizeArtistForIdentity(artist) {
  return clean(artist).replace(/^the\s+/i, '').trim();
}

function editionYearFromId(editionId) {
  const match = String(editionId ?? '').match(/(?:19|20)\d{2}/);
  return match ? Number(match[0]) : null;
}

function normalizeYear(year) {
  if (Number.isInteger(year)) return year;
  if (/^(?:19|20)\d{2}$/.test(String(year))) return Number(year);
  return null;
}

function slugify(value) {
  return clean(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/['’‘`]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function normalizeForReview(value) {
  return clean(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/['’‘`]/g, '')
    .replace(/\bthree\b/gi, '3')
    .replace(/\bthird\b/gi, '3rd')
    .replace(/\bstreet\b/gi, 'st')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();
}

function levenshteinDistance(left, right) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 0; i < left.length; i += 1) {
    const current = [i + 1];
    for (let j = 0; j < right.length; j += 1) {
      current[j + 1] = Math.min(
        current[j] + 1,
        previous[j + 1] + 1,
        previous[j] + (left[i] === right[j] ? 0 : 1)
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length];
}

function clean(value) {
  return String(value ?? '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .trim();
}
