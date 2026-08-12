export function selectMusicBrainzReleaseImportAlbums({ albums = [] } = {}) {
  return (albums ?? [])
    .filter((album) => !album.profile?.tracklist?.length || album.profile?.totalDurationSeconds == null)
    .map((album) => ({
      ...album,
      musicBrainzReleaseGroupId: musicBrainzReleaseGroupRef(album)?.id ?? null,
      musicBrainzReleaseGroupUrl: musicBrainzReleaseGroupRef(album)?.url ?? null
    }))
    .filter((album) => album.musicBrainzReleaseGroupId)
    .sort(compareImportAlbums);
}

export function buildMusicBrainzReleaseCandidates({ albums = [], responsesByAlbumId = new Map() } = {}) {
  const candidates = [];
  const gaps = [];
  for (const album of albums) {
    const response = responsesByAlbumId.get(album.id);
    if (!response) {
      gaps.push(gapItem(album, 'musicbrainz-release-response-missing'));
      continue;
    }
    const release = selectUsableRelease(album, response.releases ?? []);
    if (!release) {
      gaps.push(gapItem(album, 'no-usable-musicbrainz-release-tracklist'));
      continue;
    }
    const tracklist = tracklistFromRelease(release);
    candidates.push({
      albumId: album.id,
      artist: album.artist,
      album: album.album,
      status: 'candidate',
      confidence: 'source-cache',
      tracklist,
      totalDurationSeconds: totalDurationSeconds(tracklist),
      source: {
        system: 'musicbrainz-release',
        musicBrainzReleaseGroupId: album.musicBrainzReleaseGroupId,
        musicBrainzReleaseGroupUrl: album.musicBrainzReleaseGroupUrl ?? null,
        musicBrainzReleaseId: release.id,
        url: release.id ? `https://musicbrainz.org/release/${release.id}` : null,
        releaseDate: release.date ?? null,
        country: release.country ?? null,
        status: release.status ?? null,
        mediumFormats: (release.media ?? []).map((medium) => medium.format).filter(Boolean)
      }
    });
  }
  return {
    generatedAt: null,
    status: 'generated-musicbrainz-release-candidates',
    source: { system: 'musicbrainz-release' },
    summary: {
      selectedAlbumCount: albums.length,
      candidateCount: candidates.length,
      gapCount: gaps.length
    },
    candidates,
    gaps
  };
}

function selectUsableRelease(album, releases) {
  return (releases ?? [])
    .filter((release) => isOfficialRelease(release))
    .filter((release) => tracklistFromRelease(release).length > 0)
    .sort((left, right) => compareRelease(album, left, right))[0] ?? null;
}

function isOfficialRelease(release) {
  return String(release.status ?? '').toLowerCase() === 'official';
}

function tracklistFromRelease(release) {
  const tracks = [];
  let sequence = 1;
  for (const medium of release.media ?? []) {
    for (const track of medium.tracks ?? []) {
      const title = track.title ?? track.recording?.title ?? null;
      if (!title) continue;
      tracks.push({
        position: track.number ?? String(sequence),
        disc: medium.position ?? null,
        side: sideFromPosition(track.number),
        sequence,
        title,
        durationSeconds: millisecondsToSeconds(track.length ?? track.recording?.length),
        recordingId: track.recording?.id ?? null,
        composerCredits: [],
        songwriterCredits: [],
        lyricistCredits: [],
        performerCredits: []
      });
      sequence += 1;
    }
  }
  return tracks;
}

function compareRelease(album, left, right) {
  const leftYearDistance = yearDistance(album.releaseYear, left.date);
  const rightYearDistance = yearDistance(album.releaseYear, right.date);
  if (leftYearDistance !== rightYearDistance) return leftYearDistance - rightYearDistance;

  const leftDate = left.date ?? '';
  const rightDate = right.date ?? '';
  if (leftDate !== rightDate) return leftDate.localeCompare(rightDate);

  const leftCountryScore = preferredCountryScore(left.country);
  const rightCountryScore = preferredCountryScore(right.country);
  if (leftCountryScore !== rightCountryScore) return leftCountryScore - rightCountryScore;

  return String(left.id ?? '').localeCompare(String(right.id ?? ''));
}

function yearDistance(releaseYear, date) {
  const year = yearFromDate(date);
  if (!releaseYear || !year) return Number.POSITIVE_INFINITY;
  return Math.abs(releaseYear - year);
}

function preferredCountryScore(country) {
  const normalized = String(country ?? '').toUpperCase();
  if (normalized === 'GB' || normalized === 'US') return 0;
  if (normalized) return 1;
  return 2;
}

function totalDurationSeconds(tracklist) {
  if (!tracklist.length || tracklist.some((track) => track.durationSeconds == null)) return null;
  return tracklist.reduce((sum, track) => sum + track.durationSeconds, 0);
}

function millisecondsToSeconds(value) {
  if (!Number.isFinite(Number(value))) return null;
  return Math.round(Number(value) / 1000);
}

function sideFromPosition(position) {
  const match = String(position ?? '').match(/^([A-Z])\d+/i);
  return match ? match[1].toUpperCase() : null;
}

function musicBrainzReleaseGroupRef(album) {
  return (album.externalRefs ?? []).find((ref) => ref.system === 'musicbrainz-release-group' && ref.id);
}

function compareImportAlbums(left, right) {
  const leftRank = left.latestRank ?? Number.POSITIVE_INFINITY;
  const rightRank = right.latestRank ?? Number.POSITIVE_INFINITY;
  if (leftRank !== rightRank) return leftRank - rightRank;
  return `${left.artist ?? ''} ${left.album ?? ''}`.localeCompare(`${right.artist ?? ''} ${right.album ?? ''}`);
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

function yearFromDate(value) {
  const match = /^(\d{4})/.exec(String(value ?? ''));
  return match ? Number(match[1]) : null;
}
