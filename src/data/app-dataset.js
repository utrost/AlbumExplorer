import { buildEnrichedComparisonRows } from './enriched-comparison.js';
import { buildAlbumRelationships } from './derived-relationships.js';

export const APP_DATASET_RELATIONSHIP_TYPES = [
  'shared-label',
  'shared-producer',
  'shared-engineer',
  'shared-studio',
  'shared-songwriter',
  'shared-musician'
];

export function buildAppDataset({ comparison, metadataCandidates, sourceCandidates, creditCandidates, additionalCreditCandidateLayers = [], sourcePayloadsByCachePath = new Map() }, options = {}) {
  const rows = buildEnrichedComparisonRows({
    comparison,
    candidates: metadataCandidates,
    sourceCandidates
  });
  const mergedCreditCandidates = mergeCreditCandidateLayers(creditCandidates, additionalCreditCandidateLayers);
  const creditCandidateRows = mergedCreditCandidates.candidates ?? [];
  const creditCandidateByAlbumId = new Map(creditCandidateRows.map((candidate) => [candidate.albumId, candidate]));
  const creditGapIds = new Set((mergedCreditCandidates.gaps ?? []).map((gap) => gap.albumId));
  const documentedCreditGapIds = new Set((mergedCreditCandidates.documentedGaps ?? []).map((gap) => gap.albumId));
  const relationships = buildAlbumRelationships(rows, {
    minimumWeight: options.minimumRelationshipWeight ?? 2.0,
    allowedTypes: options.relationshipTypes ?? APP_DATASET_RELATIONSHIP_TYPES,
    creditCandidates: creditCandidateRows
  });
  const albums = rows.map((row) => enrichAppAlbum(row, {
    creditCandidate: creditCandidateByAlbumId.get(row.id),
    sourcePayload: sourcePayloadFor(creditCandidateByAlbumId.get(row.id), sourcePayloadsByCachePath),
    hasCreditGap: creditGapIds.has(row.id),
    hasDocumentedCreditGap: documentedCreditGapIds.has(row.id)
  }));
  const dataQuality = buildDataQuality(albums, relationships, {
    sourceCandidates,
    creditCandidates: mergedCreditCandidates
  });

  return {
    schemaVersion: '0.1.0',
    status: 'app-exploration-dataset',
    generatedAt: null,
    sourcePaths: {
      comparison: 'data/rolling-stone-comparison.json',
      metadataCandidates: 'data/enrichment/album-metadata-candidates.json',
      musicBrainzSourceCandidates: 'data/enrichment/album-metadata-source-candidates.json',
      creditCandidates: 'data/enrichment/album-credit-candidates.json',
      additionalCreditCandidateLayers: additionalCreditCandidateLayers.length
    },
    summary: {
      albumCount: albums.length,
      relationshipCount: relationships.length,
      musicBrainzMatched: albums.filter((album) => album.dataQuality.metadata.status === 'source-confirmed').length,
      rollingStoneBaseline: albums.filter((album) => album.dataQuality.metadata.status === 'baseline').length,
      creditCandidateAlbums: albums.filter((album) => album.dataQuality.credits.status === 'source-candidate').length,
      creditUnknownAlbums: albums.filter((album) => album.dataQuality.credits.status === 'unknown').length,
      creditDocumentedGaps: albums.filter((album) => album.dataQuality.credits.status === 'documented-gap').length,
      albumProfilesWithTracklists: albums.filter((album) => album.profile.tracklist.length > 0).length,
      albumProfilesWithCoverArt: albums.filter((album) => album.profile.coverArt).length,
      albumProfilesWithTotalDuration: albums.filter((album) => album.profile.totalDurationSeconds != null).length,
      albumProfilesWithComposerCredits: albums.filter((album) => album.profile.tracklist.some((track) => track.composerCredits.length || track.songwriterCredits.length || track.lyricistCredits.length)).length,
      fourEditionAlbums: albums.filter((album) => album.editionCount === 4).length
    },
    albums,
    relationships,
    dataQuality
  };
}

