export function parseRollingStoneText(text) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n').map((line) => line.trim());
  const rankMarkers = [];
  for (let index = 0; index < lines.length; index += 1) {
    const marker = rankMarkerAt(lines, index);
    if (marker) rankMarkers.push(marker);
  }

  const rows = [];
  for (let i = 0; i < rankMarkers.length; i += 1) {
    const marker = rankMarkers[i];
    const start = marker.index;
    const end = rankMarkers[i + 1]?.index ?? lines.length;
    const rank = marker.rank;
    const titleLine = nextNonEmpty(lines, start + 1, end);
    if (!titleLine) continue;
    const { artist, album } = splitArtistAlbum(titleLine);
    const metadataLine = firstMetadataLine(lines, start + 1, end, titleLine);
    const { label, year } = parseLabelYear(metadataLine);
    rows.push({ rank, artist, album, label, year });
  }
  return rows;
}

function rankMarkerAt(lines, index) {
  const line = lines[index];
  if (/^\d{1,3}$/.test(line)) {
    const rank = Number(line);
    return rank >= 1 && rank <= 500 ? { index, rank } : null;
  }

  if (/(?:19|20)\d{2}$/.test(line)) return null;
  const glued = line.match(/^.+?(\d{1,3})$/);
  if (!glued) return null;
  const rank = Number(glued[1]);
  if (rank < 1 || rank > 500) return null;
  const next = nextNonEmpty(lines, index + 1, lines.length);
  if (!next || !/[‘']/.test(next)) return null;
  return { index, rank };
}

function nextNonEmpty(lines, start, end) {
  for (let index = start; index < end; index += 1) {
    if (lines[index]) return lines[index];
  }
  return null;
}

function firstMetadataLine(lines, start, end, titleLine) {
  let seenTitle = false;
  for (let index = start; index < end; index += 1) {
    const line = lines[index];
    if (!line) continue;
    if (!seenTitle) {
      if (line === titleLine) seenTitle = true;
      continue;
    }
    if (/^(?:19|20)\d{2}$/.test(line)) continue;
    if (parseLabelYear(line).year) return line;
    if (/^\d{1,3}$/.test(line)) return null;
    // Stop once prose starts; metadata line should appear immediately before description.
    if (/[.!?]$/.test(line) || line.length > 90) return null;
  }
  return null;
}

function splitArtistAlbum(title) {
  const normalized = title.trim();
  const quoted = normalized.match(/^(.*),\s*[‘'](.+?)[’']\s*$/);
  if (quoted) return { artist: quoted[1].trim(), album: quoted[2].trim() };

  const danglingQuote = normalized.match(/^(.*),\s*[‘'](.+?)\s*$/);
  if (danglingQuote) return { artist: danglingQuote[1].trim(), album: danglingQuote[2].trim() };

  const comma = normalized.lastIndexOf(',');
  if (comma !== -1) {
    return { artist: normalized.slice(0, comma).trim(), album: normalized.slice(comma + 1).trim().replace(/^[‘']|[’']$/g, '') };
  }
  return { artist: normalized, album: '' };
}

function parseLabelYear(line) {
  if (!line) return { label: null, year: null };
  const match = line.match(/^(.+?),\s*((?:19|20)\d{2})\s*$/);
  if (!match) return { label: null, year: null };
  return { label: match[1].trim(), year: Number(match[2]) };
}
