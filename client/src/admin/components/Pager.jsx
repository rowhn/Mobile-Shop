import { Button } from '../../components/ui';

export default function Pager({ data, page, setPage }) {
  if (!data || data.pages <= 1) return null;
  return (
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3 small text-muted">
      <span>{data.total} total</span>
      <div className="d-flex align-items-center gap-2">
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
        <span>Page {page} of {data.pages}</span>
        <Button size="sm" variant="outline" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</Button>
      </div>
    </div>
  );
}
