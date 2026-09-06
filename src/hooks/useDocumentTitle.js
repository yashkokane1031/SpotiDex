import { useEffect } from 'react';

/**
 * Updates document.title dynamically based on current track:
 * - Browser tabs: `${track.name} - SpotiDex` (Song name first, then hyphen SpotiDex)
 * - Standalone PWA windows: `${track.name}` (avoids duplicate "SpotiDex - ... - SpotiDex" since OS already prepends app name)
 * - Idle / nothing playing: `SpotiDex`
 *
 * @param {{ track: object|null, isPlaying?: boolean }} opts
 */
export function useDocumentTitle({ track, isPlaying }) {
  useEffect(() => {
    // Robust detection for installed PWA / Chrome app windows (no address bar)
    const isAppWindow = typeof window !== 'undefined' && (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches ||
      window.matchMedia('(display-mode: window-controls-overlay)').matches ||
      window.navigator.standalone === true ||
      (window.locationbar && !window.locationbar.visible) ||
      (window.menubar && !window.menubar.visible) ||
      (window.outerHeight > 0 && window.innerHeight > 0 && (window.outerHeight - window.innerHeight < 90))
    );

    if (track?.name) {
      if (isAppWindow) {
        // In an installed PWA window, Windows/Chromium forcibly prepends "SpotiDex - ".
        // Setting document.title to track.name produces "SpotiDex - <Song Name>" (no duplicate SpotiDex).
        document.title = track.name;
      } else {
        // In regular browser tabs (with address bar), display "<Song Name> - SpotiDex" (song name first)
        document.title = `${track.name} - SpotiDex`;
      }
    } else {
      document.title = 'SpotiDex';
    }

    return () => {
      document.title = 'SpotiDex';
    };
  }, [track?.name, isPlaying]);
}
