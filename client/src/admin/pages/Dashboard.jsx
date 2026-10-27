import { Link } from 'react-router-dom';
import { ErrorState, Skeleton, StatusBadge, cx } from '../../components/ui';
import { Card, PageHead } from '../components';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/hooks.js';
import { dateFmt, money } from '../../lib/format.js';
import './Dashboard.css';

function Stat({ label, value, sub, to, tone }) {
  const body = (
    <Card className={cx('h-100', to && 'pm-admin-stat--link')}>
      <p className="small text-muted mb-0">{label}</p>
      <p className={cx('pm-admin-stat__value', tone)}>{value}</p>
      {sub && <p className="small text-muted mb-0">{sub}</p>}
    </Card>
  );
  return to ? <Link to={to} className="d-block h-100 text-reset">{body}</Link> : body;
}

export default function Dashboard() {
  const { data, loading, error, reload } = useAsync(() => api.get('/admin/stats'), []);
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading) return <><PageHead title="Dashboard" /><div className="row g-3">{Array.from({ length: 8 }, (_, i) => <div key={i} className="col-6 col-lg-3"><Skeleton style={{ height: 112 }} /></div>)}</div></>;
  const max = Math.max(1, ...data.daily.map((d) => d.revenue));
  const open = ['booked', 'received', 'diagnosing', 'awaiting_approval', 'approved', 'in_repair'].reduce((n, k) => n + (data.repairs[k] || 0), 0);
  const stat = (props) => <div className="col-6 col-lg-3"><Stat {...props} /></div>;
  return (
    <>
      <PageHead title="Dashboard" subtitle="How the store is doing." />
      <div className="row g-3">
        {stat({ label: 'Revenue (paid)', value: money(data.revenue), sub: 'Paid orders, excluding cancelled' })}
        {stat({ label: 'Orders today', value: data.ordersToday, sub: `${data.totalOrders} all time`, to: '/admin/orders' })}
        {stat({ label: 'Orders to fulfil', value: data.pendingOrders, to: '/admin/orders', tone: data.pendingOrders ? 'text-accent' : '' })}
        {stat({ label: 'Open repairs', value: open, sub: `${data.repairs.awaiting_approval || 0} awaiting customer approval`, to: '/admin/repairs' })}
        {stat({ label: 'Active products', value: data.products, to: '/admin/products' })}
        {stat({ label: 'Low stock', value: data.lowStock, to: '/admin/inventory', tone: data.lowStock ? 'pm-admin-warn' : '' })}
        {stat({ label: 'Out of stock', value: data.outOfStock, to: '/admin/inventory', tone: data.outOfStock ? 'text-danger' : '' })}
        {stat({ label: 'Customers', value: data.customers, sub: `${data.newMessages} new message(s)`, to: '/admin/customers' })}
      </div>
      <div className="row g-3 mt-1">
        <div className="col-12 col-lg-7">
          <Card className="h-100">
            <h2 className="h6 fw-semibold mb-3">Sales, last 14 days</h2>
            <div className="pm-admin-chart" role="img" aria-label="Daily sales chart">
              {data.daily.map((d) => (
                <div key={d.date} className="pm-admin-chart__col">
                  <div className="pm-admin-chart__bar" style={{ height: `${Math.max(2, (d.revenue / max) * 100)}%` }} />
                  <span className="pm-admin-chart__tip">{dateFmt(d.date, { day: 'numeric', month: 'short' })}: {money(d.revenue)} · {d.orders} order(s)</span>
                </div>
              ))}
            </div>
            <div className="d-flex justify-content-between small text-muted mt-2"><span>{dateFmt(data.daily[0]?.date, { day: 'numeric', month: 'short' })}</span><span>Today</span></div>
          </Card>
        </div>
        <div className="col-12 col-lg-5">
          <Card className="h-100">
            <div className="d-flex align-items-center justify-content-between mb-2"><h2 className="h6 fw-semibold mb-0">Recent orders</h2><Link to="/admin/orders" className="small">View all</Link></div>
            {data.recentOrders.length === 0 ? <p className="small text-muted mb-0">No orders yet.</p> : (
              <ul className="pm-admin-recent">
                {data.recentOrders.map((o) => (
                  <li key={o.id}>
                    <span className="min-w-0"><span className="d-block text-truncate fw-medium">{o.orderNumber}</span><span className="d-block text-truncate small text-muted">{o.user?.name}</span></span>
                    <span className="d-flex align-items-center gap-2 flex-shrink-0"><StatusBadge status={o.status} /><span className="fw-medium">{money(o.total)}</span></span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
