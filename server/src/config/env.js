import 'dotenv/config';

const bool = (v, fallback = false) =>
  v === undefined || v === '' ? fallback : ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());

const clean = (v) => (v || '').trim();

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 5000,
  mongoUri: clean(process.env.MONGODB_URI),
  jwtSecret: clean(process.env.JWT_SECRET),
  jwtExpiresIn: clean(process.env.JWT_EXPIRES_IN) || '7d',
  // Comma separated list of allowed browser origins (your Vercel URL(s) + localhost)
  clientUrls: clean(process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean),
  cloudinary: {
    cloudName: clean(process.env.CLOUDINARY_CLOUD_NAME),
    apiKey: clean(process.env.CLOUDINARY_API_KEY),
    apiSecret: clean(process.env.CLOUDINARY_API_SECRET),
    folder: clean(process.env.CLOUDINARY_FOLDER) || 'nova',
  },
  razorpay: {
    keyId: clean(process.env.RAZORPAY_KEY_ID),
    keySecret: clean(process.env.RAZORPAY_KEY_SECRET),
    webhookSecret: clean(process.env.RAZORPAY_WEBHOOK_SECRET),
  },
  enableCod: bool(process.env.ENABLE_COD, true),
  paymentWindowMinutes: Number(process.env.PAYMENT_WINDOW_MINUTES) || 30,
  admin: {
    email: clean(process.env.ADMIN_EMAIL).toLowerCase(),
    password: process.env.ADMIN_PASSWORD || '',
    name: clean(process.env.ADMIN_NAME) || 'Store Admin',
  },
};

export const cloudinaryEnabled = Boolean(
  env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret
);
export const razorpayEnabled = Boolean(env.razorpay.keyId && env.razorpay.keySecret);

export function assertEnv() {
  const problems = [];
  if (!env.mongoUri) problems.push('MONGODB_URI is not set.');
  if (!env.jwtSecret) problems.push('JWT_SECRET is not set.');
  else if (env.isProd && env.jwtSecret.length < 32)
    problems.push('JWT_SECRET must be at least 32 characters in production.');
  if (problems.length) {
    throw new Error(
      `Invalid configuration:\n - ${problems.join('\n - ')}\nCopy server/.env.example to server/.env and fill it in.`
    );
  }
}
