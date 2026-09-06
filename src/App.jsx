import { useState, useEffect, useRef } from 'react';
import { useAuth } from './context/AuthContext';
import { useCurrentlyPlaying } from './hooks/useCurrentlyPlaying';
import { usePlaybackControls } from './hooks/usePlaybackControls';
import { usePlaybackState } from './hooks/usePlaybackState';
import { useQueue } from './hooks/useQueue';
import { useDevices } from './hooks/useDevices';
import { useListeningHistory } from './hooks/useListeningHistory';
import { useLyrics } from './hooks/useLyrics';
import { useObsMode } from './hooks/useObsMode';
import { useDocumentTitle } from './hooks/useDocumentTitle';
import { ThemeProvider } from './context/ThemeContext';
import PageFrame from './components/PageFrame';
import TabBar from './components/TabBar';
import VinylCard from './components/VinylCard';
import VinylRecord from './components/VinylRecord';
import TrackInfo from './components/TrackInfo';
import ControlModule from './components/ControlModule';
import AudioVisualizer from './components/AudioVisualizer';
import QueueCarousel from './components/QueueCarousel';
import RecentlyPlayedRail from './components/RecentlyPlayedRail';
import LyricsPanel from './components/LyricsPanel';
import LibraryPanel from './components/LibraryPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import OfflineFallback from './components/OfflineFallback';
import ReloadPrompt from './components/ReloadPrompt';
import './App.css';

function App() {
  const { isAuthenticated, isLoading: authLoading, login, logout } = useAuth();
  const { isObsMode, showControls } = useObsMode();
  const isOnline = useNetworkStatus();

  return (
    <>
      <ReloadPrompt />
      {!isOnline ? (
        <PageFrame isObsMode={isObsMode}>
          <OfflineFallback onRetry={() => window.location.reload()} />
        </PageFrame>
      ) : authLoading ? (
        <PageFrame isObsMode={isObsMode}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <p style={{ fontFamily: "'VT323', monospace", fontSize: '24px', color: 'var(--ink)', opacity: 0.6 }}>
              Loading…
            </p>
          </div>
        </PageFrame>
      ) : !isAuthenticated ? (
        <PageFrame isObsMode={isObsMode}>
          <VinylCard>
            <VinylRecord albumImages={null} isSpinning={false} draggable={false} />
            <LoginPanel onLogin={login} />
          </VinylCard>
        </PageFrame>
      ) : (
        <ErrorBoundary>
          <NowPlayingView
            onLogout={logout}
            isObsMode={isObsMode}
            showControls={showControls}
          />
        </ErrorBoundary>
      )}
    </>
  );
}

