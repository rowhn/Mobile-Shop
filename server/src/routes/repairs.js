import { Router } from 'express';
import { Device, RepairBooking, RepairService, getSettings } from '../models/index.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler, HttpError, notFound } from '../utils/http.js';
import { addDays, escapeRegex, nowInZone, weekday } from '../utils/helpers.js';
import { bookingCreateSchema, trackDecisionSchema, trackSchema } from '../validators/schemas.js';

const router = Router();

/** Only what a customer should see (no internal notes, no technician details). */
export function publicBooking(b) {
  return {
    reference: b.reference,
    status: b.status,
    deviceLabel: b.deviceLabel,
    services: b.services.map((s) => ({ name: s.name, priceMin: s.priceMin, priceMax: s.priceMax })),
    issueNotes: b.issueNotes,
    method: b.method,
    appointmentDate: b.appointmentDate,
    slot: b.slot,
    estimate: b.estimate,
    quote: b.quote?.amount != null ? { amount: b.quote.amount, notes: b.quote.notes } : null,
    approval: b.approval?.status || 'none',
    finalAmount: b.finalAmount,
    customerName: b.customer.name,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    timeline: b.timeline.filter((t) => !t.internal).map((t) => ({ status: t.status, note: t.note, at: t.at })),
  };
}

/* ---------- catalogue ---------- */
router.get(
  '/brands',
  asyncHandler(async (_req, res) => {
    const rows = await Device.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$brand', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    res.json({ items: rows.map((r) => ({ brand: r._id, count: r.count })) });
  })
);

router.get(
  '/devices',
  asyncHandler(async (req, res) => {
    const filter = { isActive: true };
    if (typeof req.query.brand === 'string' && req.query.brand) filter.brand = req.query.brand;
    if (typeof req.query.q === 'string' && req.query.q.trim()) {
      const rx = new RegExp(escapeRegex(req.query.q.trim().slice(0, 60)), 'i');
      filter.$or = [{ model: rx }, { brand: rx }];
    }
    const items = await Device.find(filter).select('-repairs').sort({ brand: 1, model: 1 }).limit(300);
    res.json({ items });
  })
);

router.get(
  '/devices/:slug',
  asyncHandler(async (req, res) => {
    const device = await Device.findOne({ slug: req.params.slug, isActive: true }).populate('repairs.service');
    if (!device) throw notFound('Device');
    res.json({ device });
  })
);

router.get(
  '/services',
  asyncHandler(async (_req, res) => {
    res.json({ items: await RepairService.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }) });
  })
);

/* ---------- availability ---------- */
async function slotAvailability(settings, date) {
  const { date: today, time } = nowInZone(settings.repair.timezone);
  const last = addDays(today, settings.repair.advanceDays);
  if (date < today || date > last) return { open: false, reason: 'out_of_range', slots: [] };
  if (settings.repair.weeklyOff.includes(weekday(date))) return { open: false, reason: 'closed', slots: [] };

  const counts = await RepairBooking.aggregate([
    { $match: { appointmentDate: date, status: { $nin: ['cancelled', 'declined'] }, method: { $ne: 'courier' } } },
    { $group: { _id: '$slot', n: { $sum: 1 } } },
  ]);
  const used = new Map(counts.map((c) => [c._id, c.n]));
  const slots = settings.repair.slots
    .filter((s) => date > today || s.split('-')[0] > time) // hide slots that already started today
    .map((slot) => ({ slot, remaining: Math.max(0, settings.repair.capacityPerSlot - (used.get(slot) || 0)) }));
  return { open: true, slots };
}

