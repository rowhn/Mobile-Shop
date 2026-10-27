# Pranay Mobiles: Mobile Store + Repair Website (MERN)

A multi-page, Apple-inspired electronics store with an integrated phone-repair booking system and an admin dashboard.
Built for **Pranay Mobiles, Bank Of India Rd, Ghugus Basti, Ghugus, Maharashtra 442505**. Shop details live in one file (section 1A).

* **Frontend:** React 18, Vite, Bootstrap 5 (+ one CSS file per component/page), React Router, Motion for React
* **Backend:** Node 20+, Express, REST, Zod validation
* **Database:** MongoDB (Atlas) via Mongoose
* **Images:** Cloudinary · **Payments:** Razorpay (UPI / cards / net banking / wallets), plus optional Cash on Delivery

Everything the shopper sees (products, prices, banners, categories, FAQs, policies, contact details, repair devices and prices) is read from MongoDB through the API. Edit it in the admin dashboard and the live site updates immediately, with no code change or redeploy.

---

## 1. Project structure

```
nova-store/
├── README.md
├── server/                         Express API
│   ├── .env.example                ← all server settings, documented
│   ├── src/
│   │   ├── index.js                server start + unpaid-order expiry job
│   │   ├── app.js                  middleware, rate limits, route mounting
│   │   ├── config/                 env, db, cloudinary, mongoose JSON plugin
│   │   ├── middleware/             auth (JWT + roles), validate (Zod), error handler
│   │   ├── models/                 User, Product, Category, Banner, Coupon, Order,
│   │   │                           Repair (RepairService, Device, RepairBooking), Settings, Content
│   │   ├── validators/schemas.js   every request body/query is validated here
│   │   ├── services/               pricing (server-side), stock (atomic), razorpay
│   │   ├── routes/                 auth, products, storefront, cartOrders, repairs, webhook
│   │   │   └── admin/              protected admin + staff APIs
│   │   └── seed/                   demo data + seed script
│   └── test/api.test.js            integration tests
└── client/                         React app (Vercel)
    ├── .env.example
    ├── vercel.json                 SPA rewrite + asset caching
    └── src/
        ├── App.jsx, main.jsx       all page URLs / providers
        ├── config/siteConfig.js    ★ SHOP DETAILS: name, phone, address, socials, WhatsApp text, marquee
        ├── styles/theme.css        colours, fonts, rounding (Bootstrap overrides)
        ├── layout/                 Navbar, Footer, MarqueeBanner, WhatsAppButton, ShopInfo, SocialLinks,
        │                           CartDrawer, SearchBox, AnnouncementBar, SiteLayout  (each with its .css)
        ├── components/             ProductCard, QtyStepper, Icon, ui/ (Button, Form, Modal, Badge…)
        ├── pages/                  one folder per page: Home, Shop, ProductDetail, Cart, Checkout,
        │                           Wishlist, Auth, Account, Repair, Info (contact, FAQ, policies…)
        ├── context/                Auth, Cart, Wishlist, Config, Toast
        └── admin/                  lazy-loaded dashboard: AdminLayout, components/, pages/
```

### 1A. How to change things (no coding needed)
| I want to change… | Edit this |
|---|---|
| Shop name, phone, WhatsApp number, address, hours, **social links**, WhatsApp pre-written message, scrolling banner text/speed, Google Maps link | `client/src/config/siteConfig.js` |
| Menu links | `NAV_LINKS` at top of `client/src/layout/Navbar.jsx` |
| Footer link columns | `COLUMNS` at top of `client/src/layout/Footer.jsx` |
| Colours / fonts | `client/src/styles/theme.css` |
| Homepage section order | `return (...)` in `client/src/pages/Home/Home.jsx` |
| Look of any one component/page | the `.css` file sitting next to it |
| Slides, promo tiles, products, prices | Admin dashboard (no code) |

To add a social link: open `siteConfig.js`, paste the URL between the quotes of `facebook`, `youtube`, `x`, `telegram` or `justdial`. Empty ones stay hidden. Values typed in *Admin → Settings* override this file; leave them blank to use the file.
The floating WhatsApp button opens `wa.me/919623946928` with your pre-written text; **Navigate me** opens Google Maps directions to the address.

