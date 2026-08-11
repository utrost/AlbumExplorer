import test from 'node:test';
import assert from 'node:assert/strict';
import { renderAlbumProfile, renderProfileFootnotes, formatDuration } from '../../src/views/album-profile-view.js';

const row = {
  album: 'Blue',
  artist: 'Joni Mitchell',
  profile: {
    description: 'Joni Mitchell — Blue (1971).',
    story: 'A spare singer-songwriter landmark.',
    coverArt: { url: 'https://example.test/blue.jpg' },
    totalDurationSeconds: 2141,
    tracklist: [
      {
        position: 'A1',
        title: 'All I Want',
        durationSeconds: 212,
        composerCredits: [{ name: 'Joni Mitchell' }],
        songwriterCredits: [{ name: 'Joni Mitchell' }],
        lyricistCredits: []
      }
    ],
    footnotes: [{ label: 'Album content source', url: 'https://discogs.test/release/1' }]
  }
};

test('renders album profile content without source-dashboard language', () => {
  const html = renderAlbumProfile(row);

  assert.match(html, /data-testid="album-profile"/);
  assert.match(html, /data-testid="album-cover-art"/);
  assert.match(html, /alt="Cover art for Blue by Joni Mitchell"/);
  assert.match(html, /Joni Mitchell — Blue \(1971\)\./);
  assert.match(html, /A spare singer-songwriter landmark\./);
  assert.match(html, /35:41/);
  assert.match(html, /data-testid="tracklist"/);
  assert.match(html, /All I Want/);
  assert.match(html, /Composers: Joni Mitchell/);
  assert.doesNotMatch(html, /MusicBrainz matched|Discogs unresolved|Source status/);
});

test('renders explicit pending states for missing profile fields', () => {
  const html = renderAlbumProfile({ album: 'Unknown Pleasures', artist: 'Joy Division', profile: {} });

  assert.match(html, /Cover art pending/);
  assert.match(html, /Joy Division — Unknown Pleasures\./);
  assert.match(html, /Story\/context pending\./);
  assert.match(html, /Total length<\/dt><dd>pending/);
  assert.match(html, /Tracks<\/dt><dd>pending/);
  assert.match(html, /Tracklist pending\./);
});

test('renders compact profile footnotes with escaped labels and urls', () => {
  const html = renderProfileFootnotes({
    footnotes: [{ label: 'Album <source>', url: 'https://example.test/?q="blue"' }]
  });

  assert.match(html, /<h3>Footnotes<\/h3>/);
  assert.match(html, /Album &lt;source&gt;/);
  assert.match(html, /https:\/\/example\.test\/\?q=&quot;blue&quot;/);
  assert.match(html, /target="_blank"/);
});

test('formats durations for pending, minute, and hour-long albums', () => {
  assert.equal(formatDuration(null), 'pending');
  assert.equal(formatDuration(Number.NaN), 'pending');
  assert.equal(formatDuration(212), '3:32');
  assert.equal(formatDuration(6278), '1:44:38');
});