router.get(
  '/slots',
  asyncHandler(async (req, res) => {
    const date = String(req.query.date || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new HttpError(400, 'Provide a date as YYYY-MM-DD.');
    const settings = await getSettings();
    res.json({ date, ...(await slotAvailability(settings, date)) });
  })
);

/* ---------- booking ---------- */
router.post(
  '/bookings',
  optionalAuth,
  validate(bookingCreateSchema),
  asyncHandler(async (req, res) => {
    const body = req.body;
    const settings = await getSettings();

    const methodCfg = settings.repair.methods[body.method];
    if (!methodCfg?.enabled) throw new HttpError(400, 'That service method is not available.');

    const device = await Device.findOne({ _id: body.deviceId, isActive: true });
    if (!device) throw new HttpError(400, 'We do not support that device yet.');

    const uniqueServiceIds = [...new Set(body.serviceIds)];
    const services = await RepairService.find({ _id: { $in: uniqueServiceIds }, isActive: true });
    if (services.length !== uniqueServiceIds.length) throw new HttpError(400, 'One of the selected issues is not available.');

    // Estimates come from the device's price list, never from the client.
    let min = 0;
    let max = 0;
    let complete = true;
    const lines = services.map((svc) => {
      const row = device.repairs.find((r) => String(r.service) === svc.id);
      if (row) {
        min += row.priceMin;
        max += row.priceMax;
      } else complete = false;
      return {
        service: svc._id,
        name: svc.name,
        priceMin: row ? row.priceMin : null,
        priceMax: row ? row.priceMax : null,
      };
    });

    if (body.method !== 'courier') {
      const availability = await slotAvailability(settings, body.appointmentDate);
      if (!availability.open) throw new HttpError(400, 'We are closed on that date. Please pick another day.');
      const slot = availability.slots.find((s) => s.slot === body.slot);
      if (!slot) throw new HttpError(400, 'That time slot is not available.');
      if (slot.remaining <= 0) throw new HttpError(409, 'That slot has just filled up. Please choose another.');
    }

    const booking = await RepairBooking.create({
      user: req.user?.id || null,
      customer: { name: body.customer.name, phone: body.customer.phone, email: body.customer.email || req.user?.email || '' },
      device: device._id,
      deviceLabel: `${device.brand} ${device.model}`,
      services: lines,
      issueNotes: body.issueNotes,
      method: body.method,
      appointmentDate: body.method === 'courier' ? '' : body.appointmentDate,
      slot: body.method === 'courier' ? '' : body.slot,
      address: body.method === 'pickup_drop' ? body.address : undefined,
      estimate: { min, max, complete },
      timeline: [{ status: 'booked', note: 'Booking received' }],
    });

    res.status(201).json({ booking: publicBooking(booking) });
  })
);

router.get(
  '/mine',
  requireAuth,
  asyncHandler(async (req, res) => {
    const items = await RepairBooking.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(50);
    res.json({ items: items.map(publicBooking) });
  })
);

/* ---------- tracking (reference + phone, so references can't be guessed) ---------- */
async function findForTracking({ reference, phone }) {
  const booking = await RepairBooking.findOne({ reference, 'customer.phone': phone });
  if (!booking) throw new HttpError(404, 'No booking found. Check the reference and the phone number used while booking.');
  return booking;
}

router.post(
  '/track',
  validate(trackSchema),
  asyncHandler(async (req, res) => {
    res.json({ booking: publicBooking(await findForTracking(req.body)) });
  })
);

router.post(
  '/track/decision',
  validate(trackDecisionSchema),
  asyncHandler(async (req, res) => {
    const booking = await findForTracking(req.body);
    if (booking.status !== 'awaiting_approval' || booking.approval.status !== 'pending')
      throw new HttpError(400, 'There is no quote waiting for your approval.');
    const approved = req.body.decision === 'approved';
    booking.approval = { status: req.body.decision, decidedAt: new Date() };
    booking.status = approved ? 'approved' : 'declined';
    booking.timeline.push({
      status: booking.status,
      note: approved ? 'Customer approved the quote' : 'Customer declined the quote',
    });
    await booking.save();
    res.json({ booking: publicBooking(booking) });
  })
);

router.post(
  '/track/cancel',
  validate(trackSchema),
  asyncHandler(async (req, res) => {
    const booking = await findForTracking(req.body);
    if (booking.status !== 'booked') throw new HttpError(400, 'This booking is already in progress. Please contact us to cancel.');
    booking.status = 'cancelled';
    booking.timeline.push({ status: 'cancelled', note: 'Cancelled by customer' });
    await booking.save();
    res.json({ booking: publicBooking(booking) });
  })
);

export default router;
