# Album Content Enrichment Roadmap

Status: active roadmap for the content-first album atlas  
Last updated: 2026-08-13  
Related docs: [`app-dataset.md`](app-dataset.md), [`data-spec.md`](data-spec.md), [`roadmap.md`](roadmap.md)

AlbumExplorer should collect more data by treating MusicBrainz, Discogs, Wikipedia, Wikidata, Cover Art Archive, and other references as **feedstock**. The public app should foreground the album: cover, story, description, tracklist, duration, composers, contributors, ranks, and related albums. Source names and URLs should remain compact footnotes/provenance, not the main user-facing experience.

## Current coverage baseline

Generated from `data/app/album-atlas.json` after commit `6a10357` plus the first Wikidata/Wikipedia story slice:

```text
albums: 760
explainable relationships: 9062
with cover art: 632
with tracklists: 636
with total length: 560
with composer/songwriter/lyricist credits: 245
with sourced story/context: 587
```

Remaining visible gaps:

```text
without cover art: 128
without tracklists: 124
without total length: 200
without composer/songwriter/lyricist credits: 515
without story/context: 173
```

These are album-profile gaps, not user homework. Hermes should improve them through internal enrichment passes, preserving raw source responses under `data/imports/` and regenerating the app-facing atlas.

## Product rule

The app should say:

- cover art
- tracklist
- total length
- composers
- story/context
- contributors
- related albums
- footnotes

The app should not lead with:

- MusicBrainz matched
- Discogs unresolved
- Rolling Stone baseline
- source status
- review queues

Those concepts may exist in generated/internal reports, but only to guide data work.

## Target app-facing profile shape

Each album in `data/app/album-atlas.json` should keep growing this `profile` block:

```json
{
  "profile": {
    "description": "Marvin Gaye — What's Going On (1971).",
    "story": "Short neutral album story/context.",
    "coverArt": {
      "url": "https://...",
      "thumbnailUrl": "https://...",
      "width": 600,
      "height": 591
    },
    "tracklist": [
      {
        "position": "A1",
        "disc": null,
        "side": "A",
        "sequence": 1,
        "title": "What's Going On",
        "durationSeconds": 231,
        "composerCredits": [{ "name": "Marvin Gaye" }],
        "songwriterCredits": [],
        "lyricistCredits": [],
        "performerCredits": []
      }
    ],
    "totalDurationSeconds": 2104,
    "footnotes": [
      { "label": "Album content source", "url": "https://..." }
    ]
  }
}
```

## Enrichment architecture

```text
stable 760 album identities
        ↓
internal source pack per album
        ↓
raw cached responses in data/imports/<source>/...
        ↓
source-specific candidate/extraction artifacts in data/enrichment/...
        ↓
content-first app dataset builder
        ↓
data/app/album-atlas.json
        ↓
cover/story/tracklist/duration/composer UI + quiet footnotes
```

Rules:

1. Preserve raw responses before deriving fields.
2. Make imports resumable and deterministic.
3. Keep source-specific ambiguity internal.
4. Prefer explicit `null`/pending values over invented data.
5. Do not compute total duration from partial track durations.
6. Do not copy long article prose into `story`; derive short neutral summaries from cached source text.
7. Do not commit downloaded third-party cover files unless rights/project policy are clear. Remote image URLs or ignored local caches are acceptable first steps.

## Phase 1 — Missing-profile queue

Goal: make the missing album-content work visible to Hermes without exposing a review dashboard in the app.

Deliverables:

- Generate `data/enrichment/album-profile-gaps.json` grouped by missing field via `npm run build:album-profile-gaps`:
  - missing cover art
  - missing tracklist
  - missing total length
  - missing composer/songwriter/lyricist credits
  - weak/provisional story only
- Generate a companion human-readable report at `docs/imports/album-profile-gaps.md`.
- Sort gaps by latest Rolling Stone rank first, so high-value albums improve earliest.
- Add summary counts and first-N examples for each missing field.
- Add tests proving the gap report is derived from `data/app/album-atlas.json`, not manually maintained.

Exit criteria:

- `npm run build:album-profile-gaps` produces deterministic output.
- Gaps distinguish “no tracklist” from “tracklist exists but no composers” and “tracklist exists but incomplete durations”.
- README or docs link to this roadmap, not to a user-facing source review queue.

## Phase 2 — Discogs second-pass identity matching

Goal: improve the 327 albums without cover art/tracklists by fetching better Discogs release payloads.

Why this first:

- Existing Discogs release payloads already produced 433 tracklists and cover-art entries.
- A better second-pass matcher is likely the fastest way to improve many album pages.

Deliverables:

- Use missing-profile gap report as input via `npm run import:discogs-profile-gaps`, which writes `data/enrichment/album-credit-profile-gap-candidates.json` without overwriting the main all-albums credit candidate layer. Current run notes live in [`imports/discogs-profile-gap-import.md`](imports/discogs-profile-gap-import.md).
- Add alias/fuzzy matching for common album identity variants:
  - punctuation and subtitle variants
  - `The Beatles ("The White Album")` vs `The Beatles`
  - primary-artist variants, e.g. band name vs credited artist
  - compilation/live/anthology title variants
- Cache raw search/master/release responses under `data/imports/discogs/`.
- Prefer release payloads that have:
  - images
  - tracklist
  - durations
  - useful `extraartists`
- Emit candidate/selected payloads into `data/enrichment/album-content-candidates.json` or equivalent.