function mergeCreditCandidateLayers(primaryLayer = {}, additionalLayers = []) {
  const layers = [primaryLayer, ...additionalLayers].filter(Boolean);
  const candidatesByAlbumId = new Map();
  const gapByAlbumId = new Map();
  const documentedGapByAlbumId = new Map();
  for (const layer of layers) {
    for (const candidate of layer.candidates ?? []) {
      if (!candidate.albumId) continue;
      candidatesByAlbumId.set(candidate.albumId, candidate);
      gapByAlbumId.delete(candidate.albumId);
      documentedGapByAlbumId.delete(candidate.albumId);
    }
    for (const gap of layer.gaps ?? []) {
      if (!gap.albumId || candidatesByAlbumId.has(gap.albumId)) continue;
      gapByAlbumId.set(gap.albumId, gap);
    }
    for (const gap of layer.documentedGaps ?? []) {
      if (!gap.albumId || candidatesByAlbumId.has(gap.albumId)) continue;
      documentedGapByAlbumId.set(gap.albumId, gap);
    }
  }
  return {
    candidates: [...candidatesByAlbumId.values()],
    gaps: [...gapByAlbumId.values()],
    documentedGaps: [...documentedGapByAlbumId.values()]
  };
}

function enrichAppAlbum(row, { creditCandidate, sourcePayload, hasCreditGap, hasDocumentedCreditGap }) {
  const metadataQuality = metadataQualityFor(row);
  const creditQuality = creditQualityFor({ creditCandidate, hasCreditGap, hasDocumentedCreditGap });
  return {
    ...row,
    displayTitle: `${row.artist} — ${row.album}`,
    profile: albumProfileFor(row, { creditCandidate, sourcePayload }),
    dataQuality: {
      identity: {
        status: 'source-confirmed',
        confidence: 'high',
        source: 'Rolling Stone imported list appearances'
      },
      metadata: metadataQuality,
      credits: creditQuality
    }
  };
}

function sourcePayloadFor(creditCandidate, sourcePayloadsByCachePath) {
  const cachePath = creditCandidate?.source?.cachePath;
  if (!cachePath || !sourcePayloadsByCachePath?.get) return null;
  return sourcePayloadsByCachePath.get(cachePath) ?? null;
}

function albumProfileFor(row, { creditCandidate, sourcePayload }) {
  const tracklist = tracklistFromPayload(sourcePayload);
  return {
    description: `${row.artist} — ${row.album}${row.releaseYear ? ` (${row.releaseYear})` : ''}.`,
    story: cleanStory(sourcePayload?.notes),
    coverArt: coverArtFromPayload(sourcePayload),
    tracklist,
    totalDurationSeconds: totalDurationSeconds(tracklist),
    footnotes: profileFootnotes(creditCandidate, sourcePayload)
  };
}

function cleanStory(value) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return null;
  if (isTechnicalReleaseNote(text)) return null;
  return text;
}

