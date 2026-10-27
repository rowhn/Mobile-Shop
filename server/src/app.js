import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import storefront from './routes/storefront.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import repairRoutes from './routes/repairs.js';
import adminRoutes from './routes/admin/index.js';
import { cartRouter, ordersRouter, paymentsRouter, wishlistRouter } from './routes/cartOrders.js';
import { razorpayWebhook } from './routes/webhook.js';

const limiter = (windowMinutes, limit, message = 'Too many requests. Please slow down and try again shortly.') =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message },
  });

export function createApp() {
  const app = express();
  app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1));
  app.disable('x-powered-by');

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin(origin, cb) {
        // no Origin header = curl / server-to-server (e.g. Razorpay webhooks)
        if (!origin || env.clientUrls.includes(origin)) return cb(null, true);
        if (!env.isProd && /^http:\/\/localhost:\d+$/.test(origin)) return cb(null, true);
        return cb(null, false);
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 600,
    })
  );
  app.use(compression());
  if (env.nodeEnv !== 'test') app.use(morgan(env.isProd ? 'combined' : 'dev'));

  // Razorpay webhook needs the RAW body to verify its signature, so it is mounted before express.json().
  app.post('/api/payments/razorpay/webhook', express.raw({ type: '*/*', limit: '200kb' }), razorpayWebhook);

  app.use(express.json({ limit: '200kb' }));

  // Admin edits must show up on the live site immediately, so API responses are never cached.
  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  app.use('/api', limiter(15, 600));

  app.get('/api/health', (_req, res) => {
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    const db = states[mongoose.connection.readyState] || 'unknown';
    res.status(db === 'connected' ? 200 : 503).json({ status: db === 'connected' ? 'ok' : 'degraded', db });
  });

  app.use('/api/contact', limiter(60, 8, 'You have sent several messages already. Please try again later.'));
  app.use('/api/auth/login', limiter(15, 20, 'Too many sign-in attempts. Please try again in a few minutes.'));
  app.use('/api/auth/register', limiter(60, 15));
  app.use('/api/repairs/bookings', limiter(60, 20));
  app.use('/api/repairs/track', limiter(15, 40));

  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/cart', cartRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/payments', paymentsRouter);
  app.use('/api/wishlist', wishlistRouter);
  app.use('/api/repairs', repairRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api', storefront); // /config /home /categories /pages /faqs /contact

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
