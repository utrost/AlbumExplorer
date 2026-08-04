# AlbumExplorer

AlbumExplorer is a static, file-first web app for exploring a personal vinyl collection as a relationship atlas.

The first focus is the Rolling Stone “500 Greatest Albums of All Time” lists: which albums appear across editions, which ones are owned or missing, how rankings changed, and how albums connect through people, studios, labels, genres, places, and curator notes.

This is not meant to become only a catalogue. The interesting question is:

> Why are these records connected, and what can I discover by following that connection?

## Current status

The project now has a first executable file-first slice:

- Node-based Rolling Stone CSV importer.
- Optional Discogs enrichment script for imported master-release metadata, genres/styles, and cover candidates.
- Normalized `data/collection.json` seed generated from the first 20 CSV rows.
- Collection validator that separates fatal errors from warnings and metadata gaps.
- Lookup index builder.
- Plain static browser page that loads the seed data and lists albums with validation status.
- Node test suite for importer, validator, indexes, and static shell.

## Run locally

```bash
npm test
npm run import:rolling-stone
npm run enrich:discogs
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
- **Small first slice:** start with 10–20 carefully chosen albums before trying to model the full collection.

## Documentation

- [Project specification](docs/specification.md) — original full product specification.
- [Roadmap / phases](docs/roadmap.md) — implementation phases and exit criteria.
- [Data specification](docs/data-spec.md) — what metadata to collect and how to structure it.
- [Rolling Stone CSV import notes](docs/imports/rolling-stone-top-500-csv.md) — mapping and quality notes for the first 2012/2020 source dataset.
- [Rolling Stone 2003 full text import notes](docs/imports/rolling-stone-2003-full-text.md) — parsed full 2003 list source and remaining metadata gaps.
- [Rolling Stone 2012 simple text import notes](docs/imports/rolling-stone-2012-simple-text.md) — parsed full 2012 list source from rank-dot rows.
- [Rolling Stone 2020 simple text import notes](docs/imports/rolling-stone-2020-simple-text.md) — parsed full 2020 list source from pipe-delimited rows.
- [Rolling Stone 2024 full text import notes](docs/imports/rolling-stone-2024-full-text.md) — parsed full 2024 list source and remaining metadata gaps.
- [Rolling Stone comparison dataset notes](docs/imports/rolling-stone-comparison.md) — generated cross-edition rank comparison across 2003, 2012, 2020, and 2024.

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
