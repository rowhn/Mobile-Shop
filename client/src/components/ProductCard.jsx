import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import { Badge, Button, Skeleton, cx } from './ui';
import { money } from '../lib/format.js';
import { useWishlist } from '../context/Wishlist.jsx';
import { useCart } from '../context/Cart.jsx';
import { useToast } from '../context/Toast.jsx';
import './ProductCard.css';

const ICON_BY_CAT = { smartphones: 'phone', laptops: 'laptop', tablets: 'tablet', audio: 'headphones', wearables: 'watch', accessories: 'plug' };

/** Shows the product photo; before one is uploaded it shows a clean placeholder instead of a broken image.
 *  The parent decides the size (give it a width/height or put it in a Bootstrap `ratio`). */
export function ProductImage({ product, className, index = 0, fit = 'contain' }) {
  const url = product.images?.[index]?.url;
  const [failed, setFailed] = useState(false);
  if (!url || failed) {
    return (
      <div className={cx('pm-img pm-img--placeholder', className)} aria-hidden="true">
        <Icon name={ICON_BY_CAT[product.category?.slug] || 'box'} size={40} strokeWidth={1.2} />
      </div>
    );
  }
  return <img src={url} alt={product.name} loading="lazy" onError={() => setFailed(true)} className={cx('pm-img', `pm-img--${fit}`, className)} />;
}

export function ProductCardSkeleton() {
  return (
    <div>
      <div className="ratio ratio-1x1"><Skeleton style={{ borderRadius: '1.5rem' }} /></div>
      <Skeleton className="mt-3" style={{ height: 16, width: '75%' }} />
      <Skeleton className="mt-2" style={{ height: 16, width: '35%' }} />
    </div>
  );
}

function ProductCard({ product: p }) {
  const wishlist = useWishlist();
  const cart = useCart();
  const toast = useToast();
  const wished = wishlist.has(p.id);
  const off = p.discountPercent > 0 ? p.discountPercent : 0;
  const outOfStock = !p.inStock;
  // Products with several options (colour / storage) must be configured on the product page.
  const needsChoice = (p.variants?.length || 0) > 1;
  const onlyVariant = p.variants?.length === 1 ? p.variants[0] : null;

  const add = () => {
    cart.add(p.id, onlyVariant?.sku || '', 1);
    toast.success(`${p.name} added to your bag`);
  };

  return (
    <article className="pm-card">
      <div className="pm-card__media">
        <Link to={`/product/${p.slug}`} className="pm-card__imglink" aria-hidden="true" tabIndex={-1}>
          <ProductImage product={p} className="pm-card__img" />
        </Link>
        <div className="pm-card__badges">
          {p.isNewArrival && <Badge tone="blue">New</Badge>}
          {off > 0 && <Badge tone="red">{off}% off</Badge>}
          {outOfStock && <Badge tone="gray">Sold out</Badge>}
          {p.lowStock && !outOfStock && <Badge tone="amber">Only {p.totalStock} left</Badge>}
        </div>
        <button
          type="button"
          onClick={() => wishlist.toggle(p.id)}
          aria-pressed={wished}
          aria-label={wished ? `Remove ${p.name} from wishlist` : `Add ${p.name} to wishlist`}
          className={cx('pm-card__heart', wished && 'is-wished')}
        >
          <Icon name="heart" size={18} />
        </button>
      </div>
      <div className="pm-card__body">
        <Link to={`/product/${p.slug}`} className="pm-card__link" aria-label={p.name}>
          <h3 className="pm-card__name line-clamp-2">{p.name}</h3>
          <p className="pm-card__brand">{p.brand}</p>
          {p.shortDescription && <p className="pm-card__desc line-clamp-2">{p.shortDescription}</p>}
          <p className="pm-card__price">
            <span className="pm-card__now">
              {p.priceVaries && <span className="pm-card__from">From </span>}
              {money(p.finalPrice)}
            </span>
            {p.listMrp > p.finalPrice && <span className="pm-card__mrp">{money(p.listMrp)}</span>}
          </p>
        </Link>
        <div className="pm-card__actions">
          {outOfStock ? (
            <Button to={`/product/${p.slug}`} variant="secondary" size="sm" className="flex-grow-1">View details</Button>
          ) : needsChoice ? (
            <Button to={`/product/${p.slug}`} size="sm" className="flex-grow-1">Choose options</Button>
          ) : (
            <Button size="sm" className="flex-grow-1" onClick={add} aria-label={`Add ${p.name} to bag`}>
              <Icon name="bag" size={16} /> Add to bag
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

export default memo(ProductCard);
