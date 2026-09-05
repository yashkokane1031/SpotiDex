import { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = 'spotidex_listening_history';
const MAX_ENTRIES = 50;

/**
 * Locally-tracked listening history built from useCurrentlyPlaying data.
 *
 * - Appends a new entry whenever the current track ID changes
 * - Persists to localStorage (capped at 50 entries)
 * - Survives page refreshes
 * - No network calls
 *
 * @param {{ track: object | null }} params — the track object from useCurrentlyPlaying
 * @returns {{ history: Array<{ uri: string, name: string, artist: string, image: string, playedAt: number }> }}
 */
export function useListeningHistory({ track }) {
  const [history, setHistory] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed.slice(0, MAX_ENTRIES);
      }
    } catch {
      // Corrupted data — start fresh
    }
    return [];
  });

  const lastLoggedTrackIdRef = useRef(history[0]?.id ?? null);

  useEffect(() => {
    const id = track?.id;
    if (!id || id === lastLoggedTrackIdRef.current) return;

    lastLoggedTrackIdRef.current = id;

    const images = track.album?.images ?? [];
    const image = images[1]?.url ?? images[0]?.url ?? '';

    const entry = {
      id,
      uri: track.uri || `spotify:track:${id}`,
      name: track.name || 'Unknown Track',
      artist: typeof track.artists === 'string'
        ? track.artists
        : Array.isArray(track.artists)
          ? track.artists.map((a) => a.name).join(', ')
          : 'Unknown Artist',
      image,
      playedAt: Date.now(),
    };

    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, MAX_ENTRIES);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Storage full — silently drop
      }

      return next;
    });
  }, [track?.id, track?.uri, track?.name, track?.artists, track?.album]);

  return { history };
}
