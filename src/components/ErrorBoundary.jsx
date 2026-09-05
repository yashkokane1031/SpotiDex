import React from 'react';

/**
 * Pixel-styled ErrorBoundary to prevent blank screens on runtime exceptions or HMR glitches.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('SpotiDex caught error in tree:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetAuth = () => {
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_token_expiry');
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backgroundColor: 'var(--chrome-bg, #0a0710)',
            color: 'var(--chrome-ink, #f3e8f7)',
            fontFamily: "'VT323', monospace",
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              backgroundColor: 'var(--chrome-card, #161024)',
              border: '3px solid var(--chrome-border, #43325d)',
              boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.6)',
              padding: '28px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                backgroundColor: '#dc2626',
                color: '#fff',
                fontSize: '18px',
                letterSpacing: '2px',
                marginBottom: '16px',
                border: '2px solid #000',
              }}
            >
              GLITCH DETECTED
            </div>

            <p style={{ fontSize: '24px', margin: '0 0 12px 0', lineHeight: 1.2 }}>
              The vinyl player ran into a playback hiccup.
            </p>

            <p style={{ fontSize: '18px', color: 'var(--chrome-dim, #a89bb8)', margin: '0 0 24px 0' }}>
              {this.state.error?.message || 'Unknown state desync'}
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleReload}
                style={{
                  fontFamily: "'VT323', monospace",
                  fontSize: '20px',
                  padding: '8px 18px',
                  backgroundColor: 'var(--accent, #aa722e)',
                  color: '#fff',
                  border: '2px solid #000',
                  boxShadow: '2px 2px 0px #000',
                  cursor: 'pointer',
                }}
              >
                ↻ RELOAD PLAYER
              </button>

              <button
                onClick={this.handleResetAuth}
                style={{
                  fontFamily: "'VT323', monospace",
                  fontSize: '20px',
                  padding: '8px 18px',
                  backgroundColor: 'transparent',
                  color: 'var(--chrome-ink, #f3e8f7)',
                  border: '2px solid var(--chrome-border, #43325d)',
                  boxShadow: '2px 2px 0px #000',
                  cursor: 'pointer',
                }}
              >
                RECONNECT SPOTIFY
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
