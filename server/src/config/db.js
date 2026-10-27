import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.set('strictQuery', true);

export async function connectDB() {
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10000 });
  console.log(`MongoDB connected (${mongoose.connection.name})`);
}
