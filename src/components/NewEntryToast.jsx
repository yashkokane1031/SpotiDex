import { useEffect } from 'react';
import { formatDexNumber } from '../hooks/useDex';
import './NewEntryToast.css';

/**
 * Centered, modal-weight celebration popup that triggers whenever a genuinely
 * new artist is discovered and registered via live listening.
 *
 * @param {{
 *   entry: object | null,
 *   onDismiss: () => void
 * }} props
 */
export default function NewEntryToast({ entry, onDismiss }) {
  useEffect(() => {
    if (!entry) return;

    // Auto-dismiss after ~4 seconds
    const timer = setTimeout(() => {
      onDismiss();
    }, 4000);

    return () => clearTimeout(timer);
  }, [entry, onDismiss]);

  if (!entry) return null;

  return (
    <div
      className="new-entry-toast__backdrop"
      onClick={onDismiss}
      role="dialog"
      aria-modal="true"
      aria-label="New Dex Entry Celebration"
    >
      <div
        className="new-entry-toast__card"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
      >
        {/* CRT Scanline effect overlay */}
        <div className="new-entry-toast__scanlines" />

        {/* Header alert */}
        <div className="new-entry-toast__header">
          <span className="new-entry-toast__sparkle">★</span>
          <span className="new-entry-toast__badge">NEW DEX ENTRY!</span>
          <span className="new-entry-toast__sparkle">★</span>
        </div>

        {/* Artist Image with encountered tier border */}
        <div className="new-entry-toast__image-frame">
          {entry.image ? (
            <img
              src={entry.image}
              alt={entry.name}
              className="new-entry-toast__image"
              loading="eager"
            />
          ) : (
            <div className="new-entry-toast__placeholder">?</div>
          )}
          <span className="new-entry-toast__dex-num">
            {formatDexNumber(entry.dexNumber)}
          </span>
        </div>

        {/* Artist Info */}
        <div className="new-entry-toast__info">
          <h3 className="new-entry-toast__name" title={entry.name}>
            {entry.name}
          </h3>
          <p className="new-entry-toast__subtitle">
            REGISTERED IN THE ARTIST DEX
          </p>
        </div>

        {/* Genre Badges */}
        {entry.genres && entry.genres.length > 0 && (
          <div className="new-entry-toast__genres">
            {entry.genres.slice(0, 3).map((genre) => (
              <span key={genre} className="new-entry-toast__genre-pill">
                {genre.toUpperCase()}
              </span>
            ))}
          </div>
        )}

        {/* Footer info & auto-dismiss bar */}
        <div className="new-entry-toast__footer">
          <span className="new-entry-toast__hint">CLICK TO DISMISS</span>
          <div className="new-entry-toast__progress-bar">
            <div className="new-entry-toast__progress-fill" />
          </div>
        </div>
      </div>
    </div>
  );
}
