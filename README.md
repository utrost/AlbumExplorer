# AlbumExplorer

AlbumExplorer is a static, file-first web app for exploring a personal vinyl collection as a relationship atlas.

The first focus is the Rolling Stone “500 Greatest Albums of All Time” lists: which albums appear across editions, which ones are owned or missing, how rankings changed, and how albums connect through people, studios, labels, genres, places, and curator notes.

This is not meant to become only a catalogue. The interesting question is:

> Why are these records connected, and what can I discover by following that connection?

## Current status

The project is at the planning/specification stage.

There is no app implementation yet. The repository currently defines the product direction, phased roadmap, and data contract that the first prototype should follow.

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
