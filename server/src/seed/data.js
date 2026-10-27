// Demo data. EVERYTHING here is a placeholder: brands are fictional, prices and repair estimates are illustrative.
// Replace it all from the admin dashboard (or run `npm run seed:reset` to restore it).

export const categories = [
  { name: 'Smartphones', slug: 'smartphones', icon: 'phone', description: 'Flagship to everyday phones.' },
  { name: 'Laptops', slug: 'laptops', icon: 'laptop', description: 'Thin, fast and built to last.' },
  { name: 'Tablets', slug: 'tablets', icon: 'tablet', description: 'Big screens for work and play.' },
  { name: 'Audio', slug: 'audio', icon: 'headphones', description: 'Earbuds, headphones and speakers.' },
  { name: 'Wearables', slug: 'wearables', icon: 'watch', description: 'Smartwatches and fitness bands.' },
  { name: 'Accessories', slug: 'accessories', icon: 'plug', description: 'Chargers, cases, cables and power.' },
];

const spec = (group, key, value) => ({ group, key, value });

export const products = [
  {
    cat: 'smartphones', brand: 'NOVA', name: 'Phone 2 Pro', price: 79999, discountPercent: 0, isFeatured: true, isNewArrival: true,
    shortDescription: 'Titanium frame, 6.7" 120 Hz OLED and a triple camera system.',
    description: 'Phone 2 Pro pairs a lightweight titanium frame with a bright 120 Hz OLED display and an all-day battery.\n\nThe triple camera system handles low light and portraits with ease, and 45W fast charging gets you from 0 to 60% in about 25 minutes.',
    tags: ['5g', 'flagship', 'oled'], warranty: '1 year manufacturer warranty',
    specifications: [
      spec('Display', 'Screen', '6.7" LTPO OLED, 120 Hz'), spec('Display', 'Resolution', '2780 × 1284'),
      spec('Performance', 'Chipset', 'Octa-core 4 nm'), spec('Performance', 'RAM', '12 GB'),
      spec('Camera', 'Rear', '50 MP main + 12 MP ultra-wide + 12 MP 3× tele'), spec('Camera', 'Front', '12 MP'),
      spec('Battery', 'Capacity', '5000 mAh'), spec('Battery', 'Charging', '45 W wired, 15 W wireless'),
      spec('Build', 'Frame', 'Grade-5 titanium'), spec('Build', 'Water resistance', 'IP68'),
    ],
    variants: [
      { sku: 'NP2P-BLK-256', options: { Color: 'Titan Black', Storage: '256 GB' }, stock: 14 },
      { sku: 'NP2P-SLV-256', options: { Color: 'Frost Silver', Storage: '256 GB' }, stock: 9 },
      { sku: 'NP2P-BLK-512', options: { Color: 'Titan Black', Storage: '512 GB' }, price: 89999, stock: 6 },
      { sku: 'NP2P-SLV-512', options: { Color: 'Frost Silver', Storage: '512 GB' }, price: 89999, stock: 0 },
    ],
  },
  {
    cat: 'smartphones', brand: 'NOVA', name: 'Phone 2', price: 59999, discountPercent: 5, isNewArrival: true,
    shortDescription: 'The everyday flagship: 6.3" OLED, dual camera, 5G.',
    description: 'A compact 6.3" OLED phone that does everything well, with a dual camera system, 5G and two-day battery life in typical use.',
    tags: ['5g', 'oled'], warranty: '1 year manufacturer warranty',
    specifications: [spec('Display', 'Screen', '6.3" OLED, 120 Hz'), spec('Performance', 'RAM', '8 GB'), spec('Battery', 'Capacity', '4500 mAh'), spec('Camera', 'Rear', '50 MP + 12 MP ultra-wide')],
    variants: [
      { sku: 'NP2-GRN-128', options: { Color: 'Sage', Storage: '128 GB' }, stock: 20 },
      { sku: 'NP2-GRN-256', options: { Color: 'Sage', Storage: '256 GB' }, price: 64999, stock: 11 },
      { sku: 'NP2-WHT-128', options: { Color: 'Cloud', Storage: '128 GB' }, stock: 17 },
      { sku: 'NP2-WHT-256', options: { Color: 'Cloud', Storage: '256 GB' }, price: 64999, stock: 8 },
    ],
  },
  {
    cat: 'smartphones', brand: 'Aero', name: 'A5 5G', price: 34999, discountPercent: 8, isFeatured: true,
    shortDescription: '6.5" AMOLED, 64 MP camera and a 5000 mAh battery.',
    description: 'A5 5G brings a vivid AMOLED display and a capable camera to a sensible price.',
    tags: ['5g', 'amoled'], warranty: '1 year manufacturer warranty',
    specifications: [spec('Display', 'Screen', '6.5" AMOLED, 120 Hz'), spec('Camera', 'Rear', '64 MP + 8 MP'), spec('Battery', 'Capacity', '5000 mAh'), spec('Battery', 'Charging', '33 W')],
    variants: [
      { sku: 'AA5-BLU-128', options: { Color: 'Ocean Blue', Storage: '128 GB' }, stock: 30 },
      { sku: 'AA5-BLK-256', options: { Color: 'Charcoal', Storage: '256 GB' }, price: 38999, stock: 3 },
    ],
  },
  {
    cat: 'smartphones', brand: 'Kite', name: 'K3 Lite', price: 17999, discountPercent: 12, isOnSale: true,
    shortDescription: 'Big battery, smooth 90 Hz display, honest price.',
    description: 'K3 Lite covers the basics brilliantly: a 90 Hz display, a 6000 mAh battery and clean software.',
    tags: ['budget', '4g'], warranty: '1 year manufacturer warranty', stock: 42,
    specifications: [spec('Display', 'Screen', '6.6" LCD, 90 Hz'), spec('Battery', 'Capacity', '6000 mAh'), spec('Camera', 'Rear', '50 MP + 2 MP')],
    variants: [],
  },
  {
    cat: 'laptops', brand: 'Lumen', name: 'Air 14', price: 94900, discountPercent: 0, isFeatured: true,
    shortDescription: '14" 2.8K OLED, 1.2 kg, up to 18 hours of battery.',
    description: 'Air 14 is a featherweight aluminium laptop with a stunning OLED display, a silent fanless design and all-day battery life.',
    tags: ['ultrabook', 'oled'], warranty: '1 year manufacturer warranty',
    specifications: [spec('Display', 'Screen', '14" 2.8K OLED, 120 Hz'), spec('Performance', 'Memory', '16 GB unified'), spec('Battery', 'Life', 'Up to 18 hours'), spec('Build', 'Weight', '1.2 kg'), spec('Ports', 'I/O', '2× USB-C (Thunderbolt), 1× USB-A, headphone jack')],
    variants: [
      { sku: 'LA14-SLV-512', options: { Color: 'Silver', Storage: '512 GB' }, stock: 7 },
      { sku: 'LA14-GRY-512', options: { Color: 'Space Grey', Storage: '512 GB' }, stock: 5 },
      { sku: 'LA14-GRY-1TB', options: { Color: 'Space Grey', Storage: '1 TB' }, price: 109900, stock: 4 },
    ],
  },
  {
    cat: 'laptops', brand: 'Vertex', name: 'Studio 16', price: 129900, discountPercent: 0, isFeatured: true,
    shortDescription: '16" creator laptop with a discrete GPU and colour-accurate display.',
    description: 'Built for editors, designers and developers: a 16" colour-accurate display, a discrete GPU and a keyboard that feels great for long sessions.',
    tags: ['creator', 'gpu'], warranty: '2 year manufacturer warranty', stock: 6,
    specifications: [spec('Display', 'Screen', '16" 4K IPS, 100% DCI-P3'), spec('Performance', 'Memory', '32 GB'), spec('Performance', 'Storage', '1 TB NVMe SSD'), spec('Graphics', 'GPU', '8 GB discrete')],
    variants: [],
  },
  {
    cat: 'laptops', brand: 'Kite', name: 'Book 15', price: 49990, discountPercent: 10, isOnSale: true,
    shortDescription: '15.6" full-HD, 16 GB RAM, 512 GB SSD. Great for study and work.',
    description: 'A dependable everyday laptop with a roomy 15.6" display, a full-size keyboard and a fast SSD.',
    tags: ['everyday', 'student'], warranty: '1 year manufacturer warranty', stock: 18,
    specifications: [spec('Display', 'Screen', '15.6" FHD IPS'), spec('Performance', 'Memory', '16 GB'), spec('Performance', 'Storage', '512 GB SSD')],
    variants: [],
  },
  {
    cat: 'tablets', brand: 'Aero', name: 'Tab Pro 11', price: 54900, discountPercent: 0, isNewArrival: true,
    shortDescription: '11" OLED tablet with stylus support and a quad-speaker system.',
    description: 'A premium 11" OLED tablet for drawing, note-taking and streaming, with stylus support and four speakers.',
    tags: ['oled', 'stylus'], warranty: '1 year manufacturer warranty',
    specifications: [spec('Display', 'Screen', '11" OLED, 120 Hz'), spec('Performance', 'RAM', '8 GB'), spec('Battery', 'Life', 'Up to 14 hours')],
    variants: [
      { sku: 'ATP11-GRY-128', options: { Color: 'Graphite', Storage: '128 GB' }, stock: 10 },
      { sku: 'ATP11-GRY-256', options: { Color: 'Graphite', Storage: '256 GB' }, price: 61900, stock: 8 },
    ],
  },
  {
    cat: 'tablets', brand: 'Kite', name: 'Tab S', price: 19999, discountPercent: 15, isOnSale: true,
    shortDescription: '10.4" tablet for streaming, reading and school.',
    description: 'An affordable 10.4" tablet with a sharp display and long battery life.',
    tags: ['budget', 'student'], warranty: '1 year manufacturer warranty', stock: 25,
    specifications: [spec('Display', 'Screen', '10.4" 2K LCD'), spec('Battery', 'Capacity', '7040 mAh')],
    variants: [],
  },
  {
    cat: 'audio', brand: 'NOVA', name: 'Buds Pro', price: 12999, discountPercent: 20, isOnSale: true, isNewArrival: true, isFeatured: true,
    shortDescription: 'Active noise cancellation, spatial audio, 30 hours with the case.',
    description: 'Buds Pro deliver rich, balanced sound with adaptive noise cancellation and a transparency mode that sounds natural.\n\nUp to 8 hours per charge, 30 hours with the case, and IPX4 sweat resistance.',
    tags: ['anc', 'earbuds', 'wireless'], warranty: '1 year manufacturer warranty',
    specifications: [spec('Audio', 'Drivers', '11 mm dynamic'), spec('Audio', 'Noise cancellation', 'Adaptive ANC'), spec('Battery', 'Playback', '8 h (30 h with case)'), spec('Connectivity', 'Bluetooth', '5.3')],
    variants: [
      { sku: 'NBP-GPH', options: { Color: 'Graphite' }, stock: 35 },
      { sku: 'NBP-PRL', options: { Color: 'Pearl' }, stock: 22 },
    ],
  },
  {
    cat: 'audio', brand: 'Halo', name: 'Over-Ear ANC Headphones', price: 24990, discountPercent: 0, isFeatured: true,
    shortDescription: 'Studio-tuned sound with 40 hours of battery.',
    description: 'Comfortable over-ear headphones with powerful noise cancellation, a detailed sound signature and 40 hours of playback.',
    tags: ['anc', 'headphones', 'wireless'], warranty: '1 year manufacturer warranty', stock: 14,
    specifications: [spec('Audio', 'Drivers', '40 mm'), spec('Battery', 'Playback', '40 h'), spec('Connectivity', 'Bluetooth', '5.3, multipoint')],
    variants: [],
  },
  {
    cat: 'audio', brand: 'NOVA', name: 'Speaker Mini', price: 4999, discountPercent: 0,
    shortDescription: 'Pocket-sized Bluetooth speaker with surprisingly full sound.',
    description: 'A compact, waterproof speaker with 12 hours of playback and a built-in strap.',
    tags: ['speaker', 'portable'], warranty: '1 year manufacturer warranty',
    specifications: [spec('Audio', 'Output', '10 W'), spec('Build', 'Rating', 'IP67')],
    variants: [
      { sku: 'NSM-BLK', options: { Color: 'Black' }, stock: 40 },
      { sku: 'NSM-CRL', options: { Color: 'Coral' }, stock: 2 },
    ],
  },
  {
    cat: 'wearables', brand: 'NOVA', name: 'Watch 3', price: 29900, discountPercent: 0, isNewArrival: true, isFeatured: true,
    shortDescription: 'Always-on AMOLED, GPS, ECG-ready sensors and 5-day battery.',
    description: 'Watch 3 tracks workouts, sleep and heart rate with a bright always-on display and built-in GPS.',
    tags: ['smartwatch', 'gps'], warranty: '1 year manufacturer warranty',
    specifications: [spec('Display', 'Screen', '1.9" AMOLED, always-on'), spec('Battery', 'Life', 'Up to 5 days'), spec('Sensors', 'Health', 'Heart rate, SpO₂, skin temperature'), spec('Build', 'Water resistance', '5 ATM')],
    variants: [
      { sku: 'NW3-41-MID', options: { Size: '41 mm', Color: 'Midnight' }, stock: 12 },
      { sku: 'NW3-45-MID', options: { Size: '45 mm', Color: 'Midnight' }, price: 32900, stock: 9 },
      { sku: 'NW3-45-SLV', options: { Size: '45 mm', Color: 'Silver' }, price: 32900, stock: 5 },
    ],
  },
  {
    cat: 'wearables', brand: 'Halo', name: 'Band 2', price: 3499, discountPercent: 25, isOnSale: true,
    shortDescription: 'Slim fitness band with 14-day battery.',
    description: 'Track steps, sleep and heart rate with a lightweight band that lasts two weeks on a charge.',
    tags: ['fitness', 'band'], warranty: '6 months manufacturer warranty', stock: 60,
    specifications: [spec('Display', 'Screen', '1.47" AMOLED'), spec('Battery', 'Life', 'Up to 14 days')],
    variants: [],
  },
  {
    cat: 'accessories', brand: 'NOVA', name: '65W GaN Charger', price: 2499, discountPercent: 0, isNewArrival: true,
    shortDescription: 'Charges a laptop and a phone at the same time. Fits in your pocket.',
    description: 'A compact 65 W GaN charger with two USB-C ports and one USB-A port.',
    tags: ['charger', 'gan', 'usb-c'], warranty: '1 year manufacturer warranty', stock: 80,
    specifications: [spec('Power', 'Output', '65 W max'), spec('Ports', 'Count', '2× USB-C, 1× USB-A')],
    variants: [],
  },
  {
    cat: 'accessories', brand: 'NOVA', name: 'MagCase for Phone 2 Pro', price: 2999, discountPercent: 0,
    shortDescription: 'Slim magnetic case with soft-touch finish.',
    description: 'A slim, grippy case with built-in magnets for wireless chargers and mounts.',
    tags: ['case', 'magnetic'], warranty: '6 months',
    specifications: [spec('Fit', 'Compatible with', 'NOVA Phone 2 Pro')],
    variants: [
      { sku: 'NMC-BLK', options: { Color: 'Black' }, stock: 50 },
      { sku: 'NMC-BLU', options: { Color: 'Blue' }, stock: 28 },
    ],
  },
  {
    cat: 'accessories', brand: 'NOVA', name: '20,000 mAh Power Bank', price: 2799, discountPercent: 10, isOnSale: true,
    shortDescription: '45 W USB-C power bank that can charge a laptop.',
    description: 'A 20,000 mAh power bank with 45 W USB-C output and a digital battery display.',
    tags: ['power bank', 'usb-c'], warranty: '1 year manufacturer warranty', stock: 33,
    specifications: [spec('Power', 'Capacity', '20,000 mAh'), spec('Power', 'Output', '45 W max')],
    variants: [],
  },
  {
    cat: 'accessories', brand: 'NOVA', name: 'USB-C Cable 2-Pack', price: 1299, discountPercent: 0,
    shortDescription: 'Braided 100 W USB-C cables, 1 m and 2 m.',
    description: 'Two braided USB-C cables rated for 100 W charging and 480 Mbps data.',
    tags: ['cable', 'usb-c'], warranty: '1 year', stock: 120,
    specifications: [spec('Power', 'Rating', '100 W'), spec('Length', 'Included', '1 m + 2 m')],
    variants: [],
  },
];

