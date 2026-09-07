/**
 * Spotify Authorization Code with PKCE — client-side only, no backend.
 */

import { generateCodeVerifier, generateCodeChallenge, generateRandomState } from './pkce';

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI;
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const SCOPES = 'user-read-currently-playing user-read-playback-state user-modify-playback-state user-top-read playlist-read-private playlist-read-collaborative';

/**
 * Kick off the Spotify auth flow:
 *  1. Generate PKCE verifier + challenge
 *  2. Generate a random state for CSRF protection
 *  3. Stash verifier & state in sessionStorage
 *  4. Redirect the browser to Spotify's /authorize
 */
export async function redirectToSpotifyAuth() {
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  const state = generateRandomState();

  sessionStorage.setItem('pkce_code_verifier', verifier);
  sessionStorage.setItem('pkce_state', state);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: SCOPES,
    redirect_uri: REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state,
  });

  window.location.href = `${AUTH_ENDPOINT}?${params.toString()}`;
}

/**
 * Exchange the authorization code for tokens.
 * @param {string} code — the `code` query param from the callback URL
 * @returns {Promise<{access_token: string, refresh_token: string, expires_in: number}>}
 */
export async function exchangeCodeForToken(code) {
  const verifier = sessionStorage.getItem('pkce_code_verifier');

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      code_verifier: verifier,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || 'Token exchange failed');
  }

  const data = await response.json();
  // Clean up the one-time verifier
  sessionStorage.removeItem('pkce_code_verifier');

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  };
}

/**
 * Use a refresh token to obtain a new access token.
 * @param {string} refreshToken
 * @returns {Promise<{access_token: string, refresh_token: string, expires_in: number}>}
 */
export async function refreshAccessToken(refreshToken) {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || 'Token refresh failed');
  }

  const data = await response.json();

  return {
    access_token: data.access_token,
    // Spotify may rotate the refresh token — use the new one if provided
    refresh_token: data.refresh_token || refreshToken,
    expires_in: data.expires_in,
  };
}
