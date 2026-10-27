import { Skeleton } from '../../components/ui';
import { useConfig } from '../../context/Config.jsx';
import { money } from '../../lib/format.js';
import './OrderSummary.css';

/** Totals box shared by the Cart and Checkout pages. Children (coupon, buttons) render underneath. */
export default function OrderSummary({ quote, children, className = '' }) {
  const { shipping } = useConfig();
  return (
    <aside className={`pm-summary ${className}`} aria-label="Order summary">
      <h2 className="h5 fw-semibold mb-4">Order summary</h2>
      {!quote ? (
        <div className="d-grid gap-3">
          <Skeleton style={{ height: 20 }} />
          <Skeleton style={{ height: 20 }} />
          <Skeleton style={{ height: 32 }} />
        </div>
      ) : (
        <dl className="pm-summary__list">
          <div className="pm-summary__row"><dt className="text-muted fw-normal">Subtotal</dt><dd>{money(quote.subtotal)}</dd></div>
          {quote.discount > 0 && (
            <div className="pm-summary__row text-success"><dt className="fw-normal">Discount ({quote.coupon?.code})</dt><dd>− {money(quote.discount)}</dd></div>
          )}
          <div className="pm-summary__row"><dt className="text-muted fw-normal">Shipping</dt><dd>{quote.shipping === 0 ? 'Free' : money(quote.shipping)}</dd></div>
          {quote.shipping > 0 && <p className="small text-muted mb-0">Free shipping on orders above {money(shipping.freeAbove)}.</p>}
          <div className="pm-summary__row pm-summary__total"><dt>Total</dt><dd>{money(quote.total)}</dd></div>
        </dl>
      )}
      {children}
    </aside>
  );
}
