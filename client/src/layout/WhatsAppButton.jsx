import Icon from '../components/Icon.jsx';
import { useConfig } from '../context/Config.jsx';
import './WhatsAppButton.css';

/**
 * Floating WhatsApp button (bottom-right on every page).
 * The pre-written message and number are set in client/src/config/siteConfig.js.
 */
export default function WhatsAppButton() {
  const { store } = useConfig();
  if (!store.whatsapp) return null;
  return (
    <a
      href={store.whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="pm-wa"
      aria-label={`Chat with ${store.name} on WhatsApp`}
    >
      <span className="pm-wa__label">Chat with us</span>
      <span className="pm-wa__icon">
        <Icon name="whatsapp" size={30} />
      </span>
    </a>
  );
}
