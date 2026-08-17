export function selectMusicBrainzWorkCreditImportAlbums({ albums = [] } = {}) {
  return (albums ?? [])
    .filter((album) => tracklistNeedsCredits(album.profile?.tracklist ?? []))
    .map((album) => ({
      ...album,
      musicBrainzRecordingIds: unique((album.profile?.tracklist ?? []).map((track) => track.recordingId).filter(Boolean))
    }))
    .filter((album) => album.musicBrainzRecordingIds.length > 0)
    .sort(compareImportAlbums);
}

export function buildMusicBrainzWorkCreditCandidates({ albums = [], recordingResponsesById = new Map(), workResponsesById = new Map() } = {}) {
  const candidates = [];
  const gaps = [];
  for (const album of albums) {
    const tracks = [];
    const missingRecordings = [];
    for (const track of album.profile?.tracklist ?? []) {
      if (trackHasCredits(track) || !track.recordingId) continue;
      const recording = recordingResponsesById.get(track.recordingId);
      if (!recording) {
        missingRecordings.push(track.recordingId);
        continue;
      }
      const workIds = workIdsFromRecording(recording);
      const credits = creditsFromWorks(workIds, workResponsesById);
      if (!hasAnyCredits(credits)) continue;
      tracks.push({
        sequence: track.sequence ?? null,
        position: track.position ?? null,
        recordingId: track.recordingId,
        title: track.title,
        workIds,
        ...credits
      });
    }
    if (tracks.length) {
      candidates.push({
        albumId: album.id,
        artist: album.artist,
        album: album.album,
        status: 'candidate',
        confidence: 'source-cache',
        tracks,
        source: {
          system: 'musicbrainz-work-credit',
          url: album.externalRefs?.find((ref) => ref.system === 'musicbrainz-release-group')?.url ?? null
        }
      });
    } else if (missingRecordings.length) {
      gaps.push({
        albumId: album.id,
        artist: album.artist,
        album: album.album,
        reason: 'musicbrainz-recording-response-missing',
        recordingIds: missingRecordings
      });
    }
  }
  return {
    generatedAt: null,
    status: 'generated-musicbrainz-work-credit-candidates',
    source: { system: 'musicbrainz-work-credit' },
    summary: {
      selectedAlbumCount: albums.length,
      candidateCount: candidates.length,
      gapCount: gaps.length,
      creditedTrackCount: candidates.reduce((sum, candidate) => sum + candidate.tracks.length, 0)
    },
    candidates,
    gaps
  };
}

export function mergeMusicBrainzWorkCreditCandidateLayers(previousLayer = null, rerunLayer = null) {
  if (!previousLayer) return rerunLayer;
  if (!rerunLayer) return previousLayer;
  const candidatesByAlbumId = new Map();
  for (const candidate of previousLayer.candidates ?? []) {
    candidatesByAlbumId.set(candidate.albumId, { ...candidate, tracks: [...(candidate.tracks ?? [])] });
  }
  for (const candidate of rerunLayer.candidates ?? []) {
    const existing = candidatesByAlbumId.get(candidate.albumId);
    if (!existing) {
      candidatesByAlbumId.set(candidate.albumId, candidate);
      continue;
    }
    const tracksByKey = new Map((existing.tracks ?? []).map((track) => [trackKey(track), track]));
    for (const track of candidate.tracks ?? []) tracksByKey.set(trackKey(track), track);
    candidatesByAlbumId.set(candidate.albumId, {
      ...existing,
      ...candidate,
      tracks: [...tracksByKey.values()].sort(compareTrackCredits)
    });
  }
  return {
    ...previousLayer,
    ...rerunLayer,
    summary: {
      ...(previousLayer.summary ?? {}),
      ...(rerunLayer.summary ?? {}),
      candidateCount: candidatesByAlbumId.size,
      creditedTrackCount: [...candidatesByAlbumId.values()].reduce((sum, candidate) => sum + (candidate.tracks?.length ?? 0), 0)
    },
    candidates: [...candidatesByAlbumId.values()],
    gaps: rerunLayer.gaps ?? []
  };
}

function tracklistNeedsCredits(tracklist) {
  return tracklist.some((track) => !trackHasCredits(track) && track.recordingId);
}

function trackHasCredits(track) {
  return (track.composerCredits ?? []).length > 0 ||
    (track.songwriterCredits ?? []).length > 0 ||
    (track.lyricistCredits ?? []).length > 0;
}

function workIdsFromRecording(recording) {
  return unique((recording.relations ?? [])
    .filter((relation) => relation['target-type'] === 'work' && relation.work?.id)
    .map((relation) => relation.work.id));
}

function creditsFromWorks(workIds, workResponsesById) {
  const result = {
    composerCredits: [],
    songwriterCredits: [],
    lyricistCredits: []
  };
  for (const workId of workIds) {
    const work = workResponsesById.get(workId);
    for (const relation of work?.relations ?? []) {
      const type = String(relation.type ?? '').toLowerCase();
      const artist = relation.artist;
      if (!artist?.name) continue;
      const credit = {
        name: artist.name,
        creditedAs: relation['target-credit'] || artist.name,
        role: relation.type ?? null,
        musicBrainzArtistId: artist.id ?? null
      };
      if (type === 'composer') pushUniqueCredit(result.composerCredits, credit);
      else if (type === 'writer' || type === 'songwriter') pushUniqueCredit(result.songwriterCredits, credit);
      else if (type === 'lyricist') pushUniqueCredit(result.lyricistCredits, credit);
    }
  }
  return result;
}

function hasAnyCredits(credits) {
  return credits.composerCredits.length > 0 || credits.songwriterCredits.length > 0 || credits.lyricistCredits.length > 0;
}

function pushUniqueCredit(list, credit) {
  if (!list.some((item) => item.name === credit.name && item.role === credit.role)) list.push(credit);
}

function trackKey(track) {
  return track.recordingId ?? `${track.sequence ?? ''}:${normalizeTitle(track.title)}`;
}

function compareTrackCredits(left, right) {
  const leftSequence = left.sequence ?? Number.POSITIVE_INFINITY;
  const rightSequence = right.sequence ?? Number.POSITIVE_INFINITY;
  if (leftSequence !== rightSequence) return leftSequence - rightSequence;
  return String(left.title ?? '').localeCompare(String(right.title ?? ''));
}

function normalizeTitle(value) {
  return String(value ?? '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

function unique(values) {
  return [...new Set(values)];
}

function compareImportAlbums(left, right) {
  const leftRank = left.latestRank ?? Number.POSITIVE_INFINITY;
  const rightRank = right.latestRank ?? Number.POSITIVE_INFINITY;
  if (leftRank !== rightRank) return leftRank - rightRank;
  return `${left.artist ?? ''} ${left.album ?? ''}`.localeCompare(`${right.artist ?? ''} ${right.album ?? ''}`);
}
