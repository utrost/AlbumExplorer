const MUSICBRAINZ_BASE_URL = 'https://musicbrainz.org';
const RELEASE_GROUP_ENTITY = 'musicbrainz-release-group';
const ARTIST_ENTITY = 'musicbrainz-artist';

export function buildMusicBrainzLookupQuery(album) {
  const parts = [
    `artist:${quoteQuery(album.artist)}`,
    `releasegroup:${quoteQuery(album.album)}`
  ];
  if (album.releaseYear) parts.push(`firstreleasedate:${album.releaseYear}`);
  return parts.join(' AND ');
}

export function selectMusicBrainzReleaseGroupMatch(album, releaseGroups) {
  const matches = (releaseGroups ?? []).filter((releaseGroup) => isExactAlbumReleaseGroup(album, releaseGroup));
  if (matches.length === 1) return { status: 'matched', releaseGroup: matches[0] };
  if (matches.length > 1) return { status: 'ambiguous', releaseGroups: matches };
  return { status: 'gap', reason: 'no-exact-musicbrainz-release-group-match' };
}

export function musicBrainzSourceCandidateFromReleaseGroup(album, releaseGroup) {
  const artistCredit = primaryArtistCredit(releaseGroup);
  const artist = artistCredit?.artist;
  const releaseDate = releaseGroup['first-release-date'] || null;
  return {
    sourceId: `source-musicbrainz-release-group-${releaseGroup.id}`,
    sourceType: 'musicbrainz-release-group',
    artist: artistCredit?.name ?? artist?.name ?? album.artist,
    album: releaseGroup.title ?? album.album,
    releaseYear: yearFromDate(releaseDate) ?? album.releaseYear ?? null,
    releaseDate,
    labels: [],
    genres: tagsFromReleaseGroup(releaseGroup),
    styles: [],
    country: null,
    externalRefs: [
      {
        system: RELEASE_GROUP_ENTITY,
        id: releaseGroup.id,
        url: `${MUSICBRAINZ_BASE_URL}/release-group/${releaseGroup.id}`
      },
      ...(artist?.id ? [{
        system: ARTIST_ENTITY,
        id: artist.id,
        url: `${MUSICBRAINZ_BASE_URL}/artist/${artist.id}`
      }] : [])
    ],
    coverCandidates: [],
    confidence: 'matched',
    sourceDetails: {
      score: releaseGroup.score ?? null,
      primaryType: releaseGroup['primary-type'] ?? null,
      secondaryTypes: releaseGroup['secondary-types'] ?? [],
      releaseGroupId: releaseGroup.id,
      artistId: artist?.id ?? null,
      releaseCount: releaseGroup.count ?? null,
      sampleReleaseIds: (releaseGroup.releases ?? []).slice(0, 5).map((release) => release.id).filter(Boolean)
    }
  };
}

export function reviewItemFromAmbiguousMusicBrainzMatch(album, releaseGroups) {
  return {
    albumId: album.id,
    artist: album.artist,
    album: album.album,
    releaseYear: album.releaseYear ?? null,
    reason: 'ambiguous-musicbrainz-release-group-match',
    sourceCandidates: releaseGroups.map((releaseGroup) => musicBrainzSourceCandidateFromReleaseGroup(album, releaseGroup))
  };
}

export function gapItemFromMusicBrainzMatch(album, reason = 'no-exact-musicbrainz-release-group-match') {
  return {
    albumId: album.id,
    artist: album.artist,
    album: album.album,
    releaseYear: album.releaseYear ?? null,
    reason
  };
}

function isExactAlbumReleaseGroup(album, releaseGroup) {
  if ((releaseGroup.score ?? 0) < 90) return false;
  if ((releaseGroup['primary-type'] ?? '').toLowerCase() !== 'album') return false;
  const secondaryTypes = (releaseGroup['secondary-types'] ?? []).map((value) => normalizeForMatch(value));
  if (secondaryTypes.includes('compilation')) return false;
  if (normalizeForMatch(releaseGroup.title) !== normalizeForMatch(album.album)) return false;
  const releaseYear = yearFromDate(releaseGroup['first-release-date']);
  if (album.releaseYear && releaseYear && Math.abs(album.releaseYear - releaseYear) > 1) return false;
  const artistCreditName = normalizeForMatch(primaryArtistCredit(releaseGroup)?.name ?? primaryArtistCredit(releaseGroup)?.artist?.name ?? '');
  return artistCreditName === normalizeForMatch(album.artist);
}

function primaryArtistCredit(releaseGroup) {
  return releaseGroup['artist-credit']?.find((credit) => credit?.artist) ?? releaseGroup['artist-credit']?.[0] ?? null;
}

function tagsFromReleaseGroup(releaseGroup) {
  return unique((releaseGroup.tags ?? [])
    .filter((tag) => Number(tag.count ?? 0) > 0)
    .sort((left, right) => Number(right.count ?? 0) - Number(left.count ?? 0))
    .map((tag) => tag.name)
    .filter(Boolean));
}

function yearFromDate(value) {
  const match = /^(\d{4})/.exec(String(value ?? ''));
  return match ? Number(match[1]) : null;
}

function quoteQuery(value) {
  return `"${String(value ?? '').replaceAll('"', '\\"')}"`;
}

function normalizeForMatch(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/['’‘`]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();
}

function unique(values) {
  return [...new Set(values)];
}
