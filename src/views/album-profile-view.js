export function renderAlbumProfile(row) {
  const profile = row.profile ?? {};
  return `
    <section class="album-profile" data-testid="album-profile">
      ${profile.coverArt?.url ? `<img data-testid="album-cover-art" class="album-cover-art" src="${escapeAttribute(profile.coverArt.url)}" alt="Cover art for ${escapeAttribute(row.album)} by ${escapeAttribute(row.artist)}" loading="lazy">` : '<div data-testid="album-cover-art" class="album-cover-placeholder">Cover art pending</div>'}
      <div class="album-profile-copy">
        <p>${escapeHtml(profile.description ?? `${row.artist} — ${row.album}.`)}</p>
        <p class="album-story">${escapeHtml(profile.story ?? 'Story/context pending.')}</p>
        <dl class="detail-list compact-detail-list">
          <div><dt>Total length</dt><dd>${formatDuration(profile.totalDurationSeconds)}</dd></div>
          <div><dt>Tracks</dt><dd>${profile.tracklist?.length ? profile.tracklist.length : 'pending'}</dd></div>
        </dl>
      </div>
    </section>
    ${renderTracklist(profile.tracklist)}
  `;
}

export function renderTracklist(tracklist = []) {
  if (!tracklist.length) return '<p class="muted" data-testid="tracklist">Tracklist pending.</p>';
  return `
    <section class="tracklist" data-testid="tracklist">
      <h3>Tracklist</h3>
      <ol>
        ${tracklist.map((track) => `
          <li>
            <span class="track-position">${escapeHtml(track.position ?? '')}</span>
            <strong>${escapeHtml(track.title)}</strong>
            <span>${formatDuration(track.durationSeconds)}</span>
            <small>Composers: ${escapeHtml(formatCreditNames([...(track.composerCredits ?? []), ...(track.songwriterCredits ?? []), ...(track.lyricistCredits ?? [])]))}</small>
          </li>
        `).join('')}
      </ol>
    </section>
  `;
}

export function renderProfileFootnotes(profile = {}) {
  const footnotes = profile.footnotes ?? [];
  if (!footnotes.length) return '<p class="muted">Footnotes pending.</p>';
  return `
    <section class="profile-footnotes">
      <h3>Footnotes</h3>
      <ul>
        ${footnotes.map((footnote) => `<li><a href="${escapeAttribute(footnote.url)}" target="_blank" rel="noreferrer">${escapeHtml(footnote.label)}</a></li>`).join('')}
      </ul>
    </section>
  `;
}

export function formatDuration(seconds) {
  if (seconds == null) return 'pending';
  const total = Number(seconds);
  if (!Number.isFinite(total)) return 'pending';
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainingSeconds = total % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

export function formatCreditNames(credits) {
  const names = [...new Set((credits ?? []).map((credit) => credit.name).filter(Boolean))];
  return names.length ? names.join(', ') : 'pending';
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('`', '&#096;');
}
