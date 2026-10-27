import mongoose from 'mongoose';

// Consistent JSON output for every schema: `id` instead of `_id`, no __v, never leak password hashes.
mongoose.plugin((schema) => {
  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret) => {
      delete ret._id;
      delete ret.passwordHash;
      return ret;
    },
  });
});
