import { forwardRef, useId } from 'react';
import { cx } from './cx.js';
import './Form.css';

// Bootstrap form controls. They are full-width by default; pass className="w-auto" for a narrow field.
export const Input = forwardRef(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={cx('form-control', className)} {...rest} />;
});
export const Textarea = forwardRef(function Textarea({ className, rows = 4, ...rest }, ref) {
  return <textarea ref={ref} rows={rows} className={cx('form-control', className)} {...rest} />;
});
export const Select = forwardRef(function Select({ className, children, ...rest }, ref) {
  return (
    <select ref={ref} className={cx('form-select', className)} {...rest}>
      {children}
    </select>
  );
});

/** Label + control + hint/error. `children` can be a node or `(id) => node`. */
export function Field({ label, hint, error, children, className }) {
  const id = useId();
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="form-label fw-medium small mb-1">
          {label}
        </label>
      )}
      {typeof children === 'function' ? children(id) : children}
      {hint && !error && <div className="form-text">{hint}</div>}
      {error && <div className="pm-field-error" role="alert">{error}</div>}
    </div>
  );
}

/** On/off switch with a label (Bootstrap form-switch). */
export function Toggle({ checked, onChange, label, description }) {
  const id = useId();
  return (
    <div className="form-check form-switch pm-toggle">
      <input className="form-check-input" type="checkbox" role="switch" id={id} checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <label className="form-check-label" htmlFor={id}>
        <span className="d-block fw-medium small">{label}</span>
        {description && <span className="d-block text-muted pm-toggle__desc">{description}</span>}
      </label>
    </div>
  );
}
