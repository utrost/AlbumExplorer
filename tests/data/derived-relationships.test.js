import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { buildAlbumRelationships, getRelatedAlbums } from '../../src/data/derived-relationships.js';
import { buildEnrichedComparisonRows } from '../../src/data/enriched-comparison.js';

const rows = [
  {
    id: 'album-a',
    artist: 'Artist A',
    album: 'Album A',
    releaseYear: 1971,
    labels: ['Motown'],
    genres: ['soul', 'funk'],
    ranks: { 2003: 10, 2024: 1 },
    appearances: [
      { editionYear: 2003, rank: 10 },
      { editionYear: 2024, rank: 1 }
    ]
  },
  {
    id: 'album-b',
    artist: 'Artist B',
    album: 'Album B',
    releaseYear: 1972,
    labels: ['Motown'],
    genres: ['soul'],
    ranks: { 2024: 2 },
    appearances: [{ editionYear: 2024, rank: 2 }]
  },
  {
    id: 'album-c',
    artist: 'Artist C',
    album: 'Album C',
    releaseYear: 1997,
    labels: ['Parlophone'],
    genres: ['alternative rock'],
    ranks: { 2024: 3 },
    appearances: [{ editionYear: 2024, rank: 3 }]
  }
];

test('builds deterministic explainable relationships from shared metadata and list appearances', () => {
  const relationships = buildAlbumRelationships(rows);

  const ab = relationships.find((relationship) => relationship.from === 'album-a' && relationship.to === 'album-b');
  assert.ok(ab, 'expected a relationship from album-a to album-b');
  assert.equal(ab.pairKey, 'album-a::album-b');
  assert.equal(ab.weight, 5.1);
  assert.deepEqual(ab.types, ['shared-label', 'shared-genre', 'same-list-edition', 'adjacent-release-period']);
  assert.deepEqual(ab.explanations, [
    'Both albums are connected through the label Motown.',
    'Both albums share the genre/tag soul.',
    'Both albums appear in the 2024 Rolling Stone 500.',
    'Both albums were released within 1 year of each other.'
  ]);
});

test('orders related albums by relationship weight and keeps reverse lookup explainable', () => {
  const relationships = buildAlbumRelationships(rows);
  const related = getRelatedAlbums('album-b', rows, relationships, { limit: 2 });

  assert.equal(related.length, 2);
  assert.equal(related[0].album.id, 'album-a');
  assert.equal(related[0].relationship.weight, 5.1);
  assert.equal(related[0].relationship.direction, 'reverse');
  assert.match(related[0].relationship.explanations.join(' '), /label Motown/);
  assert.equal(related[1].album.id, 'album-c');
  assert.deepEqual(related[1].relationship.types, ['same-list-edition']);
});

test('filters related albums by allowed relationship types', () => {
  const relationships = buildAlbumRelationships(rows);

  const labelRelated = getRelatedAlbums('album-b', rows, relationships, { allowedTypes: ['shared-label'], limit: 5 });
  assert.deepEqual(labelRelated.map((item) => item.album.id), ['album-a']);
  assert.equal(labelRelated[0].relationship.types.includes('shared-label'), true);

  const listRelated = getRelatedAlbums('album-b', rows, relationships, { allowedTypes: ['same-list-edition'], limit: 5 });
  assert.deepEqual(listRelated.map((item) => item.album.id), ['album-a', 'album-c']);
});

test('keeps explanations typed so filtered views can highlight the matching reason', async () => {
  const { matchingRelationshipExplanations } = await import('../../src/data/derived-relationships.js');
  const relationships = buildAlbumRelationships(rows);
  const ab = relationships.find((relationship) => relationship.pairKey === 'album-a::album-b');

  assert.deepEqual(ab.typedExplanations, [
    { type: 'shared-label', text: 'Both albums are connected through the label Motown.' },
    { type: 'shared-genre', text: 'Both albums share the genre/tag soul.' },
    { type: 'same-list-edition', text: 'Both albums appear in the 2024 Rolling Stone 500.' },
    { type: 'adjacent-release-period', text: 'Both albums were released within 1 year of each other.' }
  ]);
  assert.deepEqual(matchingRelationshipExplanations(ab, ['shared-label']), [
    'Both albums are connected through the label Motown.'
  ]);
  assert.deepEqual(matchingRelationshipExplanations(ab, []), ab.explanations);
});

test('returns matching relationship evidence with provenance objects intact', async () => {
  const { matchingRelationshipEvidence } = await import('../../src/data/derived-relationships.js');
  const relationship = {
    explanations: ['generic fallback'],
    typedExplanations: [
      {
        type: 'shared-producer',
        text: 'Both albums credit Brian Eno as producer.',
        provenance: {
          sourceType: 'discogs-release',
          left: { albumId: 'album-a', masterId: 123, releaseId: 456, selectedBy: 'approved-master-override', masterUrl: 'https://www.discogs.com/master/123', releaseUrl: 'https://www.discogs.com/release/456' },
          right: { albumId: 'album-d', masterId: 789, releaseId: 1011, selectedBy: 'search-alias', masterUrl: 'https://www.discogs.com/master/789', releaseUrl: 'https://www.discogs.com/release/1011' }
        }
      },
      { type: 'shared-label', text: 'Both albums are connected through the label RCA.' }
    ]
  };

  assert.deepEqual(matchingRelationshipEvidence(relationship, ['shared-producer']), [relationship.typedExplanations[0]]);
  assert.deepEqual(matchingRelationshipEvidence(relationship, ['missing-type']), [{ type: 'explanation', text: 'generic fallback' }]);
});

