# AlbumExplorer

AlbumExplorer is a static, file-first web app for exploring a personal vinyl collection as a relationship atlas.

The first focus is the Rolling Stone “500 Greatest Albums of All Time” lists: which albums appear across editions, which ones are owned or missing, how rankings changed, and how albums connect through people, studios, labels, genres, places, and curator notes.

This is not meant to become only a catalogue. The interesting question is:

> Why are these records connected, and what can I discover by following that connection?

## Current status

The project has been re-centered on an explorer-first slice: the app now loads a clean generated atlas dataset from `data/app/album-atlas.json` instead of making the Discogs/MusicBrainz review workflow the visible product surface.

What exists now:

- Node-based Rolling Stone importers for the 2003, 2012, 2020, and 2024 list sources.
- Stable cross-edition comparison data for **760 album identities**.
- MusicBrainz release-group enrichment for identity/date/tag/source metadata where strict matches are available.
- Discogs credit/studio candidate extraction used to power producer, engineer, songwriter, musician, and studio relationships.
- `npm run build:app-dataset`, which merges comparison/enrichment/credit outputs into the app-facing `data/app/album-atlas.json` file with explicit data-quality states.
- Static Rolling Stone atlas browser with search, filters, rank history, metadata status, album detail panel, explainable related albums, focused SVG relationship graph, album-to-album path finder, and relationship-type filters.
- Internal review/debug artifacts for Hermes to improve data quality without turning Uwe into the triage workflow.
- GitHub Pages deployment workflow for the static app.
- Node test suite for importers, validators, enrichment, app-dataset generation, relationship logic, and the static shell.

## Live app

GitHub Pages deployment target:

```text
https://utrost.github.io/AlbumExplorer/
```

## Run locally

```bash
npm test
npm run import:rolling-stone
npm run enrich:discogs
npm run build:rolling-stone-comparison
npm run import:musicbrainz
npm run enrich:album-metadata
npm run import:discogs-credits
npm run build:app-dataset
python3 -m http.server 4173
```

Then open:

```text
http://127.0.0.1:4173/
```

## Core approach

- **Static website:** runs without a backend, account, hosted database, or third-party API.
- **File-first data:** canonical collection data lives in readable JSON and notes that can be committed to Git.
- **Album ≠ physical copy:** the abstract album and the owned pressing are modelled separately.
- **Relationships over inventory:** ownership matters, but the graph of people, places, labels, studios, lists, and notes is the main value.
- **Explainable connections:** every visible relationship should say why it exists.
- **Small first slice:** preserve the tiny seed for schema validation, but make the main product slice the 760-album Rolling Stone atlas.
- **Explorer over review queues:** review/debug artifacts are internal infrastructure; the public app should load a clean app dataset with explicit unknowns.

## Documentation

- [Project specification](docs/specification.md) — original full product specification.
- [Roadmap / phases](docs/roadmap.md) — implementation phases and exit criteria.
- [Data specification](docs/data-spec.md) — what metadata to collect and how to structure it.
- [App exploration dataset](docs/app-dataset.md) — clean generated atlas consumed by the public app, with explicit quality states and unknowns.
- [Rolling Stone CSV import notes](docs/imports/rolling-stone-top-500-csv.md) — mapping and quality notes for the first 2012/2020 source dataset.
- [Rolling Stone 2003 full text import notes](docs/imports/rolling-stone-2003-full-text.md) — parsed full 2003 list source and remaining metadata gaps.
- [Rolling Stone 2012 simple text import notes](docs/imports/rolling-stone-2012-simple-text.md) — parsed full 2012 list source from rank-dot rows.
- [Rolling Stone 2020 simple text import notes](docs/imports/rolling-stone-2020-simple-text.md) — parsed full 2020 list source from pipe-delimited rows.
- [Rolling Stone 2024 full text import notes](docs/imports/rolling-stone-2024-full-text.md) — parsed full 2024 list source and remaining metadata gaps.
- [Rolling Stone comparison dataset notes](docs/imports/rolling-stone-comparison.md) — generated cross-edition rank comparison across 2003, 2012, 2020, and 2024.
- [Rolling Stone alias review workflow](docs/imports/rolling-stone-alias-review.md) — approved album aliases and generated duplicate candidates for stable comparison identities.
- [Album metadata enrichment workflow](docs/imports/album-metadata-enrichment.md) — reviewable metadata candidates, manual overrides, and no-invention enrichment rules.

## First useful prototype

The first implementation should prove this loop:

1. Load local JSON data.
2. Validate IDs, references, ownership states, list ranks, and relationship types.
3. Browse a small album seed dataset.
4. Open an album detail view.
5. Show list appearances and physical-copy data.
6. Derive explainable relationships such as shared contributor, producer, studio, label, genre, or list edition.
7. Show a focused graph around one selected album.
8. Find and explain a short path between two albums.

## Suggested starting structure

```text
album-explorer/
├── index.html
├── README.md
├── data/
│   └── collection.json
├── docs/
│   ├── specification.md
│   ├── roadmap.md
│   └── data-spec.md
├── notes/
├── covers/
├── src/
│   ├── app.js
│   ├── data/
│   │   ├── loader.js
│   │   ├── validator.js
│   │   ├── indexes.js
│   │   └── derived-relationships.js
│   ├── graph/
│   │   ├── graph-model.js
│   │   └── path-finder.js
│   ├── views/
│   └── styles/
└── tests/
```

For the earliest prototype, `data/collection.json` can hold the whole seed dataset. Split it into multiple files once review and maintenance become awkward.

## Non-goals for the first version

- backend service
- user accounts
- cloud sync
- marketplace or streaming integration
- automatic scraping
- machine-learning recommendations
- audio analysis
- full collection graph visualization
- local editing before import/export and validation are solid

## Development principle

Build the graph model and explanations before polishing the visualization. A plain, trustworthy explanation is more valuable than a beautiful but mysterious hairball.
