import { Router } from 'express';
import { Coupon, Order, Product, User, getSettings } from '../models/index.js';
import { env, razorpayEnabled } from '../config/env.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler, HttpError, notFound } from '../utils/http.js';
import { buildQuote } from '../services/pricing.js';
import { claimCoupon, releaseStock, reserveStock, restoreOrderStock } from '../services/stock.js';
import {
  createRazorpayOrder,
  paymentParamsFor,
  verifyPaymentSignature,
} from '../services/razorpay.js';
import { cartQuoteSchema, checkoutSchema, razorpayVerifySchema } from '../validators/schemas.js';

export const cartRouter = Router();
export const ordersRouter = Router();
export const paymentsRouter = Router();
export const wishlistRouter = Router();

/* ---------------- cart quote (server-side pricing) ---------------- */
cartRouter.post(
  '/quote',
  optionalAuth,
  validate(cartQuoteSchema),
  asyncHandler(async (req, res) => {
    res.json(await buildQuote({ items: req.body.items, couponCode: req.body.couponCode, userId: req.user?.id }));
  })
);

/* ---------------- orders ---------------- */
ordersRouter.use(requireAuth);

ordersRouter.post(
  '/',
  validate(checkoutSchema),
  asyncHandler(async (req, res) => {
    const { items, couponCode, paymentMethod, shippingAddress, notes } = req.body;

    if (paymentMethod === 'razorpay' && !razorpayEnabled)
      throw new HttpError(400, 'Online payment is not available right now. Please choose another method.');
    if (paymentMethod === 'cod' && !env.enableCod)
      throw new HttpError(400, 'Cash on delivery is not available.');

    // 1. Price everything on the server.
    const quote = await buildQuote({ items, couponCode, userId: req.user.id });
    if (quote.issues.length) throw new HttpError(409, quote.issues[0].message, quote.issues);
    if (couponCode && quote.couponError) throw new HttpError(400, quote.couponError);
    if (!quote.lines.length) throw new HttpError(400, 'Your cart is empty.');

    // 2. Reserve stock atomically (never oversell) and claim the coupon.
    const stockLines = quote.lines.map((l) => ({ productId: l.productId, sku: l.sku, qty: l.qty }));
    const reservation = await reserveStock(stockLines);
    if (!reservation.ok) {
      const bad = quote.lines.find((l) => l.productId === reservation.line.productId && l.sku === reservation.line.sku);
      throw new HttpError(409, `${bad?.name || 'An item'} just went out of stock. Please review your cart.`);
    }
    if (quote.coupon && !(await claimCoupon(quote.coupon.id))) {
      await releaseStock(stockLines);
      throw new HttpError(409, 'This coupon has just reached its usage limit.');
    }

    const rollback = async () => {
      await releaseStock(stockLines);
      if (quote.coupon) {
        await Coupon.updateOne({ _id: quote.coupon.id, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
      }
    };

    try {
      const order = new Order({
        user: req.user.id,
        items: quote.lines.map((l) => ({
          product: l.productId,
          slug: l.slug,
          name: l.name,
          brand: l.brand,
          image: l.image,
          sku: l.sku,
          variantLabel: l.variantLabel,
          unitPrice: l.unitPrice,
          mrp: l.mrp,
          qty: l.qty,
        })),
        shippingAddress,
        subtotal: quote.subtotal,
        discount: quote.discount,
        shipping: quote.shipping,
        total: quote.total,
        couponCode: quote.coupon?.code || '',
        notes,
        payment: { method: paymentMethod, status: 'pending' },
        status: paymentMethod === 'cod' ? 'placed' : 'pending_payment',
        timeline: [
          {
            status: paymentMethod === 'cod' ? 'placed' : 'pending_payment',
            note: paymentMethod === 'cod' ? 'Order placed (cash on delivery)' : 'Waiting for payment',
          },
        ],
      });

      let payment = null;
      if (paymentMethod === 'razorpay') {
        const rzp = await createRazorpayOrder({
          amountRupees: order.total,
          receipt: order.orderNumber,
          notes: { orderId: order.id },
        });
        order.payment.razorpayOrderId = rzp.id;
        const settings = await getSettings();
        payment = paymentParamsFor(order, req.user, settings.storeName);
      }
      await order.save();
      res.status(201).json({ order, payment });
    } catch (err) {
      await rollback();
      throw err;
    }
  })
);

ordersRouter.get(
  '/mine',
  asyncHandler(async (req, res) => {
    const items = await Order.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(100);
    res.json({ items });
  })
);

async function ownOrder(req) {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) throw notFound('Order');
  const order = await Order.findOne({ _id: req.params.id, user: req.user.id });
  if (!order) throw notFound('Order');
  return order;
}

ordersRouter.get(
  '/:id',
  asyncHandler(async (req, res) => res.json({ order: await ownOrder(req) }))
);

// Re-open payment for an order whose payment was abandoned or failed.
ordersRouter.post(
  '/:id/pay',
  asyncHandler(async (req, res) => {
    const order = await ownOrder(req);
    if (order.payment.method !== 'razorpay' || order.status !== 'pending_payment' || order.payment.status === 'paid')
      throw new HttpError(400, 'This order does not need a payment.');
    if (!order.payment.razorpayOrderId) throw new HttpError(400, 'Payment is not available for this order.');
    const settings = await getSettings();
    res.json({ order, payment: paymentParamsFor(order, req.user, settings.storeName) });
  })
);

ordersRouter.post(
  '/:id/cancel',
  asyncHandler(async (req, res) => {
    const order = await ownOrder(req);
    if (!['pending_payment', 'placed', 'confirmed'].includes(order.status))
      throw new HttpError(400, 'This order can no longer be cancelled. Please contact support.');
    order.status = 'cancelled';
    if (order.payment.status === 'paid') order.payment.status = 'refund_pending';
    else order.payment.status = order.payment.method === 'razorpay' ? 'failed' : order.payment.status;
    order.timeline.push({ status: 'cancelled', note: 'Cancelled by customer', by: req.user.id });
    await order.save();
    await restoreOrderStock(order);
    res.json({ order });
  })
);

/* ---------------- payments ---------------- */
export async function markOrderPaid(order, paymentId) {
  if (order.payment.status === 'paid') return order; // idempotent
  if (order.status === 'cancelled') {
    // Money arrived for an order we already cancelled / expired – flag it for a manual refund.
    order.payment.status = 'refund_pending';
    order.payment.razorpayPaymentId = paymentId;
    order.timeline.push({ status: 'cancelled', note: 'Payment received after cancellation – refund needed' });
    return order.save();
  }
  order.payment.status = 'paid';
  order.payment.razorpayPaymentId = paymentId;
  order.payment.paidAt = new Date();
  order.status = 'confirmed';
  order.timeline.push({ status: 'confirmed', note: 'Payment received' });
  return order.save();
}

paymentsRouter.post(
  '/razorpay/verify',
  requireAuth,
  validate(razorpayVerifySchema),
  asyncHandler(async (req, res) => {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const order = await Order.findOne({ _id: orderId, user: req.user.id });
    if (!order) throw notFound('Order');
    if (!order.payment.razorpayOrderId || order.payment.razorpayOrderId !== razorpay_order_id)
      throw new HttpError(400, 'Payment does not match this order.');
    if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      order.payment.status = 'failed';
      order.timeline.push({ status: order.status, note: 'Payment signature verification failed' });
      await order.save();
      throw new HttpError(400, 'We could not verify this payment. If money was deducted, it will be refunded automatically.');
    }
    await markOrderPaid(order, razorpay_payment_id);
    res.json({ order });
  })
);

/* ---------------- wishlist ---------------- */
wishlistRouter.use(requireAuth);

wishlistRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select('wishlist');
    const items = await Product.find({ _id: { $in: user.wishlist }, status: 'active' })
      .select('-description -specifications')
      .populate('category', 'name slug');
    res.json({ items, ids: items.map((p) => p.id) });
  })
);

wishlistRouter.put(
  '/:productId',
  asyncHandler(async (req, res) => {
    if (!/^[a-f\d]{24}$/i.test(req.params.productId)) throw new HttpError(400, 'Invalid product');
    if (!(await Product.exists({ _id: req.params.productId, status: 'active' }))) throw notFound('Product');
    await User.updateOne({ _id: req.user.id }, { $addToSet: { wishlist: req.params.productId } });
    res.json({ ok: true });
  })
);

wishlistRouter.delete(
  '/:productId',
  asyncHandler(async (req, res) => {
    if (!/^[a-f\d]{24}$/i.test(req.params.productId)) throw new HttpError(400, 'Invalid product');
    await User.updateOne({ _id: req.user.id }, { $pull: { wishlist: req.params.productId } });
    res.json({ ok: true });
  })
);
