import { useState, useEffect, useRef, useCallback } from 'react';
import { getDevices, transferPlayback } from '../lib/spotifyApi';
import { refreshAccessToken } from '../lib/spotifyAuth';
import { useAuth } from '../context/AuthContext';

const DEVICE_POLL_INTERVAL_MS = 10000; // 10s

/**
 * Polls Spotify's available devices (/me/player/devices).
 *
 * @param {{
 *   onAfterTransfer?: () => void
 * }} [options]
 */
export function useDevices({ onAfterTransfer } = {}) {
  const { accessToken, saveTokens } = useAuth();

  const [devices, setDevices] = useState([]);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState(null);

  const tokenRef = useRef(accessToken);
  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  const pollIntervalRef = useRef(null);

  const activeDevice = devices.find((d) => d.is_active);
  const activeDeviceId = activeDevice?.id || null;

  const fetchDevices = useCallback(async () => {
    const token = tokenRef.current;
    if (!token) return;

    try {
      const list = await getDevices(token);
      setDevices(list);
      setError(null);
    } catch (err) {
      if (err.status === 401) {
        try {
          const storedRefresh = localStorage.getItem('spotify_refresh_token');
          if (!storedRefresh) throw new Error('No refresh token available');

          const tokens = await refreshAccessToken(storedRefresh);
          saveTokens(tokens);
          tokenRef.current = tokens.access_token;

          const retryList = await getDevices(tokens.access_token);
          setDevices(retryList);
          setError(null);
        } catch (refreshErr) {
          console.error('Token refresh failed during devices poll:', refreshErr);
          setError(refreshErr);
        }
      } else {
        setError(err);
      }
    }
  }, [saveTokens]);

  const startPolling = useCallback(() => {
    fetchDevices();
    pollIntervalRef.current = setInterval(fetchDevices, DEVICE_POLL_INTERVAL_MS);
  }, [fetchDevices]);

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

  const switchDevice = useCallback(
    async (deviceId) => {
      const token = tokenRef.current;
      if (!token || isBusy || !deviceId) return;

      setIsBusy(true);
      setError(null);

      // Optimistic update of is_active
      setDevices((prev) =>
        prev.map((d) => ({
          ...d,
          is_active: d.id === deviceId,
        }))
      );

      try {
        await transferPlayback(token, deviceId);
        // Wait briefly for Spotify to transfer state
        setTimeout(() => {
          fetchDevices();
          onAfterTransfer?.();
        }, 500);
      } catch (err) {
        setError(err);
        fetchDevices(); // revert on failure
      } finally {
        setIsBusy(false);
      }
    },
    [isBusy, onAfterTransfer, fetchDevices]
  );

  return {
    devices,
    activeDeviceId,
    switchDevice,
    isBusy,
    error,
    refetchDevices: fetchDevices,
  };
}
