const SCHEMA_VERSION = '0.1.0';

export function buildRollingStoneComparison(parsedImports) {
  const normalizedImports = parsedImports
    .map((parsedImport) => ({
      editionId: parsedImport.editionId,
      editionYear: editionYearFromId(parsedImport.editionId),
      rows: parsedImport.rows ?? []
    }))
    .filter((parsedImport) => parsedImport.editionYear !== null)
    .sort((a, b) => a.editionYear - b.editionYear);

  const albumsByKey = new Map();

  for (const parsedImport of normalizedImports) {
    for (const row of parsedImport.rows) {
      const artist = clean(row.artist);
      const album = clean(row.album);
      const year = normalizeYear(row.year);
      if (!artist || !album) continue;

      const identityKey = albumIdentityKey({ artist, album, year });
      if (!albumsByKey.has(identityKey)) {
        albumsByKey.set(identityKey, {
          id: `album-${identityKey}`,
          artist,
          album,
          releaseYear: year,
          ranks: {},
          rankDeltas: {},
          appearances: []
        });
      }

      const comparisonAlbum = albumsByKey.get(identityKey);
      comparisonAlbum.artist = artist;
      comparisonAlbum.album = album;
      comparisonAlbum.releaseYear = year;
      comparisonAlbum.ranks[String(parsedImport.editionYear)] = row.rank;
      comparisonAlbum.appearances.push({
        editionId: parsedImport.editionId,
        editionYear: parsedImport.editionYear,
        rank: row.rank,
        listedArtist: artist,
        listedAlbum: album,
        label: clean(row.label) || null,
        year
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
    albums
  };
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

function albumIdentityKey({ artist, album, year }) {
  const parts = [slugify(normalizeArtistForIdentity(artist)), slugify(album)];
  if (year) parts.push(String(year));
  return parts.join('-');
}

function normalizeArtistForIdentity(artist) {
  return artist.replace(/^the\s+/i, '').trim();
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
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/['’‘`]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function clean(value) {
  return String(value ?? '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .trim();
}
