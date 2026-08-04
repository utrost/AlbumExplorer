import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFocusedGraph } from '../../src/views/focused-graph-view.js';

const rows = [
  { id: 'album-a', artist: 'Artist A', album: 'Album A', latestRank: 1 },
  { id: 'album-b', artist: 'Artist B', album: 'Album B', latestRank: 2 },
  { id: 'album-c', artist: 'Artist C', album: 'Album C', latestRank: 3 },
  { id: 'album-d', artist: 'Artist D', album: 'Album D', latestRank: 4 }
];

const relationships = [
  {
    pairKey: 'album-a::album-b',
    from: 'album-a',
    to: 'album-b',
    types: ['shared-label', 'shared-genre'],
    weight: 5.1,
    explanations: ['Both albums are connected through the label Motown.', 'Both albums share the genre/tag soul.']
  },
  {
    pairKey: 'album-a::album-c',
    from: 'album-a',
    to: 'album-c',
    types: ['same-list-edition'],
    weight: 3.0,
    explanations: ['Both albums appear in the 2024 Rolling Stone 500.']
  },
  {
    pairKey: 'album-a::album-d',
    from: 'album-a',
    to: 'album-d',
    types: ['shared-genre'],
    weight: 2.0,
    explanations: ['Both albums share the genre/tag funk.']
  }
];

test('builds a selected-album focused graph with deterministic radial node positions', () => {
  const graph = buildFocusedGraph({ selectedAlbumId: 'album-a', rows, relationships, limit: 2 });

  assert.equal(graph.selectedAlbumId, 'album-a');
  assert.deepEqual(graph.nodes.map((node) => [node.id, node.kind]), [
    ['album-a', 'selected'],
    ['album-b', 'related'],
    ['album-c', 'related']
  ]);
  assert.deepEqual(graph.edges.map((edge) => [edge.from, edge.to, edge.weight]), [
    ['album-a', 'album-b', 5.1],
    ['album-a', 'album-c', 3.0]
  ]);
  assert.deepEqual(graph.nodes.map((node) => [node.x, node.y]), [
    [50, 50],
    [84, 50],
    [16, 50]
  ]);
});

test('filters focused graph edges by allowed relationship type and preserves explanations', () => {
  const graph = buildFocusedGraph({
    selectedAlbumId: 'album-a',
    rows,
    relationships,
    allowedTypes: ['shared-label'],
    limit: 10
  });

  assert.deepEqual(graph.nodes.map((node) => node.id), ['album-a', 'album-b']);
  assert.equal(graph.edges.length, 1);
  assert.equal(graph.edges[0].types.includes('shared-label'), true);
  assert.deepEqual(graph.edges[0].explanations, relationships[0].explanations);
});

test('returns an empty focused graph when selected album is unknown', () => {
  const graph = buildFocusedGraph({ selectedAlbumId: 'missing', rows, relationships });

  assert.deepEqual(graph, { selectedAlbumId: 'missing', nodes: [], edges: [] });
});
