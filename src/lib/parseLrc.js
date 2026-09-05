/**
 * LRC timestamp parser.
 * Converts an LRC-format string into a sorted array of { timeMs, text } objects.
 *
 * Handles both [mm:ss.xx] (2-digit) and [mm:ss.xxx] (3-digit) fractional formats.
 * Skips metadata tags ([ar:], [ti:], [al:], etc.) and malformed lines.
 */

// Matches lines like: [01:23.45]Some lyric text  or  [01:23.456]text
const LRC_LINE_RE = /^\[(\d{1,3}):(\d{2})\.(\d{2,3})\]\s?(.*)/;

/**
 * @param {string} lrcString — raw LRC content
 * @returns {Array<{ timeMs: number, text: string }>} sorted by timeMs ascending
 */
export function parseLrc(lrcString) {
  if (!lrcString || typeof lrcString !== 'string') return [];

  const lines = lrcString.split('\n');
  const result = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const match = line.match(LRC_LINE_RE);
    if (!match) continue; // skip metadata tags & malformed lines

    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    let fractional = match[3];

    // Normalise to milliseconds: "45" → 450ms, "456" → 456ms
    if (fractional.length === 2) {
      fractional = parseInt(fractional, 10) * 10;
    } else {
      fractional = parseInt(fractional, 10);
    }

    const timeMs = minutes * 60_000 + seconds * 1000 + fractional;
    result.push({ timeMs, text: match[4] });
  }

  result.sort((a, b) => a.timeMs - b.timeMs);
  return result;
}