function isTechnicalReleaseNote(text) {
  if (text.length < 180) return false;
  return /\b(cat\.?#|runouts?|matrix|labels?|sleeve|gatefold|printed|pressing|release|cover)\b/i.test(text);
}

function coverArtFromPayload(sourcePayload) {
  const image = (sourcePayload?.images ?? []).find((item) => item.type === 'primary') ?? sourcePayload?.images?.[0];
  if (!image?.uri && !image?.resource_url && !sourcePayload?.thumb) return null;
  return {
    url: image?.uri ?? image?.resource_url ?? sourcePayload.thumb,
    thumbnailUrl: image?.uri150 ?? sourcePayload.thumb ?? null,
    width: image?.width ?? null,
    height: image?.height ?? null
  };
}

function tracklistFromPayload(sourcePayload) {
  return (sourcePayload?.tracklist ?? [])
    .filter((track) => (track.type_ ?? 'track') === 'track' && track.title)
    .map((track, index) => {
      const credits = creditsByRole(track.extraartists ?? []);
      return {
        position: track.position ?? String(index + 1),
        disc: discFromPosition(track.position),
        side: sideFromPosition(track.position),
        sequence: index + 1,
        title: track.title,
        durationSeconds: parseDuration(track.duration),
        composerCredits: credits.composerCredits,
        songwriterCredits: credits.songwriterCredits,
        lyricistCredits: credits.lyricistCredits,
        performerCredits: credits.performerCredits
      };
    });
}

function creditsByRole(extraartists) {
  const result = {
    composerCredits: [],
    songwriterCredits: [],
    lyricistCredits: [],
    performerCredits: []
  };
  for (const credit of extraartists) {
    const normalized = String(credit.role ?? '').toLowerCase();
    const item = { name: credit.name, creditedAs: credit.name, role: credit.role ?? null };
    if (!item.name) continue;
    if (/written|compos/.test(normalized)) result.composerCredits.push(item);
    else if (/songwrit/.test(normalized)) result.songwriterCredits.push(item);
    else if (/lyric/.test(normalized)) result.lyricistCredits.push(item);
    else if (!/produc|engineer|recorded|mixed|mastered/.test(normalized)) result.performerCredits.push(item);
  }
  return result;
}

function discFromPosition(position) {
  const match = String(position ?? '').match(/^(\d+)[-.]/);
  return match ? Number(match[1]) : null;
}

function sideFromPosition(position) {
  const match = String(position ?? '').match(/^([A-Z])\d+/i);
  return match ? match[1].toUpperCase() : null;
}

function parseDuration(duration) {
  const text = String(duration ?? '').trim();
  if (!text) return null;
  const parts = text.split(':').map((part) => Number(part));
  if (parts.some((part) => !Number.isFinite(part))) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

function totalDurationSeconds(tracklist) {
  if (!tracklist.length || tracklist.some((track) => track.durationSeconds == null)) return null;
  return tracklist.reduce((sum, track) => sum + track.durationSeconds, 0);
}

function profileFootnotes(creditCandidate, sourcePayload) {
  const url = creditCandidate?.source?.url ?? sourcePayload?.uri ?? null;
  if (!url) return [];
  return [{ label: 'Album content source', url }];
}

function metadataQualityFor(row) {
  if (row.metadataStatus === 'musicbrainz') {
    return {
      status: 'source-confirmed',
      confidence: 'high',
      source: 'MusicBrainz release group',
      note: 'Exact artist/title/year match accepted by importer.'
    };
  }
  if (row.metadataStatus === 'baseline') {
    return {
      status: 'baseline',
      confidence: 'low',
      source: 'Rolling Stone list import',
      note: 'No strict MusicBrainz match yet; title, artist, year, and labels come from Rolling Stone source rows where available.'
    };
  }
  return {
    status: 'unknown',
    confidence: 'none',
    source: null,
    note: 'No metadata source has been attached yet.'
  };
}

function creditQualityFor({ creditCandidate, hasCreditGap, hasDocumentedCreditGap }) {
  if (creditCandidate) {
    return {
      status: 'source-candidate',
      confidence: creditCandidate.confidence ?? 'source-cache',
      source: creditCandidate.source?.system ?? 'external-source-cache',
      note: 'Usable credit/studio facts were extracted from cached source data and can power exploratory relationships.'
    };
  }
  if (hasDocumentedCreditGap) {
    return {
      status: 'documented-gap',
      confidence: 'reviewed-empty-source',
      source: 'Discogs cache review',
      note: 'A cached source was inspected and did not contain usable album-level credit/studio facts.'
    };
  }
  if (hasCreditGap) {
    return {
      status: 'unknown',
      confidence: 'none',
      source: null,
      note: 'No usable credit/studio candidate has been found yet.'
    };
  }
  return {
    status: 'not-run',
    confidence: 'none',
    source: null,
    note: 'Credit/studio enrichment has not produced a result for this album.'
  };
}

function buildDataQuality(albums, relationships, { sourceCandidates, creditCandidates }) {
  const missingReleaseYear = albums.filter((album) => album.releaseYear == null).map(albumSummary);
  const musicBrainzReview = new Set((sourceCandidates?.review ?? []).map((item) => item.albumId));
  const musicBrainzGaps = new Set((sourceCandidates?.gaps ?? []).map((item) => item.albumId));
  const creditGaps = new Set((creditCandidates?.gaps ?? []).map((item) => item.albumId));
  return {
    principle: 'This is an exploration dataset. Unknowns stay explicit; unresolved technical cleanup is internal infrastructure, not a user-facing review queue.',
    missingReleaseYear,
    musicBrainz: {
      matched: albums.filter((album) => album.dataQuality.metadata.status === 'source-confirmed').length,
      baselineOnly: albums.filter((album) => album.dataQuality.metadata.status === 'baseline').map(albumSummary),
      review: albums.filter((album) => musicBrainzReview.has(album.id)).map(albumSummary),
      gaps: albums.filter((album) => musicBrainzGaps.has(album.id)).map(albumSummary)
    },
    credits: {
      candidates: albums.filter((album) => album.dataQuality.credits.status === 'source-candidate').length,
      unknown: albums.filter((album) => creditGaps.has(album.id)).map(albumSummary),
      documentedGaps: albums.filter((album) => album.dataQuality.credits.status === 'documented-gap').map(albumSummary)
    },
    relationships: {
      count: relationships.length,
      types: countRelationshipTypes(relationships)
    }
  };
}

function albumSummary(album) {
  return {
    albumId: album.id,
    artist: album.artist,
    album: album.album,
    releaseYear: album.releaseYear ?? null,
    latestRank: album.latestRank ?? null
  };
}

function countRelationshipTypes(relationships) {
  const counts = {};
  for (const relationship of relationships) {
    for (const type of relationship.types ?? []) counts[type] = (counts[type] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
}
