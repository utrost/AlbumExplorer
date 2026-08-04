const DISCOGS_SOURCE_PREFIX = 'source-discogs-master-';

export function enrichCollectionWithDiscogsMasters(collection, mastersById) {
  const next = structuredClone(collection);
  const genresById = new Map((next.genres ?? []).map((genre) => [genre.id, genre]));
  const sourcesById = new Map((next.sources ?? []).map((source) => [source.id, source]));

  next.genres = next.genres ?? [];
  next.sources = next.sources ?? [];

  next.albums = (next.albums ?? []).map((album) => {
    const masterRef = (album.externalRefs ?? []).find((ref) => ref.system === 'discogs-master' && ref.id);
    if (!masterRef) return album;

    const master = mastersById.get(String(masterRef.id));
    if (!master) return album;

    const sourceId = `${DISCOGS_SOURCE_PREFIX}${masterRef.id}`;
    if (!sourcesById.has(sourceId)) {
      const source = {
        id: sourceId,
        type: 'source',
        title: `Discogs master ${masterRef.id}: ${master.title ?? album.title}`,
        sourceType: 'discogs',
        url: master.uri ?? masterRef.url ?? null,
        accessedDate: null,
        publisher: 'Discogs',
        notes: 'Imported from the Discogs master API/cache. Review before treating as verified.'
      };
      sourcesById.set(sourceId, source);
      next.sources.push(source);
    }

    const genreIds = new Set(album.genreIds ?? []);
    for (const genreName of master.genres ?? []) {
      const genre = ensureGenre(next.genres, genresById, genreName, { broad: true, parentGenreIds: [] });
      genreIds.add(genre.id);
    }

    const broadGenreIds = (master.genres ?? []).map((name) => makeId('genre', name));
    for (const styleName of master.styles ?? []) {
      const style = ensureGenre(next.genres, genresById, styleName, { broad: false, parentGenreIds: broadGenreIds.filter((id) => id !== makeId('genre', styleName)) });
      genreIds.add(style.id);
    }

    return {
      ...album,
      genreIds: [...genreIds],
      coverCandidates: coverCandidatesFromDiscogs(master),
      sourceIds: unique([...(album.sourceIds ?? []), sourceId])
    };
  });

  return next;
}

function ensureGenre(genres, genresById, name, defaults) {
  const id = makeId('genre', name);
  if (!genresById.has(id)) {
    const genre = {
      id,
      type: 'genre',
      name,
      parentGenreIds: defaults.parentGenreIds,
      broad: defaults.broad,
      aliases: [],
      sourceIds: []
    };
    genresById.set(id, genre);
    genres.push(genre);
  }
  return genresById.get(id);
}

function coverCandidatesFromDiscogs(master) {
  return (master.images ?? []).map((image) => ({
    source: 'discogs',
    type: image.type ?? 'secondary',
    url: image.uri ?? null,
    thumbnailUrl: image.uri150 ?? null,
    width: image.width ?? null,
    height: image.height ?? null,
    confidence: 'imported'
  })).filter((candidate) => candidate.url || candidate.thumbnailUrl);
}

function makeId(type, value) {
  return `${type}-${slugify(value)}`;
}

function slugify(value) {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function unique(values) {
  return [...new Set(values)];
}
