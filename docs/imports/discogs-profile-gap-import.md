# Discogs profile-gap second pass

Status: generated source-candidate pass, not canonical data.

This pass uses `data/enrichment/album-profile-gaps.json` to focus Discogs fetching on albums that still lack visible app profile content, especially cover art and tracklists.

## Rebuild

```bash
npm run build:album-profile-gaps
npm run import:discogs-profile-gaps
```

The second command writes:

```text
data/enrichment/album-credit-profile-gap-candidates.json
```

It intentionally does **not** overwrite `data/enrichment/album-credit-candidates.json`, which remains the all-albums Discogs credit layer used by the existing review report.

## Current run

```text
Selected profile-gap albums: 327
Candidates with cached Discogs release payloads: 9
Review items: 213
Gaps: 105
Documented gaps: 0
```

Review reason counts:

```text
ambiguous-discogs-master-search-result: 145
ambiguous-discogs-master-title-result-year-mismatch: 4
discogs-master-fetch-failed: 36
discogs-release-fetch-failed: 1
source-cache-without-usable-credits: 27
```

Gap reason counts:

```text
no-exact-discogs-master-search-result: 105
```

## Matching change in this pass

The importer now accepts a single exact Discogs title match even when the local baseline year is far away from the Discogs master year. This catches cases where the Rolling Stone baseline year represents a compilation/list identity rather than the canonical Discogs release year, while still keeping multiple title-exact year mismatches in review.

Example covered by test:

```text
Elvis Presley — The Sun Sessions
local baseline year: 1999
Discogs title-exact master year: 1976
```

## Caveat from this run

The smoke run hit Discogs `429 Too Many Requests` responses after the first cached/new fetches. Those transient failures are preserved as review items in the generated profile-gap candidate artifact, not canonical album facts. Re-running later with the same command is resumable from the raw cache under `data/imports/discogs/`.
