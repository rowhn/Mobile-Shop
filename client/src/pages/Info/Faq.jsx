import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Accordion } from 'react-bootstrap';
import { ErrorState, Skeleton, cx } from '../../components/ui';
import { api } from '../../lib/api.js';
import { useAsync, usePageTitle } from '../../lib/hooks.js';
import './Faq.css';

export default function Faq() {
  usePageTitle('FAQ');
  const { data, loading, error, reload } = useAsync(() => api.get('/faqs'), []);
  const [filter, setFilter] = useState('All');
  const cats = data ? ['All', ...new Set(data.items.map((f) => f.category))] : [];
  const items = data ? data.items.filter((f) => filter === 'All' || f.category === filter) : [];
  return (
    <div className="container pm-faq">
      <h1 className="page-title">Frequently asked questions</h1>
      {error ? <ErrorState error={error} onRetry={reload} /> : loading ? <Skeleton className="mt-4" style={{ height: 256 }} /> : (
        <>
          <div className="d-flex flex-wrap gap-2 mt-4">
            {cats.map((c) => <button type="button" key={c} onClick={() => setFilter(c)} className={cx('pm-faq__chip', filter === c && 'is-on')}>{c}</button>)}
          </div>
          <Accordion flush className="pm-faq__list mt-4">
            {items.map((f) => (
              <Accordion.Item eventKey={f.id} key={f.id}>
                <Accordion.Header as="h2">{f.question}</Accordion.Header>
                <Accordion.Body>{f.answer}</Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
          <p className="mt-5 text-muted">Still need help? <Link to="/contact" className="fw-medium text-accent">Contact us</Link>.</p>
        </>
      )}
    </div>
  );
}
