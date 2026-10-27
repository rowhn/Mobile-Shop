import crypto from 'node:crypto';

export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const slugify = (s) =>
  String(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'item';

// No 0/O/1/I so codes are easy to read out over the phone.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const randomCode = (len = 6) =>
  Array.from({ length: len }, () => ALPHABET[crypto.randomInt(ALPHABET.length)]).join('');

export async function uniqueSlug(Model, base, excludeId) {
  const root = slugify(base);
  let slug = root;
  for (let i = 0; i < 6; i++) {
    const clash = await Model.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) });
    if (!clash) return slug;
    slug = `${root}-${randomCode(3).toLowerCase()}`;
  }
  return `${root}-${Date.now().toString(36)}`;
}

// Indian mobile numbers: keep the last 10 digits (drops +91 / spaces / dashes).
export const normalizePhone = (p) => String(p || '').replace(/\D/g, '').slice(-10);

export const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => k in obj).map((k) => [k, obj[k]]));

export function deepMerge(target, source) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return source;
  const out = { ...target };
  for (const [k, v] of Object.entries(source)) {
    out[k] =
      v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)
        ? deepMerge(target?.[k] && typeof target[k] === 'object' ? target[k] : {}, v)
        : v;
  }
  return out;
}

// Today's date (YYYY-MM-DD) and clock (HH:MM) in the store's timezone.
export function nowInZone(timeZone = 'Asia/Kolkata') {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t)?.value;
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}` };
}

export function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export const weekday = (dateStr) => new Date(`${dateStr}T00:00:00Z`).getUTCDay();
