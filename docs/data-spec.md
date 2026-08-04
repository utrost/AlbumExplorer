# AlbumExplorer Data Specification

Status: initial data specification for the file-first prototype  
Last updated: 2026-08-04

AlbumExplorer is only as useful as its metadata. This document defines what data to collect, how to provide it, and how to structure it so the application can browse albums, compare Rolling Stone list editions, explain relationships, and find paths through the collection without a backend.

The specification is intentionally practical. It distinguishes required MVP data from useful enrichment data and later optional metadata.

## Data principles

- Canonical data belongs in readable, version-controlled files.
- Stable IDs are more important than perfect display names.
- Record the source and confidence for factual claims that may vary by edition, pressing, or reference site.
- Separate the abstract album from the physical copy in the collection.
- Prefer explicit structured references over prose when the app should calculate relationships.
- Preserve curator notes as human writing, but do not hide critical machine-readable facts only inside notes.
- Do not require all metadata on day one. Sparse records are allowed if validation can explain what is missing.
- Missing relationship metadata should reduce what the app can infer, not block basic catalogue/list use.

## Partial metadata is expected

AlbumExplorer should assume that most records start incomplete.

A sparse album with only ID, title, primary artist, release year, ownership state, and list appearances can still support browsing, search, ownership progress, and Rolling Stone comparison. It simply cannot yet produce rich graph edges such as shared contributor, shared studio, or shared producer.

Validation should therefore distinguish:

- **Errors:** broken identity or references that make data unsafe to load.
- **Warnings:** suspicious or review-worthy fields, such as implausible years.
- **Metadata gaps:** absent optional enrichment, such as missing contributors, studios, covers, notes, or external references.

Do not invent filler metadata to make records look complete. Sparse and sourced is better than rich and dubious.

## Recommended file layout

For the first seed dataset, a single file is acceptable:

```text
data/collection.json
```

Move to split files when the dataset becomes hard to review in one file:

```text
data/
├── schema-version.json
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
└── sources.json

notes/
├── albums/
├── people/
├── studios/
└── research/

covers/
└── ...
```

The app should treat the single-file and split-file layouts as equivalent model shapes once loaded.

## Dataset package shape

A complete exported dataset should include these top-level collections:

```json
{
  "schemaVersion": "0.1.0",
  "generatedAt": null,
  "albums": [],
  "artists": [],
  "people": [],
  "studios": [],
  "labels": [],
  "genres": [],
  "locations": [],
  "listEditions": [],
  "listAppearances": [],
  "physicalCopies": [],
  "relationships": [],
  "sources": []
}
```

`generatedAt` should be `null` for hand-authored canonical files. Export tools may set it for generated backup packages.

## ID conventions

All entities need stable IDs.

Recommended format:

```text
<type>-<short-human-key>
```

Examples:

```text
album-kind-of-blue
artist-miles-davis
person-john-coltrane
studio-columbia-30th-street
label-columbia-records
genre-modal-jazz
location-new-york-city
list-rolling-stone-2020
copy-kind-of-blue-001
source-discogs-release-123456
relationship-kind-of-blue-recorded-at-columbia-30th-street
```

ID rules:

- Use lowercase ASCII letters, numbers, and hyphens.
- Do not derive IDs automatically from the current display name during every import.
- If a title or name changes, keep the ID and update the display field.
- Avoid embedding rank, ownership state, or mutable status in IDs.
- For physical copies, use a stable sequence or acquisition-specific suffix.
- For relationships, IDs may be generated deterministically from source, type, and target if no curated relationship ID exists.

## Common metadata fields

Most entities may include these fields:

```json
{
  "id": "album-kind-of-blue",
  "type": "album",
  "displayName": "Kind of Blue",
  "aliases": [],
  "sortName": "Kind of Blue",
  "description": null,
  "notes": null,
  "sourceIds": [],
  "confidence": "verified",
  "tags": []
}
```

Confidence values:

- `verified`: checked against a reliable source or the physical item.
- `imported`: imported from a source but not yet checked.
- `inferred`: derived from other known data.
- `curator-note`: personal assertion or interpretation.
- `unknown`: source or certainty is not known.
- `conflicting`: credible sources disagree and the conflict should remain visible.

## Album records

Albums are conceptual releases/works, not physical copies.

### MVP fields

