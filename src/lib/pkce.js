/**
 * PKCE (Proof Key for Code Exchange) utilities for Spotify OAuth.
 * Uses Web Crypto API — no external dependencies.
 */

/**
 * Generate a cryptographically random code verifier (43-128 chars, URL-safe).
 * @param {number} length — desired length (default 64)
 * @returns {string}
 */
export function generateCodeVerifier(length = 64) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (v) => possible[v % possible.length]).join('');
}

/**
 * Derive the code challenge from a code verifier (SHA-256 + base64url).
 * @param {string} verifier
 * @returns {Promise<string>}
 */
export async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(digest);
}

/**
 * Base64url-encode an ArrayBuffer (no padding, URL-safe alphabet).
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
function base64UrlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Generate a random state string for CSRF protection.
 * @param {number} length
 * @returns {string}
 */
export function generateRandomState(length = 32) {
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (v) => v.toString(16).padStart(2, '0')).join('');
}
