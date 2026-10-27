import { Badge, Button, IconButton, Input, Select } from '../../components/ui';
import Icon from '../../components/Icon.jsx';
import { CrudPage } from '../components';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/hooks.js';
import './RepairDevices.css';

/** Supported phones + the per-repair price list for each. */
export default function RepairDevices() {
  const services = useAsync(() => api.get('/admin/repair-services', { limit: 100 }), []);
  const fields = [
    { name: 'brand', label: 'Brand', type: 'text', required: true, half: true },
    { name: 'model', label: 'Model', type: 'text', required: true, half: true },
    { name: 'isActive', label: 'Available for booking', type: 'toggle' },
  ];
  return (
    <CrudPage
      title="Repair devices" subtitle="Supported phones and the estimate range for each repair." noun="device" path="/admin/repair-devices" searchPlaceholder="Search brand or model"
      blank={{ brand: '', model: '', isActive: true, repairs: [] }}
      prepare={(d) => ({ ...d, repairs: (d.repairs || []).map((r) => ({ service: r.service?.id || r.service, priceMin: r.priceMin, priceMax: r.priceMax, etaHours: r.etaHours })) })}
      toPayload={(d) => ({ brand: d.brand, model: d.model, isActive: d.isActive, repairs: d.repairs.filter((r) => r.service).map((r) => ({ service: r.service, priceMin: Number(r.priceMin) || 0, priceMax: Number(r.priceMax) || 0, etaHours: Number(r.etaHours) || 0 })) })}
      columns={[
        { key: 'model', label: 'Device', render: (d) => <div><p className="fw-medium mb-0">{d.model}</p><p className="small text-muted mb-0">{d.brand}</p></div> },
        { key: 'repairs', label: 'Priced repairs', render: (d) => `${d.repairs.length} service(s)` },
        { key: 'isActive', label: 'Status', render: (d) => <Badge tone={d.isActive ? 'green' : 'gray'}>{d.isActive ? 'Active' : 'Hidden'}</Badge> },
      ]}
      fields={fields}
      renderExtra={(value, set) => <DevicePrices value={value} set={set} services={services.data?.items || []} />}
    />
  );
}

function DevicePrices({ value, set, services }) {
  const rows = value.repairs || [];
  const upd = (i, patch) => set({ ...value, repairs: rows.map((r, x) => (x === i ? { ...r, ...patch } : r)) });
  const used = new Set(rows.map((r) => r.service));
  return (
    <div>
      <h3 className="h6 fw-semibold mb-1">Repair price list</h3>
      <p className="small text-muted mb-3">Estimate range shown to customers for this model. Issues without a price show "Quote after inspection".</p>
      {rows.map((r, i) => (
        <div key={i} className="pm-admin-prices__row">
          <Select aria-label="Service" value={r.service} onChange={(e) => upd(i, { service: e.target.value })}><option value="">Choose…</option>{services.map((s) => <option key={s.id} value={s.id} disabled={used.has(s.id) && r.service !== s.id}>{s.name}</option>)}</Select>
          <Input type="number" min="0" aria-label="Min price" placeholder="Min ₹" value={r.priceMin} onChange={(e) => upd(i, { priceMin: e.target.value })} />
          <Input type="number" min="0" aria-label="Max price" placeholder="Max ₹" value={r.priceMax} onChange={(e) => upd(i, { priceMax: e.target.value })} />
          <Input type="number" min="0" aria-label="Hours" placeholder="Hours" value={r.etaHours} onChange={(e) => upd(i, { etaHours: e.target.value })} />
          <IconButton icon="trash" label="Remove" type="button" className="pm-admin-danger-hover" onClick={() => set({ ...value, repairs: rows.filter((_, x) => x !== i) })} />
        </div>
      ))}
      <Button type="button" variant="secondary" size="sm" onClick={() => set({ ...value, repairs: [...rows, { service: '', priceMin: '', priceMax: '', etaHours: 0 }] })}><Icon name="plus" size={16} />Add priced repair</Button>
    </div>
  );
}
