import './RecentlyPlayedRail.css';

/**
 * Pixel-styled horizontal scrollable rail showing recently played tracks.
 *
 * @param {{
 *   tracks: Array<{ id: string, uri: string, name: string, artist: string, album: string, image: string, playedAt: string }>,
 *   isLoading: boolean,
 *   error: Error|null,
 *   onPlayTrack: (uri: string, name: string) => void,
 * }} props
 */
export default function RecentlyPlayedRail({
  tracks = [],
  isLoading = false,
  error = null,
  onPlayTrack,
}) {
  return (
    <div
      className="recently-played-panel"
      role="tabpanel"
      id="panel-recently-played"
      aria-labelledby="tab-recently-played"
    >
      {/* Panel Header */}
      <div className="recently-played-panel__header">
        <div className="recently-played-panel__title-group">
          <span className="recently-played-panel__led" />
          <h2 className="recently-played-panel__title">RECENTLY PLAYED</h2>
        </div>
        <span className="recently-played-panel__tag">HISTORY (LAST 10)</span>
      </div>

      {/* Error banner if present */}
      {error && (
        <div className="recently-played-panel__error">
          {error.status === 403 || error.message.includes('403') || error.message.includes('Permission')
            ? 'DISCONNECT & RECONNECT SPOTIFY TO ENABLE RECENTLY PLAYED'
            : `Error: ${error.message}`}
        </div>
      )}

      {/* Body: Horizontal Strip */}
      <div className="recently-played-panel__body">
        {isLoading && tracks.length === 0 ? (
          <div className="recently-played-panel__status">
            <p className="recently-played-panel__status-text">Scanning audio log…</p>
          </div>
        ) : tracks.length === 0 ? (
          <div className="recently-played-panel__empty">
            <p className="recently-played-panel__empty-title">NO RECENT TRACKS</p>
            <p className="recently-played-panel__empty-hint">
              Play music on Spotify to populate your playback log.
            </p>
          </div>
        ) : (
          <div className="recently-played-panel__rail">
            {tracks.map((track, idx) => (
              <div
                key={`${track.uri}-${track.playedAt || idx}`}
                className="recent-track-card"
                onClick={() => onPlayTrack(track.uri, track.name)}
                title={`Click to play ${track.name} by ${track.artist}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onPlayTrack(track.uri, track.name);
                  }
                }}
              >
                <div className="recent-track-card__thumb-wrap">
                  {track.image ? (
                    <img
                      src={track.image}
                      alt={track.name}
                      className="recent-track-card__img"
                      loading="lazy"
                    />
                  ) : (
                    <div className="recent-track-card__placeholder" />
                  )}
                  <div className="recent-track-card__overlay">
                    <span className="recent-track-card__play-icon">▶</span>
                  </div>
                </div>

                <div className="recent-track-card__meta">
                  <p className="recent-track-card__name" title={track.name}>
                    {track.name}
                  </p>
                  <p className="recent-track-card__artist" title={track.artist}>
                    {track.artist}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info Strip */}
      <div className="recently-played-panel__footer">
        <span className="recently-played-panel__hint">
          CLICK ANY TRACK THUMBNAIL TO REPLAY
        </span>
      </div>
    </div>
  );
}
