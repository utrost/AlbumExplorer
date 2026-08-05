const MIN_SEARCH_CHARACTERS = 3;

export function buildEnrichedComparisonRows({ comparison, candidates, sourceCandidates }) {
  const candidateByAlbumId = new Map((candidates.candidates ?? []).map((candidate) => [candidate.albumId, candidate]));
  const reviewIds = new Set((sourceCandidates.review ?? []).map((item) => item.albumId));
  const gapIds = new Set((sourceCandidates.gaps ?? []).map((item) => item.albumId));

  return (comparison.albums ?? []).map((album) => {
    const candidate = candidateByAlbumId.get(album.id);
    const metadata = candidate?.metadata ?? {};
    const primarySourceType = candidate?.sourceCandidates?.[0]?.sourceType ?? 'none';
    const ranks = Object.fromEntries((album.appearances ?? []).map((appearance) => [String(appearance.editionYear), appearance.rank]));
    const sortedAppearances = [...(album.appearances ?? [])].sort((a, b) => Number(a.editionYear) - Number(b.editionYear));
    const latestAppearance = [...sortedAppearances].sort((a, b) => Number(b.editionYear) - Number(a.editionYear))[0] ?? null;
    const earliestAppearance = sortedAppearances[0] ?? null;
    const musicBrainzRef = (metadata.externalRefs ?? []).find((ref) => ref.system === 'musicbrainz-release-group');
    return {
      id: album.id,
      artist: album.artist,
      album: album.album,
      releaseYear: album.releaseYear ?? null,
      releaseDate: metadata.releaseDate ?? null,
      labels: metadata.labels ?? [],
      genres: metadata.genres ?? [],
      externalRefs: metadata.externalRefs ?? [],
      musicBrainzUrl: musicBrainzRef?.url ?? null,
      metadataStatus: primarySourceType === 'musicbrainz-release-group' ? 'musicbrainz' : primarySourceType === 'rolling-stone-import' ? 'baseline' : 'unknown',
      musicBrainzMatchStatus: reviewIds.has(album.id) ? 'review' : gapIds.has(album.id) ? 'gap' : primarySourceType === 'musicbrainz-release-group' ? 'matched' : 'not-run',
      ranks,
      appearances: sortedAppearances,
      editionCount: sortedAppearances.length,
      latestEditionYear: latestAppearance?.editionYear ?? null,
      latestRank: latestAppearance?.rank ?? null,
      earliestRank: earliestAppearance?.rank ?? null,
      rankMovement: earliestAppearance && latestAppearance ? earliestAppearance.rank - latestAppearance.rank : null
    };
  });
}

export function filterRows(rows, filters = {}) {
  const normalizedSearch = normalize(filters.search);
  const search = normalizedSearch.length >= MIN_SEARCH_CHARACTERS ? normalizedSearch : '';
  return rows.filter((row) => {
    if (search && !`${normalize(row.artist)} ${normalize(row.album)}`.includes(search)) return false;
    if (filters.editionYear && filters.editionYear !== 'all' && !row.ranks[String(filters.editionYear)]) return false;
    if (filters.editionCount && filters.editionCount !== 'all' && row.editionCount !== Number(filters.editionCount)) return false;
    if (filters.metadataStatus && filters.metadataStatus !== 'all' && row.metadataStatus !== filters.metadataStatus) return false;
    if (filters.musicBrainzMatchStatus && filters.musicBrainzMatchStatus !== 'all' && row.musicBrainzMatchStatus !== filters.musicBrainzMatchStatus) return false;
    return true;
  });
}

export function sortRows(rows, sortKey = 'latest-rank') {
  const sorted = [...rows];
  const collator = new Intl.Collator('en', { sensitivity: 'base' });
  sorted.sort((left, right) => {
    if (sortKey === 'artist') return collator.compare(left.artist, right.artist) || collator.compare(left.album, right.album);
    if (sortKey === 'release-year') return compareNullable(left.releaseYear, right.releaseYear) || collator.compare(left.artist, right.artist);
    if (sortKey === 'edition-count') return right.editionCount - left.editionCount || compareNullable(left.latestRank, right.latestRank);
    if (sortKey === 'rank-movement') return compareNullable(right.rankMovement, left.rankMovement) || compareNullable(left.latestRank, right.latestRank);
    return compareNullable(left.latestRank, right.latestRank) || collator.compare(left.artist, right.artist);
  });
  return sorted;
}

function compareNullable(left, right) {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  return left - right;
}

function normalize(value) {
  return String(value ?? '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').trim();
}
