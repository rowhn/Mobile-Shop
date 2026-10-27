import { useConfig } from '../context/Config.jsx';
import './MarqueeBanner.css';

/**
 * Scrolling advertising banner. Edit the messages / speed in client/src/config/siteConfig.js → marquee.
 * Hover (or touch-hold) pauses it.
 */
export default function MarqueeBanner() {
  const { store } = useConfig();
  const { enabled, messages = [], speedSeconds = 28 } = store.marquee || {};
  if (!enabled || messages.length === 0) return null;
  const track = (hidden) => (
    <ul className="pm-marquee__group" aria-hidden={hidden || undefined}>
      {messages.map((m) => (
        <li key={m} className="pm-marquee__item">{m}</li>
      ))}
    </ul>
  );
  return (
    <div className="pm-marquee" role="region" aria-label="Shop offers" style={{ '--pm-marquee-speed': `${speedSeconds}s` }}>
      <div className="pm-marquee__track">
        {track(false)}
        {track(true)}
      </div>
    </div>
  );
}
