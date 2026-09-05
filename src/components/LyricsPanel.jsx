import { useRef, useEffect, useMemo } from 'react';
import './LyricsPanel.css';

/**
 * Lyrics display panel — synced (time-highlighted), plain (static), or status states.
 *
 * @param {{
 *   lyricsState: 'loading' | 'synced' | 'plain' | 'instrumental' | 'not-found',
 *   syncedLines: Array<{ timeMs: number, text: string }> | null,
 *   plainText: string | null,
 *   smoothProgressMs: number,
 * }} props
 */
export default function LyricsPanel({
  lyricsState,
  syncedLines,
  plainText,
  smoothProgressMs = 0,
}) {
  // Determine which synced line is currently active
  const activeLineIndex = useMemo(() => {
    if (lyricsState !== 'synced' || !syncedLines || syncedLines.length === 0) return -1;

    // Find the last line whose timestamp is <= current progress
    let idx = -1;
    for (let i = 0; i < syncedLines.length; i++) {
      if (syncedLines[i].timeMs <= smoothProgressMs) {
        idx = i;
      } else {
        break; // sorted, so we can stop early
      }
    }
    return idx;
  }, [lyricsState, syncedLines, smoothProgressMs]);

  // Ref for the currently-active line element
  const activeLineRef = useRef(null);
  const lastScrolledIndex = useRef(-1);

  // Auto-scroll when the active line index changes (not on every progress tick)
  useEffect(() => {
    if (activeLineIndex < 0 || activeLineIndex === lastScrolledIndex.current) return;
    lastScrolledIndex.current = activeLineIndex;

    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        block: 'center',
        behavior: 'smooth',
      });
    }
  }, [activeLineIndex]);

  const stateTag =
    lyricsState === 'synced' ? 'SYNCED' :
    lyricsState === 'plain' ? 'UNSYNCED' :
    lyricsState === 'loading' ? 'LOADING…' :
    lyricsState === 'instrumental' ? 'INSTRUMENTAL' :
    '—';

  return (
    <div
      className="lyrics-panel"
      role="tabpanel"
      id="panel-lyrics"
      aria-labelledby="tab-lyrics"
    >
      {/* Header */}
      <div className="lyrics-panel__header">
        <div className="lyrics-panel__title-group">
          <span className="lyrics-panel__led" />
          <h2 className="lyrics-panel__title">LYRICS</h2>
        </div>
        <span className="lyrics-panel__tag">{stateTag}</span>
      </div>

      {/* Body */}
      <div className="lyrics-panel__body">
        {lyricsState === 'loading' && (
          <div className="lyrics-panel__status">
            <span className="lyrics-panel__status-icon">♪</span>
            <p className="lyrics-panel__status-title">LOADING LYRICS…</p>
            <p className="lyrics-panel__status-hint">Scanning lyric databases</p>
          </div>
        )}

        {lyricsState === 'not-found' && (
          <div className="lyrics-panel__status">
            <span className="lyrics-panel__status-icon">∅</span>
            <p className="lyrics-panel__status-title">NO LYRICS FOUND</p>
            <p className="lyrics-panel__status-hint">
              No lyrics available for this track
            </p>
          </div>
        )}

        {lyricsState === 'instrumental' && (
          <div className="lyrics-panel__status">
            <span className="lyrics-panel__status-icon">🎵</span>
            <p className="lyrics-panel__status-title">INSTRUMENTAL</p>
            <p className="lyrics-panel__status-hint">
              This track has no lyrics — instrumental only
            </p>
          </div>
        )}

        {lyricsState === 'synced' && syncedLines && (
          <ul className="lyrics-panel__synced-list">
            {syncedLines.map((line, idx) => {
              const isActive = idx === activeLineIndex;
              return (
                <li
                  key={`${line.timeMs}-${idx}`}
                  ref={isActive ? activeLineRef : null}
                  className={
                    `lyrics-panel__line` +
                    (isActive ? ' lyrics-panel__line--active' : '') +
                    (!line.text.trim() ? ' lyrics-panel__line--blank' : '')
                  }
                >
                  {line.text || '\u00A0'}
                </li>
              );
            })}
          </ul>
        )}

        {lyricsState === 'plain' && plainText && (
          <div className="lyrics-panel__plain">
            {plainText}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="lyrics-panel__footer">
        <span className="lyrics-panel__source">
          POWERED BY LRCLIB.NET
        </span>
      </div>
    </div>
  );
}
