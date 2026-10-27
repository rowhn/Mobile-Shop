import '../config/mongoosePlugin.js';
import mongoose from 'mongoose';

const { Schema } = mongoose;

// About / Contact / policies. `body` is plain text with light markup ("## Heading", "- list item").
const pageSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    kind: { type: String, enum: ['info', 'policy'], default: 'info', index: true },
    summary: { type: String, default: '', maxlength: 300 },
    body: { type: String, default: '', maxlength: 30000 },
    sortOrder: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const faqSchema = new Schema(
  {
    question: { type: String, required: true, trim: true, maxlength: 250 },
    answer: { type: String, required: true, trim: true, maxlength: 3000 },
    category: { type: String, default: 'General', trim: true, maxlength: 40 },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const contactMessageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: '' },
    subject: { type: String, default: '', trim: true, maxlength: 150 },
    message: { type: String, required: true, trim: true, maxlength: 3000 },
    status: { type: String, enum: ['new', 'resolved'], default: 'new', index: true },
  },
  { timestamps: true }
);

export const Page = mongoose.models.Page || mongoose.model('Page', pageSchema);
export const Faq = mongoose.models.Faq || mongoose.model('Faq', faqSchema);
export const ContactMessage =
  mongoose.models.ContactMessage || mongoose.model('ContactMessage', contactMessageSchema);
