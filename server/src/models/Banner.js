import '../config/mongoosePlugin.js';
import mongoose from 'mongoose';

const { Schema } = mongoose;

const bannerSchema = new Schema(
  {
    eyebrow: { type: String, default: '', trim: true, maxlength: 60 },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    subtitle: { type: String, default: '', trim: true, maxlength: 300 },
    image: { type: String, default: '' },
    imagePublicId: { type: String, default: '' },
    ctaLabel: { type: String, default: '', trim: true, maxlength: 40 },
    ctaLink: { type: String, default: '', trim: true, maxlength: 300 },
    // hero = homepage carousel, promo = side/mid-page promo cards, strip = thin campaign strip
    placement: { type: String, enum: ['hero', 'promo', 'strip'], default: 'hero', index: true },
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Banner = mongoose.models.Banner || mongoose.model('Banner', bannerSchema);
