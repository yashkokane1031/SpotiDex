import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  pausePlayback,
  resumePlayback,
  playTracks,
  setShuffle,
  setRepeat,
  skipNext,
  skipPrevious,
  setVolume,
} from '../lib/spotifyApi';

/**
 * Playback controls hook — wraps Spotify API control calls with:
 * - In-flight lock (isBusy) preventing double-actions
 * - Optimistic UI updates
 * @param {{
 *   isPlaying: boolean,
 *   setIsPlaying: (v: boolean) => void,
 *   trackId: string|null,
 *   refetch: () => void,
 *   refetchQueue?: () => void,
 *   refetchPlaybackState?: () => void,
 *   serverShuffleState?: boolean,
 *   serverRepeatState?: string,
 *   hasContext?: boolean,
 *   queue?: Array
 * }} opts
 */
export function usePlaybackControls({
  isPlaying,
  setIsPlaying,
  trackId,
  refetch,
  refetchQueue,
  refetchPlaybackState,
  serverShuffleState = false,
  serverRepeatState = 'off',
  hasContext = true,
  queue = [],
}) {
  const { accessToken } = useAuth();
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [isShuffle, setIsShuffle] = useState(serverShuffleState);
  const [repeatState, setRepeatState] = useState(serverRepeatState);
  const [isSkippingToQueueItem, setIsSkippingToQueueItem] = useState(false);
  const [skippingTargetName, setSkippingTargetName] = useState('');

  // Synchronize local optimistic state with server polling updates
  useEffect(() => {
    setIsShuffle(serverShuffleState);
  }, [serverShuffleState]);

  useEffect(() => {
    setRepeatState(serverRepeatState);
  }, [serverRepeatState]);

  const errorTimerRef = useRef(null);
  const noticeTimerRef = useRef(null);
  const hasNotifiedShuffleRef = useRef(false);

  // --- Auto-clear errors after 4s ---
  useEffect(() => {
    if (!error) return;
    errorTimerRef.current = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(errorTimerRef.current);
  }, [error]);

  // --- Auto-clear notices after 4s ---
  useEffect(() => {
    if (!notice) return;
    noticeTimerRef.current = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(noticeTimerRef.current);
  }, [notice]);

  /**
   * Run a control action with the in-flight lock.
   */
  const runAction = useCallback(async (fn) => {
    if (isBusy || !accessToken) return;
    setIsBusy(true);
    setError(null);
    try {
      await fn(accessToken);
    } catch (err) {
      setError(err);
    } finally {
      setIsBusy(false);
    }
  }, [isBusy, accessToken]);

  // --- Play/Pause ---
  const togglePlayPause = useCallback(() => {
    // Optimistic flip
    const wasPlaying = isPlaying;
    setIsPlaying(!wasPlaying);

    runAction(async (token) => {
      if (wasPlaying) {
        await pausePlayback(token);
      } else {
        await resumePlayback(token);
      }
    });
  }, [isPlaying, setIsPlaying, runAction]);

  // --- Skip ---
  const skipToNext = useCallback(() => {
    runAction(async (token) => {
      await skipNext(token);
      // Small delay to let Spotify register the skip before refetching
      setTimeout(() => {
        refetch();
        refetchQueue?.();
      }, 300);
    });
  }, [runAction, refetch, refetchQueue]);

  const skipToPrevious = useCallback(() => {
    runAction(async (token) => {
      await skipPrevious(token);
      setTimeout(() => {
        refetch();
        refetchQueue?.();
      }, 300);
    });
  }, [runAction, refetch, refetchQueue]);

  // --- Volume ---
  const changeVolume = useCallback((percent) => {
    if (!accessToken) return;
    // Volume uses its own path — no isBusy lock (would block other controls during drag)
    setVolume(accessToken, percent).catch((err) => setError(err));
  }, [accessToken]);

  // --- Shuffle toggle ---
  const toggleShuffle = useCallback(() => {
    if (isBusy || !accessToken || !hasContext) return;

    const nextState = !isShuffle;
    setIsShuffle(nextState); // optimistic flip

    runAction(async (token) => {
      try {
        await setShuffle(token, nextState);
      } finally {
        refetchPlaybackState?.();
      }
    });
  }, [isBusy, accessToken, hasContext, isShuffle, runAction, refetchPlaybackState]);

  // --- Repeat cycle: off -> context -> track -> off ---
  const cycleRepeat = useCallback(() => {
    if (isBusy || !accessToken) return;

    const nextState =
      repeatState === 'off' ? 'context' : repeatState === 'context' ? 'track' : 'off';
    setRepeatState(nextState); // optimistic cycle

    runAction(async (token) => {
      try {
        await setRepeat(token, nextState);
      } finally {
        refetchPlaybackState?.();
      }
    });
  }, [isBusy, accessToken, repeatState, runAction, refetchPlaybackState]);

  // --- Click-to-play from queue (direct single-call via playTracks) ---
  const playQueueItem = useCallback(
    async (index, customQueue = null) => {
      const activeQueue = Array.isArray(customQueue) ? customQueue : queue;
      if (isBusy || !accessToken || !activeQueue || index < 0 || index >= activeQueue.length) return;

      const targetTrack = activeQueue[index];
      const urisToPlay = [
        targetTrack.uri,
        ...activeQueue.slice(index + 1).map((t) => t.uri),
      ].filter(Boolean);

      if (urisToPlay.length === 0) return;

      setIsBusy(true);
      setError(null);
      setIsSkippingToQueueItem(true);
      setSkippingTargetName(targetTrack.name || '');

      try {
        // Deliberate override: disable shuffle so Spotify plays the exact chosen track
        await setShuffle(accessToken, false);
        setIsShuffle(false);
        refetchPlaybackState?.();

        // One-time notification per session to explain the shuffle setting change
        if (!hasNotifiedShuffleRef.current) {
          hasNotifiedShuffleRef.current = true;
          setNotice('Shuffle turned off to play this track');
        }

        // Send the track sequence directly
        await playTracks(accessToken, urisToPlay);

        await Promise.all([
          refetch?.(),
          refetchQueue?.(),
        ]);
      } catch (err) {
        setError(err);
      } finally {
        setIsSkippingToQueueItem(false);
        setSkippingTargetName('');
        setIsBusy(false);
      }
    },
    [isBusy, accessToken, queue, refetch, refetchQueue, refetchPlaybackState]
  );

  // --- Play a specific single track URI (used by Recently Played) ---
  const playTrackUri = useCallback(
    async (uri, trackName = '') => {
      if (isBusy || !accessToken || !uri) return;

      setIsBusy(true);
      setError(null);
      setIsSkippingToQueueItem(true);
      setSkippingTargetName(trackName || '');

      try {
        await setShuffle(accessToken, false);
        setIsShuffle(false);
        refetchPlaybackState?.();

        if (!hasNotifiedShuffleRef.current) {
          hasNotifiedShuffleRef.current = true;
          setNotice('Shuffle turned off to play this track');
        }

        await playTracks(accessToken, [uri]);

        await Promise.all([
          refetch?.(),
          refetchQueue?.(),
        ]);
      } catch (err) {
        setError(err);
      } finally {
        setIsSkippingToQueueItem(false);
        setSkippingTargetName('');
        setIsBusy(false);
      }
    },
    [isBusy, accessToken, refetch, refetchQueue, refetchPlaybackState]
  );

  return {
    togglePlayPause,
    skipToNext,
    skipToPrevious,
    changeVolume,
    toggleShuffle,
    isShuffle,
    cycleRepeat,
    repeatState,
    hasContext,
    playQueueItem,
    playTrackUri,
    isSkippingToQueueItem,
    skippingTargetName,
    isBusy,
    error,
    notice,
  };
}
