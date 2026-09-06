import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPlaylistTracks } from '../lib/spotifyApi';

/**
 * Hook to fetch and cache tracks for a selected playlist.
 *
 * @param {string|null} playlistId
 * @returns {{ tracks: Array<object>, isLoading: boolean, error: Error|null }}
 */
export function usePlaylistTracks(playlistId) {
  const { accessToken } = useAuth();
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // In-memory cache keyed by playlistId
  const cacheRef = useRef(new Map());

  useEffect(() => {
    if (!playlistId || !accessToken) {
      setTracks([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Check cache first
    if (cacheRef.current.has(playlistId)) {
      setTracks(cacheRef.current.get(playlistId));
      setIsLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    getPlaylistTracks(accessToken, playlistId)
      .then((items) => {
        if (!isMounted) return;
        cacheRef.current.set(playlistId, items);
        setTracks(items);
        setError(null);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('[usePlaylistTracks] Error fetching tracks:', err);
        setError(err);
        setTracks([]);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [playlistId, accessToken]);

  return { tracks, isLoading, error };
}
