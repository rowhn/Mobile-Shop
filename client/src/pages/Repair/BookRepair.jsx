import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import Icon from '../../components/Icon.jsx';
import { Alert, Button, Field, Input, Skeleton, Textarea, cx } from '../../components/ui';
import { api } from '../../lib/api.js';
import { useAsync, usePageTitle } from '../../lib/hooks.js';
import { addDaysISO, dateFmt, money, slotLabel, todayISO } from '../../lib/format.js';
import { useAuth } from '../../context/Auth.jsx';
import { useConfig } from '../../context/Config.jsx';
import { methodIcon } from './repairShared.js';
import './BookRepair.css';

const STEPS = ['Device', 'Issue', 'Service', 'Details'];

/** 4-step repair booking wizard: /repair/book */
export default function BookRepair() {
  usePageTitle('Book a repair');
  const { user } = useAuth();
  const { repair } = useConfig();
  const [sp] = useSearchParams();
  const [step, setStep] = useState(0);
  const [brand, setBrand] = useState(sp.get('brand') || '');
  const [deviceQ, setDeviceQ] = useState('');
  const [device, setDevice] = useState(null); // full device incl. repairs
  const [picked, setPicked] = useState(() => (sp.get('service') ? [sp.get('service')] : []));
  const [notes, setNotes] = useState('');
  const [method, setMethod] = useState('');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [customer, setCustomer] = useState({ name: user?.name || '', phone: user?.phone || '', email: user?.email || '' });
  const [address, setAddress] = useState({ line1: '', line2: '', city: '', state: '', pincode: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState(null);

  const brands = useAsync(() => api.get('/repairs/brands'), []);
  const devices = useAsync((s) => (brand || deviceQ ? api.get('/repairs/devices', { brand, q: deviceQ }, s) : { items: [] }), [brand, deviceQ]);
  const services = useAsync(() => api.get('/repairs/services'), []);
  const slots = useAsync((s) => (date && method && method !== 'courier' ? api.get('/repairs/slots', { date }, s) : null), [date, method]);

  const methods = Object.entries(repair.methods || {}).filter(([, m]) => m.enabled);
  useEffect(() => { if (!method && methods.length) setMethod(methods[0][0]); }, [methods.length]); // eslint-disable-line
  useEffect(() => { if (user) setCustomer((c) => ({ name: c.name || user.name, phone: c.phone || user.phone || '', email: c.email || user.email })); }, [user]);

  const chooseDevice = async (d) => {
    try {
      const r = await api.get(`/repairs/devices/${d.slug}`);
      setDevice(r.device);
      setStep(1);
    } catch (err) { setError(err.message); }
  };

  const priceFor = (serviceId) => device?.repairs.find((r) => r.service.id === serviceId);
  const estimate = useMemo(() => {
    let min = 0, max = 0, complete = true;
    for (const id of picked) {
      const r = priceFor(id);
      if (r) { min += r.priceMin; max += r.priceMax; } else complete = false;
    }
    return { min, max, complete };
  }, [picked, device]); // eslint-disable-line

  const fee = method ? repair.methods?.[method]?.fee || 0 : 0;

  const validateStep = () => {
    const e = {};
    if (step === 1 && !picked.length) e.picked = 'Choose at least one issue';
    if (step === 2) {
      if (!method) e.method = 'Choose a service method';
      if (method !== 'courier') { if (!date) e.date = 'Choose a date'; else if (!slot) e.slot = 'Choose a time slot'; }
      if (method === 'pickup_drop') {
        if (!address.line1.trim()) e.line1 = 'Enter the pickup address';
        if (!address.city.trim()) e.city = 'Enter the city';
        if (!address.state.trim()) e.state = 'Enter the state';
        if (!/^[1-9]\d{5}$/.test(address.pincode.trim())) e.pincode = 'Enter a valid 6-digit PIN code';
      }
    }
    if (step === 3) {
      if (!customer.name.trim()) e.name = 'Enter your name';
      if (!/^[6-9]\d{9}$/.test(customer.phone.replace(/\D/g, '').slice(-10))) e.phone = 'Enter a valid 10-digit mobile number';
      if (customer.email && !/^\S+@\S+\.\S+$/.test(customer.email)) e.email = 'Enter a valid email';
    }
    setErrors(e);
    return !Object.keys(e).length;
  };
  const next = () => validateStep() && setStep((s) => s + 1);

  const submit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    setError('');
    try {
      const r = await api.post('/repairs/bookings', {
        deviceId: device.id,
        serviceIds: picked,
        issueNotes: notes,
        method,
        appointmentDate: method === 'courier' ? undefined : date,
        slot: method === 'courier' ? '' : slot,
        customer: { name: customer.name, phone: customer.phone.replace(/\D/g, '').slice(-10), email: customer.email || undefined },
        address: method === 'pickup_drop' ? address : undefined,
      });
      setBooking(r.booking);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message);
      if (err.status === 409) { setSlot(''); slots.reload(); setStep(2); }
    } finally { setSubmitting(false); }
  };

  /* ---------- confirmation ---------- */
  if (booking) {
    return (
      <div className="container pm-book pm-book--done">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="pm-book__tick"><Icon name="check" size={32} strokeWidth={2.5} /></motion.div>
        <h1 className="page-title">Booking received</h1>
        <p className="text-muted mt-2">Keep this reference to track your repair.</p>
        <div className="pm-book__ref">
          <p className="pm-book__ref-label">Booking reference</p>
          <p className="pm-book__ref-code">{booking.reference}</p>
        </div>
        <div className="pm-book__receipt">
          <p className="fw-semibold mb-0">{booking.deviceLabel}</p>
          <p className="text-muted mb-0">{booking.services.map((s) => s.name).join(', ')}</p>
          {booking.appointmentDate && <p className="d-flex align-items-center gap-2 mt-3 mb-0"><Icon name="clock" size={16} />{dateFmt(booking.appointmentDate + 'T00:00:00')}, {slotLabel(booking.slot)}</p>}
          <p className="text-muted mt-2 mb-0">Estimate: {booking.estimate.min > 0 ? `${money(booking.estimate.min)} – ${money(booking.estimate.max)}` : 'to be confirmed after inspection'}{!booking.estimate.complete && booking.estimate.min > 0 && ' (plus items we need to inspect)'}</p>
        </div>
        {booking.method === 'courier' && <Alert tone="info" className="mx-auto mt-4 text-start pm-book__narrow">Our team will contact you on {customer.phone} with the address to send your phone to.</Alert>}
        <div className="d-flex flex-wrap justify-content-center gap-3 mt-4">
          <Button to={`/repair/track?ref=${booking.reference}&phone=${customer.phone.replace(/\D/g, '').slice(-10)}`}>Track this repair</Button>
          <Button to="/" variant="secondary">Back to store</Button>
        </div>
      </div>
    );
  }

  const dates = Array.from({ length: Math.min(14, repair.advanceDays || 14) }, (_, i) => addDaysISO(todayISO(), i));

  return (
    <div className="container pm-book">
      <h1 className="page-title">Book a repair</h1>
      <ol className="pm-book__progress" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s}>
            <div className={cx('pm-book__bar', i <= step && 'is-done')} />
            <span className={cx('pm-book__bar-label', i === step && 'is-current')}>{i + 1}. {s}</span>
          </li>
        ))}
      </ol>
      {error && <Alert tone="error" className="mb-4">{error}</Alert>}

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}>
          {step === 0 && (
            <section>
              <h2 className="pm-book__h">Which phone needs repair?</h2>
              <div className="d-flex flex-wrap gap-2 mb-4" role="group" aria-label="Brand">
                {brands.data?.items.map((b) => (
                  <button type="button" key={b.brand} onClick={() => { setBrand(b.brand === brand ? '' : b.brand); setDeviceQ(''); }} className={cx('pm-book__chip', brand === b.brand && 'is-on')}>{b.brand}</button>
                ))}
                {brands.loading && [0, 1, 2, 3].map((i) => <Skeleton key={i} style={{ height: 38, width: 96, borderRadius: 50 }} />)}
              </div>
              <Input value={deviceQ} onChange={(e) => setDeviceQ(e.target.value)} placeholder="Search your model, e.g. iPhone 13" aria-label="Search your phone model" className="mb-4" />
              {devices.loading ? (
                <div className="row g-3">{[0, 1, 2, 3].map((i) => <div key={i} className="col-12 col-sm-6"><Skeleton style={{ height: 64 }} /></div>)}</div>
              ) : !brand && !deviceQ ? (
                <p className="text-muted">Choose a brand or search for your model.</p>
              ) : devices.data.items.length === 0 ? (
                <Alert tone="info">We don't have that model listed. Please <Link to="/contact" className="fw-medium text-decoration-underline">contact us</Link> and we'll help.</Alert>
              ) : (
                <div className="row g-3">
                  {devices.data.items.map((d) => (
                    <div key={d.id} className="col-12 col-sm-6">
                      <button type="button" onClick={() => chooseDevice(d)} className="pm-book__opt pm-book__opt--row">
                        <Icon name="phone" size={24} className="text-muted flex-shrink-0" />
                        <span><span className="d-block small text-muted">{d.brand}</span><span className="fw-medium">{d.model}</span></span>
                        <Icon name="chevronRight" size={20} className="text-muted ms-auto flex-shrink-0" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {step === 1 && device && (
            <section>
              <h2 className="pm-book__h mb-1">What's wrong with your {device.brand} {device.model}?</h2>
              <button type="button" onClick={() => setStep(0)} className="pm-book__link">Change device</button>
              {errors.picked && <p className="pm-book__err" role="alert">{errors.picked}</p>}
              <div className="row g-3 mt-1">
                {services.data?.items.map((s) => {
                  const r = priceFor(s.id);
                  const on = picked.includes(s.id);
                  return (
                    <div key={s.id} className="col-12 col-sm-6">
                      <button type="button" aria-pressed={on} onClick={() => setPicked(on ? picked.filter((x) => x !== s.id) : [...picked, s.id])} className={cx('pm-book__opt pm-book__opt--row align-items-start', on && 'is-on')}>
                        <Icon name={s.icon} size={24} strokeWidth={1.4} className="flex-shrink-0 mt-1" />
                        <span className="flex-grow-1">
                          <span className="d-block fw-medium">{s.name}</span>
                          <span className="d-block small text-muted">{s.description}</span>
                          <span className="d-block small fw-medium mt-1">{r ? `${money(r.priceMin)}${r.priceMax !== r.priceMin ? ` – ${money(r.priceMax)}` : ''}` : 'Quote after inspection'}</span>
                        </span>
                        <span className={cx('pm-book__check', on && 'is-on')}>{on && <Icon name="check" size={12} strokeWidth={3} />}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
              <Field label="Anything else we should know? (optional)" className="mt-4">
                {(id) => <Textarea id={id} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} placeholder="e.g. dropped in water yesterday, touch not working on the top half" />}
              </Field>
            </section>
          )}

          {step === 2 && (
            <section>
              <h2 className="pm-book__h">How would you like to get it fixed?</h2>
              {errors.method && <p className="pm-book__err">{errors.method}</p>}
              <div className="row g-3" role="radiogroup" aria-label="Service method">
                {methods.map(([k, m]) => (
                  <div key={k} className="col-12 col-md-4">
                    <button type="button" role="radio" aria-checked={method === k} onClick={() => { setMethod(k); setSlot(''); }} className={cx('pm-book__opt', method === k && 'is-on')}>
                      <Icon name={methodIcon(k)} size={24} strokeWidth={1.4} />
                      <span className="d-block fw-medium mt-2">{m.label}</span>
                      <span className="d-block small text-muted mt-1">{m.description}</span>
                      <span className="d-block small fw-medium mt-2">{m.fee > 0 ? `+ ${money(m.fee)}` : 'Free'}</span>
                    </button>
                  </div>
                ))}
              </div>

              {method && method !== 'courier' && (
                <div className="mt-4">
                  <h3 className="h6 fw-semibold mb-3">Choose a date</h3>
                  {errors.date && <p className="pm-book__err">{errors.date}</p>}
                  <div className="pm-book__dates hide-scrollbar" role="radiogroup" aria-label="Date">
                    {dates.map((d) => {
                      const dt = new Date(d + 'T00:00:00');
                      const closed = (repair.weeklyOff || []).includes(dt.getDay());
                      return (
                        <button type="button" key={d} role="radio" aria-checked={date === d} disabled={closed} title={closed ? 'Closed' : undefined} onClick={() => { setDate(d); setSlot(''); }} className={cx('pm-book__date', date === d && 'is-on')}>
                          <span className="d-block small opacity-75">{dt.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                          <span className="d-block fs-5 fw-semibold">{dt.getDate()}</span>
                          <span className="d-block small opacity-75">{dt.toLocaleDateString('en-IN', { month: 'short' })}</span>
                        </button>
                      );
                    })}
                  </div>
                  {date && (
                    <div className="mt-4">
                      <h3 className="h6 fw-semibold mb-3">Choose a time</h3>
                      {errors.slot && <p className="pm-book__err">{errors.slot}</p>}
                      {slots.loading ? (
                        <Skeleton style={{ height: 48 }} />
                      ) : !slots.data?.open ? (
                        <Alert tone="warn">{slots.data?.reason === 'closed' ? 'We are closed on this day.' : 'That date is not available.'} Please pick another date.</Alert>
                      ) : slots.data.slots.length === 0 ? (
                        <Alert tone="warn">No more slots today. Please choose another date.</Alert>
                      ) : (
                        <div className="row g-2" role="radiogroup" aria-label="Time slot">
                          {slots.data.slots.map((s) => (
                            <div key={s.slot} className="col-12 col-sm-6">
                              <button type="button" role="radio" aria-checked={slot === s.slot} disabled={s.remaining === 0} onClick={() => setSlot(s.slot)} className={cx('pm-book__slot', slot === s.slot && 'is-on')}>
                                <span className="fw-medium">{slotLabel(s.slot)}</span>
                                <span className="text-muted">{s.remaining === 0 ? 'Full' : s.remaining <= 1 ? 'Last slot' : `${s.remaining} left`}</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {method === 'pickup_drop' && (
                <div className="row g-3 mt-3">
                  <h3 className="h6 fw-semibold col-12 mb-0">Pickup address</h3>
                  <Field label="Address line 1" error={errors.line1} className="col-12">{(id) => <Input id={id} value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} autoComplete="address-line1" />}</Field>
                  <Field label="Address line 2 (optional)" className="col-12">{(id) => <Input id={id} value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })} autoComplete="address-line2" />}</Field>
                  <Field label="City" error={errors.city} className="col-12 col-sm-6">{(id) => <Input id={id} value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} autoComplete="address-level2" />}</Field>
                  <Field label="State" error={errors.state} className="col-12 col-sm-6">{(id) => <Input id={id} value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} autoComplete="address-level1" />}</Field>
                  <Field label="PIN code" error={errors.pincode} className="col-12 col-sm-6">{(id) => <Input id={id} value={address.pincode} maxLength={6} inputMode="numeric" onChange={(e) => setAddress({ ...address, pincode: e.target.value })} autoComplete="postal-code" />}</Field>
                </div>
              )}
              {method === 'courier' && <Alert tone="info" className="mt-4">After you book, our team will contact you with the address to send your phone to.</Alert>}
            </section>
          )}

          {step === 3 && (
            <section>
              <h2 className="pm-book__h">Your details</h2>
              <div className="row g-3">
                <Field label="Full name" error={errors.name} className="col-12 col-sm-6">{(id) => <Input id={id} value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} autoComplete="name" />}</Field>
                <Field label="Mobile number" error={errors.phone} hint="You'll use this with your reference to track the repair." className="col-12 col-sm-6">{(id) => <Input id={id} inputMode="tel" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} autoComplete="tel" />}</Field>
                <Field label="Email (optional)" error={errors.email} className="col-12">{(id) => <Input id={id} type="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} autoComplete="email" />}</Field>
              </div>
              <div className="pm-book__summary">
                <h3 className="h6 fw-semibold">Summary</h3>
                <p className="mt-2 mb-0">{device.brand} {device.model}</p>
                <ul className="text-muted mb-0 mt-1 ps-4">{picked.map((id) => <li key={id}>{services.data.items.find((s) => s.id === id)?.name}</li>)}</ul>
                <p className="mt-3 mb-0">{repair.methods?.[method]?.label}{date && method !== 'courier' && <> · {dateFmt(date + 'T00:00:00')}, {slotLabel(slot)}</>}</p>
              </div>
            </section>
          )}
        </motion.div>
      </AnimatePresence>

      {step > 0 && (
        <div className="pm-book__bottom">
          <div>
            <p className="small text-muted mb-0">Estimated repair cost</p>
            <p className="h5 fw-semibold mb-0">
              {estimate.min > 0 ? `${money(estimate.min)}${estimate.max !== estimate.min ? ` – ${money(estimate.max)}` : ''}` : picked.length ? 'After inspection' : '—'}
              {fee > 0 && step >= 2 && <span className="ms-2 small fw-normal text-muted">+ {money(fee)} {method === 'pickup_drop' ? 'pickup' : 'service'}</span>}
            </p>
            {estimate.min > 0 && !estimate.complete && <p className="small text-muted mb-0">Some items are quoted after inspection.</p>}
          </div>
          <div className="d-flex gap-2">
            <Button variant="secondary" onClick={() => setStep(step - 1)}>Back</Button>
            {step < 3 ? <Button onClick={next}>Continue</Button> : <Button onClick={submit} loading={submitting}>Confirm booking</Button>}
          </div>
        </div>
      )}
    </div>
  );
}
