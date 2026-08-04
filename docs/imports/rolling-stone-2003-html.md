# Rolling Stone 2003 Saved HTML Import Notes

Status: parsed source import  
Source file: `data/imports/Greatest_Albums_List_Published_2003_04_08_2026_16：18：39_txt.html`  
Parsed output: `data/imports/rolling-stone-2003.parsed.json`

The uploaded saved HTML file was parsed with `scripts/parse-rolling-stone-html.js`.

## Parse result

The file contains **50 parsed album rows**, not all 500.

Observed rank range:

```text
1–50
```

First parsed row in file order:

```text
#50 Little Richard — Here’s Little Richard
```

Last parsed row in file order:

```text
#1 The Beatles — Sgt. Pepper’s Lonely Hearts Club Band
```

This means the saved page currently contains the top 50 segment of the 2003 Rolling Stone list. The page includes a `Load Previous 50` control, but the other 450 rows are not present as album article nodes in the saved HTML.

## Extracted fields

Each row contains:

```json
{
  "rank": 50,
  "artist": "Little Richard",
  "album": "Here’s Little Richard",
  "label": "Specialty",
  "year": 1957
}
```

The parser extracts:

- rank from the article text prefix;
- artist and album from the `<h2>` title;
- label and year from the post-cover-art metadata text.

## Current limitation

This is a good parser test fixture and a useful 2003 top-50 source, but it is not the complete 2003 edition.

To complete `list-rolling-stone-2003`, we still need ranks 51–500 from one of these options:

- saved HTML pages after loading all previous segments;
- separate HTML captures for each 50-album segment;
- a CSV/table source for the full 2003 list;
- a different source that exposes all 500 rows at once.

## Next import step

The next useful implementation step is to merge `rolling-stone-2003.parsed.json` into the normalized collection model as `listAppearances` for `list-rolling-stone-2003`, while preserving the parsed source as imported confidence.
