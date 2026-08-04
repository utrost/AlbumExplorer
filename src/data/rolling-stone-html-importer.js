export function parseRollingStoneHtml(html) {
  const articles = extractArticles(html);
  const parsedRanks = articles.map(parseRank);
  const inferredStartRank = parsedRanks.find((rank) => rank !== null) ?? articles.length;
  return articles.map((article, index) => {
    const title = decodeHtml(stripTags(firstMatch(article, /<h2[^>]*>([\s\S]*?)<\/h2>/i) ?? ''));
    const rank = parsedRanks[index] ?? (inferredStartRank - index);
    const { artist, album } = splitArtistAlbum(title);
    const { label, year } = parseLabelYear(article, title);
    return { rank, artist, album, label, year };
  }).filter((row) => row.rank && row.artist && row.album);
}

function extractArticles(html) {
  const articles = [];
  const articlePattern = /<article\b(?=[^>]*class=(?:['"][^'"]*c-gallery-vertical-album[^'"]*['"]|[^\s>]*c-gallery-vertical-album[^\s>]*))[^>]*>[\s\S]*?<\/article>/gi;
  let match;
  while ((match = articlePattern.exec(html)) !== null) {
    articles.push(match[0]);
  }
  return articles;
}

function parseRank(article) {
  const text = decodeHtml(stripTags(article)).trim();
  const match = text.match(/^(\d{1,3})\b/);
  return match ? Number(match[1]) : null;
}

function splitArtistAlbum(title) {
  const normalized = title.trim();
  const curly = normalized.match(/^(.*),\s*[‘'](.+?)[’']\s*$/);
  if (curly) {
    return { artist: curly[1].trim(), album: curly[2].trim() };
  }

  const straight = normalized.match(/^(.*),\s*"(.+?)"\s*$/);
  if (straight) {
    return { artist: straight[1].trim(), album: straight[2].trim() };
  }

  const comma = normalized.lastIndexOf(',');
  if (comma !== -1) {
    return { artist: normalized.slice(0, comma).trim(), album: normalized.slice(comma + 1).trim() };
  }

  return { artist: normalized, album: '' };
}

function parseLabelYear(article, title) {
  let text = decodeHtml(stripTags(article))
    .replace(title, ' ')
    .replace(/^\s*\d{1,3}\b/, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const lowerText = text.toLowerCase();
  const coverArtIndex = Math.max(
    lowerText.lastIndexOf('high resolution cover art'),
    lowerText.lastIndexOf('high res cover art')
  );
  if (coverArtIndex !== -1) {
    const markerLength = lowerText.startsWith('high resolution cover art', coverArtIndex)
      ? 'high resolution cover art'.length
      : 'high res cover art'.length;
    text = text.slice(coverArtIndex + markerLength).trim();
  }
  const match = text.match(/^\s*([^.,]{2,80}?),\s*((?:19|20)\d{2})\b|\b([^.,]{2,80}?),\s*((?:19|20)\d{2})\b/);
  return {
    label: match ? cleanLabel(match[1] ?? match[3]) : null,
    year: match ? Number(match[2] ?? match[4]) : null
  };
}

function firstMatch(text, pattern) {
  const match = text.match(pattern);
  return match ? match[1] : null;
}

function cleanLabel(label) {
  return label.trim().replace(/^\d+\s+/, '');
}

function stripTags(html) {
  return html.replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
}

function decodeHtml(value) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&rsquo;/g, '’')
    .replace(/&lsquo;/g, '‘')
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”');
}
