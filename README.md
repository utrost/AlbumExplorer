AlbumExplorer
Project Specification
Status: Initial specification
Version: 0.1
Project type: Static web application
Primary platform: Modern desktop and mobile browsers
Backend: None
Expected collection size: Fewer than 1,000 albums

Planning documents:
- Roadmap / phases: docs/roadmap.md
- Data specification: docs/data-spec.md

1. Purpose
AlbumExplorer is a browser-based application for exploring a personal vinyl collection as a network of albums, artists, people, places, lists, and musical relationships.
The initial focus is a collection based on the various editions of Rolling Stone magazine’s “500 Greatest Albums of All Time” list. An album may appear in one or more editions, at different positions, or may be absent from some editions entirely.
AlbumExplorer is not intended to be only a collection catalogue. Its central purpose is to make relationships visible and explorable.
Typical questions include:
Which albums appear across several editions of the Rolling Stone list?
How have album rankings changed between editions?
Which owned albums share musicians, producers, studios, labels, genres, or locations?
How are two apparently unrelated albums connected?
Which parts of the collection form meaningful clusters?
Which important albums, artists, studios, or producers are underrepresented in the collection?
What can be learned by following the path from one album to another?
The application should support browsing, comparison, and discovery without requiring a server, account, hosted database, or third-party API.
2. Design Principles
2.1 Backend-free by default
AlbumExplorer must run as a static website.
It should be deployable through:
GitHub Pages;
any static web host;
a local development server;
a local network;
an offline package, where browser restrictions permit.
No backend service should be required for normal use.
2.2 Data ownership
The collection data must remain under the user’s control.
The canonical dataset should be stored in readable, version-controlled files such as JSON. The application may use browser storage for temporary or local edits, but browser storage must not become the only copy of the collection.
2.3 Relationships over inventory
Album ownership is an important property, but not the sole organizing principle.
The system should treat the collection as a knowledge graph in which albums can be connected through:
artists;
musicians;
producers;
engineers;
studios;
labels;
genres;
locations;
historical influence;
sampling;
cover versions;
list appearances;
personal notes and research.
2.4 Explainable connections
Every displayed connection must be understandable.
The interface should answer not only that two albums are related, but why they are related.
Example:
Kind of Blue is connected to A Love Supreme because John Coltrane performed on both albums.
2.5 Progressive complexity
The first usable version should remain small and understandable.
Advanced features such as browser-based databases, WebAssembly, machine learning, automatic enrichment, or audio analysis should only be introduced when a specific requirement justifies them.
2.6 Readability before spectacle
A full collection graph containing hundreds of albums and thousands of relationships may be visually impressive but difficult to use.
AlbumExplorer should therefore prioritize:
local neighbourhoods;
filters;
focused paths;
grouped views;
timelines;
explicit relationship labels;
progressive disclosure.
3. Scope
3.1 In scope
The initial project includes:
album catalogue;
collection ownership status;
Rolling Stone list editions and ranks;
search;
filtering;
album detail views;
relationship modelling;
automatically derived connections;
local graph exploration;
comparison between list editions;
path finding between albums;
static deployment;
JSON import and export;
optional local editing using IndexedDB.
3.2 Out of scope for the initial version
The following are not required for the first implementation:
user accounts;
multi-user collaboration;
cloud synchronization;
server-side database;
public social features;
streaming integration;
automated purchase tracking;
marketplace integration;
audio playback;
automatic metadata scraping;
automatic cover-art downloading;
machine-learning recommendations;
audio fingerprinting;
native mobile applications.
These may be considered later as optional extensions.
4. Users
The initial user is the owner and curator of the collection.
The application should nevertheless be structured so it can later support read-only public use, for example as a published collection atlas.
Two usage modes are anticipated:
4.1 Curator mode
The collection owner can:
inspect the collection;
import and export data;
edit album metadata;
add notes;
define explicit relationships;
mark ownership and physical-copy details;
review derived connections.
4.2 Explorer mode
A viewer can:
browse albums;
search and filter;
inspect relationships;
compare list editions;
explore paths and clusters;
read notes and research.
Explorer mode should work entirely from the published static data.
5. Functional Requirements
5.1 Album catalogue
Each album must have a stable unique identifier.
The application should support at least:
title;
primary artist;
release year;
original release date, where known;
cover image reference;
ownership status;
genres;
label;
country or region;
recording locations;
contributors;
Rolling Stone list appearances;
personal notes;
external references;
tags.
Suggested ownership states:
owned;
wanted;
missing;
ordered;
sold;
not collecting;
unknown.
The initial interface should allow albums to be displayed as:
cover grid;
compact list;
sortable table;
timeline;
filtered graph.
5.2 Physical copy information
The conceptual album and the owned physical release should be modelled separately.
One album may have zero, one, or several physical copies.
A physical copy may include:
format;
country;
release year;
pressing;
catalogue number;
label;
edition;
mono or stereo;
media condition;
sleeve condition;
purchase date;
purchase price;
seller or source;
storage location;
Discogs reference;
notes.
This separation avoids treating a particular pressing as identical to the abstract album.
5.3 Rolling Stone editions
Each edition of the list should be represented as an entity.
An edition should include:
identifier;
publication year;
title;
publication date, if known;
source reference;
notes.
The relationship between an album and a list edition should include:
rank;
whether the entry is new;
movement since a previous edition, where meaningful;
notes about title or artist changes;
source confidence.
The interface should support:
viewing one edition;
comparing two editions;
showing all appearances of one album;
showing rank movement;
filtering by persistent, added, removed, rising, or falling albums;
viewing owned versus missing albums for each edition.
5.4 Search
Search should work locally in the browser.
Searchable fields should include:
album title;
artist;
contributor;
producer;
studio;
label;
genre;
tag;
notes;
catalogue number.
The initial implementation may use normalized substring matching.
Later implementations may add:
fuzzy matching;
weighted fields;
typo tolerance;
full-text indexing.
5.5 Filtering
Filters should be combinable.
Initial filters should include:
ownership state;
release year or decade;
Rolling Stone edition;
rank range;
artist;
genre;
label;
producer;
studio;
location;
contributor;
tag.
The application should show the active filters clearly and allow them to be reset easily.
5.6 Album detail view
Selecting an album should open a detail view containing:
cover;
title;
artist;
release information;
ownership status;
physical copies;
list appearances and ranks;
contributors;
producer and engineering credits;
studios;
genres;
labels;
notes;
direct relationships;
derived relationships;
nearby albums in the graph.
The detail view should make the reason for each connection explicit.
5.7 Relationship graph
The graph is a central feature, but it should be focused rather than global by default.
Initial graph modes:
selected album and direct neighbours;
selected album and two-hop neighbours;
albums connected by one relationship type;
shortest path between two albums;
filtered subgraph;
Rolling Stone edition subgraph;
artist or producer ecosystem.
Graph nodes may represent:
albums;
artists;
people;
studios;
labels;
genres;
locations;
list editions.
Graph edges may represent:
performed on;
produced by;
engineered by;
recorded at;
released by;
belongs to genre;
appears in list;
sampled;
covered;
influenced;
shares contributor;
shares producer;
shares studio;
shares label;
shares genre;
related by curator note.
The interface should support:
zooming;
panning;
selecting nodes;
highlighting neighbours;
hiding relationship types;
viewing edge explanations;
returning to the previous focus.
5.8 Derived relationships
Some relationships should be calculated in the browser rather than stored manually.
Examples:
same primary artist;
shared musician;
shared producer;
shared engineer;
shared studio;
shared label;
shared genre;
shared location;
same list edition;
similar rank trajectory;
adjacent release periods.
Derived relationships must be deterministic and reproducible from canonical data.
The application should avoid creating excessive graph density. Thresholds should be configurable.
Example:
do not display “shared genre” when the only shared genre is overly broad;
prioritize rare shared contributors over common ones;
limit the number of derived edges shown at once;
assign weights to relationships.
5.9 Path finding
The user should be able to select two albums and ask how they are connected.
The application should calculate one or more short paths.
Example:
Album A
→ recorded at Studio X
→ also used for Album B
→ produced by Person Y
→ also produced Album C
Path finding should support:
shortest path;
preferred relationship types;
excluded relationship types;
maximum path length;
album-only path;
mixed-entity path.
A simple breadth-first search is sufficient for the initial version.
5.10 Timeline
The timeline should position albums by original release date or year.
It should support:
decade grouping;
filtering;
ownership indication;
list-edition indication;
selection of an album;
relationship overlays;
artist or genre comparison.
The timeline is primarily an exploration view, not a precise historical chart.
5.11 Notes and research
Each album and entity may have curator-written notes.
Notes may include questions such as:
Why is this album considered important?
How was it recorded?
Which techniques or technologies shaped it?
Which earlier work influenced it?
Which later work refers back to it?
What changed between pressings?
What did I learn from listening or researching it?
The initial implementation may use plain text or Markdown.
5.12 Import and export
The application must support importing the canonical dataset from JSON files.
It should also support exporting:
full dataset;
albums only;
physical copies;
notes;
relationships;
current filtered view;
backup package.
Exported data should be suitable for committing back to the Git repository.
Import should include validation and human-readable error messages.
5.13 Local editing
Local editing is optional for the first release but should be anticipated in the architecture.
When enabled:
edits are stored in IndexedDB;
the original static dataset remains unchanged;
edited records are marked as modified;
the user can export a merged dataset;
the user can discard local changes;
the user can inspect differences before export.
localStorage should be reserved for preferences such as:
last selected view;
graph display options;
theme;
filter defaults.
5.14 Shareable application state
A later version should support encoding selected state in the URL.
Possible state:
selected album;
active filters;
selected list edition;
graph relationship types;
path endpoints;
timeline range.
This would allow links to specific explorations without requiring a backend.
6. Data Model
6.1 Core entities
The initial model should support these entity types:
Album;
Artist;
Person;
PhysicalCopy;
Studio;
Label;
Genre;
Location;
ListEdition;
Tag;
Note;
Relationship.
All entities must have stable identifiers.
Identifiers should be human-readable where practical, but must not be derived in a way that changes when display names change.
Example:
{
  "id": "album-kind-of-blue",
  "type": "album",
  "title": "Kind of Blue"
}
6.2 Album example
{
  "id": "album-kind-of-blue",
  "type": "album",
  "title": "Kind of Blue",
  "primaryArtistId": "artist-miles-davis",
  "releaseDate": "1959-08-17",
  "releaseYear": 1959,
  "genres": [
    "genre-jazz",
    "genre-modal-jazz"
  ],
  "labelIds": [
    "label-columbia-records"
  ],
  "studioIds": [
    "studio-columbia-30th-street"
  ],
  "contributorIds": [
    "person-miles-davis",
    "person-john-coltrane",
    "person-cannonball-adderley"
  ],
  "owned": true,
  "cover": "covers/album-kind-of-blue.jpg",
  "tags": [
    "canonical",
    "jazz"
  ],
  "notes": "notes/album-kind-of-blue.md"
}
6.3 Rolling Stone appearance example
{
  "albumId": "album-kind-of-blue",
  "editionId": "rolling-stone-2020",
  "rank": 31,
  "sourceConfidence": "verified"
}
6.4 Explicit relationship example
{
  "id": "relationship-kind-of-blue-columbia-30th-street",
  "source": "album-kind-of-blue",
  "target": "studio-columbia-30th-street",
  "type": "recorded-at",
  "evidence": [
    {
      "source": "liner-notes",
      "reference": "Original release notes"
    }
  ]
}
6.5 Physical copy example
{
  "id": "copy-kind-of-blue-001",
  "albumId": "album-kind-of-blue",
  "format": "LP",
  "country": "US",
  "releaseYear": 1977,
  "label": "Columbia",
  "catalogueNumber": "PC 8163",
  "stereo": true,
  "mediaCondition": "VG+",
  "sleeveCondition": "VG",
  "storageLocation": "Shelf A2",
  "purchaseDate": "2026-03-14",
  "purchasePrice": {
    "amount": 24.00,
    "currency": "EUR"
  },
  "notes": "Later pressing."
}
6.6 File organization
A normalized multi-file structure is recommended:
data/
├── albums.json
├── artists.json
├── people.json
├── studios.json
├── labels.json
├── genres.json
├── locations.json
├── list-editions.json
├── list-appearances.json
├── physical-copies.json
├── relationships.json
└── schema-version.json
Notes may be stored separately:
notes/
├── albums/
├── people/
├── studios/
└── research/
Covers may be stored as local image files:
covers/
├── album-kind-of-blue.jpg
└── ...
For early prototypes, a single collection.json file is acceptable. The split format should be introduced when maintenance becomes difficult.
7. Technical Architecture
7.1 Recommended stack
Initial implementation:
HTML5;
modern CSS;
JavaScript using ES modules;
JSON data;
SVG or Canvas for graphs;
IndexedDB for optional local edits;
static hosting.
A build step is optional.
The first version should preferably remain understandable without requiring a large framework.
7.2 Suggested project structure
album-explorer/
├── index.html
├── README.md
├── LICENSE
├── package.json
├── src/
│   ├── app.js
│   ├── data/
│   │   ├── loader.js
│   │   ├── validator.js
│   │   ├── indexes.js
│   │   └── derived-relationships.js
│   ├── graph/
│   │   ├── graph-model.js
│   │   ├── layout.js
│   │   ├── renderer.js
│   │   └── path-finder.js
│   ├── views/
│   │   ├── collection-view.js
│   │   ├── album-detail-view.js
│   │   ├── graph-view.js
│   │   ├── timeline-view.js
│   │   └── list-comparison-view.js
│   ├── storage/
│   │   ├── indexeddb.js
│   │   ├── import.js
│   │   └── export.js
│   ├── state/
│   │   └── application-state.js
│   └── styles/
│       └── app.css
├── data/
├── notes/
├── covers/
├── tests/
└── docs/
7.3 Application startup
At startup, the application should:
load the static data files;
validate the schema version;
validate entity references;
build in-memory indexes;
generate configured derived relationships;
load local preferences;
load optional IndexedDB edits;
merge local edits into the in-memory model;
render the initial view.
For fewer than 1,000 albums, this process should remain practical in ordinary JavaScript.
7.4 In-memory indexes
The application should build indexes such as:
album by ID;
artist by ID;
contributor to albums;
producer to albums;
studio to albums;
label to albums;
genre to albums;
edition to ranked albums;
album to list appearances;
album to physical copies;
entity to relationships.
These indexes should be generated at runtime and should not need to be stored manually.
7.5 Graph representation
A simple adjacency-list structure is recommended.
Example:
const adjacency = new Map();

