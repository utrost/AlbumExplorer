# Album Metadata Enrichment Workflow

Status: first executable metadata-enrichment slice  
Candidate output: `data/enrichment/album-metadata-candidates.json`  
Review output: `data/enrichment/album-metadata-review.json`  
Manual overrides: `data/enrichment/album-metadata-overrides.json`  
External source candidates: `data/enrichment/album-metadata-source-candidates.json`  
MusicBrainz raw cache: `data/imports/musicbrainz/release-group-search/`  
Scripts: `scripts/import-musicbrainz-source-candidates.js`, `scripts/enrich-album-metadata.js`

This workflow attaches reviewable metadata candidates to stable AlbumExplorer album identities. It does **not** write facts directly into the canonical collection model.

## Principles

- Keep raw imports untouched.
- Keep generated candidates separate from approved overrides.
- Do not invent metadata when no source exists.
- Prefer explicit manual overrides for ambiguous albums.
- Treat Rolling Stone imported labels/years as low-confidence source data.
- Add Discogs, MusicBrainz, Cover Art Archive, Wikidata, or other sourced candidates later as separate inputs.

## Current scope

The current slice enriches all albums from `data/rolling-stone-comparison.json`, sorted by latest edition rank.

```text
npm run import:musicbrainz
npm run enrich:album-metadata
```

Current MusicBrainz release-group import result:

```text
MusicBrainz scope: 760 albums
MusicBrainz candidates: 553
MusicBrainz review: 1
MusicBrainz gaps: 206
```

Current generated metadata result after merging MusicBrainz candidates with the Rolling Stone baseline:

```text
Album metadata scope: 760 albums
Metadata candidates: 760
Manual review: 0
Metadata gaps: 0
MusicBrainz-primary candidates: 553
Rolling-Stone-baseline candidates: 207
Release dates populated: 553
Labels populated: 702
Genres populated: 553
External refs populated: 553
Country populated: 0
```

MusicBrainz currently contributes release-group-level identity metadata: release-group IDs, artist IDs, first release dates, MusicBrainz tags/genres, and external URLs. Rolling Stone imported labels/years remain the low-confidence baseline and fill records that do not yet have a strict MusicBrainz match.

This is not yet deep credit enrichment. Producers, studios, engineers, musicians, tracklists, songwriter credits, recording dates, recording locations, and countries still need a later release/recording/credit-level importer.

## Output files

### `album-metadata-candidates.json`

Generated candidate metadata for albums where the workflow found exactly one applicable source candidate or a manual override.

Each candidate keeps:

- AlbumExplorer album identity
- candidate status
- confidence
- normalized metadata proposal
- source candidate summary

### `album-metadata-review.json`

Generated review queue for:

- ambiguous source candidates
- albums with no source candidate

This file is generated and should not be hand-edited.

### `album-metadata-overrides.json`

Manual curator-approved metadata. Overrides win over generated source candidates.

Example:

```json
{
  "albumId": "album-beach-boys-pet-sounds-1966",
  "status": "reviewed",
  "reason": "Curator-approved canonical metadata.",
  "metadata": {
    "canonicalArtist": "The Beach Boys",
    "canonicalTitle": "Pet Sounds",
    "releaseYear": 1966,
    "releaseDate": "1966-05-16",
    "labels": ["Capitol"],
    "genres": ["Rock", "Pop"],
    "styles": ["Psychedelic Rock", "Baroque Pop"],
    "country": "US",
    "externalRefs": []
  }
}
```

### `album-metadata-source-candidates.json`

External source candidates generated from MusicBrainz release-group search.

The MusicBrainz importer keeps raw API responses in:

```text
data/imports/musicbrainz/release-group-search/
```

The aggregate source-candidate file keeps:

- strict MusicBrainz release-group matches
- ambiguous MusicBrainz matches for review
- MusicBrainz gaps where no exact album release-group match was accepted
- source metadata such as release-group score, primary type, secondary types, release-group ID, artist ID, and sample release IDs

Future importers can add candidates from:

- Discogs
- Cover Art Archive
- Wikidata
- curated local files

## Matching behavior

The matcher is deliberately strict:

- normalized artist exact match
- normalized album title exact match
- release year must match when both sides provide one
- MusicBrainz release-group matches must be `Album` primary type
- MusicBrainz `Compilation` secondary type is rejected for canonical album matches
- a unique external source candidate supersedes the low-confidence Rolling Stone baseline
- multiple external source candidates become review items
- no exact source candidate falls back to the Rolling Stone baseline when available
- manual override wins over everything else

## Rebuild

```bash
npm run import:musicbrainz
npm run enrich:album-metadata
```

The MusicBrainz importer uses a local raw-response cache. A normal rerun reads existing cache files and only queries MusicBrainz for missing album IDs.

Optional limited CLI shapes:

```bash
node scripts/import-musicbrainz-source-candidates.js data/rolling-stone-comparison.json data/enrichment/album-metadata-source-candidates.json --limit 100
node scripts/enrich-album-metadata.js data/rolling-stone-comparison.json data/enrichment --limit 100
```

## Next step

Add a deeper release/recording/credit-level enrichment pass. MusicBrainz release-groups are useful for stable identity, dates, tags, and external refs, but they do not yet provide producers, studios, engineers, musicians, tracklists, countries, or recording locations in the generated AlbumExplorer candidate model. Discogs master/release data and Wikidata should be layered as separate source candidates rather than written directly into canonical collection data.
