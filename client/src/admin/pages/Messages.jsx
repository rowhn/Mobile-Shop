import { Badge, Button, ErrorState } from '../../components/ui';
import { PageHead, Table } from '../components';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/hooks.js';
import { dateTimeFmt } from '../../lib/format.js';
import { useToast } from '../../context/Toast.jsx';

/** Messages sent from the Contact page. */
export default function Messages() {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => api.get('/admin/messages'), []);
  const set = async (m, status) => { try { await api.patch(`/admin/messages/${m.id}`, { status }); reload(); } catch (e) { toast.error(e.message); } };
  const del = async (m) => { if (!window.confirm('Delete this message?')) return; try { await api.del(`/admin/messages/${m.id}`); reload(); } catch (e) { toast.error(e.message); } };
  return (
    <>
      <PageHead title="Messages" subtitle="From the Contact page." />
      {error ? <ErrorState error={error} onRetry={reload} /> : (
        <Table loading={loading} rows={data?.items || []} empty="No messages" columns={[
          { key: 'from', label: 'From', render: (m) => <div><p className="fw-medium mb-0">{m.name}</p><a className="small" href={`mailto:${m.email}`}>{m.email}</a>{m.phone && <p className="small text-muted mb-0">{m.phone}</p>}<p className="small text-muted mb-0">{dateTimeFmt(m.createdAt)}</p></div> },
          { key: 'message', label: 'Message', render: (m) => <div style={{ maxWidth: '28rem' }}>{m.subject && <p className="fw-medium mb-0">{m.subject}</p>}<p className="text-muted mb-0" style={{ whiteSpace: 'pre-wrap' }}>{m.message}</p></div> },
          { key: 'status', label: 'Status', render: (m) => <Badge tone={m.status === 'new' ? 'amber' : 'green'}>{m.status}</Badge> },
          { key: 'a', label: '', render: (m) => <div className="d-flex gap-2"><Button size="sm" variant="secondary" onClick={() => set(m, m.status === 'new' ? 'resolved' : 'new')}>{m.status === 'new' ? 'Resolve' : 'Reopen'}</Button><Button size="sm" variant="outline" onClick={() => del(m)}>Delete</Button></div> },
        ]} />
      )}
    </>
  );
}
