import '../config/mongoosePlugin.js';
import mongoose from 'mongoose';

const { Schema } = mongoose;

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: '', maxlength: 400 },
    image: {
      type: new Schema({ url: String, publicId: { type: String, default: '' } }, { _id: false }),
      default: null,
    },
    icon: { type: String, default: 'box', trim: true, maxlength: 30 },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    showOnHome: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);
