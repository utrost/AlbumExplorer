export function selectWikidataStoryImportAlbums({ albums = [] } = {}) {
  return (albums ?? [])
    .filter((album) => !hasUsefulStory(album.profile?.story))
    .map((album) => ({
      ...album,
      musicBrainzReleaseGroupId: musicBrainzReleaseGroupRef(album)?.id ?? null,
      musicBrainzReleaseGroupUrl: musicBrainzReleaseGroupRef(album)?.url ?? null
    }))
    .filter((album) => album.musicBrainzReleaseGroupId)
    .sort(compareImportAlbums);
}

export function buildWikidataStoryCandidates({ albums = [], responsesByAlbumId = new Map() } = {}) {
  const candidates = [];
  const gaps = [];
  for (const album of albums) {
    const response = responsesByAlbumId.get(album.id);
    if (!response?.wikidata) {
      gaps.push(gapItem(album, 'wikidata-response-missing'));
      continue;
    }
    const profile = profileFromResponse(response);
    if (!profile.story) {
      gaps.push(gapItem(album, 'weak-or-disambiguation-summary'));
      continue;
    }
    candidates.push({
      albumId: album.id,
      artist: album.artist,
      album: album.album,
      status: 'candidate',
      confidence: 'source-cache',
      profile,
      source: {
        system: 'wikidata-wikipedia',
        musicBrainzReleaseGroupId: album.musicBrainzReleaseGroupId ?? null,
        musicBrainzReleaseGroupUrl: album.musicBrainzReleaseGroupUrl ?? null,
        wikidataEntityId: response.wikidata.entityId,
        wikidataUrl: response.wikidata.entityId ? `https://www.wikidata.org/wiki/${response.wikidata.entityId}` : null,
        wikipediaTitle: response.wikidata.wikipediaTitle ?? null,
        wikipediaUrl: response.wikidata.wikipediaUrl ?? null
      }
    });
  }
  return summarizeLayer({
    generatedAt: null,
    status: 'generated-wikidata-story-candidates',
    source: { system: 'wikidata-wikipedia' },
    candidates,
    gaps
  }, albums.length);
}

export function mergeWikidataStoryCandidateLayers(previous = {}, next = {}) {
  const candidatesByAlbumId = new Map();
  const gapsByAlbumId = new Map();
  for (const candidate of previous.candidates ?? []) {
    if (candidate.albumId) candidatesByAlbumId.set(candidate.albumId, candidate);
  }
  for (const gap of previous.gaps ?? []) {
    if (gap.albumId && !candidatesByAlbumId.has(gap.albumId)) gapsByAlbumId.set(gap.albumId, gap);
  }
  for (const candidate of next.candidates ?? []) {
    if (!candidate.albumId) continue;
    candidatesByAlbumId.set(candidate.albumId, candidate);
    gapsByAlbumId.delete(candidate.albumId);
  }
  for (const gap of next.gaps ?? []) {
    if (!gap.albumId || candidatesByAlbumId.has(gap.albumId)) continue;
    gapsByAlbumId.set(gap.albumId, gap);
  }
  return summarizeLayer({
    ...previous,
    ...next,
    candidates: [...candidatesByAlbumId.values()],
    gaps: [...gapsByAlbumId.values()]
  });
}

function summarizeLayer(layer, selectedAlbumCount = layer.summary?.selectedAlbumCount ?? layer.candidates?.length ?? 0) {
  return {
    ...layer,
    summary: {
      ...(layer.summary ?? {}),
      selectedAlbumCount,
      candidateCount: layer.candidates?.length ?? 0,
      gapCount: layer.gaps?.length ?? 0
    }
  };
}

function profileFromResponse(response) {
  const description = cleanDescription(response.wikidata?.description);
  const story = storyFromExtract(response.wikipediaSummary?.extract);
  return { description, story };
}

function cleanDescription(description) {
  const text = String(description ?? '').replace(/\s+/g, ' ').trim();
  if (!text || isDisambiguationText(text)) return null;
  return text;
}

function storyFromExtract(extract) {
  const text = String(extract ?? '').replace(/\s+/g, ' ').trim();
  if (!text || isDisambiguationText(text)) return null;
  const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)/g) ?? [];
  const story = (sentences.length ? sentences.slice(0, 2).join('') : text).replace(/\s+/g, ' ').trim();
  if (story.length < 80 || isDisambiguationText(story)) return null;
  return story;
}

function isDisambiguationText(text) {
  return /\bmay refer to\b|\bcan refer to\b|\bdisambiguation\b/i.test(text);
}

function hasUsefulStory(story) {
  const text = String(story ?? '').trim();
  if (!text) return false;
  return !/^story\/context pending\.?$/i.test(text);
}

function musicBrainzReleaseGroupRef(album) {
  return (album.externalRefs ?? []).find((ref) => ref.system === 'musicbrainz-release-group' && ref.id);
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
