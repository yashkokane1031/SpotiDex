import QueueCarousel from './QueueCarousel';

/**
 * QueuePanel — backwards-compatible alias / re-export for QueueCarousel.
 */
export default function QueuePanel(props) {
  return <QueueCarousel {...props} />;
}
