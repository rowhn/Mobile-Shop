import { cx } from '../../components/ui';

/** White rounded box used to group content on admin pages. */
export default function Card({ children, className }) {
  return <div className={cx('pm-admin-card', className)}>{children}</div>;
}