export const banners = [
  { placement: 'hero', theme: 'dark', eyebrow: 'New', title: 'Phone 2 Pro.', subtitle: 'Titanium design. All-day battery. A camera that gets it right.', ctaLabel: 'Shop now', productName: 'Phone 2 Pro', sortOrder: 1 },
  { placement: 'hero', theme: 'light', eyebrow: 'Repair Center', title: 'Cracked screen? Fixed today.', subtitle: 'Book a repair in under two minutes and track it every step of the way.', ctaLabel: 'Book a repair', ctaLink: '/repair/book', sortOrder: 2 },
  { placement: 'hero', theme: 'light', eyebrow: 'Deals', title: 'Sound deals, all week.', subtitle: 'Save on earbuds, headphones and smartwatches while stocks last.', ctaLabel: 'See deals', ctaLink: '/deals', sortOrder: 3 },
  { placement: 'promo', theme: 'light', eyebrow: 'Limited offer', title: 'Buds Pro, 20% off', subtitle: 'Adaptive noise cancellation for less.', ctaLabel: 'Shop audio', ctaLink: '/shop/audio', sortOrder: 1 },
  { placement: 'promo', theme: 'dark', eyebrow: 'Repairs', title: 'Free diagnosis with every booking', subtitle: 'No fix, no fee on the diagnosis.', ctaLabel: 'Learn more', ctaLink: '/repair', sortOrder: 2 },
  { placement: 'strip', theme: 'dark', title: 'Free shipping above ₹2,999 · Easy 7-day returns · Secure payments', sortOrder: 1 },
];

