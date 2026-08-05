import { validateCollection } from './data/validator.js';
import { buildIndexes } from './data/indexes.js';
import { buildEnrichedComparisonRows, filterRows, sortRows } from './data/enriched-comparison.js';
import { buildAlbumRelationships, getRelatedAlbums } from './data/derived-relationships.js';
import { buildFocusedGraph } from './views/focused-graph-view.js';
import { findAlbumPath } from './graph/path-finder.js';

const app = document.querySelector('#app');
const state = {
  rows: [],
  filteredRows: [],
  selectedId: null,
  collection: null,
  validation: null,
  indexes: null,
  sourceCandidates: null,
  relationships: null,
  pathDestinationId: null,
  filters: {
    search: '',
    editionYear: 'all',
    editionCount: 'all',
    metadataStatus: 'all',
    musicBrainzMatchStatus: 'all'
  },
  sortKey: 'latest-rank'
};

start();

async function start() {
  try {
    const [collection, comparison, candidates, sourceCandidates] = await Promise.all([
      loadJson('./data/collection.json'),
      loadJson('./data/rolling-stone-comparison.json'),
      loadJson('./data/enrichment/album-metadata-candidates.json'),
      loadJson('./data/enrichment/album-metadata-source-candidates.json')
    ]);
    const validation = validateCollection(collection);
    const indexes = buildIndexes(collection);
    state.collection = collection;
    state.validation = validation;
    state.indexes = indexes;
    state.sourceCandidates = sourceCandidates;
    state.rows = buildEnrichedComparisonRows({ comparison, candidates, sourceCandidates });
    state.relationships = buildAlbumRelationships(state.rows, { minimumWeight: 2.0 });
    state.selectedId = state.rows[0]?.id ?? null;
    state.pathDestinationId = state.rows[1]?.id ?? state.rows[0]?.id ?? null;
    renderApp();
  } catch (error) {
    renderError(error);
  }
}

async function loadJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function renderApp() {
  const collection = state.collection;
  const validation = state.validation;
  const indexes = state.indexes;
  const sourceCandidates = state.sourceCandidates;
  const fatal = validation.errors.length > 0;
  const musicBrainzCount = state.rows.filter((row) => row.metadataStatus === 'musicbrainz').length;
  const baselineCount = state.rows.filter((row) => row.metadataStatus === 'baseline').length;
  const fourEditionCount = state.rows.filter((row) => row.editionCount === 4).length;
  state.filteredRows = sortRows(filterRows(state.rows, state.filters), state.sortKey);
  const selected = state.filteredRows.find((row) => row.id === state.selectedId) ?? state.filteredRows[0] ?? state.rows[0];
  state.selectedId = selected?.id ?? null;
  const relatedAlbums = selected ? getRelatedAlbums(selected.id, state.rows, state.relationships, { limit: 6 }) : [];
  const focusedGraph = selected ? buildFocusedGraph({ selectedAlbumId: selected.id, rows: state.rows, relationships: state.relationships, limit: 10 }) : null;
  const pathResult = selected && state.pathDestinationId ? findAlbumPath({ startAlbumId: selected.id, endAlbumId: state.pathDestinationId, relationships: state.relationships, maxDepth: 3 }) : null;

  app.innerHTML = `
    <header class="hero">
      <p class="eyebrow">File-first Rolling Stone atlas</p>
      <h1>AlbumExplorer</h1>
      <p class="lede">Browse ${state.rows.length} stable album identities across the Rolling Stone 500 editions, with reviewable MusicBrainz metadata layered on top.</p>
    </header>

    <section class="panel ${fatal ? 'panel-error' : ''}">
      <h2>Data health</h2>
      <ul class="metrics">
        <li><strong>${state.rows.length}</strong><span>comparison albums</span></li>
        <li><strong>${musicBrainzCount}</strong><span>MusicBrainz matched</span></li>
        <li><strong>${baselineCount}</strong><span>Rolling Stone baseline</span></li>
        <li><strong>${fourEditionCount}</strong><span>in all 4 editions</span></li>
        <li><strong>${state.relationships.length}</strong><span>explainable relationships</span></li>
        <li><strong>${sourceCandidates.review?.length ?? 0}</strong><span>MB review</span></li>
        <li><strong>${sourceCandidates.gaps?.length ?? 0}</strong><span>MB gaps</span></li>
      </ul>
      ${fatal ? renderMessages(validation.errors.slice(0, 10)) : '<p class="ok">No fatal seed validation errors. Generated comparison and enrichment data loaded.</p>'}
    </section>

    <section class="panel browser-panel">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Comparison browser</p>
          <h2>Rolling Stone 500 × metadata</h2>
        </div>
        <p class="muted">Showing <strong>${state.filteredRows.length}</strong> of ${state.rows.length}</p>
      </div>
      ${renderControls()}
      <div class="comparison-layout">
        <div class="table-wrap">
          ${renderComparisonTable(state.filteredRows.slice(0, 250))}
        </div>
        ${selected ? renderAlbumDetail(selected, relatedAlbums, focusedGraph, pathResult) : '<aside class="detail-panel"><p>No album selected.</p></aside>'}
      </div>
    </section>

    <section class="panel compact-seed">
      <h2>Seed collection prototype</h2>
      <p class="muted">The original tiny collection seed still loads separately: ${collection.albums.length} albums from <code>data/collection.json</code>.</p>
      <ol class="album-list compact-list">
        ${collection.albums.slice(0, 8).map((album) => renderSeedAlbum(album, indexes)).join('')}
      </ol>
    </section>
  `;

  bindInteractions();
}

