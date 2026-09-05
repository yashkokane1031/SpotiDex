import { useState, useEffect, useRef, useCallback } from 'react';
import { getCurrentlyPlaying } from '../lib/spotifyApi';
import { refreshAccessToken } from '../lib/spotifyAuth';
import { useAuth } from '../context/AuthContext';

const POLL_INTERVAL_MS = 3000;
const SMOOTH_INTERVAL_MS = 250;

/**
 * Polls Spotify's currently-playing endpoint every 3 s.
 *
 * - Automatically refreshes the access token on 401 and retries immediately.
 * - Pauses polling when the tab is backgrounded (Page Visibility API).
 * - Provides `smoothProgressMs` via a 250ms local interpolation ticker
 *   so the progress bar advances smoothly between polls.
 * - Cleans up on unmount.
 */
export function useCurrentlyPlaying() {
  const { accessToken, saveTokens } = useAuth();

  const [track, setTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressMs, setProgressMs] = useState(0);
  const [smoothProgressMs, setSmoothProgressMs] = useState(0);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mutable ref for the latest token — avoids restarting intervals on refresh.
  const tokenRef = useRef(accessToken);
  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  // Snapshot ref for smooth progress interpolation.
  // Updated on each successful poll; read by the 250ms ticker.
  const snapshotRef = useRef({
    serverProgressMs: 0,
    serverTimestamp: Date.now(),
    isPlaying: false,
    durationMs: 0,
  });

  const pollIntervalRef = useRef(null);
  const smoothIntervalRef = useRef(null);

  /**
   * Apply track data from a successful poll.
   */
  const applyTrackData = useCallback((data) => {
    if (data) {
      setTrack(data);
      setIsPlaying(data.is_playing);
      setProgressMs(data.progress_ms);

      // Update snapshot for smooth interpolation
      snapshotRef.current = {
        serverProgressMs: data.progress_ms,
        serverTimestamp: Date.now(),
        isPlaying: data.is_playing,
        durationMs: data.duration_ms,
      };
    } else {
      setTrack(null);
      setIsPlaying(false);
      setProgressMs(0);
      setSmoothProgressMs(0);

      snapshotRef.current = {
        serverProgressMs: 0,
        serverTimestamp: Date.now(),
        isPlaying: false,
        durationMs: 0,
      };
    }
  }, []);

  /**
   * Fetch currently-playing, handling 401 with a token refresh + retry.
   */
  const fetchNowPlaying = useCallback(async () => {
    const currentToken = tokenRef.current;
    if (!currentToken) return;

    try {
      const data = await getCurrentlyPlaying(currentToken);
      applyTrackData(data);
      setError(null);
    } catch (err) {
      if (err.status === 401) {
        // Token expired — refresh and retry once
        try {
          const storedRefresh = localStorage.getItem('spotify_refresh_token');
          if (!storedRefresh) throw new Error('No refresh token available');

          const tokens = await refreshAccessToken(storedRefresh);
          saveTokens(tokens);
          tokenRef.current = tokens.access_token;

          // Retry with the fresh token
          const retryData = await getCurrentlyPlaying(tokens.access_token);
          applyTrackData(retryData);
          setError(null);
        } catch (refreshErr) {
          console.error('Token refresh failed during poll:', refreshErr);
          setError(refreshErr);
        }
      } else {
        console.error('Spotify poll error:', err);
        setError(err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [saveTokens, applyTrackData]);

  /**
   * Start / stop the 3s API polling interval.
   */
  const startPolling = useCallback(() => {
    fetchNowPlaying();
    pollIntervalRef.current = setInterval(fetchNowPlaying, POLL_INTERVAL_MS);
  }, [fetchNowPlaying]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  /**
   * Start / stop the 250ms smooth progress ticker.
   */
  const startSmooth = useCallback(() => {
    smoothIntervalRef.current = setInterval(() => {
      const snap = snapshotRef.current;
      if (snap.isPlaying && snap.durationMs > 0) {
        const elapsed = Date.now() - snap.serverTimestamp;
        const computed = Math.min(snap.serverProgressMs + elapsed, snap.durationMs);
        setSmoothProgressMs(computed);
      } else {
        // When paused or nothing playing, just reflect the last known position
        setSmoothProgressMs(snap.serverProgressMs);
      }
    }, SMOOTH_INTERVAL_MS);
  }, []);

  const stopSmooth = useCallback(() => {
    if (smoothIntervalRef.current) {
      clearInterval(smoothIntervalRef.current);
      smoothIntervalRef.current = null;
    }
  }, []);

  /**
   * Main effect: poll + smooth-tick while the tab is visible, pause when hidden.
   */
  useEffect(() => {
    if (!accessToken) return;

    function handleVisibilityChange() {
      if (document.hidden) {
        stopPolling();
        stopSmooth();
      } else {
        startPolling();
        startSmooth();
      }
    }

    startPolling();
    startSmooth();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      stopSmooth();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [accessToken, startPolling, stopPolling, startSmooth, stopSmooth]);

  /**
   * Fire an immediate one-shot poll (doesn't reset the interval timer).
   * Used by playback controls after skip to get the new track faster.
   */
  const refetch = useCallback(() => {
    fetchNowPlaying();
  }, [fetchNowPlaying]);

  return { track, isPlaying, progressMs, smoothProgressMs, error, isLoading, refetch, setIsPlaying };
}
