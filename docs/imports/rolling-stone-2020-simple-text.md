# Rolling Stone 2020 Simple Text Import Notes

Status: canonical staged source for the 2020 edition  
Source file: `data/imports/rolling-stone-2020-simple.txt`  
Parsed output: `data/imports/rolling-stone-2020.parsed.json`

This source captures the Rolling Stone Top 500 list edition described by the provided text file as the 2020 list.

## Source format

The 2020 file uses one pipe-delimited row per album:

```text
1 | Marvin Gaye | What's Going On | 1971
```

The parser extracts:

- rank
- artist
- album title
- release year

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
#1 Marvin Gaye — What's Going On
```

Last parsed row:

```text
#500 Arcade Fire — Funeral
```

## Parser notes

The pipe-delimited source is the cleanest of the current Rolling Stone imports. It is useful as a matching baseline because each row has rank, artist, album, and year with no prose or page chrome.

## Next step

Merge `rolling-stone-2020.parsed.json` into the normalized AlbumExplorer collection model as `listAppearances` for `list-rolling-stone-2020`, matching albums against existing imported rows where possible and creating imported album stubs where needed.
