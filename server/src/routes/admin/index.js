import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import {
  Banner,
  Category,
  Coupon,
  ContactMessage,
  Device,
  Faq,
  Order,
  Page,
  Product,
  RepairBooking,
  RepairService,
  Settings,
  User,
  getSettings,
} from '../../models/index.js';
import { cloudinaryEnabled } from '../../config/env.js';
import { destroyImage, uploadBuffer } from '../../config/cloudinary.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler, HttpError, notFound } from '../../utils/http.js';
import { deepMerge, escapeRegex, uniqueSlug } from '../../utils/helpers.js';
import {
  bannerSchema,
  categorySchema,
  couponSchema,
  couponUpdateSchema,
  customerUpdateSchema,
  deviceBase,
  faqSchema,
  pageSchema,
  repairServiceSchema,
  settingsSchema,
} from '../../validators/schemas.js';
import { crudRouter } from './crud.js';
import productsRouter, { inventoryRouter } from './products.js';
import ordersRouter from './orders.js';
import repairsRouter from './repairs.js';

const admin = Router();

// Everything below requires a signed-in staff member or admin.
admin.use(requireAuth, requireRole('admin', 'staff'));

/* ---- staff + admin: fulfilment work ---- */
admin.use('/orders', ordersRouter);
admin.use('/repair-bookings', repairsRouter);
admin.get(
  '/staff',
  asyncHandler(async (_req, res) => {
    const items = await User.find({ role: { $in: ['staff', 'admin'] }, isActive: true }).select('name email role').sort({ name: 1 });
    res.json({ items });
  })
);

/* ---- admin only from here ---- */
admin.use(requireRole('admin'));

admin.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const since = new Date(Date.now() - 14 * 24 * 3600 * 1000);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      revenueAgg,
      totalOrders,
      ordersToday,
      pendingOrders,
      customers,
      products,
      stockRows,
      repairsByStatus,
      recentWindowOrders,
      recentOrders,
      newMessages,
    ] = await Promise.all([
      Order.aggregate([
        { $match: { 'payment.status': 'paid', status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.countDocuments({ status: { $ne: 'pending_payment' } }),
      Order.countDocuments({ createdAt: { $gte: startOfToday }, status: { $ne: 'pending_payment' } }),
      Order.countDocuments({ status: { $in: ['placed', 'confirmed', 'processing'] } }),
      User.countDocuments({ role: 'customer' }),
      Product.countDocuments({ status: 'active' }),
      Product.find({ status: { $ne: 'archived' } }).select('totalStock lowStockThreshold').lean(),
      RepairBooking.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
      Order.find({ createdAt: { $gte: since }, status: { $nin: ['cancelled', 'pending_payment'] } })
        .select('createdAt total')
        .limit(20000)
        .lean(),
      Order.find({ status: { $ne: 'pending_payment' } }).populate('user', 'name email').sort({ createdAt: -1 }).limit(6),
      ContactMessage.countDocuments({ status: 'new' }),
    ]);

    const lowStock = stockRows.filter((p) => p.totalStock > 0 && p.totalStock <= p.lowStockThreshold).length;
    const outOfStock = stockRows.filter((p) => p.totalStock <= 0).length;

    // Daily sales for the last 14 days, bucketed by calendar day in the store's timezone (IST).
    const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });
    const buckets = new Map();
    for (let i = 13; i >= 0; i--) buckets.set(dayFmt.format(new Date(Date.now() - i * 24 * 3600 * 1000)), { revenue: 0, orders: 0 });
    for (const o of recentWindowOrders) {
      const b = buckets.get(dayFmt.format(o.createdAt));
      if (b) {
        b.revenue += o.total;
        b.orders += 1;
      }
    }

    res.json({
      revenue: revenueAgg[0]?.total || 0,
      totalOrders,
      ordersToday,
      pendingOrders,
      customers,
      products,
      lowStock,
      outOfStock,
      repairs: Object.fromEntries(repairsByStatus.map((r) => [r._id, r.n])),
      daily: [...buckets].map(([date, v]) => ({ date, ...v })),
      recentOrders,
      newMessages,
    });
  })
);

/* ---- catalogue ---- */
admin.use('/products', productsRouter);
admin.use('/inventory', inventoryRouter);

admin.use(
  '/categories',
  crudRouter({
    Model: Category,
    createSchema: categorySchema,
    searchFields: ['name'],
    sort: { sortOrder: 1, name: 1 },
    prepare: async (data, existing) => (existing ? data : { ...data, slug: await uniqueSlug(Category, data.name) }),
    beforeDelete: async (doc) => {
      const n = await Product.countDocuments({ category: doc._id });
      if (n) throw new HttpError(409, `This category still has ${n} product(s). Move or delete them first.`);
    },
    afterDelete: (doc) => doc.image?.publicId && destroyImage(doc.image.publicId),
  })
);

admin.use(
  '/banners',
  crudRouter({
    Model: Banner,
    createSchema: bannerSchema,
    searchFields: ['title'],
    filterFields: ['placement', 'isActive'],
    sort: { placement: 1, sortOrder: 1, createdAt: -1 },
    afterDelete: (doc) => doc.imagePublicId && destroyImage(doc.imagePublicId),
  })
);

admin.use(
  '/coupons',
  crudRouter({
    Model: Coupon,
    createSchema: couponSchema,
    updateSchema: couponUpdateSchema,
    searchFields: ['code', 'description'],
    filterFields: ['isActive'],
  })
);

