import { useEffect, useState } from 'react';
import { Badge, Button, ErrorState, Field, Input, Modal, Select, StatusBadge, Textarea } from '../../components/ui';
import { Card, Pager, PageHead, SearchBar, Table, useList } from '../components';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/hooks.js';
import { dateFmt, dateTimeFmt, label, money, slotLabel } from '../../lib/format.js';
import { useToast } from '../../context/Toast.jsx';
import './Orders.css';

const REPAIR_STATUS = ['booked', 'received', 'diagnosing', 'awaiting_approval', 'approved', 'in_repair', 'ready', 'completed', 'declined', 'cancelled'];

export default function RepairBookings() {
  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');
  const list = useList('/admin/repair-bookings', { status, date });
  const [open, setOpen] = useState(null);
  const columns = [
    { key: 'reference', label: 'Reference', render: (b) => <div><p className="fw-medium mb-0">{b.reference}</p><p className="small text-muted mb-0">{dateTimeFmt(b.createdAt)}</p></div> },
    { key: 'customer', label: 'Customer', render: (b) => <div><p className="mb-0">{b.customer.name}</p><p className="small text-muted mb-0">{b.customer.phone}</p></div> },
    { key: 'device', label: 'Device & issue', render: (b) => <div><p className="fw-medium mb-0">{b.deviceLabel}</p><p className="small text-muted mb-0">{b.services.map((s) => s.name).join(', ')}</p></div> },
    { key: 'appt', label: 'Appointment', render: (b) => (b.appointmentDate ? <div><p className="mb-0">{dateFmt(b.appointmentDate + 'T00:00:00')}</p><p className="small text-muted mb-0">{slotLabel(b.slot)}</p></div> : <span className="text-muted">Courier</span>) },
    { key: 'tech', label: 'Technician', render: (b) => b.technician?.name || <span className="text-muted">Unassigned</span> },
    { key: 'status', label: 'Status', render: (b) => <StatusBadge status={b.status} /> },
  ];
  return (
    <>
      <PageHead title="Repair bookings" subtitle="Assign technicians, send quotes and update progress. Customers see public updates when they track." />
      <SearchBar value={list.q} onChange={list.setQ} placeholder="Reference, name, phone or device">
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto" aria-label="Status"><option value="">All statuses</option>{REPAIR_STATUS.map((s) => <option key={s} value={s}>{label(s)}</option>)}</Select>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Appointment date" className="w-auto" />
      </SearchBar>
      {list.error ? <ErrorState error={list.error} onRetry={list.reload} /> : <Table columns={columns} rows={list.data?.items || []} loading={list.loading && !list.data} onRowClick={setOpen} empty="No repair bookings" />}
      <Pager data={list.data} page={list.page} setPage={list.setPage} />
      <BookingModal booking={open} onClose={() => setOpen(null)} onSaved={(b) => { setOpen(b); list.reload(); }} />
    </>
  );
}

