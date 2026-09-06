import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCurrentUserId, getUserPlaylists } from '../lib/spotifyApi';

/**
 * Hook to fetch user playlists and partition them into owned vs followed/made-for-you.
 *
 * @param {{ enabled?: boolean }} [options]
 * @returns {{
 *   ownedPlaylists: Array<object>,
 *   followedPlaylists: Array<object>,
 *   isLoading: boolean,
 *   error: Error|null,
 *   refetchLibrary: () => Promise<void>
 * }}
 */
export function useLibrary({ enabled = true } = {}) {
  const { accessToken } = useAuth();
  const [ownedPlaylists, setOwnedPlaylists] = useState([]);
  const [followedPlaylists, setFollowedPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const userIdRef = useRef(null);
  const hasFetchedRef = useRef(false);

  const fetchLibrary = useCallback(async () => {
    if (!accessToken) return;

    setIsLoading(true);
    setError(null);

    try {
      if (!userIdRef.current) {
        userIdRef.current = await getCurrentUserId(accessToken);
      }

      const rawItems = await getUserPlaylists(accessToken);
      const currentId = userIdRef.current;

      const owned = [];
      const followed = [];

      for (const pl of rawItems) {
        if (!pl) continue;
        const isOwner = pl.owner && pl.owner.id === currentId;
        const images = pl.images || [];
        const image = images[0]?.url || '';

        const item = {
          id: pl.id,
          uri: pl.uri,
          name: pl.name || 'Untitled Playlist',
          description: pl.description || '',
          tracksCount: pl.tracks?.total ?? 0,
          image,
          ownerName: pl.owner?.display_name || pl.owner?.id || 'Spotify',
          isOwner,
        };

        if (isOwner) {
          owned.push(item);
        } else {
          followed.push(item);
        }
      }

      setOwnedPlaylists(owned);
      setFollowedPlaylists(followed);
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
    ownedPlaylists,
    followedPlaylists,
    isLoading,
    error,
    refetchLibrary: fetchLibrary,
  };
}
