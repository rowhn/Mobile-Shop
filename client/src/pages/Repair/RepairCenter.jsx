import { Link } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { Badge, Button, ErrorState, Reveal, SectionHeading, Skeleton } from '../../components/ui';
import { api } from '../../lib/api.js';
import { useAsync, usePageTitle } from '../../lib/hooks.js';
import { money } from '../../lib/format.js';
import { useConfig } from '../../context/Config.jsx';
import { methodIcon } from './repairShared.js';
import './RepairCenter.css';

const STEPS = [
  ["Tell us what's wrong", "Choose your phone model and the issue. You'll see an estimate straight away."],
  ['Pick how and when', 'Visit our store, request pickup & drop, or send it by courier.'],
  ['Track & approve', 'Follow progress online. We only start after you approve the final quote.'],
];

/** Repair landing page: /repair */
export default function RepairCenter() {
  usePageTitle('Repair Center');
  const { repair, store } = useConfig();
  const services = useAsync(() => api.get('/repairs/services'), []);
  const brands = useAsync(() => api.get('/repairs/brands'), []);
  const methods = Object.entries(repair.methods || {}).filter(([, m]) => m.enabled);

  return (
    <>
      <section className="container pt-4">
        <div className="pm-repair__hero">
          <p className="pm-repair__eyebrow">Repair Center</p>
          <h1 className="pm-repair__title">Fast, careful phone repairs.</h1>
          <p className="pm-repair__lead">Choose your phone and the problem, see an estimate, and book. We tell you the final price before we start.</p>
          <div className="d-flex flex-wrap gap-3 mt-4">
            <Button to="/repair/book" size="lg" variant="secondary">Book a repair</Button>
            <Button to="/repair/track" size="lg" variant="ghost" className="pm-repair__ghost">Track a repair</Button>
          </div>
          {store.whatsappUrl && (
            <p className="pm-repair__wa">
              Prefer WhatsApp?{' '}
              <Button href={store.whatsappUrl} target="_blank" rel="noopener noreferrer" variant="whatsapp" size="sm" className="ms-1">
                <Icon name="whatsapp" size={16} /> Chat with us
              </Button>
            </p>
          )}
        </div>
      </section>

      <section className="container pm-repair__section">
        <SectionHeading eyebrow="What we fix" title="Common repairs" />
        {services.error ? (
          <ErrorState error={services.error} onRetry={services.reload} />
        ) : (
          <div className="row g-3 g-lg-4">
            {services.loading
              ? Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="col-6 col-md-4 col-lg-3"><Skeleton style={{ height: 160, borderRadius: '1.5rem' }} /></div>
                ))
              : services.data.items.map((s, i) => (
                  <div key={s.id} className="col-6 col-md-4 col-lg-3">
                    <Reveal delay={i * 0.04} y={14} className="h-100">
                      <Link to={`/repair/book?service=${s.id}`} className="pm-repair__service">
                        <Icon name={s.icon} size={32} strokeWidth={1.3} />
                        <h3 className="h6 fw-semibold mb-0">{s.name}</h3>
                        <p className="small text-muted mb-0">{s.description}</p>
                      </Link>
                    </Reveal>
                  </div>
                ))}
          </div>
        )}
      </section>

      <section className="container pm-repair__section">
        <SectionHeading eyebrow="How it works" title="Three simple steps" />
        <div className="row g-3 g-lg-4">
          {STEPS.map(([t, d], i) => (
            <div key={t} className="col-12 col-md-4">
              <Reveal delay={i * 0.08} className="h-100">
                <div className="pm-repair__step">
                  <span className="pm-repair__num">{i + 1}</span>
                  <h3 className="h5 fw-semibold mt-4">{t}</h3>
                  <p className="text-muted mb-0">{d}</p>
                </div>
              </Reveal>
            </div>
          ))}
        </div>
      </section>

      {methods.length > 0 && (
        <section className="container pm-repair__section">
          <SectionHeading eyebrow="Your choice" title="Ways to get it fixed" />
          <div className="row g-3">
            {methods.map(([k, m]) => (
              <div key={k} className="col-12 col-md-4">
                <div className="pm-repair__method">
                  <Icon name={methodIcon(k)} size={28} strokeWidth={1.4} />
                  <h3 className="h6 fw-semibold mt-3">{m.label}</h3>
                  <p className="small text-muted mb-2">{m.description}</p>
                  <p className="small fw-medium mb-0">{m.fee > 0 ? `${money(m.fee)} service fee` : 'No extra charge'}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="container pm-repair__section">
        <div className="pm-repair__brands row align-items-center g-4">
          <div className="col-12 col-md-6">
            <h2 className="section-title">Supported brands</h2>
            <p className="text-muted">Don't see your phone? Book anyway and describe it, or contact us.</p>
            <div className="d-flex flex-wrap gap-2 mt-3">
              {brands.data?.items.map((b) => (
                <Link key={b.brand} to={`/repair/book?brand=${encodeURIComponent(b.brand)}`} className="pm-repair__brand">
                  <Badge className="pm-repair__brand-badge">{b.brand}</Badge>
                </Link>
              ))}
            </div>
          </div>
          <div className="col-12 col-md-6">
            <ul className="pm-repair__perks">
              <li><Icon name="shield" size={20} className="flex-shrink-0" />{repair.warrantyDays}-day warranty on repairs</li>
              <li><Icon name="check" size={20} className="flex-shrink-0" />Final quote shared before any work starts</li>
              <li><Icon name="clock" size={20} className="flex-shrink-0" />Live status tracking with your booking reference</li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