```json
{
  "id": "album-kind-of-blue",
  "type": "album",
  "title": "Kind of Blue",
  "sortTitle": "Kind of Blue",
  "primaryArtistId": "artist-miles-davis",
  "releaseYear": 1959,
  "releaseDate": "1959-08-17",
  "ownershipState": "owned",
  "genreIds": ["genre-jazz", "genre-modal-jazz"],
  "labelIds": ["label-columbia-records"],
  "studioIds": ["studio-columbia-30th-street"],
  "contributorIds": ["person-miles-davis", "person-john-coltrane"],
  "cover": "covers/album-kind-of-blue.jpg",
  "notes": "notes/albums/album-kind-of-blue.md",
  "externalRefs": [],
  "sourceIds": [],
  "tags": ["canonical", "jazz"]
}
```

### Album fields to collect

Required for MVP:

- `id`
- `type`: `album`
- `title`
- `primaryArtistId`
- `releaseYear`, when known
- `ownershipState`

Strongly recommended:

- `sortTitle`
- `releaseDate`
- `genreIds`
- `labelIds`
- `studioIds`
- `contributorIds`
- `cover`
- `notes`
- `externalRefs`
- `sourceIds`
- `tags`

Useful enrichment:

- `originalCountryId`
- `recordingStartDate`
- `recordingEndDate`
- `language`
- `trackCount`
- `durationSeconds`
- `canonicalEditionNotes`
- `historicalImportanceSummary`
- `recordingContextSummary`
- `productionTechniques`
- `influenceNotes`
- `listeningNotes`

Do not put physical pressing details on the album. Use `physicalCopies` for those.

## Ownership states

Use one of these values:

```text
owned
wanted
missing
ordered
sold
not-collecting
unknown
```

Meaning:

- `owned`: at least one physical or intentionally accepted digital copy is in the collection.
- `wanted`: actively desired.
- `missing`: relevant to a list or project, but not owned.
- `ordered`: purchased but not yet received or catalogued.
- `sold`: previously owned, no longer in collection.
- `not-collecting`: known album, intentionally outside collecting scope.
- `unknown`: status has not been checked.

For simple filters, album-level `ownershipState` is enough. For exact collection history, record each item under `physicalCopies`.

## Artist records

Artists represent credited album artists or groups.

```json
{
  "id": "artist-miles-davis",
  "type": "artist",
  "name": "Miles Davis",
  "sortName": "Davis, Miles",
  "artistType": "person",
  "personId": "person-miles-davis",
  "memberPersonIds": [],
  "startYear": null,
  "endYear": null,
  "locationIds": [],
  "aliases": [],
  "externalRefs": [],
  "sourceIds": []
}
```

Artist types:

- `person`
- `group`
- `collaboration`
- `various-artists`
- `unknown`

For solo artists, link the artist to the matching person if the person is also used as a contributor.

## Person records

People are musicians, producers, engineers, writers, designers, photographers, or other credited contributors.

```json
{
  "id": "person-john-coltrane",
  "type": "person",
  "name": "John Coltrane",
  "sortName": "Coltrane, John",
  "birthDate": "1926-09-23",
  "deathDate": "1967-07-17",
  "locationIds": ["location-hamlet-north-carolina"],
  "aliases": [],
  "externalRefs": [],
  "sourceIds": [],
  "tags": []
}
```

Collect people when they help explain relationships. For MVP, prioritize:

- primary artists
- notable performers
- producers
- engineers
- composers or songwriters where relevant
- sleeve designers or photographers only when those relationships matter to exploration

## Contributor credits

A flat `contributorIds` list is useful but not enough for explainable relationships. Prefer structured credits when possible.

```json
{
  "albumId": "album-kind-of-blue",
  "personId": "person-john-coltrane",
  "roles": ["performer"],
  "instruments": ["tenor saxophone"],
  "tracks": [],
  "creditedAs": "John Coltrane",
  "sourceIds": ["source-wikipedia-kind-of-blue"],
  "confidence": "verified"
}
```

If contributor credits are stored separately later, use:

```text
data/contributor-credits.json
```

For the initial split-file model, contributor credits may live inside album records as `credits`:

```json
{
  "credits": [
    {
      "personId": "person-john-coltrane",
      "roles": ["performer"],
      "instruments": ["tenor saxophone"],
      "tracks": [],
      "creditedAs": "John Coltrane",
      "sourceIds": []
    }
  ]
}
```

Recommended role vocabulary:

```text
primary-artist
performer
vocalist
composer
songwriter
lyricist
producer
executive-producer
engineer
mixing-engineer
mastering-engineer
arranger
conductor
designer
photographer
liner-notes
curator
other
unknown
```

## Studio records

Studios are useful relationship anchors because recording places connect otherwise separate albums.

