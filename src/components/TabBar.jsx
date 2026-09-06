import './TabBar.css';

/**
 * Gapped pixel-styled folder tabs for switching between
 * "NOW PLAYING", "PLAYING NEXT", "RECENTLY PLAYED", "LYRICS", and "PLAYLISTS" views.
 *
 * @param {{
 *   activeTab: 'now-playing' | 'playing-next' | 'recently-played' | 'lyrics' | 'library',
 *   onSelectTab: (tab: 'now-playing' | 'playing-next' | 'recently-played' | 'lyrics' | 'library') => void
 * }} props
 */
export default function TabBar({ activeTab, onSelectTab }) {
  return (
    <nav className="tab-bar" role="tablist" aria-label="Player view modes">
      <button
        type="button"
        role="tab"
        id="tab-now-playing"
        aria-selected={activeTab === 'now-playing'}
        aria-controls="panel-now-playing"
        className={`tab-btn${activeTab === 'now-playing' ? ' is-active' : ''}`}
        onClick={() => onSelectTab('now-playing')}
      >
        NOW PLAYING
      </button>
      <button
        type="button"
        role="tab"
        id="tab-playing-next"
        aria-selected={activeTab === 'playing-next'}
        aria-controls="panel-playing-next"
        className={`tab-btn${activeTab === 'playing-next' ? ' is-active' : ''}`}
        onClick={() => onSelectTab('playing-next')}
      >
        PLAYING NEXT
      </button>
      <button
        type="button"
        role="tab"
        id="tab-recently-played"
        aria-selected={activeTab === 'recently-played'}
        aria-controls="panel-recently-played"
        className={`tab-btn${activeTab === 'recently-played' ? ' is-active' : ''}`}
        onClick={() => onSelectTab('recently-played')}
      >
        RECENTLY PLAYED
      </button>
      <button
        type="button"
        role="tab"
        id="tab-lyrics"
        aria-selected={activeTab === 'lyrics'}
        aria-controls="panel-lyrics"
        className={`tab-btn${activeTab === 'lyrics' ? ' is-active' : ''}`}
        onClick={() => onSelectTab('lyrics')}
      >
        LYRICS
      </button>
      <button
        type="button"
        role="tab"
        id="tab-library"
        aria-selected={activeTab === 'library'}
        aria-controls="panel-library"
        className={`tab-btn${activeTab === 'library' ? ' is-active' : ''}`}
        onClick={() => onSelectTab('library')}
      >
        PLAYLISTS
      </button>
    </nav>
  );
}
