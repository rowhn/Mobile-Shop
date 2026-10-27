import '../config/mongoosePlugin.js';
import mongoose from 'mongoose';

const { Schema } = mongoose;

const imageSchema = new Schema(
  { url: { type: String, required: true }, publicId: { type: String, default: '' } },
  { _id: false }
);

const optionSchema = new Schema(
  { name: { type: String, required: true, trim: true }, value: { type: String, required: true, trim: true } },
  { _id: false }
);

const variantSchema = new Schema(
  {
    sku: { type: String, required: true, trim: true },
    label: { type: String, default: '', trim: true },
    options: { type: [optionSchema], default: [] },
    // Optional MRP override for this variant (e.g. the 512GB model). Falls back to product.price.
    price: { type: Number, min: 0, default: null },
    stock: { type: Number, min: 0, default: 0 },
    image: { type: String, default: '' },
  },
  { _id: false }
);

const specSchema = new Schema(
  {
    group: { type: String, default: '', trim: true },
    key: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true },
    brand: { type: String, required: true, trim: true, index: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    shortDescription: { type: String, default: '', maxlength: 300 },
    description: { type: String, default: '', maxlength: 10000 },
    images: { type: [imageSchema], default: [] },

    // Prices are whole rupees. `price` is the MRP; the discount is applied on top.
    price: { type: Number, required: true, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 90 },
    // Derived on every save (see pre-validate hook) so listings can sort/filter in the database.
    listMrp: { type: Number, default: 0 },
    finalPrice: { type: Number, default: 0, index: true },
    priceVaries: { type: Boolean, default: false },

    stock: { type: Number, default: 0, min: 0 },
    totalStock: { type: Number, default: 0, index: true },
    lowStockThreshold: { type: Number, default: 5, min: 0 },

    specifications: { type: [specSchema], default: [] },
    variants: { type: [variantSchema], default: [] },
    tags: { type: [String], default: [] },
    warranty: { type: String, default: '', maxlength: 200 },

    isNewArrival: { type: Boolean, default: false, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    isOnSale: { type: Boolean, default: false, index: true },
    status: { type: String, enum: ['active', 'draft', 'archived'], default: 'active', index: true },
  },
  { timestamps: true }
);

productSchema.pre('validate', function () {
  const hasVariants = this.variants.length > 0;
  const mrps = hasVariants ? this.variants.map((v) => (v.price != null ? v.price : this.price)) : [this.price];
  const lowest = Math.min(...mrps);
  const highest = Math.max(...mrps);
  const pct = this.discountPercent || 0;
  this.listMrp = lowest;
  this.finalPrice = Math.round(lowest * (1 - pct / 100));
  this.priceVaries = highest !== lowest;
  this.totalStock = hasVariants ? this.variants.reduce((sum, v) => sum + (v.stock || 0), 0) : this.stock || 0;
});

productSchema.virtual('inStock').get(function () {
  return this.totalStock > 0;
});
productSchema.virtual('onSale').get(function () {
  return Boolean(this.isOnSale) || this.discountPercent > 0;
});
productSchema.virtual('lowStock').get(function () {
  return this.totalStock > 0 && this.totalStock <= this.lowStockThreshold;
});

productSchema.index({ status: 1, createdAt: -1 });

export const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
