import { useEffect, useState } from 'react';
import { ProductImage } from '../../components/ProductCard.jsx';
import { Alert, Button, ErrorState, Field, Input, Modal, Select, StatusBadge } from '../../components/ui';
import { Pager, PageHead, SearchBar, Table, useList } from '../components';
import { api } from '../../lib/api.js';
import { dateTimeFmt, label, money } from '../../lib/format.js';
import { useToast } from '../../context/Toast.jsx';
import './Orders.css';

const ORDER_STATUS = ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAY_STATUS = ['pending', 'paid', 'failed', 'refund_pending', 'refunded'];

export default function Orders() {
  const [status, setStatus] = useState('');
  const [payment, setPayment] = useState('');
  const list = useList('/admin/orders', { status, payment });
  const [open, setOpen] = useState(null);
  const columns = [
    { key: 'orderNumber', label: 'Order', render: (o) => <div><p className="fw-medium mb-0">{o.orderNumber}</p><p className="small text-muted mb-0">{dateTimeFmt(o.createdAt)}</p></div> },
    { key: 'user', label: 'Customer', render: (o) => <div><p className="mb-0">{o.user?.name || '—'}</p><p className="small text-muted mb-0">{o.shippingAddress.phone}</p></div> },
    { key: 'items', label: 'Items', render: (o) => o.items.reduce((n, i) => n + i.qty, 0) },
    { key: 'total', label: 'Total', render: (o) => <span className="fw-medium">{money(o.total)}</span> },
    { key: 'payment', label: 'Payment', render: (o) => <div className="d-grid gap-1 justify-items-start"><StatusBadge status={o.payment.status} /><span className="small text-muted">{o.payment.method === 'cod' ? 'COD' : 'Razorpay'}</span></div> },
    { key: 'status', label: 'Status', render: (o) => <StatusBadge status={o.status} /> },
  ];
  return (
    <>
      <PageHead title="Orders" subtitle="Update status, add tracking and manage refunds." />
      <SearchBar value={list.q} onChange={list.setQ} placeholder="Order number, customer name, email or phone">
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto" aria-label="Order status"><option value="">All statuses</option><option value="pending_payment">Pending payment</option>{ORDER_STATUS.map((s) => <option key={s} value={s}>{label(s)}</option>)}</Select>
        <Select value={payment} onChange={(e) => setPayment(e.target.value)} className="w-auto" aria-label="Payment status"><option value="">All payments</option>{PAY_STATUS.map((s) => <option key={s} value={s}>{label(s)}</option>)}</Select>
      </SearchBar>
      {list.error ? <ErrorState error={list.error} onRetry={list.reload} /> : <Table columns={columns} rows={list.data?.items || []} loading={list.loading && !list.data} onRowClick={setOpen} empty="No orders match" />}
      <Pager data={list.data} page={list.page} setPage={list.setPage} />
      <OrderModal order={open} onClose={() => setOpen(null)} onSaved={(o) => { setOpen(o); list.reload(); }} />
    </>
  );
}

