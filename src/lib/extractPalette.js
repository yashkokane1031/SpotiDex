/**
 * Extract a UI-ready palette from album art using node-vibrant.
 *
 * Uses deep fallback chains so that a palette is almost always produced,
 * even when the image is missing common swatch categories.
 * Only returns null if zero swatches exist (corrupt/blank image).
 */

import { Vibrant } from 'node-vibrant/browser';

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

function rgbToHex([r, g, b]) {
  return '#' + [r, g, b].map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0')).join('');
}

function darken([r, g, b], factor = 0.6) {
  return [r * factor, g * factor, b * factor];
}

function lighten([r, g, b], factor = 0.7) {
  return [
    r + (255 - r) * factor,
    g + (255 - g) * factor,
    b + (255 - b) * factor,
  ];
}

function relativeLuminance([r, g, b]) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(rgb1, rgb2) {
  const l1 = relativeLuminance(rgb1);
  const l2 = relativeLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ---------------------------------------------------------------------------
// Image loading (CORS-safe)
// ---------------------------------------------------------------------------

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}

// ---------------------------------------------------------------------------
// Swatch resolution with deep fallback chains
// ---------------------------------------------------------------------------

/**
 * Return the first available swatch's rgb from the palette, or null.
 */
function firstAvailable(palette, keys) {
  for (const key of keys) {
    if (palette[key]) return palette[key].rgb;
  }
  return null;
}

/**
 * Return the rgb of ANY swatch that exists, or null.
 */
function anyAvailableRgb(palette) {
  const allKeys = ['Vibrant', 'Muted', 'DarkVibrant', 'DarkMuted', 'LightVibrant', 'LightMuted'];
  return firstAvailable(palette, allKeys);
}

function resolveInk(palette) {
  // DarkMuted → DarkVibrant → Muted → darken(Vibrant, 0.5) → darken(any, 0.5)
  const direct = firstAvailable(palette, ['DarkMuted', 'DarkVibrant', 'Muted']);
  if (direct) return direct;

  const vibrant = firstAvailable(palette, ['Vibrant']);
  if (vibrant) return darken(vibrant, 0.5);

  const any = anyAvailableRgb(palette);
  if (any) return darken(any, 0.5);

  return null;
}

function resolveInkDeep(palette, inkRgb) {
  // Prefer DarkVibrant, else darken the resolved ink further
  const dv = firstAvailable(palette, ['DarkVibrant']);
  return dv || darken(inkRgb, 0.6);
}

function resolveCard(palette) {
  // LightMuted → LightVibrant → lighten(Muted, 0.7) → lighten(Vibrant, 0.7) → lighten(any, 0.7)
  const direct = firstAvailable(palette, ['LightMuted', 'LightVibrant']);
  if (direct) return direct;

  const muted = firstAvailable(palette, ['Muted']);
  if (muted) return lighten(muted, 0.7);

  const vibrant = firstAvailable(palette, ['Vibrant']);
  if (vibrant) return lighten(vibrant, 0.7);

  const any = anyAvailableRgb(palette);
  if (any) return lighten(any, 0.7);

  return null;
}

function resolveAccent(palette) {
  // Vibrant → LightVibrant → DarkVibrant → Muted → any
  return firstAvailable(palette, ['Vibrant', 'LightVibrant', 'DarkVibrant', 'Muted'])
    || anyAvailableRgb(palette);
}

// ---------------------------------------------------------------------------
// Contrast correction
// ---------------------------------------------------------------------------

/**
 * Progressively darken ink / lighten card until contrast ≥ 4.5:1.
 * Returns { inkRgb, cardRgb, ratio } after adjustment, or null if
 * it can't be fixed in a reasonable number of steps.
 */
function ensureContrast(inkRgb, cardRgb, maxIterations = 10) {
  let ink = [...inkRgb];
  let card = [...cardRgb];
  let ratio = contrastRatio(ink, card);

  for (let i = 0; i < maxIterations && ratio < 4.5; i++) {
    // Alternate: darken ink on even steps, lighten card on odd steps
    if (i % 2 === 0) {
      ink = darken(ink, 0.85);
    } else {
      card = lighten(card, 0.15);
    }
    ratio = contrastRatio(ink, card);
  }

  if (ratio < 4.5) return null;
  return { inkRgb: ink, cardRgb: card, ratio };
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * @param {string} imageUrl — Spotify album art URL
 * @returns {Promise<{ ink: string, inkDeep: string, accent: string, card: string } | null>}
 */
export async function extractPalette(imageUrl) {
  try {
    const img = await loadImage(imageUrl);
    const palette = await Vibrant.from(img).getPalette();

    const availableKeys = Object.keys(palette).filter((k) => palette[k]);

    // If literally zero swatches, give up
    if (availableKeys.length === 0) {
      console.log('[palette] No swatches at all — falling back to defaults');
      return null;
    }

    // Resolve each role
    let inkRgb = resolveInk(palette);
    let cardRgb = resolveCard(palette);
    const accentRgb = resolveAccent(palette);

    // Shouldn't happen given we checked availableKeys > 0, but guard anyway
    if (!inkRgb || !cardRgb || !accentRgb) {
      console.log('[palette] Could not resolve all roles — falling back', { inkRgb, cardRgb, accentRgb });
      return null;
    }

    const inkDeepRgb = resolveInkDeep(palette, inkRgb);

    // Contrast correction — adjust rather than discard
    let ratio = contrastRatio(inkRgb, cardRgb);
    if (ratio < 4.5) {
      const fixed = ensureContrast(inkRgb, cardRgb);
      if (!fixed) {
        console.log('[palette] Could not reach 4.5:1 contrast after adjustments — falling back', {
          available: availableKeys,
          originalRatio: ratio.toFixed(2),
        });
        return null;
      }
      inkRgb = fixed.inkRgb;
      cardRgb = fixed.cardRgb;
      ratio = fixed.ratio;
    }

    const result = {
      ink: rgbToHex(inkRgb),
      inkDeep: rgbToHex(inkDeepRgb),
      accent: rgbToHex(accentRgb),
      card: rgbToHex(cardRgb),
    };

    // Debug logging — remove once confirmed working across various tracks
    console.log('[palette]', {
      available: availableKeys,
      ink: result.ink,
      card: result.card,
      accent: result.accent,
      contrastRatio: ratio.toFixed(2),
    });

    return result;
  } catch (err) {
    console.warn('Palette extraction failed, using default theme:', err);
    return null;
  }
}