test('builds explainable relationships from reviewable credit candidates with Discogs provenance', () => {
  const creditRows = [
    { id: 'album-a', artist: 'Artist A', album: 'Album A', labels: [], genres: [], ranks: {}, appearances: [] },
    { id: 'album-d', artist: 'Artist D', album: 'Album D', labels: [], genres: [], ranks: {}, appearances: [] }
  ];
  const creditCandidates = [
    {
      albumId: 'album-a',
      source: {
        type: 'discogs-release',
        masterId: 123,
        releaseId: 456,
        selectedBy: 'approved-master-override',
        urls: { master: 'https://www.discogs.com/master/123', release: 'https://www.discogs.com/release/456' }
      },
      credits: [
        { type: 'producer', name: 'Brian Eno' },
        { type: 'musician', name: 'Carlos Alomar' }
      ],
      studios: [{ name: 'Hansa Tonstudio' }]
    },
    {
      albumId: 'album-d',
      source: {
        type: 'discogs-release',
        masterId: 789,
        releaseId: 1011,
        selectedBy: 'search-alias',
        urls: { master: 'https://www.discogs.com/master/789', release: 'https://www.discogs.com/release/1011' }
      },
      credits: [
        { type: 'producer', name: 'Brian Eno' },
        { type: 'engineer', name: 'Tony Visconti' },
        { type: 'musician', name: 'Carlos Alomar' }
      ],
      studios: [{ name: 'Hansa Tonstudio' }]
    }
  ];

  const relationships = buildAlbumRelationships(creditRows, { minimumWeight: 1.0, creditCandidates });

  assert.equal(relationships.length, 1);
  assert.deepEqual(relationships[0].types, ['shared-producer', 'shared-musician', 'shared-studio']);
  assert.deepEqual(relationships[0].typedExplanations, [
    {
      type: 'shared-producer',
      text: 'Both albums credit Brian Eno as producer.',
      provenance: {
        sourceType: 'discogs-release',
        left: { albumId: 'album-a', masterId: 123, releaseId: 456, selectedBy: 'approved-master-override', masterUrl: 'https://www.discogs.com/master/123', releaseUrl: 'https://www.discogs.com/release/456' },
        right: { albumId: 'album-d', masterId: 789, releaseId: 1011, selectedBy: 'search-alias', masterUrl: 'https://www.discogs.com/master/789', releaseUrl: 'https://www.discogs.com/release/1011' }
      }
    },
    {
      type: 'shared-musician',
      text: 'Both albums credit Carlos Alomar as musician/performer.',
      provenance: {
        sourceType: 'discogs-release',
        left: { albumId: 'album-a', masterId: 123, releaseId: 456, selectedBy: 'approved-master-override', masterUrl: 'https://www.discogs.com/master/123', releaseUrl: 'https://www.discogs.com/release/456' },
        right: { albumId: 'album-d', masterId: 789, releaseId: 1011, selectedBy: 'search-alias', masterUrl: 'https://www.discogs.com/master/789', releaseUrl: 'https://www.discogs.com/release/1011' }
      }
    },
    {
      type: 'shared-studio',
      text: 'Both albums are connected to the studio/location Hansa Tonstudio.',
      provenance: {
        sourceType: 'discogs-release',
        left: { albumId: 'album-a', masterId: 123, releaseId: 456, selectedBy: 'approved-master-override', masterUrl: 'https://www.discogs.com/master/123', releaseUrl: 'https://www.discogs.com/release/456' },
        right: { albumId: 'album-d', masterId: 789, releaseId: 1011, selectedBy: 'search-alias', masterUrl: 'https://www.discogs.com/master/789', releaseUrl: 'https://www.discogs.com/release/1011' }
      }
    }
  ]);
});

test('omits weak genre-only relationships unless they meet the minimum weight', () => {
  const genreOnlyRows = [
    { id: 'album-a', artist: 'Artist A', album: 'Album A', labels: [], genres: ['rock'], ranks: {}, appearances: [] },
    { id: 'album-d', artist: 'Artist D', album: 'Album D', labels: [], genres: ['rock'], ranks: {}, appearances: [] }
  ];

  assert.deepEqual(buildAlbumRelationships(genreOnlyRows), []);
  assert.deepEqual(buildAlbumRelationships(genreOnlyRows, { minimumWeight: 0.5 }).map((relationship) => relationship.types), [['shared-genre']]);
});

test('builds the app startup relationship layer fast enough for browser startup', () => {
  const comparison = JSON.parse(readFileSync('data/rolling-stone-comparison.json', 'utf8'));
  const candidates = JSON.parse(readFileSync('data/enrichment/album-metadata-candidates.json', 'utf8'));
  const sourceCandidates = JSON.parse(readFileSync('data/enrichment/album-metadata-source-candidates.json', 'utf8'));
  const creditCandidates = JSON.parse(readFileSync('data/enrichment/album-credit-candidates.json', 'utf8'));
  const fullRows = buildEnrichedComparisonRows({ comparison, candidates, sourceCandidates });
  const appRelationshipTypes = ['shared-label', 'shared-producer', 'shared-engineer', 'shared-studio', 'shared-songwriter', 'shared-musician'];

  const startedAt = performance.now();
  const relationships = buildAlbumRelationships(fullRows, { minimumWeight: 2.0, allowedTypes: appRelationshipTypes, creditCandidates: creditCandidates.candidates ?? [] });
  const elapsedMs = performance.now() - startedAt;

  assert.equal(fullRows.length, 760);
  assert.equal(relationships.length, 9051);
  assert.ok(elapsedMs < 1500, `relationship build took ${elapsedMs.toFixed(1)}ms`);
});
