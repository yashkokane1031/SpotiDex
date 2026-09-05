import { createContext, useEffect, useRef } from 'react';
import { extractPalette } from '../lib/extractPalette';

export const ThemeContext = createContext(null);

// The original static palette — used as fallback when extraction fails.
const DEFAULT_PALETTE = {
  ink: '#2d1b4e',
  inkDeep: '#1a1220',
  accent: '#e85fa8',
  card: '#f5f0e6',
};

/**
 * Applies a palette object to :root CSS custom properties.
 * @param {{ ink: string, inkDeep: string, accent: string, card: string }} palette
 */
function applyPalette(palette) {
  const root = document.documentElement.style;
  root.setProperty('--ink', palette.ink);
  root.setProperty('--ink-deep', palette.inkDeep);
  root.setProperty('--accent', palette.accent);
  root.setProperty('--card', palette.card);
}

/**
 * ThemeProvider — watches the current track's album art URL and dynamically
 * re-themes the app by extracting dominant colors with node-vibrant.
 *
 * @param {{ albumArtUrl: string|null, children: React.ReactNode }} props
 */
export function ThemeProvider({ albumArtUrl, children }) {
  // Track the last URL we actually processed to avoid re-running Vibrant
  // on every 3s poll when the album art hasn't changed.
  const lastUrlRef = useRef(null);

  useEffect(() => {
    // Only run when the URL actually changes
    if (albumArtUrl === lastUrlRef.current) return;
    lastUrlRef.current = albumArtUrl;

    if (!albumArtUrl) {
      // No track playing — reset to defaults
      applyPalette(DEFAULT_PALETTE);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const palette = await extractPalette(albumArtUrl);

        if (cancelled) return;

        if (palette) {
          applyPalette(palette);
        } else {
          // Extraction returned null (bad contrast, missing swatches)
          applyPalette(DEFAULT_PALETTE);
        }
      } catch {
        // Silently fall back — never crash the app over a theme failure
        if (!cancelled) {
          applyPalette(DEFAULT_PALETTE);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [albumArtUrl]);

  return (
    <ThemeContext.Provider value={null}>
      {children}
    </ThemeContext.Provider>
  );
}
