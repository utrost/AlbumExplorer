import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRollingStoneHtml } from '../../src/data/rolling-stone-html-importer.js';

const html = `
<article class="c-gallery-vertical-album">
  <span class="c-gallery-vertical-album__number">50</span>
  <h2>Little Richard, ‘Here’s Little Richard’</h2>
  <p><em>Specialty, 1957</em></p>
  <p>Some description.</p>
</article>
<article class="c-gallery-vertical-album">
  <h2>The Allman Brothers Band, ‘At Fillmore East’</h2>
  <p>Mercury, 1971</p>
</article>
`;

test('parses Rolling Stone saved HTML gallery albums', () => {
  const rows = parseRollingStoneHtml(html);

  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], {
    rank: 50,
    artist: 'Little Richard',
    album: "Here’s Little Richard",
    label: 'Specialty',
    year: 1957
  });
  assert.deepEqual(rows[1], {
    rank: 49,
    artist: 'The Allman Brothers Band',
    album: 'At Fillmore East',
    label: 'Mercury',
    year: 1971
  });
});

test('parses titles with commas inside the artist name from the last curly quote pair', () => {
  const rows = parseRollingStoneHtml(`
    <article class="c-gallery-vertical-album">
      <h2>Earth, Wind &amp; Fire, ‘That’s the Way of the World’</h2>
      <p>Columbia, 1975</p>
    </article>
  `);

  assert.equal(rows[0].artist, 'Earth, Wind & Fire');
  assert.equal(rows[0].album, 'That’s the Way of the World');
});
