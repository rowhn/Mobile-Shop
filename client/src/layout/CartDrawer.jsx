import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
import Icon from '../components/Icon.jsx';
import QtyStepper from '../components/QtyStepper.jsx';
import { ProductImage } from '../components/ProductCard.jsx';
import { Button } from '../components/ui';
import { useCart } from '../context/Cart.jsx';
import { useConfig } from '../context/Config.jsx';
import { money } from '../lib/format.js';
import './CartDrawer.css';

/** Shopping bag pop-up. It opens in the centre of the screen (full-width sheet on small phones). */
export default function CartDrawer() {
  const cart = useCart();
  const config = useConfig();
  const { pathname } = useLocation();
  useEffect(() => cart.setOpen(false), [pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  const q = cart.quote;
  const free = config.shipping.freeAbove;
  const toFree = q ? Math.max(0, free - (q.subtotal - q.discount)) : free;
  const close = () => cart.setOpen(false);

  return (
    <Modal show={cart.open} onHide={close} centered scrollable className="pm-cart" aria-label="Shopping cart">
      <Modal.Header closeButton>
        <Modal.Title as="h2" className="h5 fw-semibold mb-0">
          Your bag {cart.count > 0 && <span className="text-muted">({cart.count})</span>}
        </Modal.Title>
      </Modal.Header>
      {cart.items.length === 0 ? (
        <Modal.Body className="pm-cart__empty">
          <Icon name="bag" size={44} strokeWidth={1.2} className="text-muted" />
          <p className="fs-5 fw-medium mb-0">Your bag is empty</p>
          <Button to="/shop" onClick={close}>Continue shopping</Button>
        </Modal.Body>
      ) : (
        <>
          <Modal.Body className="pt-0">
            {q && toFree > 0 && (
              <p className="pm-cart__free">
                Add <strong>{money(toFree)}</strong> more for free shipping.
              </p>
            )}
            <ul className="pm-cart__list">
              {(q?.lines || []).map((l) => (
                <li key={`${l.productId}:${l.sku}`} className="pm-cart__line">
                  <Link to={`/product/${l.slug}`} className="pm-cart__thumb">
                    <ProductImage product={{ name: l.name, images: l.image ? [{ url: l.image }] : [] }} className="w-100 h-100" />
                  </Link>
                  <div className="flex-grow-1 min-w-0">
                    <Link to={`/product/${l.slug}`} className="pm-cart__name">{l.name}</Link>
                    {l.variantLabel && <p className="small text-muted mb-0">{l.variantLabel}</p>}
                    {!l.available && <p className="small fw-medium text-danger mb-0">Unavailable</p>}
                    <p className="pm-cart__price">{money(l.lineTotal)}</p>
                    <div className="d-flex align-items-center justify-content-between">
                      <QtyStepper value={l.qty} max={Math.min(10, l.stock || 10)} onChange={(n) => cart.setQty(l.productId, l.sku, n)} compact />
                      <button type="button" className="pm-cart__remove" aria-label={`Remove ${l.name}`} onClick={() => cart.remove(l.productId, l.sku)}>
                        <Icon name="trash" size={18} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
              {!q && cart.items.map((i) => <li key={`${i.productId}:${i.sku}`} className="skeleton my-3" style={{ height: 96 }} />)}
            </ul>
          </Modal.Body>
          <div className="pm-cart__footer">
            <div className="d-flex justify-content-between mb-3">
              <span className="text-muted">Subtotal</span>
              <span className="fw-bold fs-5">{q ? money(q.subtotal) : '…'}</span>
            </div>
            <Button to="/cart" size="lg" className="w-100" onClick={close}>Review bag & checkout</Button>
          </div>
        </>
      )}
    </Modal>
  );
}
