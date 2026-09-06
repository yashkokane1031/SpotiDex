import { useRegisterSW } from 'virtual:pwa-register/react';
import './ReloadPrompt.css';

/**
 * PWA Update prompt toast.
 * Uses prompt registration so active playback is never interrupted by unexpected auto-reloads.
 */
export default function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (r) {
        // Periodically check for updates every hour
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.warn('[PWA] SW registration failed:', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="pwa-toast" role="alert" aria-live="polite">
      <div className="pwa-toast__content">
        <span className="pwa-toast__badge">UPDATE AVAILABLE</span>
        <span className="pwa-toast__msg">New SpotiDex version ready!</span>
      </div>
      <div className="pwa-toast__actions">
        <button
          className="pwa-toast__btn pwa-toast__btn--update"
          onClick={() => updateServiceWorker(true)}
        >
          UPDATE NOW
        </button>
        <button
          className="pwa-toast__btn pwa-toast__btn--dismiss"
          onClick={() => setNeedRefresh(false)}
          title="Dismiss update notice"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