/* ---- repairs catalogue ---- */
admin.use(
  '/repair-services',
  crudRouter({
    Model: RepairService,
    createSchema: repairServiceSchema,
    searchFields: ['name'],
    sort: { sortOrder: 1, name: 1 },
    prepare: async (data, existing) => (existing ? data : { ...data, slug: await uniqueSlug(RepairService, data.name) }),
    beforeDelete: async (doc) => {
      if (await Device.exists({ 'repairs.service': doc._id }))
        throw new HttpError(409, 'This service is used in device price lists. Deactivate it instead, or remove it from those devices first.');
    },
  })
);

admin.use(
  '/repair-devices',
  crudRouter({
    Model: Device,
    createSchema: deviceBase,
    updateSchema: deviceBase.partial(),
    searchFields: ['brand', 'model'],
    filterFields: ['brand', 'isActive'],
    sort: { brand: 1, model: 1 },
    populate: [{ path: 'repairs.service', select: 'name' }],
    prepare: async (data, existing) => {
      if (existing) return data;
      return { ...data, slug: await uniqueSlug(Device, `${data.brand} ${data.model}`) };
    },
    beforeDelete: async (doc) => {
      if (await RepairBooking.exists({ device: doc._id }))
        throw new HttpError(409, 'This device has repair bookings. Deactivate it instead of deleting.');
    },
  })
);

/* ---- content ---- */
admin.use(
  '/faqs',
  crudRouter({
    Model: Faq,
    createSchema: faqSchema,
    searchFields: ['question', 'category'],
    sort: { category: 1, sortOrder: 1, createdAt: 1 },
  })
);
admin.use(
  '/pages',
  crudRouter({
    Model: Page,
    createSchema: pageSchema,
    searchFields: ['title', 'slug'],
    sort: { kind: 1, sortOrder: 1, title: 1 },
  })
);

admin.get(
  '/messages',
  asyncHandler(async (req, res) => {
    const filter = req.query.status === 'new' || req.query.status === 'resolved' ? { status: req.query.status } : {};
    res.json({ items: await ContactMessage.find(filter).sort({ createdAt: -1 }).limit(200) });
  })
);
admin.patch(
  '/messages/:id',
  validate(z.object({ status: z.enum(['new', 'resolved']) })),
  asyncHandler(async (req, res) => {
    const msg = await ContactMessage.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!msg) throw notFound('Message');
    res.json({ item: msg });
  })
);
admin.delete(
  '/messages/:id',
  asyncHandler(async (req, res) => {
    await ContactMessage.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  })
);

/* ---- settings ---- */
admin.get(
  '/settings',
  asyncHandler(async (_req, res) => res.json({ item: await getSettings() }))
);
admin.patch(
  '/settings',
  validate(settingsSchema),
  asyncHandler(async (req, res) => {
    const current = (await getSettings()).toObject();
    const { _id, key, createdAt, updatedAt, __v, ...rest } = current;
    const merged = deepMerge(rest, req.body);
    const item = await Settings.findOneAndUpdate({ key: 'store' }, { $set: merged }, { new: true, runValidators: true });
    res.json({ item });
  })
);

/* ---- customers ---- */
admin.get(
  '/customers',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const filter = {};
    if (['customer', 'staff', 'admin'].includes(req.query.role)) filter.role = req.query.role;
    if (typeof req.query.q === 'string' && req.query.q.trim()) {
      const rx = new RegExp(escapeRegex(req.query.q.trim().slice(0, 60)), 'i');
      filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
    }
    const [users, total] = await Promise.all([
      User.find(filter).select('-addresses -wishlist').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      User.countDocuments(filter),
    ]);
    const stats = await Order.aggregate([
      { $match: { user: { $in: users.map((u) => u._id) }, status: { $nin: ['cancelled', 'pending_payment'] } } },
      { $group: { _id: '$user', orders: { $sum: 1 }, spent: { $sum: '$total' } } },
    ]);
    const byUser = new Map(stats.map((s) => [String(s._id), s]));
    res.json({
      items: users.map((u) => ({ ...u.toJSON(), orderCount: byUser.get(u.id)?.orders || 0, totalSpent: byUser.get(u.id)?.spent || 0 })),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  })
);

admin.patch(
  '/customers/:id',
  validate(customerUpdateSchema),
  asyncHandler(async (req, res) => {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) throw new HttpError(400, 'Invalid id');
    if (req.params.id === req.user.id) throw new HttpError(400, 'You cannot change your own role or status.');
    const user = await User.findById(req.params.id);
    if (!user) throw notFound('User');
    user.set(req.body);
    await user.save();
    res.json({ item: user });
  })
);

/* ---- image upload (Cloudinary) ---- */
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024, files: 8 },
  fileFilter: (_req, file, cb) =>
    ALLOWED.has(file.mimetype) ? cb(null, true) : cb(new HttpError(400, 'Only JPG, PNG, WebP or AVIF images are allowed.')),
});

admin.post(
  '/upload',
  (req, _res, next) => {
    if (!cloudinaryEnabled)
      return next(
        new HttpError(
          503,
          'Image uploads are not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET on the server, or paste an image URL instead.'
        )
      );
    next();
  },
  upload.array('images', 8),
  asyncHandler(async (req, res) => {
    if (!req.files?.length) throw new HttpError(400, 'No image received.');
    const folder = ['products', 'banners', 'categories', 'devices'].includes(req.body.folder) ? req.body.folder : 'products';
    const results = await Promise.all(req.files.map((f) => uploadBuffer(f.buffer, { folder })));
    res.status(201).json({ images: results.map((r) => ({ url: r.secure_url, publicId: r.public_id })) });
  })
);

admin.delete(
  '/upload',
  validate(z.object({ publicId: z.string().min(1).max(300) })),
  asyncHandler(async (req, res) => {
    await destroyImage(req.body.publicId);
    res.json({ ok: true });
  })
);

export default admin;
