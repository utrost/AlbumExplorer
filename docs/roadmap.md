# AlbumExplorer Roadmap

Status: initial roadmap from the v0.1 project specification  
Last updated: 2026-08-04

AlbumExplorer should grow from a small, static, file-owned prototype into a personal collection atlas. The roadmap keeps the first implementation narrow: prove the data model, validation, browsing, explainable relationships, and focused graph exploration before adding local editing, richer visualizations, or enrichment workflows.

This document describes phases, exit criteria, and candidate tasks. It is intentionally implementation-facing rather than aspirational.

## Product spine

The project succeeds when it can answer these questions from local, version-controlled data:

- Which albums are in the collection, wanted, missing, ordered, sold, or outside the collecting scope?
- Where does each album appear in the Rolling Stone list editions, and how did its rank change?
- Why are two albums connected?
- What nearby albums, people, studios, labels, genres, places, or lists are worth exploring from a selected album?
- How can the curator export changes back into files that belong in the repository?

## Guiding constraints

- Static website first; no backend for normal use.
- Canonical data lives in readable files, initially JSON.
- Browser storage may cache preferences or draft edits, but must never become the only copy.
- Start with focused graphs and labelled paths; avoid a whole-collection hairball.
- Prefer simple JavaScript modules until a concrete requirement justifies a framework, WASM, browser database, or machine learning.
- Every displayed relationship needs an explanation that a human can inspect.

## Phase 0 — Repository and documentation foundation

Goal: turn the specification-only repo into a usable project skeleton without committing to heavy architecture.

### Deliverables

- `docs/roadmap.md` with phased scope and exit criteria.
- A concise README entry point that links to the roadmap and future docs.
- Initial repository structure:
  - `index.html`
  - `src/`
  - `src/data/`
  - `src/graph/`
  - `src/views/`
  - `src/styles/`
  - `data/`
  - `tests/`
  - `docs/`
- Lightweight local development command, either a plain static server instruction or a minimal `package.json` script.

### Exit criteria

- A developer can clone the repo and understand the first implementation slice.
- The roadmap separates MVP work from later ambitions.
- The repository contains no generated framework complexity unless deliberately chosen.

## Phase 1 — Canonical data seed and schema contract

Goal: make the file-first data model real with a deliberately tiny, inspectable dataset. Use [`data-spec.md`](data-spec.md) as the contract for what to collect, how to structure it, and which metadata is MVP versus enrichment.

### Deliverables

- Seed data for 10–20 albums, enough to exercise list appearances and relationships.
- JSON files, initially either:
  - one `data/collection.json` for fastest iteration, or
  - split files if the structure is already stable.
- Stable human-readable IDs that are not fragile display-name slugs.
- Core entity shapes for:
  - albums
  - artists
  - people/contributors
  - labels
  - studios
  - genres
  - locations, if available
  - Rolling Stone list editions
  - list appearances
  - physical copies
  - explicit relationships
- `data/schema-version.json` or equivalent schema marker.
- A documented ownership-state vocabulary.

### Exit criteria

- Data can represent a conceptual album separately from one or more physical copies.
- At least one album appears in multiple list editions.
- At least one pair of albums has an explainable shared contributor, producer, studio, label, or genre.
- Data remains readable in a text editor and suitable for Git review.

## Phase 2 — Data loading, validation, and indexes

Goal: load local JSON into a normalized in-memory model and catch bad data before rendering.

### Deliverables

- `src/data/loader.js` to fetch and parse static data files.
- `src/data/validator.js` to report human-readable data errors.
- `src/data/indexes.js` to build lookup maps such as:
  - album by ID
  - artist by ID
  - contributor to albums
  - studio to albums
  - label to albums
  - genre to albums
  - edition to ranked albums
  - album to list appearances
  - album to physical copies
- Initial automated tests for validator and index behavior.

### Validation should detect

- Duplicate IDs.
- Missing required fields.
- Invalid entity references.
- Duplicate ranks within a list edition.
- Invalid dates or release years.
- Invalid ownership states.
- Unsupported relationship types.
- Missing referenced cover or note paths, if those paths are used.
- Incompatible schema version.

### Exit criteria

- The app refuses to silently render invalid data.
- Validation errors identify file, record, field, problem, and suggested correction where practical.
- Tests cover duplicate IDs, missing references, invalid ownership states, and duplicate list ranks.

## Phase 3 — Static collection browser MVP

