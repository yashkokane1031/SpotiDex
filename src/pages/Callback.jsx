import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { exchangeCodeForToken } from '../lib/spotifyAuth';
import { useAuth } from '../context/AuthContext';

export default function Callback() {
  const navigate = useNavigate();
  const { saveTokens } = useAuth();
  const hasRun = useRef(false);

  useEffect(() => {
    // Prevent double-fire in React StrictMode
    if (hasRun.current) return;
    hasRun.current = true;

    async function handleCallback() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const returnedState = params.get('state');
      const storedState = sessionStorage.getItem('pkce_state');

      // --- Validate state for CSRF protection ---
      if (!returnedState || returnedState !== storedState) {
        console.error(
          'State mismatch — possible CSRF attack. ' +
          `Expected "${storedState}", got "${returnedState}".`
        );
        navigate('/', { replace: true });
        return;
      }

      sessionStorage.removeItem('pkce_state');

      if (!code) {
        console.error('No authorization code found in callback URL.');
        navigate('/', { replace: true });
        return;
      }

      try {
        const tokens = await exchangeCodeForToken(code);
        saveTokens(tokens);
        navigate('/', { replace: true });
      } catch (err) {
        console.error('Token exchange failed:', err);
        navigate('/', { replace: true });
      }
    }

    handleCallback();
  }, [navigate, saveTokens]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <p>Connecting to Spotify...</p>
    </div>
  );
}
