import { Link } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { Reveal, cx } from '../../components/ui';
import './PromoCard.css';

/** One of the two big promo tiles under "Featured" (Admin → Banners, placement "promo"). */
export default function PromoCard({ b }) {
  const dark = b.theme === 'dark';
  return (
    <Reveal>
      <Link to={b.ctaLink || '/shop'} className={cx('pm-promo', dark && 'is-dark')}>
        {b.image && <img src={b.image} alt="" className="pm-promo__img" />}
        <div className="pm-promo__body">
          {b.eyebrow && <p className="pm-promo__eyebrow">{b.eyebrow}</p>}
          <h3 className="pm-promo__title">{b.title}</h3>
          {b.subtitle && <p className="pm-promo__sub">{b.subtitle}</p>}
          {b.ctaLabel && (
            <p className="pm-promo__cta">
              {b.ctaLabel}
              <Icon name="chevronRight" size={16} />
            </p>
          )}
        </div>
      </Link>
    </Reveal>
  );
}
