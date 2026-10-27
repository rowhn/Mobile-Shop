import '../config/mongoosePlugin.js';
import mongoose from 'mongoose';
import { randomCode } from '../utils/helpers.js';

const { Schema } = mongoose;

export const ORDER_STATUSES = [
  'pending_payment',
  'placed',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

const itemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    slug: String,
    name: { type: String, required: true },
    brand: String,
    image: { type: String, default: '' },
    sku: { type: String, default: '' },
    variantLabel: { type: String, default: '' },
    unitPrice: { type: Number, required: true },
    mrp: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const addressSnapshot = new Schema(
  {
    name: String,
    phone: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    pincode: String,
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, unique: true, default: () => `NV-${randomCode(8)}` },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [itemSchema], required: true },
    shippingAddress: { type: addressSnapshot, required: true },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    total: { type: Number, required: true },
    couponCode: { type: String, default: '' },
    payment: {
      method: { type: String, enum: ['razorpay', 'cod'], required: true },
      status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refund_pending', 'refunded'],
        default: 'pending',
      },
      razorpayOrderId: { type: String, default: '' },
      razorpayPaymentId: { type: String, default: '' },
      paidAt: { type: Date },
    },
    status: { type: String, enum: ORDER_STATUSES, default: 'placed', index: true },
    tracking: {
      courier: { type: String, default: '' },
      trackingNumber: { type: String, default: '' },
    },
    timeline: [
      new Schema(
        {
          status: String,
          note: { type: String, default: '' },
          at: { type: Date, default: Date.now },
          by: { type: Schema.Types.ObjectId, ref: 'User' },
        },
        { _id: false }
      ),
    ],
    notes: { type: String, default: '', maxlength: 500 },
    stockRestored: { type: Boolean, default: false },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ 'payment.razorpayOrderId': 1 });

export const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
