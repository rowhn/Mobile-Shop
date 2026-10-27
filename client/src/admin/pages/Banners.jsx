import { Badge } from '../../components/ui';
import { CrudPage } from '../components';
import { dateFmt } from '../../lib/format.js';

const active = (v) => <Badge tone={v ? 'green' : 'gray'}>{v ? 'Active' : 'Hidden'}</Badge>;
const thumb = (url) => (url ? <img src={url} alt="" className="pm-admin-thumb" /> : <span className="pm-admin-thumb pm-admin-thumb--empty">—</span>);

export default function Banners() {
  return (
    <CrudPage
      title="Banners & campaigns" subtitle="Homepage hero slides, promo cards and the thin strip above the hero. Optionally schedule them." noun="banner" path="/admin/banners" searchPlaceholder="Search banners"
      blank={{ placement: 'hero', theme: 'light', eyebrow: '', title: '', subtitle: '', image: '', imagePublicId: '', ctaLabel: '', ctaLink: '', sortOrder: 0, isActive: true, startsAt: null, endsAt: null }}
      columns={[
        { key: 'image', label: '', render: (b) => thumb(b.image) },
        { key: 'title', label: 'Banner', render: (b) => <div><p className="fw-medium mb-0">{b.title}</p><p className="small text-muted mb-0">{b.ctaLink || 'No link'}</p></div> },
        { key: 'placement', label: 'Where', render: (b) => <Badge tone="blue">{b.placement}</Badge> },
        { key: 'schedule', label: 'Schedule', render: (b) => (b.startsAt || b.endsAt ? `${b.startsAt ? dateFmt(b.startsAt) : 'Now'} → ${b.endsAt ? dateFmt(b.endsAt) : 'No end'}` : 'Always') },
        { key: 'isActive', label: 'Status', render: (b) => active(b.isActive) },
      ]}
      fields={[
        { name: 'placement', label: 'Placement', type: 'select', half: true, options: [['hero', 'Hero slide (big, top of homepage)'], ['promo', 'Promo card (two shown mid-page)'], ['strip', 'Thin strip (text only)']] },
        { name: 'theme', label: 'Colour theme', type: 'select', half: true, options: [['light', 'Light'], ['dark', 'Dark']] },
        { name: 'title', label: 'Headline', type: 'text', required: true },
        { name: 'eyebrow', label: 'Small label above headline', type: 'text', half: true, placeholder: 'New, Sale…' },
        { name: 'sortOrder', label: 'Sort order', type: 'number', half: true },
        { name: 'subtitle', label: 'Sub-headline', type: 'textarea', rows: 2 },
        { name: 'ctaLabel', label: 'Button text', type: 'text', half: true, placeholder: 'Shop now' },
        { name: 'ctaLink', label: 'Button link', type: 'text', half: true, placeholder: '/deals or /product/some-slug', hint: 'Use a path on your store.' },
        { name: 'image', publicIdField: 'imagePublicId', label: 'Image (optional)', type: 'image', folder: 'banners', hint: 'Wide images work best for hero slides.' },
        { name: 'startsAt', label: 'Show from (optional)', type: 'datetime', half: true },
        { name: 'endsAt', label: 'Hide after (optional)', type: 'datetime', half: true },
        { name: 'isActive', label: 'Active', type: 'toggle' },
      ]}
    />
  );
}
