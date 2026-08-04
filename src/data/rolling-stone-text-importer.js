export function parseRollingStoneText(text) {
  const simpleRows = parseRollingStoneSimpleText(text);
  if (simpleRows.length) return simpleRows;

  const lines = text.replace(/\r\n?/g, '\n').split('\n').map((line) => line.trim());
  const rankMarkers = [];
  let expectedRank = null;
  for (let index = 0; index < lines.length; index += 1) {
    const marker = rankMarkerAt(lines, index, expectedRank);
    if (marker) {
      rankMarkers.push(marker);
      expectedRank = marker.rank - 1;
    }
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

export function parseRollingStoneSimpleText(text) {
  const rows = [];
  const lines = text.replace(/\r\n?/g, '\n').split('\n').map((line) => line.trim()).filter(Boolean);

  for (const line of lines) {
    const pipeRow = line.match(/^(\d{1,3})\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*((?:19|20)\d{2})\s*$/);
    if (pipeRow) {
      rows.push({
        rank: Number(pipeRow[1]),
        artist: pipeRow[2].trim(),
        album: pipeRow[3].trim(),
        label: null,
        year: Number(pipeRow[4])
      });
      continue;
    }

    const dotRow = line.match(/^(\d{1,3})\.\s*(.+)\s+\(((?:19|20)\d{2})\)\s+by\s+(.+)\s*$/);
    if (dotRow) {
      rows.push({
        rank: Number(dotRow[1]),
        artist: dotRow[4].trim(),
        album: dotRow[2].trim(),
        label: null,
        year: Number(dotRow[3])
      });
    }
  }

  return rows.filter((row) => row.rank >= 1 && row.rank <= 500);
}

function rankMarkerAt(lines, index, expectedRank = null) {
  const line = lines[index];
  if (/^\d{1,3}$/.test(line)) {
    const rank = Number(line);
    return rank >= 1 && rank <= 500 ? { index, rank } : null;
  }

  if (/(?:19|20)\d{2}$/.test(line)) return null;
  if (!/\d$/.test(line)) return null;
  const next = nextNonEmpty(lines, index + 1, lines.length);
  if (!next || !/[‘’']/.test(next)) return null;

  const candidates = rankSuffixCandidates(line);
  if (!candidates.length) return null;
  const rank = chooseRankCandidate(candidates, expectedRank);
  return rank ? { index, rank } : null;
}

function nextNonEmpty(lines, start, end) {
  for (let index = start; index < end; index += 1) {
    if (lines[index]) return lines[index];
  }
  return null;
}

function rankSuffixCandidates(line) {
  const candidates = [];
  for (let length = 1; length <= 3; length += 1) {
    const suffix = line.slice(-length);
    if (!/^\d+$/.test(suffix)) continue;
    const rank = Number(suffix);
    if (rank >= 1 && rank <= 500) candidates.push(rank);
  }
  return [...new Set(candidates)];
}

function chooseRankCandidate(candidates, expectedRank) {
  if (expectedRank && candidates.includes(expectedRank)) return expectedRank;
  if (expectedRank) {
    const plausible = candidates.filter((rank) => rank < expectedRank).sort((a, b) => b - a);
    if (plausible.length) return plausible[0];
  }
  return candidates.sort((a, b) => b - a)[0] ?? null;
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
    if (/HIGH RESOLUTION COVER ART$/i.test(line)) continue;
    if (/^\d{1,3}$/.test(line)) return null;
    // Stop once prose starts; metadata line should appear immediately before description.
    if (/[.!?]$/.test(line) || line.length > 90) return null;
  }
  return null;
}

function splitArtistAlbum(title) {
  const normalized = title.trim();
  const apostropheBeforeAlbumQuote = normalized.match(/^(.*?)['’]\s*[‘'](.+?)[’']\s*$/);
  if (apostropheBeforeAlbumQuote) return { artist: apostropheBeforeAlbumQuote[1].trim(), album: apostropheBeforeAlbumQuote[2].trim() };

  const quoted = normalized.match(/^(.*),\s*[‘’'](.+?)[’']\s*$/);
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
  const match = line.match(/^(.+?)[,.]\s*((?:19|20)\d{2})\s*$/);
  if (!match) return { label: null, year: null };
  return { label: match[1].trim(), year: Number(match[2]) };
}
