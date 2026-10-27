import { useState } from 'react';
import { Badge, ErrorState, Select, Toggle } from '../../components/ui';
import { Pager, PageHead, SearchBar, Table, useList } from '../components';
import { api } from '../../lib/api.js';
import { dateFmt, money } from '../../lib/format.js';
import { useAuth } from '../../context/Auth.jsx';
import { useToast } from '../../context/Toast.jsx';

export default function Customers() {
  const toast = useToast();
  const { user: me } = useAuth();
  const [role, setRole] = useState('');
  const list = useList('/admin/customers', { role });
  const update = async (u, patch, msg) => {
    try { await api.patch(`/admin/customers/${u.id}`, patch); toast.success(msg); list.reload(); } catch (err) { toast.error(err.message); }
  };
  const columns = [
    { key: 'name', label: 'Name', render: (u) => <div><p className="fw-medium mb-0">{u.name}</p><p className="small text-muted mb-0">{u.email}</p></div> },
    { key: 'phone', label: 'Phone', render: (u) => u.phone || '—' },
    { key: 'orders', label: 'Orders', render: (u) => `${u.orderCount} · ${money(u.totalSpent)}` },
    { key: 'joined', label: 'Joined', render: (u) => dateFmt(u.createdAt) },
    { key: 'role', label: 'Role', render: (u) => u.id === me.id ? <Badge tone="dark">{u.role} (you)</Badge> : (
      <Select aria-label={`Role for ${u.name}`} value={u.role} onChange={(e) => window.confirm(`Change ${u.name}'s role to ${e.target.value}?`) && update(u, { role: e.target.value }, 'Role updated')} className="w-auto form-select-sm"><option value="customer">Customer</option><option value="staff">Staff</option><option value="admin">Admin</option></Select>
    ) },
    { key: 'active', label: 'Account', render: (u) => u.id === me.id ? null : <Toggle checked={u.isActive} onChange={(v) => update(u, { isActive: v }, v ? 'Account enabled' : 'Account disabled')} label="" /> },
  ];
  return (
    <>
      <PageHead title="Customers & staff" subtitle="Staff can manage orders and repairs. Admins can manage everything. Customers sign up themselves." />
      <SearchBar value={list.q} onChange={list.setQ} placeholder="Name, email or phone">
        <Select value={role} onChange={(e) => setRole(e.target.value)} className="w-auto" aria-label="Role"><option value="">Everyone</option><option value="customer">Customers</option><option value="staff">Staff</option><option value="admin">Admins</option></Select>
      </SearchBar>
      {list.error ? <ErrorState error={list.error} onRetry={list.reload} /> : <Table columns={columns} rows={list.data?.items || []} loading={list.loading && !list.data} empty="No users match" />}
      <Pager data={list.data} page={list.page} setPage={list.setPage} />
    </>
  );
}
