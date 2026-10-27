const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
export const money = (n) => inr.format(Number(n) || 0);

export const dateFmt = (d, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  d ? new Intl.DateTimeFormat('en-IN', opts).format(new Date(d)) : '';
export const dateTimeFmt = (d) => dateFmt(d, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export const label = (s = '') => String(s).replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

export const savings = (p) => (p.listMrp > p.finalPrice ? p.listMrp - p.finalPrice : 0);

export const slotLabel = (slot = '') => {
  const to12 = (t) => {
    const [h, m] = t.split(':').map(Number);
    const hh = h % 12 || 12;
    return `${hh}${m ? ':' + String(m).padStart(2, '0') : ''} ${h < 12 ? 'AM' : 'PM'}`;
  };
  const [a, b] = slot.split('-');
  return a && b ? `${to12(a)} – ${to12(b)}` : slot;
};

export const todayISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
export const addDaysISO = (iso, n) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export const STATUS_TONE = {
  pending_payment: 'amber', placed: 'blue', confirmed: 'blue', processing: 'blue', shipped: 'violet', delivered: 'green', cancelled: 'red',
  pending: 'amber', paid: 'green', failed: 'red', refund_pending: 'amber', refunded: 'gray',
  booked: 'blue', received: 'blue', diagnosing: 'violet', awaiting_approval: 'amber', approved: 'blue', in_repair: 'violet', ready: 'green', completed: 'green', declined: 'red',
};
