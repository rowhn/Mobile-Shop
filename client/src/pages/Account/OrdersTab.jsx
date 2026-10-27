import { Link } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { ProductImage } from '../../components/ProductCard.jsx';
import { Button, EmptyState, ErrorState, Skeleton, StatusBadge } from '../../components/ui';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/hooks.js';
import { dateFmt, money } from '../../lib/format.js';
import './Account.css';

export default function OrdersTab() {
  const { data, loading, error, reload } = useAsync(() => api.get('/orders/mine'), []);
  if (loading) return <div className="d-grid gap-3">{[0, 1, 2].map((i) => <Skeleton key={i} style={{ height: 112 }} />)}</div>;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!data.items.length) return <EmptyState icon="box" title="No orders yet" text="When you place an order it will show up here." action={<Button to="/shop">Start shopping</Button>} />;
  return (
    <ul className="pm-account__list">
      {data.items.map((o) => (
        <li key={o.id}>
          <Link to={`/orders/${o.id}`} className="pm-account__card">
            <div className="pm-account__row">
              <div><p className="fw-semibold mb-0">{o.orderNumber}</p><p className="small text-muted mb-0">{dateFmt(o.createdAt)} · {o.items.reduce((n, i) => n + i.qty, 0)} item(s)</p></div>
              <div className="d-flex align-items-center gap-3"><StatusBadge status={o.status} /><span className="fw-semibold">{money(o.total)}</span><Icon name="chevronRight" className="text-muted" /></div>
            </div>
            <div className="pm-account__thumbs">
              {o.items.slice(0, 5).map((i) => <ProductImage key={i.sku + i.name} product={{ name: i.name, images: i.image ? [{ url: i.image }] : [] }} className="pm-account__thumb" />)}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
