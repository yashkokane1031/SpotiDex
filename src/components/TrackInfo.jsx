import './TrackInfo.css';

/**
 * Right-hand panel: status badge, track metadata, progress bar, or empty state.
 *
 * @param {{
 *   track: object|null,
 *   isPlaying: boolean,
 *   smoothProgressMs: number,
 *   isSkippingToQueueItem?: boolean,
 *   skippingTargetName?: string
 * }} props
 */
export default function TrackInfo({
  track,
  isPlaying,
  smoothProgressMs,
  isSkippingToQueueItem,
  skippingTargetName,
}) {
  if (isSkippingToQueueItem) {
    return (
      <div className="track-info">
        <div className="track-info__status-row">
          <span className="track-info__badge">SKIPPING…</span>
          <div className="track-info__eq">
            <span className="track-info__eq-bar track-info__eq-bar--playing" />
            <span className="track-info__eq-bar track-info__eq-bar--playing" />
            <span className="track-info__eq-bar track-info__eq-bar--playing" />
            <span className="track-info__eq-bar track-info__eq-bar--playing" />
          </div>
        </div>
        <p className="track-info__name">Skipping to '{skippingTargetName || 'track'}'…</p>
        <p className="track-info__artist">Please wait while queue syncs</p>
        <p className="track-info__album">SPOTIFY QUEUE ADVANCE</p>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="track-info">
        <div className="track-info__status-row">
          <span className="track-info__badge">IDLE</span>
        </div>
        <div className="track-info__empty">
          <p className="track-info__empty-text">Nothing spinning right now</p>
        </div>
      </div>
    );
  }

  const progressPct = track.duration_ms > 0
    ? Math.min((smoothProgressMs / track.duration_ms) * 100, 100)
    : 0;

  const barClass = isPlaying ? 'track-info__eq-bar track-info__eq-bar--playing' : 'track-info__eq-bar';

  return (
    <div className="track-info">
      {/* Status row */}
      <div className="track-info__status-row">
        <span className="track-info__badge">
          {isPlaying ? 'NOW SPINNING' : 'PAUSED'}
        </span>
        <div className="track-info__eq">
          <span className={barClass} />
          <span className={barClass} />
          <span className={barClass} />
          <span className={barClass} />
        </div>
      </div>

      {/* Track metadata */}
      <p className="track-info__name">{track.name}</p>
      <p className="track-info__artist">by {track.artists}</p>
      <p className="track-info__album">{track.album.name}</p>



      {/* Progress bar */}
      <div className="track-info__progress">
        <div className="track-info__progress-track">
          <div
            className="track-info__progress-fill"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="track-info__progress-labels">
          <span>{formatMs(smoothProgressMs)}</span>
          <span>{formatMs(track.duration_ms)}</span>
        </div>
      </div>
    </div>
  );
}

function formatMs(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
