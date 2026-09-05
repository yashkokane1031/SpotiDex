import { useState, useCallback } from 'react';
import DepthCarousel from './DepthCarousel';
import './QueueCarousel.css';

/**
 * QueueCarousel — displays upcoming tracks using DepthCarousel with SpotiDex pixel aesthetic.
 * - Browsing/dragging the carousel only changes focus (read-only by default).
 * - Focused card displays an explicit "PLAY" button to trigger playQueueItem.
 * - Auto-switches tab back to "now-playing" upon clicking play.
 *
 * @param {{
 *   queue: Array,
 *   isLoading: boolean,
 *   error: Error|null,
 *   refetchQueue: () => void,
 *   onPlayQueueItem?: (index: number, trackName: string) => void,
 *   onSwitchToNowPlaying?: () => void
 * }} props
 */
export default function QueueCarousel({
  queue = [],
  isLoading = false,
  error = null,
  refetchQueue,
  onPlayQueueItem,
  onSwitchToNowPlaying,
}) {
  const [focusedIndex, setFocusedIndex] = useState(0);

  const count = queue.length;
  const currentFocusedTrack = count > 0 ? queue[Math.min(focusedIndex, count - 1)] : null;

  const handlePlay = useCallback(
    (index, item) => {
      const trackName = item?.name || currentFocusedTrack?.name || '';
      onPlayQueueItem?.(index, trackName);
      onSwitchToNowPlaying?.();
    },
    [currentFocusedTrack, onPlayQueueItem, onSwitchToNowPlaying]
  );

  return (
    <section className="queue-carousel-panel" id="panel-playing-next" aria-label="Playback Queue">
      {/* Header */}
      <div className="queue-carousel-panel__header">
        <div className="queue-carousel-panel__title-group">
          <span className="queue-carousel-panel__led" />
          <h2 className="queue-carousel-panel__title">UP NEXT</h2>
        </div>
        <div className="queue-carousel-panel__tag">
          {isLoading ? (
            '[ SYNCING... ]'
          ) : count > 0 ? (
            `[ ${count} ${count === 1 ? 'TRACK' : 'TRACKS'} ]`
          ) : (
            '[ QUEUE EMPTY ]'
          )}
        </div>
      </div>

      {/* Main Carousel Area */}
      <div className="queue-carousel-panel__body">
        {isLoading && count === 0 ? (
          <div className="queue-carousel-panel__empty">
            <p className="queue-carousel-panel__status-text">LOADING QUEUE DATA…</p>
          </div>
        ) : count === 0 ? (
          <div className="queue-carousel-panel__empty">
            <p className="queue-carousel-panel__empty-title">NO TRACKS IN QUEUE</p>
            <p className="queue-carousel-panel__empty-hint">
              Add songs to your Spotify queue to preview them in 3D
            </p>
            <button
              type="button"
              className="queue-carousel-panel__refresh-btn"
              onClick={refetchQueue}
            >
              REFRESH QUEUE
            </button>
          </div>
        ) : (
          <div className="queue-carousel-panel__carousel-wrap">
            <DepthCarousel
              items={queue}
              cardWidth={210}
              cardHeight={270}
              radius={0}
              depth={170}
              spread={65}
              tilt={16}
              tiltDirection="right"
              perspective={1300}
              visibleCards={4}
              falloff={0.25}
              blur={2}
              loop={count > 2}
              showControls={true}
              showIndicators={count <= 12}
              onChange={(idx) => setFocusedIndex(idx)}
              onPlayItem={(idx, item) => handlePlay(idx, item)}
            />
          </div>
        )}
      </div>

      {/* Footer Strip */}
      {count > 0 && currentFocusedTrack && (
        <div className="queue-carousel-panel__footer">
          <div className="queue-carousel-panel__footer-track">
            <span className="queue-carousel-panel__footer-num">#{focusedIndex + 1}</span>
            <span className="queue-carousel-panel__footer-name" title={currentFocusedTrack.name}>
              {currentFocusedTrack.name}
            </span>
            <span className="queue-carousel-panel__footer-dot">•</span>
            <span className="queue-carousel-panel__footer-artist" title={currentFocusedTrack.artists}>
              {currentFocusedTrack.artists}
            </span>
          </div>

          <div className="queue-carousel-panel__footer-actions">
            <button
              type="button"
              className="queue-carousel-panel__play-btn"
              onClick={() => handlePlay(focusedIndex, currentFocusedTrack)}
              title={`Play ${currentFocusedTrack.name}`}
            >
              <svg viewBox="0 0 16 16" width="10" height="10" fill="currentColor">
                <path d="M4 2l10 6-10 6z" />
              </svg>
              <span>PLAY TRACK</span>
            </button>
          </div>
        </div>
      )}

      {error && !isLoading && (
        <div className="queue-carousel-panel__error">
          <span>Failed to sync queue. Reconnecting…</span>
        </div>
      )}
    </section>
  );
}
