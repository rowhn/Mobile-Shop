import { useEffect, useState } from 'react';
import { Alert, Button, ErrorState, Field, Input, PageLoader, Textarea, Toggle, cx } from '../../components/ui';
import { Card, PageHead } from '../components';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/hooks.js';
import { useToast } from '../../context/Toast.jsx';
import { useConfig } from '../../context/Config.jsx';
import siteConfig from '../../config/siteConfig.js';
import './Settings.css';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Settings() {
  const toast = useToast();
  const cfg = useConfig();
  const { data, loading, error, reload } = useAsync(() => api.get('/admin/settings'), []);
  const [f, setF] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (data?.item) setF(structuredClone(data.item)); }, [data]);
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading || !f) return <PageLoader />;

  const set = (path, value) => setF((s) => { const n = structuredClone(s); let o = n; const p = path.split('.'); p.slice(0, -1).forEach((k) => (o = o[k])); o[p.at(-1)] = value; return n; });
  const text = (path, label, props = {}) => (
    <Field label={label} hint={props.hint} className={props.col || 'col-12 col-md-6'}>
      {(id) => <Input id={id} value={path.split('.').reduce((o, k) => o?.[k], f) ?? ''} onChange={(e) => set(path, props.number ? Number(e.target.value) : e.target.value)} type={props.number ? 'number' : 'text'} min={props.number ? 0 : undefined} placeholder={props.placeholder} />}
    </Field>
  );

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { social, announcement, shipping, repair } = f;
      await api.patch('/admin/settings', {
        storeName: f.storeName, tagline: f.tagline, supportEmail: f.supportEmail, supportPhone: f.supportPhone, whatsapp: f.whatsapp, address: f.address, hours: f.hours,
        social, announcement, shipping,
        repair: { slots: repair.slots, capacityPerSlot: repair.capacityPerSlot, weeklyOff: repair.weeklyOff, advanceDays: repair.advanceDays, warrantyDays: repair.warrantyDays, methods: repair.methods },
      });
      cfg.reload();
      toast.success('Settings saved');
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={save} className="pm-admin-settings">
      <PageHead title="Settings" subtitle="Brand name, contact details, shipping and repair booking rules." />
      <Alert tone="info">
        <strong>Blank fields use your shop defaults.</strong> Shop name, phone, address, hours and social links fall back to <code>client/src/config/siteConfig.js</code> when left empty here. Type a value only if you want to override that file.
      </Alert>

      <Card>
        <h2 className="h6 fw-semibold mb-3">Brand & contact</h2>
        <div className="row g-3">
          {text('storeName', 'Store name', { hint: `Blank = "${siteConfig.shopName}" (from siteConfig.js)`, placeholder: siteConfig.shopName })}
          {text('tagline', 'Tagline', { placeholder: siteConfig.tagline })}
          {text('supportEmail', 'Support email', { placeholder: siteConfig.email || 'hello@example.com' })}
          {text('supportPhone', 'Support phone', { placeholder: siteConfig.phoneDisplay })}
          {text('whatsapp', 'WhatsApp', { hint: 'Digits with country code, e.g. 919623946928', placeholder: siteConfig.whatsappNumber })}
          {text('hours', 'Opening hours', { placeholder: siteConfig.hours })}
          {text('address', 'Store address', { col: 'col-12', placeholder: siteConfig.address })}
        </div>
      </Card>

      <Card>
        <h2 className="h6 fw-semibold mb-3">Announcement bar</h2>
        <div className="row g-3">
          <div className="col-12"><div className="pm-admin-settings__box"><Toggle checked={f.announcement.isActive} onChange={(v) => set('announcement.isActive', v)} label="Show announcement bar" description="Thin bar at the very top of every page." /></div></div>
          {text('announcement.text', 'Text')}
          {text('announcement.link', 'Link (optional)', { placeholder: '/deals' })}
        </div>
      </Card>

      <Card>
        <h2 className="h6 fw-semibold mb-3">Shipping</h2>
        <div className="row g-3">{text('shipping.fee', 'Shipping fee (₹)', { number: true })}{text('shipping.freeAbove', 'Free shipping above (₹)', { number: true })}</div>
      </Card>

      <Card>
        <h2 className="h6 fw-semibold mb-3">Repair booking</h2>
        <div className="row g-3">
          {text('repair.capacityPerSlot', 'Bookings per time slot', { number: true, col: 'col-12 col-md-4' })}
          {text('repair.advanceDays', 'Bookable days ahead', { number: true, col: 'col-12 col-md-4' })}
          {text('repair.warrantyDays', 'Repair warranty (days)', { number: true, col: 'col-12 col-md-4' })}
          <Field label="Time slots" hint="One per line, 24-hour HH:MM-HH:MM" className="col-12 col-md-6">
            {(id) => <Textarea id={id} rows={4} value={f.repair.slots.join('\n')} onChange={(e) => set('repair.slots', e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))} />}
          </Field>
          <div className="col-12">
            <p className="small fw-medium mb-2">Closed on</p>
            <div className="d-flex flex-wrap gap-2">
              {DAYS.map((d, i) => {
                const on = f.repair.weeklyOff.includes(i);
                return <button type="button" key={d} aria-pressed={on} onClick={() => set('repair.weeklyOff', on ? f.repair.weeklyOff.filter((x) => x !== i) : [...f.repair.weeklyOff, i])} className={cx('pm-admin-settings__day', on && 'is-on')}>{d}</button>;
              })}
            </div>
          </div>
        </div>
        <h3 className="small fw-semibold mt-4 mb-3">Service methods</h3>
        <div className="d-grid gap-3">
          {['store_visit', 'pickup_drop', 'courier'].map((k) => (
            <div key={k} className="pm-admin-settings__method">
              <Toggle checked={f.repair.methods[k].enabled} onChange={(v) => set(`repair.methods.${k}.enabled`, v)} label={f.repair.methods[k].label || k} />
              <div className="row g-3 mt-0">{text(`repair.methods.${k}.label`, 'Label', { col: 'col-12 col-md-4' })}{text(`repair.methods.${k}.fee`, 'Fee (₹)', { number: true, col: 'col-12 col-md-4' })}{text(`repair.methods.${k}.description`, 'Description', { col: 'col-12 col-md-4' })}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="h6 fw-semibold mb-1">Social links</h2>
        <p className="small text-muted mb-3">Blank = use the links in siteConfig.js. Icons only appear for links that are filled in.</p>
        <div className="row g-3">
          {text('social.instagram', 'Instagram', { col: 'col-12 col-md-6 col-lg-3', placeholder: siteConfig.social.instagram })}
          {text('social.facebook', 'Facebook', { col: 'col-12 col-md-6 col-lg-3', placeholder: siteConfig.social.facebook || 'https://facebook.com/…' })}
          {text('social.x', 'X / Twitter', { col: 'col-12 col-md-6 col-lg-3' })}
          {text('social.youtube', 'YouTube', { col: 'col-12 col-md-6 col-lg-3' })}
        </div>
      </Card>

      <Alert tone="info">Payment (Razorpay) and image upload (Cloudinary) credentials are set as server environment variables, not here, so they can never leak through the dashboard. Status: Razorpay <strong>{cfg.payments.razorpay ? 'configured' : 'not configured'}</strong>, image uploads <strong>{cfg.uploadsEnabled ? 'configured' : 'not configured'}</strong>.</Alert>

      <div className="pm-admin-sticky-save"><div className="pm-admin-sticky-save__inner justify-content-end"><Button type="submit" loading={saving}>Save settings</Button></div></div>
    </form>
  );
}
