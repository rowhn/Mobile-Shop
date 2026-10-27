import { useState } from 'react';
import { Badge, cx } from '../../components/ui';
import { CrudPage } from '../components';
import './Content.css';

const active = (v) => <Badge tone={v ? 'green' : 'gray'}>{v ? 'Active' : 'Hidden'}</Badge>;

/** FAQs + About / policy pages (tabs). */
export default function Content() {
  const [tab, setTab] = useState('faqs');
  return (
    <>
      <div className="pm-admin-tabs" role="tablist">
        {[['faqs', 'FAQs'], ['pages', 'Pages & policies']].map(([k, l]) => <button type="button" key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cx('pm-admin-tabs__tab', tab === k && 'is-active')}>{l}</button>)}
      </div>
      {tab === 'faqs' ? <Faqs /> : <Pages />}
    </>
  );
}

function Faqs() {
  return (
    <CrudPage
      title="FAQs" noun="FAQ" path="/admin/faqs" searchPlaceholder="Search questions"
      blank={{ question: '', answer: '', category: 'General', sortOrder: 0, isActive: true }}
      columns={[{ key: 'question', label: 'Question', render: (f) => <div><p className="fw-medium mb-0">{f.question}</p><p className="small text-muted mb-0">{f.category}</p></div> }, { key: 'isActive', label: 'Status', render: (f) => active(f.isActive) }]}
      fields={[
        { name: 'question', label: 'Question', type: 'text', required: true },
        { name: 'answer', label: 'Answer', type: 'textarea', rows: 5, required: true },
        { name: 'category', label: 'Category', type: 'text', half: true },
        { name: 'sortOrder', label: 'Sort order', type: 'number', half: true },
        { name: 'isActive', label: 'Visible', type: 'toggle' },
      ]}
    />
  );
}

function Pages() {
  return (
    <CrudPage
      title="Pages & policies" subtitle='Use "## Heading" for headings and "- item" for bullet lists.' noun="page" path="/admin/pages" searchPlaceholder="Search pages"
      blank={{ slug: '', title: '', kind: 'policy', summary: '', body: '', sortOrder: 0, isPublished: true }}
      columns={[{ key: 'title', label: 'Page', render: (p) => <div><p className="fw-medium mb-0">{p.title}</p><p className="small text-muted mb-0">{p.kind === 'policy' ? `/policies/${p.slug}` : `/${p.slug}`}</p></div> }, { key: 'kind', label: 'Type', render: (p) => <Badge tone="blue">{p.kind}</Badge> }, { key: 'isPublished', label: 'Status', render: (p) => <Badge tone={p.isPublished ? 'green' : 'gray'}>{p.isPublished ? 'Published' : 'Draft'}</Badge> }]}
      fields={[
        { name: 'title', label: 'Title', type: 'text', required: true },
        { name: 'slug', label: 'URL slug', type: 'text', half: true, required: true, hint: 'about and contact are used by the main menu pages.' },
        { name: 'kind', label: 'Type', type: 'select', half: true, options: [['policy', 'Policy (/policies/slug)'], ['info', 'Info page']] },
        { name: 'summary', label: 'Short summary', type: 'text' },
        { name: 'body', label: 'Content', type: 'textarea', rows: 12 },
        { name: 'sortOrder', label: 'Sort order', type: 'number', half: true },
        { name: 'isPublished', label: 'Published', type: 'toggle' },
      ]}
    />
  );
}
