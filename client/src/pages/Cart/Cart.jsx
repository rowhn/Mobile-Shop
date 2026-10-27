import { Link } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { ProductImage } from '../../components/ProductCard.jsx';
import QtyStepper from '../../components/QtyStepper.jsx';
import { Alert, Button, EmptyState, Skeleton } from '../../components/ui';
import OrderSummary from './OrderSummary.jsx';
import CouponBox from './CouponBox.jsx';
import { useCart } from '../../context/Cart.jsx';
import { money } from '../../lib/format.js';
import { usePageTitle } from '../../lib/hooks.js';
import './Cart.css';

export default function Cart() {
  usePageTitle('Bag');
  const cart = useCart();
  const q = cart.quote;
  const blocked = Boolean(q?.issues?.length);

  if (!cart.items.length) {
    return <div className="container"><EmptyState icon="bag" title="Your bag is empty" text="Add something you love and it will show up here." action={<Button to="/shop">Start shopping</Button>} /></div>;
  }

  return (
    <div className="container page-section">
      <h1 className="page-title mb-4 mb-lg-5">Your bag</h1>
      <div className="row g-4 g-lg-5">
        <div className="col-12 col-lg-8">
          {q?.issues.length > 0 && (
            <Alert tone="warn" className="mb-4">
              <p className="fw-medium mb-0">Please review these items before checking out:</p>
              <ul className="mt-1 mb-0 ps-3">{q.issues.map((i, n) => <li key={n}>{i.message}</li>)}</ul>
            </Alert>
          )}
          {cart.quoteError && <Alert tone="error" className="mb-4">{cart.quoteError.message}</Alert>}
          <ul className="pm-cart-page__list">
            {q ? q.lines.map((l) => (
              <li key={`${l.productId}:${l.sku}`} className="pm-cart-page__line">
                <Link to={`/product/${l.slug}`} className="pm-cart-page__thumb">
                  <ProductImage product={{ name: l.name, images: l.image ? [{ url: l.image }] : [] }} className="w-100 h-100" />
                </Link>
                <div className="pm-cart-page__info">
                  <div className="d-flex justify-content-between gap-3">
                    <div className="min-w-0">
                      <p className="pm-cart-page__brand">{l.brand}</p>
                      <Link to={`/product/${l.slug}`} className="pm-cart-page__name">{l.name}</Link>
                      {l.variantLabel && <p className="small text-muted mb-0">{l.variantLabel}</p>}
                    </div>
                    <p className="fw-semibold mb-0">{money(l.lineTotal)}</p>
                  </div>
                  {!l.available && <p className="small fw-medium text-danger mt-1 mb-0">{l.stock > 0 ? `Only ${l.stock} available` : 'Out of stock'}</p>}
                  <div className="pm-cart-page__actions">
                    <QtyStepper value={l.qty} max={Math.min(10, l.stock || 10)} onChange={(n) => cart.setQty(l.productId, l.sku, n)} compact />
                    <div className="d-flex align-items-center gap-3 small">
                      {l.mrp > l.unitPrice && <span className="text-muted text-decoration-line-through">{money(l.mrp * l.qty)}</span>}
                      <button type="button" onClick={() => cart.remove(l.productId, l.sku)} className="pm-cart-page__remove" aria-label={`Remove ${l.name}`}><Icon name="trash" size={16} />Remove</button>
                    </div>
                  </div>
                </div>
              </li>
            )) : cart.items.map((i) => <li key={`${i.productId}:${i.sku}`} className="py-4"><Skeleton style={{ height: 112 }} /></li>)}
            {q && q.lines.length === 0 && <li className="py-5 text-center text-muted">None of the items in your bag are available any more.</li>}
          </ul>
        </div>
        <div className="col-12 col-lg-4">
          <OrderSummary quote={q} className="pm-summary--sticky">
            <CouponBox />
            <Button to="/checkout" size="lg" className="w-100 mt-4" disabled={!q || blocked || q.lines.length === 0} aria-disabled={blocked}>Checkout</Button>
            {blocked && <p className="mt-2 text-center small text-muted mb-0">Fix the items above to continue.</p>}
          </OrderSummary>
        </div>
      </div>
    </div>
  );
}
