import './TabBar.css';

const TABS = [
  { id: 'now-playing', num: '1', label: 'PLAYER', shortLabel: 'PLAY', aria: 'Now Playing' },
  { id: 'playing-next', num: '2', label: 'QUEUE', shortLabel: 'QUEUE', aria: 'Playing Next Queue' },
  { id: 'recently-played', num: '3', label: 'HISTORY', shortLabel: 'HIST', aria: 'Recently Played History' },
  { id: 'lyrics', num: '4', label: 'LYRICS', shortLabel: 'LYRIC', aria: 'Song Lyrics' },
  { id: 'library', num: '5', label: 'PLAYLISTS', shortLabel: 'LISTS', aria: 'Playlists Library' },
  { id: 'dex', num: '6', label: 'THE DEX', shortLabel: 'DEX', aria: 'Artist Dex Collection' },
];

/**
 * Retro Console Segmented Bar — unified edge-to-edge hardware ribbon
 * with active LED pips, 1-6 number badges, and tactile active states.
 *
 * @param {{
 *   activeTab: 'now-playing' | 'playing-next' | 'recently-played' | 'lyrics' | 'library' | 'dex',
 *   onSelectTab: (tab: 'now-playing' | 'playing-next' | 'recently-played' | 'lyrics' | 'library' | 'dex') => void
 * }} props
 */
export default function TabBar({ activeTab, onSelectTab }) {
  return (
    <nav className="console-nav" role="tablist" aria-label="Player console modes">
      <div className="console-nav__frame">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              className={`console-nav__segment${isActive ? ' is-active' : ''}`}
              onClick={() => onSelectTab(tab.id)}
              title={`${tab.label} (Press ${tab.num})`}
            >
              <div className="console-nav__top-row">
                <span className={`console-nav__led${isActive ? ' is-lit' : ''}`} />
                <span className="console-nav__num">{tab.num}</span>
              </div>
              <span className="console-nav__label">
                <span className="console-nav__label-full">{tab.label}</span>
                <span className="console-nav__label-short">{tab.shortLabel}</span>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
