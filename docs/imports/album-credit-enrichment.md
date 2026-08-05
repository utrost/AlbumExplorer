# Album credit enrichment — Discogs full comparison import

Status: generated candidate layer, not canonical data.

## Purpose

This import starts the next data tier for AlbumExplorer: producers, engineers, musicians/songwriters, and studio-like entities. The goal is to make future relationship edges more musically meaningful than broad list/genre/label overlap.

## Source and preservation

- Source system: Discogs public API
- Scope: all 760 albums in `data/rolling-stone-comparison.json`, sorted by latest Rolling Stone rank
- Generated artifact: `data/enrichment/album-credit-candidates.json`
- Raw caches:
  - `data/imports/discogs/master-search/`
  - `data/imports/discogs/masters/`
  - `data/imports/discogs/releases/`

The raw cache is part of the file-first import trail. The generated candidate artifact can be rebuilt from these caches without re-querying Discogs.

## Command

```bash
npm run import:discogs-credits -- data/rolling-stone-comparison.json data/enrichment/album-credit-candidates.json --delay-ms 1100 --retries 4 --retry-delay-ms 15000
```

The importer is resumable: it reads existing cache files first and only fetches missing search/master/release responses.

## Current result

After applying `data/review/discogs-credit-master-overrides.json` and running the importer across all comparison albums:

- Scope albums: 760
- Credit candidates: 412
- Review items: 245
- Gaps: 103
- Extracted credit rows: 5,096
- Extracted studio-like rows: 1,068
- Network fetches during the full run: 1,634
- Discogs `429` retry events during the full run: 144
- Non-fatal failed Discogs requests routed to review: 5

Credit row types:

- producer: 818
- engineer: 775
- songwriter: 435
- musician: 3,068

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

## Review queue

The remaining non-candidate albums are explicit review/gap work, not silently filled data.

Review reasons:

- ambiguous Discogs master search result: 216
- selected Discogs master fetch failed: 5
- source cache without usable credits: 24

Gap reasons:

- no exact Discogs master search result: 103

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
- Credit candidates are now used by the live relationship graph for shared producer, engineer, studio, songwriter, and musician/performer edges across every successfully matched comparison album.

## Next normalization step

1. Work through the 245 review items, starting with ambiguous Discogs master matches that can be approved in `data/review/discogs-credit-master-overrides.json`.
2. Improve search aliases for the 103 gaps where exact Discogs master search returned no usable match.
3. Re-run the full import after each override/alias batch; the importer is cache-first and only fetches missing source responses.
4. Add a compact review UI/report for approved, rejected, gap, and stale Discogs candidates.
