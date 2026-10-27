import { api } from './api.js';
import { loadRazorpay } from './hooks.js';

/**
 * Opens Razorpay Checkout for an order the SERVER created and priced.
 * The browser never decides the amount: `payment` (key id, razorpay order id, amount) comes from the API.
 * A payment only counts after /payments/razorpay/verify confirms the signature on the server.
 *
 * Resolves with { status: 'paid', order } | { status: 'dismissed' } | { status: 'failed', message }.
 */
export async function payWithRazorpay({ payment, order }) {
  const ok = await loadRazorpay();
  if (!ok) return { status: 'failed', message: 'Could not load the payment window. Check your connection and try again.' };

  return new Promise((resolve) => {
    let settled = false;
    const done = (r) => {
      if (!settled) {
        settled = true;
        resolve(r);
      }
    };
    const rzp = new window.Razorpay({
      key: payment.keyId,
      order_id: payment.razorpayOrderId,
      amount: payment.amount,
      currency: payment.currency,
      name: payment.name,
      description: payment.description,
      prefill: payment.prefill,
      theme: { color: '#0071e3' },
      handler: async (resp) => {
        try {
          const r = await api.post('/payments/razorpay/verify', {
            orderId: order.id,
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_signature: resp.razorpay_signature,
          });
          done({ status: 'paid', order: r.order });
        } catch (err) {
          done({ status: 'failed', message: err.message });
        }
      },
      modal: { ondismiss: () => done({ status: 'dismissed' }) },
    });
    rzp.on('payment.failed', (r) => done({ status: 'failed', message: r?.error?.description || 'The payment failed.' }));
    rzp.open();
  });
}