```json
{
  "id": "studio-columbia-30th-street",
  "type": "studio",
  "name": "Columbia 30th Street Studio",
  "sortName": "Columbia 30th Street Studio",
  "locationId": "location-new-york-city",
  "openedYear": 1948,
  "closedYear": 1981,
  "aliases": ["The Church"],
  "externalRefs": [],
  "sourceIds": [],
  "notes": "notes/studios/studio-columbia-30th-street.md"
}
```

Collect:

- name
- location
- aliases
- active years, if known
- source references
- notes about why the studio matters

## Label records

Labels connect albums through release history and scenes, but broad labels can create noisy relationships.

```json
{
  "id": "label-columbia-records",
  "type": "label",
  "name": "Columbia Records",
  "sortName": "Columbia Records",
  "parentLabelId": null,
  "locationIds": [],
  "startYear": 1889,
  "endYear": null,
  "aliases": [],
  "externalRefs": [],
  "sourceIds": []
}
```

For physical copies, the label printed on the copy may differ from the conceptual album label. Record copy-specific label details on `physicalCopies`.

## Genre records

Genres help filtering but can make weak graph edges. Keep them controlled.

```json
{
  "id": "genre-modal-jazz",
  "type": "genre",
  "name": "Modal jazz",
  "parentGenreIds": ["genre-jazz"],
  "broad": false,
  "aliases": [],
  "sourceIds": []
}
```

Use `broad: true` for categories that should be down-weighted or hidden by default in graph relationships, such as `rock`, `pop`, or `jazz`.

## Location records

Locations can represent cities, regions, countries, studios' addresses, or culturally meaningful scenes.

```json
{
  "id": "location-new-york-city",
  "type": "location",
  "name": "New York City",
  "locationType": "city",
  "parentLocationId": "location-united-states",
  "countryCode": "US",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "externalRefs": [],
  "sourceIds": []
}
```

Location types:

```text
studio-address
city
region
country
scene
unknown
```

Coordinates are optional. Do not block data entry on exact coordinates.

## Rolling Stone list editions

Each list edition is its own entity.

```json
{
  "id": "list-rolling-stone-2020",
  "type": "list-edition",
  "publication": "Rolling Stone",
  "title": "The 500 Greatest Albums of All Time",
  "editionYear": 2020,
  "publicationDate": "2020-09-22",
  "sourceUrl": "https://www.rollingstone.com/music/music-lists/best-albums-of-all-time-1062063/",
  "notes": null,
  "sourceIds": ["source-rolling-stone-2020"]
}
```

Collect:

- edition ID
- publication
- title
- edition/publication year
- exact publication date, if known
- source URL or citation
- notes about methodology or known changes

## List appearances

A list appearance connects one album to one list edition at one rank.

```json
{
  "albumId": "album-kind-of-blue",
  "editionId": "list-rolling-stone-2020",
  "rank": 31,
  "previousRank": 12,
  "movement": -19,
  "entryStatus": "persistent",
  "listedTitle": "Kind of Blue",
  "listedArtist": "Miles Davis",
  "sourceConfidence": "verified",
  "sourceIds": ["source-rolling-stone-2020"],
  "notes": null
}
```

Required:

- `albumId`
- `editionId`
- `rank`

Recommended:

- `listedTitle`
- `listedArtist`
- `sourceConfidence`
- `sourceIds`

Computed or optional:

- `previousRank`
- `movement`
- `entryStatus`
- `notes`

Entry status vocabulary:

```text
new
persistent
removed
re-entered
unknown
```

A removed album usually does not have a rank in the later edition. Removed/persistent/rising/falling views can be computed from appearances across editions rather than stored manually.

## Physical copy records

Physical copies describe actual owned items.

```json
{
  "id": "copy-kind-of-blue-001",
  "type": "physical-copy",
  "albumId": "album-kind-of-blue",
  "ownershipState": "owned",
  "format": "LP",
  "mediaCount": 1,
  "country": "US",
  "releaseYear": 1977,
  "pressing": "Later pressing",
  "catalogueNumber": "PC 8163",
  "labelText": "Columbia",
  "labelId": "label-columbia-records",
  "edition": null,
  "channel": "stereo",
  "speed": "33⅓ RPM",
  "size": "12-inch",
  "mediaCondition": "VG+",
  "sleeveCondition": "VG",
  "purchaseDate": "2026-03-14",
  "purchasePrice": {
    "amount": 24.0,
    "currency": "EUR"
  },
  "seller": "Local record shop",
  "storageLocation": "Shelf A2",
  "discogsReleaseId": null,
  "barcode": null,
  "matrixRunout": [],
  "notes": "Later pressing.",
  "sourceIds": []
}
```

Physical copy fields to collect:

Required for useful collection tracking:

- `id`
- `albumId`
- `ownershipState`
- `format`

