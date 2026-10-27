import Icon from '../Icon.jsx';
import { Button } from './Button.jsx';
import { cx } from './cx.js';
import './Feedback.css';

export function Spinner({ size = 20, className }) {
  return (
    <svg className={cx('pm-spin', className)} width={size} height={size} viewBox="0 0 24 24" fill="none" role="status" aria-label="Loading">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Grey shimmering placeholder. Give it a size with style or a className (e.g. ratio ratio-1x1). */
export const Skeleton = ({ className, style }) => <div className={cx('skeleton', className)} style={style} aria-hidden="true" />;

export function PageLoader() {
  return (
    <div className="pm-loader text-muted">
      <Spinner size={28} />
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'Something went wrong' }) {
  return (
    <div className="pm-state">
      <div className="pm-state__icon pm-state__icon--bad">
        <Icon name="alert" size={24} />
      </div>
      <h2 className="h5 fw-semibold mb-0">{title}</h2>
      <p className="text-muted mb-0">{error?.message || 'Please try again.'}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ icon = 'box', title, text, action }) {
  return (
    <div className="pm-state">
      <div className="pm-state__icon">
        <Icon name={icon} size={28} />
      </div>
      <h2 className="h5 fw-semibold mb-0">{title}</h2>
      {text && <p className="text-muted mb-0">{text}</p>}
      {action}
    </div>
  );
}

/** tone: info | error | warn | success */
export function Alert({ tone = 'info', children, className }) {
  const bs = { info: 'alert-primary', error: 'alert-danger', warn: 'alert-warning', success: 'alert-success' }[tone];
  return (
    <div className={cx('alert pm-alert', bs, className)} role={tone === 'error' ? 'alert' : undefined}>
      <Icon name={tone === 'success' ? 'check' : tone === 'info' ? 'info' : 'alert'} size={16} className="mt-1 flex-shrink-0" />
      <div>{children}</div>
    </div>
  );
}
