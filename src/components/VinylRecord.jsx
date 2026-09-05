import { useRef, useState, useCallback, useEffect } from 'react';
import './VinylRecord.css';

/**
 * Spinning vinyl record with album art center label, animated tonearm,
 * and drag-to-skip gesture (pointer events).
 *
 * @param {{
 *   albumImages: Array|null,
 *   isSpinning: boolean,
 *   onSkipNext?: () => void,
 *   onSkipPrevious?: () => void,
 *   isBusy?: boolean,
 *   draggable?: boolean,
 * }} props
 */
export default function VinylRecord({
  albumImages,
  isSpinning,
  onSkipNext,
  onSkipPrevious,
  isBusy = false,
  draggable = true,
  trackId = null,
}) {
  const artSrc = albumImages
    ? (albumImages.find((i) => i.width <= 300) || albumImages[albumImages.length - 1])?.url
    : null;

  // --- Needle-drop on track change ---
  const [isTrackChanging, setIsTrackChanging] = useState(false);
  const [trackChangeKey, setTrackChangeKey] = useState(0);
  const prevTrackIdRef = useRef(trackId);
  const changeTimerRef = useRef(null);

  useEffect(() => {
    if (prevTrackIdRef.current && trackId && prevTrackIdRef.current !== trackId) {
      if (changeTimerRef.current) clearTimeout(changeTimerRef.current);
      setTrackChangeKey((k) => k + 1);
      setIsTrackChanging(true);
      changeTimerRef.current = setTimeout(() => {
        setIsTrackChanging(false);
      }, 700);
    }
    prevTrackIdRef.current = trackId;

    return () => {
      if (changeTimerRef.current) clearTimeout(changeTimerRef.current);
    };
  }, [trackId]);

  // --- Drag state ---
  const wrapperRef = useRef(null);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const startXRef = useRef(0);
  const RESISTANCE_THRESHOLD = 120;
  const RESISTANCE_FACTOR = 0.3;

  const getRecordWidth = useCallback(() => {
    return wrapperRef.current?.offsetWidth || 240;
  }, []);

  const applyResistance = useCallback((raw) => {
    const sign = raw > 0 ? 1 : -1;
    const abs = Math.abs(raw);
    if (abs <= RESISTANCE_THRESHOLD) return raw;
    return sign * (RESISTANCE_THRESHOLD + (abs - RESISTANCE_THRESHOLD) * RESISTANCE_FACTOR);
  }, []);

  const handlePointerDown = useCallback((e) => {
    if (!draggable || isCommitting) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    startXRef.current = e.clientX;
    setDragX(0);
  }, [draggable, isCommitting]);

  const handlePointerMove = useCallback((e) => {
    if (!isDragging) return;
    const raw = e.clientX - startXRef.current;
    setDragX(applyResistance(raw));
  }, [isDragging, applyResistance]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const commitThreshold = getRecordWidth() * 0.25;

    if (Math.abs(dragX) > commitThreshold && !isBusy) {
      // Commit: slide off-screen
      const direction = dragX < 0 ? 'left' : 'right';
      const offScreenX = direction === 'left' ? -window.innerWidth : window.innerWidth;
      setDragX(offScreenX);
      setIsCommitting(true);

      // Fire skip
      if (direction === 'left' && onSkipNext) {
        onSkipNext();
      } else if (direction === 'right' && onSkipPrevious) {
        onSkipPrevious();
      }

      // Reset after slide-off animation
      setTimeout(() => {
        setDragX(0);
        setIsCommitting(false);
      }, 400);
    } else {
      // Spring back
      setDragX(0);
    }
  }, [isDragging, dragX, isBusy, getRecordWidth, onSkipNext, onSkipPrevious]);

  const handlePointerCancel = useCallback(() => {
    setIsDragging(false);
    setDragX(0);
  }, []);

  // Direction hint arrows
  const showLeftArrow = dragX < -20;
  const showRightArrow = dragX > 20;

  // Style: translate on outer wrapper, no transition while dragging
  const wrapperStyle = {
    transform: `translateX(${dragX}px)`,
    transition: isDragging ? 'none' : 'transform 0.3s ease-out',
    opacity: isCommitting ? 0 : 1,
    cursor: draggable ? 'grab' : 'default',
  };

  return (
    <div
      className="vinyl-record"
      ref={wrapperRef}
      style={wrapperStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      {/* Direction hints */}
      {showLeftArrow && (
        <span className="vinyl-record__hint vinyl-record__hint--left">▶</span>
      )}
      {showRightArrow && (
        <span className="vinyl-record__hint vinyl-record__hint--right">◀</span>
      )}

      {/* Disc */}
      <div className={`vinyl-record__disc${isSpinning && !isCommitting ? ' vinyl-record__disc--spinning' : ''}`}>
        <div className="vinyl-record__grooves" />
        <div className={`vinyl-record__label${!artSrc ? ' vinyl-record__label--checkerboard' : ''}`}>
          {artSrc && (
            <img
              className="vinyl-record__label-img"
              src={artSrc}
              alt="Album art"
              draggable={false}
            />
          )}
        </div>
      </div>

      {/* Tonearm */}
      <div
        key={trackChangeKey}
        className={`vinyl-record__tonearm${
          isTrackChanging
            ? ' vinyl-record__tonearm--changing'
            : isSpinning && !isCommitting
            ? ' vinyl-record__tonearm--playing'
            : ''
        }`}
      />
    </div>
  );
}
