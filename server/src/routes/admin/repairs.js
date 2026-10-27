import { Router } from 'express';
import { RepairBooking, User } from '../../models/index.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler, HttpError, notFound } from '../../utils/http.js';
import { escapeRegex, normalizePhone } from '../../utils/helpers.js';
import { bookingAdminUpdateSchema } from '../../validators/schemas.js';

const router = Router();

router.param('id', (_req, _res, next, id) =>
  /^[a-f\d]{24}$/i.test(id) ? next() : next(new HttpError(400, 'Invalid id'))
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const filter = {};
    if (typeof req.query.status === 'string' && req.query.status) filter.status = req.query.status;
    if (typeof req.query.technician === 'string' && /^[a-f\d]{24}$/i.test(req.query.technician)) filter.technician = req.query.technician;
    if (typeof req.query.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date)) filter.appointmentDate = req.query.date;
    if (typeof req.query.q === 'string' && req.query.q.trim()) {
      const q = req.query.q.trim().slice(0, 60);
      const rx = new RegExp(escapeRegex(q), 'i');
      const phone = normalizePhone(q);
      filter.$or = [
        { reference: rx },
        { deviceLabel: rx },
        { 'customer.name': rx },
        ...(phone.length >= 4 ? [{ 'customer.phone': new RegExp(escapeRegex(phone)) }] : []),
      ];
    }
    const [items, total] = await Promise.all([
      RepairBooking.find(filter)
        .populate('technician', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      RepairBooking.countDocuments(filter),
    ]);
    res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const item = await RepairBooking.findById(req.params.id).populate('technician', 'name email');
    if (!item) throw notFound('Booking');
    res.json({ item });
  })
);

router.patch(
  '/:id',
  validate(bookingAdminUpdateSchema),
  asyncHandler(async (req, res) => {
    const booking = await RepairBooking.findById(req.params.id);
    if (!booking) throw notFound('Booking');
    const { status, technician, quote, finalAmount, publicNote, internalNote, appointmentDate, slot } = req.body;
    const by = req.user.id;

    if (technician !== undefined) {
      if (technician) {
        const tech = await User.findOne({ _id: technician, role: { $in: ['staff', 'admin'] }, isActive: true });
        if (!tech) throw new HttpError(400, 'Technician must be an active staff member.');
        booking.technician = tech._id;
        booking.timeline.push({ status: booking.status, note: `Assigned to ${tech.name}`, internal: true, by });
      } else booking.technician = null;
    }

    if (appointmentDate) booking.appointmentDate = appointmentDate;
    if (slot !== undefined) booking.slot = slot;
    if (finalAmount !== undefined) booking.finalAmount = finalAmount;

    let nextStatus = status;
    if (quote) {
      booking.quote = { amount: quote.amount, notes: quote.notes, quotedAt: new Date() };
      // Sending a quote asks the customer to approve it.
      booking.approval = { status: 'pending' };
      if (!nextStatus) nextStatus = 'awaiting_approval';
    }

    if (nextStatus && nextStatus !== booking.status) {
      booking.status = nextStatus;
      if (nextStatus === 'awaiting_approval' && booking.approval.status !== 'pending') booking.approval = { status: 'pending' };
      if (nextStatus === 'approved' && booking.approval.status !== 'approved') booking.approval = { status: 'approved', decidedAt: new Date() };
      if (nextStatus === 'declined') booking.approval = { status: 'declined', decidedAt: new Date() };
      booking.timeline.push({ status: nextStatus, note: publicNote || (quote ? `Quote sent: ₹${quote.amount}` : ''), by });
    } else if (publicNote) {
      booking.timeline.push({ status: booking.status, note: publicNote, by });
    }
    if (internalNote) booking.timeline.push({ status: booking.status, note: internalNote, internal: true, by });

    await booking.save();
    res.json({ item: await booking.populate('technician', 'name email') });
  })
);

export default router;
