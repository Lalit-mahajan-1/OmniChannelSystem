import mongoose from 'mongoose';

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return mongoose.connection;

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is missing in .env');
  }

  await mongoose.connect(mongoUri, {
    dbName: process.env.MONGO_DB_NAME || undefined,
  });

  isConnected = true;
  console.log('[DB] MongoDB connected');
  return mongoose.connection;
};

export default connectDB;