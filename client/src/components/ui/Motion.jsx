import { motion } from 'motion/react';
import { cx } from './cx.js';
import './Motion.css';

/** Fades/slides children in when scrolled into view (respects "reduce motion"). */
export function Reveal({ children, delay = 0, className, y = 24, as = 'div' }) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Tag>
  );
}

export function SectionHeading({ eyebrow, title, action, className }) {
  return (
    <div className={cx('pm-section-heading', className)}>
      <div>
        {eyebrow && <p className="pm-section-heading__eyebrow">{eyebrow}</p>}
        <h2 className="section-title mb-0">{title}</h2>
      </div>
      {action}
    </div>
  );
}
