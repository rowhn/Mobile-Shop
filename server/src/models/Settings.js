import '../config/mongoosePlugin.js';
import mongoose from 'mongoose';

const { Schema } = mongoose;

const method = (label, description, fee) => ({
  enabled: { type: Boolean, default: true },
  label: { type: String, default: label },
  description: { type: String, default: description },
  fee: { type: Number, default: fee, min: 0 },
});

// One document holds all store-wide, admin-editable settings.
const settingsSchema = new Schema(
  {
    key: { type: String, default: 'store', unique: true },
    // Leave blank to use the defaults in client/src/config/siteConfig.js
    storeName: { type: String, default: '' },
    tagline: { type: String, default: '' },
    supportEmail: { type: String, default: '' },
    supportPhone: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    address: { type: String, default: '' },
    hours: { type: String, default: '' },
    social: {
      instagram: { type: String, default: '' },
      facebook: { type: String, default: '' },
      x: { type: String, default: '' },
      youtube: { type: String, default: '' },
    },
    announcement: {
      isActive: { type: Boolean, default: false },
      text: { type: String, default: '' },
      link: { type: String, default: '' },
    },
    shipping: {
      fee: { type: Number, default: 99, min: 0 },
      freeAbove: { type: Number, default: 2999, min: 0 },
    },
    repair: {
      timezone: { type: String, default: 'Asia/Kolkata' },
      slots: { type: [String], default: ['10:00-12:00', '12:00-14:00', '14:00-16:00', '16:00-18:00'] },
      capacityPerSlot: { type: Number, default: 3, min: 1 },
      weeklyOff: { type: [Number], default: [0] }, // 0 = Sunday
      advanceDays: { type: Number, default: 30, min: 1, max: 120 },
      warrantyDays: { type: Number, default: 90, min: 0 },
      methods: {
        store_visit: method('Visit our store', 'Drop your phone at the service counter during the chosen slot.', 0),
        pickup_drop: method('Pickup & drop', 'We collect your phone from your address and bring it back after repair.', 149),
        courier: method('Courier / mail-in', 'Send your phone to us by courier. We share the address after booking.', 0),
      },
    },
  },
  { timestamps: true }
);

export const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);

export async function getSettings() {
  return Settings.findOneAndUpdate(
    { key: 'store' },
    { $setOnInsert: { key: 'store' } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}
