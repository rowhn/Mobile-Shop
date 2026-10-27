import { Link } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { Button } from '../../components/ui';
import { usePageTitle } from '../../lib/hooks.js';
import { useConfig } from '../../context/Config.jsx';
import './Support.css';

const ITEMS = [
  ['wrench', 'Book a repair', 'Get your phone fixed.', '/repair/book'],
  ['clock', 'Track a repair', 'Check progress with your reference.', '/repair/track'],
  ['box', 'Your orders', 'Track, cancel or pay for an order.', '/account'],
  ['help', 'FAQ', 'Answers to common questions.', '/faq'],
  ['shield', 'Policies', 'Shipping, returns, warranty and privacy.', '/policies'],
  ['mail', 'Contact us', 'Talk to a person.', '/contact'],
];

export default function Support() {
  usePageTitle('Support');
  const { store } = useConfig();
  return (
    <div className="container pm-support">
      <h1 className="page-title">How can we help?</h1>
      <div className="d-flex flex-wrap gap-2 mt-4">
        <Button href={store.whatsappUrl} target="_blank" rel="noopener noreferrer" variant="whatsapp"><Icon name="whatsapp" size={18} /> Chat on WhatsApp</Button>
        <Button href={store.directionsUrl} target="_blank" rel="noopener noreferrer" variant="outline"><Icon name="navigate" size={18} /> Navigate me to the shop</Button>
      </div>
      <div className="row g-3 g-lg-4 mt-3">
        {ITEMS.map(([ic, t, d, to]) => (
          <div key={to} className="col-12 col-sm-6 col-lg-4">
            <Link to={to} className="pm-support__card"><Icon name={ic} size={32} strokeWidth={1.3} /><h2 className="h6 fw-semibold mt-3 mb-1">{t}</h2><p className="small text-muted mb-0">{d}</p></Link>
          </div>
        ))}
      </div>
    </div>
  );
}
