# Album Metadata Enrichment Workflow

Status: first executable metadata-enrichment slice  
Candidate output: `data/enrichment/album-metadata-candidates.json`  
Review output: `data/enrichment/album-metadata-review.json`  
Manual overrides: `data/enrichment/album-metadata-overrides.json`  
Optional external source candidates: `data/enrichment/album-metadata-source-candidates.json`  
Script: `scripts/enrich-album-metadata.js`

This workflow attaches reviewable metadata candidates to stable AlbumExplorer album identities. It does **not** write facts directly into the canonical collection model.

## Principles

- Keep raw imports untouched.
- Keep generated candidates separate from approved overrides.
- Do not invent metadata when no source exists.
- Prefer explicit manual overrides for ambiguous albums.
- Treat Rolling Stone imported labels/years as low-confidence source data.
- Add Discogs, MusicBrainz, Cover Art Archive, Wikidata, or other sourced candidates later as separate inputs.

## Current scope

The first slice enriches all albums from `data/rolling-stone-comparison.json`, sorted by latest edition rank.

```text
npm run enrich:album-metadata
```

Current generated result:

```text
Album metadata scope: 760 albums
Metadata candidates: 760
Manual review: 0
Metadata gaps: 0
```

All current candidates are sourced from existing Rolling Stone imported labels/years only. They are useful as a baseline, not as verified complete metadata.

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

Optional external source candidates. Keep empty until sourced data exists.

Future importers can write candidates from:

- Discogs
- MusicBrainz
- Cover Art Archive
- Wikidata
- curated local files

## Matching behavior

The first matcher is deliberately strict:

- normalized artist exact match
- normalized album title exact match
- release year must match when both sides provide one
- one exact source candidate becomes a generated candidate
- multiple exact source candidates become review items
- no exact source candidate becomes a gap
- manual override wins over everything else

## Rebuild

```bash
npm run enrich:album-metadata
```

Optional limited CLI shape:

```bash
node scripts/enrich-album-metadata.js data/rolling-stone-comparison.json data/enrichment --limit 100
```

## Next step

Add a real external source candidate importer, probably MusicBrainz release-group search first because it has stable public IDs and does not need secret credentials. Discogs master enrichment can then enrich albums that already have Discogs IDs from earlier imports.
