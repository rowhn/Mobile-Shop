import '../config/mongoosePlugin.js';
import mongoose from 'mongoose';

const { Schema } = mongoose;

const couponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 30 },
    description: { type: String, default: '', maxlength: 200 },
    type: { type: String, enum: ['percent', 'flat'], required: true },
    value: { type: Number, required: true, min: 1 },
    minOrder: { type: Number, default: 0, min: 0 },
    maxDiscount: { type: Number, default: 0, min: 0 }, // 0 = no cap (percent coupons)
    usageLimit: { type: Number, default: 0, min: 0 }, // 0 = unlimited
    perUserLimit: { type: Number, default: 0, min: 0 }, // 0 = unlimited
    usedCount: { type: Number, default: 0, min: 0 },
    startsAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);
