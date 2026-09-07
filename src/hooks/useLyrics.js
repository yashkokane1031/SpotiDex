import { useState, useEffect, useRef, useCallback } from 'react';
import { getLyrics } from '../lib/lyricsApi';

/**
 * Hook that fetches lyrics for the current track from lrclib.net.
 *
 * - Caches results by track ID for the lifetime of the session (useRef Map)
 * - Only fetches when trackId changes
 * - Exposes lyricsState, syncedLines, plainText, and instrumental flag
 *
 * @param {{
 *   trackId: string | null,
 *   trackName: string | null,
 *   artistName: string | null,
 *   albumName: string | null,
 *   durationMs: number | null,
 * }} params
 * @returns {{
 *   lyricsState: 'loading' | 'synced' | 'plain' | 'instrumental' | 'not-found',
 *   syncedLines: Array<{ timeMs: number, text: string }> | null,
 *   plainText: string | null,
 * }}
 */
export function useLyrics({ trackId, trackName, artistName, albumName, durationMs }) {
  const [lyricsState, setLyricsState] = useState('loading');
  const [syncedLines, setSyncedLines] = useState(null);
  const [plainText, setPlainText] = useState(null);

  const cacheRef = useRef(new Map());
  const lastFetchedIdRef = useRef(null);

  const fetchLyrics = useCallback(async (id, name, artist, album, durMs) => {
    // Check cache first
    if (cacheRef.current.has(id)) {
      const cached = cacheRef.current.get(id);
      setSyncedLines(cached.syncedLines);
      setPlainText(cached.plainText);
      setLyricsState(cached.state);
      return;
    }

    setLyricsState('loading');
    setSyncedLines(null);
    setPlainText(null);

    const durationSec = durMs != null ? durMs / 1000 : undefined;
    const result = await getLyrics({
      trackName: name,
      artistName: artist,
      albumName: album,
      durationSec,
    });

    let state;
    let synced = null;
    let plain = null;

    if (!result) {
      state = 'not-found';
    } else if (result.instrumental) {
      state = 'instrumental';
    } else if (result.synced && result.synced.length > 0) {
      state = 'synced';
      synced = result.synced;
    } else if (result.plain) {
      state = 'plain';
      plain = result.plain;
    } else {
      state = 'not-found';
    }

    // Store in cache only if lyrics or instrumental were found
    if (result) {
      cacheRef.current.set(id, { syncedLines: synced, plainText: plain, state });
    }

    // Only apply if this is still the current track (avoid stale writes)
    if (lastFetchedIdRef.current === id) {
      setSyncedLines(synced);
      setPlainText(plain);
      setLyricsState(state);
    }
  }, []);

  useEffect(() => {
    if (!trackId || !trackName || !artistName) {
      setLyricsState('not-found');
      setSyncedLines(null);
      setPlainText(null);
      lastFetchedIdRef.current = null;
      return;
    }

    if (trackId === lastFetchedIdRef.current) return;
    lastFetchedIdRef.current = trackId;

    fetchLyrics(trackId, trackName, artistName, albumName, durationMs);
  }, [trackId, trackName, artistName, albumName, durationMs, fetchLyrics]);

  return { lyricsState, syncedLines, plainText };
}