## 2. Local setup

**Requirements:** Node 20+, a MongoDB database (free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster, or local MongoDB).

```bash
# 1. API
cd server
cp .env.example .env          # then edit .env (see section 3)
npm install
npm run seed                  # demo catalogue + repair price lists + first admin user
npm run dev                   # http://localhost:5000

# 2. Website (new terminal)
cd client
cp .env.example .env          # leave VITE_API_URL empty locally
npm install
npm run dev                   # http://localhost:5173  (proxies /api to :5000)
```

The minimum `.env` to run locally is `MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Everything else is optional.
Generate a secret with: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

Sign in at `/login` with the admin email and password from your `.env` and you'll be taken to the dashboard (`/admin`).
`npm run seed` is safe to re-run (it skips collections that already have data). `npm run seed:reset` rebuilds the catalogue, banners, coupons, repair lists, FAQs, pages and settings, and keeps users, orders and repair bookings.

**Demo coupons:** `WELCOME10` (10% off, max ₹1,500, once per customer) and `FLAT500` (₹500 off above ₹15,000).
**All demo data is placeholder:** fictional brands, illustrative prices and repair estimates, and no product photos. Replace them from the dashboard.

## 3. Credentials: what to configure and how

Nothing is faked. If a credential is missing, that feature is visibly disabled (and the dashboard's Settings page says so).

### MongoDB Atlas (required)
1. Create a free cluster → **Database Access**: add a user → **Network Access**: allow your server's IP (or `0.0.0.0/0` while testing).
2. **Connect → Drivers**: copy the string into `MONGODB_URI` (include the database name, e.g. `/nova`).

### Cloudinary (image uploads)
1. Create a free account at cloudinary.com → Dashboard shows *Cloud name*, *API key*, *API secret*.
2. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` on the server.
3. Without these, upload buttons are disabled and admins can paste image URLs instead.

### Razorpay (online payments)
1. Create an account at razorpay.com and use **Test Mode** first: *Settings → API Keys → Generate Test Key*.
2. Set `RAZORPAY_KEY_ID` (`rzp_test_…`) and `RAZORPAY_KEY_SECRET` on the server. The secret is never sent to the browser.
3. **Webhook (recommended; it confirms orders even if a customer closes the tab right after paying):**
   *Settings → Webhooks → Add*: URL `https://<your-api-host>/api/payments/razorpay/webhook`, a secret of your choice (put the same value in `RAZORPAY_WEBHOOK_SECRET`), events `payment.captured`, `order.paid`, `payment.failed`.
4. Test with Razorpay's [test card/UPI details](https://razorpay.com/docs/payments/payments/test-card-details/). Switch to live keys after Razorpay approves your KYC.
5. Without keys, checkout offers only Cash on Delivery (set `ENABLE_COD=false` to disable that too).

**How payments stay secure:** the browser sends only product ids, SKUs and quantities. The server prices the cart from the database, reserves stock atomically, creates the Razorpay order for *its own* total, and only marks an order paid after verifying Razorpay's HMAC signature (or a signed webhook whose amount matches). Unpaid online orders are cancelled and their stock released after `PAYMENT_WINDOW_MINUTES` (default 30). Refunds are issued from the Razorpay dashboard; the order is flagged *Refund pending* to remind you.

## 4. Admin dashboard guide (`/admin`)

| Area | What you can do |
|---|---|
| **Dashboard** | Revenue, orders, open repairs, low-stock alerts, 14-day sales chart |
| **Products** | Add / edit / delete. Upload images, name, description, specs, price, discount %, stock, brand, category, variants (colour/storage with their own SKU, price, stock), flags **New arrival / Featured / On sale**, status Active / Draft / Archived |
| **Inventory** | Fast stock counts, low-stock filter |
| **Categories, Banners & campaigns, Coupons** | Homepage hero slides, promo cards, a text strip, scheduled start/end dates, coupon rules and limits |
| **Orders** | Status, payment status, courier + tracking number, timeline notes |
| **Repair bookings** | Assign a technician, add public/internal notes, send a quote for customer approval, update status |
| **Repair devices & prices** | Supported phone models and the estimate range for every repair type |
| **Repair services** | The issue types customers pick from |
| **Customers & staff** | Promote a user to **staff** (orders + repairs only) or **admin**; disable accounts |
| **Content** | FAQs, About, Contact and all policy pages |
| **Settings** | Brand name, contact details, announcement bar, shipping fee/threshold, repair slots, capacity, closed days, service methods and fees |

