const SOURCE_ID = 'source-rolling-stone-top-500-csv';
const SCHEMA_VERSION = '0.1.0';

export function parseRollingStoneCsv(text) {
  const rows = parseCsv(text.replace(/^\uFEFF/, ''));
  if (rows.length === 0) return [];
  const headers = rows[0].map((header) => header.trim());
  return rows.slice(1)
    .filter((row) => row.some((value) => value.trim() !== ''))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])));
}

export function normalizeRollingStoneRows(rows) {
  const artistsById = new Map();
  const albumsByKey = new Map();
  const listAppearances = [];
  const physicalCopies = [];

  for (const row of rows) {
    const artistName = clean(row.Artist);
    const albumTitle = clean(row.Album);
    if (!artistName || !albumTitle) continue;

    const artistId = makeId('artist', artistName);
    if (!artistsById.has(artistId)) {
      artistsById.set(artistId, {
        id: artistId,
        type: 'artist',
        name: artistName,
        sortName: clean(row['Artist Sorted']) || artistName,
        artistType: 'unknown',
        aliases: [],
        externalRefs: [],
        sourceIds: [SOURCE_ID],
        confidence: 'imported'
      });
    }

    const albumId = makeId('album', `${artistName} ${albumTitle}`);
    if (!albumsByKey.has(albumId)) {
      const ownership = normalizeOwnership(clean(row.Owned));
      const album = {
        id: albumId,
        type: 'album',
        title: albumTitle,
        sortTitle: albumTitle,
        primaryArtistId: artistId,
        releaseYear: parseYear(clean(row.Year)),
        ownershipState: ownership.albumState,
        genreIds: [],
        labelIds: [],
        studioIds: [],
        contributorIds: [],
        credits: [],
        cover: null,
        notes: null,
        externalRefs: externalRefsFromDiscogs(clean(row['Discogs Master Release'])),
        sourceIds: [SOURCE_ID],
        confidence: 'imported',
        tags: ownership.tags
      };
      albumsByKey.set(albumId, album);

      if (ownership.physicalCopyFormat) {
        physicalCopies.push({
          id: makeId('copy', `${artistName} ${albumTitle} ${ownership.physicalCopyFormat} 001`),
          type: 'physical-copy',
          albumId,
          ownershipState: 'owned',
          format: ownership.physicalCopyFormat,
          sourceIds: [SOURCE_ID],
          confidence: 'imported'
        });
      }
    }

    addAppearance(listAppearances, row, albumId, 'Position 2012', 'list-rolling-stone-2012');
    addAppearance(listAppearances, row, albumId, 'Position 2020', 'list-rolling-stone-2020');
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: null,
    albums: [...albumsByKey.values()],
    artists: [...artistsById.values()],
    people: [],
    studios: [],
    labels: [],
    genres: [],
    locations: [],
    listEditions: [
      {
        id: 'list-rolling-stone-2012',
        type: 'list-edition',
        publication: 'Rolling Stone',
        title: 'The 500 Greatest Albums of All Time',
        editionYear: 2012,
        sourceIds: [SOURCE_ID],
        confidence: 'imported'
      },
      {
        id: 'list-rolling-stone-2020',
        type: 'list-edition',
        publication: 'Rolling Stone',
        title: 'The 500 Greatest Albums of All Time',
        editionYear: 2020,
        sourceIds: [SOURCE_ID],
        confidence: 'imported'
      }
    ],
    listAppearances,
    physicalCopies,
    relationships: [],
    sources: [
      {
        id: SOURCE_ID,
        type: 'source',
        title: 'Rolling Stone Top 500.xlsx CSV export',
        sourceType: 'curator-observation',
        url: null,
        accessedDate: null,
        publisher: 'Rolling Stone',
        notes: 'Staged CSV source file imported from data/imports/rolling-stone-top-500.csv.'
      }
    ]
  };
}

function addAppearance(listAppearances, row, albumId, column, editionId) {
  const rank = parseRank(clean(row[column]));
  if (rank === null) return;
  listAppearances.push({
    albumId,
    editionId,
    rank,
    listedTitle: clean(row.Album),
    listedArtist: clean(row.Artist),
    sourceConfidence: 'imported',
    sourceIds: [SOURCE_ID]
  });
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(field);
      field = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function normalizeOwnership(value) {
  const normalized = value.toLowerCase();
  if (normalized === '1') return { albumState: 'owned', tags: [], physicalCopyFormat: null };
  if (normalized === 'cd only') return { albumState: 'owned', tags: ['cd-only'], physicalCopyFormat: 'CD' };
  return { albumState: 'unknown', tags: [], physicalCopyFormat: null };
}

function parseRank(value) {
  if (!/^\d+$/.test(value)) return null;
  return Number(value);
}

function parseYear(value) {
  if (!/^\d+$/.test(value)) return null;
  return Number(value);
}

function externalRefsFromDiscogs(url) {
  if (!url) return [];
  const match = url.match(/\/master\/(\d+)/);
  return [{
    system: 'discogs-master',
    id: match ? match[1] : null,
    url
  }];
}

function makeId(type, value) {
  return `${type}-${slugify(value)}`;
}

function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function clean(value) {
  return String(value ?? '').trim();
}
