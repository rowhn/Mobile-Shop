import { Router } from 'express';
import { Banner, Category, ContactMessage, Faq, Page, Product, getSettings } from '../models/index.js';
import { env, cloudinaryEnabled, razorpayEnabled } from '../config/env.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler, notFound } from '../utils/http.js';
import { contactSchema } from '../validators/schemas.js';

const router = Router();

// Public store configuration (never includes secrets: only the public Razorpay key id).
router.get(
  '/config',
  asyncHandler(async (_req, res) => {
    const s = await getSettings();
    res.json({
      store: {
        name: s.storeName,
        tagline: s.tagline,
        supportEmail: s.supportEmail,
        supportPhone: s.supportPhone,
        whatsapp: s.whatsapp,
        address: s.address,
        hours: s.hours,
        social: s.social,
        announcement: s.announcement,
      },
      shipping: s.shipping,
      payments: {
        razorpay: razorpayEnabled,
        cod: env.enableCod,
      },
      repair: {
        methods: s.repair.methods,
        warrantyDays: s.repair.warrantyDays,
        advanceDays: s.repair.advanceDays,
        weeklyOff: s.repair.weeklyOff,
      },
      uploadsEnabled: cloudinaryEnabled,
    });
  })
);

const activeWindow = () => {
  const now = new Date();
  return {
    isActive: true,
    $and: [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
    ],
  };
};

const CARD_FIELDS = '-description -specifications';

router.get(
  '/home',
  asyncHandler(async (_req, res) => {
    const [banners, categories, featured, newArrivals, deals] = await Promise.all([
      Banner.find(activeWindow()).sort({ sortOrder: 1, createdAt: -1 }),
      Category.find({ isActive: true, showOnHome: true }).sort({ sortOrder: 1, name: 1 }),
      Product.find({ status: 'active', isFeatured: true }).select(CARD_FIELDS).populate('category', 'name slug').sort({ updatedAt: -1 }).limit(8),
      Product.find({ status: 'active', isNewArrival: true }).select(CARD_FIELDS).populate('category', 'name slug').sort({ createdAt: -1 }).limit(8),
      Product.find({ status: 'active', $or: [{ isOnSale: true }, { discountPercent: { $gt: 0 } }] })
        .select(CARD_FIELDS)
        .populate('category', 'name slug')
        .sort({ discountPercent: -1 })
        .limit(8),
    ]);
    res.json({
      banners: {
        hero: banners.filter((b) => b.placement === 'hero'),
        promo: banners.filter((b) => b.placement === 'promo'),
        strip: banners.filter((b) => b.placement === 'strip'),
      },
      categories,
      featured,
      newArrivals,
      deals,
    });
  })
);

router.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const [categories, counts] = await Promise.all([
      Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }),
      Product.aggregate([{ $match: { status: 'active' } }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
    res.json({ items: categories.map((c) => ({ ...c.toJSON(), productCount: countMap.get(c.id) || 0 })) });
  })
);

router.get(
  '/pages',
  asyncHandler(async (req, res) => {
    const filter = { isPublished: true };
    if (['info', 'policy'].includes(req.query.kind)) filter.kind = req.query.kind;
    const items = await Page.find(filter).select('-body').sort({ sortOrder: 1, title: 1 });
    res.json({ items });
  })
);

router.get(
  '/pages/:slug',
  asyncHandler(async (req, res) => {
    const page = await Page.findOne({ slug: String(req.params.slug).toLowerCase(), isPublished: true });
    if (!page) throw notFound('Page');
    res.json({ page });
  })
);

router.get(
  '/faqs',
  asyncHandler(async (_req, res) => {
    res.json({ items: await Faq.find({ isActive: true }).sort({ category: 1, sortOrder: 1, createdAt: 1 }) });
  })
);

router.post(
  '/contact',
  validate(contactSchema),
  asyncHandler(async (req, res) => {
    await ContactMessage.create(req.body);
    res.status(201).json({ message: 'Thanks! Your message has been received and our team will get back to you.' });
  })
);

export default router;
