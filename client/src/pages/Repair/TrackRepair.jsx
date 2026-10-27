import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Alert, Button, Field, Input, StatusBadge, cx } from '../../components/ui';
import { api } from '../../lib/api.js';
import { usePageTitle } from '../../lib/hooks.js';
import { dateFmt, dateTimeFmt, money, slotLabel } from '../../lib/format.js';
import './TrackRepair.css';

const FLOW = [['booked', 'Booked'], ['received', 'Received'], ['diagnosing', 'Diagnosing'], ['approved', 'Approved'], ['in_repair', 'Repairing'], ['ready', 'Ready'], ['completed', 'Completed']];

/** Track a repair by reference + phone: /repair/track */
export default function TrackRepair() {
  usePageTitle('Track a repair');
  const [sp] = useSearchParams();
  const [form, setForm] = useState({ reference: sp.get('ref') || '', phone: sp.get('phone') || '' });
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [acting, setActing] = useState('');

  const lookup = async (e) => {
    e?.preventDefault();
    setBusy(true);
    setError('');
    try {
      setBooking((await api.post('/repairs/track', { reference: form.reference.trim(), phone: form.phone.replace(/\D/g, '').slice(-10) })).booking);
    } catch (err) {
      setBooking(null);
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => { if (form.reference && form.phone.length >= 10) lookup(); }, []); // eslint-disable-line

  const act = async (path, body) => {
    setActing(body?.decision || 'cancel');
    try {
      setBooking((await api.post(path, { reference: form.reference.trim(), phone: form.phone.replace(/\D/g, '').slice(-10), ...body })).booking);
    } catch (err) {
      setError(err.message);
    } finally {
      setActing('');
    }
  };

  const idx = booking ? FLOW.findIndex(([k]) => k === (booking.status === 'awaiting_approval' ? 'diagnosing' : booking.status)) : -1;
  const ended = booking && ['cancelled', 'declined'].includes(booking.status);

  return (
    <div className="container pm-track">
      <h1 className="page-title">Track a repair</h1>
      <p className="text-muted mt-2">Enter your booking reference and the mobile number you used while booking.</p>
      <form onSubmit={lookup} className="pm-track__form row g-3 align-items-end">
        <Field label="Booking reference" className="col-12 col-sm">
          {(id) => <Input id={id} value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value.toUpperCase() })} placeholder="NR-XXXXXX" required className="pm-track__ref" />}
        </Field>
        <Field label="Mobile number" className="col-12 col-sm">
          {(id) => <Input id={id} inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="10-digit number" required />}
        </Field>
        <div className="col-12 col-sm-auto d-grid">
          <Button type="submit" size="lg" loading={busy}>Track</Button>
        </div>
      </form>
      {error && <Alert tone="error" className="mt-4">{error}</Alert>}

      {booking && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="pm-track__result">
          <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
            <div>
              <p className="small text-muted mb-0">{booking.reference}</p>
              <h2 className="h3 fw-semibold mb-1">{booking.deviceLabel}</h2>
              <p className="text-muted mb-0">{booking.services.map((s) => s.name).join(', ')}</p>
            </div>
            <StatusBadge status={booking.status} />
          </div>

          {!ended && (
            <ol className="pm-track__flow" aria-label="Repair progress">
              {FLOW.map(([k, l], i) => (
                <li key={k}>
                  <div className={cx('pm-track__bar', i <= idx && 'is-done')} />
                  <span className={cx('pm-track__step', i <= idx && 'is-done')}>{l}</span>
                </li>
              ))}
            </ol>
          )}

          {booking.status === 'awaiting_approval' && booking.quote && (
            <div className="pm-track__quote">
              <h3 className="h5 fw-semibold">Your quote is ready</h3>
              <p className="display-6 fw-semibold mb-0 mt-1">{money(booking.quote.amount)}</p>
              {booking.quote.notes && <p className="text-muted mt-2 mb-0">{booking.quote.notes}</p>}
              <p className="small text-muted mt-3 mb-0">We'll only start once you approve.</p>
              <div className="d-flex flex-wrap gap-2 mt-4">
                <Button onClick={() => act('/repairs/track/decision', { decision: 'approved' })} loading={acting === 'approved'}>Approve & start repair</Button>
                <Button variant="outline" onClick={() => window.confirm('Decline this quote? We will not proceed with the repair.') && act('/repairs/track/decision', { decision: 'declined' })} loading={acting === 'declined'}>Decline</Button>
              </div>
            </div>
          )}
          {booking.finalAmount != null && <p className="pm-track__final">Final amount: <strong>{money(booking.finalAmount)}</strong></p>}

          <dl className="pm-track__facts row g-3">
            <div className="col-12 col-sm-6"><dt className="text-muted fw-normal">Estimate</dt><dd className="fw-medium mb-0">{booking.estimate.min > 0 ? `${money(booking.estimate.min)} – ${money(booking.estimate.max)}` : 'After inspection'}</dd></div>
            <div className="col-12 col-sm-6"><dt className="text-muted fw-normal">Service</dt><dd className="fw-medium mb-0">{booking.method === 'store_visit' ? 'Store visit' : booking.method === 'pickup_drop' ? 'Pickup & drop' : 'Courier'}</dd></div>
            {booking.appointmentDate && <div className="col-12"><dt className="text-muted fw-normal">Appointment</dt><dd className="fw-medium mb-0">{dateFmt(booking.appointmentDate + 'T00:00:00')}, {slotLabel(booking.slot)}</dd></div>}
          </dl>

          <div>
            <h3 className="h6 fw-semibold mb-3">Updates</h3>
            <ol className="pm-track__timeline">
              {[...booking.timeline].reverse().map((t, i) => (
                <li key={i}>
                  <span className={cx('pm-track__dot', i === 0 && 'is-latest')} />
                  <p className="fw-medium mb-0">{t.status.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())}</p>
                  {t.note && <p className="small text-muted mb-0">{t.note}</p>}
                  <p className="small text-muted mb-0">{dateTimeFmt(t.at)}</p>
                </li>
              ))}
            </ol>
          </div>

          {booking.status === 'booked' && (
            <div><Button variant="outline" onClick={() => window.confirm('Cancel this booking?') && act('/repairs/track/cancel')} loading={acting === 'cancel'}>Cancel booking</Button></div>
          )}
        </motion.div>
      )}
    </div>
  );
}
