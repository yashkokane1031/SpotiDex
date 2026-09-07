import { useState, useEffect, useRef, useCallback } from 'react';
import { getTopArtists, getArtistsBatch } from '../lib/spotifyApi';

const STORAGE_KEY = 'spotidex_artist_dex';

/**
 * Computes the artist's personal rarity tier based on playCount distribution
 * in the user's Dex (excluding zero-play backfilled entries).
 *
 * Tiers:
 * - playCount === 0: "encountered"
 * - top ~10% of ranked pool: "legendary"
 * - next ~25% of ranked pool: "rare"
 * - remainder with ≥ 1 play: "common"
 *
 * @param {object} artist
 * @param {Array<object>} allArtists
 * @returns {'encountered' | 'common' | 'rare' | 'legendary'}
 */
export function getRarityTier(artist, allArtists = []) {
  const plays = artist?.playCount || 0;
  if (plays <= 0) {
    return 'encountered';
  }

  const pool = allArtists.filter((a) => (a.playCount || 0) > 0);
  if (pool.length === 0) return 'encountered';
  if (pool.length === 1) return 'legendary';

  // If everyone with plays is tied at 1 play, consider them common
  const maxPlays = Math.max(...pool.map((a) => a.playCount || 0));
  if (maxPlays === 1 && plays === 1) {
    return 'common';
  }

  // Calculate percentage of artists who have strictly higher plays
  const strictlyHigher = pool.filter((a) => (a.playCount || 0) > plays).length;
  const topPercentile = strictlyHigher / pool.length;

  if (topPercentile < 0.10) {
    return 'legendary';
  }
  if (topPercentile < 0.35) {
    return 'rare';
  }
  return 'common';
}

/**
 * Format catalog number (e.g. 1 -> "#001", 42 -> "#042")
 */
export function formatDexNumber(num) {
  if (typeof num !== 'number' || isNaN(num)) return '#000';
  return `#${num.toString().padStart(3, '0')}`;
}

/**
 * Hook managing "The Dex" Pokédex-style artist collection.
 *
 * @param {{
 *   accessToken: string | null,
 *   track: object | null,
 *   isPlaying: boolean
 * }} params
 */
