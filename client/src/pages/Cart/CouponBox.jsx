import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import { Button, Input } from '../../components/ui';
import { useCart } from '../../context/Cart.jsx';
import './CouponBox.css';

/** Coupon entry / applied-coupon chip (Cart + Checkout). */
export default function CouponBox() {
  const cart = useCart();
  const [code, setCode] = useState('');
  const q = cart.quote;
  if (q?.coupon) {
    return (
      <div className="pm-coupon pm-coupon--applied">
        <span className="d-flex align-items-center gap-2"><Icon name="tag" size={16} className="text-success" /><strong>{q.coupon.code}</strong> applied</span>
        <button type="button" className="pm-coupon__remove" onClick={cart.removeCoupon}>Remove</button>
      </div>
    );
  }
  return (
    <form className="pm-coupon" onSubmit={(e) => { e.preventDefault(); if (code.trim()) { cart.applyCoupon(code); setCode(''); } }}>
      <label htmlFor="coupon" className="form-label fw-medium small mb-1">Coupon code</label>
      <div className="d-flex gap-2">
        <Input id="coupon" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Enter code" />
        <Button type="submit" variant="dark" disabled={!code.trim()}>Apply</Button>
      </div>
      {q?.couponError && <p className="pm-field-error mb-0" role="alert">{q.couponError}</p>}
    </form>
  );
}
