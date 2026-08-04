const SCHEMA_VERSION = '0.1.0';
const IMPORTED_SOURCE_ID = 'source-rolling-stone-imported-metadata';

export function buildAlbumMetadataEnrichment({ albums, sourceCandidates = [], overrides = [] }) {
  const overrideByAlbumId = new Map(overrides.map((override) => [override.albumId, override]));
  const result = {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: null,
    status: 'generated-metadata-candidates',
    candidates: [],
    review: [],
    gaps: []
  };

  for (const album of albums ?? []) {
    const override = overrideByAlbumId.get(album.id);
    if (override) {
      result.candidates.push(candidateFromOverride(album, override));
      continue;
    }

    const matches = sourceCandidates.filter((candidate) => isExactCandidateMatch(album, candidate));
    if (matches.length === 1) {
      result.candidates.push(candidateFromSource(album, matches[0]));
    } else if (matches.length > 1) {
      result.review.push({
        albumId: album.id,
        artist: album.artist,
        album: album.album,
        releaseYear: album.releaseYear ?? null,
        reason: 'ambiguous-source-candidates',
        sourceCandidates: matches.map(sourceCandidateSummary)
      });
    } else {
      result.gaps.push({
        albumId: album.id,
        artist: album.artist,
        album: album.album,
        releaseYear: album.releaseYear ?? null,
        reason: 'no-source-candidate'
      });
    }
  }

  return result;
}

export function importedCandidatesFromComparison(comparison, options = {}) {
  const albums = (comparison.albums ?? []).slice(0, options.limit ?? Infinity);
  return albums.map((album) => {
    const labels = unique((album.appearances ?? [])
      .map((appearance) => clean(appearance.label))
      .filter(Boolean));
    return {
      sourceId: IMPORTED_SOURCE_ID,
      sourceType: 'rolling-stone-import',
      artist: album.artist,
      album: album.album,
      releaseYear: album.releaseYear ?? null,
      labels,
      genres: [],
      styles: [],
      externalRefs: [],
      confidence: 'imported'
    };
  });
}

function candidateFromOverride(album, override) {
  return {
    albumId: album.id,
    artist: album.artist,
    album: album.album,
    releaseYear: album.releaseYear ?? null,
    status: override.status ?? 'reviewed',
    confidence: 'reviewed',
    reason: override.reason ?? 'manual-override',
    metadata: normalizeMetadata(override.metadata ?? {}),
    sourceCandidates: []
  };
}

function candidateFromSource(album, sourceCandidate) {
  return {
    albumId: album.id,
    artist: album.artist,
    album: album.album,
    releaseYear: album.releaseYear ?? null,
    status: 'matched',
    confidence: sourceCandidate.confidence ?? 'matched',
    reason: 'exact-artist-title-year-match',
    metadata: normalizeMetadata({
      canonicalArtist: sourceCandidate.artist,
      canonicalTitle: sourceCandidate.album,
      releaseYear: sourceCandidate.releaseYear,
      releaseDate: sourceCandidate.releaseDate ?? null,
      labels: sourceCandidate.labels ?? [],
      genres: sourceCandidate.genres ?? [],
      styles: sourceCandidate.styles ?? [],
      country: sourceCandidate.country ?? null,
      externalRefs: sourceCandidate.externalRefs ?? [],
      coverCandidates: sourceCandidate.coverCandidates ?? []
    }),
    sourceCandidates: [sourceCandidateSummary(sourceCandidate)]
  };
}

function normalizeMetadata(metadata) {
  return {
    canonicalArtist: metadata.canonicalArtist ?? null,
    canonicalTitle: metadata.canonicalTitle ?? null,
    releaseYear: metadata.releaseYear ?? null,
    releaseDate: metadata.releaseDate ?? null,
    labels: metadata.labels ?? [],
    genres: metadata.genres ?? [],
    styles: metadata.styles ?? [],
    country: metadata.country ?? null,
    externalRefs: metadata.externalRefs ?? [],
    coverCandidates: metadata.coverCandidates ?? []
  };
}

function sourceCandidateSummary(candidate) {
  return {
    sourceId: candidate.sourceId,
    sourceType: candidate.sourceType,
    artist: candidate.artist,
    album: candidate.album,
    releaseYear: candidate.releaseYear ?? null,
    labels: candidate.labels ?? [],
    genres: candidate.genres ?? [],
    styles: candidate.styles ?? [],
    externalRefs: candidate.externalRefs ?? [],
    confidence: candidate.confidence ?? 'matched'
  };
}

function isExactCandidateMatch(album, candidate) {
  if (normalizeForMatch(album.artist) !== normalizeForMatch(candidate.artist)) return false;
  if (normalizeForMatch(album.album) !== normalizeForMatch(candidate.album)) return false;
  const albumYear = normalizeYear(album.releaseYear);
  const candidateYear = normalizeYear(candidate.releaseYear);
  return !albumYear || !candidateYear || albumYear === candidateYear;
}

function normalizeYear(value) {
  if (Number.isInteger(value)) return value;
  if (/^(?:19|20)\d{2}$/.test(String(value))) return Number(value);
  return null;
}

function normalizeForMatch(value) {
  return clean(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/['’‘`]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();
}

function unique(values) {
  return [...new Set(values)];
}

function clean(value) {
  return String(value ?? '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .trim();
}
