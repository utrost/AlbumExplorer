# Rolling Stone Cross-Edition Comparison Dataset

Status: generated comparison dataset across parsed Rolling Stone list imports  
Generated file: `data/rolling-stone-comparison.json`  
Builder: `scripts/build-rolling-stone-comparison.js`

This dataset merges the parsed Rolling Stone list imports into one album-centered comparison table. Each row represents one normalized album identity and records the album's rank in any edition where it appears.

## Inputs

- `data/imports/rolling-stone-2003.parsed.json`
- `data/imports/rolling-stone-2012.parsed.json`
- `data/imports/rolling-stone-2020.parsed.json`
- `data/imports/rolling-stone-2024.parsed.json`

## Output shape

Each album row contains:

- `id` — deterministic AlbumExplorer-style album identity key
- `artist` — display artist, currently from the latest matched appearance
- `album` — display album title, currently from the latest matched appearance
- `releaseYear` — release year when known
- `ranks` — edition-year-to-rank mapping
- `rankDeltas` — adjacent-edition rank movements where the album appears in both editions
- `appearances` — source-preserving listed artist/title/rank rows by edition

Example:

```json
{
  "id": "album-marvin-gaye-whats-going-on-1971",
  "artist": "Marvin Gaye",
  "album": "What's Going On",
  "releaseYear": 1971,
  "ranks": {
    "2003": 6,
    "2012": 6,
    "2020": 1,
    "2024": 1
  },
  "rankDeltas": {
    "2003To2012": 0,
    "2012To2020": -5,
    "2020To2024": 0
  }
}
```

Negative deltas mean the album moved upward toward rank 1. Positive deltas mean it moved downward.

## Generation result

```text
comparison albums=789
2003 ranked albums=500
2012 ranked albums=500
2020 ranked albums=500
2024 ranked albums=500
```

Coverage by number of editions:

```text
1 edition: 158 albums
2 editions: 316 albums
3 editions: 50 albums
4 editions: 265 albums
```

## Matching rules

The first pass uses conservative deterministic matching:

- normalize curly quotes and punctuation
- normalize accents
- normalize leading `The` in artist names
- include release year in the identity when available
- keep rows with missing release year rather than dropping the rank appearance

This intentionally avoids fuzzy matching for now. Ambiguous near-matches should be reviewed explicitly before being merged.

## Known caveats

- The 2003 source still has three metadata gaps where the source row lacks usable label/year metadata. Those rows are retained in the comparison dataset.
- Some true cross-edition matches may remain split if artist/title/year differ beyond the conservative normalization rules.
- Some albums with expanded artists, soundtrack-style credits, or alternate titles may need a future manual alias map.

## Rebuild

```bash
npm run build:rolling-stone-comparison
```

## Next step

Add a review report for likely duplicate identities. That report should list conservative candidate pairs, such as same normalized album title with similar artist names or missing-year rows that likely match a known-year row.
