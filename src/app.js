import { validateCollection } from './data/validator.js';
import { buildIndexes } from './data/indexes.js';
import { buildEnrichedComparisonRows, filterRows, sortRows } from './data/enriched-comparison.js';
import { buildAlbumRelationships, getRelatedAlbums, matchingRelationshipEvidence, matchingRelationshipExplanations } from './data/derived-relationships.js';
import { buildFocusedGraph } from './views/focused-graph-view.js';
import { findAlbumPath } from './graph/path-finder.js';
import {
  buildDiscogsReviewQueue,
  discogsReviewSnippet,
  filterDiscogsReviewQueue,
  nextDiscogsReviewItem
} from './data/discogs-credit-review-helper.js';

const MIN_SEARCH_CHARACTERS = 3;

const APP_RELATIONSHIP_TYPES = [
  'shared-label',
  'shared-producer',
  'shared-engineer',
  'shared-studio',
  'shared-songwriter',
  'shared-musician'
];

const app = document.querySelector('#app');
const state = {
  rows: [],
  filteredRows: [],
  selectedId: null,
  collection: null,
  validation: null,
  indexes: null,
  sourceCandidates: null,
  creditCandidates: null,
  discogsReviewReport: null,
  discogsReviewSelectedId: null,
  discogsReviewCandidateId: null,
  discogsReviewFilters: {
    search: '',
    kind: 'all',
    reason: 'all'
  },
  relationships: null,
  pathDestinationId: null,
  relationshipTypeFilter: 'all',
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
    const [collection, comparison, candidates, sourceCandidates, creditCandidates, discogsReviewReport] = await Promise.all([
      loadJson('./data/collection.json'),
      loadJson('./data/rolling-stone-comparison.json'),
      loadJson('./data/enrichment/album-metadata-candidates.json'),
      loadJson('./data/enrichment/album-metadata-source-candidates.json'),
      loadJson('./data/enrichment/album-credit-candidates.json'),
      loadJson('./data/review/discogs-credit-review-report.json')
    ]);
    const validation = validateCollection(collection);
    const indexes = buildIndexes(collection);
    state.collection = collection;
    state.validation = validation;
    state.indexes = indexes;
    state.sourceCandidates = sourceCandidates;
    state.creditCandidates = creditCandidates;
    state.discogsReviewReport = discogsReviewReport;
    state.discogsReviewSelectedId = discogsReviewReport.items?.[0]?.albumId ?? null;
    state.rows = buildEnrichedComparisonRows({ comparison, candidates, sourceCandidates });
    state.relationships = buildAlbumRelationships(state.rows, { minimumWeight: 2.0, allowedTypes: APP_RELATIONSHIP_TYPES, creditCandidates: creditCandidates.candidates ?? [] });
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
  const creditCandidates = state.creditCandidates;
  const fatal = validation.errors.length > 0;
  const musicBrainzCount = state.rows.filter((row) => row.metadataStatus === 'musicbrainz').length;
  const baselineCount = state.rows.filter((row) => row.metadataStatus === 'baseline').length;
  const fourEditionCount = state.rows.filter((row) => row.editionCount === 4).length;
  state.filteredRows = sortRows(filterRows(state.rows, state.filters), state.sortKey);
  const selected = state.filteredRows.find((row) => row.id === state.selectedId) ?? state.filteredRows[0] ?? state.rows[0];
  state.selectedId = selected?.id ?? null;
  const activeRelationshipTypes = state.relationshipTypeFilter === 'all' ? [] : [state.relationshipTypeFilter];
  const discogsReviewItems = filterDiscogsReviewQueue(state.discogsReviewReport?.items ?? [], state.discogsReviewFilters);
  if (!discogsReviewItems.some((item) => item.albumId === state.discogsReviewSelectedId)) {
    state.discogsReviewSelectedId = discogsReviewItems[0]?.albumId ?? null;
    state.discogsReviewCandidateId = null;
  }
  const discogsReviewQueue = buildDiscogsReviewQueue(
    { ...state.discogsReviewReport, items: discogsReviewItems, summary: { ...state.discogsReviewReport?.summary, unresolved: discogsReviewItems.length } },
    { selectedAlbumId: state.discogsReviewSelectedId }
  );
  const relatedAlbums = selected ? getRelatedAlbums(selected.id, state.rows, state.relationships, { limit: 6, allowedTypes: activeRelationshipTypes }) : [];
  const focusedGraph = selected ? buildFocusedGraph({ selectedAlbumId: selected.id, rows: state.rows, relationships: state.relationships, limit: 10, allowedTypes: activeRelationshipTypes }) : null;
  const pathResult = selected && state.pathDestinationId ? findAlbumPath({ startAlbumId: selected.id, endAlbumId: state.pathDestinationId, relationships: state.relationships, maxDepth: 3, allowedTypes: activeRelationshipTypes }) : null;

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
        <li><strong>${creditCandidates.candidates?.length ?? 0}</strong><span>credit candidates</span></li>
        <li><strong>${sourceCandidates.review?.length ?? 0}</strong><span>MB review</span></li>
        <li><strong>${sourceCandidates.gaps?.length ?? 0}</strong><span>MB gaps</span></li>
      </ul>
      ${fatal ? renderMessages(validation.errors.slice(0, 10)) : '<p class="ok">No fatal seed validation errors. Generated comparison and enrichment data loaded.</p>'}
    </section>

    ${renderDiscogsReviewHelper(discogsReviewQueue)}

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

function activeRelationshipTypes() {
  return state.relationshipTypeFilter === 'all' ? [] : [state.relationshipTypeFilter];
}

function renderControls() {
  return `
    <form class="controls" data-testid="comparison-controls">
      <label>Search
        <input data-testid="comparison-search" name="search" type="search" placeholder="artist or album" value="${escapeAttribute(state.filters.search)}">
        <span class="control-hint">Search starts at 3 characters.</span>
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

function renderDiscogsReviewHelper(queue) {
  const report = state.discogsReviewReport;
  const current = queue.current;
  return `
    <section class="panel review-helper" data-testid="discogs-review-helper">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Discogs credit review</p>
          <h2>Case-by-case review helper</h2>
        </div>
        <p class="muted">${escapeHtml(queue.progressLabel)}</p>
      </div>
      <ul class="metrics compact-metrics">
        <li><strong>${report?.summary?.unresolved ?? 0}</strong><span>total unresolved</span></li>
        <li><strong>${report?.summary?.review ?? 0}</strong><span>review items</span></li>
        <li><strong>${report?.summary?.gaps ?? 0}</strong><span>gaps</span></li>
        <li><strong>${queue.items.length}</strong><span>shown after filters</span></li>
      </ul>
      <p class="muted">Supports <code>approve-master-override</code> and <code>add-search-alias</code> cases without writing to canonical data.</p>
      ${renderDiscogsReviewControls(report)}
      ${current ? renderDiscogsReviewItem(current) : '<p class="muted">No unresolved item matches these filters.</p>'}
    </section>
  `;
}

function renderDiscogsReviewControls(report) {
  const reasons = [...new Set((report?.items ?? []).map((item) => item.reason).filter(Boolean))].sort();
  return `
    <form class="controls review-controls" data-testid="discogs-review-controls">
      <label>Search unresolved
        <input name="discogsReviewSearch" type="search" placeholder="artist, album, reason, candidate ID" value="${escapeAttribute(state.discogsReviewFilters.search)}">
      </label>
      <label>Kind
        <select name="discogsReviewKind">
          ${option('all', 'Any kind', state.discogsReviewFilters.kind)}
          ${option('review', 'Review', state.discogsReviewFilters.kind)}
          ${option('gap', 'Gap', state.discogsReviewFilters.kind)}
        </select>
      </label>
      <label>Reason
        <select name="discogsReviewReason">
          ${option('all', 'Any reason', state.discogsReviewFilters.reason)}
          ${reasons.map((reason) => option(reason, reason, state.discogsReviewFilters.reason)).join('')}
        </select>
      </label>
    </form>
  `;
}

function renderDiscogsReviewItem(item) {
  const selectedCandidate = selectedDiscogsCandidate(item);
  const snippet = discogsSnippetForItem(item, selectedCandidate);
  return `
    <article class="review-case">
      <div class="review-case-main">
        <p class="eyebrow">${escapeHtml(item.kind)} · ${escapeHtml(item.reason)}</p>
        <h3>${escapeHtml(item.artist ?? 'Unknown artist')} — ${escapeHtml(item.album ?? 'Unknown album')}</h3>
        <p class="muted">${item.releaseYear ?? 'unknown year'} · latest rank ${item.latestRank ? `#${item.latestRank}` : 'unknown'} · action: <code>${escapeHtml(item.recommendedAction)}</code></p>
        <h4>Source candidates</h4>
        ${renderDiscogsSourceCandidates(item)}
        ${renderDiscogsSourceDiagnostics(item.sourceDiagnostics)}
      </div>
      <div class="review-snippet-box">
        ${snippet ? renderDiscogsCopySnippet(item, snippet) : renderDiscogsInspectNotice(item)}
      </div>
    </article>
  `;
}

function renderDiscogsCopySnippet(item, snippet) {
  return `
    <h4>${item.recommendedAction === 'add-search-alias' ? 'Alias row' : 'Override row'}</h4>
    <p class="muted">Copy this into ${item.recommendedAction === 'add-search-alias' ? '<code>data/review/discogs-credit-search-aliases.json</code>' : '<code>data/review/discogs-credit-master-overrides.json</code>'}, then rerun the import/review scripts.</p>
    <pre data-testid="discogs-review-snippet"><code>${escapeHtml(snippet)}</code></pre>
    <button class="copy-button" type="button" data-copy-review-snippet>Copy JSON snippet</button>
    <button class="copy-button secondary" type="button" data-next-discogs-review>Next case</button>
  `;
}

function renderDiscogsInspectNotice(item) {
  return `
    <h4>Needs inspection</h4>
    <p class="muted">This case is <code>${escapeHtml(item.recommendedAction)}</code>. The selected source did not produce usable credit/studio facts, so the helper will not generate a misleading override or alias snippet.</p>
    <p class="muted">Inspect the cached Discogs master/release payload, choose an alternate source if one exists, or leave it as a documented gap.</p>
    <button class="copy-button secondary" type="button" data-next-discogs-review>Next case</button>
  `;
}

function renderDiscogsSourceDiagnostics(diagnostics) {
  if (!diagnostics) return '';
  return `
    <section class="source-diagnostics" data-testid="discogs-source-diagnostics">
      <h4>Source diagnostics</h4>
      <dl class="diagnostic-grid">
        <div><dt>Source</dt><dd>${escapeHtml(diagnostics.sourceSystem ?? 'unknown')} · ${escapeHtml(diagnostics.sourceTitle ?? diagnostics.sourceId ?? 'unknown')}</dd></div>
        <div><dt>Master ID</dt><dd>${escapeHtml(diagnostics.masterId ?? 'none')}</dd></div>
        <div><dt>Release ID</dt><dd>${escapeHtml(diagnostics.releaseId ?? 'none')}</dd></div>
        <div><dt>Payload kind</dt><dd>${escapeHtml(diagnostics.payloadKind ?? 'unknown')}</dd></div>
        <div><dt>Cache path</dt><dd><code>${escapeHtml(diagnostics.cachePath ?? 'none')}</code>${diagnostics.cacheAvailable ? '' : ' · missing'}</dd></div>
        <div><dt>Top-level credits</dt><dd>${diagnostics.topLevelCreditCount ?? 0}</dd></div>
        <div><dt>Companies</dt><dd>${diagnostics.usableCompanyCount ?? 0} usable of ${diagnostics.companyCount ?? 0}</dd></div>
        <div><dt>Track-level credits</dt><dd>${diagnostics.trackExtraArtistCount ?? 0} credit rows across ${diagnostics.trackCount ?? 0} tracks</dd></div>
        <div><dt>Suggested next action</dt><dd><code>${escapeHtml(diagnostics.suggestedAction ?? 'inspect-source')}</code></dd></div>
      </dl>
      ${diagnostics.sourceUrl ? `<p><a class="external-link" href="${escapeAttribute(diagnostics.sourceUrl)}" target="_blank" rel="noreferrer">Open selected Discogs source</a></p>` : ''}
    </section>
  `;
}

function renderDiscogsSourceCandidates(item) {
  if (!item.sourceCandidates?.length) return '<p class="muted">No source candidates. Use the alias snippet as a starting point, edit artist/title if needed, then rerun.</p>';
  return `
    <ol class="candidate-list">
      ${item.sourceCandidates.map((candidate, index) => {
        const checked = selectedDiscogsCandidate(item)?.id === candidate.id ? 'checked' : '';
        return `
          <li>
            <label>
              <input type="radio" name="discogsReviewCandidate" value="${escapeAttribute(candidate.id)}" ${checked || (!state.discogsReviewCandidateId && index === 0) ? 'checked' : ''}>
              <strong>${escapeHtml(candidate.id)}</strong>
              <span>${escapeHtml(candidate.title ?? 'untitled')}${candidate.year ? ` (${escapeHtml(candidate.year)})` : ''}</span>
            </label>
            ${candidate.url ? `<a class="external-link" href="${escapeAttribute(candidate.url)}" target="_blank" rel="noreferrer">Open Discogs master</a>` : ''}
          </li>
        `;
      }).join('')}
    </ol>
  `;
}

function selectedDiscogsCandidate(item) {
  return item.sourceCandidates?.find((candidate) => candidate.id === state.discogsReviewCandidateId) ?? item.sourceCandidates?.[0] ?? null;
}

function discogsSnippetForItem(item, selectedCandidate) {
  return discogsReviewSnippet(item, selectedCandidate);
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
      <h3>Relationship types</h3>
      ${renderRelationshipTypeFilter()}
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

function renderRelationshipTypeFilter() {
  return `
    <label class="relationship-type-filter">Filter relationship views
      <select data-testid="relationship-type-filter">
        ${option('all', 'All relationship types', state.relationshipTypeFilter)}
        ${option('shared-label', 'Labels', state.relationshipTypeFilter)}
        ${option('shared-producer', 'Producers', state.relationshipTypeFilter)}
        ${option('shared-engineer', 'Engineers', state.relationshipTypeFilter)}
        ${option('shared-studio', 'Studios/locations', state.relationshipTypeFilter)}
        ${option('shared-songwriter', 'Songwriters', state.relationshipTypeFilter)}
        ${option('shared-musician', 'Musicians/performers', state.relationshipTypeFilter)}
      </select>
    </label>
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
            <p class="matching-explanation">${escapeHtml(matchingRelationshipExplanations(hop.relationship, activeRelationshipTypes())[0] ?? hop.relationship.types.join(', '))}</p>
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
          return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke-width="${Math.min(4, 1 + edge.weight / 3).toFixed(2)}"><title>${escapeHtml(matchingRelationshipExplanations(edge, activeRelationshipTypes())[0] ?? edge.types.join(', '))}</title></line>`;
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
            ${matchingRelationshipEvidence(relationship, activeRelationshipTypes()).slice(0, 3).map((evidence, index) => `<li class="${index === 0 && activeRelationshipTypes().length ? 'matching-explanation' : ''}">${renderRelationshipEvidence(evidence)}</li>`).join('')}
          </ul>
        </li>
      `).join('')}
    </ol>
  `;
}

function renderRelationshipEvidence(evidence) {
  return `${escapeHtml(evidence.text)}${renderSourceBadges(evidence.provenance)}`;
}

function renderSourceBadges(provenance) {
  if (!provenance) return '';
  const badges = [];
  const seenBadges = new Set();
  const pushBadge = (key, html) => {
    if (seenBadges.has(key)) return;
    seenBadges.add(key);
    badges.push(html);
  };
  for (const side of [provenance.left, provenance.right]) {
    if (!side) continue;
    if (side.masterUrl) pushBadge(`master:${side.masterUrl}`, `<a class="source-badge" href="${escapeAttribute(side.masterUrl)}" target="_blank" rel="noreferrer">Discogs master ${escapeHtml(side.masterId)}</a>`);
    if (side.releaseUrl) pushBadge(`release:${side.releaseUrl}`, `<a class="source-badge" href="${escapeAttribute(side.releaseUrl)}" target="_blank" rel="noreferrer">Discogs release ${escapeHtml(side.releaseId)}</a>`);
    if (side.selectedBy && side.selectedBy !== 'discogs-release-cache') pushBadge(`selected:${side.selectedBy}`, `<span class="source-badge muted-source">${escapeHtml(formatSourceSelection(side.selectedBy))}</span>`);
  }
  if (badges.length === 0) return '';
  return `<span class="source-badges" aria-label="Relationship sources">${badges.join('')}</span>`;
}

function formatSourceSelection(value) {
  return String(value ?? '').replace(/-/g, ' ');
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
  const reviewControls = app.querySelector('[data-testid="discogs-review-controls"]');
  reviewControls?.addEventListener('input', updateFromDiscogsReviewControls);
  reviewControls?.addEventListener('change', updateFromDiscogsReviewControls);
  for (const radio of app.querySelectorAll('input[name="discogsReviewCandidate"]')) {
    radio.addEventListener('change', () => {
      state.discogsReviewCandidateId = radio.value;
      renderApp();
    });
  }
  const copyReviewSnippet = app.querySelector('[data-copy-review-snippet]');
  copyReviewSnippet?.addEventListener('click', async () => {
    const text = app.querySelector('[data-testid="discogs-review-snippet"]')?.textContent ?? '';
    await navigator.clipboard?.writeText(text);
    copyReviewSnippet.textContent = 'Copied';
  });
  const nextReview = app.querySelector('[data-next-discogs-review]');
  nextReview?.addEventListener('click', () => {
    const items = filterDiscogsReviewQueue(state.discogsReviewReport?.items ?? [], state.discogsReviewFilters);
    const next = nextDiscogsReviewItem(items, state.discogsReviewSelectedId);
    state.discogsReviewSelectedId = next?.albumId ?? null;
    state.discogsReviewCandidateId = null;
    renderApp();
  });
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
  const relationshipTypeFilter = app.querySelector('[data-testid="relationship-type-filter"]');
  relationshipTypeFilter?.addEventListener('change', () => {
    state.relationshipTypeFilter = relationshipTypeFilter.value;
    renderApp();
  });
  for (const button of app.querySelectorAll('[data-path-album-id]')) {
    button.addEventListener('click', () => selectAlbum(button.dataset.pathAlbumId));
  }
}

function updateFromControls(event) {
  const form = event.currentTarget;
  const data = new FormData(form);
  const nextFilters = {
    search: data.get('search') ?? '',
    editionYear: data.get('editionYear') ?? 'all',
    editionCount: data.get('editionCount') ?? 'all',
    metadataStatus: data.get('metadataStatus') ?? 'all',
    musicBrainzMatchStatus: data.get('musicBrainzMatchStatus') ?? 'all'
  };
  const nextSortKey = data.get('sortKey') ?? 'latest-rank';
  if (event.target?.name === 'search' && shouldSkipShortSearchRender(state.filters.search, nextFilters.search)) return;
  state.filters = nextFilters;
  state.sortKey = nextSortKey;
  renderApp();
}

function updateFromDiscogsReviewControls(event) {
  const form = event.currentTarget;
  const data = new FormData(form);
  state.discogsReviewFilters = {
    search: data.get('discogsReviewSearch') ?? '',
    kind: data.get('discogsReviewKind') ?? 'all',
    reason: data.get('discogsReviewReason') ?? 'all'
  };
  state.discogsReviewCandidateId = null;
  renderApp();
}

function shouldSkipShortSearchRender(previousSearch, nextSearch) {
  return effectiveSearch(previousSearch) === '' && effectiveSearch(nextSearch) === '';
}

function effectiveSearch(value) {
  const trimmed = String(value ?? '').trim();
  return trimmed.length >= MIN_SEARCH_CHARACTERS ? trimmed : '';
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
