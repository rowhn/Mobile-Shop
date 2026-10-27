import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Alert, Button, Field, Input } from '../../components/ui';
import AuthShell, { useRedirect } from './AuthShell.jsx';
import { useAuth } from '../../context/Auth.jsx';
import { usePageTitle } from '../../lib/hooks.js';

export default function Register() {
  usePageTitle('Create account');
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const to = useRedirect();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={to} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await register({ ...form, phone: form.phone || undefined });
      navigate(to, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <AuthShell title="Create your account" subtitle="Save your wishlist, track orders and repairs." footer={<>Already have an account? <Link to="/login" state={{ from: to }}>Sign in</Link></>}>
      <form onSubmit={submit} className="d-grid gap-3">
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="Full name">{(id) => <Input id={id} required autoComplete="name" value={form.name} onChange={set('name')} />}</Field>
        <Field label="Email">{(id) => <Input id={id} type="email" required autoComplete="email" value={form.email} onChange={set('email')} />}</Field>
        <Field label="Mobile (optional)">{(id) => <Input id={id} inputMode="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} placeholder="10-digit number" />}</Field>
        <Field label="Password" hint="At least 8 characters.">{(id) => <Input id={id} type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={set('password')} />}</Field>
        <Button type="submit" size="lg" className="w-100" loading={busy}>Create account</Button>
      </form>
    </AuthShell>
  );
}
