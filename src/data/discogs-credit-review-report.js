export function buildDiscogsCreditReviewReport({ comparison = {}, creditCandidates = {} } = {}) {
  const albumsById = new Map((comparison.albums ?? []).map((album) => [album.id, album]));
  const candidates = creditCandidates.candidates ?? [];
  const review = creditCandidates.review ?? [];
  const gaps = creditCandidates.gaps ?? [];
  const items = [
    ...review.map((item) => unresolvedItem({ kind: 'review', item, album: albumsById.get(item.albumId) })),
    ...gaps.map((item) => unresolvedItem({ kind: 'gap', item, album: albumsById.get(item.albumId) }))
  ].sort(compareReviewItems);

  return {
    generatedAt: null,
    source: {
      comparisonPath: creditCandidates.scope?.comparisonPath ?? null,
      candidatePath: 'data/enrichment/album-credit-candidates.json'
    },
    summary: {
      comparisonAlbums: (comparison.albums ?? []).length,
      candidates: candidates.length,
      review: review.length,
      gaps: gaps.length,
      unresolved: review.length + gaps.length,
      reviewReasons: countBy(review, 'reason'),
      gapReasons: countBy(gaps, 'reason')
    },
    groups: groupItemsByReason(items),
    items
  };
}

function unresolvedItem({ kind, item, album }) {
  return {
    kind,
    albumId: item.albumId,
    artist: item.artist ?? album?.artist ?? null,
    album: item.album ?? album?.album ?? null,
    releaseYear: item.releaseYear ?? album?.releaseYear ?? null,
    latestRank: latestRankFor(album),
    ranks: album?.ranks ?? {},
    reason: item.reason,
    recommendedAction: recommendedAction(item.reason, kind),
    sourceCandidates: item.sourceCandidates ?? []
  };
}

function latestRankFor(album) {
  const rankEntries = Object.entries(album?.ranks ?? {})
    .map(([editionYear, rank]) => [Number(editionYear), rank])
    .filter(([editionYear, rank]) => Number.isFinite(editionYear) && Number.isFinite(Number(rank)))
    .sort(([a], [b]) => b - a);
  return rankEntries.length ? Number(rankEntries[0][1]) : null;
}

function recommendedAction(reason, kind) {
  if (reason === 'ambiguous-discogs-master-search-result') return 'approve-master-override';
  if (reason === 'no-exact-discogs-master-search-result') return 'add-search-alias';
  if (reason === 'discogs-master-fetch-failed') return 'approve-alternate-master-or-reject-stale';
  if (reason === 'source-cache-without-usable-credits') return 'inspect-release-or-mark-gap';
  return kind === 'gap' ? 'add-search-alias' : 'inspect-review-item';
}

function countBy(items, key) {
  return Object.fromEntries([...items.reduce((map, item) => {
    const value = item[key] ?? 'unknown';
    map.set(value, (map.get(value) ?? 0) + 1);
    return map;
  }, new Map()).entries()].sort(([a], [b]) => a.localeCompare(b)));
}

function groupItemsByReason(items) {
  return items.reduce((groups, item) => {
    const key = `${item.kind}:${item.reason}`;
    let group = groups.find((entry) => entry.key === key);
    if (!group) {
      group = { key, kind: item.kind, reason: item.reason, count: 0, items: [] };
      groups.push(group);
    }
    group.count += 1;
    group.items.push(item);
    return groups;
  }, []);
}

function compareReviewItems(a, b) {
  const rankA = a.latestRank ?? Number.POSITIVE_INFINITY;
  const rankB = b.latestRank ?? Number.POSITIVE_INFINITY;
  if (rankA !== rankB) return rankA - rankB;
  return `${a.artist ?? ''} ${a.album ?? ''}`.localeCompare(`${b.artist ?? ''} ${b.album ?? ''}`);
}