export const coupons = [
  { code: 'WELCOME10', description: '10% off your order (up to ₹1,500)', type: 'percent', value: 10, minOrder: 999, maxDiscount: 1500, perUserLimit: 1 },
  { code: 'FLAT500', description: '₹500 off orders above ₹15,000', type: 'flat', value: 500, minOrder: 15000 },
];

export const repairServices = [
  { name: 'Screen replacement', slug: 'screen', icon: 'screen', description: 'Cracked, flickering or unresponsive display.', sortOrder: 1, base: [3500, 6500], eta: 2 },
  { name: 'Battery replacement', slug: 'battery', icon: 'battery', description: 'Drains quickly, swollen or shuts down.', sortOrder: 2, base: [1800, 3200], eta: 1 },
  { name: 'Charging port repair', slug: 'charging-port', icon: 'plug', description: 'Not charging or loose connection.', sortOrder: 3, base: [1200, 2200], eta: 2 },
  { name: 'Camera repair', slug: 'camera', icon: 'camera', description: 'Blurry photos, cracked lens or camera not opening.', sortOrder: 4, base: [2500, 5500], eta: 3 },
  { name: 'Back glass replacement', slug: 'back-glass', icon: 'shield', description: 'Cracked or shattered rear panel.', sortOrder: 5, base: [1800, 4200], eta: 4 },
  { name: 'Speaker / microphone', slug: 'speaker-mic', icon: 'speaker', description: 'Low volume, crackling or people cannot hear you.', sortOrder: 6, base: [900, 1800], eta: 2 },
  { name: 'Water damage diagnosis', slug: 'water-damage', icon: 'droplet', description: 'Full inspection and cleaning after liquid exposure.', sortOrder: 7, base: [500, 500], eta: 24 },
  { name: 'Software & data issues', slug: 'software', icon: 'code', description: 'Stuck on logo, boot loops, updates or data recovery.', sortOrder: 8, base: [499, 999], eta: 2 },
  { name: 'Something else / not sure', slug: 'other', icon: 'help', description: 'Describe the problem and we will inspect it. No estimate until inspection.', sortOrder: 9, base: null, eta: 0 },
];

