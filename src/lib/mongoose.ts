import mongoose from "mongoose";

let isConnected = false;

export const connectMongo = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI manquant dans les variables d'environnement");
  }

  // Check if already connected and ready
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('Mongodb already connected');
    return;
  }

  try {
    const options = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 30000,
      maxPoolSize: 50,
      minPoolSize: 10
    };

    await mongoose.connect(process.env.MONGODB_URI, options);
    
    // Wait for the connection to be fully ready
    await new Promise<void>((resolve, reject) => {
      if (mongoose.connection.readyState === 1) {
        resolve();
      } else {
        mongoose.connection.once('open', () => {
          resolve();
        });
        mongoose.connection.once('error', (error) => {
          reject(error);
        });
      }
    });

    isConnected = true;
    console.log('Mongodb connected');
  } catch (error) {
    console.error('Mongodb connection error:', error);
    isConnected = false;
    throw error;
  }
};

export default connectMongo;