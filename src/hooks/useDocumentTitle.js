import { useEffect } from 'react';

/**
 * Updates document.title dynamically based on current track:
 * - `♪ ${track.name} — SpotiDex` while a track is loaded
 * - `SpotiDex` when idle / nothing loaded
 *
 * @param {{ track: object|null, isPlaying?: boolean }} opts
 */
export function useDocumentTitle({ track, isPlaying }) {
  useEffect(() => {
    if (track?.name) {
      document.title = `♪ ${track.name} — SpotiDex`;
    } else {
      document.title = 'SpotiDex';
    }

    return () => {
      document.title = 'SpotiDex';
    };
  }, [track?.name, isPlaying]);
}
