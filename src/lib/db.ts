import connectMongo from "./mongoose";

export const executeWithRetry = async <T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await connectMongo();
      return await operation();
    } catch (error: any) {
      if (attempt === maxRetries) throw error;
      
      if (error.name === 'MongoServerSelectionError' || 
          error.message.includes('buffering timed out') ||
          error.message.includes('connection timed out')) {
        console.warn(`Tentative ${attempt}/${maxRetries} échouée, nouvelle tentative dans ${attempt} seconde(s)...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Échec après le nombre maximum de tentatives');
};
