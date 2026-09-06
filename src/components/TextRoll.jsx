import { motion } from 'framer-motion';
import './TextRoll.css';

const STAGGER = 0.035;

/**
 * TextRoll hover animation component.
 * Rolls individual letters upward on hover with staggered delays.
 *
 * @param {{ children: string, className?: string, center?: boolean }} props
 */
export const TextRoll = ({ children, className = '', center = false }) => {
  const text = typeof children === 'string' ? children : String(children ?? '');
  const letters = text.split('');

  return (
    <motion.span
      initial="initial"
      whileHover="hovered"
      className={`text-roll ${className}`}
    >
      <div>
        {letters.map((l, i) => {
          const delay = center
            ? STAGGER * Math.abs(i - (letters.length - 1) / 2)
            : STAGGER * i;
          return (
            <motion.span
              variants={{ initial: { y: 0 }, hovered: { y: '-100%' } }}
              transition={{ ease: 'easeInOut', delay }}
              className="text-roll__letter"
              key={i}
            >
              {l === ' ' ? '\u00A0' : l}
            </motion.span>
          );
        })}
      </div>
      <div className="text-roll__ghost">
        {letters.map((l, i) => {
          const delay = center
            ? STAGGER * Math.abs(i - (letters.length - 1) / 2)
            : STAGGER * i;
          return (
            <motion.span
              variants={{ initial: { y: '100%' }, hovered: { y: 0 } }}
              transition={{ ease: 'easeInOut', delay }}
              className="text-roll__letter"
              key={i}
            >
              {l === ' ' ? '\u00A0' : l}
            </motion.span>
          );
        })}
      </div>
    </motion.span>
  );
};

export default TextRoll;
