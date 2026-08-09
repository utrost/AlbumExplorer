export function buildDiscogsCreditSearchAliasMap({ aliases = [] } = {}) {
  return new Map((aliases ?? [])
    .filter((alias) => alias.status === 'approved' && alias.albumId && (alias.artist || alias.album))
    .map((alias) => [alias.albumId, { ...alias }]));
}

export function discogsSearchAlbumFor(album, aliases = new Map()) {
  const alias = aliases.get?.(album.id);
  if (!alias) return album;
  return {
    ...album,
    artist: alias.artist ?? album.artist,
    album: alias.album ?? album.album,
    releaseYear: alias.releaseYear ?? album.releaseYear,
    sourceAlbum: album,
    searchAlias: alias
  };
}

export function discogsCreditSearchCacheKey(album) {
  if (!album.searchAlias) return album.id;
  return `${album.id}--alias-${slugify([album.artist, album.album, album.releaseYear ?? ''].join(' '))}`;
}

export function buildDiscogsMasterOverrideMap({ overrides = [] } = {}) {
  return new Map((overrides ?? [])
    .filter((override) => override.status === 'approved' && override.albumId && override.discogsMasterId)
    .map((override) => [override.albumId, { ...override, discogsMasterId: String(override.discogsMasterId) }]));
}

export function buildDiscogsCreditGapOverrideMap({ gaps = [] } = {}) {
  return new Map((gaps ?? [])
    .filter((gap) => gap.status === 'approved' && gap.albumId)
    .map((gap) => [gap.albumId, { ...gap }]));
}

export function selectDiscogsImportAlbums({ comparison = {}, profileGaps = null, missingFields = [] } = {}) {
  const albums = comparison.albums ?? [];
  if (!profileGaps) return albums;
  const requestedFields = new Set(missingFields);
  const gapIds = new Set((profileGaps.items ?? [])
    .filter((item) => !requestedFields.size || (item.missing ?? []).some((field) => requestedFields.has(field)))
    .map((item) => item.albumId));
  return albums.filter((album) => gapIds.has(album.id));
}

export function selectDiscogsMasterForAlbum(album, results = [], overrides = new Map()) {
  const exact = exactDiscogsMasterSearchResults(album, results);
  const titleExact = exactDiscogsMasterTitleResults(album, results);
  const override = overrides.get?.(album.id);
  if (override) {
    const approved = exact.find((result) => String(result.master_id ?? result.id) === String(override.discogsMasterId));
    if (approved) return { status: 'matched', reason: 'approved-discogs-master-override', result: approved, override };
    return {
      status: 'ambiguous',
      reason: 'approved-discogs-master-override-not-in-search-results',
      results: exact.length ? exact : results
    };
  }
  if (exact.length === 1) return { status: 'matched', reason: 'unique-exact-discogs-master-search-result', result: exact[0] };
  if (exact.length > 1) return { status: 'ambiguous', reason: 'ambiguous-discogs-master-search-result', results: exact };
  if (titleExact.length === 1) {
    return { status: 'matched', reason: 'unique-exact-discogs-master-title-result-year-mismatch', result: titleExact[0] };
  }
  if (titleExact.length > 1) return { status: 'ambiguous', reason: 'ambiguous-discogs-master-title-result-year-mismatch', results: titleExact };
  return { status: 'gap', reason: 'no-exact-discogs-master-search-result' };
}

export function exactDiscogsMasterSearchResults(album, results = []) {
  return (results ?? []).filter((result) => {
    if ((result.type ?? '').toLowerCase() !== 'master') return false;
    const normalizedResultTitle = normalizeTitle(result.title);
    const normalizedAlbumTitle = normalizeTitle(album.album);
    if (normalizedResultTitle !== normalizedAlbumTitle && !normalizedResultTitle.endsWith(` ${normalizedAlbumTitle}`)) return false;
    const year = Number(result.year);
    return !album.releaseYear || !Number.isInteger(year) || Math.abs(album.releaseYear - year) <= 1;
  });
}

function exactDiscogsMasterTitleResults(album, results = []) {
  return (results ?? []).filter((result) => {
    if ((result.type ?? '').toLowerCase() !== 'master') return false;
    const normalizedResultTitle = normalizeTitle(result.title);
    const normalizedAlbumTitle = normalizeTitle(album.album);
    const normalizedArtistAlbumTitle = normalizeTitle([album.artist, album.album].filter(Boolean).join(' '));
    return normalizedResultTitle === normalizedAlbumTitle || normalizedResultTitle === normalizedArtistAlbumTitle;
  });
}

function slugify(value) {
  return normalizeTitle(value).replace(/\s+/g, '-');
}

function normalizeTitle(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/['’‘`]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();
}
