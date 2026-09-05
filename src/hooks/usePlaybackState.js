import { useState, useEffect, useRef, useCallback } from 'react';
import { getPlaybackState } from '../lib/spotifyApi';
import { refreshAccessToken } from '../lib/spotifyAuth';
import { useAuth } from '../context/AuthContext';

const PLAYBACK_STATE_POLL_INTERVAL_MS = 6000;

/**
 * Polls Spotify's player state (/me/player) for shuffle and repeat states.
 * - Polls on a 6s interval.
 * - Pauses polling when the tab is hidden (Page Visibility API).
 * - Refreshes expired tokens on 401.
 * - Exposes refetchPlaybackState for immediate reconciliation.
 */
export function usePlaybackState() {
  const { accessToken, saveTokens } = useAuth();

  const [shuffleState, setShuffleState] = useState(false);
  const [repeatState, setRepeatState] = useState('off');
  const [context, setContext] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const hasContext = Boolean(context);

  const tokenRef = useRef(accessToken);
  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  const pollIntervalRef = useRef(null);

  const fetchState = useCallback(async () => {
    const currentToken = tokenRef.current;
    if (!currentToken) return;

    try {
      const data = await getPlaybackState(currentToken);
      if (data) {
        setShuffleState(data.shuffleState);
        setRepeatState(data.repeatState);
        setContext(data.context);
      } else {
        setContext(null);
      }
      setError(null);
    } catch (err) {
      if (err.status === 401) {
        try {
          const storedRefresh = localStorage.getItem('spotify_refresh_token');
          if (!storedRefresh) throw new Error('No refresh token available');

          const tokens = await refreshAccessToken(storedRefresh);
          saveTokens(tokens);
          tokenRef.current = tokens.access_token;

          const retryData = await getPlaybackState(tokens.access_token);
          if (retryData) {
            setShuffleState(retryData.shuffleState);
            setRepeatState(retryData.repeatState);
            setContext(retryData.context);
          } else {
            setContext(null);
          }
          setError(null);
        } catch (refreshErr) {
          console.error('Token refresh failed during playback state poll:', refreshErr);
          setError(refreshErr);
        }
      } else {
        setError(err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [saveTokens]);

  const startPolling = useCallback(() => {
    fetchState();
    pollIntervalRef.current = setInterval(fetchState, PLAYBACK_STATE_POLL_INTERVAL_MS);
  }, [fetchState]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

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

  const refetchPlaybackState = useCallback(() => {
    fetchState();
  }, [fetchState]);

  return {
    shuffleState,
    repeatState,
    context,
    hasContext,
    isLoading,
    error,
    refetchPlaybackState,
    setShuffleState,
  };
}
