import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { env, razorpayEnabled } from '../config/env.js';
import { HttpError } from '../utils/http.js';

let client = null;

function getClient() {
  if (!razorpayEnabled) {
    throw new HttpError(503, 'Online payments are not configured on this store yet.');
  }
  client ??= new Razorpay({ key_id: env.razorpay.keyId, key_secret: env.razorpay.keySecret });
  return client;
}

/** Creates a Razorpay order. Amount is in whole rupees; Razorpay wants paise. */
export async function createRazorpayOrder({ amountRupees, receipt, notes = {} }) {
  try {
    return await getClient().orders.create({
      amount: Math.round(amountRupees * 100),
      currency: 'INR',
      receipt,
      notes,
    });
  } catch (err) {
    if (err instanceof HttpError) throw err;
    console.error('Razorpay order creation failed:', err?.error || err);
    throw new HttpError(502, 'Could not start the payment. Please try again in a moment.');
  }
}

const safeEqual = (a, b) => {
  const ba = Buffer.from(String(a), 'utf8');
  const bb = Buffer.from(String(b), 'utf8');
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
};

/** Checkout signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret). */
export function verifyPaymentSignature(orderId, paymentId, signature) {
  if (!razorpayEnabled) return false;
  const expected = crypto
    .createHmac('sha256', env.razorpay.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return safeEqual(expected, signature);
}

/** Webhook signature: HMAC_SHA256(raw_body, webhook_secret). */
export function verifyWebhookSignature(rawBody, signature) {
  if (!env.razorpay.webhookSecret || !signature) return false;
  const expected = crypto.createHmac('sha256', env.razorpay.webhookSecret).update(rawBody).digest('hex');
  return safeEqual(expected, signature);
}

export function paymentParamsFor(order, user, storeName) {
  return {
    provider: 'razorpay',
    keyId: env.razorpay.keyId,
    razorpayOrderId: order.payment.razorpayOrderId,
    amount: Math.round(order.total * 100),
    currency: 'INR',
    name: storeName || 'Pranay Mobiles',
    description: `Order ${order.orderNumber}`,
    prefill: { name: user.name, email: user.email, contact: order.shippingAddress.phone },
  };
}
