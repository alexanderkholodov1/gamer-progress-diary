import mongoose from 'mongoose';
import { env } from './config/env';

export async function conectarDB() {
  if (!env.MONGODB_URI) throw new Error('Falta la variable de entorno MONGODB_URI.');
  await mongoose.connect(env.MONGODB_URI, { dbName: env.MONGODB_DB, serverSelectionTimeoutMS: 10000 });
}