function NowPlayingView({ onLogout, isObsMode = false, showControls = true }) {
  // Remembered tab persisted in localStorage
  const [activeTab, setActiveTab] = useState(() => {
    try {
      return localStorage.getItem('spotidex_active_tab') || 'now-playing';
    } catch {
      return 'now-playing';
    }
  });

  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    try {
      localStorage.setItem('spotidex_active_tab', tab);
    } catch {
      // Ignore localStorage write error
    }
  };

  const {
    track,
    isPlaying,
    smoothProgressMs,
    error: pollError,
    refetch,
    setIsPlaying,
  } = useCurrentlyPlaying();

  // Dynamic tab title: "{track.name} - SpotiDex" or "SpotiDex"
  useDocumentTitle({ track, isPlaying });

  const {
    queue,
    isLoading: queueLoading,
    error: queueError,
    refetchQueue,
  } = useQueue();

  const {
    shuffleState,
    repeatState,
    hasContext,
    refetchPlaybackState,
  } = usePlaybackState();

  const controls = usePlaybackControls({
    isPlaying,
    setIsPlaying,
    trackId: track?.id ?? null,
    refetch,
    refetchQueue,
    refetchPlaybackState,
    serverShuffleState: shuffleState,
    serverRepeatState: repeatState,
    hasContext,
    queue,
  });

  const {
    devices,
    activeDeviceId,
    switchDevice,
  } = useDevices({
    onAfterTransfer: () => {
      refetch();
      refetchPlaybackState();
    },
  });

  const { history } = useListeningHistory({ track });

  const {
    lyricsState,
    syncedLines,
    plainText,
  } = useLyrics({
    trackId: track?.id ?? null,
    trackName: track?.name ?? null,
    artistName: typeof track?.artists === 'string' ? track.artists.split(',')[0].trim() : (track?.artists?.[0]?.name ?? null),
    albumName: track?.album?.name ?? null,
    durationMs: track?.duration_ms ?? null,
  });

  // Re-sync queue and playback state when current track changes
  useEffect(() => {
    if (track?.id) {
      refetchQueue();
      refetchPlaybackState();
    }
  }, [track?.id, refetchQueue, refetchPlaybackState]);

  // Stable refs for keyboard shortcut handler
  const controlsRef = useRef(controls);
  useEffect(() => {
    controlsRef.current = controls;
  });

  const volumeRef = useRef(70);

  // Global keyboard shortcuts (Space, ArrowLeft/Right, ArrowUp/Down)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore when focused inside an input/textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        return;
      }

      const ctrl = controlsRef.current;

      if (e.code === 'Space') {
        e.preventDefault();
        if (!ctrl.isBusy) {
          ctrl.togglePlayPause();
        }
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (!ctrl.isBusy) {
          ctrl.skipToNext();
        }
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (!ctrl.isBusy) {
          ctrl.skipToPrevious();
        }
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        volumeRef.current = Math.min(100, volumeRef.current + 5);
        ctrl.changeVolume(volumeRef.current);
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        volumeRef.current = Math.max(0, volumeRef.current - 5);
        ctrl.changeVolume(volumeRef.current);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const albumArtUrl = track?.album?.images?.[0]?.url ?? null;

  return (
    <ThemeProvider albumArtUrl={albumArtUrl}>
      <PageFrame isObsMode={isObsMode}>
        {/* Tab Bar (hidden in OBS mode) */}
        {!isObsMode && (
          <TabBar activeTab={activeTab} onSelectTab={handleSelectTab} />
        )}

        {/* OBS Mode: Force Now Playing only (ignoring whichever tab was active) */}
        {isObsMode ? (
            <>
              <VinylCard>
                <VinylRecord
                  albumImages={track?.album?.images ?? null}
                  isSpinning={isPlaying}
                  onSkipNext={controls.skipToNext}
                  onSkipPrevious={controls.skipToPrevious}
                  isBusy={controls.isBusy}
                  draggable={showControls}
                  trackId={track?.id ?? null}
                />
                <TrackInfo
                  track={track}
                  isPlaying={isPlaying}
                  smoothProgressMs={smoothProgressMs}
                  isSkippingToQueueItem={controls.isSkippingToQueueItem}
                  skippingTargetName={controls.skippingTargetName}
                />
              </VinylCard>

              <AudioVisualizer trackId={track?.id ?? 'idle'} isPlaying={isPlaying} />
            </>
          ) : (
            <>
              {/* Tab 1: Now Playing (VinylCard + AudioVisualizer) */}
              {activeTab === 'now-playing' && (
                <>
                  <VinylCard>
                    <VinylRecord
                      albumImages={track?.album?.images ?? null}
                      isSpinning={isPlaying}
                      onSkipNext={controls.skipToNext}
                      onSkipPrevious={controls.skipToPrevious}
                      isBusy={controls.isBusy}
                      draggable={true}
                      trackId={track?.id ?? null}
                    />
                    <TrackInfo
                      track={track}
                      isPlaying={isPlaying}
                      smoothProgressMs={smoothProgressMs}
                      isSkippingToQueueItem={controls.isSkippingToQueueItem}
                      skippingTargetName={controls.skippingTargetName}
                    />
                  </VinylCard>

                  <AudioVisualizer trackId={track?.id ?? 'idle'} isPlaying={isPlaying} />
                </>
              )}

              {/* Tab 2: Playing Next (QueueCarousel) */}
              {activeTab === 'playing-next' && (
                <QueueCarousel
                  queue={queue}
                  isLoading={queueLoading}
                  error={queueError}
                  refetchQueue={refetchQueue}
                  onPlayQueueItem={controls.playQueueItem}
                  onSwitchToNowPlaying={() => handleSelectTab('now-playing')}
                />
              )}

              {/* Tab 3: Recently Played (RecentlyPlayedRail) */}
              {activeTab === 'recently-played' && (
                <RecentlyPlayedRail
                  tracks={history.slice(0, 10)}
                  isLoading={false}
                  error={null}
                  onPlayTrack={controls.playTrackUri}
                />
              )}

              {/* Tab 4: Lyrics (LyricsPanel) */}
              {activeTab === 'lyrics' && (
                <LyricsPanel
                  lyricsState={lyricsState}
                  syncedLines={syncedLines}
                  plainText={plainText}
                  smoothProgressMs={smoothProgressMs}
                />
              )}

              {/* Tab 5: Library (LibraryPanel) */}
              {activeTab === 'library' && (
                <LibraryPanel onPlayPlaylist={controls.playPlaylist} />
              )}
            </>
          )}

          {/* Playback Controls (hidden in OBS mode unless ?controls=true) */}
          {(!isObsMode || showControls) && (
            <ControlModule
              controls={controls}
              isPlaying={isPlaying}
              hasContext={hasContext}
              devices={devices}
              activeDeviceId={activeDeviceId}
              onSwitchDevice={switchDevice}
            />
          )}

          {pollError && (
            <p className="app__error">Error: {pollError.message}</p>
          )}

          {/* Disconnect button (hidden in OBS mode unless ?controls=true) */}
        {(!isObsMode || showControls) && (
          <button className="logout-btn" onClick={onLogout}>
            DISCONNECT
          </button>
        )}
      </PageFrame>
    </ThemeProvider>
  );
}


function LoginPanel({ onLogin }) {
  return (
    <div className="login-panel">
      <p className="login-panel__text">Link your Spotify account to start tracking</p>
      <button className="login-panel__btn" onClick={onLogin}>
        CONNECT SPOTIFY
      </button>
    </div>
  );
}

export default App;
