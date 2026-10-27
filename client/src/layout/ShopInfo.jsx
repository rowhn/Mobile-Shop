import Icon from '../components/Icon.jsx';
import { Button } from '../components/ui';
import { useConfig } from '../context/Config.jsx';
import SocialLinks from './SocialLinks.jsx';
import './ShopInfo.css';

/**
 * Address + phone + hours + "Navigate me" + WhatsApp + social icons.
 * Used in the Footer and on the Contact page. `showMap` adds an embedded Google map.
 */
export default function ShopInfo({ showMap, compact }) {
  const { store } = useConfig();
  return (
    <div className="pm-shopinfo">
      <ul className="pm-shopinfo__list">
        {store.address && (
          <li>
            <Icon name="mapPin" size={18} />
            <span>{store.address}</span>
          </li>
        )}
        {store.supportPhone && (
          <li>
            <Icon name="phone" size={18} />
            <a href={`tel:${store.phoneDial}`}>{store.supportPhone}</a>
          </li>
        )}
        {store.supportEmail && (
          <li>
            <Icon name="mail" size={18} />
            <a href={`mailto:${store.supportEmail}`}>{store.supportEmail}</a>
          </li>
        )}
        {store.hours && (
          <li>
            <Icon name="clock" size={18} />
            <span>{store.hours}</span>
          </li>
        )}
      </ul>

      <div className="pm-shopinfo__actions">
        <Button href={store.directionsUrl} target="_blank" rel="noopener noreferrer" size="sm">
          <Icon name="navigate" size={16} /> Navigate me
        </Button>
        <Button href={store.whatsappUrl} target="_blank" rel="noopener noreferrer" variant="whatsapp" size="sm">
          <Icon name="whatsapp" size={16} /> WhatsApp us
        </Button>
        {store.supportPhone && (
          <Button href={`tel:${store.phoneDial}`} variant="outline" size="sm">
            <Icon name="phone" size={16} /> Call
          </Button>
        )}
      </div>

      {!compact && <SocialLinks className="mt-3" />}

      {showMap && store.address && (
        <div className="pm-shopinfo__map ratio ratio-16x9">
          <iframe
            title={`Map of ${store.name}`}
            src={`https://www.google.com/maps?q=${encodeURIComponent(`${store.name}, ${store.address}`)}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
}
