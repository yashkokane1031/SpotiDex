import './PageFrame.css';

/**
 * Outer layout wrapper — corner brackets, decorative scatter, RGB-glitch title.
 * When isObsMode is true, decorative chrome is stripped and wrapper is transparent.
 *
 * @param {{ children: React.ReactNode, isObsMode?: boolean }} props
 */
export default function PageFrame({ children, isObsMode = false, showTitle = false }) {
  if (isObsMode) {
    return (
      <div className="page-frame page-frame--obs">
        <div className="page-frame__content page-frame__content--obs">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="page-frame">
      {/* Corner brackets */}
      <CornerBracket className="page-frame__corner page-frame__corner--tl" />
      <CornerBracket className="page-frame__corner page-frame__corner--tr" />
      <CornerBracket className="page-frame__corner page-frame__corner--bl" />
      <CornerBracket className="page-frame__corner page-frame__corner--br" />

      {/* Decorative scatter */}
      <div className="page-frame__decorations">
        <div className="page-frame__checker page-frame__checker--1" />
        <div className="page-frame__checker page-frame__checker--2" />
        <div className="page-frame__checker page-frame__checker--3" />
        <div className="page-frame__checker page-frame__checker--4" />
        <div className="page-frame__line page-frame__line--1" />
        <div className="page-frame__line page-frame__line--2" />
        <div className="page-frame__line page-frame__line--3" />
      </div>

      {/* Optional Title block */}
      {showTitle && (
        <div className="page-frame__title-block">
          <h1 className="page-frame__title" data-text="SPOTIDEX">
            SPOTIDEX
          </h1>
          <p className="page-frame__subtitle">NOW PLAYING SYSTEM</p>
        </div>
      )}

      {/* Content slot */}
      <div className="page-frame__content">
        {children}
      </div>
    </div>
  );
}

/**
 * L-shaped corner bracket SVG.
 */
function CornerBracket({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 38 L2 2 L38 2"
        stroke="var(--chrome-ink)"
        strokeWidth="3.5"
        strokeLinecap="square"
      />
    </svg>
  );
}
