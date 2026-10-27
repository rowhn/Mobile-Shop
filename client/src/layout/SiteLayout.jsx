import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AnnouncementBar from './AnnouncementBar.jsx';
import MarqueeBanner from './MarqueeBanner.jsx';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import CartDrawer from './CartDrawer.jsx';
import WhatsAppButton from './WhatsAppButton.jsx';
import './SiteLayout.css';

/**
 * The frame around every storefront page.
 * Order on screen: announcement → Navbar → marquee → page content → Footer.
 * To add or remove a site-wide element, edit this file.
 */
export default function SiteLayout() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo({ top: 0, behavior: 'instant' }), [pathname]);
  return (
    <div className="pm-site">
      <a href="#main" className="pm-skip">Skip to content</a>
      <AnnouncementBar />
      <Navbar />
      <MarqueeBanner />
      <main id="main" className="pm-site__main">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <WhatsAppButton />
    </div>
  );
}