Roles: **customer** (shop, account), **staff** (Orders + Repair bookings), **admin** (everything). Roles are enforced on the server.

## 5. Deployment

The frontend (static) goes on **Vercel**. The API needs a **long-running Node host** (Render, Railway, Fly.io or a VPS). It runs a background job that releases stock held by abandoned online payments, so avoid pure-serverless hosting for the API, and on free tiers that sleep, that job pauses until the next request.

### A. Database
Use MongoDB Atlas (section 3). Run `npm run seed` once against the production database (see step C-4).

### B. API on Render (example; Railway/Fly are similar)
1. Push this repo to GitHub → Render → **New Web Service** → pick the repo.
2. **Root directory** `server` · **Build** `npm install` · **Start** `npm start` · **Health check path** `/api/health`.
3. Environment variables: everything from `server/.env.example`, with `NODE_ENV=production`, a **32+ character** `JWT_SECRET`, `MONGODB_URI`, Cloudinary and Razorpay keys, and
   `CLIENT_URL=https://<your-vercel-domain>` (comma-separate extra domains, no trailing slash).
4. Seed once: in Render's **Shell** run `npm run seed` (with `ADMIN_EMAIL` / `ADMIN_PASSWORD` set). It refuses to seed an admin in production without a password.

### C. Frontend on Vercel
1. **Add New Project** → import the repo → **Root Directory** `client` (framework preset: Vite is auto-detected).
2. Environment variable: `VITE_API_URL=https://<your-api-host>/api`
3. Deploy. `client/vercel.json` already handles client-side routing and asset caching.
4. Add the final Vercel/custom-domain URL to the API's `CLIENT_URL` and redeploy the API (CORS).

### D. Go-live checklist
- [ ] Admin password is strong; remove `ADMIN_PASSWORD` from the host once seeded
- [ ] Razorpay live keys + webhook URL configured; place one test order end-to-end
- [ ] Atlas network access restricted to your API host; automated backups enabled
- [ ] Replace placeholder products, photos, policies and contact details (policy text is a starter and **needs your legal review**)
- [ ] Set your shipping fee/threshold, repair slots and closed days in Settings

## 6. Security notes
* Passwords hashed with bcrypt (cost 12); JWT access tokens (invalidated on password change); disabled users are locked out immediately.
* Role checks on every admin/staff route; users cannot assign themselves a role.
* All inputs validated with Zod (unknown fields stripped); Mongo operator injection is prevented because query values are validated into typed values.
* Helmet headers, strict CORS allow-list, request size limits, rate limits on auth, booking, tracking and contact endpoints.
* Repair tracking requires **reference + phone number**, and internal staff notes are never returned to customers.
* Secrets only ever live in server environment variables.

## 7. Tests
```bash
cd server
MONGODB_URI=mongodb://127.0.0.1:27017/nova_test JWT_SECRET=<32+ chars> npm test
```
**Use a throwaway database; the suite re-seeds it.** 21 integration tests cover auth, role protection, catalogue filtering, server-side pricing, coupons, stock reservation (including concurrent buyers), Razorpay signature and webhook verification, admin edits appearing on the public API, and the whole repair flow.

## 8. Known limitations / next steps
* No product photos ship with the project; upload your own (the UI shows clean placeholders until then).
* Emails/SMS/WhatsApp notifications are not included. Customers track status on the site; adding a mail provider (e.g. Resend, SES) is the natural next step.
* Refunds are manual (Razorpay dashboard); there's no returns workflow yet.
* No GST invoice generation; add if you need tax invoices.
#   M o b i l e - S h o p  
 #   M o b i l e - S h o p  
 #   M o b i l e - S h o p  
 