# Rolling Stone 2003 Full Text Import Notes

Status: canonical staged source for the 2003 edition  
Source file: `data/imports/rolling-stone-2003-full.txt`  
Parsed output: `data/imports/rolling-stone-2003.parsed.json`

This source replaces the earlier partial imports:

- the saved HTML file that only contained ranks 1–50;
- the pasted-text segment that only contained ranks 451–500.

Those partial source files and notes were removed to avoid conflicting 2003 provenance.

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
#500 OutKast — Aquemini
```

Last parsed row in source order:

```text
#1 The Beatles — Sgt. Pepper’s Lonely Hearts Club Band
```

## Parser

The source is parsed by:

```text
src/data/rolling-stone-text-importer.js
```

CLI:

```bash
node scripts/parse-rolling-stone-text.js \
  data/imports/rolling-stone-2003-full.txt \
  data/imports/rolling-stone-2003.parsed.json
```

The parser handles both clean rank lines and source glitches where a rank is glued to a preceding display-title line, for example:

```text
Marvin Gaye, Here, My Dear456
Marvin Gaye, ‘Here, My Dear’
```

## Remaining metadata gaps

Four rows are parsed without label/year because the uploaded source lacks a clean metadata line for them:

- `#458` Elton John — *Tumbleweed Connection*
- `#379` TLC — *CrazySexyCool*
- `#252` Jay-Z — *The Blueprint*
- `#35` David Bowie — *The Rise and Fall of Ziggy Stardust and the Spiders From Mars*

These are not rank/import blockers. Fill them from another source before treating label/year fields as reviewed.

## Next step

Merge `rolling-stone-2003.parsed.json` into the normalized AlbumExplorer collection model as `listAppearances` for `list-rolling-stone-2003`, matching albums against existing 2012/2020 rows where possible and creating imported album stubs where needed.
