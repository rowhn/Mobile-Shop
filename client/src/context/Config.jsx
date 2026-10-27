import { createContext, useContext, useMemo } from 'react';
import { api } from '../lib/api.js';
import { useAsync } from '../lib/hooks.js';
import siteConfig, { directionsLink, whatsappLink } from '../config/siteConfig.js';

const ConfigCtx = createContext(null);
export const useConfig = () => useContext(ConfigCtx);

const FALLBACK = {
  store: { announcement: { isActive: false }, social: {} },
  shipping: { fee: 99, freeAbove: 2999 },
  payments: { razorpay: false, cod: true },
  repair: { methods: {}, warrantyDays: 90, advanceDays: 30, weeklyOff: [0] },
  uploadsEnabled: false,
};

/** Value typed in Admin → Settings wins; blank falls back to client/src/config/siteConfig.js. */
const pick = (fromDb, fromFile) => (fromDb && String(fromDb).trim() ? fromDb : fromFile);

function mergeStore(db = {}) {
  const social = {};
  Object.keys({ ...siteConfig.social, ...(db.social || {}) }).forEach((k) => {
    social[k] = pick(db.social?.[k], siteConfig.social[k] || '');
  });
  const address = pick(db.address, siteConfig.address);
  return {
    ...db,
    name: pick(db.name, siteConfig.shopName),
    tagline: pick(db.tagline, siteConfig.tagline),
    supportEmail: pick(db.supportEmail, siteConfig.email),
    supportPhone: pick(db.supportPhone, siteConfig.phoneDisplay),
    phoneDial: db.supportPhone ? String(db.supportPhone).replace(/[^\d+]/g, '') : siteConfig.phoneDial,
    whatsapp: pick(db.whatsapp, siteConfig.whatsappNumber),
    address,
    hours: pick(db.hours, siteConfig.hours),
    social,
    mapsLink: siteConfig.mapsLink,
    directionsUrl: directionsLink(address, siteConfig.mapsLink),
    whatsappUrl: whatsappLink(siteConfig.whatsappMessage, pick(db.whatsapp, siteConfig.whatsappNumber)),
    marquee: siteConfig.marquee,
  };
}

/** Store-wide public settings (name, contact, shipping rules, which payment methods are live). */
export function ConfigProvider({ children }) {
  const { data, error, reload } = useAsync(() => api.get('/config'), []);
  const value = useMemo(() => {
    const base = data || FALLBACK;
    return { ...base, store: mergeStore(base.store), ready: Boolean(data), error, reload };
  }, [data, error, reload]);
  return <ConfigCtx.Provider value={value}>{children}</ConfigCtx.Provider>;
}
