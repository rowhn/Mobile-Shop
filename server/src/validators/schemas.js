import { z } from 'zod';
import { normalizePhone } from '../utils/helpers.js';

/* ---------- primitives ---------- */
export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const str = (max = 200) => z.string().trim().max(max);
const reqStr = (max = 200) => z.string().trim().min(1, 'Required').max(max);
const optStr = (max = 200) => str(max).optional().default('');
const money = z.coerce.number().min(0).max(100_000_000);
const int0 = z.coerce.number().int().min(0).max(1_000_000);
const emptyToUndef = (v) => (v === '' || v === null ? undefined : v);
const optNum = z.preprocess(emptyToUndef, z.coerce.number().min(0).optional());
const optDate = z.preprocess((v) => (v === '' || v == null ? null : v), z.coerce.date().nullable()).optional();
const bool = z.preprocess((v) => (v === 'true' || v === '1' || v === 1 ? true : v === 'false' || v === '0' || v === 0 ? false : v), z.boolean());
const urlOrEmpty = z.union([z.literal(''), z.string().trim().url().max(1000)]);

export const phoneSchema = z
  .string()
  .transform((v) => normalizePhone(v))
  .refine((v) => /^[6-9]\d{9}$/.test(v), 'Enter a valid 10-digit Indian mobile number');

export const pincodeSchema = z.string().trim().regex(/^[1-9]\d{5}$/, 'Enter a valid 6-digit PIN code');

const imageRef = z.object({ url: z.string().trim().url().max(1000), publicId: str(300).optional().default('') });

/* ---------- auth ---------- */
export const registerSchema = z.object({
  name: reqStr(100),
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
  phone: z.preprocess(emptyToUndef, phoneSchema.optional()),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(1).max(72),
});

export const addressSchema = z.object({
  id: z.string().optional(),
  label: str(30).optional().default('Home'),
  name: reqStr(100),
  phone: phoneSchema,
  line1: reqStr(200),
  line2: optStr(200),
  city: reqStr(80),
  state: reqStr(80),
  pincode: pincodeSchema,
  isDefault: z.boolean().optional().default(false),
});

export const profileSchema = z.object({
  name: reqStr(100).optional(),
  phone: z.preprocess((v) => (v === '' ? undefined : v), phoneSchema.optional()),
  addresses: z.array(addressSchema).max(10).optional(),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1).max(72),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(72),
});

/* ---------- catalogue ---------- */
export const productListQuery = z.object({
  q: str(80).optional(),
  category: str(80).optional(),
  brand: str(300).optional(),
  minPrice: optNum,
  maxPrice: optNum,
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'name', 'discount']).optional().default('newest'),
  flag: z.enum(['new', 'featured', 'sale']).optional(),
  inStock: z.preprocess((v) => v === 'true' || v === '1', z.boolean()).optional(),
  page: z.preprocess(emptyToUndef, z.coerce.number().int().min(1).max(500).optional().default(1)),
  limit: z.preprocess(emptyToUndef, z.coerce.number().int().min(1).max(48).optional().default(12)),
});

export const categorySchema = z.object({
  name: reqStr(80),
  description: optStr(400),
  image: imageRef.nullable().optional(),
  icon: optStr(30),
  sortOrder: z.coerce.number().int().min(-1000).max(1000).optional().default(0),
  isActive: z.boolean().optional().default(true),
  showOnHome: z.boolean().optional().default(true),
});

const variantSchema = z.object({
  sku: reqStr(64),
  label: optStr(120),
  options: z.array(z.object({ name: reqStr(40), value: reqStr(60) })).max(6).optional().default([]),
  price: z.preprocess(emptyToUndef, money.nullable().optional()),
  stock: int0.optional().default(0),
  image: urlOrEmpty.optional().default(''),
});

export const productBase = z.object({
  name: reqStr(160),
  brand: reqStr(80),
  category: objectId,
  shortDescription: optStr(300),
  description: optStr(10000),
  images: z.array(imageRef).max(10).optional().default([]),
  price: money,
  discountPercent: z.coerce.number().min(0).max(90).optional().default(0),
  stock: int0.optional().default(0),
  lowStockThreshold: int0.optional().default(5),
  specifications: z
    .array(z.object({ group: optStr(60), key: reqStr(80), value: reqStr(300) }))
    .max(80)
    .optional()
    .default([]),
  variants: z.array(variantSchema).max(60).optional().default([]),
  tags: z.array(reqStr(40)).max(20).optional().default([]),
  warranty: optStr(200),
  isNewArrival: z.boolean().optional().default(false),
  isFeatured: z.boolean().optional().default(false),
  isOnSale: z.boolean().optional().default(false),
  status: z.enum(['active', 'draft', 'archived']).optional().default('active'),
});

