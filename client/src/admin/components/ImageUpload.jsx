import { useRef, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import { Alert, Button, Input, Spinner } from '../../components/ui';
import { api } from '../../lib/api.js';
import { useConfig } from '../../context/Config.jsx';
import { useToast } from '../../context/Toast.jsx';
import './ImageUpload.css';

/** Uploads to Cloudinary through the API. If uploads aren't configured, admins can still paste an image URL. */
export default function ImageUpload({ value = [], onChange, multiple = true, folder = 'products', max = 10 }) {
  const toast = useToast();
  const { uploadsEnabled } = useConfig();
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState('');
  const input = useRef(null);

  const upload = async (files) => {
    if (!files.length) return;
    const fd = new FormData();
    fd.append('folder', folder);
    [...files].slice(0, max - value.length).forEach((f) => fd.append('images', f));
    setBusy(true);
    try {
      const r = await api.upload('/admin/upload', fd);
      onChange(multiple ? [...value, ...r.images] : r.images.slice(0, 1));
    } catch (err) { toast.error(err.message); } finally { setBusy(false); if (input.current) input.current.value = ''; }
  };
  const addUrl = () => {
    try { new URL(url); } catch { toast.error('Enter a full image URL starting with https://'); return; }
    onChange(multiple ? [...value, { url, publicId: '' }] : [{ url, publicId: '' }]);
    setUrl('');
  };
  const move = (i, d) => { const n = [...value]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; onChange(n); };

  return (
    <div>
      <ul className="pm-admin-imgs">
        {value.map((img, i) => (
          <li key={img.url + i} className="pm-admin-imgs__item">
            <img src={img.url} alt="" />
            {i === 0 && multiple && <span className="pm-admin-imgs__main">Main</span>}
            <div className="pm-admin-imgs__tools">
              {multiple && <button type="button" onClick={() => move(i, -1)} aria-label="Move left"><Icon name="chevronLeft" size={16} /></button>}
              <button type="button" onClick={() => onChange(value.filter((_, x) => x !== i))} aria-label="Remove image"><Icon name="trash" size={16} /></button>
              {multiple && <button type="button" onClick={() => move(i, 1)} aria-label="Move right"><Icon name="chevronRight" size={16} /></button>}
            </div>
          </li>
        ))}
        {value.length < max && (
          <li>
            <button type="button" disabled={!uploadsEnabled || busy} onClick={() => input.current?.click()} className="pm-admin-imgs__add">
              {busy ? <Spinner /> : <Icon name="upload" />}{busy ? 'Uploading' : 'Upload'}
            </button>
          </li>
        )}
      </ul>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple={multiple} hidden onChange={(e) => upload(e.target.files)} />
      {!uploadsEnabled && <Alert tone="warn" className="mb-3">Image uploads are not configured yet (add Cloudinary keys to the server <code>.env</code>). You can paste an image URL below meanwhile.</Alert>}
      <div className="d-flex gap-2">
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="…or paste an image URL" aria-label="Image URL" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrl())} />
        <Button type="button" variant="secondary" size="sm" onClick={addUrl} disabled={!url}>Add</Button>
      </div>
    </div>
  );
}
