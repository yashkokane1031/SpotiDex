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
    const isStandalone = typeof window !== 'undefined' && (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    );

    if (track?.name) {
      if (isStandalone) {
        // In standalone PWA, Chromium/Windows title bar forcibly prepends "SpotiDex - ".
        // Keeping document.title to track.name avoids repeating "SpotiDex" twice.
        document.title = track.name;
      } else {
        // In browser tabs: song name first, then hyphen SpotiDex
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
