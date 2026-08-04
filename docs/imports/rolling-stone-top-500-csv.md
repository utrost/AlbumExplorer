# Rolling Stone Top 500 CSV Import Notes

Status: staged source import  
Source file: `data/imports/rolling-stone-top-500.csv`  
Last inspected: 2026-08-04

This document describes the first provided source dataset for AlbumExplorer: a CSV exported from `Rolling Stone Top 500.xlsx`.

The CSV is a useful starting point for the first file-first prototype because it already contains rank, ownership, artist, album, year, and Discogs master-release references. It is not yet canonical AlbumExplorer data. Treat it as an import source that needs normalization, validation, and curator review.

## File shape

CSV columns:

```text
Owned
Position 2012
Year
Position 2020
Artist Sorted
Artist
Album
Image
Discogs Master Release
```

Observed size:

- 663 data records.
- 9 columns.
- 545 rows marked `Owned = 1`.
- 20 rows marked CD-only using `cd only` / `CD Only`.
- 98 rows with blank ownership.
- 500 rows have a 2012 position.
- 499 rows have a numeric 2020 position.
- 163 rows use `-` for the 2020 position, likely albums present in 2012 but absent from 2020.
- All `Image` values are `#REF!`, so cover data should be ignored during import.
- 5 rows have blank Discogs master-release links.

## Interpretation

The CSV appears to combine two Rolling Stone list editions into one table:

- `Position 2012`: rank in the 2012 edition.
- `Position 2020`: rank in the 2020 edition.
- `-` in `Position 2020`: likely present in 2012 but removed from 2020.
- Blank `Position 2012`: likely new in 2020 or absent from the 2012 dataset.
- `Owned = 1`: owned on vinyl or primary collection copy.
- `Owned = cd only` / `CD Only`: owned only as CD, not necessarily vinyl.
- Blank `Owned`: not owned or not checked.

These interpretations should be confirmed before writing a canonical importer.

## Mapping to AlbumExplorer data

### Albums

Each CSV row should create or match one conceptual album record.

CSV → AlbumExplorer:

- `Artist` → artist display name and `artists.name`.
- `Artist Sorted` → `artists.sortName`.
- `Album` → `albums.title`.
- `Year` → `albums.releaseYear`, if plausible.
- `Owned` → `albums.ownershipState`, using the rules below.
- `Discogs Master Release` → `albums.externalRefs[]` with `system = discogs-master`.

Suggested album ID format:

```text
album-<artist-key>-<album-key>
```

Example:

```text
album-marvin-gaye-whats-going-on
```

Because IDs must remain stable, generated IDs should be reviewed before becoming canonical.

### Artists

Each unique `Artist` value should create or match an artist record.

CSV → AlbumExplorer:

- `Artist` → `artists.name`.
- `Artist Sorted` → `artists.sortName`.
- generated ID → `artists.id`.

This source does not distinguish solo artists from groups. Set `artistType` to `unknown` unless safely inferred later.

### Rolling Stone list editions

Create two list-edition records:

```json
{
  "id": "list-rolling-stone-2012",
  "type": "list-edition",
  "publication": "Rolling Stone",
  "title": "The 500 Greatest Albums of All Time",
  "editionYear": 2012,
  "sourceIds": ["source-rolling-stone-top-500-csv"]
}
```

```json
{
  "id": "list-rolling-stone-2020",
  "type": "list-edition",
  "publication": "Rolling Stone",
  "title": "The 500 Greatest Albums of All Time",
  "editionYear": 2020,
  "sourceIds": ["source-rolling-stone-top-500-csv"]
}
```

### List appearances

For each row:

- if `Position 2012` is numeric, create a 2012 list appearance.
- if `Position 2020` is numeric, create a 2020 list appearance.
- if `Position 2020` is `-`, do not create a 2020 appearance; later comparison logic can infer removal from 2020.
- if a rank is blank, do not create an appearance for that edition.

Example:

```json
{
  "albumId": "album-marvin-gaye-whats-going-on",
  "editionId": "list-rolling-stone-2020",
  "rank": 1,
  "listedTitle": "What's Going On",
  "listedArtist": "Marvin Gaye",
  "sourceConfidence": "imported",
  "sourceIds": ["source-rolling-stone-top-500-csv"]
}
```

### Ownership mapping

Initial import mapping:

```text
Owned = 1              → ownershipState = owned
Owned = cd only        → ownershipState = owned, physical copy format = CD, needs curator review
Owned = CD Only        → ownershipState = owned, physical copy format = CD, needs curator review
Owned blank            → ownershipState = missing or unknown
```

Recommendation: use `unknown` for blank ownership during raw import, then let the curator decide whether blanks mean `missing` in this project context.

If `cd only` is meant to mean “owned, but not on vinyl,” preserve that nuance in a physical-copy record or tag:

```json
{
  "id": "copy-...-cd-001",
  "type": "physical-copy",
  "albumId": "album-...",
  "ownershipState": "owned",
  "format": "CD",
  "sourceIds": ["source-rolling-stone-top-500-csv"]
}
```

### Discogs references

