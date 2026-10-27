import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import { Alert, Button, ErrorState, IconButton, Modal } from '../../components/ui';
import PageHead from './PageHead.jsx';
import SearchBar from './SearchBar.jsx';
import Table from './Table.jsx';
import Pager from './Pager.jsx';
import FormFields from './FormFields.jsx';
import { useList } from './useList.js';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/Toast.jsx';

/** Full list + create/edit modal + delete for simple resources (categories, coupons, banners, FAQs…). */
export default function CrudPage({ title, subtitle, path, columns, fields, blank, searchPlaceholder, noun = 'item', toPayload = (x) => x, filters, prepare = (x) => x, renderExtra }) {
  const toast = useToast();
  const list = useList(path, filters?.value);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const open = (item) => { setFormError(''); setEditing(item ? prepare({ ...item }) : { ...blank }); };
  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const body = toPayload(editing);
      editing.id ? await api.patch(`${path}/${editing.id}`, body) : await api.post(path, body);
      toast.success(`${noun[0].toUpperCase() + noun.slice(1)} saved`);
      setEditing(null);
      list.reload();
    } catch (err) { setFormError(err.message); } finally { setSaving(false); }
  };
  const remove = async (item) => {
    if (!window.confirm(`Delete this ${noun}? This cannot be undone.`)) return;
    try { await api.del(`${path}/${item.id}`); toast.success(`${noun[0].toUpperCase() + noun.slice(1)} deleted`); list.reload(); }
    catch (err) { toast.error(err.message); }
  };

  const cols = [...columns, {
    key: '_a', label: '', className: 'text-end-actions',
    render: (r) => (
      <div className="d-flex justify-content-end gap-1" onClick={(e) => e.stopPropagation()}>
        <IconButton icon="edit" label={`Edit ${noun}`} onClick={() => open(r)} />
        <IconButton icon="trash" label={`Delete ${noun}`} onClick={() => remove(r)} className="pm-admin-danger-hover" />
      </div>
    ),
  }];

  return (
    <>
      <PageHead title={title} subtitle={subtitle} action={<Button onClick={() => open(null)}><Icon name="plus" size={16} />Add {noun}</Button>} />
      <SearchBar value={list.q} onChange={list.setQ} placeholder={searchPlaceholder || `Search ${title.toLowerCase()}`}>{filters?.node}</SearchBar>
      {list.error ? <ErrorState error={list.error} onRetry={list.reload} /> : <Table columns={cols} rows={list.data?.items || []} loading={list.loading && !list.data} onRowClick={open} empty={`No ${title.toLowerCase()} yet`} />}
      <Pager data={list.data} page={list.page} setPage={list.setPage} />
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? `Edit ${noun}` : `New ${noun}`} wide={!!renderExtra}>
        <form onSubmit={save} className="d-grid gap-3">
          {formError && <Alert tone="error">{formError}</Alert>}
          {editing && <FormFields fields={fields} value={editing} onChange={setEditing} />}
          {editing && renderExtra?.(editing, setEditing)}
          <div className="d-flex justify-content-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
