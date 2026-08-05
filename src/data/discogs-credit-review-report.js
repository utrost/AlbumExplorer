export function buildDiscogsCreditReviewReport({ comparison = {}, creditCandidates = {}, sourcePayloadsByCachePath = new Map() } = {}) {
  const albumsById = new Map((comparison.albums ?? []).map((album) => [album.id, album]));
  const candidates = creditCandidates.candidates ?? [];
  const review = creditCandidates.review ?? [];
  const gaps = creditCandidates.gaps ?? [];
  const items = [
    ...review.map((item) => unresolvedItem({ kind: 'review', item, album: albumsById.get(item.albumId), sourcePayloadsByCachePath })),
    ...gaps.map((item) => unresolvedItem({ kind: 'gap', item, album: albumsById.get(item.albumId), sourcePayloadsByCachePath }))
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

function unresolvedItem({ kind, item, album, sourcePayloadsByCachePath }) {
  const sourceDiagnostics = buildSourceDiagnostics(item.source, sourcePayloadsByCachePath);
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
    sourceCandidates: item.sourceCandidates ?? [],
    ...(item.source ? { source: item.source } : {}),
    ...(sourceDiagnostics ? { sourceDiagnostics } : {})
  };
}

function buildSourceDiagnostics(source, sourcePayloadsByCachePath = new Map()) {
  if (!source) return null;
  const payload = source.cachePath ? sourcePayloadsByCachePath.get(source.cachePath) : null;
  const payloadKind = payload?.master_id ? 'release' : payload?.main_release || String(source.cachePath ?? '').includes('/masters/') ? 'master' : 'unknown';
  const releaseId = payloadKind === 'release' ? String(payload?.id ?? source.id ?? '') : payload?.main_release ? String(payload.main_release) : null;
  const masterId = payload?.master_id ? String(payload.master_id) : payloadKind === 'master' && payload?.id ? String(payload.id) : null;
  const topLevelCreditCount = countPeople(payload?.credits) + countPeople(payload?.extraartists);
  const companyCount = Array.isArray(payload?.companies) ? payload.companies.length : 0;
  const usableCompanyCount = (payload?.companies ?? []).filter(isUsableStudioCompany).length;
  const trackCount = Array.isArray(payload?.tracklist) ? payload.tracklist.length : 0;
  const trackExtraArtistCount = (payload?.tracklist ?? []).reduce((count, track) => count + countPeople(track.extraartists), 0);

  return {
    sourceSystem: source.system ?? null,
    sourceId: String(source.id ?? ''),
    sourceTitle: source.title ?? null,
    sourceUrl: source.url ?? null,
    cachePath: source.cachePath ?? null,
    cacheAvailable: Boolean(payload),
    masterId,
    releaseId,
    payloadKind,
    topLevelCreditCount,
    companyCount,
    usableCompanyCount,
    trackCount,
    trackExtraArtistCount,
    suggestedAction: suggestedDiagnosticAction({ payload, topLevelCreditCount, usableCompanyCount, trackExtraArtistCount })
  };
}

function countPeople(value) {
  return Array.isArray(value) ? value.length : 0;
}

function isUsableStudioCompany(company) {
  return /recorded at|mixed at|mastered at|studio/i.test(`${company?.entity_type_name ?? ''} ${company?.name ?? ''}`);
}

function suggestedDiagnosticAction({ payload, topLevelCreditCount, usableCompanyCount, trackExtraArtistCount }) {
  if (!payload) return 'fetch-or-check-cache-path';
  if (topLevelCreditCount > 0 || usableCompanyCount > 0) return 'extend-role-mapping-or-studio-parser';
  if (trackExtraArtistCount > 0) return 'import-track-level-credits-or-choose-alternate-source';
  return 'choose-alternate-source-or-mark-gap';
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
