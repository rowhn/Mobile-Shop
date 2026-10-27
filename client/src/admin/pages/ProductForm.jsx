import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { Alert, Button, ErrorState, Field, IconButton, Input, PageLoader, Select, Textarea, Toggle } from '../../components/ui';
import { Card, ImageUpload, PageHead } from '../components';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/hooks.js';
import { money } from '../../lib/format.js';
import { useToast } from '../../context/Toast.jsx';
import './ProductForm.css';

const EMPTY = { name: '', brand: '', category: '', shortDescription: '', description: '', images: [], price: '', discountPercent: 0, stock: 0, lowStockThreshold: 5, warranty: '', tags: '', isNewArrival: false, isFeatured: false, isOnSale: false, status: 'active', specifications: [], optionNames: '', variants: [] };

function fromProduct(p) {
  const names = [];
  p.variants.forEach((v) => v.options.forEach((o) => !names.includes(o.name) && names.push(o.name)));
  return {
    ...EMPTY, ...p, category: p.category?.id || p.category || '', tags: (p.tags || []).join(', '),
    optionNames: names.join(', '),
    variants: p.variants.map((v) => ({ sku: v.sku, price: v.price ?? '', stock: v.stock, values: names.map((n) => v.options.find((o) => o.name === n)?.value || ''), label: v.label })),
  };
}

function toPayload(f) {
  const names = f.optionNames.split(',').map((s) => s.trim()).filter(Boolean);
  const variants = f.variants.map((v) => {
    const options = names.map((name, i) => ({ name, value: (v.values[i] || '').trim() })).filter((o) => o.value);
    return { sku: v.sku.trim(), label: options.length ? options.map((o) => o.value).join(' / ') : (v.label || '').trim(), options, price: v.price === '' || v.price == null ? null : Number(v.price), stock: Number(v.stock) || 0 };
  });
  return {
    name: f.name.trim(), brand: f.brand.trim(), category: f.category, shortDescription: f.shortDescription, description: f.description,
    images: f.images.map(({ url, publicId }) => ({ url, publicId: publicId || '' })),
    price: Number(f.price), discountPercent: Number(f.discountPercent) || 0, stock: Number(f.stock) || 0, lowStockThreshold: Number(f.lowStockThreshold) || 0,
    warranty: f.warranty, tags: f.tags.split(',').map((s) => s.trim()).filter(Boolean),
    isNewArrival: f.isNewArrival, isFeatured: f.isFeatured, isOnSale: f.isOnSale, status: f.status,
    specifications: f.specifications.filter((s) => s.key.trim() && s.value.trim()).map((s) => ({ group: s.group || '', key: s.key.trim(), value: s.value.trim() })),
    variants,
  };
}

