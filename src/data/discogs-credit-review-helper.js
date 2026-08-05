export function buildDiscogsReviewQueue(report = {}, options = {}) {
  const items = Array.isArray(report.items) ? report.items : [];
  const selectedAlbumId = options.selectedAlbumId ?? items[0]?.albumId ?? null;
  const currentIndex = Math.max(0, items.findIndex((item) => item.albumId === selectedAlbumId));
  const current = items[currentIndex] ?? null;
  const total = Number(report.summary?.unresolved ?? items.length);
  const reviewCount = Number(report.summary?.review ?? items.filter((item) => item.kind === 'review').length);
  const gapCount = Number(report.summary?.gaps ?? items.filter((item) => item.kind === 'gap').length);

  return {
    items,
    current,
    currentIndex,
    total,
    reviewCount,
    gapCount,
    progressLabel: current ? `${currentIndex + 1} of ${total} unresolved` : 'No unresolved Discogs credit review items'
  };
}

export function filterDiscogsReviewQueue(items = [], filters = {}) {
  const kind = filters.kind ?? 'all';
  const reason = filters.reason ?? 'all';
  const searchTerms = normalizeSearch(filters.search).split(' ').filter(Boolean);

  return items.filter((item) => {
    if (kind !== 'all' && item.kind !== kind) return false;
    if (reason !== 'all' && item.reason !== reason) return false;
    if (searchTerms.length === 0) return true;
    const haystack = normalizeSearch([
      item.artist,
      item.album,
      item.releaseYear,
      item.albumId,
      item.reason,
      item.recommendedAction,
      ...(item.sourceCandidates ?? []).flatMap((candidate) => [candidate.id, candidate.title, candidate.year])
    ].filter((value) => value != null).join(' '));
    return searchTerms.every((term) => haystack.includes(term));
  });
}

export function nextDiscogsReviewItem(items = [], currentAlbumId) {
  if (items.length === 0) return null;
  const index = items.findIndex((item) => item.albumId === currentAlbumId);
  const nextIndex = index < 0 ? 0 : (index + 1) % items.length;
  return items[nextIndex] ?? null;
}

export function discogsMasterOverrideSnippet(item, candidate) {
  return JSON.stringify({
    albumId: item.albumId,
    status: 'approved',
    discogsMasterId: String(candidate?.id ?? ''),
    reason: `Selected Discogs master ${candidate?.id ?? '[master-id]'} for ${formatAlbumName(item)}.`
  }, null, 2);
}

export function discogsSearchAliasSnippet(item, alias = {}) {
  return JSON.stringify({
    albumId: item.albumId,
    status: 'approved',
    artist: alias.artist ?? item.artist ?? '',
    album: alias.album ?? item.album ?? '',
    ...(alias.releaseYear ?? item.releaseYear ? { releaseYear: Number(alias.releaseYear ?? item.releaseYear) } : {}),
    reason: `Alias Discogs credit search to reviewed artist/title for ${formatAlbumName(item)}.`
  }, null, 2);
}

function formatAlbumName(item) {
  const year = item.releaseYear == null ? 'unknown year' : item.releaseYear;
  return `${item.artist ?? 'Unknown artist'} — ${item.album ?? 'Unknown album'} (${year})`;
}

function normalizeSearch(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
