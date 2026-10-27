import { Router } from 'express';
import { Category, Product } from '../../models/index.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler, HttpError, notFound } from '../../utils/http.js';
import { escapeRegex, uniqueSlug } from '../../utils/helpers.js';
import { destroyImage } from '../../config/cloudinary.js';
import { productCreateSchema, productUpdateSchema, stockUpdateSchema } from '../../validators/schemas.js';

const router = Router();

router.param('id', (_req, _res, next, id) =>
  /^[a-f\d]{24}$/i.test(id) ? next() : next(new HttpError(400, 'Invalid id'))
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const filter = {};
    if (typeof req.query.q === 'string' && req.query.q.trim()) {
      const rx = new RegExp(escapeRegex(req.query.q.trim().slice(0, 80)), 'i');
      filter.$or = [{ name: rx }, { brand: rx }, { 'variants.sku': rx }, { tags: rx }];
    }
    for (const f of ['status', 'category']) {
      if (typeof req.query[f] === 'string' && req.query[f]) filter[f] = req.query[f];
    }
    for (const f of ['isNewArrival', 'isFeatured', 'isOnSale']) {
      if (req.query[f] === 'true') filter[f] = true;
    }
    const [items, total] = await Promise.all([
      Product.find(filter)
        .select('-description -specifications')
        .populate('category', 'name slug')
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Product.countDocuments(filter),
    ]);
    res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const item = await Product.findById(req.params.id);
    if (!item) throw notFound('Product');
    res.json({ item });
  })
);

async function assertCategory(id) {
  if (!(await Category.exists({ _id: id }))) throw new HttpError(400, 'Selected category does not exist.');
}

router.post(
  '/',
  validate(productCreateSchema),
  asyncHandler(async (req, res) => {
    await assertCategory(req.body.category);
    const slug = await uniqueSlug(Product, `${req.body.brand} ${req.body.name}`);
    const item = await Product.create({ ...req.body, slug });
    res.status(201).json({ item });
  })
);

router.patch(
  '/:id',
  validate(productUpdateSchema),
  asyncHandler(async (req, res) => {
    const item = await Product.findById(req.params.id);
    if (!item) throw notFound('Product');
    if (req.body.category) await assertCategory(req.body.category);

    // images removed in this edit are also removed from Cloudinary
    if (req.body.images) {
      const keep = new Set(req.body.images.map((i) => i.publicId).filter(Boolean));
      for (const old of item.images) if (old.publicId && !keep.has(old.publicId)) destroyImage(old.publicId);
    }
    item.set(req.body); // slug stays stable so existing links keep working
    await item.save(); // runs the pre-validate hook that recomputes price + stock totals
    res.json({ item });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const item = await Product.findById(req.params.id);
    if (!item) throw notFound('Product');
    await item.deleteOne();
    for (const img of item.images) if (img.publicId) destroyImage(img.publicId);
    res.json({ ok: true });
  })
);

/* ---------- inventory ---------- */
export const inventoryRouter = Router();

inventoryRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = { status: { $ne: 'archived' } };
    if (typeof req.query.q === 'string' && req.query.q.trim()) {
      const rx = new RegExp(escapeRegex(req.query.q.trim().slice(0, 80)), 'i');
      filter.$or = [{ name: rx }, { brand: rx }, { 'variants.sku': rx }];
    }
    const products = await Product.find(filter).select('name brand images stock variants lowStockThreshold status').sort({ name: 1 }).limit(500);
    const rows = [];
    for (const p of products) {
      if (p.variants.length) {
        for (const v of p.variants) {
          rows.push({
            productId: p.id,
            name: p.name,
            brand: p.brand,
            image: p.images[0]?.url || '',
            sku: v.sku,
            label: v.label || v.options.map((o) => o.value).join(' / '),
            stock: v.stock,
            threshold: p.lowStockThreshold,
          });
        }
      } else {
        rows.push({
          productId: p.id,
          name: p.name,
          brand: p.brand,
          image: p.images[0]?.url || '',
          sku: '',
          label: '',
          stock: p.stock,
          threshold: p.lowStockThreshold,
        });
      }
    }
    const onlyLow = req.query.low === 'true';
    res.json({ items: onlyLow ? rows.filter((r) => r.stock <= r.threshold) : rows });
  })
);

inventoryRouter.patch(
  '/',
  validate(stockUpdateSchema),
  asyncHandler(async (req, res) => {
    const { productId, sku, stock } = req.body;
    const product = await Product.findById(productId);
    if (!product) throw notFound('Product');
    if (sku) {
      const variant = product.variants.find((v) => v.sku === sku);
      if (!variant) throw notFound('Variant');
      variant.stock = stock;
    } else {
      if (product.variants.length) throw new HttpError(400, 'This product has variants; update stock per SKU.');
      product.stock = stock;
    }
    await product.save();
    res.json({ ok: true, totalStock: product.totalStock });
  })
);

export default router;
