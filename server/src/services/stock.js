import { Product, Coupon } from '../models/index.js';

/**
 * Stock changes use single-document conditional updates, which MongoDB applies atomically:
 * the "stock >= qty" check and the decrement happen in the same operation, so two shoppers can never
 * both buy the last unit.
 *
 * Variants live in an array, so the update addresses the variant by its array index and *also* asserts
 * that the SKU at that index is the one we expect. If the array was re-ordered by an admin edit between
 * our read and our write, the SKU assertion fails and we simply re-read and retry.
 */
async function changeVariantStock(productId, sku, qty, mode /* 'reserve' | 'release' */) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const product = await Product.findById(productId).select('variants status');
    if (!product) return false;
    const i = product.variants.findIndex((v) => v.sku === sku);
    if (i === -1) return false;

    const filter = { _id: productId, [`variants.${i}.sku`]: sku };
    if (mode === 'reserve') {
      filter.status = 'active';
      filter[`variants.${i}.stock`] = { $gte: qty };
    }
    const delta = mode === 'reserve' ? -qty : qty;
    const res = await Product.updateOne(filter, { $inc: { [`variants.${i}.stock`]: delta, totalStock: delta } });
    if (res.modifiedCount === 1) return true;
    if (mode === 'reserve' && product.variants[i].stock < qty) return false; // genuinely not enough stock
  }
  return false;
}

async function reserveLine(line) {
  if (line.sku) return changeVariantStock(line.productId, line.sku, line.qty, 'reserve');
  const res = await Product.updateOne(
    { _id: line.productId, status: 'active', stock: { $gte: line.qty } },
    { $inc: { stock: -line.qty, totalStock: -line.qty } }
  );
  return res.modifiedCount === 1;
}

async function releaseLine(line) {
  const productId = line.productId || line.product;
  if (line.sku) return changeVariantStock(productId, line.sku, line.qty, 'release');
  await Product.updateOne({ _id: productId }, { $inc: { stock: line.qty, totalStock: line.qty } });
  return true;
}

/**
 * Reserves stock for every line. If any line fails, everything reserved so far is released.
 * Returns { ok: true } or { ok: false, line }.
 */
export async function reserveStock(lines) {
  const reserved = [];
  for (const line of lines) {
    if (!(await reserveLine(line))) {
      await releaseStock(reserved);
      return { ok: false, line };
    }
    reserved.push(line);
  }
  return { ok: true };
}

export async function releaseStock(lines) {
  for (const line of lines) await releaseLine(line);
}

/** Restores stock (and the coupon use) for a cancelled / expired order exactly once. */
export async function restoreOrderStock(order) {
  if (order.stockRestored) return;
  // Claim the restore atomically so concurrent cancel + expiry can't both add stock back.
  const claimed = await order.constructor.updateOne({ _id: order._id, stockRestored: false }, { $set: { stockRestored: true } });
  if (claimed.modifiedCount !== 1) return;
  order.stockRestored = true;
  await releaseStock(order.items.map((i) => ({ productId: i.product, sku: i.sku, qty: i.qty })));
  if (order.couponCode) {
    await Coupon.updateOne({ code: order.couponCode, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
  }
}

/** Atomically claims one coupon use, respecting its global usage limit (0 = unlimited). */
export async function claimCoupon(couponId) {
  const coupon = await Coupon.findById(couponId).select('usageLimit usedCount');
  if (!coupon) return false;
  const filter = { _id: couponId };
  if (coupon.usageLimit > 0) filter.usedCount = { $lt: coupon.usageLimit };
  const res = await Coupon.updateOne(filter, { $inc: { usedCount: 1 } });
  return res.modifiedCount === 1;
}
