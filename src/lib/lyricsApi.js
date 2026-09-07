/**
 * Lyrics fetcher using lrclib.net — free, no auth required.
 *
 * Strategy:
 *   1. Clean track name and artist name (strip feats, remasters, etc.)
 *   2. Try exact match: GET /api/get?track_name=…&artist_name=…&album_name=…&duration=…
 *   3. Try clean exact match: GET /api/get?track_name=…&artist_name=…&duration=…
 *   4. Fall back to search by track & artist: GET /api/search?track_name=…&artist_name=…
 *   5. Fall back to query search: GET /api/search?q=…
 *   6. Parse syncedLyrics (LRC string) if available, otherwise return plainLyrics
 *
 * Never throws — always resolves to a result object or null.
 */

import { parseLrc } from './parseLrc.js';

const BASE = 'https://lrclib.net/api';

/**
 * Clean up common Spotify track name noise (e.g. "feat.", "Remastered", "Live", etc.)
 * @param {string} rawName
 * @returns {string}
 */
export function cleanTrackName(rawName) {
  if (!rawName) return '';
  const cleaned = rawName
    .replace(/\s*[([](feat\.|featuring|with|deluxe|remaster|bonus|live|version|edit|anniversary).*?[)\]]/gi, '')
    .replace(/\s*-\s*(feat\.|featuring|remaster|live|deluxe|edit|radio|single|bonus|version|acoustic|mono|stereo|anniversary).*$/gi, '')
    .replace(/\s*-\s*\d{4}\s*remaster.*$/gi, '')
    .trim();
  return cleaned || rawName;
}

/**
 * Fetch helper without forbidden headers that triggers CORS preflight issues.
 * @param {string} url
 * @returns {Promise<any|null>}
 */
async function safeFetchJson(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * @param {{
 *   trackName: string,
 *   artistName: string,
 *   albumName?: string,
 *   durationSec?: number
 * }} params
 * @returns {Promise<{ synced: Array<{ timeMs: number, text: string }> | null, plain: string | null, instrumental: boolean } | null>}
 */
export async function getLyrics({ trackName, artistName, albumName, durationSec }) {
  if (!trackName || !artistName) return null;

  try {
    const rawTrack = trackName.trim();
    const primaryArtist = artistName.split(',')[0].trim();
    const cleanTrack = cleanTrackName(rawTrack);

    // --- 1. Exact match with original track name ---
    const p1 = new URLSearchParams({
      track_name: rawTrack,
      artist_name: primaryArtist,
    });
    if (albumName) p1.set('album_name', albumName);
    if (durationSec != null && !isNaN(durationSec)) p1.set('duration', String(Math.round(durationSec)));

    let data = await safeFetchJson(`${BASE}/get?${p1.toString()}`);
    let shaped = shapeResponse(data);
    if (shaped) return shaped;

    // --- 2. Exact match with cleaned track name & duration (without album to broaden hit rate) ---
    if (cleanTrack !== rawTrack || albumName) {
      const p2 = new URLSearchParams({
        track_name: cleanTrack,
        artist_name: primaryArtist,
      });
      if (durationSec != null && !isNaN(durationSec)) p2.set('duration', String(Math.round(durationSec)));

      data = await safeFetchJson(`${BASE}/get?${p2.toString()}`);
      shaped = shapeResponse(data);
      if (shaped) return shaped;
    }

    // --- 3. Exact match without duration constraint ---
    const p3 = new URLSearchParams({
      track_name: cleanTrack,
      artist_name: primaryArtist,
    });
    data = await safeFetchJson(`${BASE}/get?${p3.toString()}`);
    shaped = shapeResponse(data);
    if (shaped) return shaped;

    // --- 4. Search endpoint by track_name & artist_name ---
    const searchParams = new URLSearchParams({
      track_name: cleanTrack,
      artist_name: primaryArtist,
    });
    const searchResults = await safeFetchJson(`${BASE}/search?${searchParams.toString()}`);
    if (Array.isArray(searchResults) && searchResults.length > 0) {
      // Pick first item that has lyrics or instrumental
      for (const item of searchResults) {
        shaped = shapeResponse(item);
        if (shaped) return shaped;
      }
    }

    // --- 5. Query search fallback: /api/search?q=artist track ---
    const qParams = new URLSearchParams({
      q: `${primaryArtist} ${cleanTrack}`,
    });
    const qResults = await safeFetchJson(`${BASE}/search?${qParams.toString()}`);
    if (Array.isArray(qResults) && qResults.length > 0) {
      for (const item of qResults) {
        shaped = shapeResponse(item);
        if (shaped) return shaped;
      }
    }

    return null;
  } catch {
    // Network error, CORS issue, etc. — swallow silently
    return null;
  }
}

/**
 * Normalise a raw lrclib response object into our app's shape.
 */
function shapeResponse(data) {
  if (!data || typeof data !== 'object') return null;

  const instrumental = Boolean(data.instrumental);
  const plain = data.plainLyrics || null;
  const synced = data.syncedLyrics ? parseLrc(data.syncedLyrics) : null;

  // If there are no lyrics and it is not instrumental, don't claim it as found
  if (!instrumental && !plain && (!synced || synced.length === 0)) {
    return null;
  }

  return {
    synced: synced && synced.length > 0 ? synced : null,
    plain,
    instrumental,
  };
}
