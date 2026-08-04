# Rolling Stone Album Alias Review Workflow

Status: active review workflow  
Approved aliases: `data/review/rolling-stone-album-aliases.json`  
Generated candidates: `data/review/rolling-stone-possible-duplicates.json`  
Consumer: `scripts/build-rolling-stone-comparison.js`

AlbumExplorer keeps raw parsed Rolling Stone imports untouched. Alias review happens as a separate File-First layer between parsed imports and the generated cross-edition comparison dataset.

## Why this exists

The same album can appear differently across list editions:

- spelling: `Blonde` vs `Blond`
- abbreviations: `Exile on Main St.` vs `Exile on Main Street`
- artist credit scope: `The Jimi Hendrix Experience` vs `Jimi Hendrix`
- title variants: `The Beatles (White Album)` vs `White Album`
- source typos: `Innervisons` vs `Innervisions`

The importer should not silently guess these. Instead:

1. Raw source rows stay preserved.
2. Candidate duplicates are generated for review.
3. Approved aliases are written to `rolling-stone-album-aliases.json`.
4. The comparison builder applies approved aliases deterministically.

## Approved alias file

Each alias has:

- `id`
- `canonicalArtist`
- `canonicalAlbum`
- `releaseYear`
- `reason`
- `variants[]`

Example:

```json
{
  "id": "alias-frank-ocean-blond-2016",
  "canonicalArtist": "Frank Ocean",
  "canonicalAlbum": "Blond",
  "releaseYear": 2016,
  "reason": "Rolling Stone alternates between Blonde and Blond for the same album.",
  "variants": [
    { "artist": "Frank Ocean", "album": "Blonde", "year": 2016 }
  ]
}
```

A variant maps to the canonical identity before comparison rows are merged. Source appearances still keep the originally listed artist/title.

## Candidate file

`data/review/rolling-stone-possible-duplicates.json` is generated and should not be hand-edited. It contains unapproved possible duplicates with:

- `reason`
- `status`
- `score`
- `ranks`
- `identities[]`

Current detector scope is intentionally conservative:

- same rank across editions
- similar normalized title
- same normalized artist
- same release year, unless one side lacks a year
- excludes already-approved aliases

This avoids hiding real list changes such as replacing one album with another at the same rank.

## Rebuild

```bash
npm run build:rolling-stone-comparison
```

The command writes:

- `data/rolling-stone-comparison.json`
- `data/review/rolling-stone-possible-duplicates.json`

## Current seed result

```text
Approved aliases loaded: 29
Aliases applied: 38
Possible duplicates: 0
Comparison albums: 760
```

All four editions still retain 500 rank appearances each.

## Review procedure

For each candidate:

1. Check whether both identities are truly the same album.
2. If yes, add an alias entry to `data/review/rolling-stone-album-aliases.json`.
3. Preserve the source's listed title/artist as a variant.
4. Choose the clearest canonical display title.
5. Add a short `reason`.
6. Rebuild with `npm run build:rolling-stone-comparison`.
7. Run `npm test`.

Do not approve aliases just because ranks match. A same-rank replacement can be a real list change.
