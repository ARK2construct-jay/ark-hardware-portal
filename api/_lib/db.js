import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

// Reuse the connection across serverless invocations (Vercel keeps the module
// cache warm between calls on the same instance). Without this, every request
// would open a brand new connection to Atlas and quickly exhaust the
// connection pool.
let cached = globalThis._arkMongooseCache;
if (!cached) {
  cached = globalThis._arkMongooseCache = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error(
      'MONGODB_URI environment variable is not set. Add it in your Vercel project settings.'
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        dbName: 'hardware_selection',
        bufferCommands: false,
        serverSelectionTimeoutMS: 8000,
      })
      .then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}