function OrderModal({ order, onClose, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState({ status: '', paymentStatus: '', courier: '', trackingNumber: '', note: '' });
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (order) setF({ status: order.status, paymentStatus: order.payment.status, courier: order.tracking?.courier || '', trackingNumber: order.tracking?.trackingNumber || '', note: '' }); }, [order?.id, order?.updatedAt]); // eslint-disable-line
  if (!order) return null;
  const locked = order.status === 'cancelled';
  const save = async () => {
    setBusy(true);
    try {
      const body = { courier: f.courier, trackingNumber: f.trackingNumber, note: f.note };
      if (f.status !== order.status) body.status = f.status;
      if (f.paymentStatus !== order.payment.status) body.paymentStatus = f.paymentStatus;
      const r = await api.patch(`/admin/orders/${order.id}`, body);
      toast.success('Order updated');
      onSaved(r.item);
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };
  const a = order.shippingAddress;
  return (
    <Modal open onClose={onClose} title={`Order ${order.orderNumber}`} wide>
      <div className="row g-4">
        <div className="col-12 col-md-6 small">
          <div className="mb-3"><p className="pm-admin-muted-label">Customer</p><p className="fw-medium mb-0">{order.user?.name}</p><p className="text-muted mb-0">{order.user?.email}</p></div>
          <div className="mb-3"><p className="pm-admin-muted-label">Ship to</p><p className="mb-0">{a.name}, {a.phone}<br />{a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />{a.city}, {a.state} {a.pincode}</p></div>
          {order.notes && <div className="mb-3"><p className="pm-admin-muted-label">Customer note</p><p className="mb-0">{order.notes}</p></div>}
          <ul className="pm-admin-order__items">
            {order.items.map((i) => <li key={i.sku + i.name}><ProductImage product={{ name: i.name, images: i.image ? [{ url: i.image }] : [] }} className="pm-admin-thumb" /><div className="flex-grow-1 min-w-0"><p className="fw-medium text-truncate mb-0">{i.name}</p><p className="small text-muted mb-0">{i.variantLabel} {i.sku && `· ${i.sku}`} · Qty {i.qty}</p></div><span>{money(i.unitPrice * i.qty)}</span></li>)}
          </ul>
          <dl className="pm-admin-order__totals">
            <div><dt>Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
            {order.discount > 0 && <div><dt>Discount {order.couponCode}</dt><dd>−{money(order.discount)}</dd></div>}
            <div><dt>Shipping</dt><dd>{money(order.shipping)}</dd></div>
            <div className="fw-semibold"><dt className="text-body">Total</dt><dd>{money(order.total)}</dd></div>
          </dl>
          {order.payment.razorpayPaymentId && <p className="small text-muted">Razorpay payment: {order.payment.razorpayPaymentId}</p>}
        </div>
        <div className="col-12 col-md-6 d-grid gap-3 align-content-start">
          {locked && <Alert tone="info">This order is cancelled and can't be re-opened.</Alert>}
          {order.payment.status === 'refund_pending' && <Alert tone="warn">A refund is due. Refund it from the Razorpay dashboard, then set payment status to "Refunded".</Alert>}
          <Field label="Order status">{(id) => <Select id={id} disabled={locked} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>{order.status === 'pending_payment' && <option value="pending_payment">Pending payment</option>}{ORDER_STATUS.map((s) => <option key={s} value={s}>{label(s)}</option>)}</Select>}</Field>
          <Field label="Payment status" hint="COD orders are marked paid automatically when delivered.">{(id) => <Select id={id} value={f.paymentStatus} onChange={(e) => setF({ ...f, paymentStatus: e.target.value })}>{PAY_STATUS.map((s) => <option key={s} value={s}>{label(s)}</option>)}</Select>}</Field>
          <div className="row g-2">
            <Field label="Courier" className="col-6">{(id) => <Input id={id} value={f.courier || ''} onChange={(e) => setF({ ...f, courier: e.target.value })} />}</Field>
            <Field label="Tracking no." className="col-6">{(id) => <Input id={id} value={f.trackingNumber || ''} onChange={(e) => setF({ ...f, trackingNumber: e.target.value })} />}</Field>
          </div>
          <Field label="Add a note to the timeline">{(id) => <Input id={id} value={f.note || ''} onChange={(e) => setF({ ...f, note: e.target.value })} />}</Field>
          <Button onClick={save} loading={busy} className="w-100">Save changes</Button>
          <div>
            <p className="pm-admin-muted-label mb-2">Timeline</p>
            <ol className="pm-admin-order__timeline">{[...order.timeline].reverse().map((t, i) => <li key={i}><span className="fw-medium">{label(t.status)}</span>{t.note && <span className="text-muted"> — {t.note}</span>}<span className="d-block small text-muted">{dateTimeFmt(t.at)}</span></li>)}</ol>
          </div>
        </div>
      </div>
    </Modal>
  );
}
