import { useState, useMemo } from 'react';
import { getRarityTier, formatDexNumber } from '../hooks/useDex';
import './DexPanel.css';

/**
 * Format timestamp to human readable date string
 */
function formatDate(timestamp) {
  if (!timestamp) return 'Never';
  const d = new Date(timestamp);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Pokédex-style Artist Collection view ("The Dex").
 *
 * @param {{
 *   dex: Array<object>,
 *   isSyncing: boolean,
 *   syncStatus: string | null,
 *   syncError: string | null,
 *   onSyncTopArtists: () => Promise<any>
 * }} props
 */
export default function DexPanel({
  dex,
  isSyncing,
  syncStatus,
  syncError,
  onSyncTopArtists,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState('all');
  const [sortBy, setSortBy] = useState('dexNumber');
  const [selectedArtist, setSelectedArtist] = useState(null);

  // Compute stats across collection
  const stats = useMemo(() => {
    let totalPlays = 0;
    let legendaryCount = 0;
    let rareCount = 0;
    let commonCount = 0;
    let encounteredCount = 0;

    for (const artist of dex) {
      totalPlays += artist.playCount || 0;
      const tier = getRarityTier(artist, dex);
      if (tier === 'legendary') legendaryCount++;
      else if (tier === 'rare') rareCount++;
      else if (tier === 'common') commonCount++;
      else encounteredCount++;
    }

    return {
      total: dex.length,
      totalPlays,
      legendaryCount,
      rareCount,
      commonCount,
      encounteredCount,
    };
  }, [dex]);

  // Filter and sort artists
  const filteredArtists = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return dex
      .filter((artist) => {
        // Search filter
        if (q) {
          const matchName = artist.name.toLowerCase().includes(q);
          const matchGenre = (artist.genres || []).some((g) =>
            g.toLowerCase().includes(q)
          );
          if (!matchName && !matchGenre) return false;
        }

        // Tier filter
        if (selectedTier !== 'all') {
          const tier = getRarityTier(artist, dex);
          if (tier !== selectedTier) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'dexNumber') {
          return (a.dexNumber || 0) - (b.dexNumber || 0);
        }
        if (sortBy === 'playCount') {
          return (b.playCount || 0) - (a.playCount || 0);
        }
        if (sortBy === 'popularity') {
          return (b.popularity || 0) - (a.popularity || 0);
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'recent') {
          return (b.lastListened || b.firstDiscovered || 0) - (a.lastListened || a.firstDiscovered || 0);
        }
        return 0;
      });
  }, [dex, searchQuery, selectedTier, sortBy]);

  return (
    <div
      className="dex-panel"
      role="tabpanel"
      id="panel-dex"
      aria-labelledby="tab-dex"
    >
      {/* Panel Header & HUD */}
      <div className="dex-panel__header">
        <div className="dex-panel__title-group">
          <span className="dex-panel__led" />
          <h2 className="dex-panel__title">THE DEX</h2>
          <span className="dex-panel__badge">ARTIST POKÉDEX</span>
        </div>

        <button
          type="button"
          className="dex-panel__sync-btn"
          onClick={onSyncTopArtists}
          disabled={isSyncing}
        >
          {isSyncing ? 'SCANNING…' : 'SYNC TOP ARTISTS'}
        </button>
      </div>

      {/* Sync Status / Error */}
      {syncStatus && (
        <div className="dex-panel__status-banner">{syncStatus}</div>
      )}
      {syncError && (
        <div className="dex-panel__error-banner">{syncError}</div>
      )}

      {/* HUD Stats Bar */}
      <div className="dex-panel__hud">
        <div className="dex-panel__hud-stat">
          <span className="dex-panel__hud-label">COLLECTED</span>
          <span className="dex-panel__hud-val">{stats.total}</span>
        </div>
        <div className="dex-panel__hud-stat">
          <span className="dex-panel__hud-label">TOTAL PLAYS</span>
          <span className="dex-panel__hud-val">{stats.totalPlays}</span>
        </div>
        <div className="dex-panel__hud-stat dex-panel__hud-stat--legendary">
          <span className="dex-panel__hud-label">LEGENDARY</span>
          <span className="dex-panel__hud-val">{stats.legendaryCount}</span>
        </div>
        <div className="dex-panel__hud-stat dex-panel__hud-stat--rare">
          <span className="dex-panel__hud-label">RARE</span>
          <span className="dex-panel__hud-val">{stats.rareCount}</span>
        </div>
        <div className="dex-panel__hud-stat dex-panel__hud-stat--common">
          <span className="dex-panel__hud-label">COMMON</span>
          <span className="dex-panel__hud-val">{stats.commonCount}</span>
        </div>
      </div>

      {/* Controls: Search, Tier Filters & Sorting */}
      <div className="dex-panel__controls">
        <div className="dex-panel__search-wrap">
          <input
            type="text"
            className="dex-panel__search-input"
            placeholder="Search artist or genre…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="dex-panel__search-clear"
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>

        <div className="dex-panel__filters-row">
          <div className="dex-panel__tier-filters">
            {['all', 'legendary', 'rare', 'common', 'encountered'].map((t) => (
              <button
                key={t}
                type="button"
                className={`dex-tier-btn dex-tier-btn--${t}${
                  selectedTier === t ? ' is-active' : ''
                }`}
                onClick={() => setSelectedTier(t)}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="dex-panel__sort-wrap">
            <span className="dex-panel__sort-label">SORT:</span>
            <select
              className="dex-panel__sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="dexNumber"># NUMBER (OG)</option>
              <option value="playCount">MOST PLAYED</option>
              <option value="popularity">SPOTIFY POPULARITY</option>
              <option value="name">NAME (A-Z)</option>
              <option value="recent">RECENTLY HEARD</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dex Body: Cards Grid or Empty State */}
      <div className="dex-panel__body">
        {dex.length === 0 ? (
          <div className="dex-empty">
            <div className="dex-empty__icon">★</div>
            <h3 className="dex-empty__title">YOUR DEX IS EMPTY</h3>
            <p className="dex-empty__desc">
              Start listening to tracks to discover artists live, or click
              <strong> "SYNC TOP ARTISTS"</strong> above to backfill your all-time
              Spotify favorites!
            </p>
          </div>
        ) : filteredArtists.length === 0 ? (
          <div className="dex-empty">
            <p className="dex-empty__desc">
              No artists match your current search or tier filter.
            </p>
          </div>
        ) : (
          <div className="dex-grid">
            {filteredArtists.map((artist) => {
              const tier = getRarityTier(artist, dex);

              return (
                <div
                  key={artist.id}
                  className={`dex-card dex-card--${tier}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedArtist(artist)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedArtist(artist);
                    }
                  }}
                >
                  <div className="dex-card__thumb-wrap">
                    {artist.image ? (
                      <img
                        src={artist.image}
                        alt={artist.name}
                        className="dex-card__img"
                        loading="lazy"
                      />
                    ) : (
                      <div className="dex-card__placeholder">?</div>
                    )}
                    <span className="dex-card__dex-num">
                      {formatDexNumber(artist.dexNumber)}
                    </span>
                    <span className={`dex-card__tier-pill dex-card__tier-pill--${tier}`}>
                      {tier.toUpperCase()}
                    </span>
                  </div>

                  <div className="dex-card__meta">
                    <span className="dex-card__name" title={artist.name}>
                      {artist.name}
                    </span>

                    <div className="dex-card__sub-row">
                      <span className="dex-card__plays">
                        {artist.playCount === 0
                          ? 'UNPLAYED'
                          : `${artist.playCount} PLAY${artist.playCount === 1 ? '' : 'S'}`}
                      </span>

                      {artist.genres && artist.genres[0] && (
                        <span className="dex-card__genre" title={artist.genres[0]}>
                          {artist.genres[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Artist Pokédex Detail Modal */}
      {selectedArtist && (
        <ArtistDetailModal
          artist={selectedArtist}
          allArtists={dex}
          onClose={() => setSelectedArtist(null)}
        />
      )}
    </div>
  );
}

/**
 * Detail Modal presenting complete Pokédex entry for an artist
 */
function ArtistDetailModal({ artist, allArtists, onClose }) {
  const tier = getRarityTier(artist, allArtists);

  return (
    <div
      className="dex-modal__backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${artist.name} Pokédex Entry`}
    >
      <div
        className={`dex-modal__card dex-modal__card--${tier}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="dex-modal__close-btn"
          onClick={onClose}
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="dex-modal__header">
          <span className="dex-modal__dex-num">
            {formatDexNumber(artist.dexNumber)}
          </span>
          <span className={`dex-modal__tier-badge dex-modal__tier-badge--${tier}`}>
            {tier.toUpperCase()}
          </span>
        </div>

        {/* Modal Hero */}
        <div className="dex-modal__hero">
          <div className={`dex-modal__avatar-wrap dex-modal__avatar-wrap--${tier}`}>
            {artist.image ? (
              <img
                src={artist.image}
                alt={artist.name}
                className="dex-modal__avatar"
              />
            ) : (
              <div className="dex-modal__placeholder">?</div>
            )}
          </div>

          <div className="dex-modal__hero-info">
            <h3 className="dex-modal__name" title={artist.name}>
              {artist.name}
            </h3>
            <p className="dex-modal__catalog">SPOTIFY CATALOG ENTRY</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="dex-modal__stats-grid">
          <div className="dex-modal__stat-box">
            <span className="dex-modal__stat-label">TIMES PLAYED</span>
            <span className="dex-modal__stat-val">{artist.playCount || 0}</span>
          </div>

          <div className="dex-modal__stat-box">
            <span className="dex-modal__stat-label">FIRST SEEN</span>
            <span className="dex-modal__stat-val">
              {formatDate(artist.firstDiscovered)}
            </span>
          </div>

          <div className="dex-modal__stat-box">
            <span className="dex-modal__stat-label">LAST LISTENED</span>
            <span className="dex-modal__stat-val">
              {formatDate(artist.lastListened)}
            </span>
          </div>

          <div className="dex-modal__stat-box">
            <span className="dex-modal__stat-label">SPOTIFY POPULARITY</span>
            <div className="dex-modal__pop-bar-wrap">
              <div
                className="dex-modal__pop-bar-fill"
                style={{ width: `${Math.min(100, Math.max(0, artist.popularity || 0))}%` }}
              />
            </div>
            <span className="dex-modal__pop-num">{artist.popularity || 0} / 100</span>
          </div>
        </div>

        {/* Genres */}
        {artist.genres && artist.genres.length > 0 && (
          <div className="dex-modal__genres-section">
            <span className="dex-modal__section-title">KNOWN GENRES</span>
            <div className="dex-modal__genres-list">
              {artist.genres.map((g) => (
                <span key={g} className="dex-modal__genre-badge">
                  {g.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* External Spotify Link */}
        {artist.externalUrl && (
          <a
            href={artist.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="dex-modal__spotify-link"
          >
            ↗ OPEN IN SPOTIFY
          </a>
        )}
      </div>
    </div>
  );
}
