# Rolling Stone 2012 Simple Text Import Notes

Status: canonical staged source for the 2012 edition  
Source file: `data/imports/rolling-stone-2012-simple.txt`  
Parsed output: `data/imports/rolling-stone-2012.parsed.json`

This source captures the Rolling Stone Top 500 list edition described by the provided text file as the 2012 list.

## Source format

The 2012 file uses one row per album:

```text
1. Sgt. Pepper's Lonely Hearts Club Band (1967) by The Beatles
```

The parser extracts:

- rank
- album title
- release year
- artist

Label metadata is not present in this simple source, so parsed rows intentionally keep `label: null`.

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

Metadata gaps for required import fields:

```text
0
```

First parsed row:

```text
#1 The Beatles — Sgt. Pepper's Lonely Hearts Club Band
```

Last parsed row:

```text
#500 Outkast — Aquemini
```

## Parser notes

The simple text parser handles rows without a space after the rank marker, such as:

```text
374.Siren (1975) by Roxy Music
```

It also keeps parenthetical text inside album titles when the release year is the final year before `by`, for example:

```text
377. The Ultimate Collection (1948 - 1990) (1991) by John Lee Hooker
```

## Next step

Merge `rolling-stone-2012.parsed.json` into the normalized AlbumExplorer collection model as `listAppearances` for `list-rolling-stone-2012`, matching albums against existing imported rows where possible and creating imported album stubs where needed.
