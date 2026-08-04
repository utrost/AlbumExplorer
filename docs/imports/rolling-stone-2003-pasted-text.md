# Rolling Stone 2003 Pasted Text Import Notes

Status: parsed pasted source segment  
Source file: `data/imports/rolling-stone-2003-451-500-pasted.txt`  
Parsed output: `data/imports/rolling-stone-2003-451-500.parsed.json`

This import captures the pasted text segment for the 2003 Rolling Stone list ranks 500–451.

## Parse result

Parsed rows:

```text
50
```

Rank range:

```text
451–500
```

First parsed row:

```text
#500 OutKast — Aquemini
```

Last parsed row:

```text
#451 Amy Winehouse — Back to Black
```

## Parser

The parser is implemented in:

```text
src/data/rolling-stone-text-importer.js
```

CLI:

```bash
node scripts/parse-rolling-stone-text.js \
  data/imports/rolling-stone-2003-451-500-pasted.txt \
  data/imports/rolling-stone-2003-451-500.parsed.json
```

## Known metadata gaps

One pasted row had no label/year line:

```text
#458 Elton John — Tumbleweed Connection
```

The parser preserves that row with:

```json
{
  "label": null,
  "year": null
}
```

This should be filled from another source before treating the 2003 edition as fully reviewed.

## Coverage so far

Current staged 2003 sources now cover:

- ranks 1–50 from saved HTML;
- ranks 451–500 from pasted text.

Still missing:

- ranks 51–450.
