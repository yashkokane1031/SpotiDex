import { TextRoll } from './TextRoll';
import './SideNav.css';

const NAV_ITEMS = [
  { id: 'now-playing', label: 'NOW PLAYING' },
  { id: 'playing-next', label: 'PLAYING NEXT' },
  { id: 'recently-played', label: 'RECENTLY PLAYED' },
  { id: 'lyrics', label: 'LYRICS' },
  { id: 'library', label: 'LIBRARY' },
];

/**
 * Vertical sidebar navigation featuring letter-roll hover animations and dynamic theme accent bar.
 *
 * @param {{
 *   activeTab: string,
 *   onSelectTab: (tabId: string) => void,
 *   onLogout?: () => void
 * }} props
 */
export default function SideNav({ activeTab, onSelectTab, onLogout }) {
  return (
    <aside className="side-nav" aria-label="Sidebar Navigation">
      {/* Brand / Logo Wordmark */}
      <div className="side-nav__brand">
        <span className="side-nav__logo" data-text="SPOTIDEX">
          SPOTIDEX
        </span>
        <p className="side-nav__tag">HI-FI STEREO</p>
      </div>

      {/* Vertical Navigation Links */}
      <nav className="side-nav__menu" role="tablist" aria-orientation="vertical">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`nav-${item.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${item.id}`}
              className={`side-nav__item${isActive ? ' side-nav__item--active' : ''}`}
              onClick={() => onSelectTab(item.id)}
            >
              <TextRoll>{item.label}</TextRoll>
            </button>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      {onLogout && (
        <div className="side-nav__footer">
          <button
            type="button"
            className="side-nav__logout"
            onClick={onLogout}
            title="Disconnect Spotify session"
          >
            DISCONNECT
          </button>
        </div>
      )}
    </aside>
  );
}
