import './VinylCard.css';

/**
 * Main card container — thick border, hard shadow, format tag in corner.
 */
export default function VinylCard({ children }) {
  return (
    <div className="vinyl-card">
      <span className="vinyl-card__format-tag">SPOTIDEX · STEREO</span>
      {children}
    </div>
  );
}
