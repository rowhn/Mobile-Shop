import { STATUS_TONE, label as labelize } from '../../lib/format.js';
import { cx } from './cx.js';
import './Badge.css';

/** tone: blue | green | amber | red | violet | gray | dark */
export const Badge = ({ tone = 'gray', children, className }) => <span className={cx('pm-badge', `pm-badge--${tone}`, className)}>{children}</span>;
export const StatusBadge = ({ status }) => <Badge tone={STATUS_TONE[status] || 'gray'}>{labelize(status)}</Badge>;
