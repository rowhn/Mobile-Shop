import { Badge } from '../../components/ui';
import { CrudPage } from '../components';
import { dateFmt, money } from '../../lib/format.js';

const active = (v) => <Badge tone={v ? 'green' : 'gray'}>{v ? 'Active' : 'Hidden'}</Badge>;

export default function Coupons() {
  return (
    <CrudPage
      title="Coupons" subtitle="Discount codes. Validated on the server at checkout." noun="coupon" path="/admin/coupons" searchPlaceholder="Search codes"
      blank={{ code: '', description: '', type: 'percent', value: 10, minOrder: 0, maxDiscount: 0, usageLimit: 0, perUserLimit: 0, startsAt: null, expiresAt: null, isActive: true }}
      columns={[
        { key: 'code', label: 'Code', render: (c) => <div><p className="fw-semibold mb-0">{c.code}</p><p className="small text-muted mb-0">{c.description}</p></div> },
        { key: 'value', label: 'Discount', render: (c) => (c.type === 'percent' ? `${c.value}%${c.maxDiscount ? ` (max ${money(c.maxDiscount)})` : ''}` : money(c.value)) },
        { key: 'minOrder', label: 'Min order', render: (c) => (c.minOrder ? money(c.minOrder) : '—') },
        { key: 'used', label: 'Used', render: (c) => `${c.usedCount}${c.usageLimit ? ` / ${c.usageLimit}` : ''}` },
        { key: 'expiresAt', label: 'Expires', render: (c) => (c.expiresAt ? dateFmt(c.expiresAt) : 'Never') },
        { key: 'isActive', label: 'Status', render: (c) => active(c.isActive) },
      ]}
      fields={[
        { name: 'code', label: 'Code', type: 'text', required: true, half: true, hint: 'Letters, digits, - and _', placeholder: 'DIWALI10' },
        { name: 'type', label: 'Type', type: 'select', half: true, options: [['percent', 'Percentage off'], ['flat', 'Flat amount off']] },
        { name: 'value', label: 'Value (% or ₹)', type: 'number', half: true, required: true, min: 1 },
        { name: 'maxDiscount', label: 'Max discount ₹ (percent only)', type: 'number', half: true, hint: '0 = no cap' },
        { name: 'minOrder', label: 'Minimum order ₹', type: 'number', half: true },
        { name: 'description', label: 'Description', type: 'text', half: true, placeholder: 'Shown to customers' },
        { name: 'usageLimit', label: 'Total uses allowed', type: 'number', half: true, hint: '0 = unlimited' },
        { name: 'perUserLimit', label: 'Uses per customer', type: 'number', half: true, hint: '0 = unlimited' },
        { name: 'startsAt', label: 'Valid from', type: 'datetime', half: true },
        { name: 'expiresAt', label: 'Expires', type: 'datetime', half: true },
        { name: 'isActive', label: 'Active', type: 'toggle' },
      ]}
    />
  );
}
