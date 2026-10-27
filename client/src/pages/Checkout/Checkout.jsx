import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { Alert, Button, Field, Input, Select, Textarea, cx } from '../../components/ui';
import OrderSummary from '../Cart/OrderSummary.jsx';
import CouponBox from '../Cart/CouponBox.jsx';
import { api } from '../../lib/api.js';
import { payWithRazorpay } from '../../lib/payment.js';
import { usePageTitle } from '../../lib/hooks.js';
import { useAuth } from '../../context/Auth.jsx';
import { useCart } from '../../context/Cart.jsx';
import { useConfig } from '../../context/Config.jsx';
import { useToast } from '../../context/Toast.jsx';
import './Checkout.css';

const EMPTY = { name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '' };
const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu and Kashmir','Ladakh','Chandigarh','Puducherry','Andaman and Nicobar Islands','Dadra and Nagar Haveli and Daman and Diu','Lakshadweep'];

export default function Checkout() {
  usePageTitle('Checkout');
  const { user, loading: authLoading, setUser } = useAuth();
  const cart = useCart();
  const { payments } = useConfig();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [addr, setAddr] = useState(EMPTY);
  const [pickedId, setPickedId] = useState(null);
  const [saveAddr, setSaveAddr] = useState(false);
  const [notes, setNotes] = useState('');
  const [method, setMethod] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const placed = useRef(false);

  const saved = user?.addresses || [];
  useEffect(() => {
    if (!user) return;
    const def = saved.find((a) => a.isDefault) || saved[0];
    if (def) pick(def);
    else setAddr((a) => ({ ...a, name: user.name || '', phone: user.phone || '' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);
  useEffect(() => {
    if (!method) setMethod(payments.razorpay ? 'razorpay' : payments.cod ? 'cod' : '');
  }, [payments, method]);

  function pick(a) {
    setPickedId(a.id);
    setAddr({ name: a.name, phone: a.phone, line1: a.line1, line2: a.line2 || '', city: a.city, state: a.state, pincode: a.pincode });
    setSaveAddr(false);
  }
  const set = (k) => (e) => {
    setAddr((a) => ({ ...a, [k]: e.target.value }));
    setPickedId(null);
    setErrors((x) => ({ ...x, [k]: undefined }));
  };

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" state={{ from: '/checkout' }} replace />;
  if (!cart.items.length && !placed.current) return <Navigate to="/cart" replace />;

  const validate = () => {
    const e = {};
    if (!addr.name.trim()) e.name = 'Enter the recipient name';
    if (!/^[6-9]\d{9}$/.test(addr.phone.replace(/\D/g, '').slice(-10))) e.phone = 'Enter a valid 10-digit mobile number';
    if (!addr.line1.trim()) e.line1 = 'Enter your address';
    if (!addr.city.trim()) e.city = 'Enter your city';
    if (!addr.state) e.state = 'Choose a state';
    if (!/^[1-9]\d{5}$/.test(addr.pincode.trim())) e.pincode = 'Enter a valid 6-digit PIN code';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const q = cart.quote;
  const blocked = !q || q.issues.length > 0 || q.lines.length === 0;
  const noPayments = !payments.razorpay && !payments.cod;

  const placeOrder = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) {
      document.querySelector('[role="alert"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    setSubmitting(true);
    try {
      // The server re-prices the cart, reserves stock and applies the coupon; we only send ids, SKUs and quantities.
      const res = await api.post('/orders', {
        items: cart.items.map(({ productId, sku, qty }) => ({ productId, sku: sku || '', qty })),
        couponCode: cart.couponCode || undefined,
        paymentMethod: method,
        shippingAddress: { ...addr, phone: addr.phone.replace(/\D/g, '').slice(-10), pincode: addr.pincode.trim() },
        notes,
      });

      if (saveAddr && !pickedId) {
        api.patch('/auth/me', { addresses: [...saved, { ...addr, phone: addr.phone.replace(/\D/g, '').slice(-10), label: 'Home', isDefault: saved.length === 0 }] })
          .then((r) => setUser(r.user)).catch(() => {});
      }

      placed.current = true; // stops the "empty bag" redirect while the payment window is open
      cart.clear(); // the order now exists (and holds the stock), so the cart is done

      if (method === 'cod') {
        navigate(`/orders/${res.order.id}?placed=1`, { replace: true });
        return;
      }
      const result = await payWithRazorpay(res);
      if (result.status === 'paid') {
        navigate(`/orders/${res.order.id}?placed=1`, { replace: true });
      } else {
        if (result.status === 'failed') toast.error(result.message);
        else toast.show('Payment not completed. You can pay from your order page.');
        navigate(`/orders/${res.order.id}`, { replace: true });
      }
    } catch (err) {
      setError(err.message);
      cart.refresh();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container page-section">
      <h1 className="page-title mb-4 mb-lg-5">Checkout</h1>
      {error && <Alert tone="error" className="mb-4">{error}</Alert>}
      <form onSubmit={placeOrder} noValidate className="row g-4 g-lg-5">
        <div className="col-12 col-lg-8 d-grid gap-5 align-content-start">
          <section aria-labelledby="ship-h">
            <h2 id="ship-h" className="h5 fw-semibold mb-3">Delivery address</h2>
            {saved.length > 0 && (
              <div className="row g-3 mb-4">
                {saved.map((a) => (
                  <div className="col-12 col-sm-6" key={a.id}>
                    <button type="button" onClick={() => pick(a)} className={cx('pm-checkout__choice w-100', pickedId === a.id && 'is-selected')}>
                      <p className="fw-semibold mb-0">{a.name} <span className="fw-normal text-muted">· {a.label}</span></p>
                      <p className="text-muted mt-1 mb-0">{a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} {a.pincode}</p>
                      <p className="text-muted mb-0">{a.phone}</p>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="row g-3">
              <Field className="col-12 col-sm-6" label="Full name" error={errors.name}>{(id) => <Input id={id} value={addr.name} onChange={set('name')} autoComplete="name" />}</Field>
              <Field className="col-12 col-sm-6" label="Mobile number" error={errors.phone}>{(id) => <Input id={id} value={addr.phone} onChange={set('phone')} inputMode="tel" autoComplete="tel" placeholder="10-digit number" />}</Field>
              <Field className="col-12" label="Address line 1" error={errors.line1}>{(id) => <Input id={id} value={addr.line1} onChange={set('line1')} autoComplete="address-line1" placeholder="House / flat, street" />}</Field>
              <Field className="col-12" label="Address line 2 (optional)">{(id) => <Input id={id} value={addr.line2} onChange={set('line2')} autoComplete="address-line2" placeholder="Landmark, area" />}</Field>
              <Field className="col-12 col-sm-6" label="City" error={errors.city}>{(id) => <Input id={id} value={addr.city} onChange={set('city')} autoComplete="address-level2" />}</Field>
              <Field className="col-12 col-sm-6" label="State" error={errors.state}>
                {(id) => (
                  <Select id={id} value={addr.state} onChange={set('state')} autoComplete="address-level1">
                    <option value="">Select state</option>
                    {STATES.map((s) => <option key={s}>{s}</option>)}
                  </Select>
                )}
              </Field>
              <Field className="col-12 col-sm-6" label="PIN code" error={errors.pincode}>{(id) => <Input id={id} value={addr.pincode} onChange={set('pincode')} inputMode="numeric" maxLength={6} autoComplete="postal-code" />}</Field>
            </div>
            {!pickedId && (
              <label className="d-flex align-items-center gap-2 mt-3 small pm-checkout__check">
                <input type="checkbox" className="form-check-input mt-0" checked={saveAddr} onChange={(e) => setSaveAddr(e.target.checked)} />Save this address to my account
              </label>
            )}
          </section>

          <section aria-labelledby="pay-h">
            <h2 id="pay-h" className="h5 fw-semibold mb-3">Payment</h2>
            {noPayments ? (
              <Alert tone="warn">No payment method is enabled on this store yet. The store owner needs to configure Razorpay or enable cash on delivery. See the setup guide.</Alert>
            ) : (
              <div className="d-grid gap-3" role="radiogroup" aria-label="Payment method">
                {payments.razorpay && (
                  <label className={cx('pm-checkout__choice pm-checkout__pay', method === 'razorpay' && 'is-selected')}>
                    <input type="radio" name="pay" className="form-check-input mt-1" checked={method === 'razorpay'} onChange={() => setMethod('razorpay')} />
                    <span><span className="d-block fw-medium">UPI, cards, net banking, wallets</span><span className="small text-muted">Secure payment by Razorpay. You'll be asked to pay after you place the order.</span></span>
                  </label>
                )}
                {payments.cod && (
                  <label className={cx('pm-checkout__choice pm-checkout__pay', method === 'cod' && 'is-selected')}>
                    <input type="radio" name="pay" className="form-check-input mt-1" checked={method === 'cod'} onChange={() => setMethod('cod')} />
                    <span><span className="d-block fw-medium">Cash on delivery</span><span className="small text-muted">Pay in cash when your order arrives.</span></span>
                  </label>
                )}
              </div>
            )}
          </section>

          <Field label="Order notes (optional)">{(id) => <Textarea id={id} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} placeholder="Delivery instructions" />}</Field>
        </div>

        <div className="col-12 col-lg-4">
          <OrderSummary quote={q} className="pm-summary--sticky">
            {q?.issues.length > 0 && <Alert tone="warn" className="mt-3">{q.issues[0].message} <a href="/cart" className="fw-medium text-decoration-underline">Review bag</a></Alert>}
            <CouponBox />
            <Button type="submit" size="lg" className="w-100 mt-4" loading={submitting} disabled={blocked || noPayments || !method}>
              {method === 'razorpay' ? 'Place order & pay' : 'Place order'}
            </Button>
            <p className="mt-3 mb-0 d-flex align-items-center justify-content-center gap-1 small text-muted"><Icon name="shield" size={14} />Prices are confirmed securely on our server.</p>
          </OrderSummary>
        </div>
      </form>
    </div>
  );
}
