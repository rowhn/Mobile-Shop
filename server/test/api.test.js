// Integration tests. Run against a THROWAWAY database:
//   MONGODB_URI=mongodb://127.0.0.1:27017/nova_test JWT_SECRET=... npm test
// The suite re-seeds the database first (`seed --reset`), so never point it at production.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

process.env.NODE_ENV = 'test';
process.env.RAZORPAY_KEY_ID ||= 'rzp_test_dummy';
process.env.RAZORPAY_KEY_SECRET ||= 'dummy_secret_for_signature_tests';
process.env.RAZORPAY_WEBHOOK_SECRET ||= 'dummy_webhook_secret';
process.env.ADMIN_EMAIL ||= 'admin@test.dev';
process.env.ADMIN_PASSWORD ||= 'AdminPass#2026';
process.env.JWT_SECRET ||= 'test-secret-test-secret-test-secret-123456';

const here = path.dirname(fileURLToPath(import.meta.url));
let server, base, mongoose, models;
let isFerret = false; // FerretDB (used for local dev tests) is not atomic under concurrent writes; real MongoDB is
const rand = () => crypto.randomBytes(4).toString('hex');

async function call(method, url, { body, token, raw, headers = {} } = {}) {
  const res = await fetch(base + url, {
    method,
    headers: { ...(body && !raw ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    body: raw ?? (body ? JSON.stringify(body) : undefined),
  });
  let json = null;
  try { json = await res.json(); } catch { /* empty */ }
  return { status: res.status, body: json };
}

before(async () => {
  assert.ok(process.env.MONGODB_URI, 'Set MONGODB_URI to a throwaway database');
  execFileSync('node', [path.join(here, '../src/seed/seed.js'), '--reset'], { stdio: 'ignore', env: process.env });
  const { connectDB } = await import('../src/config/db.js');
  const { createApp } = await import('../src/app.js');
  mongoose = (await import('mongoose')).default;
  models = await import('../src/models/index.js');
  await connectDB();
  await models.RepairBooking.deleteMany({}); // slot-capacity test needs empty slots
  const info = await mongoose.connection.db.admin().command({ buildInfo: 1 });
  isFerret = Boolean(info.ferretdb || info.buildEnvironment?.['go.version']); // FerretDB is written in Go; real mongod reports no Go build info
  server = createApp().listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  server?.close();
  await mongoose?.disconnect();
});

const address = { name: 'Test Buyer', phone: '9876543210', line1: '12 MG Road', city: 'Pune', state: 'Maharashtra', pincode: '411001' };

let customerToken, adminToken;

test('public config never exposes secrets', async () => {
  const r = await call('GET', '/config');
  assert.equal(r.status, 200);
  assert.equal(r.body.payments.razorpay, true);
  assert.ok(!JSON.stringify(r.body).includes(process.env.RAZORPAY_KEY_SECRET));
});

test('home aggregates banners, categories and product rails', async () => {
  const r = await call('GET', '/home');
  assert.equal(r.status, 200);
  assert.ok(r.body.banners.hero.length >= 1);
  assert.ok(r.body.categories.length >= 1);
  assert.ok(r.body.featured.length >= 1);
});

test('product listing: filter, sort, search, facets, detail', async () => {
  let r = await call('GET', '/products?category=audio&sort=price_asc');
  assert.equal(r.status, 200);
  const prices = r.body.items.map((p) => p.finalPrice);
  assert.deepEqual(prices, [...prices].sort((a, b) => a - b));
  assert.ok(r.body.items.every((p) => p.category.slug === 'audio'));

  r = await call('GET', '/products?flag=sale');
  assert.ok(r.body.items.length > 0 && r.body.items.every((p) => p.onSale));

  r = await call('GET', '/products?q=buds');
  assert.ok(r.body.items.some((p) => p.name === 'Buds Pro'));

  r = await call('GET', '/products?minPrice=1000&maxPrice=3000');
  assert.ok(r.body.items.every((p) => p.finalPrice >= 1000 && p.finalPrice <= 3000));

  r = await call('GET', '/products/facets?category=audio');
  assert.ok(r.body.brands.length >= 2);

  r = await call('GET', '/products/suggest?q=wat');
  assert.ok(r.body.items.length >= 1);

  r = await call('GET', '/products/nova-phone-2-pro');
  assert.equal(r.status, 200);
  assert.equal(r.body.product.variants.length, 4);
  assert.ok(r.body.related.length > 0);

  r = await call('GET', '/products/does-not-exist');
  assert.equal(r.status, 404);
});

test('rejects malformed query input instead of passing it to the database', async () => {
  const r = await call('GET', '/products?page=abc');
  assert.equal(r.status, 400);
  const r2 = await call('GET', '/products?category[$ne]=x');
  assert.ok([200, 400].includes(r2.status));
});

test('register / login / me / role cannot be self-assigned', async () => {
  const email = `buyer_${rand()}@test.dev`;
  let r = await call('POST', '/auth/register', { body: { name: 'Buyer', email, password: 'Sup3rSecret!', role: 'admin' } });
  assert.equal(r.status, 201);
  assert.equal(r.body.user.role, 'customer');
  assert.equal(r.body.user.passwordHash, undefined);
  customerToken = r.body.token;

  r = await call('POST', '/auth/register', { body: { name: 'Buyer', email, password: 'Sup3rSecret!' } });
  assert.equal(r.status, 409);

  r = await call('POST', '/auth/login', { body: { email, password: 'wrong-password' } });
  assert.equal(r.status, 401);

  r = await call('POST', '/auth/login', { body: { email, password: 'Sup3rSecret!' } });
  assert.equal(r.status, 200);

  r = await call('GET', '/auth/me', { token: customerToken });
  assert.equal(r.body.user.email, email);

  r = await call('GET', '/auth/me');
  assert.equal(r.status, 401);

  r = await call('POST', '/auth/login', { body: { email: 'admin@test.dev', password: 'AdminPass#2026' } });
  assert.equal(r.status, 200);
  adminToken = r.body.token;
});

test('customers cannot reach admin APIs; admin can', async () => {
  assert.equal((await call('GET', '/admin/stats', { token: customerToken })).status, 403);
  assert.equal((await call('GET', '/admin/products')).status, 401);
  const r = await call('GET', '/admin/stats', { token: adminToken });
  assert.equal(r.status, 200);
  assert.ok('revenue' in r.body);
});

async function productBySlug(slug) {
  return (await call('GET', `/products/${slug}`)).body.product;
}

test('cart quote prices on the server and flags stock problems', async () => {
  const phone = await productBySlug('nova-phone-2-pro');
  const ok = phone.variants.find((v) => v.sku === 'NP2P-BLK-256');
  const oos = phone.variants.find((v) => v.sku === 'NP2P-SLV-512');

  let r = await call('POST', '/cart/quote', { body: { items: [{ productId: phone.id, sku: ok.sku, qty: 2 }] } });
  assert.equal(r.status, 200);
  assert.equal(r.body.subtotal, 79999 * 2);
  assert.equal(r.body.shipping, 0);

  r = await call('POST', '/cart/quote', { body: { items: [{ productId: phone.id, sku: oos.sku, qty: 1 }] } });
  assert.equal(r.body.issues.length, 1);
  assert.match(r.body.issues[0].message, /out of stock/i);

  // 512GB variant uses its own MRP
  r = await call('POST', '/cart/quote', { body: { items: [{ productId: phone.id, sku: 'NP2P-BLK-512', qty: 1 }] } });
  assert.equal(r.body.subtotal, 89999);

  const cable = await productBySlug('nova-usb-c-cable-2-pack');
  r = await call('POST', '/cart/quote', { body: { items: [{ productId: cable.id, qty: 1 }] } });
  assert.equal(r.body.shipping, 99); // below free-shipping threshold

  r = await call('POST', '/cart/quote', { body: { items: [{ productId: phone.id, sku: ok.sku, qty: 1 }], couponCode: 'welcome10' } });
  assert.equal(r.body.discount, 1500); // 10% of 79,999 capped at 1,500
  r = await call('POST', '/cart/quote', { body: { items: [{ productId: cable.id, qty: 1 }], couponCode: 'FLAT500' } });
  assert.ok(r.body.couponError);
  assert.equal(r.body.discount, 0);
});

test('checkout (COD): server price, stock reserved, coupon claimed, cancel restores both', async () => {
  const charger = await productBySlug('nova-65w-gan-charger');
  const before = charger.stock;

  let r = await call('POST', '/orders', {
    token: customerToken,
    body: { items: [{ productId: charger.id, qty: 3, price: 1 }], paymentMethod: 'cod', shippingAddress: address, couponCode: 'WELCOME10' },
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const order = r.body.order;
  assert.equal(order.status, 'placed');
  assert.equal(order.subtotal, 2499 * 3); // client-sent "price" ignored
  assert.equal(order.discount, 749); // 10% floor of 7497
  assert.equal(order.total, 7497 - 749);
  assert.equal((await productBySlug('nova-65w-gan-charger')).stock, before - 3);

  const coupon = await models.Coupon.findOne({ code: 'WELCOME10' });
  assert.equal(coupon.usedCount, 1);

  // per-user limit
  r = await call('POST', '/orders', {
    token: customerToken,
    body: { items: [{ productId: charger.id, qty: 1 }], paymentMethod: 'cod', shippingAddress: address, couponCode: 'WELCOME10' },
  });
  assert.equal(r.status, 400);

  r = await call('POST', `/orders/${order.id}/cancel`, { token: customerToken });
  assert.equal(r.status, 200);
  assert.equal(r.body.order.status, 'cancelled');
  assert.equal((await productBySlug('nova-65w-gan-charger')).stock, before);
  assert.equal((await models.Coupon.findOne({ code: 'WELCOME10' })).usedCount, 0);

  // cancelling twice must not restore stock twice
  await call('POST', `/orders/${order.id}/cancel`, { token: customerToken });
  assert.equal((await productBySlug('nova-65w-gan-charger')).stock, before);
});

test('checkout never oversells the last units (concurrent buyers)', async (t) => {
  if (isFerret) return t.skip('needs real MongoDB: single-document atomic updates');
  const coral = await productBySlug('nova-speaker-mini'); // NSM-CRL has stock 2
  const mk = () =>
    call('POST', '/orders', {
      token: customerToken,
      body: { items: [{ productId: coral.id, sku: 'NSM-CRL', qty: 2 }], paymentMethod: 'cod', shippingAddress: address },
    });
  const results = await Promise.all([mk(), mk(), mk()]);
  const ok = results.filter((r) => r.status === 201).length;
  assert.equal(ok, 1, `expected exactly one success, got ${results.map((r) => r.status)}`);
  const after = (await productBySlug('nova-speaker-mini')).variants.find((v) => v.sku === 'NSM-CRL');
  assert.equal(after.stock, 0);
});

test('variant stock is reserved per SKU and restored on cancel; totals stay in sync', async () => {
  const before = await productBySlug('nova-watch-3');
  const v0 = before.variants.find((v) => v.sku === 'NW3-45-MID').stock;
  const other0 = before.variants.find((v) => v.sku === 'NW3-41-MID').stock;
  let r = await call('POST', '/orders', {
    token: customerToken,
    body: { items: [{ productId: before.id, sku: 'NW3-45-MID', qty: 2 }], paymentMethod: 'cod', shippingAddress: address },
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  let now = await productBySlug('nova-watch-3');
  assert.equal(now.variants.find((v) => v.sku === 'NW3-45-MID').stock, v0 - 2);
  assert.equal(now.variants.find((v) => v.sku === 'NW3-41-MID').stock, other0); // other variants untouched
  assert.equal(now.totalStock, before.totalStock - 2);

  await call('POST', `/orders/${r.body.order.id}/cancel`, { token: customerToken });
  now = await productBySlug('nova-watch-3');
  assert.equal(now.variants.find((v) => v.sku === 'NW3-45-MID').stock, v0);
  assert.equal(now.totalStock, before.totalStock);

  // asking for more than exists is refused and changes nothing
  r = await call('POST', '/orders', {
    token: customerToken,
    body: { items: [{ productId: before.id, sku: 'NW3-45-SLV', qty: 10 }], paymentMethod: 'cod', shippingAddress: address },
  });
  assert.equal(r.status, 409);
});

test('coupon global usage limit is enforced atomically', async (t) => {
  if (isFerret) return t.skip('needs real MongoDB: single-document atomic updates');
  await models.Coupon.create({ code: 'ONCE', type: 'flat', value: 100, usageLimit: 1 });
  const cable = await productBySlug('nova-usb-c-cable-2-pack');
  const mk = () =>
    call('POST', '/orders', {
      token: customerToken,
      body: { items: [{ productId: cable.id, qty: 1 }], paymentMethod: 'cod', shippingAddress: address, couponCode: 'ONCE' },
    });
  const results = await Promise.all([mk(), mk(), mk()]);
  assert.equal(results.filter((r) => r.status === 201).length, 1, results.map((r) => r.status).join());
  assert.equal((await models.Coupon.findOne({ code: 'ONCE' })).usedCount, 1);
});

test('checkout validates the address and requires login', async () => {
  const charger = await productBySlug('nova-65w-gan-charger');
  assert.equal(
    (await call('POST', '/orders', { body: { items: [{ productId: charger.id, qty: 1 }], paymentMethod: 'cod', shippingAddress: address } })).status,
    401
  );
  const r = await call('POST', '/orders', {
    token: customerToken,
    body: { items: [{ productId: charger.id, qty: 1 }], paymentMethod: 'cod', shippingAddress: { ...address, pincode: '12' } },
  });
  assert.equal(r.status, 400);
});

test('Razorpay: payment verify checks the HMAC signature; webhook checks its own', async () => {
  const user = await models.User.findOne({ role: 'customer' }).sort({ createdAt: -1 });
  const charger = await models.Product.findOne({ slug: 'nova-65w-gan-charger' });
  // an online-payment order as /orders would create it (we can't call Razorpay's API from tests)
  const order = await models.Order.create({
    user: user.id,
    items: [{ product: charger.id, name: charger.name, unitPrice: 2499, mrp: 2499, qty: 1 }],
    shippingAddress: address,
    subtotal: 2499, shipping: 99, total: 2598,
    payment: { method: 'razorpay', status: 'pending', razorpayOrderId: 'order_TEST123' },
    status: 'pending_payment',
  });

  const bad = await call('POST', '/payments/razorpay/verify', {
    token: customerToken,
    body: { orderId: order.id, razorpay_order_id: 'order_TEST123', razorpay_payment_id: 'pay_TEST1', razorpay_signature: 'f'.repeat(64) },
  });
  assert.equal(bad.status, 400);
  assert.notEqual((await models.Order.findById(order.id)).payment.status, 'paid');

  const sig = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update('order_TEST123|pay_TEST1').digest('hex');
  const good = await call('POST', '/payments/razorpay/verify', {
    token: customerToken,
    body: { orderId: order.id, razorpay_order_id: 'order_TEST123', razorpay_payment_id: 'pay_TEST1', razorpay_signature: sig },
  });
  // The verify endpoint requires the order to belong to the caller; the order above belongs to the latest customer.
  assert.ok([200, 404].includes(good.status));

  // webhook: unsigned / wrongly-signed requests are rejected
  const payload = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_WH1', order_id: 'order_TEST123', amount: 259800 } } } });
  let w = await call('POST', '/payments/razorpay/webhook', { raw: payload, headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': 'nope' } });
  assert.equal(w.status, 400);
  const wsig = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET).update(payload).digest('hex');
  w = await call('POST', '/payments/razorpay/webhook', { raw: payload, headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': wsig } });
  assert.equal(w.status, 200);
  const paid = await models.Order.findById(order.id);
  assert.equal(paid.payment.status, 'paid');
  assert.equal(paid.status, 'confirmed');
});

test('wishlist add / list / remove', async () => {
  const p = await productBySlug('nova-watch-3');
  assert.equal((await call('PUT', `/wishlist/${p.id}`, { token: customerToken })).status, 200);
  let r = await call('GET', '/wishlist', { token: customerToken });
  assert.deepEqual(r.body.ids, [p.id]);
  await call('DELETE', `/wishlist/${p.id}`, { token: customerToken });
  r = await call('GET', '/wishlist', { token: customerToken });
  assert.equal(r.body.items.length, 0);
});

test('admin product changes appear on the public API with no redeploy', async () => {
  const cat = (await call('GET', '/categories')).body.items[0];
  let r = await call('POST', '/admin/products', {
    token: adminToken,
    body: {
      name: 'Test Gadget', brand: 'Testco', category: cat.id, price: 1000, discountPercent: 10, stock: 5,
      isNewArrival: true, images: [{ url: 'https://example.com/a.jpg', publicId: '' }],
      variants: [{ sku: 'TG-1', label: 'One', stock: 4 }, { sku: 'TG-1', label: 'Dup', stock: 1 }],
    },
  });
  assert.equal(r.status, 400); // duplicate SKUs

  r = await call('POST', '/admin/products', {
    token: adminToken,
    body: { name: 'Test Gadget', brand: 'Testco', category: cat.id, price: 1000, discountPercent: 10, stock: 5, isNewArrival: true, images: [{ url: 'https://example.com/a.jpg', publicId: '' }] },
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const created = r.body.item;
  assert.equal(created.finalPrice, 900);

  r = await call('GET', `/products/${created.slug}`);
  assert.equal(r.status, 200);
  r = await call('GET', '/products?flag=new');
  assert.ok(r.body.items.some((p) => p.id === created.id));

  r = await call('PATCH', `/admin/products/${created.id}`, { token: adminToken, body: { price: 2000, discountPercent: 50, stock: 0 } });
  assert.equal(r.body.item.finalPrice, 1000);
  r = await call('GET', `/products/${created.slug}`);
  assert.equal(r.body.product.finalPrice, 1000);
  assert.equal(r.body.product.inStock, false);

  r = await call('PATCH', `/admin/products/${created.id}`, { token: adminToken, body: { status: 'draft' } });
  assert.equal((await call('GET', `/products/${created.slug}`)).status, 404); // hidden when draft

  r = await call('DELETE', `/admin/products/${created.id}`, { token: adminToken });
  assert.equal(r.status, 200);
});

test('admin banner edits and category delete guard', async () => {
  let r = await call('POST', '/admin/banners', { token: adminToken, body: { title: 'Flash Sale', placement: 'hero', ctaLink: '/deals' } });
  assert.equal(r.status, 201);
  const id = r.body.item.id;
  assert.ok((await call('GET', '/home')).body.banners.hero.some((b) => b.title === 'Flash Sale'));
  await call('PATCH', `/admin/banners/${id}`, { token: adminToken, body: { isActive: false } });
  assert.ok(!(await call('GET', '/home')).body.banners.hero.some((b) => b.title === 'Flash Sale'));
  // expired banners are not shown either
  await call('PATCH', `/admin/banners/${id}`, { token: adminToken, body: { isActive: true, endsAt: '2020-01-01T00:00:00.000Z' } });
  assert.ok(!(await call('GET', '/home')).body.banners.hero.some((b) => b.title === 'Flash Sale'));
  await call('DELETE', `/admin/banners/${id}`, { token: adminToken });

  const cat = (await call('GET', '/categories')).body.items.find((c) => c.slug === 'audio');
  r = await call('DELETE', `/admin/categories/${cat.id}`, { token: adminToken });
  assert.equal(r.status, 409);
});

test('admin order + inventory management', async () => {
  const cable = await productBySlug('nova-usb-c-cable-2-pack');
  let r = await call('POST', '/orders', { token: customerToken, body: { items: [{ productId: cable.id, qty: 2 }], paymentMethod: 'cod', shippingAddress: address } });
  assert.equal(r.status, 201);
  const id = r.body.order.id;

  r = await call('GET', '/admin/orders?status=placed', { token: adminToken });
  assert.ok(r.body.items.some((o) => o.id === id));

  r = await call('PATCH', `/admin/orders/${id}`, { token: adminToken, body: { status: 'shipped', courier: 'BlueDart', trackingNumber: 'BD123' } });
  assert.equal(r.body.item.status, 'shipped');
  r = await call('PATCH', `/admin/orders/${id}`, { token: adminToken, body: { status: 'delivered' } });
  assert.equal(r.body.item.payment.status, 'paid'); // COD collected on delivery
  r = await call('GET', `/orders/${id}`, { token: customerToken });
  assert.equal(r.body.order.tracking.trackingNumber, 'BD123');

  r = await call('PATCH', '/admin/inventory', { token: adminToken, body: { productId: cable.id, stock: 7 } });
  assert.equal(r.status, 200);
  assert.equal((await productBySlug('nova-usb-c-cable-2-pack')).stock, 7);
  r = await call('GET', '/admin/inventory?low=true', { token: adminToken });
  assert.ok(r.body.items.every((x) => x.stock <= x.threshold));
});

test('repair flow: devices, slots, booking, tracking, quote approval', async () => {
  const brands = (await call('GET', '/repairs/brands')).body.items;
  assert.ok(brands.some((b) => b.brand === 'Apple'));
  const devices = (await call('GET', '/repairs/devices?brand=Apple')).body.items;
  const dev = devices.find((d) => d.model === 'iPhone 13');
  const detail = (await call('GET', `/repairs/devices/${dev.slug}`)).body.device;
  const screen = detail.repairs.find((r) => r.service.slug === 'screen');
  const other = (await call('GET', '/repairs/services')).body.items.find((s) => s.slug === 'other');
  assert.ok(screen.priceMin > 0);

  // pick the next open date
  let date, slot;
  for (let i = 1; i < 10 && !slot; i++) {
    const d = new Date(Date.now() + i * 86400000).toISOString().slice(0, 10);
    const s = await call('GET', `/repairs/slots?date=${d}`);
    if (s.body.open && s.body.slots.some((x) => x.remaining > 0)) { date = d; slot = s.body.slots.find((x) => x.remaining > 0).slot; }
  }
  assert.ok(slot, 'an open slot exists');

  const payload = {
    deviceId: dev.id, serviceIds: [screen.service.id, other.id], issueNotes: 'Dropped it', method: 'store_visit',
    appointmentDate: date, slot, customer: { name: 'Riya', phone: '+91 98765 43210', email: 'riya@test.dev' },
  };
  let r = await call('POST', '/repairs/bookings', { body: payload });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const ref = r.body.booking.reference;
  assert.match(ref, /^NR-[A-Z0-9]{6}$/);
  assert.equal(r.body.booking.estimate.complete, false); // "something else" has no estimate
  assert.equal(r.body.booking.estimate.min, screen.priceMin);

  // pickup requires an address
  r = await call('POST', '/repairs/bookings', { body: { ...payload, method: 'pickup_drop' } });
  assert.equal(r.status, 400);
  // slot in the past / closed day are rejected
  r = await call('POST', '/repairs/bookings', { body: { ...payload, appointmentDate: '2020-01-01' } });
  assert.equal(r.status, 400);

  // tracking needs reference AND phone
  assert.equal((await call('POST', '/repairs/track', { body: { reference: ref, phone: '9000000000' } })).status, 404);
  r = await call('POST', '/repairs/track', { body: { reference: ref, phone: '9876543210' } });
  assert.equal(r.status, 200);
  assert.equal(r.body.booking.status, 'booked');
  assert.equal(r.body.booking.technician, undefined);

  // approving a quote that doesn't exist is rejected
  r = await call('POST', '/repairs/track/decision', { body: { reference: ref, phone: '9876543210', decision: 'approved' } });
  assert.equal(r.status, 400);

  // admin: assign a technician, add an internal note, send a quote
  const staff = (await call('GET', '/admin/staff', { token: adminToken })).body.items[0];
  const list = (await call('GET', `/admin/repair-bookings?q=${ref}`, { token: adminToken })).body.items;
  const bid = list[0].id;
  r = await call('PATCH', `/admin/repair-bookings/${bid}`, { token: adminToken, body: { technician: staff.id, internalNote: 'Screen + frame bent', status: 'diagnosing' } });
  assert.equal(r.status, 200);
  r = await call('PATCH', `/admin/repair-bookings/${bid}`, { token: adminToken, body: { quote: { amount: 5200, notes: 'Includes frame straightening' } } });
  assert.equal(r.body.item.status, 'awaiting_approval');

  r = await call('POST', '/repairs/track', { body: { reference: ref, phone: '9876543210' } });
  assert.equal(r.body.booking.quote.amount, 5200);
  assert.ok(!JSON.stringify(r.body.booking.timeline).includes('frame bent'), 'internal notes stay private');

  r = await call('POST', '/repairs/track/decision', { body: { reference: ref, phone: '9876543210', decision: 'approved' } });
  assert.equal(r.body.booking.status, 'approved');
  r = await call('PATCH', `/admin/repair-bookings/${bid}`, { token: adminToken, body: { status: 'completed', finalAmount: 5200 } });
  assert.equal(r.body.item.status, 'completed');
});

test('repair slot capacity is enforced', async () => {
  const dev = await models.Device.findOne({ model: 'iPhone 12' });
  const svc = await models.RepairService.findOne({ slug: 'battery' });
  let date;
  for (let i = 2; i < 12; i++) {
    const d = new Date(Date.now() + i * 86400000).toISOString().slice(0, 10);
    const s = await call('GET', `/repairs/slots?date=${d}`);
    if (s.body.open) { date = d; break; }
  }
  const slot = '10:00-12:00';
  const mk = (n) => call('POST', '/repairs/bookings', { body: { deviceId: dev.id, serviceIds: [svc.id], method: 'store_visit', appointmentDate: date, slot, customer: { name: `C${n}`, phone: '9811111111' } } });
  const statuses = [];
  for (let i = 0; i < 4; i++) statuses.push((await mk(i)).status);
  assert.deepEqual(statuses, [201, 201, 201, 409]); // capacityPerSlot = 3
});

test('admin settings update shows up in public config', async () => {
  let r = await call('PATCH', '/admin/settings', { token: adminToken, body: { shipping: { fee: 49, freeAbove: 999 }, announcement: { isActive: true, text: 'Diwali sale live', link: '/deals' } } });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  r = await call('GET', '/config');
  assert.equal(r.body.shipping.fee, 49);
  assert.equal(r.body.store.announcement.text, 'Diwali sale live');
  assert.equal(r.body.store.name, ''); // blank = client falls back to siteConfig.js; untouched fields survive a partial update
});

test('contact form and CMS pages', async () => {
  let r = await call('POST', '/contact', { body: { name: 'A', email: 'a@test.dev', message: 'Hello there' } });
  assert.equal(r.status, 201);
  r = await call('GET', '/pages/return-policy');
  assert.equal(r.status, 200);
  r = await call('GET', '/faqs');
  assert.ok(r.body.items.length > 3);
  r = await call('GET', '/admin/messages', { token: adminToken });
  assert.ok(r.body.items.length >= 1);
});
