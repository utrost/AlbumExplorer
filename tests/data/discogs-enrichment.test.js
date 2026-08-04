import test from 'node:test';
import assert from 'node:assert/strict';
import { enrichCollectionWithDiscogsMasters } from '../../src/data/discogs-enrichment.js';

const collection = {
  schemaVersion: '0.1.0',
  generatedAt: null,
  albums: [
    {
      id: 'album-marvin-gaye-whats-going-on',
      type: 'album',
      title: "What's Going On",
      primaryArtistId: 'artist-marvin-gaye',
      releaseYear: 1971,
      ownershipState: 'owned',
      genreIds: [],
      labelIds: [],
      studioIds: [],
      contributorIds: [],
      credits: [],
      cover: null,
      externalRefs: [{ system: 'discogs-master', id: '66631', url: 'https://www.discogs.com/master/66631' }],
      sourceIds: ['source-rolling-stone-top-500-csv'],
      confidence: 'imported',
      tags: []
    }
  ],
  artists: [{ id: 'artist-marvin-gaye', type: 'artist', name: 'Marvin Gaye' }],
  genres: [],
  sources: [{ id: 'source-rolling-stone-top-500-csv', type: 'source', title: 'CSV' }],
  listEditions: [],
  listAppearances: [],
  people: [],
  studios: [],
  labels: [],
  locations: [],
  physicalCopies: [],
  relationships: []
};

const discogsMaster = {
  id: 66631,
  title: "What's Going On",
  year: 1971,
  uri: 'https://www.discogs.com/master/66631-Marvin-Gaye-Whats-Going-On',
  genres: ['Funk / Soul'],
  styles: ['Soul'],
  images: [
    {
      type: 'primary',
      uri: 'https://i.discogs.com/full.jpeg',
      uri150: 'https://i.discogs.com/thumb.jpeg',
      width: 600,
      height: 600
    }
  ]
};

test('enriches albums with Discogs genres, styles, source, and cover candidates', () => {
  const enriched = enrichCollectionWithDiscogsMasters(collection, new Map([['66631', discogsMaster]]));
  const album = enriched.albums[0];

  assert.deepEqual(album.genreIds, ['genre-funk-soul', 'genre-soul']);
  assert.equal(album.coverCandidates[0].source, 'discogs');
  assert.equal(album.coverCandidates[0].thumbnailUrl, 'https://i.discogs.com/thumb.jpeg');
  assert.ok(album.sourceIds.includes('source-discogs-master-66631'));
  assert.equal(enriched.genres.find((genre) => genre.id === 'genre-funk-soul').name, 'Funk / Soul');
  assert.equal(enriched.genres.find((genre) => genre.id === 'genre-soul').parentGenreIds[0], 'genre-funk-soul');
  assert.equal(enriched.sources.find((source) => source.id === 'source-discogs-master-66631').sourceType, 'discogs');
});

test('leaves albums unchanged when no Discogs master cache is available', () => {
  const enriched = enrichCollectionWithDiscogsMasters(collection, new Map());

  assert.deepEqual(enriched.albums[0].genreIds, []);
  assert.equal(enriched.genres.length, 0);
});
