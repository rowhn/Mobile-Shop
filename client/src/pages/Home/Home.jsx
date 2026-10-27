import { Link } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { ProductCardSkeleton } from '../../components/ProductCard.jsx';
import { ErrorState, Reveal, Skeleton } from '../../components/ui';
import { api } from '../../lib/api.js';
import { useAsync, usePageTitle } from '../../lib/hooks.js';
import { useConfig } from '../../context/Config.jsx';
import HeroCarousel from './HeroCarousel.jsx';
import PromoCard from './PromoCard.jsx';
import ProductRail from './ProductRail.jsx';
import RepairBanner from './RepairBanner.jsx';
import VisitShop from './VisitShop.jsx';
import './Home.css';

const PERKS = [
  ['truck', 'Free shipping', 'On orders above the free-shipping threshold.'],
  ['shield', 'Genuine & warrantied', 'Manufacturer warranty on every product.'],
  ['wrench', 'Expert repairs', 'Book online, track every step.'],
  ['clock', 'Easy returns', '7-day returns on eligible items.'],
];

/**
 * Homepage. Sections, top to bottom:
 * hero carousel → categories → Featured → promo tiles → New → Deals → Repair banner → Perks → Visit the shop.
 * Re-order or remove a section by moving/deleting its line in the return() below.
 */
export default function Home() {
  usePageTitle('');
  const { shipping } = useConfig();
  const { data, loading, error, reload } = useAsync(() => api.get('/home'), []);

  if (error && !data) return <div className="container"><ErrorState error={error} onRetry={reload} title="We couldn't load the store" /></div>;

  return (
    <>
      {data?.banners.strip.length > 0 && <div className="pm-home__strip">{data.banners.strip[0].title}</div>}

      {loading ? (
        <div className="container pt-4"><Skeleton style={{ height: '30rem', borderRadius: '2rem' }} /></div>
      ) : (
        <HeroCarousel banners={data.banners.hero} />
      )}

      {!loading && data.categories.length > 0 && (
        <section className="container pm-home__cats">
          <div className="row g-2 g-md-3">
            {data.categories.map((c, idx) => (
              <div key={c.id} className="col-4 col-md-3 col-lg-2">
                <Reveal delay={idx * 0.04} y={16}>
                  <Link to={`/shop/${c.slug}`} className="pm-home__cat">
                    {c.image?.url ? <img src={c.image.url} alt="" className="pm-home__cat-img" /> : <Icon name={c.icon} size={34} strokeWidth={1.3} />}
                    <span>{c.name}</span>
                  </Link>
                </Reveal>
              </div>
            ))}
          </div>
        </section>
      )}

      {loading && (
        <section className="container pm-home__loading">
          <div className="row g-4">{Array.from({ length: 4 }, (_, i) => <div key={i} className="col-6 col-lg-3"><ProductCardSkeleton /></div>)}</div>
        </section>
      )}

      <ProductRail eyebrow="Handpicked" title="Featured" to="/shop?flag=featured" items={data?.featured} />

      {data?.banners.promo.length > 0 && (
        <section className="container pm-home__promos">
          <div className="row g-3 g-md-4">
            {data.banners.promo.slice(0, 2).map((b) => <div key={b.id} className="col-md-6"><PromoCard b={b} /></div>)}
          </div>
        </section>
      )}

      <ProductRail eyebrow="Just in" title="New arrivals" to="/new-arrivals" items={data?.newArrivals} />
      <ProductRail eyebrow="Limited time" title="Deals" to="/deals" items={data?.deals} />

      <RepairBanner />

      <section className="container pm-home__perks">
        <div className="row g-4">
          {PERKS.map(([ic, t, d], idx) => (
            <div key={t} className="col-6 col-lg-3">
              <Reveal delay={idx * 0.06} y={14}>
                <Icon name={ic} size={28} strokeWidth={1.4} />
                <h3 className="h6 fw-semibold mt-3 mb-1">{t}</h3>
                <p className="small text-muted mb-0">{t === 'Free shipping' ? `On orders above ₹${shipping.freeAbove.toLocaleString('en-IN')}.` : d}</p>
              </Reveal>
            </div>
          ))}
        </div>
      </section>

      <VisitShop />
    </>
  );
}
