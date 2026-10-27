import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import Icon from '../../components/Icon.jsx';
import { ProductImage } from '../../components/ProductCard.jsx';
import { Alert, Button, ErrorState, PageLoader, StatusBadge, cx } from '../../components/ui';
import { api } from '../../lib/api.js';
import { payWithRazorpay } from '../../lib/payment.js';
import { useAsync, usePageTitle } from '../../lib/hooks.js';
import { dateTimeFmt, label, money } from '../../lib/format.js';
import { useToast } from '../../context/Toast.jsx';
import './Account.css';

const ORDER_STEPS = ['placed', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function OrderDetail() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const toast = useToast();
  const { data, loading, error, reload, setData } = useAsync(() => api.get(`/orders/${id}`), [id]);
  const [busy, setBusy] = useState('');
  usePageTitle('Order');
  if (loading && !data) return <div className="container"><PageLoader /></div>;
  if (error) return <div className="container"><ErrorState error={error} onRetry={reload} /><div className="text-center"><Button to="/account" variant="secondary">My orders</Button></div></div>;
  const o = data.order;
  const step = ORDER_STEPS.indexOf(o.status === 'pending_payment' ? 'placed' : o.status);

  const payNow = async () => {
    setBusy('pay');
    try {
      const r = await api.post(`/orders/${o.id}/pay`);
      const result = await payWithRazorpay(r);
      if (result.status === 'paid') { setData({ order: result.order }); toast.success('Payment received. Thank you!'); }
      else if (result.status === 'failed') toast.error(result.message);
    } catch (err) { toast.error(err.message); } finally { setBusy(''); reload(); }
  };
  const cancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    setBusy('cancel');
    try { const r = await api.post(`/orders/${o.id}/cancel`); setData({ order: r.order }); toast.success('Order cancelled'); }
    catch (err) { toast.error(err.message); } finally { setBusy(''); }
  };
  const canCancel = ['pending_payment', 'placed', 'confirmed'].includes(o.status);
  const a = o.shippingAddress;

  return (
    <div className="container py-4 py-lg-5">
      <Link to="/account" className="pm-order__back"><Icon name="chevronLeft" size={16} />All orders</Link>
      {sp.get('placed') && o.status !== 'cancelled' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="pm-order__placed">
          <div className="pm-order__tick"><Icon name="check" size={28} strokeWidth={2.5} /></div>
          <h1 className="page-title">{o.payment.status === 'paid' || o.payment.method === 'cod' ? 'Thank you! Your order is in.' : 'Order created'}</h1>
          <p className="text-muted mb-0 mt-2">Order <strong>{o.orderNumber}</strong>. We'll keep you posted on its progress.</p>
        </motion.div>
      )}
      <div className="pm-account__row">
        <div><h2 className="h4 fw-semibold mb-0">Order {o.orderNumber}</h2><p className="small text-muted mb-0">Placed {dateTimeFmt(o.createdAt)}</p></div>
        <div className="d-flex align-items-center gap-2"><StatusBadge status={o.status} /><StatusBadge status={o.payment.status} /></div>
      </div>

      {o.status === 'pending_payment' && (
        <Alert tone="warn" className="mt-4">
          <p className="mb-0">Payment is pending. Stock is held for a limited time; unpaid orders are cancelled automatically.</p>
          <Button size="sm" className="mt-3" onClick={payNow} loading={busy === 'pay'}>Pay {money(o.total)} now</Button>
        </Alert>
      )}
      {o.payment.status === 'refund_pending' && <Alert tone="info" className="mt-4">A refund is being processed to your original payment method.</Alert>}

      {o.status !== 'cancelled' && o.status !== 'pending_payment' && (
        <ol className="pm-order__steps" aria-label="Order progress">
          {ORDER_STEPS.map((s, i) => <li key={s} className={cx('pm-order__step', i <= step && 'is-done')}>{label(s)}</li>)}
        </ol>
      )}

      {o.tracking?.trackingNumber && <p className="pm-order__ship"><Icon name="truck" />Shipped via <strong>{o.tracking.courier || 'courier'}</strong>, tracking no. <strong>{o.tracking.trackingNumber}</strong></p>}

      <div className="row g-4 mt-2">
        <div className="col-lg-8">
          <ul className="pm-order__items">
            {o.items.map((i) => (
              <li key={i.sku + i.name} className="pm-order__item">
                <ProductImage product={{ name: i.name, images: i.image ? [{ url: i.image }] : [] }} className="pm-order__img" />
                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                  <Link to={`/product/${i.slug}`} className="fw-medium text-reset">{i.name}</Link>
                  {i.variantLabel && <p className="small text-muted mb-0">{i.variantLabel}</p>}
                  <p className="small text-muted mt-1 mb-0">Qty {i.qty} × {money(i.unitPrice)}</p>
                </div>
                <p className="fw-semibold mb-0">{money(i.unitPrice * i.qty)}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="col-lg-4 d-grid gap-3 align-content-start">
          <div className="pm-order__sum">
            <dl>
              <div><dt className="fw-normal text-muted">Subtotal</dt><dd>{money(o.subtotal)}</dd></div>
              {o.discount > 0 && <div className="text-success"><dt className="fw-normal">Discount {o.couponCode && `(${o.couponCode})`}</dt><dd>− {money(o.discount)}</dd></div>}
              <div><dt className="fw-normal text-muted">Shipping</dt><dd>{o.shipping ? money(o.shipping) : 'Free'}</dd></div>
              <div className="pm-order__total"><dt>Total</dt><dd>{money(o.total)}</dd></div>
            </dl>
            <p className="small text-muted mt-3 mb-0">Payment: {o.payment.method === 'cod' ? 'Cash on delivery' : 'Online (Razorpay)'}</p>
          </div>
          <div className="pm-order__box">
            <h3 className="h6 fw-semibold mb-1">Delivering to</h3>
            <p className="text-muted mb-0">{a.name}<br />{a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />{a.city}, {a.state} {a.pincode}<br />{a.phone}</p>
          </div>
          {canCancel && <Button variant="outline" className="w-100" onClick={cancel} loading={busy === 'cancel'}>Cancel order</Button>}
        </div>
      </div>
    </div>
  );
}
