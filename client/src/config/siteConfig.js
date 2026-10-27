/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  SHOP DETAILS: EDIT THIS ONE FILE TO CHANGE THE WHOLE WEBSITE    ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * Everything below appears automatically in the navbar, footer, contact
 * page, WhatsApp button, "Navigate me" button and the scrolling banner.
 *
 * Note: if you type a value in Admin → Settings, that value wins over this
 * file. Leave the field blank in Admin → Settings to use the value from here.
 */
const siteConfig = {
  // ── Shop identity ────────────────────────────────────────────────
  shopName: 'Pranay Mobiles',
  tagline: 'Mobiles, accessories & expert repairs in Ghugus.',

  // ── Contact ──────────────────────────────────────────────────────
  phoneDisplay: '+91 96239 46928', // shown on the website
  phoneDial: '+919623946928', // used for tap-to-call
  whatsappNumber: '919623946928', // country code + number, digits only (no + or spaces)
  email: '', // optional: e.g. 'hello@pranaymobiles.in'
  hours: 'Mon–Sun, 10:00 AM – 9:00 PM', // ← change to your real opening hours

  // ── Address & map ────────────────────────────────────────────────
  address: 'Bank Of India Rd, Ghugus Basti, Ghugus, Maharashtra 442505',
  // Optional: paste a Google Maps share link here to make "Navigate me" open
  // your exact pin. Leave blank to search by the address above.
  mapsLink: '',

  // ── WhatsApp pre-written message (customer can edit before sending) ─
  whatsappMessage:
    'Hello Pranay Mobiles! 👋 I visited your website and would like some information about your mobiles / accessories / repair services. Please get in touch.',

  // ── Social media: paste each link between the quotes ─────────────
  // Leave '' to hide an icon; filled links appear automatically in the footer & contact page.
  social: {
    instagram: 'https://www.instagram.com/pranay_mobiles_ghugus/',
    facebook: '', // ← paste your Facebook page link here
    youtube: '', // ← paste your YouTube channel link here
    x: '', // ← paste your X (Twitter) link here
    telegram: '', // ← paste your Telegram link here
    justdial: '', // ← paste your Justdial / Google Business link here
  },

  // ── Scrolling advertising banner (marquee) under the navbar ──────
  marquee: {
    enabled: true,
    speedSeconds: 28, // lower = faster
    messages: [
      '📱 Latest smartphones & accessories at the best prices',
      '🔧 Screen, battery & charging-port repairs, same day*',
      '💬 Chat with us on WhatsApp: +91 96239 46928',
      '📍 Visit us: Bank Of India Rd, Ghugus',
      '🎁 Ask about exchange offers & EMI',
    ],
  },
};

/* ───────────────────────── helpers (no need to edit below) ───────────────────────── */

export const whatsappLink = (message = siteConfig.whatsappMessage, number = siteConfig.whatsappNumber) =>
  `https://wa.me/${String(number).replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;

export const directionsLink = (address = siteConfig.address, mapsLink = siteConfig.mapsLink) =>
  mapsLink || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${siteConfig.shopName}, ${address}`)}`;

export const mapEmbedLink = (address = siteConfig.address) =>
  `https://www.google.com/maps?q=${encodeURIComponent(`${siteConfig.shopName}, ${address}`)}&output=embed`;

export default siteConfig;
