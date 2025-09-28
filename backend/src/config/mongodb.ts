// backend/src/config/mongodb.ts
import mongoose from 'mongoose';

let isConnected = false;

export const connectMongoDB = async () => {
  if (isConnected) {
    console.log('MongoDB already connected');
    return mongoose.connection;
  }

  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://root:root123@etl_mongodb:27017/streaming_nosql?authSource=admin';
    
    console.log('Connecting to MongoDB...');
    
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    isConnected = true;
    console.log('MongoDB connected successfully to:', conn.connection.host);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
    });

    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    isConnected = false;
    throw error;
  }
};

export const disconnectMongoDB = async () => {
  if (!isConnected) {
    return;
  }
  
  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('MongoDB disconnect error:', error);
  }
};