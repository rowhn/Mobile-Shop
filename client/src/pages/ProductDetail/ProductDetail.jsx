import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
import Icon from '../../components/Icon.jsx';
import ProductCard, { ProductImage } from '../../components/ProductCard.jsx';
import QtyStepper from '../../components/QtyStepper.jsx';
import { Badge, Button, ErrorState, PageLoader, SectionHeading, cx } from '../../components/ui';
import { api } from '../../lib/api.js';
import { useAsync, usePageTitle } from '../../lib/hooks.js';
import { money } from '../../lib/format.js';
import { useCart } from '../../context/Cart.jsx';
import { useWishlist } from '../../context/Wishlist.jsx';
import { useToast } from '../../context/Toast.jsx';
import { useConfig } from '../../context/Config.jsx';
import { whatsappLink } from '../../config/siteConfig.js';
import './ProductDetail.css';

const variantMrp = (p, v) => (v && v.price != null ? v.price : p.price);
const finalOf = (p, v) => Math.round(variantMrp(p, v) * (1 - (p.discountPercent || 0) / 100));

/**
 * Photo gallery: thumbnails (left on desktop, below on mobile), big contained photo with arrows and dots,
 * and a click-to-zoom lightbox that opens in the centre of the screen. Add up to 10 photos per product in Admin.
 */
