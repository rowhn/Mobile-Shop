import { Link, useParams } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { Button, ErrorState, PageLoader } from '../../components/ui';
import { api } from '../../lib/api.js';
import { useAsync, usePageTitle } from '../../lib/hooks.js';
import RichText from './RichText.jsx';
import './CmsPage.css';

/** Text pages written in Admin → Content (About, policies…). */
export default function CmsPage({ slug: fixedSlug }) {
  const params = useParams();
  const slug = fixedSlug || params.slug;
  const { data, loading, error, reload } = useAsync(() => api.get(`/pages/${slug}`), [slug]);
  usePageTitle(data?.page.title);
  if (loading) return <PageLoader />;
  if (error) return <div className="container"><ErrorState error={error} onRetry={error.status === 404 ? undefined : reload} title={error.status === 404 ? 'Page not found' : undefined} /><div className="text-center"><Button to="/" variant="secondary">Back home</Button></div></div>;
  const p = data.page;
  return (
    <article className="container pm-cms">
      {p.kind === 'policy' && <Link to="/policies" className="pm-cms__back"><Icon name="chevronLeft" size={16} />All policies</Link>}
      <h1 className="page-title">{p.title}</h1>
      {p.summary && <p className="fs-5 text-muted mt-3">{p.summary}</p>}
      <div className="mt-4"><RichText text={p.body} /></div>
      {p.slug === 'about' && <div className="d-flex flex-wrap gap-3 mt-5"><Button to="/shop">Shop products</Button><Button to="/repair" variant="secondary">Repair Center</Button></div>}
    </article>
  );
}
