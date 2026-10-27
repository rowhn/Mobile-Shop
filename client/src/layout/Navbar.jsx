import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Offcanvas } from 'react-bootstrap';
import Icon from '../components/Icon.jsx';
import { Button, IconButton, cx } from '../components/ui';
import SearchBox from './SearchBox.jsx';
import { useConfig } from '../context/Config.jsx';
import { useAuth } from '../context/Auth.jsx';
import { useCart } from '../context/Cart.jsx';
import { useWishlist } from '../context/Wishlist.jsx';
import './Navbar.css';

// ✏️ Add, remove or rename top-menu links here.
export const NAV_LINKS = [
  { to: '/shop', label: 'Shop' },
  // { to: '/new-arrivals', label: 'New' },
  // { to: '/deals', label: 'Deals' },
  { to: '/repair', label: 'Repairs' },
  { to: '/support', label: 'Support' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const { store } = useConfig();
  const { user } = useAuth();
  const cart = useCart();
  const wishlist = useWishlist();
  const [menu, setMenu] = useState(false);
  const [searching, setSearching] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setMenu(false);
    setSearching(false);
  }, [pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  return (
    <header className={cx('pm-nav', scrolled && 'is-scrolled')}>
      <div className="container pm-nav__bar">
        <IconButton icon="menu" label="Open menu" className="d-lg-none" onClick={() => setMenu(true)} />
        <Link to="/" className="pm-nav__brand" aria-label={`${store.name} home`}>
          {store.name}
        </Link>
        <nav className="pm-nav__links d-none d-lg-flex" aria-label="Main">
          {NAV_LINKS.map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => cx('pm-nav__link', isActive && 'is-active')}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="pm-nav__search d-none d-lg-block">
          <SearchBox />
        </div>
        <div className="pm-nav__actions">
          <IconButton icon="search" label="Search" className="d-lg-none" onClick={() => setSearching((s) => !s)} />
          <Link to="/wishlist" className="pm-icon-btn d-none d-sm-flex" aria-label="Wishlist">
            <Icon name="heart" />
            {wishlist.count > 0 && <span className="pm-nav__dot" />}
          </Link>
          <Link to={user ? '/account' : '/login'} className="pm-icon-btn" aria-label={user ? 'Account' : 'Sign in'}>
            <Icon name="user" />
          </Link>
          <IconButton icon="bag" label={`Cart, ${cart.count} item${cart.count === 1 ? '' : 's'}`} badge={cart.count} onClick={() => cart.setOpen(true)} />
        </div>
      </div>

      {searching && (
        <div className="container pb-3 d-lg-none">
          <SearchBox autoFocus onDone={() => setSearching(false)} />
        </div>
      )}

      {/* Mobile / tablet menu */}
      <Offcanvas show={menu} onHide={() => setMenu(false)} placement="start" className="pm-nav__drawer" aria-label="Menu">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title className="pm-nav__brand">{store.name}</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="d-flex flex-column">
          <nav className="pm-nav__mobile" aria-label="Mobile">
            {[{ to: '/', label: 'Home' }, ...NAV_LINKS, { to: '/wishlist', label: 'Wishlist' }, { to: '/repair/track', label: 'Track a repair' }].map((n) => (
              <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => cx('pm-nav__mlink', isActive && 'is-active')}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto d-grid gap-2 pt-4">
            <Button href={store.directionsUrl} target="_blank" rel="noopener noreferrer" variant="outline">
              <Icon name="navigate" size={16} /> Navigate me
            </Button>
            {user ? (
              <Button to="/account" variant="secondary">My account</Button>
            ) : (
              <>
                <Button to="/login">Sign in</Button>
                <Button to="/register" variant="secondary">Create account</Button>
              </>
            )}
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </header>
  );
}
