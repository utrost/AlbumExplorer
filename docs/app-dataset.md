# App Exploration Dataset

Status: explorer-first course correction  
Output: `data/app/album-atlas.json`  
Script: `npm run build:app-dataset`

`data/app/album-atlas.json` is the clean, app-facing dataset for AlbumExplorer. The browser should load this file instead of assembling the product view from raw imports, enrichment candidates, and review artifacts.

## Why this exists

AlbumExplorer is an exploration system, not a review pipeline and not a source-status dashboard. Raw imports, caches, candidate files, and review reports remain useful infrastructure for Hermes, but the product should answer:

> What is the story of this album, what is on it, who made it, what does it look like, and what can I discover by browsing these 760 album identities and their relationships?

The app dataset therefore keeps useful partial data and makes unknowns explicit. It does **not** require every external-source ambiguity to be reviewed before an album becomes explorable. Source names such as MusicBrainz, Discogs, Wikipedia, and Rolling Stone should be stored as provenance/footnotes; they should not be the main labels a viewer sees when browsing an album.

## Product-facing album profile

The album detail view should prioritize content and meaning:

- album art / cover image
- short description and longer album story/context
- tracklist with side/position, track title, duration, and composer/songwriter credits
- total length
- album-level contributors: artist, producers, engineers, musicians, studios, labels
- release date/year and list appearances
- related albums and paths, explained in human terms
- compact footnotes/provenance links for factual claims where useful

Data-quality and source-status fields may remain in the JSON for Hermes and debugging, but they are secondary to the album profile.

## Inputs

The builder currently reads:

- `data/rolling-stone-comparison.json` — stable album identities and list appearances.
- `data/enrichment/album-metadata-candidates.json` — accepted/usable MusicBrainz or Rolling Stone baseline metadata.
- `data/enrichment/album-metadata-source-candidates.json` — MusicBrainz match/review/gap status.
- `data/enrichment/album-credit-candidates.json` — Discogs credit/studio candidates and explicit credit gaps.

## Output shape

The generated file contains:

- `summary` — album count, relationship count, content coverage counts, and internal data-quality counts.
- `albums` — browsable album rows with ranks, story/content fields, cover art, tracklists, contributors, external refs, and `dataQuality` blocks.
- `relationships` — deterministic relationship edges with typed explanations and provenance where available.
- `dataQuality` — internal cleanup signals grouped as explicit unknowns/gaps, not user-facing tasks.

Each album gets explicit quality states:

```json
{
  "dataQuality": {
    "identity": {
      "status": "source-confirmed",
      "confidence": "high",
      "source": "Rolling Stone imported list appearances"
    },
    "metadata": {
      "status": "source-confirmed",
      "confidence": "high",
      "source": "MusicBrainz release group"
    },
    "credits": {
      "status": "source-candidate",
      "confidence": "source-cache",
      "source": "discogs-release-cache"
    }
  }
}
```

Possible metadata/credit states include:

- `source-confirmed`
- `baseline`
- `source-candidate`
- `unknown`
- `documented-gap`
- `not-run`

## Rebuild

```bash
npm run build:app-dataset
```

Expected output currently reports 760 albums and writes:

```text
data/app/album-atlas.json
```

## Product rule

The public UI should consume `data/app/album-atlas.json` and focus on exploration: album art, story, tracklist, duration, composers, search, filters, detail, related albums, graph, and path finding.

Review helpers and source-match status may continue to exist as internal tooling, but they should not be the primary application experience.
