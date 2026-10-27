import { Badge } from '../../components/ui';
import { CrudPage } from '../components';

export default function RepairServices() {
  return (
    <CrudPage
      title="Repair services" subtitle="The issue types customers choose from (set per-device prices under Repair devices)." noun="service" path="/admin/repair-services" searchPlaceholder="Search services"
      blank={{ name: '', description: '', icon: 'wrench', sortOrder: 0, isActive: true }}
      columns={[
        { key: 'name', label: 'Service', render: (s) => <div><p className="fw-medium mb-0">{s.name}</p><p className="small text-muted mb-0">{s.description}</p></div> },
        { key: 'sortOrder', label: 'Order' },
        { key: 'isActive', label: 'Status', render: (s) => <Badge tone={s.isActive ? 'green' : 'gray'}>{s.isActive ? 'Active' : 'Hidden'}</Badge> },
      ]}
      fields={[
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'textarea', rows: 2 },
        { name: 'icon', label: 'Icon', type: 'select', half: true, options: ['screen', 'battery', 'plug', 'camera', 'shield', 'speaker', 'droplet', 'code', 'wrench', 'help'].map((x) => [x, x]) },
        { name: 'sortOrder', label: 'Sort order', type: 'number', half: true },
        { name: 'isActive', label: 'Offered to customers', type: 'toggle' },
      ]}
    />
  );
}