adjacency.set("album-kind-of-blue", [
  {
    target: "person-john-coltrane",
    type: "performed-by",
    weight: 1
  },
  {
    target: "studio-columbia-30th-street",
    type: "recorded-at",
    weight: 1
  }
]);
The graph model should remain independent from the visual renderer.
This allows the project to change from SVG to Canvas or WebGL later without rewriting the data model and algorithms.
7.6 Rendering technology
Initial recommendation
Use SVG for focused graphs and timelines.
Advantages:
accessible DOM elements;
easy labels;
easy inspection;
simple styling;
good for small subgraphs;
good interaction support.
Canvas may be introduced if graph rendering becomes slow.
WebGL is not required initially.
7.7 WebAssembly
WebAssembly is explicitly not part of the initial architecture.
It may be considered later for isolated tasks such as:
SQLite in the browser;
computationally expensive graph layouts;
image processing;
audio fingerprinting;
similarity analysis;
local machine-learning models.
Any WebAssembly component must justify its complexity through a measurable requirement.
7.8 Browser compatibility
Target browsers:
current Firefox;
current Chromium-based browsers;
current Safari, where feasible.
The application should work on desktop and tablet.
Mobile support should focus on:
browsing;
search;
filtering;
detail views;
small graph neighbourhoods.
Complex graph editing may remain desktop-first.
8. User Interface
8.1 Main navigation
Suggested primary views:
Collection;
Explore;
Lists;
Timeline;
Paths;
Research;
Settings.
8.2 Collection view
The default collection view should support:
cover grid;
compact list;
ownership summary;
filters;
search;
sorting;
selection.
Suggested sort options:
artist;
title;
release year;
Rolling Stone rank;
ownership status;
date acquired;
recently edited.
8.3 Explore view
The Explore view should contain:
focused graph;
selected entity panel;
relationship filters;
graph depth control;
explanation panel;
option to choose a new focus;
option to find a path.
The initial graph should begin from a selected album rather than the whole collection.
8.4 Lists view
The Lists view should support:
selecting an edition;
comparing editions;
viewing ownership progress;
rank movement;
albums added or removed;
persistent albums;
missing albums.
Possible visualizations:
ranked table;
slope chart;
rank movement lines;
overlap matrix;
owned-versus-missing summary.
8.5 Timeline view
The Timeline view should support:
decade range;
grouping;
filters;
selected relationship overlays;
ownership indicators;
list-edition indicators.
8.6 Path view
The Path view should include:
start album;
destination album;
allowed relationship types;
maximum path length;
one or more results;
plain-language explanation.
8.7 Research view
The Research view should collect:
album notes;
unanswered questions;
recording and production research;
references;
discoveries;
curated thematic trails.
This view may evolve into a personal notebook attached to the collection graph.
9. Data Validation
The data loader should detect:
duplicate IDs;
missing required fields;
invalid references;
duplicate list ranks;
invalid dates;
invalid ownership states;
unsupported relationship types;
missing referenced cover files;
incompatible schema versions.
Validation errors should identify:
file;
record;
field;
problem;
suggested correction, where possible.
A JSON Schema may be introduced after the first prototype.
10. Performance
For the expected collec