function renderControls() {
  return `
    <form class="controls" data-testid="comparison-controls">
      <label>Search
        <input data-testid="comparison-search" name="search" type="search" placeholder="artist or album" value="${escapeAttribute(state.filters.search)}">
      </label>
      <label>Edition
        <select data-testid="edition-filter" name="editionYear">
          ${option('all', 'Any edition', state.filters.editionYear)}
          ${option('2003', '2003', state.filters.editionYear)}
          ${option('2012', '2012', state.filters.editionYear)}
          ${option('2020', '2020', state.filters.editionYear)}
          ${option('2024', '2024', state.filters.editionYear)}
        </select>
      </label>
      <label>Appears in
        <select name="editionCount">
          ${option('all', 'Any count', state.filters.editionCount)}
          ${option('4', 'All 4 editions', state.filters.editionCount)}
          ${option('3', '3 editions', state.filters.editionCount)}
          ${option('2', '2 editions', state.filters.editionCount)}
          ${option('1', '1 edition', state.filters.editionCount)}
        </select>
      </label>
      <label>Metadata
        <select data-testid="metadata-filter" name="metadataStatus">
          ${option('all', 'Any metadata', state.filters.metadataStatus)}
          ${option('musicbrainz', 'MusicBrainz', state.filters.metadataStatus)}
          ${option('baseline', 'Rolling Stone baseline', state.filters.metadataStatus)}
        </select>
      </label>
      <label>MB status
        <select name="musicBrainzMatchStatus">
          ${option('all', 'Any MB status', state.filters.musicBrainzMatchStatus)}
          ${option('matched', 'Matched', state.filters.musicBrainzMatchStatus)}
          ${option('gap', 'Gap', state.filters.musicBrainzMatchStatus)}
          ${option('review', 'Review', state.filters.musicBrainzMatchStatus)}
        </select>
      </label>
      <label>Sort
        <select name="sortKey">
          ${option('latest-rank', 'Latest rank', state.sortKey)}
          ${option('artist', 'Artist', state.sortKey)}
          ${option('release-year', 'Release year', state.sortKey)}
          ${option('edition-count', 'Edition count', state.sortKey)}
          ${option('rank-movement', 'Rank movement', state.sortKey)}
        </select>
      </label>
    </form>
  `;
}

function renderComparisonTable(rows) {
  return `
    <table class="comparison-table" data-testid="comparison-table">
      <thead>
        <tr>
          <th>Latest</th>
          <th>Album</th>
          <th>Ranks</th>
          <th>Metadata</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(renderComparisonRow).join('')}
      </tbody>
    </table>
    ${state.filteredRows.length > rows.length ? `<p class="muted table-note">Showing first ${rows.length} filtered rows. Narrow the filters to inspect deeper results.</p>` : ''}
  `;
}

