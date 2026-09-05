import { useMemo, useEffect, useRef } from 'react';
import { hashString, mulberry32 } from '../lib/seededRandom';
import './AudioVisualizer.css';

const BAR_COUNT = 36;
const CELL_COUNT = 8;
const RESTING_LEVEL = 1;

/**
 * Seeded, deterministic audio visualizer panel.
 * Same trackId always produces the same oscillation pattern.
 * Renders as a standalone bordered module below the vinyl card.
 *
 * @param {{ trackId: string, isPlaying: boolean }} props
 */
export default function AudioVisualizer({ trackId, isPlaying }) {
  const barProfiles = useMemo(() => {
    const rng = mulberry32(hashString(trackId));
    return Array.from({ length: BAR_COUNT }, () => ({
      frequency: 0.5 + rng() * 1.5,
      phase: rng() * Math.PI * 2,
      baseAmplitude: 0.4 + rng() * 0.6,
    }));
  }, [trackId]);

  const barRefs = useRef([]);
  const rafRef = useRef(null);

  if (barRefs.current.length !== BAR_COUNT) {
    barRefs.current = Array.from({ length: BAR_COUNT }, () => []);
  }

  useEffect(() => {
    if (!isPlaying) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      applyLevels(Array(BAR_COUNT).fill(RESTING_LEVEL));
      return;
    }

    function tick(timestamp) {
      const time = timestamp / 1000;
      const levels = barProfiles.map((p) => {
        const value = p.baseAmplitude * (0.5 + 0.5 * Math.sin(time * p.frequency * Math.PI * 2 + p.phase));
        return Math.round(value * CELL_COUNT);
      });
      applyLevels(levels);
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [isPlaying, barProfiles]);

  function applyLevels(levels) {
    for (let b = 0; b < BAR_COUNT; b++) {
      const cells = barRefs.current[b];
      if (!cells) continue;
      for (let c = 0; c < CELL_COUNT; c++) {
        const el = cells[c];
        if (!el) continue;
        if (c < levels[b]) {
          el.classList.add('audio-viz__cell--active');
        } else {
          el.classList.remove('audio-viz__cell--active');
        }
      }
    }
  }

  return (
    <div className="audio-viz-panel">
      <div className="audio-viz">
        {barProfiles.map((_, barIdx) => (
          <div className="audio-viz__bar" key={barIdx}>
            {Array.from({ length: CELL_COUNT }, (_, cellIdx) => (
              <div
                key={cellIdx}
                className="audio-viz__cell"
                ref={(el) => {
                  if (!barRefs.current[barIdx]) barRefs.current[barIdx] = [];
                  barRefs.current[barIdx][cellIdx] = el;
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
