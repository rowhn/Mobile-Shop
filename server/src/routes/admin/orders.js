import { Router } from 'express';
import { Order, User } from '../../models/index.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler, HttpError, notFound } from '../../utils/http.js';
import { escapeRegex } from '../../utils/helpers.js';
import { restoreOrderStock } from '../../services/stock.js';
import { orderAdminUpdateSchema } from '../../validators/schemas.js';

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
    if (typeof req.query.status === 'string' && req.query.status) filter.status = req.query.status;
    if (typeof req.query.payment === 'string' && req.query.payment) filter['payment.status'] = req.query.payment;
    if (typeof req.query.q === 'string' && req.query.q.trim()) {
      const q = req.query.q.trim().slice(0, 60);
      const rx = new RegExp(escapeRegex(q), 'i');
      const users = await User.find({ $or: [{ email: rx }, { name: rx }] }).select('_id').limit(50);
      filter.$or = [{ orderNumber: rx }, { 'shippingAddress.phone': rx }, { user: { $in: users.map((u) => u._id) } }];
    }
    const [items, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email phone')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Order.countDocuments(filter),
    ]);
    res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const item = await Order.findById(req.params.id).populate('user', 'name email phone');
    if (!item) throw notFound('Order');
    res.json({ item });
  })
);

router.patch(
  '/:id',
  validate(orderAdminUpdateSchema),
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) throw notFound('Order');
    const { status, paymentStatus, courier, trackingNumber, note } = req.body;

    if (courier !== undefined) order.tracking.courier = courier;
    if (trackingNumber !== undefined) order.tracking.trackingNumber = trackingNumber;
    if (paymentStatus) {
      order.payment.status = paymentStatus;
      if (paymentStatus === 'paid' && !order.payment.paidAt) order.payment.paidAt = new Date();
    }

    if (status && status !== order.status) {
      if (order.status === 'cancelled') throw new HttpError(400, 'A cancelled order cannot be re-opened. Ask the customer to place a new order.');
      order.status = status;
      order.timeline.push({ status, note: note || '', by: req.user.id });
      if (status === 'delivered' && order.payment.method === 'cod') {
        order.payment.status = 'paid'; // cash collected on delivery
        order.payment.paidAt = new Date();
      }
      if (status === 'cancelled') {
        if (order.payment.status === 'paid') order.payment.status = 'refund_pending';
        else if (order.payment.method === 'razorpay' && order.payment.status === 'pending') order.payment.status = 'failed';
      }
    } else if (note) {
      order.timeline.push({ status: order.status, note, by: req.user.id });
    }

    await order.save();
    if (order.status === 'cancelled') await restoreOrderStock(order);
    res.json({ item: await order.populate('user', 'name email phone') });
  })
);

export default router;
