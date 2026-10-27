import { useRef } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import ProductCard from '../../components/ProductCard.jsx';
import { SectionHeading } from '../../components/ui';
import './ProductRail.css';

/** A titled row of products: swipeable on phones, a grid from tablet up. */
export default function ProductRail({ eyebrow, title, to, items }) {
  const track = useRef(null);
  if (!items?.length) return null;
  const slide = (dir) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: 'smooth' });
  return (
    <section className="container pm-rail">
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        action={
          <div className="pm-rail__actions">
            <Link to={to} className="pm-rail__all d-none d-md-inline-flex">
              See all <Icon name="chevronRight" size={16} />
            </Link>
            <div className="pm-rail__arrows d-lg-none">
              <button type="button" className="pm-rail__arrow" aria-label={`Previous ${title}`} onClick={() => slide(-1)}>
                <Icon name="chevronLeft" size={20} />
              </button>
              <button type="button" className="pm-rail__arrow" aria-label={`Next ${title}`} onClick={() => slide(1)}>
                <Icon name="chevronRight" size={20} />
              </button>
            </div>
          </div>
        }
      />
      <div className="pm-rail__wrap">
      <div className="pm-rail__track" ref={track}>
        {items.slice(0, 8).map((p) => (
          <div key={p.id} className="pm-rail__item">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
      </div>
    </section>
  );
}
