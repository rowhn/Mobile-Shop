import { Carousel } from 'react-bootstrap';
import Icon from '../../components/Icon.jsx';
import { Button, cx } from '../../components/ui';
import { useConfig } from '../../context/Config.jsx';
import './HeroCarousel.css';

/**
 * Big homepage slider with Previous / Next buttons, dots, swipe on touch screens,
 * and CTA buttons. Slides are managed in Admin → Banners (placement "hero").
 */
function Slide({ b, whatsappUrl, first }) {
  const Heading = first ? 'h1' : 'h2'; // only one h1 per page
  const dark = b.theme === 'dark';
  const iconName = b.ctaLink?.includes('repair') ? 'wrench' : b.ctaLink?.includes('product') ? 'phone' : 'tag';
  return (
    <div className={cx('pm-hero__slide', dark ? 'is-dark' : 'is-light')}>
      <div className="row g-0 align-items-center h-100">
        <div className="col-md-7 col-lg-6">
          <div className="pm-hero__text">
            {b.eyebrow && <p className="pm-hero__eyebrow">{b.eyebrow}</p>}
            <Heading className="pm-hero__title">{b.title}</Heading>
            {b.subtitle && <p className="pm-hero__sub">{b.subtitle}</p>}
            <div className="pm-hero__cta">
              {b.ctaLabel && b.ctaLink && (
                <Button to={b.ctaLink} size="lg" variant={dark ? 'secondary' : 'primary'}>{b.ctaLabel}</Button>
              )}
              <Button href={whatsappUrl} target="_blank" rel="noopener noreferrer" size="lg" variant="whatsapp">
                <Icon name="whatsapp" size={18} /> WhatsApp us
              </Button>
            </div>
          </div>
        </div>
        <div className="col-md-5 col-lg-6 d-none d-md-block h-100">
          <div className="pm-hero__art">
            {b.image ? (
              <img src={b.image} alt="" className="pm-hero__img" />
            ) : (
              <Icon name={iconName} size={150} strokeWidth={0.8} className="pm-hero__icon" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DefaultSlide({ store }) {
  return (
    <div className="pm-hero__slide is-light">
      <div className="pm-hero__text text-center mx-auto">
        <h1 className="pm-hero__title">Welcome to {store.name}</h1>
        <p className="pm-hero__sub mx-auto">{store.tagline}</p>
        <div className="pm-hero__cta justify-content-center">
          <Button to="/shop" size="lg">Shop now</Button>
          <Button to="/repair/book" size="lg" variant="outline">Book a repair</Button>
        </div>
      </div>
    </div>
  );
}

export default function HeroCarousel({ banners }) {
  const { store } = useConfig();
  const many = banners.length > 1;
  return (
    <section className="container pt-3 pt-md-4" aria-label="Featured">
      <div className="pm-hero">
        {banners.length === 0 ? (
          <DefaultSlide store={store} />
        ) : (
          <Carousel
            interval={6500}
            pause="hover"
            fade
            controls={many}
            indicators={many}
            touch
            prevIcon={<span className="pm-hero__arrow" aria-hidden="true"><Icon name="chevronLeft" size={22} /></span>}
            nextIcon={<span className="pm-hero__arrow" aria-hidden="true"><Icon name="chevronRight" size={22} /></span>}
            prevLabel="Previous slide"
            nextLabel="Next slide"
          >
            {banners.map((b, i) => (
              <Carousel.Item key={b.id}>
                <Slide b={b} whatsappUrl={store.whatsappUrl} first={i === 0} />
              </Carousel.Item>
            ))}
          </Carousel>
        )}
      </div>
    </section>
  );
}
