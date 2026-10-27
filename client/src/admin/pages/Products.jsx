import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { ProductImage } from '../../components/ProductCard.jsx';
import { Badge, Button, ErrorState, IconButton, Select } from '../../components/ui';
import { PageHead, Pager, SearchBar, StockBadge, Table, useList } from '../components';
import { api } from '../../lib/api.js';
import { money } from '../../lib/format.js';
import { useToast } from '../../context/Toast.jsx';

export default function Products() {
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [flag, setFlag] = useState('');
  const list = useList('/admin/products', { status, ...(flag ? { [flag]: 'true' } : {}) });
  const navigate = useNavigate();

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}" permanently? Past orders keep their details. To just hide it, set the status to Draft or Archived instead.`)) return;
    try { await api.del(`/admin/products/${p.id}`); toast.success('Product deleted'); list.reload(); } catch (err) { toast.error(err.message); }
  };
  const columns = [
    { key: 'name', label: 'Product', render: (p) => <div className="d-flex align-items-center gap-3"><ProductImage product={p} className="pm-admin-thumb" /><div className="min-w-0"><p className="fw-medium mb-0 text-truncate">{p.name}</p><p className="small text-muted mb-0">{p.brand} · {p.category?.name}</p></div></div> },
    { key: 'price', label: 'Price', render: (p) => <div>{money(p.finalPrice)}{p.discountPercent > 0 && <span className="ms-1 small text-muted text-decoration-line-through">{money(p.listMrp)}</span>}</div> },
    { key: 'stock', label: 'Stock', render: (p) => <StockBadge n={p.totalStock} threshold={p.lowStockThreshold} /> },
    { key: 'flags', label: 'Tags', render: (p) => <div className="d-flex flex-wrap gap-1">{p.isNewArrival && <Badge tone="blue">New</Badge>}{p.isFeatured && <Badge tone="violet">Featured</Badge>}{(p.isOnSale || p.discountPercent > 0) && <Badge tone="red">Sale</Badge>}</div> },
    { key: 'status', label: 'Status', render: (p) => <Badge tone={p.status === 'active' ? 'green' : p.status === 'draft' ? 'amber' : 'gray'}>{p.status}</Badge> },
    { key: 'a', label: '', className: 'text-end-actions', render: (p) => <div className="d-flex justify-content-end gap-1" onClick={(e) => e.stopPropagation()}><IconButton icon="edit" label="Edit" onClick={() => navigate(`/admin/products/${p.id}`)} /><IconButton icon="trash" label="Delete" className="pm-admin-danger-hover" onClick={() => remove(p)} /></div> },
  ];
  return (
    <>
      <PageHead title="Products" subtitle="Changes appear on the live store immediately." action={<Button to="/admin/products/new"><Icon name="plus" size={16} />Add product</Button>} />
      <SearchBar value={list.q} onChange={list.setQ} placeholder="Search name, brand, SKU or tag">
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto" aria-label="Status"><option value="">All statuses</option><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option></Select>
        <Select value={flag} onChange={(e) => setFlag(e.target.value)} className="w-auto" aria-label="Tag"><option value="">All tags</option><option value="isNewArrival">New arrivals</option><option value="isFeatured">Featured</option><option value="isOnSale">On sale</option></Select>
      </SearchBar>
      {list.error ? <ErrorState error={list.error} onRetry={list.reload} /> : <Table columns={columns} rows={list.data?.items || []} loading={list.loading && !list.data} onRowClick={(p) => navigate(`/admin/products/${p.id}`)} empty="No products match" />}
      <Pager data={list.data} page={list.page} setPage={list.setPage} />
    </>
  );
}
