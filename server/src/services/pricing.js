import { Product, Coupon, Order, getSettings } from '../models/index.js';

export const finalFrom = (mrp, discountPercent) => Math.round(mrp * (1 - (discountPercent || 0) / 100));
export const variantMrp = (product, variant) => (variant && variant.price != null ? variant.price : product.price);
export const unitPrice = (product, variant) => finalFrom(variantMrp(product, variant), product.discountPercent);

/**
 * Validates a coupon against a subtotal. Never trusts the client: used by both the cart quote and checkout.
 * Returns { ok: true, coupon, discount } or { ok: false, message }.
 */
export async function evaluateCoupon(code, subtotal, userId) {
  const coupon = await Coupon.findOne({ code: String(code).toUpperCase().trim() });
  const now = new Date();
  if (!coupon || !coupon.isActive) return { ok: false, message: 'This coupon code is not valid.' };
  if (coupon.startsAt && coupon.startsAt > now) return { ok: false, message: 'This coupon is not active yet.' };
  if (coupon.expiresAt && coupon.expiresAt < now) return { ok: false, message: 'This coupon has expired.' };
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
    return { ok: false, message: 'This coupon has reached its usage limit.' };
  if (subtotal < coupon.minOrder)
    return { ok: false, message: `Add items worth ₹${coupon.minOrder.toLocaleString('en-IN')} or more to use this coupon.` };
  if (userId && coupon.perUserLimit) {
    const used = await Order.countDocuments({
      user: userId,
      couponCode: coupon.code,
      status: { $nin: ['cancelled'] },
    });
    if (used >= coupon.perUserLimit) return { ok: false, message: 'You have already used this coupon.' };
  }
  let discount =
    coupon.type === 'percent' ? Math.floor((subtotal * coupon.value) / 100) : Math.min(coupon.value, subtotal);
  if (coupon.type === 'percent' && coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  return { ok: true, coupon, discount };
}

/**
 * Prices a cart from the database. The client only supplies product ids, SKUs and quantities.
 */
export async function buildQuote({ items, couponCode, userId }) {
  const settings = await getSettings();

  // merge duplicate lines
  const merged = new Map();
  for (const it of items) {
    const key = `${it.productId}:${it.sku || ''}`;
    const prev = merged.get(key);
    merged.set(key, prev ? { ...prev, qty: Math.min(10, prev.qty + it.qty) } : { ...it });
  }
  const lines = [...merged.values()];

  const products = await Product.find({
    _id: { $in: [...new Set(lines.map((l) => l.productId))] },
    status: 'active',
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const priced = [];
  const issues = [];

  for (const line of lines) {
    const p = byId.get(line.productId);
    if (!p) {
      issues.push({ productId: line.productId, sku: line.sku, message: 'This product is no longer available.' });
      continue;
    }
    let variant = null;
    if (p.variants.length) {
      variant = p.variants.find((v) => v.sku === line.sku);
      if (!variant) {
        issues.push({ productId: p.id, sku: line.sku, message: `${p.name}: please choose an available option.` });
        continue;
      }
    }
    const stock = variant ? variant.stock : p.stock;
    const unit = unitPrice(p, variant);
    let available = true;
    if (stock <= 0) {
      available = false;
      issues.push({ productId: p.id, sku: line.sku, message: `${p.name} is out of stock.` });
    } else if (line.qty > stock) {
      available = false;
      issues.push({ productId: p.id, sku: line.sku, message: `Only ${stock} of ${p.name} left in stock.` });
    }
    priced.push({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      image: variant?.image || p.images[0]?.url || '',
      sku: variant?.sku || '',
      variantLabel: variant?.label || variant?.options?.map((o) => o.value).join(' / ') || '',
      unitPrice: unit,
      mrp: variantMrp(p, variant),
      qty: line.qty,
      stock,
      available,
      lineTotal: unit * line.qty,
    });
  }

  const subtotal = priced.reduce((s, l) => s + l.lineTotal, 0);

  let discount = 0;
  let coupon = null;
  let couponError = null;
  if (couponCode && subtotal > 0) {
    const result = await evaluateCoupon(couponCode, subtotal, userId);
    if (result.ok) {
      discount = result.discount;
      coupon = { code: result.coupon.code, description: result.coupon.description, id: result.coupon.id };
    } else couponError = result.message;
  }

  const afterDiscount = subtotal - discount;
  const shipping = subtotal === 0 || afterDiscount >= settings.shipping.freeAbove ? 0 : settings.shipping.fee;

  return {
    lines: priced,
    issues,
    subtotal,
    discount,
    shipping,
    total: afterDiscount + shipping,
    coupon,
    couponError,
    freeShippingAbove: settings.shipping.freeAbove,
  };
}
