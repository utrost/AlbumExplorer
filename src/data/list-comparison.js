export function buildListComparison(rows, { fromYear = 2020, toYear = 2024 } = {}) {
  const fromKey = String(fromYear);
  const toKey = String(toYear);
  const items = (rows ?? [])
    .map((row) => comparisonItem(row, fromKey, toKey))
    .filter((item) => item.fromRank != null || item.toRank != null);
  const groups = {
    added: items.filter((item) => item.status === 'added'),
    removed: items.filter((item) => item.status === 'removed'),
    persistent: items.filter((item) => item.status !== 'added' && item.status !== 'removed'),
    rising: items.filter((item) => item.status === 'rising'),
    falling: items.filter((item) => item.status === 'falling'),
    unchanged: items.filter((item) => item.status === 'unchanged')
  };

  return {
    editions: { fromYear, toYear },
    counts: {
      fromEdition: items.filter((item) => item.fromRank != null).length,
      toEdition: items.filter((item) => item.toRank != null).length,
      persistent: groups.persistent.length,
      added: groups.added.length,
      removed: groups.removed.length,
      rising: groups.rising.length,
      falling: groups.falling.length,
      unchanged: groups.unchanged.length
    },
    groups,
    rows: sortComparisonItems(items)
  };
}

function comparisonItem(row, fromKey, toKey) {
  const fromRank = rankFor(row, fromKey);
  const toRank = rankFor(row, toKey);
  const movement = fromRank != null && toRank != null ? fromRank - toRank : null;
  return {
    id: row.id,
    artist: row.artist,
    album: row.album,
    releaseYear: row.releaseYear ?? null,
    fromRank,
    toRank,
    movement,
    status: statusFor(fromRank, toRank, movement)
  };
}

function rankFor(row, yearKey) {
  const rank = row?.ranks?.[yearKey];
  return Number.isFinite(rank) ? rank : null;
}

function statusFor(fromRank, toRank, movement) {
  if (fromRank == null && toRank != null) return 'added';
  if (fromRank != null && toRank == null) return 'removed';
  if (movement > 0) return 'rising';
  if (movement < 0) return 'falling';
  return 'unchanged';
}

function sortComparisonItems(items) {
  return [...items].sort((left, right) => compareNullable(left.toRank, right.toRank) || compareNullable(left.fromRank, right.fromRank) || left.artist.localeCompare(right.artist, 'en', { sensitivity: 'base' }) || left.album.localeCompare(right.album, 'en', { sensitivity: 'base' }));
}

function compareNullable(left, right) {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  return left - right;
}
