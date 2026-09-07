import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserPlaylists } from '../lib/spotifyApi';

/**
 * Hook to fetch the user's playlists.
 *
 * @param {{ enabled?: boolean }} [options]
 * @returns {{
 *   playlists: Array<object>,
 *   ownedPlaylists: Array<object>,
 *   isLoading: boolean,
 *   error: Error|null,
 *   refetchLibrary: () => Promise<void>
 * }}
 */
export function useLibrary({ enabled = true } = {}) {
  const { accessToken } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const hasFetchedRef = useRef(false);

  const fetchLibrary = useCallback(async () => {
    if (!accessToken) return;

    setIsLoading(true);
    setError(null);

    try {
      const rawItems = await getUserPlaylists(accessToken);
      const items = [];

      for (const pl of rawItems) {
        if (!pl) continue;

        const images = pl.images || [];
        const image = images[0]?.url || '';

        items.push({
          id: pl.id,
          uri: pl.uri,
          name: pl.name || 'Untitled Playlist',
          description: pl.description || '',
          tracksCount: pl.items?.total ?? pl.tracks?.total ?? 0,
          image,
          ownerName: pl.owner?.display_name || pl.owner?.id || 'Spotify',
        });
      }

      setPlaylists(items);
      hasFetchedRef.current = true;
    } catch (err) {
      console.error('[useLibrary] Error fetching playlists:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (enabled && !hasFetchedRef.current) {
      fetchLibrary();
    }
  }, [enabled, fetchLibrary]);

  return {
    playlists,
    ownedPlaylists: playlists, // backward-compatibility
    isLoading,
    error,
    refetchLibrary: fetchLibrary,
  };
}