export function useDex({ accessToken, track, isPlaying }) {
  // Load persisted collection from localStorage
  const [dex, setDex] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore parse error
    }
    return [];
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncError, setSyncError] = useState(null);

  // Queue of genuinely new entries discovered via live listening (Fix 3)
  const [newEntryQueue, setNewEntryQueue] = useState([]);

  // Refs for tracking changes
  const dexRef = useRef(dex);
  useEffect(() => {
    dexRef.current = dex;
  }, [dex]);

  const lastProcessedTrackIdRef = useRef(null);
  const tokenRef = useRef(accessToken);
  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  // Helper to persist Dex to localStorage and state
  const saveDex = useCallback((updater) => {
    setDex((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.warn('Failed to persist Dex to localStorage:', err);
      }
      return next;
    });
  }, []);

  /**
   * Fix 4: Backfill from Spotify's Top Artists
   * Iterates long_term first (all-time favorites -> lowest "OG" Dex numbers),
   * then medium_term, then short_term.
   * Backfill NEVER triggers celebration toasts.
   */
  const syncTopArtists = useCallback(async () => {
    const token = tokenRef.current;
    if (!token) return { success: false, error: 'Not authenticated' };

    setIsSyncing(true);
    setSyncError(null);
    setSyncStatus('Scanning your Spotify listening history…');

    try {
      // 1. Fetch long_term first (OG all-time favorites)
      setSyncStatus('Fetching all-time favorites (long-term)…');
      const longTerm = await getTopArtists(token, 'long_term').catch(() => []);

      // 2. Fetch medium_term (past 6 months)
      setSyncStatus('Fetching mid-term favorites (medium-term)…');
      const mediumTerm = await getTopArtists(token, 'medium_term').catch(() => []);

      // 3. Fetch short_term (past 4 weeks)
      setSyncStatus('Fetching recent favorites (short-term)…');
      const shortTerm = await getTopArtists(token, 'short_term').catch(() => []);

      // Merge order: long_term -> medium_term -> short_term
      const orderedCandidates = [...longTerm, ...mediumTerm, ...shortTerm];

      saveDex((currentDex) => {
        const existingMap = new Map(currentDex.map((a) => [a.id, { ...a }]));
        let highestDexNumber = currentDex.reduce((max, a) => Math.max(max, a.dexNumber || 0), 0);

        for (const artist of orderedCandidates) {
          if (!artist || !artist.id) continue;

          if (existingMap.has(artist.id)) {
            // Already has a Dex number! Update enriched metadata only
            const existing = existingMap.get(artist.id);
            existingMap.set(artist.id, {
              ...existing,
              name: artist.name || existing.name,
              image: artist.images?.[0]?.url || artist.images?.[1]?.url || existing.image,
              genres: artist.genres?.length ? artist.genres : existing.genres,
              popularity: artist.popularity ?? existing.popularity,
              externalUrl: artist.external_urls?.spotify || existing.externalUrl,
            });
          } else {
            // Brand new to Dex: assign next sequential Dex number
            highestDexNumber += 1;
            const newEntry = {
              id: artist.id,
              dexNumber: highestDexNumber,
              name: artist.name || 'Unknown Artist',
              image: artist.images?.[0]?.url || artist.images?.[1]?.url || null,
              genres: artist.genres || [],
              popularity: artist.popularity ?? 50,
              firstDiscovered: Date.now(),
              lastListened: null,
              playCount: 0, // 0 plays on initial backfill
              uri: artist.uri || `spotify:artist:${artist.id}`,
              externalUrl: artist.external_urls?.spotify || `https://open.spotify.com/artist/${artist.id}`,
            };
            existingMap.set(artist.id, newEntry);
          }
        }

        // Return sorted by dexNumber
        return Array.from(existingMap.values()).sort((a, b) => a.dexNumber - b.dexNumber);
      });

      setSyncStatus('Sync complete!');
      setTimeout(() => setSyncStatus(null), 3000);
      return { success: true };
    } catch (err) {
      console.error('Failed to sync top artists:', err);
      setSyncError(err.message || 'Failed to sync top artists');
      return { success: false, error: err };
    } finally {
      setIsSyncing(false);
    }
  }, [saveDex]);

  /**
   * Fix 3: Live Listening Observer
   * Watches `track.id`. When playing a track, inspects all artists in `track.artistList`.
   * Increments play count for existing artists.
   * For genuinely new artists, assigns next dexNumber, enriches via API, and queues celebration toast.
   */
  useEffect(() => {
    const trackId = track?.id;
    if (!trackId || !isPlaying) return;
    if (trackId === lastProcessedTrackIdRef.current) return;

    lastProcessedTrackIdRef.current = trackId;

    const rawArtists = track.artistList || [];
    if (!rawArtists.length) return;

    const currentDex = dexRef.current;
    const existingIds = new Set(currentDex.map((a) => a.id));

    const newlyDiscovered = [];
    const knownToUpdate = [];

    for (const a of rawArtists) {
      if (!a.id) continue;
      if (existingIds.has(a.id)) {
        knownToUpdate.push(a.id);
      } else {
        newlyDiscovered.push(a);
        existingIds.add(a.id); // Prevent duplicate addition within same track
      }
    }

    // 1. Update plays for known artists
    if (knownToUpdate.length > 0) {
      saveDex((prev) =>
        prev.map((artist) => {
          if (knownToUpdate.includes(artist.id)) {
            return {
              ...artist,
              playCount: (artist.playCount || 0) + 1,
              lastListened: Date.now(),
            };
          }
          return artist;
        })
      );
    }

    // 2. Handle genuinely new artists
    if (newlyDiscovered.length > 0) {
      (async () => {
        const token = tokenRef.current;
        let enrichedMap = new Map();

        if (token) {
          try {
            const batch = await getArtistsBatch(
              token,
              newlyDiscovered.map((a) => a.id)
            );
            for (const item of batch) {
              if (item?.id) enrichedMap.set(item.id, item);
            }
          } catch (err) {
            console.warn('Failed to enrich live discovered artists:', err);
          }
        }

        const entriesToAdd = [];
        let highestDexNumber = dexRef.current.reduce(
          (max, a) => Math.max(max, a.dexNumber || 0),
          0
        );

        for (const raw of newlyDiscovered) {
          highestDexNumber += 1;
          const enriched = enrichedMap.get(raw.id);

          const newEntry = {
            id: raw.id,
            dexNumber: highestDexNumber,
            name: raw.name || enriched?.name || 'Unknown Artist',
            image: enriched?.images?.[0]?.url || enriched?.images?.[1]?.url || null,
            genres: enriched?.genres || [],
            popularity: enriched?.popularity ?? 50,
            firstDiscovered: Date.now(),
            lastListened: Date.now(),
            playCount: 1, // First play!
            uri: enriched?.uri || `spotify:artist:${raw.id}`,
            externalUrl:
              enriched?.external_urls?.spotify || `https://open.spotify.com/artist/${raw.id}`,
          };

          entriesToAdd.push(newEntry);
        }

        // Add to Dex collection
        saveDex((prev) => [...prev, ...entriesToAdd].sort((a, b) => a.dexNumber - b.dexNumber));

        // Queue celebration toasts one by one (Fix 3)
        setNewEntryQueue((prevQueue) => [...prevQueue, ...entriesToAdd]);
      })();
    }
  }, [track?.id, track?.artistList, isPlaying, saveDex]);

  /**
   * Dismiss the currently displayed celebration toast to advance the queue
   */
  const dismissCurrentToast = useCallback(() => {
    setNewEntryQueue((prev) => prev.slice(1));
  }, []);

  /**
   * Clear Dex data (for reset / re-syncing)
   */
  const clearDex = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    setDex([]);
    setNewEntryQueue([]);
  }, []);

  return {
    dex,
    isSyncing,
    syncStatus,
    syncError,
    syncTopArtists,
    currentToast: newEntryQueue[0] || null,
    dismissCurrentToast,
    clearDex,
  };
}
