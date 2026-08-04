# Rolling Stone 2024 Full Text Import Notes

Status: canonical staged source for the 2024 edition  
Source file: `data/imports/rolling-stone-2024-full.txt`  
Parsed output: `data/imports/rolling-stone-2024.parsed.json`

This source captures the Rolling Stone Top 500 list edition described by the provided text file as the 2024 list.

## Parse result

Parsed rows:

```text
500
```

Rank range:

```text
1–500
```

Duplicate ranks:

```text
0
```

Missing ranks:

```text
0
```

First parsed row in source order:

```text
#500 Arcade Fire — Funeral
```

Last parsed row in source order:

```text
#1 Marvin Gaye — What’s Going On
```

## Parser notes

The source has Rolling Stone page/caption artifacts such as:

```text
500 albums adele 21137
Adele, ’21’
```

and:

```text
500 albums led zeppelin iv four 458
Led Zeppelin, ‘Led Zeppelin IV’
```

The text parser now uses descending rank context to disambiguate these glued rank markers. For example, when the expected next rank is `58`, it treats the trailing `58` in `four 458` as rank 58 rather than rank 458.

## Remaining metadata gaps

```text
0
```

The parser handles the `#437` Gorillaz source typo where the label/year line uses a period instead of a comma:

```text
EMI. 2005
```

and normalizes it to:

```json
{
  "label": "EMI",
  "year": 2005
}
```

## Next step

Merge `rolling-stone-2024.parsed.json` into the normalized AlbumExplorer collection model as `listAppearances` for `list-rolling-stone-2024`, matching albums against existing 2003/2012/2020 rows where possible and creating imported album stubs where needed.
