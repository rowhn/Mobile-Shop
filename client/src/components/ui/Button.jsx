import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../Icon.jsx';
import { Spinner } from './Feedback.jsx';
import { cx } from './cx.js';
import './Button.css';

// Maps our friendly variant names to Bootstrap button classes.
const VARIANTS = {
  primary: 'btn-primary',
  dark: 'btn-dark',
  secondary: 'btn-light',
  outline: 'btn-outline-secondary',
  ghost: 'btn-link text-accent',
  danger: 'btn-danger',
  whatsapp: 'btn-whatsapp',
};
const SIZES = { sm: 'btn-sm', md: '', lg: 'btn-lg' };

/** <Button variant="primary|dark|secondary|outline|ghost|danger|whatsapp" size="sm|md|lg" to="/path" | href="https://" | onClick /> */
export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading, className, children, to, href, disabled, ...rest },
  ref
) {
  const cls = cx('btn pm-btn', VARIANTS[variant], SIZES[size], className);
  if (to && disabled) {
    return <span aria-disabled="true" className={cx(cls, 'disabled')}>{children}</span>;
  }
  if (to) return <Link ref={ref} to={to} className={cls} {...rest}>{children}</Link>;
  if (href) return <a ref={ref} href={href} className={cls} {...rest}>{children}</a>;
  return (
    <button ref={ref} type="button" className={cls} disabled={disabled || loading} {...rest}>
      {loading && <Spinner size={16} />}
      {children}
    </button>
  );
});

/** Round icon-only button with optional count badge. */
export function IconButton({ icon, label, className, badge, size = 20, ...rest }) {
  return (
    <button type="button" aria-label={label} title={label} className={cx('pm-icon-btn', className)} {...rest}>
      <Icon name={icon} size={size} />
      {badge ? <span className="pm-icon-btn__badge">{badge > 99 ? '99+' : badge}</span> : null}
    </button>
  );
}