Exit criteria:

- Increase `with cover art` and `with tracklists` materially above 433.
- No accepted match may mutate the stable local album identity.
- Ambiguous cases remain internal gaps/candidates, not app-facing tasks.
- `npm run build:app-dataset` regenerates profile fields from cached payloads.

## Phase 3 — Cover Art Archive via MusicBrainz

Goal: improve cover art coverage independently from Discogs.

Why this second:

- Many albums already have MusicBrainz release-group references.
- Cover Art Archive is well aligned with MusicBrainz IDs.
- It can fill covers even when Discogs matching is ambiguous.

Deliverables:

- For albums with MusicBrainz release-group or release IDs, fetch Cover Art Archive metadata.
- Cache raw responses under `data/imports/cover-art-archive/`.
- Extract preferred front cover image and thumbnail.
- Add app-dataset precedence rules:
  1. accepted local cover, if ever added
  2. Cover Art Archive front image
  3. Discogs primary image
  4. no cover / pending
- Preserve source URL in `profile.footnotes`.

Exit criteria:

- Increase `with cover art` beyond the Discogs-only baseline.
- Cover image selection is deterministic and tested.
- Missing or 404 cover responses become explicit gaps, not thrown full-run failures.

## Phase 4 — Wikipedia/Wikidata story layer

Goal: make album pages feel alive with short, factual descriptions and stories.

Sources:

- Wikidata for entity/page mapping and structured facts.
- Wikipedia REST/API extracts for short source text.

Deliverables:

- Match local album identities to Wikidata entities.
- Cache Wikidata and Wikipedia responses under `data/imports/wikidata/` and `data/imports/wikipedia/`.
- Extract:
  - short page description
  - first paragraph/extract
  - relevant structured facts where available: release date, genre, label, producer, length
- Generate app-facing fields:
  - `profile.description`: short factual card text
  - `profile.story`: concise neutral story/context
  - story footnotes
- First executable slice: `npm run import:wikidata-stories -- --limit 300` resolves story candidates by MusicBrainz release-group ID, caches combined Wikidata/Wikipedia summary payloads under `data/imports/wikidata/story-by-release-group/`, writes/merges `data/enrichment/wikidata-story-candidates.json`, and the app dataset builder consumes that layer by default.
- Fallback slice: `npm run import:wikidata-stories -- --fallback --limit 80` searches Wikidata by album title for remaining uncovered story gaps, accepts only one exact album-ish English Wikipedia match, caches raw responses under `data/imports/wikidata/story-by-title/`, and merges the candidates into the same generated story layer.
- Avoid long copied article text. Prefer a compact summary written from cached source material.

Exit criteria:

- Album detail pages show useful story/context for high-ranked albums.
- Generated stories are concise, neutral, and footnoted.
- If source text is weak, noisy, disambiguation-only, or missing, keep `story` pending.

## Phase 5 — MusicBrainz work-credit enrichment

Goal: improve composer/songwriter/lyricist coverage beyond what Discogs track credits provide.

Why later:

- It is richer but more complex and rate-limited.
- The path is deeper: release group → representative release → recordings → works → work relationships.

Deliverables:

- Pick a representative release for each matched album.
- Fetch recordings and linked works.
- Extract composer, lyricist, writer, arranger where available.
- Merge with existing Discogs-derived track credits without duplicating names.
- Preserve raw MusicBrainz responses under `data/imports/musicbrainz/`.

Exit criteria:

- Increase `with composer/songwriter/lyricist credits` above 241.
- Track-level credits remain attached to the correct visible track where possible.
- Conflicts or unmatched tracks stay explicit and internal.

## Phase 6 — Contributor and relationship refinement

Goal: use richer album profiles to improve discovery without overwhelming the graph.

Deliverables:

- Promote reliable profile credits into relationship generation:
  - shared composer/songwriter
  - shared producer
  - shared engineer
  - shared performer
  - shared studio
  - shared artwork/designer/photographer where interesting
- Keep broad/noisy relationship types filtered or weighted down.
- Add explanations that read like album facts, not source diagnostics.

Exit criteria:

- Related album explanations foreground human-readable facts.
- Source badges remain compact footnotes.
- Startup relationship generation remains fast enough for browser use.

## Phase 7 — Quality gates and drift control

Goal: keep content enrichment reliable as the dataset grows.

Deliverables:

- Add a content coverage contract test for generated `album-atlas.json`.
- Add per-source import smoke tests with small fixtures.
- Add a local markdown/doc link check.
- Record each enrichment run’s coverage delta in generated logs or import notes.
- Keep the app-dataset builder deterministic.

Exit criteria:

- `npm test` covers profile extraction and UI contract.
- Import failures are isolated to per-album gaps unless the input/output structure is broken.
- Coverage regressions are visible before commit.

## Recommended next slice

Start with Phase 1 and Phase 2 together in a narrow TDD slice:

1. Write RED tests for `album-profile-gaps` generation from a tiny atlas fixture.
2. Implement `npm run build:album-profile-gaps`.
3. Build album profile gap report:
   ```bash
   npm run build:album-profile-gaps
   ```
4. Use that report to drive a second-pass Discogs matcher for a small batch of missing high-ranked albums.
5. Cache raw responses.
6. Regenerate `data/app/album-atlas.json`.
7. Report coverage delta:

```text
with cover art: before → after
with tracklists: before → after
with total length: before → after
with composers: before → after
```

Do not optimize for source-match counts. Optimize for better album pages.
