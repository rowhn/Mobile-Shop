import { useState } from 'react';
import { api } from '../../lib/api.js';
import { useAsync, useDebounced } from '../../lib/hooks.js';

/** List state shared by admin tables: search (debounced), page, filters, reload. */
export function useList(path, extra = {}) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const dq = useDebounced(q, 300);
  const key = JSON.stringify(extra);
  const res = useAsync((s) => api.get(path, { q: dq, page, ...extra }, s), [path, dq, page, key]);
  return { ...res, q, setQ: (v) => { setQ(v); setPage(1); }, page, setPage };
}