/** Add / edit one product. */
export default function ProductForm() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const toast = useToast();
  const cats = useAsync(() => api.get('/admin/categories', { limit: 100 }), []);
  const existing = useAsync(() => (isNew ? null : api.get(`/admin/products/${id}`)), [id]);
  const [f, setF] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (existing.data?.item) setF(fromProduct(existing.data.item)); }, [existing.data]);
  useEffect(() => { if (isNew && cats.data && !f.category && cats.data.items[0]) setF((x) => ({ ...x, category: cats.data.items[0].id })); }, [cats.data]); // eslint-disable-line

  if (existing.loading || cats.loading) return <PageLoader />;
  if (existing.error) return <ErrorState error={existing.error} onRetry={existing.reload} />;

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const num = (k) => (e) => setF({ ...f, [k]: e.target.value === '' ? '' : Number(e.target.value) });
  const names = f.optionNames.split(',').map((s) => s.trim()).filter(Boolean);
  const hasVariants = f.variants.length > 0;
  const mrp = Number(f.price) || 0;
  const final = Math.round(mrp * (1 - (Number(f.discountPercent) || 0) / 100));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = toPayload(f);
      if (isNew) { const r = await api.post('/admin/products', body); toast.success('Product created and live'); navigate(`/admin/products/${r.item.id}`, { replace: true }); }
      else { const r = await api.patch(`/admin/products/${id}`, body); setF(fromProduct(r.item)); toast.success('Changes saved and live'); }
    } catch (err) { setError(err.message); window.scrollTo({ top: 0, behavior: 'smooth' }); } finally { setSaving(false); }
  };

  const section = (title, children, hint) => <Card><h2 className="h6 fw-semibold mb-1">{title}</h2>{hint && <p className="small text-muted mb-3">{hint}</p>}<div className={hint ? '' : 'mt-3'}>{children}</div></Card>;
  const updateRow = (key, i, patch) => setF({ ...f, [key]: f[key].map((r, x) => (x === i ? { ...r, ...patch } : r)) });
  const removeRow = (key, i) => setF({ ...f, [key]: f[key].filter((_, x) => x !== i) });

  return (
    <form onSubmit={submit} className="pm-admin-pf">
      <PageHead title={isNew ? 'New product' : f.name || 'Edit product'} subtitle={isNew ? 'Fill in the details. It goes live as soon as you save (if Status is Active).' : undefined} action={<Button to="/admin/products" variant="secondary" size="sm">Back to products</Button>} />
      {error && <Alert tone="error">{error}</Alert>}

      {section('Basics', (
        <div className="row g-3">
          <Field label="Product name" className="col-12">{(i) => <Input id={i} required value={f.name} onChange={set('name')} maxLength={160} />}</Field>
          <Field label="Brand" className="col-12 col-md-6">{(i) => <Input id={i} required value={f.brand} onChange={set('brand')} />}</Field>
          <Field label="Category" className="col-12 col-md-6">{(i) => <Select id={i} required value={f.category} onChange={set('category')}>{cats.data.items.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>}</Field>
          <Field label="Short description" hint="Shown on product cards." className="col-12">{(i) => <Input id={i} value={f.shortDescription} onChange={set('shortDescription')} maxLength={300} />}</Field>
          <Field label="Full description" hint="Separate paragraphs with a blank line." className="col-12">{(i) => <Textarea id={i} rows={6} value={f.description} onChange={set('description')} />}</Field>
          <Field label="Tags" hint="Comma separated. Used by search, e.g. 5g, oled" className="col-12">{(i) => <Input id={i} value={f.tags} onChange={set('tags')} />}</Field>
          <Field label="Warranty" className="col-12">{(i) => <Input id={i} value={f.warranty} onChange={set('warranty')} placeholder="1 year manufacturer warranty" />}</Field>
        </div>
      ))}

      {section('Images', <ImageUpload value={f.images} onChange={(images) => setF({ ...f, images })} folder="products" />, 'The first image is the main one. Use square images for best results.')}

      {section('Pricing & stock', (
        <div className="row g-3">
          <Field label="Price / MRP (₹)" className="col-6 col-md-3">{(i) => <Input id={i} type="number" min="0" step="1" required value={f.price} onChange={num('price')} />}</Field>
          <Field label="Discount (%)" className="col-6 col-md-3">{(i) => <Input id={i} type="number" min="0" max="90" step="0.5" value={f.discountPercent} onChange={num('discountPercent')} />}</Field>
          <Field label="Stock" hint={hasVariants ? 'Managed per variant below' : undefined} className="col-6 col-md-3">{(i) => <Input id={i} type="number" min="0" disabled={hasVariants} value={hasVariants ? f.variants.reduce((n, v) => n + (Number(v.stock) || 0), 0) : f.stock} onChange={num('stock')} />}</Field>
          <Field label="Low-stock alert at" className="col-6 col-md-3">{(i) => <Input id={i} type="number" min="0" value={f.lowStockThreshold} onChange={num('lowStockThreshold')} />}</Field>
          <p className="small col-12 mb-0">Customers pay: <strong>{money(final)}</strong>{mrp > final && <span className="text-muted"> (MRP {money(mrp)}, saving {money(mrp - final)})</span>}</p>
        </div>
      ))}

      {section('Variants (colour, storage, size…)', (
        <>
          <Field label="Option names" hint='Comma separated, e.g. "Color, Storage". Leave empty and add no variants for a simple product.'>{(i) => <Input id={i} value={f.optionNames} onChange={set('optionNames')} placeholder="Color, Storage" />}</Field>
          {f.variants.length > 0 && (
            <div className="table-responsive mt-3">
              <table className="table table-borderless align-middle mb-0 pm-admin-pf__variants">
                <thead><tr><th>SKU</th>{names.map((n) => <th key={n}>{n}</th>)}<th>MRP (optional)</th><th>Stock</th><th /></tr></thead>
                <tbody>
                  {f.variants.map((v, i) => (
                    <tr key={i}>
                      <td><Input aria-label="SKU" required value={v.sku} onChange={(e) => updateRow('variants', i, { sku: e.target.value })} /></td>
                      {names.map((n, k) => <td key={n}><Input aria-label={n} required value={v.values[k] || ''} onChange={(e) => updateRow('variants', i, { values: names.map((_, x) => (x === k ? e.target.value : v.values[x] || '')) })} /></td>)}
                      <td><Input aria-label="Variant price" type="number" min="0" placeholder={String(f.price || '')} value={v.price} onChange={(e) => updateRow('variants', i, { price: e.target.value })} /></td>
                      <td><Input aria-label="Variant stock" type="number" min="0" required value={v.stock} onChange={(e) => updateRow('variants', i, { stock: e.target.value })} style={{ width: '6rem' }} /></td>
                      <td><IconButton icon="trash" label="Remove variant" className="pm-admin-danger-hover" type="button" onClick={() => removeRow('variants', i)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={() => setF({ ...f, variants: [...f.variants, { sku: '', price: '', stock: 0, values: names.map(() => ''), label: '' }] })}><Icon name="plus" size={16} />Add variant</Button>
        </>
      ))}

      {section('Specifications', (
        <>
          {f.specifications.map((s, i) => (
            <div key={i} className="pm-admin-pf__spec">
              <Input aria-label="Group" placeholder="Group (e.g. Display)" value={s.group} onChange={(e) => updateRow('specifications', i, { group: e.target.value })} />
              <Input aria-label="Name" placeholder="Name" value={s.key} onChange={(e) => updateRow('specifications', i, { key: e.target.value })} />
              <Input aria-label="Value" placeholder="Value" value={s.value} onChange={(e) => updateRow('specifications', i, { value: e.target.value })} />
              <IconButton icon="trash" label="Remove spec" type="button" className="pm-admin-danger-hover" onClick={() => removeRow('specifications', i)} />
            </div>
          ))}
          <Button type="button" variant="secondary" size="sm" onClick={() => setF({ ...f, specifications: [...f.specifications, { group: f.specifications.at(-1)?.group || '', key: '', value: '' }] })}><Icon name="plus" size={16} />Add specification</Button>
        </>
      ))}

      {section('Visibility', (
        <div className="row g-3">
          <div className="col-12 col-md-6">
            <div className="pm-admin-pf__flags">
              <Toggle checked={f.isNewArrival} onChange={(v) => setF({ ...f, isNewArrival: v })} label="New arrival" description="Appears on the homepage and New Arrivals page." />
              <Toggle checked={f.isFeatured} onChange={(v) => setF({ ...f, isFeatured: v })} label="Featured" description="Appears in the homepage Featured section." />
              <Toggle checked={f.isOnSale} onChange={(v) => setF({ ...f, isOnSale: v })} label="On sale" description="Shown on Deals even without a discount. Products with a discount % are always on Deals." />
            </div>
          </div>
          <Field label="Status" hint="Draft and Archived products are hidden from the store." className="col-12 col-md-6">{(i) => <Select id={i} value={f.status} onChange={set('status')}><option value="active">Active (visible)</option><option value="draft">Draft (hidden)</option><option value="archived">Archived (hidden)</option></Select>}</Field>
        </div>
      ))}

      <div className="pm-admin-sticky-save">
        <div className="pm-admin-sticky-save__inner">
          <p className="small text-muted mb-0 d-none d-sm-block">{isNew ? 'Not saved yet' : 'Saving updates the live store immediately.'}</p>
          <div className="ms-auto d-flex gap-2">
            {!isNew && existing.data?.item.status === 'active' && <Button type="button" variant="secondary" href={`/product/${existing.data.item.slug}`} target="_blank" rel="noreferrer">View on store<Icon name="external" size={16} /></Button>}
            <Button type="submit" loading={saving}>{isNew ? 'Create product' : 'Save changes'}</Button>
          </div>
        </div>
      </div>
    </form>
  );
}
