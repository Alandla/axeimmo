import connectMongo from '../lib/mongoose';
import Video from '../models/Video';
import { IVideo } from '../types/video';

export const createVideo = async (videoData: IVideo): Promise<IVideo> => {
  try {
    await connectMongo();
    const video = new Video(videoData);
    const savedVideo = await video.save();
    return savedVideo.toJSON();
  } catch (error: any) {
    throw new Error(`Erreur lors de la création de la vidéo: ${error.message}`);
  }
};
