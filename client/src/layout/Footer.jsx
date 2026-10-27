import { Link } from 'react-router-dom';
import { useConfig } from '../context/Config.jsx';
import Icon from '../components/Icon.jsx';
import SocialLinks from './SocialLinks.jsx';
import './Footer.css';

// ✏️ Footer link columns. Add or remove [path, text] pairs here.
const COLUMNS = [
  { title: 'Shop', links: [['/shop', 'All products'], ['/new-arrivals', 'New arrivals'], ['/deals', 'Deals'], ['/wishlist', 'Wishlist']] },
  { title: 'Repairs', links: [['/repair', 'Repair Center'], ['/repair/book', 'Book a repair'], ['/repair/track', 'Track a repair']] },
  { title: 'Company', links: [['/about', 'About'], ['/contact', 'Contact'], ['/faq', 'FAQ'], ['/policies', 'Policies'], ['/account', 'My account']] },
];

export default function Footer() {
  const { store } = useConfig();
  return (
    <footer className="pm-footer">
      <div className="container">
        <div className="row g-4 g-lg-5">
          <div className="col-12 col-lg-4">
            <p className="pm-footer__brand">{store.name}</p>
            {store.tagline && <p className="pm-footer__tagline">{store.tagline}</p>}
            <p className="pm-footer__follow">Follow us</p>
            <SocialLinks />
          </div>
          {COLUMNS.map((c) => (
            <div key={c.title} className="col-6 col-md-3 col-lg-2">
              <h3 className="pm-footer__title">{c.title}</h3>
              <ul className="pm-footer__links">
                {c.links.map(([to, text]) => (
                  <li key={to}>
                    <Link to={to}>{text}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="col-6 col-md-3 col-lg-2">
            <h3 className="pm-footer__title">Need help?</h3>
            <ul className="pm-footer__links">
              {store.supportPhone && (
                <li><a href={`tel:${store.phoneDial}`}><Icon name="phone" size={15} /> {store.supportPhone}</a></li>
              )}
              <li><a href={store.whatsappUrl} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" size={15} /> WhatsApp</a></li>
              <li><a href={store.directionsUrl} target="_blank" rel="noopener noreferrer"><Icon name="navigate" size={15} /> Get directions</a></li>
            </ul>
          </div>
        </div>
        <div className="pm-footer__bottom">
          <p className="mb-0">© {new Date().getFullYear()} {store.name}. All rights reserved.</p>
          <p className="mb-0 d-flex gap-3">
            <Link to="/policies/privacy-policy">Privacy</Link>
            <Link to="/policies/terms">Terms</Link>
            <Link to="/policies/return-policy">Returns</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}