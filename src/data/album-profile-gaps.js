export function buildAlbumProfileGaps({ atlas = {} } = {}) {
  const albums = atlas.albums ?? [];
  const items = albums
    .map(gapItemForAlbum)
    .filter((item) => item.missing.length > 0)
    .sort(compareGapItems);

  return {
    generatedAt: null,
    status: 'generated-album-profile-gaps',
    source: {
      atlasPath: 'data/app/album-atlas.json'
    },
    summary: {
      albumCount: albums.length,
      missingCounts: {
        coverArt: countMissing(items, 'coverArt'),
        tracklist: countMissing(items, 'tracklist'),
        totalDuration: countMissing(items, 'totalDuration'),
        composerCredits: countMissing(items, 'composerCredits'),
        story: countMissing(items, 'story')
      },
      albumsWithAnyGap: items.length
    },
    groups: {
      coverArt: groupFor(items, 'coverArt'),
      tracklist: groupFor(items, 'tracklist'),
      totalDuration: groupFor(items, 'totalDuration'),
      composerCredits: groupFor(items, 'composerCredits'),
      story: groupFor(items, 'story')
    },
    items
  };
}

function gapItemForAlbum(album) {
  const profile = album.profile ?? {};
  const tracklist = profile.tracklist ?? [];
  const missing = [];
  if (!profile.coverArt?.url) missing.push('coverArt');
  if (!tracklist.length) missing.push('tracklist');
  if (profile.totalDurationSeconds == null) missing.push('totalDuration');
  if (!hasComposerCredits(tracklist)) missing.push('composerCredits');
  if (!hasUsefulStory(profile.story)) missing.push('story');
  return {
    albumId: album.id,
    artist: album.artist ?? null,
    album: album.album ?? null,
    releaseYear: album.releaseYear ?? null,
    latestRank: album.latestRank ?? null,
    latestEditionYear: album.latestEditionYear ?? null,
    ranks: album.ranks ?? {},
    missing,
    existing: {
      hasCoverArt: Boolean(profile.coverArt?.url),
      trackCount: tracklist.length,
      hasTotalDuration: profile.totalDurationSeconds != null,
      hasComposerCredits: hasComposerCredits(tracklist),
      hasStory: hasUsefulStory(profile.story)
    },
    recommendedAction: recommendedAction({ missing, tracklist })
  };
}

function hasComposerCredits(tracklist) {
  return tracklist.some((track) =>
    (track.composerCredits ?? []).length > 0 ||
    (track.songwriterCredits ?? []).length > 0 ||
    (track.lyricistCredits ?? []).length > 0
  );
}

function hasUsefulStory(story) {
  const text = String(story ?? '').trim();
  if (!text) return false;
  return !/^story\/context pending\.?$/i.test(text);
}

function recommendedAction({ missing, tracklist }) {
  if (missing.includes('tracklist')) return 'fetch-album-content-sources';
  if (missing.includes('totalDuration') || missing.includes('composerCredits') || missing.includes('story')) return 'enrich-existing-tracklist-and-story';
  if (missing.includes('coverArt')) return 'fetch-cover-art-source';
  return 'inspect-profile-gap';
}

function countMissing(items, field) {
  return items.filter((item) => item.missing.includes(field)).length;
}

function groupFor(items, field) {
  const groupItems = items.filter((item) => item.missing.includes(field));
  return {
    field,
    count: groupItems.length,
    items: groupItems
  };
}

function compareGapItems(a, b) {
  const rankA = a.latestRank ?? Number.POSITIVE_INFINITY;
  const rankB = b.latestRank ?? Number.POSITIVE_INFINITY;
  if (rankA !== rankB) return rankA - rankB;
  return `${a.artist ?? ''} ${a.album ?? ''}`.localeCompare(`${b.artist ?? ''} ${b.album ?? ''}`);
}