// [brand, model, price tier multiplier]
export const devices = [
  ['Apple', 'iPhone 16 Pro', 1.8], ['Apple', 'iPhone 16', 1.6], ['Apple', 'iPhone 15', 1.5], ['Apple', 'iPhone 14', 1.3],
  ['Apple', 'iPhone 13', 1.1], ['Apple', 'iPhone 12', 0.95], ['Apple', 'iPhone SE (3rd generation)', 0.8],
  ['Samsung', 'Galaxy S25 Ultra', 1.9], ['Samsung', 'Galaxy S24', 1.5], ['Samsung', 'Galaxy A55', 0.8], ['Samsung', 'Galaxy M35', 0.6],
  ['Google', 'Pixel 9', 1.4], ['Google', 'Pixel 8', 1.2],
  ['OnePlus', 'OnePlus 13', 1.4], ['OnePlus', 'OnePlus 12', 1.3], ['OnePlus', 'OnePlus Nord CE4', 0.7],
  ['Xiaomi', 'Xiaomi 14', 1.2], ['Xiaomi', 'Redmi Note 13 Pro', 0.8],
  ['realme', 'realme 12 Pro', 0.75], ['vivo', 'vivo V30', 0.8],
];

export const faqs = [
  { category: 'Orders', question: 'How do I track my order?', answer: 'Sign in and open Account → Orders. Each order shows its current status and, once shipped, the courier and tracking number.' },
  { category: 'Orders', question: 'Can I cancel or change an order?', answer: 'You can cancel an order from your account until it has shipped. After that, please contact support and we will help.' },
  { category: 'Payments', question: 'Which payment methods do you accept?', answer: 'We accept UPI, cards, net banking and wallets through Razorpay when online payments are enabled, and cash on delivery where available.' },
  { category: 'Payments', question: 'My payment was deducted but the order failed. What now?', answer: 'Do not worry. If payment is captured but the order is not confirmed, it is reconciled automatically or refunded to the original payment method. Contact support with your order number if you do not see an update within 24 hours.' },
  { category: 'Shipping', question: 'How long does delivery take?', answer: 'Most orders are delivered in 3–7 business days depending on your location. You will see tracking details once your order ships.' },
  { category: 'Returns', question: 'What is your return policy?', answer: 'Unused products in original packaging can be returned within 7 days of delivery. See the Returns policy for full details and exceptions.' },
  { category: 'Repairs', question: 'How do I book a repair?', answer: 'Go to Repair Center → Book a repair, choose your phone model and the issue, pick a service method and time slot, and confirm. You will get a booking reference immediately.' },
  { category: 'Repairs', question: 'How do I track my repair?', answer: 'Open Track repair and enter your booking reference and the phone number used while booking. You can also see your repairs under Account when signed in.' },
  { category: 'Repairs', question: 'Is the estimate final?', answer: 'The estimate is a range based on your model and issue. After inspection we send you a final quote, and we only start the repair once you approve it.' },
  { category: 'Repairs', question: 'Do repairs come with a warranty?', answer: 'Yes. Repairs carry a limited warranty on parts and workmanship. The duration is shown on the Repair Center page and in the Repair policy.' },
];

