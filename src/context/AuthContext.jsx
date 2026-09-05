import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { redirectToSpotifyAuth, refreshAccessToken } from '../lib/spotifyAuth';

const AuthContext = createContext(null);

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'spotify_access_token',
  REFRESH_TOKEN: 'spotify_refresh_token',
  EXPIRY: 'spotify_token_expiry',
};

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Persist a token set to localStorage and update React state.
   */
  const saveTokens = useCallback(({ access_token, refresh_token, expires_in }) => {
    const expiryTimestamp = Date.now() + expires_in * 1000;

    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);
    localStorage.setItem(STORAGE_KEYS.EXPIRY, expiryTimestamp.toString());

    setAccessToken(access_token);
    setIsAuthenticated(true);
  }, []);

  /**
   * On mount: rehydrate tokens from localStorage.
   * If expired, attempt a silent refresh.
   */
  useEffect(() => {
    async function rehydrate() {
      const storedAccess = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const storedRefresh = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      const storedExpiry = localStorage.getItem(STORAGE_KEYS.EXPIRY);

      if (!storedAccess || !storedRefresh || !storedExpiry) {
        setIsLoading(false);
        return;
      }

      const now = Date.now();
      const expiry = Number(storedExpiry);

      if (now < expiry) {
        // Token still valid
        setAccessToken(storedAccess);
        setIsAuthenticated(true);
      } else {
        // Token expired — try refreshing
        try {
          const tokens = await refreshAccessToken(storedRefresh);
          saveTokens(tokens);
        } catch (err) {
          console.error('Failed to refresh token on mount:', err);
          logout();
        }
      }

      setIsLoading(false);
    }

    rehydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(() => {
    redirectToSpotifyAuth();
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.EXPIRY);
    setAccessToken(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, accessToken, isLoading, login, logout, saveTokens }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Convenience hook — must be used inside <AuthProvider>.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