Strongly recommended:

- `country`
- `releaseYear`
- `pressing`
- `catalogueNumber`
- `labelText`
- `mediaCondition`
- `sleeveCondition`
- `storageLocation`

Useful enrichment:

- `purchaseDate`
- `purchasePrice`
- `seller`
- `discogsReleaseId`
- `barcode`
- `matrixRunout`
- `channel`
- `speed`
- `size`
- `edition`
- `notes`

Condition vocabulary can start with Goldmine-style values:

```text
M
NM
VG+
VG
G+
G
F
P
unknown
```

## Relationship records

Explicit relationships are curated facts or researched claims. Derived relationships are calculated from structured data.

```json
{
  "id": "relationship-kind-of-blue-recorded-at-columbia-30th-street",
  "type": "recorded-at",
  "sourceEntityId": "album-kind-of-blue",
  "targetEntityId": "studio-columbia-30th-street",
  "direction": "directed",
  "weight": 1,
  "explanation": "Kind of Blue was recorded at Columbia 30th Street Studio.",
  "evidence": [
    {
      "sourceId": "source-wikipedia-kind-of-blue",
      "quote": null,
      "url": null
    }
  ],
  "confidence": "verified",
  "curatorNote": null
}
```

Relationship types for MVP:

```text
primary-artist-of
performed-on
produced-by
engineered-by
recorded-at
released-by
belongs-to-genre
appears-in-list
has-physical-copy
related-by-curator-note
```

Derived relationship types:

```text
same-primary-artist
shares-contributor
shares-producer
shares-engineer
shares-studio
shares-label
shares-genre
shares-location
same-list-edition
similar-rank-trajectory
adjacent-release-period
```

Later relationship types:

```text
sampled
covered
influenced
influenced-by
member-of
collaborated-with
recorded-near
scene-associated-with
references
```

Rules:

- Every visible relationship must have an explanation.
- Explicit relationships should include evidence or a curator note.
- Derived relationships should identify the shared fact that caused the edge.
- Noisy derived edges should be down-weighted or hidden by default.

## Source records

Sources make metadata reviewable.

```json
{
  "id": "source-rolling-stone-2020",
  "type": "source",
  "title": "Rolling Stone: The 500 Greatest Albums of All Time",
  "sourceType": "web-page",
  "url": "https://www.rollingstone.com/music/music-lists/best-albums-of-all-time-1062063/",
  "accessedDate": "2026-08-04",
  "publisher": "Rolling Stone",
  "author": null,
  "publishedDate": "2020-09-22",
  "notes": null
}
```

Source types:

```text
physical-item
liner-notes
book
magazine
web-page
discogs
musicbrainz
wikipedia
wikidata
rolling-stone
allmusic
rateyourmusic
curator-observation
other
```

Use source records when:

- ranks come from a list edition;
- contributor or studio facts are copied from a reference;
- pressing details come from Discogs or the physical copy;
- facts conflict across sources;
- a note represents personal listening/research rather than external fact.

## External references

External references belong on albums, artists, people, labels, studios, physical copies, and sources.

```json
{
  "externalRefs": [
    {
      "system": "musicbrainz-release-group",
      "id": "f5093c06-23e3-404f-aeaa-40f72885ee3a",
      "url": "https://musicbrainz.org/release-group/f5093c06-23e3-404f-aeaa-40f72885ee3a"
    },
    {
      "system": "discogs-master",
      "id": "5460",
      "url": "https://www.discogs.com/master/5460"
    }
  ]
}
```

Recommended systems:

```text
discogs-master
discogs-release
musicbrainz-release-group
musicbrainz-release
musicbrainz-artist
wikidata
wikipedia
allmusic
rateyourmusic
official-site
rolling-stone-entry
```

## Notes

Notes should be files when they are more than a sentence.

Album note template:

```markdown
# Kind of Blue

## Why it matters

## Recording / production

## Relationships to follow

## Pressing notes

## Listening notes

## Open questions

## Sources
```

Research note template:

```markdown
# Modal jazz trail

## Question

## Albums involved

## People involved

## What I found

## Relationships to add

## Sources
```

Keep important structured facts in JSON too. Notes are for context, interpretation, questions, and prose.

## Covers and media files

Cover paths should be relative to the repository root:

```json
{
  "cover": "covers/album-kind-of-blue.jpg"
}
```

Guidelines:

- Covers are optional for MVP.
- Missing cover files should warn, not block the app.
- Prefer local files for data ownership.
- Preserve source/copyright notes where appropriate.
- Do not hotlink third-party cover images in canonical data unless deliberately accepted.

## How to provide data manually

