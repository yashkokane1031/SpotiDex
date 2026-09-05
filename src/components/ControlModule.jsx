import { useState, useCallback, useRef, useEffect } from 'react';
import './ControlModule.css';

/**
 * Pixel-art playback control bar.
 *
 * @param {{
 *   controls: object,
 *   isPlaying: boolean,
 *   hasContext: boolean,
 *   devices?: Array,
 *   activeDeviceId?: string|null,
 *   onSwitchDevice?: (id: string) => void,
 * }} props
 */
export default function ControlModule({
  controls,
  isPlaying,
  hasContext,
  devices = [],
  activeDeviceId = null,
  onSwitchDevice,
}) {
  const {
    togglePlayPause,
    skipToNext,
    skipToPrevious,
    changeVolume,
    toggleShuffle,
    isShuffle,
    cycleRepeat,
    repeatState = 'off',
    isBusy,
    error,
    notice,
    hasContext: controlsHasContext,
  } = controls;

  const [showDevices, setShowDevices] = useState(false);
  const deviceMenuRef = useRef(null);

  useEffect(() => {
    if (!showDevices) return;
    const handleClickOutside = (e) => {
      if (deviceMenuRef.current && !deviceMenuRef.current.contains(e.target)) {
        setShowDevices(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [showDevices]);

  const canShuffle = hasContext ?? controlsHasContext ?? true;

  return (
    <div className="control-module">
      {/* Shuffle */}
      <button
        className={`ctrl-btn ctrl-btn--small${isShuffle ? ' ctrl-btn--shuffle-active' : ''}`}
        onClick={toggleShuffle}
        disabled={isBusy || !canShuffle}
        title={
          !canShuffle
            ? 'Shuffle needs an active playlist or album'
            : isShuffle
            ? 'Shuffle on (click to disable)'
            : 'Shuffle off (click to enable)'
        }
      >
        <svg className="ctrl-icon" viewBox="0 0 16 16">
          <path d="M10 2h4v4h-1.5V4.6l-3 3-1.1-1.1 3-3H10V2z" />
          <path d="M2 3.5h3.2l6.3 9H14v-1.5h-2l-6.3-9H2v1.5z" />
          <path d="M2 12.5h3.2l1.9-2.7-1.1-1.1-1.3 1.9H2v1.9z" />
          <path d="M10 14h4v-4h-1.5v1.4l-3-3-1.1 1.1 3 3H10V14z" />
        </svg>
      </button>

      {/* Repeat */}
      <button
        className={`ctrl-btn ctrl-btn--small${
          repeatState !== 'off' ? ' ctrl-btn--repeat-active' : ''
        }${repeatState === 'track' ? ' ctrl-btn--repeat-track' : ''}`}
        onClick={cycleRepeat}
        disabled={isBusy}
        title={
          repeatState === 'track'
            ? 'Repeat track (click to turn off)'
            : repeatState === 'context'
            ? 'Repeat all (click to repeat track)'
            : 'Repeat off (click to repeat all)'
        }
      >
        <svg className="ctrl-icon" viewBox="0 0 16 16">
          <path d="M4 3h7v2H5.5l1.8 1.8-1.1 1.1L3 4.7l3.2-3.2 1.1 1.1L5.5 3H11a2 2 0 0 1 2 2v2h-2V5H4v-2z" />
          <path d="M12 13H5v-2h5.5l-1.8-1.8 1.1-1.1L13 11.3l-3.2 3.2-1.1-1.1 1.8-1.4H5a2 2 0 0 1-2-2v-2h2v2h7v2z" />
        </svg>
        {repeatState === 'track' && <span className="ctrl-btn__badge">1</span>}
      </button>

      {/* Previous */}
      <button
        className="ctrl-btn ctrl-btn--small"
        onClick={skipToPrevious}
        disabled={isBusy}
        title="Previous"
      >
        <svg className="ctrl-icon" viewBox="0 0 16 16">
          <path d="M3 2h2v12H3zM13 2L6 8l7 6z" />
        </svg>
      </button>

      {/* Play / Pause */}
      <button
        className="ctrl-btn ctrl-btn--play"
        onClick={togglePlayPause}
        disabled={isBusy}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <svg className="ctrl-icon ctrl-icon--lg" viewBox="0 0 16 16">
            <path d="M3 2h4v12H3zM9 2h4v12H9z" />
          </svg>
        ) : (
          <svg className="ctrl-icon ctrl-icon--lg" viewBox="0 0 16 16">
            <path d="M4 2l10 6-10 6z" />
          </svg>
        )}
      </button>

      {/* Next */}
      <button
        className="ctrl-btn ctrl-btn--small"
        onClick={skipToNext}
        disabled={isBusy}
        title="Next"
      >
        <svg className="ctrl-icon" viewBox="0 0 16 16">
          <path d="M11 2h2v12h-2zM3 2l7 6-7 6z" />
        </svg>
      </button>

      {/* Error or Notice (inline, replaces volume when present) */}
      {error ? (
        <span className="control-module__error">{error.message}</span>
      ) : notice ? (
        <span className="control-module__notice" title={notice}>{notice}</span>
      ) : (
        <VolumeSlider onChange={changeVolume} disabled={isBusy} />
      )}

      {/* Device Switcher */}
      <div className="device-switcher" ref={deviceMenuRef}>
        <button
          type="button"
          className={`ctrl-btn ctrl-btn--small ctrl-btn--device${showDevices ? ' ctrl-btn--device-open' : ''}`}
          onClick={() => setShowDevices((v) => !v)}
          title="Switch Playback Device"
          aria-label="Switch playback device"
          aria-expanded={showDevices}
        >
          <svg className="ctrl-icon" viewBox="0 0 16 16">
            <rect x="2" y="2" width="12" height="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5 14h6M8 11v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
          </svg>
        </button>

        {showDevices && (
          <div className="device-popover" role="dialog" aria-label="Available Devices">
            <div className="device-popover__header">
              <span className="device-popover__title">DEVICES</span>
            </div>
            <div className="device-popover__list">
              {devices && devices.length > 0 ? (
                devices.map((d) => {
                  const isActive = d.is_active || d.id === activeDeviceId;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      className={`device-popover__item${isActive ? ' is-active' : ''}`}
                      onClick={() => {
                        if (!isActive && onSwitchDevice) {
                          onSwitchDevice(d.id);
                        }
                        setShowDevices(false);
                      }}
                    >
                      <span className="device-popover__item-name">{d.name}</span>
                      <span className="device-popover__item-type">[{d.type.toUpperCase()}]</span>
                      {isActive && <span className="device-popover__item-active">▶</span>}
                    </button>
                  );
                })
              ) : (
                <div className="device-popover__empty">No devices found</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Continuous volume slider with pixel-styled track, rectangular thumb,
 * speaker icon, and live numeric percentage readout.
 */
function VolumeSlider({ onChange, disabled }) {
  const [percent, setPercent] = useState(70);
  const trackRef = useRef(null);
  const isDraggingRef = useRef(false);
  const debounceTimerRef = useRef(null);

  const calculatePercent = useCallback((clientX) => {
    const track = trackRef.current;
    if (!track) return percent;
    const rect = track.getBoundingClientRect();
    const raw = ((clientX - rect.left) / rect.width) * 100;
    return Math.round(Math.min(100, Math.max(0, raw)));
  }, [percent]);

  const fireDebounced = useCallback((pct) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      onChange(pct);
    }, 250);
  }, [onChange]);

  const onPointerDown = useCallback((e) => {
    if (disabled) return;
    isDraggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const pct = calculatePercent(e.clientX);
    setPercent(pct);
    fireDebounced(pct);
  }, [disabled, calculatePercent, fireDebounced]);

  const onPointerMove = useCallback((e) => {
    if (!isDraggingRef.current) return;
    const pct = calculatePercent(e.clientX);
    setPercent(pct);
    fireDebounced(pct);
  }, [calculatePercent, fireDebounced]);

  const onPointerUp = useCallback((e) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    const pct = calculatePercent(e.clientX);
    setPercent(pct);
    onChange(pct);
  }, [calculatePercent, onChange]);

  return (
    <div
      className={`volume-slider${disabled ? ' volume-slider--disabled' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      title={`Volume: ${percent}%`}
      role="slider"
      aria-label="Volume slider"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* Speaker glyph */}
      <svg className="volume-slider__icon" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M2 5h3l4-4v14L5 11H2V5z" fill="currentColor" />
        {percent > 0 && (
          <path
            d="M11 5.5a3.5 3.5 0 0 1 0 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
          />
        )}
        {percent > 50 && (
          <path
            d="M13 3.5a6.5 6.5 0 0 1 0 9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
          />
        )}
      </svg>

      {/* Track */}
      <div className="volume-slider__track" ref={trackRef}>
        <div
          className="volume-slider__fill"
          style={{ width: `${percent}%` }}
        />
        <div
          className="volume-slider__thumb"
          style={{ left: `${percent}%` }}
        />
      </div>

      {/* Numeric percentage */}
      <span className="volume-slider__percent">{percent}%</span>
    </div>
  );
}