function Gallery({ product }) {
  const imgs = product.images;
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(false);
  const count = Math.max(1, imgs.length);
  const go = (d) => setI((v) => (v + d + count) % count);
  const hasPhotos = imgs.length > 0;

  return (
    <div className="pm-product__gallery">
      {count > 1 && (
        <div className="pm-product__thumbs hide-scrollbar" role="tablist" aria-label="Product photos">
          {imgs.map((im, idx) => (
            <button type="button" key={im.url + idx} role="tab" aria-selected={idx === i} onClick={() => setI(idx)} aria-label={`Show image ${idx + 1}`} className={cx('pm-product__thumb', idx === i && 'is-active')}>
              <img src={im.url} alt="" />
            </button>
          ))}
        </div>
      )}
      <div className="pm-product__stagewrap">
        <div className="pm-product__stage">
          <button type="button" className="pm-product__zoom" onClick={() => hasPhotos && setZoom(true)} aria-label="Enlarge photo" disabled={!hasPhotos}>
            <ProductImage key={i} product={product} index={i} className="pm-product__stage-img" />
          </button>
          {count > 1 && (
            <>
              <button type="button" aria-label="Previous image" onClick={() => go(-1)} className="pm-product__nav pm-product__nav--prev"><Icon name="chevronLeft" /></button>
              <button type="button" aria-label="Next image" onClick={() => go(1)} className="pm-product__nav pm-product__nav--next"><Icon name="chevronRight" /></button>
            </>
          )}
        </div>
        {count > 1 && (
          <div className="pm-product__dots" aria-hidden="true">
            {imgs.map((im, idx) => <span key={idx} className={cx('pm-product__dot', idx === i && 'is-active')} />)}
          </div>
        )}
      </div>

      <Modal show={zoom} onHide={() => setZoom(false)} centered size="xl" className="pm-lightbox" aria-label="Product photos">
        <Modal.Body>
          <button type="button" className="pm-lightbox__close" onClick={() => setZoom(false)} aria-label="Close"><Icon name="close" /></button>
          <div className="pm-lightbox__layout">
            {count > 1 && (
              <div className="pm-lightbox__thumbs hide-scrollbar">
                {imgs.map((im, idx) => (
                  <button type="button" key={im.url + idx} onClick={() => setI(idx)} aria-label={`Photo ${idx + 1}`} className={cx('pm-product__thumb', idx === i && 'is-active')}><img src={im.url} alt="" /></button>
                ))}
              </div>
            )}
            <div className="pm-lightbox__stage">
              {count > 1 && <button type="button" aria-label="Previous photo" onClick={() => go(-1)} className="pm-product__nav pm-product__nav--prev"><Icon name="chevronLeft" /></button>}
              <ProductImage product={product} index={i} className="pm-lightbox__img" />
              {count > 1 && <button type="button" aria-label="Next photo" onClick={() => go(1)} className="pm-product__nav pm-product__nav--next"><Icon name="chevronRight" /></button>}
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}

function VariantPicker({ product, selected, onSelect }) {
  const names = useMemo(() => {
    const set = [];
    product.variants.forEach((v) => v.options.forEach((o) => !set.includes(o.name) && set.push(o.name)));
    return set;
  }, [product.variants]);

  // Variants without structured options (just a label) are shown as a single row of buttons.
  if (!names.length) {
    return (
      <div role="radiogroup" aria-label="Option" className="pm-product__options">
        {product.variants.map((v) => (
          <button type="button" key={v.sku} role="radio" aria-checked={selected?.sku === v.sku} disabled={v.stock <= 0} onClick={() => onSelect(v)} className={cx('pm-product__opt', selected?.sku === v.sku && 'is-active')}>
            {v.label || v.sku}
          </button>
        ))}
      </div>
    );
  }

  const chosen = Object.fromEntries((selected?.options || []).map((o) => [o.name, o.value]));
  const valuesFor = (name) => [...new Set(product.variants.flatMap((v) => v.options.filter((o) => o.name === name).map((o) => o.value)))];

  // Picking a value keeps the other choices when that combination exists; otherwise falls to the closest in-stock match.
  const choose = (name, value) => {
    const want = { ...chosen, [name]: value };
    const match = (v, strict) => v.options.every((o) => (o.name === name ? o.value === value : !strict || want[o.name] === o.value));
    const pool = product.variants;
    onSelect(pool.find((v) => match(v, true) && v.stock > 0) || pool.find((v) => match(v, true)) || pool.find((v) => match(v, false) && v.stock > 0) || pool.find((v) => match(v, false)));
  };

  return (
    <div className="d-grid gap-4">
      {names.map((name) => (
        <div key={name}>
          <p className="small fw-medium mb-2">{name}: <span className="text-muted">{chosen[name]}</span></p>
          <div role="radiogroup" aria-label={name} className="pm-product__options">
            {valuesFor(name).map((val) => {
              const anyStock = product.variants.some((v) => v.options.some((o) => o.name === name && o.value === val) && v.stock > 0);
              const active = chosen[name] === val;
              return (
                <button type="button" key={val} role="radio" aria-checked={active} onClick={() => choose(name, val)} className={cx('pm-product__opt', active && 'is-active', !anyStock && 'is-soldout')}>
                  {val}{!anyStock && <span className="ms-1 small">(sold out)</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const { data, loading, error, reload } = useAsync((s) => api.get(`/products/${slug}`, undefined, s), [slug]);
  const product = data?.product;
  usePageTitle(product?.name);
  const cart = useCart();
  const wishlist = useWishlist();
  const toast = useToast();
  const { shipping } = useConfig();
  const [variant, setVariant] = useState(null);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState('specs');

  useEffect(() => {
    if (!product) return;
    setQty(1);
    setVariant(product.variants.length ? product.variants.find((v) => v.stock > 0) || product.variants[0] : null);
  }, [product]);

  if (loading && !data) return <PageLoader />;
  if (error) {
    return (
      <div className="container">
        <ErrorState error={error} onRetry={error.status === 404 ? undefined : reload} title={error.status === 404 ? 'Product not found' : undefined} />
        <div className="text-center"><Button to="/shop" variant="secondary">Back to shop</Button></div>
      </div>
    );
  }

  const stock = variant ? variant.stock : product.stock;
  const mrp = variantMrp(product, variant);
  const price = finalOf(product, variant);
  const wished = wishlist.has(product.id);
  const specGroups = product.specifications.reduce((acc, s) => {
    (acc[s.group || 'General'] ||= []).push(s);
    return acc;
  }, {});

  const addToCart = (goCheckout) => {
    cart.add(product.id, variant?.sku || '', qty);
    if (goCheckout) cart.setOpen(true);
    else toast.success(`${product.name} added to your bag`);
  };

  return (
    <div className="container py-4 py-lg-5">
      <nav aria-label="Breadcrumb" className="pm-product__crumbs">
        <Link to="/">Home</Link> / <Link to="/shop">Shop</Link>
        {product.category && <> / <Link to={`/shop/${product.category.slug}`}>{product.category.name}</Link></>}
      </nav>

      <div className="row g-4 g-lg-5">
        <div className="col-12 col-lg-6">
          <Gallery product={product} />
        </div>
        <div className="col-12 col-lg-6">
          <p className="pm-product__brand">{product.brand}</p>
          <h1 className="page-title mb-0">{product.name}</h1>
          <div className="d-flex flex-wrap gap-2 mt-3">
            {product.isNewArrival && <Badge tone="dark">New</Badge>}
            {product.discountPercent > 0 && <Badge tone="red">{product.discountPercent}% off</Badge>}
          </div>
          {product.shortDescription && <p className="fs-5 mt-3 mb-0 pm-product__short">{product.shortDescription}</p>}

          <div className="d-flex flex-wrap align-items-baseline gap-2 gap-sm-3 mt-4">
            <span className="pm-product__price">{money(price)}</span>
            {mrp > price && <span className="fs-5 text-muted text-decoration-line-through">{money(mrp)}</span>}
            {mrp > price && <span className="small fw-medium text-success">Save {money(mrp - price)}</span>}
          </div>
          <p className="small text-muted mt-1 mb-0">Inclusive of all taxes.</p>

          {product.variants.length > 0 && <div className="mt-4"><VariantPicker product={product} selected={variant} onSelect={(v) => v && setVariant(v)} /></div>}

          <p className={cx('small fw-medium mt-4 mb-0', stock <= 0 ? 'text-danger' : stock <= product.lowStockThreshold ? 'pm-product__low' : 'text-success')}>
            {stock <= 0 ? 'Out of stock' : stock <= product.lowStockThreshold ? `Only ${stock} left in stock` : 'In stock'}
          </p>

          <div className="d-flex flex-wrap align-items-center gap-3 mt-3">
            <QtyStepper value={qty} max={Math.min(10, stock || 1)} onChange={(n) => setQty(Math.max(1, n))} />
            <Button size="lg" className="flex-grow-1 flex-sm-grow-0 pm-product__add" disabled={stock <= 0} onClick={() => addToCart(true)}>
              {stock <= 0 ? 'Out of stock' : 'Add to bag'}
            </Button>
            <button type="button" onClick={() => wishlist.toggle(product.id)} aria-pressed={wished} aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'} className={cx('pm-product__heart', wished && 'is-wished')}>
              <Icon name="heart" />
            </button>
          </div>

          <Button
            href={whatsappLink(`Hi! I'm interested in ${product.name}`)}
            target="_blank"
            rel="noopener noreferrer"
            variant="outline"
            className="mt-3 w-100"
          >
            <Icon name="whatsapp" size={18} className="pm-product__wa" /> Ask on WhatsApp
          </Button>

          <ul className="pm-product__perks">
            <li><Icon name="truck" />Free shipping above {money(shipping.freeAbove)}</li>
            {product.warranty && <li><Icon name="shield" />{product.warranty}</li>}
            <li><Icon name="clock" />7-day returns on eligible items</li>
          </ul>
        </div>
      </div>

      <section className="pm-product__tabs-wrap">
        <div role="tablist" className="pm-product__tabs">
          {[['specs', 'Specifications'], ['about', 'About']].map(([k, l]) => (
            <button type="button" key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cx('pm-product__tab', tab === k && 'is-active')}>{l}</button>
          ))}
        </div>
        <div className="pt-4" role="tabpanel">
          {tab === 'about' ? (
            product.description ? <div className="pm-product__about">{product.description.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}</div> : <p className="text-muted">No description yet.</p>
          ) : Object.keys(specGroups).length ? (
            <div className="d-grid gap-4">
              {Object.entries(specGroups).map(([g, rows]) => (
                <div key={g}>
                  <h3 className="h6 fw-semibold mb-2">{g}</h3>
                  <dl className="pm-product__specs">
                    {rows.map((r) => (
                      <div key={r.key} className="pm-product__spec">
                        <dt className="text-muted">{r.key}</dt><dd>{r.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          ) : <p className="text-muted">No specifications listed.</p>}
        </div>
      </section>

      {data.related.length > 0 && (
        <section className="mt-5 pt-3">
          <SectionHeading title="You may also like" />
          <div className="row g-3 g-md-4 row-cols-2 row-cols-lg-4">
            {data.related.map((p) => <div className="col" key={p.id}><ProductCard product={p} /></div>)}
          </div>
        </section>
      )}

      {/* sticky mobile buy bar */}
      <div className="pm-product__bar d-lg-none">
        <div className="d-flex align-items-center gap-3">
          <div className="flex-grow-1 min-w-0"><p className="pm-product__bar-name">{product.name}</p><p className="small fw-semibold mb-0">{money(price)}</p></div>
          <Button disabled={stock <= 0} onClick={() => addToCart(false)}>{stock <= 0 ? 'Sold out' : 'Add to bag'}</Button>
        </div>
      </div>
      <div className="pm-product__bar-space d-lg-none" />
    </div>
  );
}
