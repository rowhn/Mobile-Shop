import mongoose from 'mongoose';
import { assertEnv, env, cloudinaryEnabled, razorpayEnabled } from './config/env.js';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';
import { Order } from './models/index.js';
import { restoreOrderStock } from './services/stock.js';

async function expireUnpaidOrders() {
  try {
    const cutoff = new Date(Date.now() - env.paymentWindowMinutes * 60 * 1000);
    const stale = await Order.find({
      status: 'pending_payment',
      'payment.status': { $in: ['pending', 'failed'] },
      createdAt: { $lt: cutoff },
      stockRestored: false,
    }).limit(50);
    for (const order of stale) {
      order.status = 'cancelled';
      order.payment.status = 'failed';
      order.timeline.push({ status: 'cancelled', note: 'Payment window expired' });
      await order.save();
      await restoreOrderStock(order);
    }
    if (stale.length) console.log(`Released stock for ${stale.length} unpaid order(s).`);
  } catch (err) {
    console.error('expireUnpaidOrders failed:', err.message);
  }
}

async function main() {
  assertEnv();
  await connectDB();
  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`Pranay Mobiles API listening on :${env.port} (${env.nodeEnv})`);
    console.log(`  Razorpay:   ${razorpayEnabled ? 'configured' : 'NOT configured (online payments disabled)'}`);
    console.log(`  Cloudinary: ${cloudinaryEnabled ? 'configured' : 'NOT configured (image uploads disabled; URLs still work)'}`);
  });

  // Free stock held by abandoned online-payment checkouts. Needs a long-running host (not serverless).
  const timer = setInterval(expireUnpaidOrders, 5 * 60 * 1000);
  timer.unref();

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down...`);
    clearInterval(timer);
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
