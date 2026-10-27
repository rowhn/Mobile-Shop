import { Badge } from '../../components/ui';
import { CrudPage } from '../components';

const active = (v) => <Badge tone={v ? 'green' : 'gray'}>{v ? 'Active' : 'Hidden'}</Badge>;
const thumb = (url) => (url ? <img src={url} alt="" className="pm-admin-thumb" /> : <span className="pm-admin-thumb pm-admin-thumb--empty">—</span>);

export default function Categories() {
  return (
    <CrudPage
      title="Categories" subtitle="Shop sections. Icons are used when there is no image." noun="category" path="/admin/categories" searchPlaceholder="Search categories"
      blank={{ name: '', description: '', icon: 'box', sortOrder: 0, isActive: true, showOnHome: true, image: null }}
      prepare={(c) => ({ ...c, imageUrl: c.image?.url || '', imagePublicId: c.image?.publicId || '' })}
      toPayload={(c) => ({ name: c.name, description: c.description, icon: c.icon, sortOrder: Number(c.sortOrder) || 0, isActive: c.isActive, showOnHome: c.showOnHome, image: c.imageUrl ? { url: c.imageUrl, publicId: c.imagePublicId || '' } : null })}
      columns={[
        { key: 'image', label: '', render: (c) => thumb(c.image?.url) },
        { key: 'name', label: 'Name', render: (c) => <div><p className="fw-medium mb-0">{c.name}</p><p className="small text-muted mb-0">/{c.slug}</p></div> },
        { key: 'sortOrder', label: 'Order' },
        { key: 'isActive', label: 'Status', render: (c) => active(c.isActive) },
      ]}
      fields={[
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'textarea', rows: 2 },
        { name: 'icon', label: 'Icon', type: 'select', half: true, hint: 'Used when no image is set.', options: ['phone', 'laptop', 'tablet', 'headphones', 'watch', 'plug', 'camera', 'speaker', 'box'].map((x) => [x, x]) },
        { name: 'sortOrder', label: 'Sort order', type: 'number', half: true, hint: 'Lower numbers come first.' },
        { name: 'imageUrl', publicIdField: 'imagePublicId', label: 'Image (optional)', type: 'image', folder: 'categories' },
        { name: 'isActive', label: 'Visible in store', type: 'toggle' },
        { name: 'showOnHome', label: 'Show on homepage', type: 'toggle' },
      ]}
    />
  );
}
