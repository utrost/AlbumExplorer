# Album credit enrichment — Discogs seed

Status: generated candidate layer, not canonical data.

## Purpose

This import starts the next data tier for AlbumExplorer: producers, engineers, musicians/songwriters, and studio-like entities. The goal is to make future relationship edges more musically meaningful than broad list/genre/label overlap.

## Source and preservation

- Source system: Discogs public API
- Scope: first 25 albums in `data/rolling-stone-comparison.json`, sorted by latest Rolling Stone rank
- Generated artifact: `data/enrichment/album-credit-candidates.json`
- Raw caches:
  - `data/imports/discogs/master-search/`
  - `data/imports/discogs/masters/`
  - `data/imports/discogs/releases/`

The raw cache is part of the file-first import trail. The generated candidate artifact can be rebuilt from these caches without re-querying Discogs.

## Command

```bash
npm run import:discogs-credits -- data/rolling-stone-comparison.json data/enrichment/album-credit-candidates.json --limit 25 --delay-ms 2500 --retry-delay-ms 20000
```

The importer is resumable: it reads existing cache files first and only fetches missing search/master/release responses.

## Current result

- Scope albums: 25
- Credit candidates: 8
- Review items: 15
- Gaps: 2
- Extracted credit rows: 108
- Extracted studio-like rows: 18

Credit row types:

- producer: 17
- engineer: 21
- songwriter: 29
- musician: 41

## Candidate examples

- Joni Mitchell — *Blue*
  - engineer: Henry Lewy
  - songwriter: Joni Mitchell
  - studio: A&M Studios
- The Beatles — *Abbey Road*
  - producer: George Martin
- Fleetwood Mac — *Rumours*
  - musicians: John McVie, Mick Fleetwood, Lindsey Buckingham, Christine McVie, Stevie Nicks
  - engineers: Ken Caillat, Richard Dashut, Chris Morris
  - studios include Record Plant/Sausalito, Sound City Studios, Criteria Recording Studios

## Review policy

The importer is intentionally conservative.

- If Discogs search returns multiple plausible exact masters, the album goes to review.
- If no exact master result is found, the album becomes a gap.
- If a release cache exists but no usable producer/engineer/songwriter/musician/studio data can be extracted, the album goes to review.
- No canonical album data is modified by this import.
- No credits or studios are invented from album title/artist/rank context.

## Known limitations

- Discogs master records often do not contain deep credits; the importer follows the selected master to its main release and extracts from release-level `extraartists`, `credits`, `companies`, and limited notes patterns.
- Search ambiguity is currently common for famous albums because Discogs can have multiple masters/variants with similar titles and years.
- Studio extraction from notes is intentionally narrow; company roles such as `Recorded At`, `Mixed At`, and `Mastered At` are more reliable.
- Candidate credits are not yet used by the live relationship graph. The next implementation step is to derive `shared-producer`, `shared-engineer`, `shared-studio`, `shared-contributor`, and `shared-songwriter` relationships from accepted/generated credit candidates.

## Next normalization step

1. Add a review/override file for ambiguous Discogs master selections.
2. Apply approved overrides before fetching release caches.
3. Expand from top 25 to top 100 once the ambiguity workflow is stable.
4. Feed generated candidates into the derived relationship layer behind a relationship-type filter.
