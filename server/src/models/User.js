import '../config/mongoosePlugin.js';
import mongoose from 'mongoose';

const { Schema } = mongoose;

export const addressSchema = new Schema({
  label: { type: String, default: 'Home', trim: true, maxlength: 30 },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  phone: { type: String, required: true, trim: true },
  line1: { type: String, required: true, trim: true, maxlength: 200 },
  line2: { type: String, default: '', trim: true, maxlength: 200 },
  city: { type: String, required: true, trim: true, maxlength: 80 },
  state: { type: String, required: true, trim: true, maxlength: 80 },
  pincode: { type: String, required: true, trim: true },
  isDefault: { type: Boolean, default: false },
});

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: '', trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['customer', 'staff', 'admin'], default: 'customer', index: true },
    addresses: { type: [addressSchema], default: [] },
    wishlist: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    isActive: { type: Boolean, default: true },
    passwordChangedAt: { type: Date },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model('User', userSchema);
