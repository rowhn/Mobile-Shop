import { Router } from 'express';
import { Category, Product } from '../models/index.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler, notFound } from '../utils/http.js';
import { escapeRegex } from '../utils/helpers.js';
import { productListQuery } from '../validators/schemas.js';

const router = Router();

const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { finalPrice: 1, _id: 1 },
  price_desc: { finalPrice: -1, _id: 1 },
  name: { name: 1 },
  discount: { discountPercent: -1, createdAt: -1 },
};

async function buildFilter(q, skip = {}) {
  const filter = { status: 'active' };
  const and = [];

  if (q.category) {
    const cat = await Category.findOne({ slug: q.category, isActive: true }).select('_id');
    filter.category = cat ? cat._id : null; // unknown category matches nothing
  }
  if (q.brand && !skip.brand) {
    const brands = q.brand.split(',').map((s) => s.trim()).filter(Boolean);
    if (brands.length) filter.brand = { $in: brands };
  }
  if (!skip.price && (q.minPrice !== undefined || q.maxPrice !== undefined)) {
    filter.finalPrice = {};
    if (q.minPrice !== undefined) filter.finalPrice.$gte = q.minPrice;
    if (q.maxPrice !== undefined) filter.finalPrice.$lte = q.maxPrice;
  }
  if (q.flag === 'new') filter.isNewArrival = true;
  if (q.flag === 'featured') filter.isFeatured = true;
  if (q.flag === 'sale') and.push({ $or: [{ isOnSale: true }, { discountPercent: { $gt: 0 } }] });
  if (q.inStock) filter.totalStock = { $gt: 0 };

  if (q.q) {
    // every word must match name, brand, tags or short description
    for (const token of q.q.split(/\s+/).filter(Boolean).slice(0, 6)) {
      const rx = new RegExp(escapeRegex(token), 'i');
      and.push({ $or: [{ name: rx }, { brand: rx }, { tags: rx }, { shortDescription: rx }] });
    }
  }
  if (and.length) filter.$and = and;
  return filter;
}

router.get(
  '/',
  validate(productListQuery, 'query'),
  asyncHandler(async (req, res) => {
    const q = req.query;
    const filter = await buildFilter(q);
    const [items, total] = await Promise.all([
      Product.find(filter)
        .select('-description -specifications')
        .populate('category', 'name slug')
        .sort(SORTS[q.sort])
        .skip((q.page - 1) * q.limit)
        .limit(q.limit),
      Product.countDocuments(filter),
    ]);
    res.json({ items, total, page: q.page, pages: Math.max(1, Math.ceil(total / q.limit)) });
  })
);

// Brand list (with counts) and price bounds for the current search, for the filter sidebar.
router.get(
  '/facets',
  validate(productListQuery, 'query'),
  asyncHandler(async (req, res) => {
    const base = await buildFilter(req.query, { brand: true, price: true });
    const [brands, cheapest, priciest] = await Promise.all([
      Product.aggregate([
        { $match: base },
        { $group: { _id: '$brand', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Product.findOne(base).sort({ finalPrice: 1 }).select('finalPrice'),
      Product.findOne(base).sort({ finalPrice: -1 }).select('finalPrice'),
    ]);
    res.json({
      brands: brands.map((b) => ({ name: b._id, count: b.count })),
      price: { min: cheapest?.finalPrice ?? 0, max: priciest?.finalPrice ?? 0 },
    });
  })
);

router.get(
  '/suggest',
  asyncHandler(async (req, res) => {
    const q = String(req.query.q || '').trim().slice(0, 60);
    if (q.length < 2) return res.json({ items: [] });
    const rx = new RegExp(escapeRegex(q), 'i');
    const items = await Product.find({ status: 'active', $or: [{ name: rx }, { brand: rx }, { tags: rx }] })
      .select('name slug brand images finalPrice')
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(6);
    res.json({ items });
  })
);

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const product = await Product.findOne({ slug: req.params.slug, status: 'active' }).populate('category', 'name slug');
    if (!product) throw notFound('Product');
    const related = await Product.find({
      status: 'active',
      category: product.category?._id,
      _id: { $ne: product._id },
    })
      .select('-description -specifications')
      .populate('category', 'name slug')
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(4);
    res.json({ product, related });
  })
);

export default router;
