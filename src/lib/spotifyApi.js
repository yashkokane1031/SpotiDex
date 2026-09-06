/**
 * Spotify Web API helpers.
 */

const BASE_URL = 'https://api.spotify.com/v1';

/**
 * Fetch the user's currently-playing track.
 *
 * @param {string} accessToken
 * @returns {Promise<object|null>} Parsed track data, or null if nothing is playing.
 * @throws {Error} With `.status` set on 401 (expired token) or other non-2xx.
 */
export async function getCurrentlyPlaying(accessToken) {
  const response = await fetch(`${BASE_URL}/me/player/currently-playing`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  // 204 No Content — nothing is playing
  if (response.status === 204) {
    return null;
  }

  // 401 — token expired mid-poll
  if (response.status === 401) {
    const error = new Error('Access token expired');
    error.status = 401;
    throw error;
  }

  // Any other non-2xx
  if (!response.ok) {
    const error = new Error(`Spotify API error: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  // 200 — parse and normalize the track data
  const data = await response.json();

  if (!data.item) {
    return null;
  }

  return {
    id: data.item.id,
    uri: data.item.uri,
    name: data.item.name,
    artists: data.item.artists.map((a) => a.name).join(', '),
    album: {
      name: data.item.album.name,
      images: data.item.album.images, // full array — Phase 3 picks sizes
    },
    duration_ms: data.item.duration_ms,
    progress_ms: data.progress_ms, // top-level, not nested under item
    is_playing: data.is_playing,
  };
}

/**
 * Fetch the user's current playback state (shuffle, repeat, active session).
 *
 * @param {string} accessToken
 * @returns {Promise<{ shuffleState: boolean, repeatState: string }|null>}
 * @throws {Error} With `.status` set on 401 or non-2xx.
 */
export async function getPlaybackState(accessToken) {
  const response = await fetch(`${BASE_URL}/me/player`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  // 204 No Content — no active session
  if (response.status === 204) {
    return null;
  }

  // 401 — token expired
  if (response.status === 401) {
    const error = new Error('Access token expired');
    error.status = 401;
    throw error;
  }

  // Any other non-2xx
  if (!response.ok) {
    const error = new Error(`Spotify API error: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  return {
    shuffleState: Boolean(data.shuffle_state),
    repeatState: data.repeat_state || 'off',
    context: data.context || null,
  };
}

// ---------------------------------------------------------------------------
// Playback control helpers
// ---------------------------------------------------------------------------

/**
 * Shared handler for control endpoints that return 204 on success.
 * Throws with .status on failure, with .noDevice = true for 404.
 */
async function controlRequest(url, token, method = 'PUT', body = null) {
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  const response = await fetch(url, options);

  if (response.status === 204 || response.ok) return;

  const error = new Error(
    response.status === 404
      ? 'No active device — start playing on a device first'
      : `Spotify API error: ${response.status}`
  );
  error.status = response.status;
  error.noDevice = response.status === 404;
  throw error;
}

export function pausePlayback(token) {
  return controlRequest(`${BASE_URL}/me/player/pause`, token, 'PUT');
}

export function resumePlayback(token) {
  return controlRequest(`${BASE_URL}/me/player/play`, token, 'PUT');
}

export function playTracks(token, uris) {
  return controlRequest(`${BASE_URL}/me/player/play`, token, 'PUT', { uris });
}

export function skipNext(token) {
  return controlRequest(`${BASE_URL}/me/player/next`, token, 'POST');
}

export function skipPrevious(token) {
  return controlRequest(`${BASE_URL}/me/player/previous`, token, 'POST');
}

export function setVolume(token, percent) {
  const vol = Math.round(Math.min(100, Math.max(0, percent)));
  return controlRequest(`${BASE_URL}/me/player/volume?volume_percent=${vol}`, token, 'PUT');
}

export function setShuffle(token, state) {
  return controlRequest(`${BASE_URL}/me/player/shuffle?state=${Boolean(state)}`, token, 'PUT');
}

export function setRepeat(token, state) {
  return controlRequest(`${BASE_URL}/me/player/repeat?state=${encodeURIComponent(state)}`, token, 'PUT');
}

// ---------------------------------------------------------------------------
// Queue
// ---------------------------------------------------------------------------

/**
 * Fetch the user's current playback queue.
 *
 * @param {string} accessToken
 * @returns {Promise<{ currently_playing: object|null, queue: Array }>}
 */
export async function getQueue(accessToken) {
  const response = await fetch(`${BASE_URL}/me/player/queue`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  // 204 No Content — nothing in queue
  if (response.status === 204) {
    return { currently_playing: null, queue: [] };
  }

  if (response.status === 401) {
    const error = new Error('Access token expired');
    error.status = 401;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(`Spotify API error: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  const queueItems = (data.queue || []).map((item) => {
    const artists = item.artists ? item.artists.map((a) => a.name).join(', ') : '';
    const images = item.album?.images || item.images || [];
    const image = images[0]?.url || images[1]?.url || '';

    return {
      id: item.id || `queue-${Math.random()}`,
      uri: item.uri || (item.id ? `spotify:track:${item.id}` : ''),
      name: item.name || 'Unknown Track',
      artists,
      album: {
        name: item.album?.name || '',
        images,
      },
      duration_ms: item.duration_ms || 0,
      image,
      alt: `${item.name || 'Track'} - ${artists}`,
    };
  });

  return {
    currently_playing: data.currently_playing || null,
    queue: queueItems,
  };
}

// ---------------------------------------------------------------------------
// Devices
// ---------------------------------------------------------------------------

/**
 * Fetch the user's available Spotify devices.
 *
 * @param {string} accessToken
 * @returns {Promise<Array<{ id: string, is_active: boolean, name: string, type: string, volume_percent: number }>>}
 */
export async function getDevices(accessToken) {
  const response = await fetch(`${BASE_URL}/me/player/devices`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.status === 204) {
    return [];
  }

  if (response.status === 401) {
    const error = new Error('Access token expired');
    error.status = 401;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(`Spotify API error: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  return (data.devices || []).map((d) => ({
    id: d.id,
    is_active: Boolean(d.is_active),
    name: d.name || 'Unknown Device',
    type: d.type || 'Speaker',
    volume_percent: d.volume_percent ?? 100,
  }));
}

/**
 * Transfer playback to a specific device ID and start playing.
 *
 * @param {string} token
 * @param {string} deviceId
 */
export function transferPlayback(token, deviceId) {
  return controlRequest(`${BASE_URL}/me/player`, token, 'PUT', {
    device_ids: [deviceId],
    play: true,
  });
}

// ---------------------------------------------------------------------------
// Playback Context
// ---------------------------------------------------------------------------

/**
 * Start playback with a context URI (e.g. playlist or album).
 *
 * @param {string} token
 * @param {string} contextUri
 * @param {string|null} offsetUri
 */
export function playContext(token, contextUri, offsetUri = null) {
  const body = {
    context_uri: contextUri,
    ...(offsetUri ? { offset: { uri: offsetUri } } : {}),
  };
  return controlRequest(`${BASE_URL}/me/player/play`, token, 'PUT', body);
}

// ---------------------------------------------------------------------------
// Library & Playlists
// ---------------------------------------------------------------------------

/**
 * Fetch the current user's Spotify ID.
 *
 * @param {string} accessToken
 * @returns {Promise<string>}
 */
export async function getCurrentUserId(accessToken) {
  const response = await fetch(`${BASE_URL}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.status === 401) {
    const error = new Error('Access token expired');
    error.status = 401;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(`Spotify API error: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  return data.id;
}

/**
 * Fetch the current user's playlists (up to 50).
 *
 * @param {string} accessToken
 * @returns {Promise<Array<object>>}
 */
export async function getUserPlaylists(accessToken) {
  const response = await fetch(`${BASE_URL}/me/playlists?limit=50`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.status === 204) {
    return [];
  }

  if (response.status === 401) {
    const error = new Error('Access token expired');
    error.status = 401;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(`Spotify API error: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  return data.items || [];
}

/**
 * Fetch tracks from a playlist (up to 50).
 *
 * @param {string} accessToken
 * @param {string} playlistId
 * @returns {Promise<Array<{ id: string, uri: string, name: string, artist: string, album: string, image: string, durationMs: number }>>}
 */
export async function getPlaylistTracks(accessToken, playlistId) {
  const response = await fetch(`${BASE_URL}/playlists/${encodeURIComponent(playlistId)}/tracks?limit=50`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.status === 204) {
    return [];
  }

  if (response.status === 401) {
    const error = new Error('Access token expired');
    error.status = 401;
    throw error;
  }

  if (!response.ok) {
    let errorDetail = `Spotify API error: ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson?.error?.message) {
        errorDetail = errJson.error.message;
      }
    } catch {
      // ignore
    }
    const error = new Error(errorDetail);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  const rawItems = data.items || [];

  return rawItems
    .filter((item) => item && item.track && item.track.id)
    .map((item) => {
      const t = item.track;
      const images = t.album?.images || [];
      const image = images[images.length - 1]?.url || images[0]?.url || '';
      const artist = (t.artists || []).map((a) => a.name).join(', ') || 'Unknown Artist';

      return {
        id: t.id,
        uri: t.uri || `spotify:track:${t.id}`,
        name: t.name || 'Unknown Track',
        artist,
        album: t.album?.name || '',
        image,
        durationMs: t.duration_ms || 0,
      };
    });
}