export const pages = [
  {
    slug: 'about', title: 'About us', kind: 'info', sortOrder: 1,
    summary: 'Who we are and what we care about.',
    body: `## Technology, done properly
We started Pranay Mobiles to make buying and maintaining electronics feel as good as using them: honest prices, clear information and people who know their stuff.

## What we do
- Sell carefully selected phones, laptops, audio and accessories
- Repair phones in-store, with pickup & drop, or by courier
- Stand behind everything with real support

## Our promise
Straight answers, fair pricing and no surprises. If something is not right, we will make it right.`,
  },
  {
    slug: 'contact', title: 'Contact us', kind: 'info', sortOrder: 2,
    summary: 'Questions about an order or a repair? Reach out.',
    body: `## We are here to help
Use the form on this page or the contact details shown beside it. Please include your order number or repair reference if you have one so we can help faster.

## Response times
We reply to most messages within one business day.`,
  },
  {
    slug: 'shipping-policy', title: 'Shipping policy', kind: 'policy', sortOrder: 1,
    summary: 'Delivery times, charges and tracking.',
    body: `## Delivery
Orders are dispatched within 1–2 business days. Delivery usually takes 3–7 business days depending on your location.

## Charges
Shipping is free above the threshold shown at checkout. Below it, a flat fee applies and is shown before you pay.

## Tracking
You will see the courier and tracking number in your account once your order ships.`,
  },
  {
    slug: 'return-policy', title: 'Returns & refunds', kind: 'policy', sortOrder: 2,
    summary: '7-day returns on eligible products.',
    body: `## Returns
You can return eligible products within 7 days of delivery if they are unused, in original packaging and with all accessories.

## Non-returnable items
- Products with physical damage or signs of use
- Opened software and consumables

## Refunds
Approved refunds are issued to the original payment method. Banks usually take 5–7 business days to reflect them. Cash-on-delivery refunds are sent by bank transfer.

## Defective items
If a product arrives defective, contact us within 7 days and we will arrange a replacement or refund.`,
  },
  {
    slug: 'warranty-policy', title: 'Warranty', kind: 'policy', sortOrder: 3,
    summary: 'Manufacturer warranty on products we sell.',
    body: `## Manufacturer warranty
Products come with the manufacturer warranty shown on each product page. We help you with warranty claims.

## What is not covered
Accidental damage, liquid damage, unauthorised repairs and normal wear and tear.`,
  },
  {
    slug: 'repair-policy', title: 'Repair policy', kind: 'policy', sortOrder: 4,
    summary: 'How repairs, quotes, approvals and warranty work.',
    body: `## Estimates and quotes
The estimate shown while booking is a range. After inspection, we send a final quote. We start the repair only after you approve it.

## Your data
Back up your phone before you hand it over. We do not access your personal data, but repairs can occasionally result in data loss.

## Repair warranty
Repairs include a limited warranty on the replaced part and workmanship. It does not cover new physical or liquid damage.

## Unclaimed devices
Please collect your device within 30 days of being notified that it is ready.`,
  },
  {
    slug: 'privacy-policy', title: 'Privacy policy', kind: 'policy', sortOrder: 5,
    summary: 'What we collect and how we use it.',
    body: `## What we collect
Account details, delivery addresses, order and repair history, and the information you send us.

## How we use it
To process orders and repairs, provide support and keep the store secure. We do not sell your personal data.

## Payments
Online payments are processed by Razorpay. We never see or store your card details.

## Your choices
You can update your details in your account or contact us to request deletion.`,
  },
  {
    slug: 'terms', title: 'Terms of service', kind: 'policy', sortOrder: 6,
    summary: 'The rules for using this store.',
    body: `## Using the store
By placing an order or booking a repair you agree to these terms and to provide accurate information.

## Pricing
Prices are in Indian Rupees and include applicable taxes unless stated. We may correct pricing errors and will tell you before shipping if that affects your order.

## Availability
Stock is limited and an order is confirmed only after payment (or acceptance, for cash on delivery).`,
  },
];
