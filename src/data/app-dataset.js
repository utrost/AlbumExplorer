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

export function buildAppDataset({ comparison, metadataCandidates, sourceCandidates, creditCandidates }, options = {}) {
  const rows = buildEnrichedComparisonRows({
    comparison,
    candidates: metadataCandidates,
    sourceCandidates
  });
  const creditCandidateRows = creditCandidates?.candidates ?? [];
  const creditCandidateByAlbumId = new Map(creditCandidateRows.map((candidate) => [candidate.albumId, candidate]));
  const creditGapIds = new Set((creditCandidates?.gaps ?? []).map((gap) => gap.albumId));
  const documentedCreditGapIds = new Set((creditCandidates?.documentedGaps ?? []).map((gap) => gap.albumId));
  const relationships = buildAlbumRelationships(rows, {
    minimumWeight: options.minimumRelationshipWeight ?? 2.0,
    allowedTypes: options.relationshipTypes ?? APP_DATASET_RELATIONSHIP_TYPES,
    creditCandidates: creditCandidateRows
  });
  const albums = rows.map((row) => enrichAppAlbum(row, {
    creditCandidate: creditCandidateByAlbumId.get(row.id),
    hasCreditGap: creditGapIds.has(row.id),
    hasDocumentedCreditGap: documentedCreditGapIds.has(row.id)
  }));
  const dataQuality = buildDataQuality(albums, relationships, {
    sourceCandidates,
    creditCandidates
  });

  return {
    schemaVersion: '0.1.0',
    status: 'app-exploration-dataset',
    generatedAt: null,
    sourcePaths: {
      comparison: 'data/rolling-stone-comparison.json',
      metadataCandidates: 'data/enrichment/album-metadata-candidates.json',
      musicBrainzSourceCandidates: 'data/enrichment/album-metadata-source-candidates.json',
      creditCandidates: 'data/enrichment/album-credit-candidates.json'
    },
    summary: {
      albumCount: albums.length,
      relationshipCount: relationships.length,
      musicBrainzMatched: albums.filter((album) => album.dataQuality.metadata.status === 'source-confirmed').length,
      rollingStoneBaseline: albums.filter((album) => album.dataQuality.metadata.status === 'baseline').length,
      creditCandidateAlbums: albums.filter((album) => album.dataQuality.credits.status === 'source-candidate').length,
      creditUnknownAlbums: albums.filter((album) => album.dataQuality.credits.status === 'unknown').length,
      creditDocumentedGaps: albums.filter((album) => album.dataQuality.credits.status === 'documented-gap').length,
      fourEditionAlbums: albums.filter((album) => album.editionCount === 4).length
    },
    albums,
    relationships,
    dataQuality
  };
}

function enrichAppAlbum(row, { creditCandidate, hasCreditGap, hasDocumentedCreditGap }) {
  const metadataQuality = metadataQualityFor(row);
  const creditQuality = creditQualityFor({ creditCandidate, hasCreditGap, hasDocumentedCreditGap });
  return {
    ...row,
    displayTitle: `${row.artist} — ${row.album}`,
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
