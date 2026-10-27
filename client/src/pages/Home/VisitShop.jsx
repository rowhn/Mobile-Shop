import { Reveal } from '../../components/ui';
import ShopInfo from '../../layout/ShopInfo.jsx';
import { useConfig } from '../../context/Config.jsx';
import './VisitShop.css';

/** "Visit our shop" block: address, Navigate me, WhatsApp, socials and an embedded map. */
export default function VisitShop() {
  const { store } = useConfig();
  return (
    <Reveal className="container pm-visit">
      <div className="pm-visit__card">
        <div className="row g-4 g-lg-5 align-items-center">
          <div className="col-lg-5">
            <p className="pm-visit__eyebrow">Visit us</p>
            <h2 className="section-title">{store.name}</h2>
            <p className="text-muted mb-4">Drop by the shop to see the latest phones, pick up accessories or get your device repaired on the spot.</p>
            <ShopInfo />
          </div>
          <div className="col-lg-7">
            <div className="pm-visit__map ratio ratio-4x3">
              <iframe
                title={`Map of ${store.name}`}
                src={`https://www.google.com/maps?q=${encodeURIComponent(`${store.name}, ${store.address}`)}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
