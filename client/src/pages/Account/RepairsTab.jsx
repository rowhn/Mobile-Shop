import { Button, EmptyState, ErrorState, Skeleton, StatusBadge } from '../../components/ui';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/hooks.js';
import { useAuth } from '../../context/Auth.jsx';
import './Account.css';

export default function RepairsTab() {
  const { data, loading, error, reload } = useAsync(() => api.get('/repairs/mine'), []);
  const { user } = useAuth();
  if (loading) return <Skeleton style={{ height: 112 }} />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!data.items.length) return <EmptyState icon="wrench" title="No repair bookings" text="Bookings made while signed in appear here." action={<Button to="/repair/book">Book a repair</Button>} />;
  return (
    <ul className="pm-account__list">
      {data.items.map((b) => (
        <li key={b.reference} className="pm-account__card">
          <div className="pm-account__row">
            <div><p className="fw-semibold mb-0">{b.deviceLabel}</p><p className="small text-muted mb-0">{b.reference} · {b.services.map((s) => s.name).join(', ')}</p></div>
            <StatusBadge status={b.status} />
          </div>
          <Button to={`/repair/track?ref=${b.reference}&phone=${user.phone || ''}`} variant="secondary" size="sm" className="mt-3">View progress</Button>
        </li>
      ))}
    </ul>
  );
}
