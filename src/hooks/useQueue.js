import { useState, useEffect, useRef, useCallback } from 'react';
import { getQueue } from '../lib/spotifyApi';
import { refreshAccessToken } from '../lib/spotifyAuth';
import { useAuth } from '../context/AuthContext';

const QUEUE_POLL_INTERVAL_MS = 8000;

/**
 * Custom hook to poll the user's Spotify queue.
 *
 * - Polls on an 8s interval decoupled from playback progress polling.
 * - Pauses polling when the tab is hidden (Page Visibility API).
 * - Handles 401 token refreshes.
 * - Provides refetchQueue() for immediate updates on skip/track changes.
 */
export function useQueue() {
  const { accessToken, saveTokens } = useAuth();

  const [queue, setQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const tokenRef = useRef(accessToken);
  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  const pollIntervalRef = useRef(null);

  const fetchQueueData = useCallback(async () => {
    const currentToken = tokenRef.current;
    if (!currentToken) return;

    const mapQueueItems = (items) =>
      (items || []).map((item) => ({
        ...item,
        uri: item.uri || (item.id ? `spotify:track:${item.id}` : ''),
      }));

    try {
      const data = await getQueue(currentToken);
      setQueue(mapQueueItems(data.queue));
      setError(null);
    } catch (err) {
      if (err.status === 401) {
        try {
          const storedRefresh = localStorage.getItem('spotify_refresh_token');
          if (!storedRefresh) throw new Error('No refresh token available');

          const tokens = await refreshAccessToken(storedRefresh);
          saveTokens(tokens);
          tokenRef.current = tokens.access_token;

          const retryData = await getQueue(tokens.access_token);
          setQueue(mapQueueItems(retryData.queue));
          setError(null);
        } catch (refreshErr) {
          console.error('Token refresh failed during queue fetch:', refreshErr);
          setError(refreshErr);
        }
      } else {
        console.error('Queue poll error:', err);
        setError(err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [saveTokens]);

  const startPolling = useCallback(() => {
    fetchQueueData();
    pollIntervalRef.current = setInterval(fetchQueueData, QUEUE_POLL_INTERVAL_MS);
  }, [fetchQueueData]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Set up polling and visibility listeners
  useEffect(() => {
    if (!accessToken) return;

    startPolling();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [accessToken, startPolling, stopPolling]);

  const refetchQueue = useCallback(() => {
    fetchQueueData();
  }, [fetchQueueData]);

  return { queue, isLoading, error, refetchQueue };
}
