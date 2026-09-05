import { useEffect, useMemo } from 'react';

/**
 * Hook to detect and configure OBS Studio Browser Source overlay mode.
 *
 * Query parameters:
 * - ?obs=true       : Activates OBS mode (transparent background, removes decorative chrome, tight bounds).
 * - ?controls=true  : (Optional) Displays playback controls & tabs in OBS mode (default: false in OBS mode).
 *
 * Note on Authentication for OBS:
 * Since Spotify OAuth redirects do not execute cleanly inside OBS's internal CEF browser,
 * the user should first authenticate in a standard browser window (e.g. Chrome/Edge)
 * pointing to http://localhost:5173. Once connected and stored in localStorage,
 * copy the URL with ?obs=true into the OBS Browser Source.
 *
 * @returns {{ isObsMode: boolean, showControls: boolean }}
 */
export function useObsMode() {
  const { isObsMode, showControls } = useMemo(() => {
    if (typeof window === 'undefined') {
      return { isObsMode: false, showControls: true };
    }
    const params = new URLSearchParams(window.location.search);
    const obs = params.get('obs') === 'true';
    const controls = obs ? params.get('controls') === 'true' : true;
    return { isObsMode: obs, showControls: controls };
  }, []);

  useEffect(() => {
    if (isObsMode) {
      document.body.classList.add('obs-mode');
      const root = document.getElementById('root');
      if (root) root.classList.add('obs-mode');
    } else {
      document.body.classList.remove('obs-mode');
      const root = document.getElementById('root');
      if (root) root.classList.remove('obs-mode');
    }

    return () => {
      document.body.classList.remove('obs-mode');
      const root = document.getElementById('root');
      if (root) root.classList.remove('obs-mode');
    };
  }, [isObsMode]);

  return { isObsMode, showControls };
}