For each album, collect data in this order:

1. Assign stable album ID.
2. Enter title, primary artist, release year, ownership state.
3. Add Rolling Stone list appearances for the relevant editions.
4. Add physical copy record if owned or ordered.
5. Add label, genres, studios, and core contributors.
6. Add source references for list and factual metadata.
7. Add explicit relationships that are not derivable from structured fields.
8. Add notes for research, listening impressions, and open questions.
9. Run validation.
10. Commit the JSON and notes together.

Minimum useful album entry:

```json
{
  "id": "album-kind-of-blue",
  "type": "album",
  "title": "Kind of Blue",
  "primaryArtistId": "artist-miles-davis",
  "releaseYear": 1959,
  "ownershipState": "owned"
}
```

Minimum useful list appearance:

```json
{
  "albumId": "album-kind-of-blue",
  "editionId": "list-rolling-stone-2020",
  "rank": 31,
  "sourceConfidence": "verified"
}
```

Minimum useful physical copy:

```json
{
  "id": "copy-kind-of-blue-001",
  "type": "physical-copy",
  "albumId": "album-kind-of-blue",
  "ownershipState": "owned",
  "format": "LP"
}
```

## How to import external data

External sources should be treated as drafts until reviewed.

Recommended import workflow:

1. Import raw source into a staging file under `data/imports/`.
2. Normalize IDs and field names.
3. Match imported records to existing IDs.
4. Mark unmatched records for curator review.
5. Preserve original source IDs in `externalRefs`.
6. Set `confidence` to `imported` until reviewed.
7. Run validation.
8. Promote reviewed records into canonical data files.
9. Keep or discard staging files deliberately.

Never overwrite curated notes or physical-copy details from an external import without showing a diff.

## Graph and search implications

The app can derive useful graph edges only from structured fields.

To support search, collect:

- title
- primary artist name
- aliases
- contributor names
- studio names
- label names
- genre names
- tags
- notes text or note summaries
- catalogue numbers

To support graph exploration, collect:

- contributor credits with roles
- studios
- labels
- genres
- locations
- list appearances
- explicit influence/sample/cover/curator relationships

To support path finding, prioritize rarer, meaningful links:

- people
- studios
- producers
- engineers
- labels in specific periods
- curated relationships

Down-weight broad links:

- very broad genres
- giant labels
- list membership alone
- same decade alone

## Validation contract

Validation should eventually check:

- Every entity has an ID and type.
- IDs match the allowed format.
- IDs are unique across all entity collections.
- Album `primaryArtistId` exists.
- Album references to genres, labels, studios, contributors, notes, and covers are valid or warned clearly.
- Physical copy `albumId` exists.
- List appearance `albumId` and `editionId` exist.
- Each list edition has no duplicate rank.
- Relationship source and target IDs exist.
- Relationship types are supported.
- Ownership states are supported.
- Dates are valid ISO strings where exact dates are used.
- Release years are plausible integers.
- Confidence values are supported.
- Source IDs exist when referenced.
- Broad genre relationships are hidden or down-weighted by default.

## Seed dataset recommendation

For the first real seed, collect 10–20 albums that deliberately exercise the model:

- Albums appearing in at least two Rolling Stone editions.
- At least one owned album, one wanted album, and one missing album.
- At least two albums sharing a contributor.
- At least two albums sharing a producer.
- At least two albums sharing a studio.
- At least two albums sharing a label.
- At least one album with a physical copy record.
- At least one album with a research note.
- At least one explicit curated relationship not derivable from fields.

Good test clusters are better than famous-only selections. The first dataset should reveal whether the graph explains connections clearly.

## Open decisions

- Whether contributor credits should be embedded in albums for v0.1 or split into `contributor-credits.json` immediately.
- Whether album IDs should follow MusicBrainz release-group IDs internally or remain human-readable local IDs with external references.
- Whether Rolling Stone list data should be hand-entered, imported from a prepared CSV, or transformed from another maintained source.
- Whether source citations should be required for every factual metadata field or only for list ranks, contributor credits, studio facts, and physical-copy identification.
- Whether cover images should be committed to the repo or handled as an optional local asset package.

## First implementation target

The first validator and UI should support this subset:

- Albums.
- Artists.
- People.
- Labels.
- Studios.
- Genres.
- List editions.
- List appearances.
- Physical copies.
- Sources.
- Explicit relationships.
- Embedded contributor credits on albums.

Defer these until the app has a working browsing and graph loop:

- Track-level credits.
- Detailed release variants beyond owned copies.
- Full purchase history.
- Coordinates for every location.
- Automated source import.
- Audio metadata.
- Recommendation metadata.
