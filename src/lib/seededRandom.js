/**
 * Deterministic PRNG utilities.
 * Same track ID → same seed → same visual pattern every time.
 */

/**
 * djb2 string hash → 32-bit unsigned integer.
 * @param {string} str
 * @returns {number}
 */
export function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * Mulberry32 — fast, high-quality 32-bit PRNG.
 * Returns a function that produces deterministic floats in [0, 1).
 *
 * @param {number} seed — 32-bit integer seed (from hashString)
 * @returns {() => number}
 */
export function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
