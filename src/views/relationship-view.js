import { matchingRelationshipEvidence } from '../data/derived-relationships.js';
import { escapeAttribute, escapeHtml } from './album-profile-view.js';

export function renderRelationshipTypeFilter(selectedType = 'all') {
  return `
    <label class="relationship-type-filter">Filter relationship views
      <select data-testid="relationship-type-filter">
        ${option('all', 'All relationship types', selectedType)}
        ${option('shared-label', 'Labels', selectedType)}
        ${option('shared-producer', 'Producers', selectedType)}
        ${option('shared-engineer', 'Engineers', selectedType)}
        ${option('shared-studio', 'Studios/locations', selectedType)}
        ${option('shared-songwriter', 'Songwriters', selectedType)}
        ${option('shared-musician', 'Musicians/performers', selectedType)}
      </select>
    </label>
  `;
}

export function renderRelatedAlbums(relatedAlbums, activeRelationshipTypes = []) {
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
            ${matchingRelationshipEvidence(relationship, activeRelationshipTypes).slice(0, 3).map((evidence, index) => `<li class="${index === 0 && activeRelationshipTypes.length ? 'matching-explanation' : ''}">${renderRelationshipEvidence(evidence)}</li>`).join('')}
          </ul>
        </li>
      `).join('')}
    </ol>
  `;
}

export function renderRelationshipEvidence(evidence) {
  return `${escapeHtml(evidence.text)}${renderSourceBadges(evidence.provenance)}`;
}

export function renderSourceBadges(provenance) {
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

export function formatSourceSelection(value) {
  return String(value ?? '').replace(/-/g, ' ');
}

function option(value, label, selectedValue) {
  return `<option value="${escapeAttribute(value)}" ${String(value) === String(selectedValue) ? 'selected' : ''}>${escapeHtml(label)}</option>`;
}