function BookingModal({ booking, onClose, onSaved }) {
  const toast = useToast();
  const staff = useAsync(() => api.get('/admin/staff'), []);
  const [f, setF] = useState({ status: '', technician: '', quoteAmount: '', quoteNotes: '', finalAmount: '', publicNote: '', internalNote: '' });
  const [busy, setBusy] = useState('');
  useEffect(() => { if (booking) setF({ status: booking.status, technician: booking.technician?.id || '', quoteAmount: booking.quote?.amount ?? '', quoteNotes: booking.quote?.notes || '', finalAmount: booking.finalAmount ?? '', publicNote: '', internalNote: '' }); }, [booking?.id, booking?.updatedAt]); // eslint-disable-line
  if (!booking) return null;

  const send = async (body, key, msg) => {
    setBusy(key);
    try { const r = await api.patch(`/admin/repair-bookings/${booking.id}`, body); toast.success(msg); onSaved(r.item); }
    catch (err) { toast.error(err.message); } finally { setBusy(''); }
  };
  const save = () => send({
    ...(f.status !== booking.status ? { status: f.status } : {}),
    technician: f.technician || '',
    finalAmount: f.finalAmount === '' ? '' : Number(f.finalAmount),
    publicNote: f.publicNote || undefined,
    internalNote: f.internalNote || undefined,
  }, 'save', 'Booking updated');
  const sendQuote = () => {
    if (f.quoteAmount === '' || Number(f.quoteAmount) < 0) return toast.error('Enter the quote amount');
    send({ quote: { amount: Number(f.quoteAmount), notes: f.quoteNotes || '' } }, 'quote', 'Quote sent for customer approval');
  };
  const b = booking;
  return (
    <Modal open onClose={onClose} title={`Repair ${b.reference}`} wide>
      <div className="row g-4">
        <div className="col-12 col-md-6 small">
          <div className="mb-3"><p className="pm-admin-muted-label">Customer</p><p className="fw-medium mb-0">{b.customer.name}</p><p className="text-muted mb-0"><a href={`tel:${b.customer.phone}`}>{b.customer.phone}</a>{b.customer.email && ` · ${b.customer.email}`}</p></div>
          <div className="mb-3"><p className="pm-admin-muted-label">Device</p><p className="fw-medium mb-0">{b.deviceLabel}</p></div>
          <div className="mb-3"><p className="pm-admin-muted-label">Issues</p><ul className="list-unstyled mb-1">{b.services.map((s) => <li key={s.name} className="d-flex justify-content-between gap-2"><span>{s.name}</span><span className="text-muted">{s.priceMin != null ? `${money(s.priceMin)} – ${money(s.priceMax)}` : 'No estimate'}</span></li>)}</ul><p className="text-muted mb-0">Customer was shown: {b.estimate.min > 0 ? `${money(b.estimate.min)} – ${money(b.estimate.max)}` : 'after inspection'}</p></div>
          {b.issueNotes && <div className="mb-3"><p className="pm-admin-muted-label">Customer notes</p><p className="mb-0">{b.issueNotes}</p></div>}
          <div className="mb-3"><p className="pm-admin-muted-label">Service</p><p className="mb-0">{label(b.method)}{b.appointmentDate && ` · ${dateFmt(b.appointmentDate + 'T00:00:00')}, ${slotLabel(b.slot)}`}</p>{b.method === 'pickup_drop' && <p className="text-muted mb-0">{b.address.line1}, {b.address.line2 && `${b.address.line2}, `}{b.address.city}, {b.address.state} {b.address.pincode}</p>}</div>
          <div className="d-flex align-items-center gap-2 mb-3"><p className="pm-admin-muted-label mb-0">Approval</p><Badge tone={b.approval.status === 'approved' ? 'green' : b.approval.status === 'declined' ? 'red' : b.approval.status === 'pending' ? 'amber' : 'gray'}>{b.approval.status}</Badge></div>
          <div><p className="pm-admin-muted-label mb-2">Timeline</p><ol className="pm-admin-order__timeline">{[...b.timeline].reverse().map((t, i) => <li key={i}><span className="fw-medium">{label(t.status)}</span>{t.internal && <Badge tone="gray" className="ms-2">internal</Badge>}{t.note && <span className="text-muted"> — {t.note}</span>}<span className="d-block small text-muted">{dateTimeFmt(t.at)}</span></li>)}</ol></div>
        </div>
        <div className="col-12 col-md-6 d-grid gap-3 align-content-start">
          <Field label="Status">{(id) => <Select id={id} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>{REPAIR_STATUS.map((s) => <option key={s} value={s}>{label(s)}</option>)}</Select>}</Field>
          <Field label="Technician">{(id) => <Select id={id} value={f.technician || ''} onChange={(e) => setF({ ...f, technician: e.target.value })}><option value="">Unassigned</option>{staff.data?.items.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}</Select>}</Field>
          <Field label="Note visible to customer">{(id) => <Input id={id} value={f.publicNote} onChange={(e) => setF({ ...f, publicNote: e.target.value })} placeholder="e.g. Screen ordered, ready tomorrow" />}</Field>
          <Field label="Internal note (staff only)">{(id) => <Input id={id} value={f.internalNote} onChange={(e) => setF({ ...f, internalNote: e.target.value })} />}</Field>
          <Field label="Final amount charged (₹)">{(id) => <Input id={id} type="number" min="0" value={f.finalAmount} onChange={(e) => setF({ ...f, finalAmount: e.target.value })} />}</Field>
          <Button onClick={save} loading={busy === 'save'} className="w-100">Save changes</Button>
          <Card className="pm-admin-card--soft">
            <h3 className="h6 fw-semibold">Send quote for approval</h3>
            <p className="small text-muted mb-3">The customer sees this when tracking and can approve or decline. Status becomes "Awaiting approval".</p>
            <div className="d-grid gap-2">
              <Input type="number" min="0" aria-label="Quote amount" placeholder="Quote amount (₹)" value={f.quoteAmount} onChange={(e) => setF({ ...f, quoteAmount: e.target.value })} />
              <Textarea rows={2} aria-label="Quote notes" placeholder="What the quote includes" value={f.quoteNotes} onChange={(e) => setF({ ...f, quoteNotes: e.target.value })} />
              <Button variant="dark" onClick={sendQuote} loading={busy === 'quote'} className="w-100">Send quote</Button>
            </div>
          </Card>
        </div>
      </div>
    </Modal>
  );
}