const uniqueSkus = (data, ctx) => {
  if (!data.variants) return;
  const seen = new Set();
  for (const v of data.variants) {
    const key = v.sku.toLowerCase();
    if (seen.has(key)) {
      ctx.addIssue({ code: 'custom', path: ['variants'], message: `Duplicate SKU: ${v.sku}` });
      return;
    }
    seen.add(key);
  }
};
export const productCreateSchema = productBase.superRefine(uniqueSkus);
export const productUpdateSchema = productBase.partial().superRefine(uniqueSkus);

export const bannerSchema = z.object({
  eyebrow: optStr(60),
  title: reqStr(120),
  subtitle: optStr(300),
  image: urlOrEmpty.optional().default(''),
  imagePublicId: optStr(300),
  ctaLabel: optStr(40),
  ctaLink: optStr(300),
  placement: z.enum(['hero', 'promo', 'strip']).optional().default('hero'),
  theme: z.enum(['light', 'dark']).optional().default('light'),
  sortOrder: z.coerce.number().int().min(-1000).max(1000).optional().default(0),
  isActive: z.boolean().optional().default(true),
  startsAt: optDate,
  endsAt: optDate,
});

const couponBase = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9_-]{3,30}$/, 'Use 3–30 letters, digits, - or _'),
  description: optStr(200),
  type: z.enum(['percent', 'flat']),
  value: z.coerce.number().min(1).max(100_000_000),
  minOrder: money.optional().default(0),
  maxDiscount: money.optional().default(0),
  usageLimit: int0.optional().default(0),
  perUserLimit: int0.optional().default(0),
  startsAt: optDate,
  expiresAt: optDate,
  isActive: z.boolean().optional().default(true),
});
const percentCap = (d, ctx) => {
  if (d.type === 'percent' && d.value > 90)
    ctx.addIssue({ code: 'custom', path: ['value'], message: 'Percent coupons are limited to 90%' });
};
export const couponSchema = couponBase.superRefine(percentCap);
export const couponUpdateSchema = couponBase.partial().superRefine(percentCap);

/* ---------- cart / orders ---------- */
const cartItem = z.object({
  productId: objectId,
  sku: str(64).optional().default(''),
  qty: z.coerce.number().int().min(1).max(10),
});

export const cartQuoteSchema = z.object({
  items: z.array(cartItem).max(40),
  couponCode: z.preprocess(emptyToUndef, z.string().trim().toUpperCase().max(30).optional()),
});

export const checkoutSchema = z.object({
  items: z.array(cartItem).min(1, 'Your cart is empty').max(40),
  couponCode: z.preprocess(emptyToUndef, z.string().trim().toUpperCase().max(30).optional()),
  paymentMethod: z.enum(['razorpay', 'cod']),
  shippingAddress: z.object({
    name: reqStr(100),
    phone: phoneSchema,
    line1: reqStr(200),
    line2: optStr(200),
    city: reqStr(80),
    state: reqStr(80),
    pincode: pincodeSchema,
  }),
  notes: optStr(500),
});

export const razorpayVerifySchema = z.object({
  orderId: objectId,
  razorpay_order_id: reqStr(100),
  razorpay_payment_id: reqStr(100),
  razorpay_signature: reqStr(200),
});

export const orderAdminUpdateSchema = z.object({
  status: z.enum(['pending_payment', 'placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refund_pending', 'refunded']).optional(),
  courier: optStr(80).optional(),
  trackingNumber: optStr(80).optional(),
  note: optStr(300).optional(),
});

