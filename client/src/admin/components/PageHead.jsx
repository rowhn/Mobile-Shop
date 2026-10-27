import { usePageTitle } from '../../lib/hooks.js';
import './PageHead.css';

/** Title row at the top of every admin page (+ optional subtitle and action button). */
export default function PageHead({ title, subtitle, action }) {
  usePageTitle(`${title} · Admin`);
  return (
    <div className="pm-admin-pagehead">
      <div>
        <h1 className="pm-admin-pagehead__title">{title}</h1>
        {subtitle && <p className="text-muted mb-0 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
