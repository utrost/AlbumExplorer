export function buildDiscogsMasterOverrideMap({ overrides = [] } = {}) {
  return new Map((overrides ?? [])
    .filter((override) => override.status === 'approved' && override.albumId && override.discogsMasterId)
    .map((override) => [override.albumId, { ...override, discogsMasterId: String(override.discogsMasterId) }]));
}

export function selectDiscogsMasterForAlbum(album, results = [], overrides = new Map()) {
  const exact = exactDiscogsMasterSearchResults(album, results);
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
