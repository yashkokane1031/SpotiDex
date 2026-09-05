/**
 * Lyrics fetcher using lrclib.net — free, no auth required.
 *
 * Strategy:
 *   1. Try exact match: GET /api/get?track_name=…&artist_name=…&album_name=…&duration=…
 *   2. On 404, fall back to search: GET /api/search?track_name=…&artist_name=… (take first hit)
 *   3. Parse syncedLyrics (LRC string) if available, otherwise return plainLyrics
 *
 * Never throws — always resolves to a result object or null.
 */

import { parseLrc } from './parseLrc';

const BASE = 'https://lrclib.net/api';

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
  try {
    // --- 1. Exact match ---
    const exactParams = new URLSearchParams({
      track_name: trackName,
      artist_name: artistName,
    });
    if (albumName) exactParams.set('album_name', albumName);
    if (durationSec != null && !isNaN(durationSec)) exactParams.set('duration', String(Math.round(durationSec)));

    const exactUrl = `${BASE}/get?${exactParams}`;
    console.log('[lyricsApi] GET exact:', exactUrl);
    const exactRes = await fetch(exactUrl, {
      headers: { 'User-Agent': 'SpotiDex/1.0' },
    });
    console.log('[lyricsApi] exact status:', exactRes.status);

    if (exactRes.ok) {
      return shapeResponse(await exactRes.json());
    }

    // --- 2. Fallback: search ---
    if (exactRes.status === 404) {
      const searchParams = new URLSearchParams({
        track_name: trackName,
        artist_name: artistName,
      });

      const searchUrl = `${BASE}/search?${searchParams}`;
      console.log('[lyricsApi] GET search:', searchUrl);
      const searchRes = await fetch(searchUrl, {
        headers: { 'User-Agent': 'SpotiDex/1.0' },
      });
      console.log('[lyricsApi] search status:', searchRes.status);

      if (searchRes.ok) {
        const results = await searchRes.json();
        if (Array.isArray(results) && results.length > 0) {
          return shapeResponse(results[0]);
        }
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

  // If synced parsed to an empty array, treat as unavailable
  return {
    synced: synced && synced.length > 0 ? synced : null,
    plain,
    instrumental,
  };
}