/* ---------- repairs ---------- */
export const repairServiceSchema = z.object({
  name: reqStr(80),
  description: optStr(300),
  icon: optStr(30),
  sortOrder: z.coerce.number().int().min(-1000).max(1000).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

const repairPriceRow = z
  .object({
    service: objectId,
    priceMin: money,
    priceMax: money,
    etaHours: z.coerce.number().min(0).max(720).optional().default(0),
  })
  .refine((r) => r.priceMax >= r.priceMin, { message: 'Max price must be ≥ min price', path: ['priceMax'] });

export const deviceBase = z.object({
  brand: reqStr(60),
  model: reqStr(100),
  image: urlOrEmpty.optional().default(''),
  isActive: z.boolean().optional().default(true),
  repairs: z.array(repairPriceRow).max(40).optional().default([]),
});

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date');

export const bookingCreateSchema = z
  .object({
    deviceId: objectId,
    serviceIds: z.array(objectId).min(1, 'Choose at least one issue').max(8),
    issueNotes: optStr(1000),
    method: z.enum(['store_visit', 'pickup_drop', 'courier']),
    appointmentDate: z.preprocess(emptyToUndef, isoDate.optional()),
    slot: optStr(30),
    customer: z.object({
      name: reqStr(100),
      phone: phoneSchema,
      email: z.preprocess(emptyToUndef, z.string().trim().toLowerCase().email().max(200).optional()),
    }),
    address: z
      .object({
        line1: optStr(200),
        line2: optStr(200),
        city: optStr(80),
        state: optStr(80),
        pincode: z.preprocess(emptyToUndef, pincodeSchema.optional()),
      })
      .optional(),
  })
  .superRefine((d, ctx) => {
    if (d.method !== 'courier' && (!d.appointmentDate || !d.slot)) {
      ctx.addIssue({ code: 'custom', path: ['appointmentDate'], message: 'Choose a date and time slot' });
    }
    if (d.method === 'pickup_drop') {
      const a = d.address;
      if (!a || !a.line1 || !a.city || !a.state || !a.pincode) {
        ctx.addIssue({ code: 'custom', path: ['address'], message: 'Pickup address is required' });
      }
    }
  });

export const trackSchema = z.object({
  reference: z.string().trim().toUpperCase().min(4).max(20),
  phone: phoneSchema,
});

export const trackDecisionSchema = trackSchema.extend({ decision: z.enum(['approved', 'declined']) });

export const bookingAdminUpdateSchema = z.object({
  status: z
    .enum(['booked', 'received', 'diagnosing', 'awaiting_approval', 'approved', 'in_repair', 'ready', 'completed', 'declined', 'cancelled'])
    .optional(),
  technician: z.preprocess((v) => (v === '' ? null : v), objectId.nullable()).optional(),
  quote: z
    .object({ amount: money, notes: optStr(500) })
    .optional(),
  finalAmount: z.preprocess((v) => (v === '' ? null : v), money.nullable()).optional(),
  publicNote: optStr(300).optional(),
  internalNote: optStr(500).optional(),
  appointmentDate: z.preprocess(emptyToUndef, isoDate.optional()),
  slot: optStr(30).optional(),
});

/* ---------- content ---------- */
export const faqSchema = z.object({
  question: reqStr(250),
  answer: reqStr(3000),
  category: optStr(40),
  sortOrder: z.coerce.number().int().min(-1000).max(1000).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const pageSchema = z.object({
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{2,60}$/, 'Lowercase letters, digits and dashes only'),
  title: reqStr(120),
  kind: z.enum(['info', 'policy']).optional().default('info'),
  summary: optStr(300),
  body: z.string().max(30000).optional().default(''),
  sortOrder: z.coerce.number().int().min(-1000).max(1000).optional().default(0),
  isPublished: z.boolean().optional().default(true),
});

export const contactSchema = z.object({
  name: reqStr(100),
  email: z.string().trim().toLowerCase().email().max(200),
  phone: z.preprocess(emptyToUndef, phoneSchema.optional()),
  subject: optStr(150),
  message: reqStr(3000),
});

const methodSchema = z.object({
  enabled: z.boolean(),
  label: reqStr(60),
  description: str(200),
  fee: money,
});

export const settingsSchema = z
  .object({
    storeName: str(60),
    tagline: str(120),
    supportEmail: str(120),
    supportPhone: str(30),
    whatsapp: str(30),
    address: str(300),
    hours: str(120),
    social: z.object({ instagram: str(200), facebook: str(200), x: str(200), youtube: str(200) }),
    announcement: z.object({ isActive: z.boolean(), text: str(200), link: str(300) }),
    shipping: z.object({ fee: money, freeAbove: money }),
    repair: z.object({
      slots: z.array(z.string().trim().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/, 'Use HH:MM-HH:MM')).min(1).max(12),
      capacityPerSlot: z.coerce.number().int().min(1).max(100),
      weeklyOff: z.array(z.coerce.number().int().min(0).max(6)).max(7),
      advanceDays: z.coerce.number().int().min(1).max(120),
      warrantyDays: z.coerce.number().int().min(0).max(1000),
      methods: z.object({ store_visit: methodSchema, pickup_drop: methodSchema, courier: methodSchema }).partial(),
    }).partial(),
  })
  .partial();

export const customerUpdateSchema = z.object({
  role: z.enum(['customer', 'staff', 'admin']).optional(),
  isActive: z.boolean().optional(),
});

export const stockUpdateSchema = z.object({
  productId: objectId,
  sku: str(64).optional().default(''),
  stock: int0,
});
