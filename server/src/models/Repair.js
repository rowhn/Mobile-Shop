import '../config/mongoosePlugin.js';
import mongoose from 'mongoose';
import { randomCode } from '../utils/helpers.js';

const { Schema } = mongoose;

// A repair "issue type" (Screen replacement, Battery, ...)
const repairServiceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: '', maxlength: 300 },
    icon: { type: String, default: 'wrench', trim: true, maxlength: 30 },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// A supported phone model with its per-service estimates.
const deviceSchema = new Schema(
  {
    brand: { type: String, required: true, trim: true, index: true },
    model: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true },
    image: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    repairs: [
      new Schema(
        {
          service: { type: Schema.Types.ObjectId, ref: 'RepairService', required: true },
          priceMin: { type: Number, required: true, min: 0 },
          priceMax: { type: Number, required: true, min: 0 },
          etaHours: { type: Number, default: 0, min: 0 },
        },
        { _id: false }
      ),
    ],
  },
  { timestamps: true }
);

export const REPAIR_STATUSES = [
  'booked',
  'received',
  'diagnosing',
  'awaiting_approval',
  'approved',
  'in_repair',
  'ready',
  'completed',
  'declined',
  'cancelled',
];

const repairBookingSchema = new Schema(
  {
    reference: { type: String, unique: true, default: () => `NR-${randomCode(6)}` },
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    customer: {
      name: { type: String, required: true, trim: true, maxlength: 100 },
      phone: { type: String, required: true, index: true }, // normalised 10 digits
      email: { type: String, default: '', lowercase: true, trim: true },
    },
    device: { type: Schema.Types.ObjectId, ref: 'Device', required: true },
    deviceLabel: { type: String, required: true },
    services: [
      new Schema(
        {
          service: { type: Schema.Types.ObjectId, ref: 'RepairService' },
          name: String,
          priceMin: { type: Number, default: null },
          priceMax: { type: Number, default: null },
        },
        { _id: false }
      ),
    ],
    issueNotes: { type: String, default: '', maxlength: 1000 },
    method: { type: String, enum: ['store_visit', 'pickup_drop', 'courier'], required: true },
    appointmentDate: { type: String, default: '' }, // YYYY-MM-DD in the store timezone
    slot: { type: String, default: '' },
    address: {
      line1: { type: String, default: '' },
      line2: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
    estimate: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      complete: { type: Boolean, default: false }, // false = at least one issue has no estimate yet
    },
    quote: {
      amount: { type: Number, default: null },
      notes: { type: String, default: '' },
      quotedAt: { type: Date },
    },
    approval: {
      status: { type: String, enum: ['none', 'pending', 'approved', 'declined'], default: 'none' },
      decidedAt: { type: Date },
    },
    finalAmount: { type: Number, default: null },
    status: { type: String, enum: REPAIR_STATUSES, default: 'booked', index: true },
    technician: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    timeline: [
      new Schema(
        {
          status: String,
          note: { type: String, default: '' },
          internal: { type: Boolean, default: false },
          at: { type: Date, default: Date.now },
          by: { type: Schema.Types.ObjectId, ref: 'User' },
        },
        { _id: false }
      ),
    ],
  },
  { timestamps: true }
);

repairBookingSchema.index({ appointmentDate: 1, slot: 1 });

export const RepairService =
  mongoose.models.RepairService || mongoose.model('RepairService', repairServiceSchema);
export const Device = mongoose.models.Device || mongoose.model('Device', deviceSchema);
export const RepairBooking =
  mongoose.models.RepairBooking || mongoose.model('RepairBooking', repairBookingSchema);
