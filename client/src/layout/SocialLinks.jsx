import Icon from '../components/Icon.jsx';
import { useConfig } from '../context/Config.jsx';
import './SocialLinks.css';

const LABELS = { instagram: 'Instagram', facebook: 'Facebook', youtube: 'YouTube', x: 'X (Twitter)', telegram: 'Telegram', justdial: 'Justdial' };
const ICONS = { justdial: 'mapPin' };

/** Round social icons. Only links filled in siteConfig.js (or Admin → Settings) are shown. */
export default function SocialLinks({ className = '', light }) {
  const { store } = useConfig();
  const items = Object.entries(store.social || {}).filter(([, url]) => url);
  if (!items.length) return null;
  return (
    <ul className={`pm-social ${light ? 'pm-social--light' : ''} ${className}`} aria-label="Social media">
      {items.map(([key, url]) => (
        <li key={key}>
          <a href={url} target="_blank" rel="noopener noreferrer" aria-label={LABELS[key] || key} title={LABELS[key] || key} className={`pm-social__link pm-social__link--${key}`}>
            <Icon name={ICONS[key] || key} size={20} />
          </a>
        </li>
      ))}
    </ul>
  );
}
