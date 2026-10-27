import { EmptyState, Skeleton, cx } from '../../components/ui';
import './Table.css';

/** columns: [{ key, label, className, render(row) }]. Scrolls sideways on phones. */
export default function Table({ columns, rows, empty, onRowClick, loading }) {
  if (loading) return <div className="d-grid gap-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} style={{ height: 56 }} />)}</div>;
  if (!rows.length) return <EmptyState icon="inbox" title={empty || 'Nothing here yet'} />;
  return (
    <div className="table-responsive pm-admin-table">
      <table className="table align-middle mb-0">
        <thead>
          <tr>{columns.map((c) => <th key={c.key} scope="col" className={c.className}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} onClick={onRowClick ? () => onRowClick(r) : undefined} className={cx(onRowClick && 'is-clickable')}>
              {columns.map((c) => <td key={c.key} className={c.className}>{c.render ? c.render(r) : r[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
