import mongoose from "mongoose";

let isConnected = false;

export const connectMongo = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI manquant dans les variables d'environnement");
  }

  if (isConnected) {
    console.log('Mongodb already connected');
    return;
  }

  try {
    const options = {
      useUnifiedTopology: true,
      bufferCommands: false,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 30000,
      maxPoolSize: 50,
      minPoolSize: 10
    };

    await mongoose.connect(process.env.MONGODB_URI, options);
    isConnected = true;
    console.log('Mongodb connected');
  } catch (error) {
    console.error('Mongodb connection error:', error);
    throw error;
  }
};

export default connectMongo;