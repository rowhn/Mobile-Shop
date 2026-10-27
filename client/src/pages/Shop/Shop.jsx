import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Offcanvas } from 'react-bootstrap';
import Icon from '../../components/Icon.jsx';
import ProductCard, { ProductCardSkeleton } from '../../components/ProductCard.jsx';
import { Button, EmptyState, ErrorState, Input, Select, cx } from '../../components/ui';
import { api } from '../../lib/api.js';
import { useAsync, useDebounced, usePageTitle } from '../../lib/hooks.js';
import { money } from '../../lib/format.js';
import './Shop.css';

const SORTS = [
  ['newest', 'Newest'],
  ['price_asc', 'Price: low to high'],
  ['price_desc', 'Price: high to low'],
  ['discount', 'Biggest discount'],
  ['name', 'Name A–Z'],
];

/**
 * One listing page powers /shop, /shop/:category, /new-arrivals, /deals and search results.
 * `flag` fixes the collection (new / sale); everything else lives in the URL so links are shareable.
 */
export default function Shop({ flag, heading, intro }) {
  const { category } = useParams();
  const [sp, setSp] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const q = sp.get('q') || '';
  const sort = sp.get('sort') || 'newest';
  const page = Math.max(1, Number(sp.get('page')) || 1);
  const brand = sp.get('brand') || '';
  const minPrice = sp.get('minPrice') || '';
  const maxPrice = sp.get('maxPrice') || '';
  const inStock = sp.get('inStock') === 'true';
  const effectiveFlag = flag || sp.get('flag') || '';

  const cats = useAsync(() => api.get('/categories'), []);
  const activeCat = cats.data?.items.find((c) => c.slug === category);

  const params = useMemo(
    () => ({ q, category, brand, minPrice, maxPrice, sort, flag: effectiveFlag, inStock: inStock || undefined, page, limit: 12 }),
    [q, category, brand, minPrice, maxPrice, sort, effectiveFlag, inStock, page]
  );
  const { data, loading, error, reload } = useAsync((signal) => api.get('/products', params, signal), [JSON.stringify(params)]);
  const facets = useAsync((signal) => api.get('/products/facets', { q, category, flag: effectiveFlag }, signal), [q, category, effectiveFlag]);

  const title = heading || (q ? `Results for “${q}”` : activeCat?.name || 'Shop');
  usePageTitle(title);

  const update = (patch) => {
    const next = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(patch)) (v === '' || v === false || v == null ? next.delete(k) : next.set(k, v));
    if (!('page' in patch)) next.delete('page');
    setSp(next, { replace: true });
  };

  const selectedBrands = brand ? brand.split(',') : [];
  const toggleBrand = (b) => {
    const s = new Set(selectedBrands);
    s.has(b) ? s.delete(b) : s.add(b);
    update({ brand: [...s].join(',') });
  };

  // price inputs: debounced so typing doesn't fire a request per keystroke
  const [pmin, setPmin] = useState(minPrice);
  const [pmax, setPmax] = useState(maxPrice);
  useEffect(() => { setPmin(minPrice); setPmax(maxPrice); }, [minPrice, maxPrice]);
  const dMin = useDebounced(pmin, 500);
  const dMax = useDebounced(pmax, 500);
  useEffect(() => {
    if (dMin !== minPrice || dMax !== maxPrice) update({ minPrice: dMin, maxPrice: dMax });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dMin, dMax]);

  const activeCount = selectedBrands.length + (minPrice || maxPrice ? 1 : 0) + (inStock ? 1 : 0);
  const clear = () => setSp(q ? { q } : {}, { replace: true });
  const qs = q ? `?q=${encodeURIComponent(q)}` : '';

  const Filters = (
    <div className="pm-shop__filters">
      <div>
        <h3 className="pm-shop__filter-title">Category</h3>
        <ul className="pm-shop__cats">
          <li><Link to={`/shop${qs}`} className={cx('pm-shop__cat', !category && 'is-active')}>All</Link></li>
          {cats.data?.items.map((c) => (
            <li key={c.id}>
              <Link to={`/shop/${c.slug}${qs}`} className={cx('pm-shop__cat justify-content-between', category === c.slug && 'is-active')}>
                {c.name}<span className="text-muted">{c.productCount}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      {facets.data?.brands.length > 0 && (
        <div>
          <h3 className="pm-shop__filter-title">Brand</h3>
          <ul className="list-unstyled mb-0 d-grid gap-2">
            {facets.data.brands.map((b) => (
              <li key={b.name}>
                <label className="pm-shop__check">
                  <input type="checkbox" className="form-check-input mt-0" checked={selectedBrands.includes(b.name)} onChange={() => toggleBrand(b.name)} />
                  <span className="flex-grow-1">{b.name}</span>
                  <span className="small text-muted">{b.count}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <h3 className="pm-shop__filter-title">Price (₹)</h3>
        <div className="d-flex align-items-center gap-2">
          <Input type="number" inputMode="numeric" min="0" placeholder={String(facets.data?.price.min ?? 'Min')} value={pmin} onChange={(e) => setPmin(e.target.value)} aria-label="Minimum price" />
          <span className="text-muted">–</span>
          <Input type="number" inputMode="numeric" min="0" placeholder={String(facets.data?.price.max ?? 'Max')} value={pmax} onChange={(e) => setPmax(e.target.value)} aria-label="Maximum price" />
        </div>
        {facets.data && facets.data.price.max > 0 && <p className="mt-2 mb-0 small text-muted">Range: {money(facets.data.price.min)} – {money(facets.data.price.max)}</p>}
      </div>
      <label className="pm-shop__check">
        <input type="checkbox" className="form-check-input mt-0" checked={inStock} onChange={(e) => update({ inStock: e.target.checked })} />
        In stock only
      </label>
      {activeCount > 0 && <Button variant="secondary" size="sm" onClick={clear} className="w-100">Clear filters ({activeCount})</Button>}
    </div>
  );

  return (
    <div className="container py-4 py-lg-5">
      <header className="mb-4 mb-lg-5">
        <nav aria-label="Breadcrumb" className="small text-muted mb-2">
          <Link to="/" className="pm-shop__crumb">Home</Link> / <Link to="/shop" className="pm-shop__crumb">Shop</Link>{activeCat && <> / <span className="text-body">{activeCat.name}</span></>}
        </nav>
        <h1 className="page-title mb-0">{title}</h1>
        {(intro || activeCat?.description) && <p className="pm-shop__intro">{intro || activeCat.description}</p>}
      </header>

      <div className="pm-shop__bar">
        <p className="small text-muted mb-0" aria-live="polite">{loading ? 'Loading…' : `${data?.total ?? 0} product${data?.total === 1 ? '' : 's'}`}</p>
        <div className="d-flex align-items-center gap-2">
          <Button variant="outline" size="sm" className="d-lg-none" onClick={() => setFiltersOpen(true)}>
            <Icon name="filter" size={16} />Filters{activeCount > 0 && ` (${activeCount})`}
          </Button>
          <label className="d-flex align-items-center gap-2 small">
            <span className="text-muted d-none d-sm-inline">Sort by</span>
            <Select value={sort} onChange={(e) => update({ sort: e.target.value === 'newest' ? '' : e.target.value })} className="pm-shop__sort w-auto">
              {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </label>
        </div>
      </div>

      <div className="row g-4 g-xl-5">
        <aside className="col-lg-3 d-none d-lg-block" aria-label="Filters">{Filters}</aside>
        <div className="col-12 col-lg-9">
          {error ? (
            <ErrorState error={error} onRetry={reload} />
          ) : loading && !data ? (
            <div className="row row-cols-2 row-cols-xl-3 g-3 g-md-4">{Array.from({ length: 6 }, (_, i) => <div className="col" key={i}><ProductCardSkeleton /></div>)}</div>
          ) : data.items.length === 0 ? (
            <EmptyState icon="search" title="No products found" text="Try adjusting your filters or search." action={activeCount > 0 || q ? <Button variant="secondary" onClick={clear}>Clear all</Button> : null} />
          ) : (
            <>
              <div className={cx('row row-cols-2 row-cols-xl-3 g-3 g-md-4 pm-shop__grid', loading && 'is-loading')}>
                {data.items.map((p) => <div className="col" key={p.id}><ProductCard product={p} /></div>)}
              </div>
              {data.pages > 1 && (
                <nav className="pm-shop__pager" aria-label="Pagination">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => { update({ page: page - 1 }); window.scrollTo({ top: 0 }); }}>Previous</Button>
                  <span className="px-2 small text-muted">Page {page} of {data.pages}</span>
                  <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => { update({ page: page + 1 }); window.scrollTo({ top: 0 }); }}>Next</Button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>

      <Offcanvas show={filtersOpen} onHide={() => setFiltersOpen(false)} placement="bottom" className="pm-shop__sheet d-lg-none" aria-label="Filters" role="dialog">
        <Offcanvas.Header closeButton closeLabel="Close filters">
          <Offcanvas.Title as="h2" className="h5 fw-semibold mb-0">Filters</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {Filters}
          <Button className="w-100 mt-4" onClick={() => setFiltersOpen(false)}>Show {data?.total ?? ''} results</Button>
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
}
