import { Link } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { ErrorState, Skeleton } from '../../components/ui';
import { api } from '../../lib/api.js';
import { useAsync, usePageTitle } from '../../lib/hooks.js';
import './Policies.css';

export default function Policies() {
  usePageTitle('Policies');
  const { data, loading, error, reload } = useAsync(() => api.get('/pages', { kind: 'policy' }), []);
  return (
    <div className="container pm-policies">
      <h1 className="page-title">Policies</h1>
      <p className="fs-5 text-muted mt-3">The fine print, in plain language.</p>
      <div className="mt-4">
        {error ? <ErrorState error={error} onRetry={reload} /> : loading ? <Skeleton style={{ height: 256 }} /> : (
          <ul className="pm-policies__list">
            {data.items.map((p) => (
              <li key={p.id}>
                <Link to={`/policies/${p.slug}`} className="pm-policies__item">
                  <span><span className="d-block fw-medium">{p.title}</span><span className="small text-muted">{p.summary}</span></span>
                  <Icon name="chevronRight" className="text-muted flex-shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