Discogs links should become external references, not primary IDs.

Example:

```json
{
  "system": "discogs-master",
  "id": "66631",
  "url": "https://www.discogs.com/de/Marvin-Gaye-Whats-Going-On/master/66631"
}
```

Use the numeric master ID when available. Preserve the URL too.

## Data quality findings

These are import issues, not blockers.

### Missing 2020 rank

The 2020 list has 499 numeric ranks. Rank `338` is missing.

The row where this likely belongs has blank `Position 2020`:

```text
row 339: Brian Eno — Another Green World — Position 2012: 429 — Year: 1975 — Position 2020: blank
```

Confirm whether this should be rank 338 in 2020.

### `Position 2020 = -`

163 rows use `-` for the 2020 position. These should be treated as “not present in 2020,” not as duplicate rank errors.

### Duplicate 2012 ranks

The source contains duplicate values in `Position 2012`:

- rank 387:
  - Wu-Tang Clan — Enter The Wu-Tang (36 Chambers) — 2020 rank 27
  - Various — The Indestructible Beat Of Soweto — 2020 rank 497
- rank 378:
  - Oasis — (What's The Story) Morning Glory? — 2020 rank 157
  - TLC — CrazySexyCool — 2020 rank 218
- rank 358:
  - Elton John — Honky Château — 2020 rank 251
  - Miles Davis — Sketches of Spain — absent from 2020
- rank 178:
  - ABBA — The Definitive Collection — 2020 rank 303
  - Curtis Mayfield & The Impressions — The Anthology: 1961–1977 — absent from 2020
- rank 60:
  - Sly & The Family Stone — Greatest Hits — 2020 rank 343
  - Captain Beefheart & His Magic Band — Trout Mask Replica — absent from 2020
- rank 213:
  - Ike & Tina Turner — Proud Mary: The Best Of Ike And Tina Turner — 2020 rank 392
  - The Rolling Stones — Tattoo You — absent from 2020

These should be reviewed before treating 2012 ranks as canonical.

### Suspicious year

One row has `Year = 73` instead of likely `1973`:

```text
row 141: The Wailers — Catch A Fire — Position 2020: 140
```

### Blank Discogs links

Rows with blank `Discogs Master Release`:

- Daft Punk — Random Access Memories — 2020 rank 295
- Kelis — Kaleidoscope — 2020 rank 391
- Todd Rundgren — Something / Anything? — 2020 rank 396
- Al Green — Call Me — 2020 rank 427
- Selena — Amor Prohibido — 2020 rank 479

### Broken image column

All rows have `Image = #REF!`. Ignore this column for now. Cover metadata should be collected separately.

## What this source can support immediately

This CSV is enough to create a first useful prototype for:

- album list browsing;
- artist/title/year search;
- ownership status filtering;
- 2012 and 2020 Rolling Stone list appearances;
- 2012 versus 2020 comparison;
- owned versus missing progress per edition;
- Discogs master external references;
- a first seed dataset for validator development.

It is not enough for rich graph exploration because it does not include:

- contributors;
- producers;
- engineers;
- studios;
- labels as structured fields;
- genres;
- recording locations;
- physical pressing details beyond rough ownership hints;
- curator notes.

## Recommended first importer behavior

Build an importer that produces a normalized draft JSON file, not final canonical data.

Suggested command later:

```bash
node scripts/import-rolling-stone-csv.js \
  data/imports/rolling-stone-top-500.csv \
  data/imports/rolling-stone-top-500.normalized.json
```

The normalized draft should contain:

- `albums`
- `artists`
- `listEditions`
- `listAppearances`
- `physicalCopies` for CD-only rows if confirmed useful
- `sources`

Each imported record should use:

```json
{
  "confidence": "imported",
  "sourceIds": ["source-rolling-stone-top-500-csv"]
}
```

Do not generate graph relationships from this CSV beyond `appears-in-list` and basic `primary-artist-of` until richer metadata exists.

## Curator questions before canonical import

- Does blank `Owned` mean `missing`, `unknown`, or simply “not owned on vinyl”?
- Should `cd only` count as `owned` at album level, or as a separate physical-copy state while album-level vinyl ownership remains missing?
- Should the 2012 duplicate ranks be corrected from an external source before import?
- Is Brian Eno — `Another Green World` supposed to be rank 338 in 2020?
- Should Discogs master links be considered trusted enough for `verified`, or remain `imported` until reviewed?

## Recommended immediate next implementation step

A first version now exists: the CSV importer creates `data/collection.json`, and `scripts/enrich-discogs.js` can enrich that seed from Discogs master records into ignored draft output at `data/collection.discogs.json`.

The next implementation steps are:

1. Decide whether Discogs-enriched genres/styles should be promoted into canonical `data/collection.json` or remain a generated draft.
2. Add a small review UI or report for imported Discogs fields.
3. Confirm ownership semantics for blank and CD-only rows.
4. Expand the seed beyond the first 20 rows only after duplicate-rank and suspicious-year handling is clear.
5. Add richer graph metadata from another source or manual curation, because Discogs master data alone does not reliably provide studios/producers/contributor-role relationships.
