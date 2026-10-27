import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import { Alert, Button, Field, Input, Textarea } from '../../components/ui';
import ShopInfo from '../../layout/ShopInfo.jsx';
import { api } from '../../lib/api.js';
import { useAsync, usePageTitle } from '../../lib/hooks.js';
import { useConfig } from '../../context/Config.jsx';
import './Contact.css';

const EMPTY = { name: '', email: '', phone: '', subject: '', message: '' };

export default function Contact() {
  usePageTitle('Contact');
  const { store } = useConfig();
  const page = useAsync(() => api.get('/pages/contact').catch(() => null), []);
  const [form, setForm] = useState(EMPTY);
  const [state, setState] = useState({ busy: false, done: false, error: '' });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setState({ busy: true, done: false, error: '' });
    try {
      await api.post('/contact', { ...form, phone: form.phone ? form.phone.replace(/\D/g, '').slice(-10) : undefined });
      setState({ busy: false, done: true, error: '' });
      setForm(EMPTY);
    } catch (err) { setState({ busy: false, done: false, error: err.message }); }
  };
  return (
    <div className="container pm-contact">
      <h1 className="page-title">{page.data?.page.title || 'Contact us'}</h1>
      <p className="fs-5 text-muted mt-3 pm-contact__lead">{page.data?.page.summary || 'Questions about an order or a repair? Send us a message.'}</p>
      <div className="row g-4 g-lg-5 mt-1">
        <div className="col-12 col-lg-7">
          <form onSubmit={submit} className="pm-contact__form">
            {state.done && <Alert tone="success">Thanks! We've received your message and will reply soon.</Alert>}
            {state.error && <Alert tone="error">{state.error}</Alert>}
            <div className="row g-3">
              <Field label="Name" className="col-12 col-sm-6">{(id) => <Input id={id} required value={form.name} onChange={set('name')} autoComplete="name" />}</Field>
              <Field label="Email" className="col-12 col-sm-6">{(id) => <Input id={id} type="email" required value={form.email} onChange={set('email')} autoComplete="email" />}</Field>
              <Field label="Mobile (optional)" className="col-12 col-sm-6">{(id) => <Input id={id} inputMode="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" />}</Field>
              <Field label="Subject" className="col-12 col-sm-6">{(id) => <Input id={id} value={form.subject} onChange={set('subject')} placeholder="Order number or repair reference, if any" />}</Field>
              <Field label="Message" className="col-12">{(id) => <Textarea id={id} required rows={6} maxLength={3000} value={form.message} onChange={set('message')} />}</Field>
            </div>
            <Button type="submit" size="lg" loading={state.busy} className="mt-3">Send message</Button>
          </form>
        </div>
        <aside className="col-12 col-lg-5">
          <div className="pm-contact__wa">
            <Icon name="whatsapp" size={34} />
            <div>
              <h2 className="h6 fw-semibold mb-1">Fastest way to reach us</h2>
              <p className="small mb-3 opacity-75">Chat with {store.name} on WhatsApp for prices, availability and repair help.</p>
              <Button href={store.whatsappUrl} target="_blank" rel="noopener noreferrer" variant="whatsapp" size="sm">Message us on WhatsApp</Button>
            </div>
          </div>
          <h2 className="h5 fw-semibold mt-4 mb-3">Visit the shop</h2>
          <ShopInfo showMap />
        </aside>
      </div>
    </div>
  );
}
