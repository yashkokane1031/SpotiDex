import './OfflineFallback.css';

/**
 * Pixel-styled offline state matching ErrorBoundary aesthetic.
 * Rendered when the PWA shell loads from cache but no internet connectivity is available.
 *
 * @param {{ onRetry?: () => void }} props
 */
export default function OfflineFallback({ onRetry }) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="offline-fallback" role="status" aria-live="polite">
      <div className="offline-fallback__badge">SIGNAL LOST</div>

      <h2 className="offline-fallback__title">OFFLINE — NO CONNECTION</h2>

      <p className="offline-fallback__desc">
        SpotiDex is running from your offline app cache, but live Spotify playback,
        queue browsing, and synced lyrics require an active network connection.
      </p>

      <div className="offline-fallback__status">
        <span className="offline-fallback__pulse" />
        <span>WAITING FOR NETWORK SIGNAL…</span>
      </div>

      <div className="offline-fallback__actions">
        <button className="offline-fallback__btn" onClick={handleRetry}>
          ↻ RETRY CONNECTION
        </button>
      </div>
    </div>
  );
}
