export function selectCoverArtArchiveImportAlbums({ albums = [] } = {}) {
  return (albums ?? [])
    .filter((album) => !album.profile?.coverArt?.url)
    .map((album) => ({
      ...album,
      musicBrainzReleaseGroupId: musicBrainzReleaseGroupRef(album)?.id ?? null,
      musicBrainzReleaseGroupUrl: musicBrainzReleaseGroupRef(album)?.url ?? null
    }))
    .filter((album) => album.musicBrainzReleaseGroupId)
    .sort(compareImportAlbums);
}

export function buildCoverArtArchiveCandidates({ albums = [], responsesByAlbumId = new Map() } = {}) {
  const candidates = [];
  const gaps = [];
  for (const album of albums) {
    const response = responsesByAlbumId.get(album.id);
    if (!response) {
      gaps.push(gapItem(album, 'cover-art-archive-response-missing'));
      continue;
    }
    const image = selectFrontImage(response.images ?? []);
    if (!image?.image) {
      gaps.push(gapItem(album, 'no-front-cover-image'));
      continue;
    }
    candidates.push({
      albumId: album.id,
      artist: album.artist,
      album: album.album,
      status: 'candidate',
      confidence: 'source-cache',
      coverArt: {
        url: image.image,
        thumbnailUrl: image.thumbnails?.small ?? image.thumbnails?.large ?? image.image,
        width: image.width ?? null,
        height: image.height ?? null
      },
      source: {
        system: 'cover-art-archive',
        musicBrainzReleaseGroupId: album.musicBrainzReleaseGroupId,
        musicBrainzReleaseGroupUrl: album.musicBrainzReleaseGroupUrl ?? null,
        release: response.release ?? null
      }
    });
  }
  return {
    generatedAt: null,
    status: 'generated-cover-art-archive-candidates',
    source: { system: 'cover-art-archive' },
    summary: {
      selectedAlbumCount: albums.length,
      candidateCount: candidates.length,
      gapCount: gaps.length
    },
    candidates,
    gaps
  };
}

function musicBrainzReleaseGroupRef(album) {
  return (album.externalRefs ?? []).find((ref) => ref.system === 'musicbrainz-release-group' && ref.id);
}

function selectFrontImage(images) {
  return (images ?? []).find((image) => image.front === true && image.image) ?? null;
}

function gapItem(album, reason) {
  return {
    albumId: album.id,
    artist: album.artist,
    album: album.album,
    reason,
    musicBrainzReleaseGroupId: album.musicBrainzReleaseGroupId ?? null
  };
}

function compareImportAlbums(left, right) {
  const leftRank = left.latestRank ?? Number.POSITIVE_INFINITY;
  const rightRank = right.latestRank ?? Number.POSITIVE_INFINITY;
  if (leftRank !== rightRank) return leftRank - rightRank;
  return `${left.artist ?? ''} ${left.album ?? ''}`.localeCompare(`${right.artist ?? ''} ${right.album ?? ''}`);
}
