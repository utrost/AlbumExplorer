import { validateCollection } from './data/validator.js';
import { buildIndexes } from './data/indexes.js';

const app = document.querySelector('#app');

start();

async function start() {
  try {
    const collection = await loadCollection('./data/collection.json');
    const validation = validateCollection(collection);
    const indexes = buildIndexes(collection);
    renderApp(collection, validation, indexes);
  } catch (error) {
    renderError(error);
  }
}

async function loadCollection(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function renderApp(collection, validation, indexes) {
  const fatal = validation.errors.length > 0;
  app.innerHTML = `
    <header class="hero">
      <p class="eyebrow">File-first prototype</p>
      <h1>AlbumExplorer</h1>
      <p>Loaded ${collection.albums.length} albums from <code>data/collection.json</code>.</p>
    </header>

    <section class="panel ${fatal ? 'panel-error' : ''}">
      <h2>Validation</h2>
      <ul class="metrics">
        <li><strong>${validation.errors.length}</strong><span>errors</span></li>
        <li><strong>${validation.warnings.length}</strong><span>warnings</span></li>
        <li><strong>${validation.info.length}</strong><span>metadata gaps</span></li>
      </ul>
      ${fatal ? renderMessages(validation.errors.slice(0, 10)) : '<p class="ok">No fatal validation errors. Sparse metadata is allowed.</p>'}
    </section>

    <section class="panel">
      <h2>Albums</h2>
      <ol class="album-list">
        ${collection.albums.slice(0, 50).map((album) => renderAlbum(album, indexes)).join('')}
      </ol>
    </section>
  `;
}

function renderAlbum(album, indexes) {
  const appearances = indexes.listAppearancesByAlbumId.get(album.id) ?? [];
  const copies = indexes.physicalCopiesByAlbumId.get(album.id) ?? [];
  const artist = indexes.artistsById.get(album.primaryArtistId);
  const graphable = (album.contributorIds?.length || album.studioIds?.length || album.labelIds?.length || album.genreIds?.length) ? 'graphable' : 'catalogue only';
  return `
    <li class="album-card">
      <h3>${escapeHtml(album.title)}</h3>
      <p>${escapeHtml(artist?.name ?? album.primaryArtistId)} · ${album.releaseYear ?? 'year unknown'} · ${escapeHtml(album.ownershipState)}</p>
      <p class="muted">${appearances.map((item) => `${item.editionId.replace('list-rolling-stone-', 'RS ')} #${item.rank}`).join(' · ') || 'No list appearance'} · ${copies.length} physical copy record(s) · ${graphable}</p>
    </li>
  `;
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

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
