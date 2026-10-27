import { Field, Input, Select, Textarea, Toggle } from '../../components/ui';
import ImageUpload from './ImageUpload.jsx';
import './FormFields.css';

const toLocalInput = (iso) => { const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };

/**
 * Builds a form from a field list.
 * Field config: { name, label, type: text|textarea|number|select|toggle|datetime|image, options, hint, required, half, rows, min, placeholder, folder }
 */
export default function FormFields({ fields, value, onChange, errors = {} }) {
  const set = (name, v) => onChange({ ...value, [name]: v });
  return (
    <div className="row g-3">
      {fields.map((f) => {
        const v = value[f.name];
        const col = f.half ? 'col-12 col-md-6' : 'col-12';
        if (f.type === 'toggle') return <div key={f.name} className={col}><div className="pm-admin-toggle-box"><Toggle checked={!!v} onChange={(x) => set(f.name, x)} label={f.label} description={f.hint} /></div></div>;
        if (f.type === 'image') return <Field key={f.name} label={f.label} hint={f.hint} className={col}><ImageUpload multiple={false} folder={f.folder} value={v ? [{ url: v, publicId: value[f.publicIdField] || '' }] : []} onChange={(l) => onChange({ ...value, [f.name]: l[0]?.url || '', ...(f.publicIdField ? { [f.publicIdField]: l[0]?.publicId || '' } : {}) })} /></Field>;
        return (
          <Field key={f.name} label={f.label} hint={f.hint} error={errors[f.name]} className={col}>
            {(id) => f.type === 'textarea' ? <Textarea id={id} rows={f.rows || 4} value={v ?? ''} onChange={(e) => set(f.name, e.target.value)} required={f.required} /> :
              f.type === 'select' ? <Select id={id} value={v ?? ''} onChange={(e) => set(f.name, e.target.value)}>{f.options.map(([val, l]) => <option key={val} value={val}>{l}</option>)}</Select> :
              f.type === 'datetime' ? <Input id={id} type="datetime-local" value={v ? toLocalInput(v) : ''} onChange={(e) => set(f.name, e.target.value ? new Date(e.target.value).toISOString() : null)} /> :
              <Input id={id} type={f.type === 'number' ? 'number' : 'text'} step={f.type === 'number' ? 'any' : undefined} min={f.min} value={v ?? ''} onChange={(e) => set(f.name, f.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)} required={f.required} placeholder={f.placeholder} />}
          </Field>
        );
      })}
    </div>
  );
}