Goal: make the collection browsable before solving the graph problem.

### Deliverables

- `index.html` shell.
- `src/app.js` startup flow:
  - load data
  - validate data
  - build indexes
  - render initial view
- `src/views/collection-view.js` with:
  - compact list or cover grid
  - search by title and artist
  - ownership filter
  - Rolling Stone edition filter
  - simple sort by artist, title, release year, or rank
- `src/views/album-detail-view.js` with:
  - album metadata
  - ownership status
  - physical copies
  - list appearances
  - contributors
  - labels, studios, genres
  - notes references, if present

### Exit criteria

- The seed dataset can be browsed locally without a backend.
- Search and filters can be combined and reset.
- Selecting an album opens a detail view that explains the data rather than just listing IDs.
- The app still works if cover images are missing.

## Phase 4 — Explainable relationship model

Status: first executable slice shipped in `src/data/derived-relationships.js` and the album detail panel. Current browser output derives strong related-album suggestions from shared labels, genres/tags, Rolling Stone list editions, and adjacent release periods. Relationship records now keep typed explanation entries so filtered views can foreground the reason that matched the active relationship type. A first Discogs credit-candidate seed now exists for the top 25 comparison albums, but deeper contributor/studio/producer relationships are not wired into the graph until review/normalization is added.

Goal: make relationships explicit, inspectable, and deterministic.

### Deliverables

- `src/graph/graph-model.js` to create nodes and edges from canonical data.
- `src/data/derived-relationships.js` for deterministic derived connections:
  - same primary artist
  - shared contributor
  - shared producer, if modelled separately
  - shared engineer, if modelled separately
  - shared studio
  - shared label
  - shared genre
  - same list edition
  - adjacent release period, if useful
- Relationship explanation strings, for example:
  - “Both albums feature John Coltrane.”
  - “Both albums were recorded at Columbia 30th Street Studio.”
  - “Both albums appear in the 2020 Rolling Stone 500.”
- Initial thresholds to suppress weak/noisy derived edges.

### Exit criteria

- Each visible edge has a machine-readable type and a human-readable explanation.
- Broad relationship types such as genre do not overwhelm rarer connections.
- Derived relationships are reproducible from canonical data and are not stored as opaque facts.

## Phase 5 — Focused graph exploration

Status: first SVG graph slice shipped in `src/views/focused-graph-view.js` and the selected-album detail panel. It shows the selected album plus the strongest related neighbors, keeps edge explanations in SVG titles, lets graph nodes drive album selection, and supports relationship-type filtering shared with related albums and path finding. Richer graph modes remain future work.

Goal: show local neighborhoods without creating a whole-collection hairball.

### Deliverables

- `src/views/graph-view.js` for selected-album exploration.
- Initial SVG renderer for small subgraphs.
- Graph modes:
  - selected album and direct neighbors
  - selected album and two-hop neighbors
  - one relationship type around selected album
  - Rolling Stone edition subgraph
  - artist or producer ecosystem, once data supports it
- Interaction basics:
  - select node
  - highlight neighbors
  - hide/show relationship types
  - show edge explanation
  - return to previous focus

### Exit criteria

- Graph view starts from a selected album, not the whole collection.
- Edge labels or an explanation panel make every connection understandable.
- The graph remains usable on the seed dataset and degrades gracefully as data grows.

## Phase 6 — Path finding between albums

Status: first BFS path-finder slice shipped in `src/graph/path-finder.js` and the selected-album detail panel. It supports direct and multi-hop paths up to a bounded depth, preserves relationship explanations for each hop, handles no-path/same-album results, and includes model-level relationship-type filtering for future UI controls.

Goal: answer “how are these two albums connected?” in plain language.

### Deliverables

- `src/graph/path-finder.js` using breadth-first search as the initial algorithm.
- Path form with:
  - start album
  - destination album
  - maximum path length
  - allowed relationship types
  - excluded relationship types
  - album-only or mixed-entity paths
- Result renderer that turns paths into readable steps.

### Exit criteria

- The user can select two albums and get one or more short paths.
- Results explain why each hop exists.
- Relationship filters change the path results predictably.
- No-path results are handled clearly.

## Phase 7 — Rolling Stone list comparison

Goal: make the list-edition data useful as more than metadata.

### Deliverables

- `src/views/list-comparison-view.js` with:
  - single-edition ranked table
  - two-edition comparison
  - album rank history
  - added, removed, persistent, rising, and falling filters
  - owned-versus-missing summary by edition
