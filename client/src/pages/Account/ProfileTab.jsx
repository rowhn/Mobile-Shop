import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import { Button, Field, Input } from '../../components/ui';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/Auth.jsx';
import { useToast } from '../../context/Toast.jsx';
import './Account.css';

export default function ProfileTab() {
  const { user, setUser, acceptSession } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [pwBusy, setPwBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { const r = await api.patch('/auth/me', { name, phone: phone || undefined }); setUser(r.user); toast.success('Profile updated'); }
    catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };
  const removeAddress = async (id) => {
    try { const r = await api.patch('/auth/me', { addresses: user.addresses.filter((a) => a.id !== id).map(({ ...a }) => a) }); setUser(r.user); toast.show('Address removed'); }
    catch (err) { toast.error(err.message); }
  };
  const changePw = async (e) => {
    e.preventDefault();
    setPwBusy(true);
    try { acceptSession(await api.post('/auth/change-password', pw)); setPw({ currentPassword: '', newPassword: '' }); toast.success('Password changed'); }
    catch (err) { toast.error(err.message); } finally { setPwBusy(false); }
  };

  return (
    <div className="row g-5">
      <form onSubmit={save} className="col-lg-6 d-grid gap-3 align-content-start">
        <h2 className="h5 fw-semibold mb-0">Profile</h2>
        <Field label="Name">{(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} required />}</Field>
        <Field label="Email"><Input value={user.email} disabled /></Field>
        <Field label="Mobile">{(id) => <Input id={id} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="10-digit number" />}</Field>
        <div><Button type="submit" loading={saving}>Save changes</Button></div>

        <h2 className="h5 fw-semibold mb-0 pt-4">Saved addresses</h2>
        {user.addresses.length === 0 ? <p className="small text-muted mb-0">No saved addresses. You can save one while checking out.</p> : (
          <ul className="list-unstyled d-grid gap-3 mb-0">
            {user.addresses.map((a) => (
              <li key={a.id} className="pm-profile__addr">
                <span><strong>{a.name}</strong> {a.isDefault && <span className="badge bg-soft text-dark ms-1">Default</span>}<br /><span className="text-muted">{a.line1}, {a.city}, {a.state} {a.pincode}<br />{a.phone}</span></span>
                <button type="button" onClick={() => removeAddress(a.id)} className="pm-profile__remove" aria-label="Remove address"><Icon name="trash" size={16} /></button>
              </li>
            ))}
          </ul>
        )}
      </form>
      <form onSubmit={changePw} className="col-lg-6 d-grid gap-3 align-content-start">
        <h2 className="h5 fw-semibold mb-0">Change password</h2>
        <Field label="Current password">{(id) => <Input id={id} type="password" autoComplete="current-password" required value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />}</Field>
        <Field label="New password" hint="At least 8 characters.">{(id) => <Input id={id} type="password" autoComplete="new-password" required minLength={8} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />}</Field>
        <div><Button type="submit" variant="dark" loading={pwBusy}>Update password</Button></div>
      </form>
    </div>
  );
}
