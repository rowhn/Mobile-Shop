import { Order } from '../models/index.js';
import { verifyWebhookSignature } from '../services/razorpay.js';
import { markOrderPaid } from './cartOrders.js';

/**
 * Razorpay webhook (configure in Razorpay Dashboard → Webhooks, events: payment.captured, order.paid, payment.failed).
 * Mounted with express.raw() BEFORE express.json(), because the signature is computed over the raw body.
 * This is a safety net: if the shopper closes the tab right after paying, the order still gets confirmed.
 */
export async function razorpayWebhook(req, res) {
  const signature = req.headers['x-razorpay-signature'];
  const raw = req.body; // Buffer
  if (!Buffer.isBuffer(raw) || !verifyWebhookSignature(raw, signature)) {
    return res.status(400).json({ message: 'Invalid signature' });
  }
  try {
    const event = JSON.parse(raw.toString('utf8'));
    const payment = event?.payload?.payment?.entity;
    const razorpayOrderId = payment?.order_id || event?.payload?.order?.entity?.id;
    if (razorpayOrderId) {
      const order = await Order.findOne({ 'payment.razorpayOrderId': razorpayOrderId });
      if (order) {
        if (event.event === 'payment.captured' || event.event === 'order.paid') {
          // Amount safety check: Razorpay amounts are in paise.
          if (!payment || payment.amount === Math.round(order.total * 100)) await markOrderPaid(order, payment?.id || '');
        } else if (event.event === 'payment.failed' && order.payment.status === 'pending') {
          order.payment.status = 'failed';
          order.timeline.push({ status: order.status, note: 'Payment attempt failed' });
          await order.save();
        }
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handling error', err);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
}
