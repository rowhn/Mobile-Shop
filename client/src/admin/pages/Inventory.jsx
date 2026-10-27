import { useState } from 'react';
import { ProductImage } from '../../components/ProductCard.jsx';
import { Button, ErrorState, Input } from '../../components/ui';
import { PageHead, SearchBar, StockBadge, Table, useList } from '../components';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/Toast.jsx';

export default function Inventory() {
  const toast = useToast();
  const [low, setLow] = useState(false);
  const list = useList('/admin/inventory', { low: low || undefined });
  const [edits, setEdits] = useState({});
  const key = (r) => `${r.productId}:${r.sku}`;

  const save = async (r) => {
    const v = edits[key(r)];
    if (v === undefined || v === '' || Number(v) < 0) return;
    try { await api.patch('/admin/inventory', { productId: r.productId, sku: r.sku, stock: Number(v) }); toast.success('Stock updated'); setEdits(({ [key(r)]: _, ...rest }) => rest); list.reload(); }
    catch (err) { toast.error(err.message); }
  };
  const columns = [
    { key: 'name', label: 'Product', render: (r) => <div className="d-flex align-items-center gap-3"><ProductImage product={{ name: r.name, images: r.image ? [{ url: r.image }] : [] }} className="pm-admin-thumb" /><div><p className="fw-medium mb-0">{r.name}</p><p className="small text-muted mb-0">{r.brand}</p></div></div> },
    { key: 'label', label: 'Variant', render: (r) => (r.sku ? <span>{r.label}<span className="d-block small text-muted">{r.sku}</span></span> : <span className="text-muted">—</span>) },
    { key: 'stock', label: 'In stock', render: (r) => <StockBadge n={r.stock} threshold={r.threshold} /> },
    { key: 'set', label: 'Set stock', render: (r) => <form className="d-flex gap-2" onSubmit={(e) => { e.preventDefault(); save(r); }}><Input type="number" min="0" aria-label={`New stock for ${r.name}`} value={edits[key(r)] ?? ''} placeholder={String(r.stock)} onChange={(e) => setEdits({ ...edits, [key(r)]: e.target.value })} style={{ width: '6rem' }} /><Button type="submit" size="sm" variant="secondary" disabled={edits[key(r)] === undefined || edits[key(r)] === ''}>Save</Button></form> },
  ];
  return (
    <>
      <PageHead title="Inventory" subtitle="Quick stock counts. Orders reduce stock automatically." />
      <SearchBar value={list.q} onChange={list.setQ} placeholder="Search product, brand or SKU">
        <label className="d-flex align-items-center gap-2 small"><input type="checkbox" className="form-check-input mt-0" checked={low} onChange={(e) => setLow(e.target.checked)} />Low / out of stock only</label>
      </SearchBar>
      {list.error ? <ErrorState error={list.error} onRetry={list.reload} /> : <Table columns={columns} rows={(list.data?.items || []).map((r) => ({ ...r, id: key(r) }))} loading={list.loading && !list.data} empty="No stock rows" />}
    </>
  );
}
