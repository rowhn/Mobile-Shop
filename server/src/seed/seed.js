import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { assertEnv, env } from '../config/env.js';
import { connectDB } from '../config/db.js';
import {
  Banner,
  Category,
  Coupon,
  Device,
  Faq,
  Page,
  Product,
  RepairService,
  Settings,
  User,
  getSettings,
} from '../models/index.js';
import { slugify } from '../utils/helpers.js';
import * as data from './data.js';

const reset = process.argv.includes('--reset');
const round50 = (n) => Math.round(n / 50) * 50;

async function seedIfEmpty(Model, label, factory) {
  if (!reset && (await Model.estimatedDocumentCount()) > 0) {
    console.log(`• ${label}: already has data, skipped (use --reset to rebuild)`);
    return false;
  }
  await factory();
  return true;
}

async function seedAdmin() {
  let email = env.admin.email;
  let password = env.admin.password;
  let generated = false;
  if (!email) {
    if (env.isProd) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD before seeding in production.');
    email = 'admin@nova.local';
  }
  if (!password) {
    if (env.isProd) throw new Error('Set ADMIN_PASSWORD before seeding in production.');
    password = crypto.randomBytes(9).toString('base64url');
    generated = true;
  }
  if (password.length < 8) throw new Error('ADMIN_PASSWORD must be at least 8 characters.');

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
      console.log(`• Admin: promoted existing user ${email} to admin`);
    } else console.log(`• Admin: ${email} already exists, left unchanged`);
    return;
  }
  await User.create({
    name: env.admin.name,
    email,
    role: 'admin',
    passwordHash: await bcrypt.hash(password, 12),
  });
  console.log(`• Admin created: ${email}`);
  if (generated) console.log(`  Generated password (shown once, change it after signing in): ${password}`);
}

async function main() {
  assertEnv();
  await connectDB();

  if (reset) {
    console.log('Resetting catalogue, repair price lists, banners, coupons, content and settings (users, orders and repair bookings are kept)…');
    await Promise.all([Product, Category, Banner, Coupon, Device, RepairService, Faq, Page, Settings].map((M) => M.deleteMany({})));
  }

  await getSettings(); // creates the settings document with defaults

  const catBySlug = new Map();
  await seedIfEmpty(Category, 'Categories', async () => {
    const docs = await Category.insertMany(data.categories.map((c, i) => ({ ...c, sortOrder: i })));
    docs.forEach((d) => catBySlug.set(d.slug, d));
    console.log(`• Categories: ${docs.length}`);
  });
  if (!catBySlug.size) (await Category.find()).forEach((d) => catBySlug.set(d.slug, d));

  await seedIfEmpty(Product, 'Products', async () => {
    const docs = [];
    for (const p of data.products) {
      const { cat, variants, ...rest } = p;
      const category = catBySlug.get(cat);
      if (!category) throw new Error(`Unknown category slug in seed: ${cat}`);
      docs.push(
        await Product.create({
          ...rest,
          category: category._id,
          slug: slugify(`${p.brand} ${p.name}`),
          stock: rest.stock ?? 0,
          variants: variants.map((v) => {
            const options = Object.entries(v.options).map(([name, value]) => ({ name, value }));
            return { sku: v.sku, label: options.map((o) => o.value).join(' / '), options, price: v.price ?? null, stock: v.stock };
          }),
        })
      );
    }
    console.log(`• Products: ${docs.length} (no images yet: upload real ones from Admin → Products)`);
  });

  await seedIfEmpty(Banner, 'Banners', async () => {
    const docs = [];
    for (const b of data.banners) {
      const { productName, ...rest } = b;
      let ctaLink = rest.ctaLink || '';
      if (productName) {
        const prod = await Product.findOne({ name: productName }).select('slug');
        if (prod) ctaLink = `/product/${prod.slug}`;
      }
      docs.push({ ...rest, ctaLink });
    }
    await Banner.insertMany(docs);
    console.log(`• Banners: ${docs.length}`);
  });

  await seedIfEmpty(Coupon, 'Coupons', async () => {
    await Coupon.insertMany(data.coupons);
    console.log(`• Coupons: ${data.coupons.length} (${data.coupons.map((c) => c.code).join(', ')})`);
  });

  let services = [];
  await seedIfEmpty(RepairService, 'Repair services', async () => {
    services = await RepairService.insertMany(data.repairServices.map(({ base, eta, ...s }) => s));
    console.log(`• Repair services: ${services.length}`);
  });
  if (!services.length) services = await RepairService.find();

  await seedIfEmpty(Device, 'Repair devices', async () => {
    const bySlug = new Map(services.map((s) => [s.slug, s]));
    const docs = data.devices.map(([brand, model, tier]) => ({
      brand,
      model,
      slug: slugify(`${brand} ${model}`),
      repairs: data.repairServices
        .filter((s) => s.base)
        .map((s) => ({
          service: bySlug.get(s.slug)._id,
          priceMin: s.base[0] === s.base[1] ? s.base[0] : round50(s.base[0] * tier),
          priceMax: s.base[0] === s.base[1] ? s.base[1] : round50(s.base[1] * tier),
          etaHours: s.eta,
        })),
    }));
    await Device.insertMany(docs);
    console.log(`• Repair devices: ${docs.length} (illustrative estimates; edit in Admin → Repairs → Devices)`);
  });

  await seedIfEmpty(Faq, 'FAQs', async () => {
    await Faq.insertMany(data.faqs.map((f, i) => ({ ...f, sortOrder: i })));
    console.log(`• FAQs: ${data.faqs.length}`);
  });
  await seedIfEmpty(Page, 'Pages', async () => {
    await Page.insertMany(data.pages);
    console.log(`• Pages: ${data.pages.length} (starter text; review before launch)`);
  });

  await seedAdmin();

  console.log('\nDone.');
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('Seed failed:', err.message || err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