function renderComparisonRow(row) {
  const selected = row.id === state.selectedId ? ' selected' : '';
  return `
    <tr class="comparison-row${selected}" data-album-id="${escapeAttribute(row.id)}" tabindex="0">
      <td class="rank-cell">${row.latestRank ? `#${row.latestRank}` : '—'}<span>${row.latestEditionYear ?? ''}</span></td>
      <td><strong>${escapeHtml(row.album)}</strong><span>${escapeHtml(row.artist)} · ${row.releaseYear ?? 'year unknown'}</span></td>
      <td>${renderRankBadges(row)}</td>
      <td>${renderMetadataBadge(row)}</td>
    </tr>
  `;
}

function renderAlbumDetail(row, relatedAlbums = [], focusedGraph = null, pathResult = null) {
  return `
    <aside class="detail-panel" data-testid="album-detail">
      <p class="eyebrow">Selected album</p>
      <h2>${escapeHtml(row.album)}</h2>
      <p class="detail-artist">${escapeHtml(row.artist)} · ${row.releaseYear ?? 'year unknown'}</p>
      <dl class="detail-list">
        <div><dt>Release date</dt><dd>${escapeHtml(row.releaseDate ?? 'not enriched yet')}</dd></div>
        <div><dt>Metadata source</dt><dd>${renderMetadataBadge(row)}</dd></div>
        <div><dt>MusicBrainz status</dt><dd>${escapeHtml(row.musicBrainzMatchStatus)}</dd></div>
        <div><dt>Labels</dt><dd>${escapeHtml(row.labels.join(', ') || 'none yet')}</dd></div>
        <div><dt>Genres/tags</dt><dd>${escapeHtml(formatList(row.genres, 10))}</dd></div>
      </dl>
      <h3>Rank history</h3>
      <ol class="rank-history">
        ${row.appearances.map((appearance) => `<li><strong>${appearance.editionYear}</strong><span>#${appearance.rank}</span><em>${escapeHtml(appearance.label ?? '')}</em></li>`).join('')}
      </ol>
      <h3>Focused graph</h3>
      ${renderFocusedGraph(focusedGraph)}
      <h3>Path finder</h3>
      ${renderPathFinder(row, pathResult)}
      <h3>Related albums</h3>
      ${renderRelatedAlbums(relatedAlbums)}
      ${row.musicBrainzUrl ? `<p><a class="external-link" href="${escapeAttribute(row.musicBrainzUrl)}" target="_blank" rel="noreferrer">Open MusicBrainz release group</a></p>` : '<p class="muted">No MusicBrainz release-group link yet.</p>'}
    </aside>
  `;
}

function renderPathFinder(row, pathResult) {
  const destinationId = state.pathDestinationId ?? row.id;
  const rowById = new Map(state.rows.map((item) => [item.id, item]));
  return `
    <section class="path-finder" data-testid="path-finder">
      <label>Destination
        <select data-testid="path-destination" name="pathDestinationId">
          ${state.rows.slice(0, 250).map((album) => option(album.id, `${album.artist} — ${album.album}`, destinationId)).join('')}
        </select>
      </label>
      ${renderPathResult(pathResult, rowById)}
    </section>
  `;
}

function renderPathResult(pathResult, rowById) {
  if (!pathResult) return '<p class="muted">Choose a destination to find a path.</p>';
  if (!pathResult.found) return `<p class="muted">No path found within ${pathResult.maxDepth} hops.</p>`;
  if (pathResult.reason === 'same-album') return '<p class="muted">Start and destination are the same album.</p>';
  return `
    <ol class="path-steps">
      ${pathResult.hops.map((hop) => {
        const from = rowById.get(hop.from);
        const to = rowById.get(hop.to);
        return `
          <li>
            <button type="button" data-path-album-id="${escapeAttribute(hop.to)}">
              <strong>${escapeHtml(from?.album ?? hop.from)}</strong>
              <span>→</span>
              <strong>${escapeHtml(to?.album ?? hop.to)}</strong>
            </button>
            <p>${escapeHtml(hop.relationship.explanations[0] ?? hop.relationship.types.join(', '))}</p>
          </li>
        `;
      }).join('')}
    </ol>
  `;
}

function renderFocusedGraph(graph) {
  if (!graph?.nodes?.length) return '<p class="muted" data-testid="focused-graph">No graph neighborhood yet.</p>';
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  return `
    <figure class="focused-graph" data-testid="focused-graph">
      <svg viewBox="0 0 100 100" role="img" aria-label="Focused graph for selected album">
        ${graph.edges.map((edge) => {
          const from = nodeById.get(edge.from);
          const to = nodeById.get(edge.to);
          if (!from || !to) return '';
          return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke-width="${Math.min(4, 1 + edge.weight / 3).toFixed(2)}"><title>${escapeHtml(edge.explanations[0] ?? edge.types.join(', '))}</title></line>`;
        }).join('')}
        ${graph.nodes.map((node) => `
          <g class="graph-node ${escapeAttribute(node.kind)}" data-graph-album-id="${escapeAttribute(node.id)}" tabindex="0" role="button" aria-label="Select ${escapeAttribute(node.label)} by ${escapeAttribute(node.artist)}" transform="translate(${node.x} ${node.y})">
            <circle r="${node.kind === 'selected' ? 7 : 5}"><title>${escapeHtml(node.label)} — ${escapeHtml(node.artist)}</title></circle>
            <text y="${node.kind === 'selected' ? -10 : -7}" text-anchor="middle">${escapeHtml(shortLabel(node.label))}</text>
          </g>
        `).join('')}
      </svg>
      <figcaption class="muted">Selected album plus ${graph.nodes.length - 1} strongest neighbors. Edge thickness follows relationship weight.</figcaption>
    </figure>
  `;
}

function renderRelatedAlbums(relatedAlbums) {
  if (relatedAlbums.length === 0) return '<p class="muted" data-testid="related-albums">No strong relationships yet.</p>';
  return `
    <ol class="related-albums" data-testid="related-albums">
      ${relatedAlbums.map(({ album, relationship }) => `
        <li>
          <button type="button" data-related-album-id="${escapeAttribute(album.id)}">
            <strong>${escapeHtml(album.album)}</strong>
            <span>${escapeHtml(album.artist)} · weight ${relationship.weight}</span>
          </button>
          <ul>
            ${relationship.explanations.slice(0, 3).map((explanation) => `<li>${escapeHtml(explanation)}</li>`).join('')}
          </ul>
        </li>
      `).join('')}
    </ol>
  `;
}

function renderRankBadges(row) {
  return [2003, 2012, 2020, 2024]
    .map((year) => `<span class="rank-badge ${row.ranks[year] ? '' : 'empty'}">${year}: ${row.ranks[year] ? `#${row.ranks[year]}` : '—'}</span>`)
    .join('');
}

function renderMetadataBadge(row) {
  const label = row.metadataStatus === 'musicbrainz' ? 'MusicBrainz' : row.metadataStatus === 'baseline' ? 'RS baseline' : 'Unknown';
  return `<span class="metadata-badge ${escapeAttribute(row.metadataStatus)}">${label}</span>`;
}

function renderSeedAlbum(album, indexes) {
  const appearances = indexes.listAppearancesByAlbumId.get(album.id) ?? [];
  const artist = indexes.artistsById.get(album.primaryArtistId);
  return `
    <li class="album-card">
      <h3>${escapeHtml(album.title)}</h3>
      <p>${escapeHtml(artist?.name ?? album.primaryArtistId)} · ${album.releaseYear ?? 'year unknown'} · ${escapeHtml(album.ownershipState)}</p>
      <p class="muted">${appearances.map((item) => `${item.editionId.replace('list-rolling-stone-', 'RS ')} #${item.rank}`).join(' · ') || 'No list appearance'}</p>
    </li>
  `;
}

function bindInteractions() {
  const controls = app.querySelector('[data-testid="comparison-controls"]');
  controls?.addEventListener('input', updateFromControls);
  controls?.addEventListener('change', updateFromControls);
  for (const row of app.querySelectorAll('.comparison-row')) {
    row.addEventListener('click', () => selectAlbum(row.dataset.albumId));
    row.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') selectAlbum(row.dataset.albumId);
    });
  }
  for (const button of app.querySelectorAll('[data-related-album-id]')) {
    button.addEventListener('click', () => selectAlbum(button.dataset.relatedAlbumId));
  }
  for (const node of app.querySelectorAll('[data-graph-album-id]')) {
    node.addEventListener('click', () => selectAlbum(node.dataset.graphAlbumId));
    node.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') selectAlbum(node.dataset.graphAlbumId);
    });
  }
  const pathDestination = app.querySelector('[data-testid="path-destination"]');
  pathDestination?.addEventListener('change', () => {
    state.pathDestinationId = pathDestination.value;
    renderApp();
  });
  for (const button of app.querySelectorAll('[data-path-album-id]')) {
    button.addEventListener('click', () => selectAlbum(button.dataset.pathAlbumId));
  }
}

function updateFromControls(event) {
  const form = event.currentTarget;
  const data = new FormData(form);
  state.filters = {
    search: data.get('search') ?? '',
    editionYear: data.get('editionYear') ?? 'all',
    editionCount: data.get('editionCount') ?? 'all',
    metadataStatus: data.get('metadataStatus') ?? 'all',
    musicBrainzMatchStatus: data.get('musicBrainzMatchStatus') ?? 'all'
  };
  state.sortKey = data.get('sortKey') ?? 'latest-rank';
  renderApp();
}

function selectAlbum(albumId) {
  state.selectedId = albumId;
  renderApp();
}

function renderMessages(messages) {
  return `<ul>${messages.map((message) => `<li><code>${escapeHtml(message.code)}</code>: ${escapeHtml(message.message)}</li>`).join('')}</ul>`;
}

function renderError(error) {
  app.innerHTML = `
    <section class="panel panel-error">
      <h1>AlbumExplorer could not start</h1>
      <p>${escapeHtml(error.message)}</p>
    </section>
  `;
}

function option(value, label, selectedValue) {
  return `<option value="${escapeAttribute(value)}" ${String(value) === String(selectedValue) ? 'selected' : ''}>${escapeHtml(label)}</option>`;
}

function formatList(values, limit) {
  if (!values?.length) return 'none yet';
  const shown = values.slice(0, limit).join(', ');
  const remaining = values.length - limit;
  return remaining > 0 ? `${shown} (+${remaining} more)` : shown;
}

function shortLabel(value) {
  const text = String(value ?? '');
  return text.length > 18 ? `${text.slice(0, 16)}…` : text;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('`', '&#096;');
}
