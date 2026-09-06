import { useState } from 'react';
import { useLibrary } from '../hooks/useLibrary';
import { usePlaylistTracks } from '../hooks/usePlaylistTracks';
import './LibraryPanel.css';

/**
 * Format milliseconds to m:ss string.
 */
function formatDuration(ms) {
  if (!ms || isNaN(ms)) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Pixel-styled Library view showing playlists and tracks.
 *
 * @param {{
 *   onPlayPlaylist: (playlistUri: string, trackUri?: string|null) => void
 * }} props
 */
export default function LibraryPanel({ onPlayPlaylist }) {
  const { ownedPlaylists, followedPlaylists, isLoading, error } = useLibrary({ enabled: true });
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  const {
    tracks,
    isLoading: tracksLoading,
    error: tracksError,
  } = usePlaylistTracks(selectedPlaylist?.id ?? null);

  return (
    <div
      className="library-panel"
      role="tabpanel"
      id="panel-library"
      aria-labelledby="tab-library"
    >
      {/* Panel Header */}
      <div className="library-panel__header">
        <div className="library-panel__title-group">
          <span className="library-panel__led" />
          <h2 className="library-panel__title">LIBRARY</h2>
        </div>
        <span className="library-panel__tag">
          {selectedPlaylist ? 'PLAYLIST TRACKS' : 'SPOTIFY PLAYLISTS'}
        </span>
      </div>

      {/* Error display */}
      {(error || tracksError) && (
        <div className="library-error">
          {(error || tracksError).message || 'Failed to load Spotify library data.'}
        </div>
      )}

      {/* Panel Body */}
      <div className="library-panel__body">
        {selectedPlaylist ? (
          /* Track View Mode */
          <div className="playlist-trackview">
            <button
              type="button"
              className="playlist-trackview__back-btn"
              onClick={() => setSelectedPlaylist(null)}
            >
              ← BACK TO PLAYLISTS
            </button>

            <div className="playlist-trackview__hero">
              {selectedPlaylist.image ? (
                <img
                  src={selectedPlaylist.image}
                  alt={selectedPlaylist.name}
                  className="playlist-trackview__cover"
                />
              ) : (
                <div className="playlist-card__placeholder playlist-trackview__cover" />
              )}
              <div className="playlist-trackview__info">
                <h3 className="playlist-trackview__title" title={selectedPlaylist.name}>
                  {selectedPlaylist.name}
                </h3>
                <p className="playlist-trackview__subtitle">
                  By {selectedPlaylist.ownerName} • {selectedPlaylist.tracksCount} tracks
                </p>
                <button
                  type="button"
                  className="playlist-trackview__play-all"
                  onClick={() => onPlayPlaylist(selectedPlaylist.uri)}
                >
                  ▶ PLAY PLAYLIST
                </button>
              </div>
            </div>

            {tracksLoading ? (
              <div className="library-status">
                <p>Loading playlist tracks…</p>
              </div>
            ) : tracks.length === 0 ? (
              <div className="library-empty">
                <p>No playable tracks found in this playlist.</p>
              </div>
            ) : (
              <div className="playlist-trackview__list">
                {tracks.map((track, idx) => (
                  <div key={track.id || `${track.uri}-${idx}`} className="playlist-track-row">
                    <span className="playlist-track-row__index">{idx + 1}.</span>
                    {track.image ? (
                      <img
                        src={track.image}
                        alt={track.name}
                        className="playlist-track-row__thumb"
                        loading="lazy"
                      />
                    ) : (
                      <div className="playlist-track-row__thumb" />
                    )}
                    <div className="playlist-track-row__meta">
                      <p className="playlist-track-row__name" title={track.name}>
                        {track.name}
                      </p>
                      <p className="playlist-track-row__artist" title={track.artist}>
                        {track.artist}
                      </p>
                    </div>
                    <span className="playlist-track-row__duration">
                      {formatDuration(track.durationMs)}
                    </span>
                    <button
                      type="button"
                      className="playlist-track-row__play-btn"
                      onClick={() => onPlayPlaylist(selectedPlaylist.uri, track.uri)}
                      title={`Play ${track.name}`}
                    >
                      PLAY
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Grid View Mode */
          <>
            {isLoading && ownedPlaylists.length === 0 && followedPlaylists.length === 0 ? (
              <div className="library-status">
                <p>Scanning Spotify playlists…</p>
              </div>
            ) : (
              <>
                {/* Section 1: Your Playlists */}
                <div className="library-section">
                  <h3 className="library-section__title">YOUR PLAYLISTS</h3>
                  {ownedPlaylists.length === 0 ? (
                    <p className="library-empty">No owned playlists found.</p>
                  ) : (
                    <div className="library-grid">
                      {ownedPlaylists.map((pl) => (
                        <div
                          key={pl.id}
                          className="playlist-card"
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedPlaylist(pl)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedPlaylist(pl);
                            }
                          }}
                        >
                          <div className="playlist-card__thumb-wrap">
                            {pl.image ? (
                              <img
                                src={pl.image}
                                alt={pl.name}
                                className="playlist-card__img"
                                loading="lazy"
                              />
                            ) : (
                              <div className="playlist-card__placeholder" />
                            )}
                          </div>
                          <div className="playlist-card__meta">
                            <span className="playlist-card__name" title={pl.name}>
                              {pl.name}
                            </span>
                            <span className="playlist-card__count">
                              {pl.tracksCount} tracks
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section 2: Made For You / Followed */}
                {followedPlaylists.length > 0 && (
                  <div className="library-section">
                    <h3 className="library-section__title">MADE FOR YOU &amp; FOLLOWED</h3>
                    <div className="library-grid">
                      {followedPlaylists.map((pl) => (
                        <div
                          key={pl.id}
                          className="playlist-card"
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedPlaylist(pl)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedPlaylist(pl);
                            }
                          }}
                        >
                          <div className="playlist-card__thumb-wrap">
                            {pl.image ? (
                              <img
                                src={pl.image}
                                alt={pl.name}
                                className="playlist-card__img"
                                loading="lazy"
                              />
                            ) : (
                              <div className="playlist-card__placeholder" />
                            )}
                          </div>
                          <div className="playlist-card__meta">
                            <span className="playlist-card__name" title={pl.name}>
                              {pl.name}
                            </span>
                            <span className="playlist-card__count">
                              {pl.tracksCount} tracks
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