- Computed movement between compatible editions.
- Clear confidence/source display for list appearances.

### Exit criteria

- The user can inspect ownership progress for each list edition.
- Rank movement is visible and understandable.
- Albums absent from an edition are represented correctly, not confused with missing data.

## Phase 8 — Timeline and research surfaces

Goal: add slower, reflective exploration once the core graph works.

### Deliverables

- `src/views/timeline-view.js`:
  - release year/date placement
  - decade grouping
  - filters
  - ownership and list-edition indicators
  - selected-relationship overlays where useful
- Research view for:
  - album notes
  - unanswered questions
  - recording and production notes
  - curated trails through the graph
- Markdown or plain-text note loading from `notes/`.

### Exit criteria

- Timeline helps with exploration, not precise music-history claims.
- Notes are linked from entities and remain editable as files.
- Curated trails can point to albums and relationships without requiring a backend.

## Phase 9 — Import, export, and optional local editing

Goal: support curator workflow without abandoning file ownership.

### Deliverables

- JSON import with validation and readable errors.
- Export options:
  - full dataset
  - albums only
  - physical copies
  - relationships
  - notes references
  - current filtered view
  - backup package
- Optional IndexedDB draft-edit layer:
  - store local edits separately from static data
  - mark edited records as modified
  - inspect differences
  - export merged dataset
  - discard local changes
- `localStorage` only for preferences such as selected view, graph options, theme, and default filters.

### Exit criteria

- The canonical Git-friendly dataset remains the source of truth.
- Local edits can be exported and reviewed before committing.
- No user data is trapped only in browser storage.

## Phase 10 — Publishing and public explorer mode

Goal: make a read-only collection atlas deployable as a static site.

### Deliverables

- GitHub Pages or equivalent static deployment.
- Read-only explorer mode that works entirely from published static data.
- URL-encoded state for shareable views, likely including:
  - selected album
  - active filters
  - selected list edition
  - graph relationship types
  - path endpoints
  - timeline range
- Basic accessibility and responsive behavior checks.

### Exit criteria

- A public viewer can browse, search, filter, inspect relationships, and compare lists without accounts or APIs.
- Shared URLs restore meaningful exploration state.
- Curator-only editing features are absent, disabled, or clearly separated from published explorer mode.

## Later candidates, not MVP commitments

Only consider these after the core atlas proves useful:

- Fuzzy or weighted search.
- Browser-side full-text indexing.
- Canvas renderer for larger graph views.
- SQLite/WASM for local analytical queries.
- Automatic metadata enrichment.
- Automatic cover-art acquisition.
- Audio analysis or fingerprinting.
- Machine-learning recommendations.
- Marketplace, purchase, Discogs, or streaming integrations.
- Native mobile app.
- Multi-user collaboration or cloud sync.

## Immediate next implementation order

1. Add repository skeleton and static development instructions.
2. Use the staged [Rolling Stone Top 500 CSV](imports/rolling-stone-top-500-csv.md) as the first importer/validator exercise.
3. Create a tiny but representative seed dataset.
4. Implement validator and indexes with tests.
5. Build collection browser and album detail view.
6. Add explicit and derived relationships with explanations.
7. Add focused SVG graph around one album.
8. Add BFS path finder and plain-language path results.
9. Add list-edition comparison once enough list data exists.

## Open decisions

- Start with one `collection.json` or normalized multi-file JSON? Recommendation: use one file for the first 10–20 albums unless editing pain appears immediately.
- Should contributor roles be first-class edge types from day one? Recommendation: yes for performer, producer, engineer, and curator relationship; defer exotic roles.
- How much Rolling Stone data should be seeded first? Recommendation: enough to compare two editions and show movement, not the full 500.
- Should the first renderer be SVG or plain HTML lists with graph data shown textually? Recommendation: build graph data and explanations first; then add SVG once the model is testable.
- Should local editing be included in v0.1? Recommendation: no. Import/export and file edits are enough until the browsing/exploration loop works.

## Roadmap health checks

Revisit this roadmap whenever one of these becomes true:

- The seed dataset grows beyond about 50 albums.
- Derived relationships become noisy.
- The graph view starts hiding useful explanations.
- Manual JSON editing becomes the main blocker.
- A specific deployment target is chosen.
- The specification README is completed beyond the currently available `10. Performance` fragment.
