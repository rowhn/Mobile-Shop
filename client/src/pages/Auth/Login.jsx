import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Alert, Button, Field, Input } from '../../components/ui';
import AuthShell, { useRedirect } from './AuthShell.jsx';
import { useAuth } from '../../context/Auth.jsx';
import { usePageTitle } from '../../lib/hooks.js';

export default function Login() {
  usePageTitle('Sign in');
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const to = useRedirect();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={to} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const u = await login(form.email, form.password);
      navigate(u.role !== 'customer' && to === '/account' ? '/admin' : to, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthShell title="Sign in" subtitle="Welcome back." footer={<>New here? <Link to="/register" state={{ from: to }}>Create an account</Link></>}>
      <form onSubmit={submit} className="d-grid gap-3">
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="Email">{(id) => <Input id={id} type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />}</Field>
        <Field label="Password">{(id) => <Input id={id} type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />}</Field>
        <Button type="submit" size="lg" className="w-100" loading={busy}>Sign in</Button>
      </form>
    </AuthShell>
  );
}
